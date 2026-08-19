from flask import Flask, render_template,send_from_directory

app = Flask(__name__)


@app.route('/', methods=['GET'])
def get_home():
    return render_template('index.html')

@app.route("/sw.js")
def service_worker():
    # print(app.root_path)
    return send_from_directory(app.root_path, "sw.js")

if __name__ == '__main__':
    app.run(debug=True,host='0.0.0.0')
