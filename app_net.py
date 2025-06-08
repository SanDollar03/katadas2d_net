from flask import Flask, render_template, request, jsonify, send_from_directory
from datetime import datetime
import os
import json
import threading
import webbrowser

app = Flask(__name__)

# 相対パス（このapp_net.pyと同じ階層にあるdata, logs, imagesを参照）
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
LOG_DIR = os.path.join(BASE_DIR, 'logs')
IMAGE_DIR = os.path.join(BASE_DIR, 'images')

def initialize():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(LOG_DIR, exist_ok=True)
    os.makedirs(IMAGE_DIR, exist_ok=True)

def load_json(filename):
    path = os.path.join(DATA_DIR, filename)
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[JSON読み込みエラー] {filename}: {e}")
        return []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_products')
def get_products():
    return jsonify(load_json('products.json'))

@app.route('/get_issues')
def get_issues():
    return jsonify(load_json('issues.json'))

@app.route('/get_save_path')
def get_save_path():
    return jsonify({ "path": LOG_DIR })

@app.route('/images/<path:filename>')
def get_image(filename):
    return send_from_directory(IMAGE_DIR, filename)

@app.route('/save_csv', methods=['POST'])
def save_csv():
    try:
        data = request.data.decode('utf-8')
        timestamp = request.args.get('timestamp')
        if not timestamp:
            return 'Missing timestamp', 400

        filename = f"log_{timestamp}.csv"
        full_path = os.path.join(LOG_DIR, filename)

        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(data)

        print(f"[CSV保存完了] {full_path}")
        return '', 200
    except Exception as e:
        print(f"[CSV保存エラー] {e}")
        return 'CSV保存に失敗しました', 500

# 他PCからアクセスする場合は 0.0.0.0 で待ち受け
if __name__ == '__main__':
    initialize()
    print("別PCからアクセスするにはこのPCのIPアドレスを使用してください（例: http://192.168.0.5:5100）")
    app.run(debug=True, host="0.0.0.0", port=5100, use_reloader=False)