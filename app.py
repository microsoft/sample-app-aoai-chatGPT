print("=== МОЙ КОД ЗАГРУЖАЕТСЯ ===", flush=True)

from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/health')
def health():
    print("Health check called", flush=True)
    return jsonify({"status": "healthy", "message": "My app is running!"})

@app.route('/')
def index():
    return "My agent app is running!"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)
