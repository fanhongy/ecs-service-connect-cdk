from flask import Flask

app = Flask(__name__)

@app.route('/service_c',)
def service_c():
    return 'Service C Response', 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)
