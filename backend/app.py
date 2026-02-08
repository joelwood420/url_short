from flask import Flask, redirect, request, jsonify
from flask_cors import CORS
from dataclasses import dataclass
import random
import _sqlite3

app = Flask(__name__)
CORS(app)

db = _sqlite3.connect('db/urls.db', check_same_thread=False)
cursor= db.cursor()



def generate_shortcode():
    chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    shortcode = ""
    while True:
        shortcode = "".join(random.choice(chars) for _ in range(3))
        return shortcode
    


def is_shortcode_unique(generated_shortcode):
    cursor.execute("SELECT COUNT(*) FROM urls WHERE short_code = ?", (generated_shortcode,))
    count = cursor.fetchone()[0]
    return count == 0 




def save_url_dict_to_db(url, shortcode):
    cursor.execute("INSERT INTO urls (original_url, short_code) VALUES (?, ?)", (url, shortcode))
    db.commit()


def create_short_url(shortcode):
    return f"{request.host_url}/{shortcode}"\
    


def check_url_in_db(url):
    cursor.execute("SELECT short_code FROM urls WHERE original_url = ?", (url,))
    result = cursor.fetchone()
    if result:
        return result[0]
    return None
    

        






    



@app.route('/shorten', methods=['POST'])
def shorten_url():
    data = request.get_json()
    original_url = data.get('url')

    if not original_url:
        return jsonify({"error": "No URL provided"}), 400

    shortcode = generate_shortcode()
    while not is_shortcode_unique(shortcode):
        shortcode = generate_shortcode()

    save_url_dict_to_db(original_url, shortcode)
    short_url = create_short_url(shortcode)

    return jsonify({"short_url": short_url}), 201






@app.route('/<short>', methods=['GET'])
def redirect_to_original(short):
    cursor.execute("SELECT original_url FROM urls WHERE short_code = ?", (short,))
    result = cursor.fetchone()

    if result:
        original_url = result[0]
        return redirect(original_url)
    else:
        return jsonify({"error": "Short URL not found"}), 404





if __name__ == '__main__':
    app.run(debug=True)

