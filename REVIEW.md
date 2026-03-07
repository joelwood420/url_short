# Code Review — Lnksy URL Shortener

This document covers the findings from a thorough review of the project. Issues are grouped by theme and ranked roughly by severity.

---

## 🔴 Security

### 1. Server-Side Request Forgery (SSRF) in URL validation
**File:** `backend/app.py` — `is_valid_url()`

`is_valid_url()` makes a `GET` request to any URL the user submits, including internal addresses like `http://localhost/admin`, `http://192.168.1.1`, or `http://169.254.169.254` (AWS metadata endpoint). A bad actor can use this to probe your internal network from the server.

**Fix:** Resolve the hostname before making the request and block private/loopback address ranges.

---

### 2. `secret_key` can silently be `None`
**File:** `backend/app.py` line 21

```python
app.secret_key = os.environ.get('secret_key')
```

If `SECRET_KEY` is not set in the environment, `os.environ.get()` returns `None`, which Flask accepts silently. All sessions will be insecure/broken.

**Fix:** Raise a hard error on startup if the key is missing:
```python
app.secret_key = os.environ.get('secret_key')
if not app.secret_key:
    raise RuntimeError("SECRET_KEY environment variable is not set")
```

---

### 3. No rate limiting on sensitive endpoints
**Files:** `/login`, `/register`, `/shorten`

There is no rate limiting on the login or register endpoints, enabling unlimited brute-force password attempts. The `/shorten` endpoint can also be abused to trigger unlimited outbound HTTP requests (via `is_valid_url` and `get_page_title`).

**Fix:** Add `Flask-Limiter` (e.g. `10/minute` on `/login`, `5/minute` on `/register`).

---

### 4. No minimum password requirement
**File:** `backend/app.py` — `register()`

Any password, including a single character, is accepted without any length or complexity check.

**Fix:** Enforce a minimum password length (e.g. 8 characters) server-side.

---

### 5. Malicious / phishing URLs can be shortened
**File:** `backend/app.py` — `is_valid_url()`

Any URL that returns HTTP < 500 is considered valid. This allows phishing pages, malware download links, etc. to be shortened.

