from flask import Flask, redirect, request, jsonify
import requests
from flask_cors import CORS
import random
import os
import sqlite3
import uuid
import qrcode
import io
import base64

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_headers=["Content-Type", "X-Session-ID"])


DB_PATH = 'db/urls.db'
CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
SHORTCODE_LENGTH = 3



os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)


def get_db_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn



def generate_shortcode():
        return "".join(random.choice(CHARS) for _ in range(SHORTCODE_LENGTH))
    

def execute_query(query, params=()):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    result = cursor.fetchone() 
    conn.close()
    return result



def is_shortcode_unique(generated_shortcode):
    result = execute_query("SELECT 1 FROM urls WHERE short_code = ?", (generated_shortcode,))
    return result is None



def save_url(url, shortcode, session_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO urls (session_id, original_url, short_code) VALUES (?, ?, ?)", (session_id, url, shortcode))
    conn.commit()
    conn.close()


def get_shortcode_for_url(url):
    result = execute_query("SELECT short_code FROM urls WHERE original_url = ?", (url,))
    return result['short_code'] if result else None


def get_url_by_shortcode(shortcode):
    result = execute_query("SELECT original_url FROM urls WHERE short_code = ?", (shortcode,))
    return result['original_url'] if result else None
    


def create_short_url(shortcode):
    return f"{request.host_url}{shortcode}"


def is_valid_url(url):
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    try:
        response = requests.get(url, timeout=5)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False
    

def get_session_id():
    session_id = request.headers.get('X-Session-ID')
    return session_id if session_id else None


def create_session_id():
    return str(uuid.uuid4())


def generate_qr_code(short_url):
    qr = qrcode.QRCode(version=1, box_size=12, border=5)
    qr.add_data(short_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#6ecfb0", back_color='#2d2d2d')
    buffer = io.BytesIO()     # Create an in-memory buffer to hold the image data
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return base64.b64encode(buffer.getvalue()).decode('utf-8') # Return the QR code as string of bytes






@app.route('/shorten', methods=['POST'])
def shorten_url():
    data = request.get_json()
    original_url = data.get('url')

    if not original_url:
        return jsonify({"error": "No URL provided"}), 400

    if not original_url.startswith(('http://', 'https://')):
        original_url = 'https://' + original_url

    if not is_valid_url(original_url):
        return jsonify({"error": "Please input a valid URL"}), 400

    session_id = get_session_id()
    if not session_id:
        session_id = create_session_id()

    existing_shortcode = get_shortcode_for_url(original_url)

    if existing_shortcode:
        short_url = create_short_url(existing_shortcode)
        qr_code = generate_qr_code(short_url)
        print(f"Short URL: {short_url}")
        response = jsonify({"short_url": short_url, "qr_code": qr_code, "session_id": session_id})
        return response, 200
        
        
    while True:
        shortcode = generate_shortcode()
        if is_shortcode_unique(shortcode):
            break

    save_url(original_url, shortcode, session_id)
    short_url = create_short_url(shortcode)
    qr_code = generate_qr_code(short_url)
    print(f"Short URL: {short_url}")
    response = jsonify({"short_url": short_url, "qr_code": qr_code, "session_id": session_id})
    return response, 201





@app.route('/<shortcode>', methods=['GET'])
def handle_redirect(shortcode):
    original_url = get_url_by_shortcode(shortcode)
    if original_url:
        return redirect(original_url)
    else:
        return jsonify({"error": "Shortcode not found"}), 404
    


@app.route('/my-urls', methods=['GET'])
def my_urls():
    session_id = get_session_id()
    if not session_id:
        return jsonify({"error": "No active session"}), 401

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT original_url, short_code FROM urls WHERE session_id = ?", (session_id,))
    urls = cursor.fetchall()
    conn.close()

    url_list = [{"original_url": row["original_url"], "short_code": row["short_code"]} for row in urls]
    return jsonify(url_list), 200


@app.route('/qr/<shortcode>', methods=['GET'])
def get_qr(shortcode):
    original_url = get_url_by_shortcode(shortcode)
    if not original_url:
        return jsonify({"error": "Shortcode not found"}), 404

    short_url = create_short_url(shortcode)
    qr_code = generate_qr_code(short_url)
    return jsonify({"qr_code": qr_code}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5001)

