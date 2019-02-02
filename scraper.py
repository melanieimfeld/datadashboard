import requests
from bs4 import BeautifulSoup
import re
import locale, datetime 

def hello():
	return 'Hello, you!'


def scrape(queryKeyword):
	locale.setlocale(locale.LC_ALL, "de_de")
	#queryKeyword = "drogen"
	from_year = "2017"
	to_year = "2019"
	bgerQuery2 = 'https://www.bger.ch/ext/eurospider/live/de/php/clir/http/index.php?lang=de&type=simple_query&query_words='+ queryKeyword +'&lang=de&top_subcollection_clir=bge&from_year='+ from_year + '&to_year=' + to_year
	bgerQuery2 = requests.get(bgerQuery2)
	bgerSoup = BeautifulSoup(bgerQuery2.content, 'html.parser')

	links = bgerSoup.find_all(class_='rank_title')
	linksList = []
	for a in links:
		linksList.append(a.find('a')['href'])
    #print(a)
	#print(linksList[0])
	mBger = requests.get(linksList[0])
	mBger = BeautifulSoup(mBger.content, 'html.parser')
	body = list(mBger.children)[12]

	#ID of mandate
	mID = body.find_all('div', class_="center pagebreak")[0].get_text()[:13]
	#mandID

	#referenced mandates
	#without link
	mRefs = body.find_all(class_="bgeref_err")
	#with link
	mRefsLinked = body.find_all(class_="bgeref_id")

	#date:
	mDate = body.find_all(class_="paraatf")[0].get_text()
	#mDate = parseDate(mDate)
	mDate = parseDate(mDate)

	#links of liked reference mandates
	linksListref = []
	for a in mRefsLinked:
		linksListref.append(a['href'])

	return mID


def parseDate(text):
    pattern = re.compile(r"""
        \d\d?   # one or two digits
        \.?
        \s?      # \s for space - one space after
        [a-z,ä,ö,ü]+  # at least one+ ascii letters (ignore case is use)set of characters that you wish to match / since + means ‘one or more repetitions’
        \s?      # one space after
        \d{4}   # four decimal digits = \d (year)
    """,re.IGNORECASE|re.VERBOSE)
    if (pattern.search(text)!= None):
        #print(pattern.search(text).group(), type(pattern.search(text).group()))
        dateStr = pattern.search(text).group()
        dateStr = dateStr.replace(".", "")
        dateStr = datetime.datetime.strptime(dateStr, "%d %B %Y")
        #dateStr = dateStr.strftime('%m/%d/%Y')
        return dateStr
    else:
        return 0 #make 0 if date can't be found