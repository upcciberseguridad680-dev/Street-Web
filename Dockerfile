FROM node:24-alpine AS frontend-build

WORKDIR /src

COPY Arquitectura/frontend/package*.json ./Arquitectura/frontend/
RUN cd Arquitectura/frontend && npm ci

COPY Arquitectura/frontend ./Arquitectura/frontend
RUN cd Arquitectura/frontend && npm run build

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies first (for Docker cache optimization)
COPY Arquitectura/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application
COPY Arquitectura/ .
COPY --from=frontend-build /src/Arquitectura/app/static/frontend /app/app/static/frontend

# Create a non-root user for security
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 5000

# Environment variables
ENV FLASK_APP=run.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_RUN_PORT=5000

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "run:app"]
