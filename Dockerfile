# ── Stage 1: Build the React frontend ──────────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build


# ── Stage 2: Run the Flask backend ─────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy backend source
COPY backend/ ./

# Copy the built React app into the location Flask expects
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Create the db directory (volume will be mounted here in production)
RUN mkdir -p db

# Expose the port Fly.io will route traffic to
EXPOSE 8080

# Run with gunicorn (production WSGI server instead of Flask dev server)
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--timeout", "60", "app:app"]
