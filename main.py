import json
import scraper
import sys

from flask import Flask, render_template, request
import pandas as pd

import requests

app = Flask(__name__)

# @app.route("/")
# # def index():
# #     df = pd.read_csv('data.csv').drop('Open', axis=1)
# #     chart_data = df.to_dict(orient='records')
# #     chart_data = json.dumps(chart_data, indent=2)
# #     data = {'chart_data': chart_data}
# #     return render_template("form.html", data=data)

# #@app.route('/')
# def hello_world():
# 	print("hello")
# 	#test = scraper.scrape()
# 	return render_template('index.html')


@app.route('/hello')
def hello():
    return 'Hello, another World'


@app.route('/',methods = ['POST', 'GET'])
def loadJson():
	with open('./static/nodes.json') as json_data:
		d = json.load(json_data)
		#print(d)
	#d = {"testdata":2}
	return render_template("index.html", d=d)
# def result():
# 	if request.method == 'POST':
# 		query = request.form.to_dict() 
# 		query = query.get('Name') #get keyword user entered
# 		output = scraper.scrape(query) #call scraper
# 		return output
		
#return render_template("result.html",result = result)

if __name__ == "__main__":
	app.run(debug=True)

#sources:
#https://medium.com/@wahyudihandry/how-to-build-web-scraping-using-beautifulsoup-and-flask-part-i-ca38a167c236
#https://medium.freecodecamp.org/how-to-build-a-web-application-using-flask-and-deploy-it-to-the-cloud-3551c985e492
#https://cloud.google.com/appengine/docs/standard/python/getting-started/python-standard-env