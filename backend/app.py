from flask import Flask, redirect, request, jsonify
from flask_cors import CORS
from dataclasses import dataclass
import random
import os
import sqlite3

app = Flask(__name__)
CORS(app)


DB_PATH = 'db/urls.db'
CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
SHORTCODE_LENGTH = 3



os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)


def get_db_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS urls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_url TEXT NOT NULL,
            short_code TEXT UNIQUE NOT NULL
        )
    ''')
    conn.commit()
    conn.close()


def generate_shortcode():
        return "".join(random.choice(CHARS) for _ in range(SHORTCODE_LENGTH))
    

def is_shortcode_unique(generated_shortcode):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM urls WHERE short_code = ?", (generated_shortcode,))
    exists = cursor.fetchone() is not None
    conn.close()
    return not exists



def save_url(url, shortcode):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO urls (original_url, short_code) VALUES (?, ?)", (url, shortcode))
    conn.commit()
    conn.close()


def get_shortcode_for_url(url):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT short_code FROM urls WHERE original_url = ?", (url,))
    result = cursor.fetchone()
    conn.close()
    if result:
        return result['short_code']
    return None


def get_url_by_shortcode(shortcode):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT original_url FROM urls WHERE short_code = ?", (shortcode,))
    result = cursor.fetchone()
    conn.close()
    if result:
        return result['original_url']
    return None
    


def create_short_url(shortcode):
    return f"{request.host_url}{shortcode}"
    



    



@app.route('/shorten', methods=['POST'])
def shorten_url():
    data = request.get_json()
    original_url = data.get('url')
    
    
    if not original_url:
        return jsonify({"error": "No URL provided"}), 400
    
    
    existing_shortcode = get_shortcode_for_url(original_url)
    if existing_shortcode:
        short_url = create_short_url(existing_shortcode)
        return jsonify({"short_url": short_url}), 200
    
    
    while True:
        shortcode = generate_shortcode()
        if is_shortcode_unique(shortcode):
            break
    
    
    save_url(original_url, shortcode)
    short_url = create_short_url(shortcode)
    return jsonify({"short_url": short_url}), 201





@app.route('/<short>', methods=['GET'])
def handle_redirect(shortcode):
    original_url = get_url_by_shortcode(shortcode)
    if original_url:
        return redirect(original_url)
    else:
        return jsonify({"error": "Shortcode not found"}), 404



if __name__ == '__main__':
    init_db()
    app.run(debug=True)

