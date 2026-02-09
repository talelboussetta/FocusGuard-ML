# Production Dockerfile for FocusGuard Backend
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements-production.txt requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port (Render will use PORT env var, typically 10000)
EXPOSE 8000
EXPOSE 10000

# Set default PORT if not provided
ENV PORT=8000

# Health check (disabled for Render - uses different port)
# HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
#     CMD python -c "import requests; requests.get('http://localhost:${PORT:-8000}/health')"

# Startup script to validate environment and start server
COPY <<'EOF' /app/start.sh
#!/bin/bash
set -e

# Convert DATABASE_URL from postgresql:// to postgresql+asyncpg://
if [ ! -z "$DATABASE_URL" ]; then
    export DATABASE_URL=$(echo $DATABASE_URL | sed 's|postgresql://|postgresql+asyncpg://|')
    echo "[INFO] Database URL configured (asyncpg driver)"
fi

# Validate environment (optional - comment out to skip)
echo "[*] Validating environment..."
python validate_startup.py || echo "[WARNING] Validation failed - continuing anyway"

# Start the application
echo "[*] Starting uvicorn on port ${PORT}..."
exec uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 2 --timeout-keep-alive 75 --log-level info
EOF

RUN chmod +x /app/start.sh

# Run startup script
CMD ["/app/start.sh"]
