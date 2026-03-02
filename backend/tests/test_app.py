import pytest
import sys
import os
import sqlite3


sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app

@pytest.fixture
def test_db():
    schema_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'db', 'schema.sql')
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    with open(schema_path, 'r') as f:
        conn.executescript(f.read())
    import app as app_module
    app_module.conn = conn
    yield conn
    conn.close()

@pytest.fixture
def client(test_db):
    with app.test_client() as client:
        yield client