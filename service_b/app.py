from flask import Flask

app = Flask(__name__)

@app.route('/service_b',)
def service_b():
    return 'Service B Response', 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)
