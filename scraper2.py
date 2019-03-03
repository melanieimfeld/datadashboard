import sys
import requests
import pandas as pd
from bs4 import BeautifulSoup
import re
import random
import locale, datetime #for stringparsing in german
import json
from collections import Counter
import arrow
locale.setlocale(locale.LC_ALL, "de_de")

word1 = "mord"
wordList = ["mord", "diebstahl"]

def getLinks(queryKeyword):
	#queryKeyword = "drogen"
	from_year = "2017"
	to_year = "2019"
	bgerQuery2 = 'https://www.bger.ch/ext/eurospider/live/de/php/clir/http/index.php?lang=de&type=simple_query&query_words='+ queryKeyword +'&lang=de&top_subcollection_clir=bge&from_year='+ from_year + '&to_year=' + to_year
	bgerQuery2 = requests.get(bgerQuery2)
	bgerSoup = BeautifulSoup(bgerQuery2.content, 'html.parser')

	#scrape all links on first page under that keyword
	links = bgerSoup.find_all(class_='rank_title')
	linksList = []
	for a in links:
		linksList.append(a.find('a')['href'])
    #print(a)
	return linksList

def scrapeLinks(number):
	nodes = []
	edges = []

	for word in wordList:
		linksList = getLinks(word)
	#------------append 1st level----------------
		for i in range(number):
			mandate1 = getDateName(linksList[i], word)
			nodes.append({"id": mandate1[0],"keyword": word, "date":mandate1[1],"level": 1, "canton":mandate1[5], "regeste": mandate1[6], "outDegree": len(mandate1[4])})

		#------------append 2nd level----------------
			linksLevel2 = mandate1[2]
			linksLevel3= []
			counter = 0
			for url in linksLevel2: #level 2
    	#print(i,val)
				mandate2 = getDateName(url, word)
    	#problem: in edges, all ids are appended, in nodes only the ones with dates. 
				if (mandate2[1] != 0 and mandate2[0] not in nodes):
        	#print("jump to next level", mandate2[1])
        	#print("next edgelist", mandate2[3], mandate2[1],mandate2[0])
					oj = {"id": mandate2[0],"keyword": word, "date":mandate2[1], "level": 2, "canton":mandate2[5], "regeste": mandate2[6], "outDegree":len(mandate2[4])}
					nodes.append(oj)
					linksLevel3.append([mandate2[0], mandate2[2]])
        	#print("mandates linked",len(mandate2[4]),"list",mandate2[4], "mandate", mandate2[0])
        	#edges + mandate2[3]
					edges.append({"source": mandate1[0], "target": mandate2[0], "keyword": word})
        	#edges.extend(mandate2[3])

 #        #------------append 3nd level----------------
 #        #linksLevel3= sum(linksLevel3,[])
	# 	for nestedItem in linksLevel3: #iterate through nested item in list. each item contains all sublinks and the source ID
	# 		#print("NEW ITEM", nestedItem[0])
	# 		for url in nestedItem[1]: #for each source iterate through all links
 #        #print("NEW SUBITEM", url)
	# 			mandate3 = getDateName(url, word)
	# 			if (mandate3[1] != 0 and mandate3[0] not in nodes):
 #            #print(mandate3[1] != 0)
	# 				oj = {"id": mandate3[0],"keyword": word, "date":mandate3[1], "level": 3, "outDegree":len(mandate3[4])}
 #            #print(oj)
	# 				nodes.append(oj)
	# 				edges.append({"source": nestedItem[0], "target": mandate3[0]})
	sources = [x['target'] for x in edges]
	sources = Counter(sources)
	sources = list(sources.items())
	print("sources")

	for item2 in nodes:
		sources = list(zip(*sources))
    #print(sources[1][0])
		if item2["id"] in sources[0]:
        #print(sources[1][sources[0].index(item2["id"])], "id",item2["id"])
			item2.update({"inDegree": sources[1][sources[0].index(item2["id"])]})
		else:
			item2.update({"inDegree": 0})

	with open('nodes.json', 'w') as file:
		file.write(json.dumps(nodes, ensure_ascii=False)) # use `json.loads` to do the reverse

	with open('edges.json', 'w') as file:
		file.write(json.dumps(edges)) # use `json.loads` to do the reverse

	print("script finished")


