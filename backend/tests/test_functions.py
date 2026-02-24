import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from test_app import test_db, client
import app


def test_generate_shortcode():
    """Test that the generated shortcode is 3 characters long and alphanumeric."""
    shortcode = app.generate_shortcode()
    assert len(shortcode) == 3
    assert shortcode.isalnum()  


def test_shortcode_uniqueness(client, test_db):
    """Test that the generated shortcode is unique."""
    shortcode = app.generate_shortcode()
    assert app.is_shortcode_unique(shortcode)


def test_is_valid_url():
    """Test that the URL validation function correctly identifies valid and invalid URLs."""
    assert app.is_valid_url("https://www.youtube.com")
    assert not app.is_valid_url("invalid-url")





