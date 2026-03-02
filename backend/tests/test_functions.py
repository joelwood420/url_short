import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from test_app import client, test_db
import app


def test_generate_shortcode():
    gen_shortcode = app.generate_shortcode()
    assert len(gen_shortcode) == 3
    assert gen_shortcode.isalnum()


def test_existing_shortcode(test_db):
    app.execute_query("INSERT INTO urls (original_url, short_code) VALUES (?, ?)", ("http://example.com", "abc"))
    generated_shortcode = 'abc'
    result = app.is_shortcode_unique(generated_shortcode)
    assert result == False



def test_shorten_url(client, test_db):
    response = client.post('/shorten', json={"url": "youtube.com"})
    assert response.status_code == 201

    data = response.get_json()
    assert data is not None
    assert "short_url" in data

    short_url = data["short_url"]
    shortcode = short_url.split("/")[-1]

    assert short_url == f"http://localhost/{shortcode}"

    result = app.execute_query("SELECT * FROM urls WHERE short_code = ?", (shortcode,))
    assert result is not None

    assert result["original_url"] == "https://youtube.com"


def test_register_user(client, test_db):
    response = client.post('/register', json={"email": "testuser@test.com", "password": "testpass"})
    assert response.status_code == 201

    data = response.get_json()
    assert data is not None
    assert "message" in data
    assert data["message"] == "User created successfully"


def test_login_user(client, test_db):
    client.post('/register', json={"email": "testuser@test.com", "password": "testpass"})
    response = client.post('/login', json={"email": "testuser@test.com", "password": "testpass"})
    assert response.status_code == 200

    data = response.get_json()
    assert data is not None
    assert "message" in data
    assert data["message"] == "Login successful"

def test_logout_user(client, test_db):
    client.post('/register', json={"email": "testuser@test.com", "password": "testpass"})
    client.post('/login', json={"email": "testuser@test.com", "password": "testpass"})
    response = client.post('/logout')
    assert response.status_code == 200

    data = response.get_json()
    assert data is not None
    assert "message" in data
    assert data["message"] == "Logged out"


def test_redirect(client, test_db):
    shorten_response = client.post('/shorten', json={"url": "youtube.com"})
    short_url = shorten_response.get_json()["short_url"]
    shortcode = short_url.split("/")[-1]

    response = client.get(f'/{shortcode}')
    assert response.headers['Location'] == "https://youtube.com"

