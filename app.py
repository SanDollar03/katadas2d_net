from flask import Flask, render_template, request, jsonify, send_from_directory
from datetime import datetime
import os
import json
import threading
import webbrowser

app = Flask(__name__)

# ディレクトリ設定
DATA_DIR = r"C:\katadas2d\data"
LOG_DIR = r"C:\katadas2d\logs"
IMAGE_DIR = r"C:\katadas2d\images"

# 初期化：必要なフォルダがなければ作成
def initialize():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(LOG_DIR, exist_ok=True)
    os.makedirs(IMAGE_DIR, exist_ok=True)

# JSON読み込み関数
def load_json(filename):
    path = os.path.join(DATA_DIR, filename)
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[JSON読み込みエラー] {filename}: {e}")
        return []

# ルーティング
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

# 自動でブラウザを開く
def open_browser():
    webbrowser.open_new('http://127.0.0.1:5000')

# メイン実行
if __name__ == '__main__':
    initialize()
    threading.Timer(1.0, open_browser).start()
    app.run(debug=True, use_reloader=False)