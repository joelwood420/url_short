import pytest
import sys
import os
import sqlite3
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app

@pytest.fixture
def test_db():
    """Create a temporary test database."""
    # Create a temporary file for the test database
    db_fd, test_db_path = tempfile.mkstemp(suffix='.db')
    
    # Create the database schema
    conn = sqlite3.connect(test_db_path)
    with open(os.path.join(os.path.dirname(__file__), '..', 'db', 'schema.sql'), 'r') as f:
        schema = f.read()
        conn.executescript(schema)
    conn.commit()
    conn.close()
    
    yield test_db_path
    
    # Clean up
    os.close(db_fd)
    os.unlink(test_db_path)

@pytest.fixture
def client(test_db, monkeypatch):
    """Create a test client for the Flask application."""
    # Patch the DB_PATH to use our test database
    monkeypatch.setattr('app.DB_PATH', test_db)
    
    app.config['TESTING'] = True
    
    with app.test_client() as client:
        yield client