**Fix:** Consider integrating the [Google Safe Browsing API](https://developers.google.com/safe-browsing) or a similar service to screen submitted URLs.

---

### 6. `debug=True` in local server start
**File:** `backend/app.py` line 363

```python
app.run(debug=True, port=5001)
```

`debug=True` enables the Werkzeug interactive debugger, which can execute arbitrary code in the browser. Although this block only runs when executed directly (not via gunicorn), it's a habit worth breaking.

**Fix:** Default to `debug=False` or read from an env var: `debug=os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'`.

---

## 🟠 Architecture & Design

### 7. Circular dependency between `app.py` and `user_auth.py`
**File:** `backend/user_auth.py` — `get_connection()`

```python
def get_connection():
    import app as app_module          # deferred import to avoid circular import
    return app_module.get_db_connection()
```

`user_auth.py` imports `app.py` at runtime to get a DB connection. `app.py` imports from `user_auth.py` at the top level. This circular dependency only works because the import is deferred inside the function — it's fragile and makes testing harder.

**Fix:** Pass the DB connection as a parameter to the auth functions, or move `get_db_connection()` to a separate `db.py` module that both files can import.

---

### 8. `login_user()` in `user_auth.py` is dead code
**File:** `backend/user_auth.py` lines 50–54

`login_user()` is defined but never called — the login route in `app.py` duplicates the same logic inline.

**Fix:** Either remove `login_user()` or use it from the `/login` route.

---

### 9. SQLite with multiple gunicorn workers
**File:** `Dockerfile` / `fly.toml`

The app runs with `--workers 2`. SQLite's write lock is per-process, so concurrent writes from two workers can cause `database is locked` errors.

**Fix:** Either use `--workers 1` for SQLite, or migrate to PostgreSQL (which Fly.io supports natively).

---

### 10. 3-character shortcode space is tiny
**File:** `backend/app.py` line 27

```python
SHORTCODE_LENGTH = 3
```

62³ = **238,328** possible shortcodes. This will be exhausted quickly on a shared service, and the `while True` loop that searches for a unique code will spin indefinitely once the space fills up.

**Fix:** Increase to at least 6 characters (62⁶ ≈ 56 billion) and add a safety counter to the loop to avoid an infinite loop:
```python
for _ in range(10):
    shortcode = generate_shortcode()
    if is_shortcode_unique(shortcode):
        break
else:
    return jsonify({"error": "Could not generate a unique shortcode"}), 500
```

---

### 11. No database migrations
**File:** `backend/schema.sql`

The schema uses `CREATE TABLE IF NOT EXISTS`, which means adding a new column in production requires a manual `ALTER TABLE`. There's no migration tooling.

**Fix:** Consider [Alembic](https://alembic.sqlalchemy.org/) (works with SQLite) or at minimum document a migration procedure.

---

### 12. Guest URLs are shared across all users
**File:** `backend/app.py` — `shorten_url()`

When a guest shortens a URL that already exists in the database (from any previous guest), the same shortcode is returned. This means one guest's shortcode shows up in another guest's results, and the click count is shared too.

**Fix:** Either give every request a fresh shortcode, or make URL deduplication opt-in.

---

### 13. No URL normalization
**File:** `backend/app.py` — `shorten_url()`

`https://example.com/` and `https://example.com` are treated as different URLs and get different shortcodes.

**Fix:** Normalize URLs before querying (e.g. strip trailing slashes, lowercase the scheme and host).

---

### 14. `save_url` has a race condition
**File:** `backend/app.py` — `save_url()`

The shortcode uniqueness check and the `INSERT` are two separate operations. Under concurrent load, two requests could both pass the uniqueness check, then one will raise an `IntegrityError` on insert. This is unhandled.

**Fix:** Catch `sqlite3.IntegrityError` in `save_url()` and retry with a new shortcode.

---

## 🟡 Code Quality

### 15. Duplicate `fetch` calls — `api.js` functions not used everywhere
**Files:** `Hero.jsx` lines 17–27, `App.jsx` lines 15–17 and 49–51

`Hero.jsx` calls `fetch('/shorten', ...)` directly instead of calling `shortenUrl()` from `api.js`. `App.jsx` calls `fetch('/me', ...)` and `fetch('/logout', ...)` directly instead of `getMe()` / `logout()` from `api.js`. This defeats the purpose of having a dedicated `api.js` module.

**Fix:** Replace all direct `fetch` calls in components with the corresponding `api.js` functions.

---

### 16. `user[0]`, `user[2]` magic index access
**Files:** `backend/app.py`, `backend/user_auth.py`

The user tuple is accessed by position:
```python
user[0]   # user ID
user[2]   # password hash
```

If columns are ever reordered or a new column is added, this silently breaks.

**Fix:** Enable `row_factory = sqlite3.Row` and use named access: `user['id']`, `user['password_hash']`. (The `row_factory` is already set in `get_db_connection()` — the fix is to use it consistently.)

---

### 17. `execute_query` in `app.py` always uses `fetchone`
**File:** `backend/app.py` lines 58–63

```python
def execute_query(query, params=()):
    ...
    result = cursor.fetchone()
    return result
```

The function is named `execute_query` but it always fetches only one row and never commits. It's used as both a read helper and incorrectly mixed with explicit `cursor` calls elsewhere. Compare with the more flexible version in `user_auth.py` that has `fetchone` and `commit` flags.

**Fix:** Align the two `execute_query` implementations, or consolidate them in a shared `db.py`.

---

### 18. `app._static_folder` is a private attribute
**File:** `backend/app.py` line 161

```python
return send_from_directory(app._static_folder, 'index.html')
```

`_static_folder` is a private/internal attribute. Use the public `app.static_folder` instead.

---

### 19. `print()` debug statement left in production code
**File:** `backend/app.py` line 257

```python
print(f"Short URL: {short_url}")
```

**Fix:** Remove it, or use `app.logger.debug(...)` so it can be toggled by log level.

---

### 20. Inconsistent indentation in `generate_shortcode`
**File:** `backend/app.py` lines 55–56

```python
def generate_shortcode():
        return "".join(...)   # 8 spaces instead of 4
```

The function body is double-indented relative to everything else.

---

### 21. `key={index}` used in list rendering
**File:** `url-short/src/components/MyUrls.jsx` line 124

```jsx
{urls.map((item, index) => (
    <li key={index} ...>
```

Using the array index as a React key is an anti-pattern — it causes incorrect reconciliation when items are deleted. Each URL has a unique `short_code` which should be used instead:

```jsx
<li key={item.short_code} ...>
```

---

### 22. Component polling every 5 seconds
**File:** `url-short/src/components/MyUrls.jsx` lines 31–34

```js
const interval = setInterval(fetchUrls, 5000);
```

Polling every 5 seconds creates continuous server traffic even when nothing has changed.

**Fix:** Remove the interval and add a manual "Refresh" button, or only refetch after a user action (e.g. after deleting a URL).

---

### 23. Login refresh hack using `setTimeout`
**File:** `url-short/src/App.jsx` lines 41–44

```js
setShowMyUrls(false)
setTimeout(() => setShowMyUrls(true), 100)
```

This forces a re-mount of `MyUrls` by toggling its visibility. It works, but it's fragile and relies on a timing trick.

**Fix:** Lift the URL list state to `App.jsx` and pass a `refresh` trigger as a prop, or use a state management approach that lets `MyUrls` react to login events properly.

---

### 24. Unnecessary `React` import in JSX files
**Files:** `Hero.jsx` line 1, `MyUrls.jsx` line 1, `CreateUser.jsx` line 1

```js
import React, { useState } from "react";
```

With the React 17+ JSX transform (enabled by Vite), `React` no longer needs to be in scope for JSX. The explicit import is harmless but redundant.

---

### 25. `flask-cors` installed but never configured
**File:** `backend/requirements.txt` line 2

`flask-cors` is listed as a dependency, but `Flask-CORS` is never imported or configured in `app.py`. This is a dead dependency.

**Fix:** Remove it from `requirements.txt`.

---

### 26. `gunicorn` listed in both `requirements.txt` and the Dockerfile
**Files:** `backend/requirements.txt` line 7, `Dockerfile` line 21

```
# requirements.txt
gunicorn

# Dockerfile
RUN pip install --no-cache-dir -r requirements.txt gunicorn
```

Gunicorn is installed twice in the Docker build.

**Fix:** Remove `gunicorn` from either `requirements.txt` or the explicit `pip install` in the Dockerfile (not both).

---

### 27. Vite proxy doesn't cover the `/<shortcode>` redirect route
**File:** `url-short/vite.config.js`

The Vite dev-server proxy maps specific paths like `/shorten`, `/login`, etc. but does not proxy the general `/<shortcode>` route. During local development with `npm run dev`, clicking a short link will not redirect correctly.

**Fix:** Add a catch-all proxy rule or add the redirect paths explicitly:
```js
'/me': 'http://localhost:5001',
```
(`/me` is also missing from the proxy list.)

---

### 28. README says React 18; project uses React 19
**File:** `README.md` line 25

The tech stack table shows `React 18` but `package.json` declares `"react": "^19.2.0"`.

**Fix:** Update the README to `React 19`.

---

## 🟢 Minor / Nice-to-have

- **No input length validation on URLs or emails** — a very long input can cause unnecessary work.
- **No `HTTPS`-only redirect in Flask** — only enforced by Fly.io; local dev accepts plain HTTP silently.
- **No 404 page** — an unrecognised shortcode returns a JSON error, but a user navigating directly to a bad URL in the browser sees raw JSON instead of a friendly page.
- **`MyUrls` doesn't react to logout** — if a user logs out while the "My Links" panel is open, the panel stays visible and keeps polling.
- **No test for `delete_url`** — the delete endpoint is untested.
- **No test for `my_urls`** — the `/my-urls` endpoint is untested.
- **No test for duplicate URL handling** — both guest and logged-in deduplication paths are untested.
- **No CI pipeline** — there is no GitHub Actions workflow to run `pytest` automatically on pull requests.

---

## Summary Table

| # | Severity | Area | Topic |
|---|----------|------|-------|
| 1 | 🔴 Security | Backend | SSRF via URL validation |
| 2 | 🔴 Security | Backend | `secret_key` can be `None` |
| 3 | 🔴 Security | Backend | No rate limiting |
| 4 | 🔴 Security | Backend | No password minimum |
| 5 | 🟠 Security | Backend | No URL safety screening |
| 6 | 🟠 Security | Backend | `debug=True` in dev server |
| 7 | 🟠 Architecture | Backend | Circular dependency |
| 8 | 🟠 Architecture | Backend | Dead `login_user()` function |
| 9 | 🟠 Architecture | Backend | SQLite + multiple workers |
| 10 | 🟠 Architecture | Backend | Tiny shortcode space + infinite loop |
| 11 | 🟠 Architecture | Backend | No DB migrations |
| 12 | 🟠 Architecture | Backend | Shared guest shortcodes |
| 13 | 🟠 Architecture | Backend | No URL normalization |
| 14 | 🟠 Architecture | Backend | Race condition on shortcode insert |
| 15 | 🟡 Quality | Frontend | Duplicate `fetch` calls bypassing `api.js` |
| 16 | 🟡 Quality | Backend | Magic index access on user tuple |
| 17 | 🟡 Quality | Backend | `execute_query` always uses `fetchone` |
| 18 | 🟡 Quality | Backend | Private `_static_folder` attribute |
| 19 | 🟡 Quality | Backend | Debug `print()` in production code |
| 20 | 🟡 Quality | Backend | Inconsistent indentation |
| 21 | 🟡 Quality | Frontend | `key={index}` in list rendering |
| 22 | 🟡 Quality | Frontend | Unnecessary 5-second polling |
| 23 | 🟡 Quality | Frontend | `setTimeout` hack for login refresh |
| 24 | 🟡 Quality | Frontend | Unnecessary `React` import |
| 25 | 🟡 Quality | Backend | `flask-cors` unused dependency |
| 26 | 🟡 Quality | Infra | `gunicorn` installed twice |
| 27 | 🟡 Quality | Frontend | Vite proxy missing routes |
| 28 | 🟢 Minor | Docs | README says React 18 vs actual React 19 |
