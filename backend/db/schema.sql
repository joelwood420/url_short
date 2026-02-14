CREATE TABLE urls (
    session_id TEXT NOT NULL,   
    original_url TEXT NOT NULL,
    short_code TEXT PRIMARY KEY NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);