def getDateName(link, query):
    #nodes = []
    r = requests.get(link)
    linkSoup = BeautifulSoup(r.content, 'html.parser')
    body = list(linkSoup.children)[12]
    #ID of mandate
    mID = cleanString(body.find_all('div', class_="center pagebreak")[0].get_text()[:14])
    #print(mID)
    mDate = body.find_all(class_="paraatf")[1].get_text()
    #quickfix, skip all dates that can't be parsed
    mDateParsed = parseDate(mDate)
    mRefs = body.find_all(class_="bgeref_id")
    regeste = body.find("div", {"id" : "regeste"}).get_text()
    #print("regeste", regeste)
    mCanton = parseCanton(body.find_all(class_="paraatf")[0].get_text())
    print("show me the paragraph with the canton", parseCanton(mCanton), regeste)
    mRefsLinks = extractLinks(mRefs)
    mRefsNames = listing(mRefs) #LIST with all str names
    subEdges = getEdges(mRefsNames, mID, query) #LIST with dicts for each connection
    #print(mRefsLinks)
    return mID, mDateParsed, mRefsLinks, subEdges, mRefsNames, mCanton, regeste

def cleanString(string):
	if string[len(string)-1] == 'S':
		string = string[:-1]
	string = string.rstrip()
	string = string[4:]
	return string

def extractLinks(htmlElements):
    array = []
    for a in htmlElements:
        #print(a)
        if a['href'] not in array: #make sure to not add duplicate mandates
            array.append(a['href'])
    return array


def listing(elementlist):
    ar = []
    for item in elementlist:
        if item.get_text() not in ar:
            #print(item.get_text())
            ar.append(item.get_text())
    #print(ar)
    return ar


def getEdges(linkNames, ID, query):
    edgeList = []
    if linkNames: #list has items
        #print("links list is not empty", linkNames)
        for i, val in enumerate(linkNames):
            #print(i)
            val = cleanString(val)
            oj = {"source": ID, "target": val, "keyword": query}
            if oj not in edgeList:
                #print(type(oj), "is in list")
                edgeList.append(oj)
    return edgeList

def parseDate(text):
    pattern = re.compile(r"""
        \d\d?   # one or two digits
        \.?
        \s?      # \s for space - one space after
        [a-z,ä,ö,ü,é,û]+  # at least one+ ascii letters (ignore case is use)set of characters that you wish to match / since + means ‘one or more repetitions’
        \s?      # one space after
        \d{4}   # four decimal digits = \d (year)
    """,re.IGNORECASE|re.VERBOSE)
    #print(pattern.search(text))
    if (pattern.search(text)!= None):
        dateStr = pattern.search(text).group()
        dateStr = dateStr.replace(".", "")
        dateStr = detectLanguage(dateStr)
        return dateStr
    else:
        return 0 #make 0 if date can't be found ig not existent or different language

def parseCanton(string):
    cantons =['bern','luzern','uri','schwyz','obwalden','nidwalden','glarus', 'zug', 'freiburg', 'solothurn','basel-stadt','basel-landschaft','schaffhausen','appenzell',
    'st.gallen','graubünden','aargau','thurgau','tessin','waadt','wallis','neuenburg','genf','jura','zürich',
    'berne','lucerne','obwald','nidwald','glaris','zoug','fribourg','soleure','bâle-ville', 'bâle-campagne','schaffhouse',
    'saint-gall','grisons','argovie','thurgovie','vaud','valais','ticino', 'grigioni']

    pattern = re.compile(r'\b(?:%s)\b' % '|'.join(cantons), re.IGNORECASE)

    if (pattern.search(string) != None):
        return pattern.search(string).group()
    else:
        return "n/a" 

def detectLanguage(string):
	months_de = ["januar", "februar", "märz", "april", "mai","juni","juli", "august", "september", "oktober", "november", "dezember"]
	months_fr = ["janvier", "février", "mars", "avril", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
	months_it = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre"," dicembre"]
	string2 = string.lower().split()
	if any(x in string2 for x in months_de):
		#print("its german", string)
		string = arrow.get(string, 'D MMMM YYYY', locale='de')
        #string.format('YYYY-MMMM-DD')
		string = string.strftime('%Y-%m-%d')
		return string
	elif any(x in string2 for x in months_fr):
		#print("its french", string)
		string = arrow.get(string, 'D MMMM YYYY', locale='fr')
		string = string.strftime('%Y-%m-%d')
        #string.format('YYYY-MMMM-DD')
        #print("french",x)
		return string
	elif any(x in string2 for x in months_it):
		#print("its italian", string)
		string = arrow.get(string, 'D MMMM YYYY', locale='it')
		string = string.strftime('%Y-%m-%d')
        #print("french",x)
		return string
	else:
		string = 0
		print("string not detected")
		return string

scrapeLinks(1)
#links_main