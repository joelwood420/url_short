import pytest
import sys
import os
import sqlite3
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app

@pytest.fixture
def test_db():
    db_fd, db_path = tempfile.mkstemp()
    schema = open(os.path.join(os.path.dirname(__file__), '..', 'db', 'schema.sql')).read()
    conn = sqlite3.connect(db_path)
    conn.executescript(schema)
    conn.commit()
    conn.close()
    yield db_path
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def client(test_db, monkeypatch):
    monkeypatch.setattr('app.DB_PATH', test_db)
    with app.test_client() as client:
        yield client