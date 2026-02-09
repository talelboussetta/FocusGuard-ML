# Production Dockerfile for FocusGuard Backend
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
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

# Health check (disabled for Render - uses different port)
# HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
#     CMD python -c "import requests; requests.get('http://localhost:${PORT:-8000}/health')"

# Run application with uvicorn (use PORT env var from Render, default to 8000)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2
