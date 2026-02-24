import pytest
import app

def test_generate_shortcode():
    shortcode = app.generate_shortcode()
    assert len(shortcode) == 3
    assert app.is_shortcode_unique(shortcode)


def test_save_url(client):
    response = client.post('/save_url', json={
        'original_url': 'https://www.example.com'
    })
    assert response.status_code == 200
    assert 'short_code' in response.json


