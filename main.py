#import json

from flask import Flask, render_template
#import pandas as pd

app = Flask(__name__)

# @app.route("/")
# def index():
#     df = pd.read_csv('data.csv').drop('Open', axis=1)
#     chart_data = df.to_dict(orient='records')
#     chart_data = json.dumps(chart_data, indent=2)
#     data = {'chart_data': chart_data}
#     return render_template("form.html", data=data)
@app.route('/')
def hello_world():
    return 'Hello, World!'

if __name__ == "__main__":
    app.run(debug=True)

#sources:
#https://medium.freecodecamp.org/how-to-build-a-web-application-using-flask-and-deploy-it-to-the-cloud-3551c985e492
#https://cloud.google.com/appengine/docs/standard/python/getting-started/python-standard-env