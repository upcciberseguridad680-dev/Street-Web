FROM node:24-alpine AS frontend-build

WORKDIR /src

COPY Arquitectura/frontend/package*.json ./Arquitectura/frontend/
RUN cd Arquitectura/frontend && npm ci

COPY Arquitectura/frontend ./Arquitectura/frontend
RUN cd Arquitectura/frontend && npm run build

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
# curl: usado por el healthcheck del job de ZAP en CI (docker exec app curl ...)
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies first (for Docker cache optimization)
COPY Arquitectura/requirements.txt .

# Actualiza pip/setuptools/wheel: la imagen base trae versiones con CVEs
# HIGH conocidas (setuptools, wheel, jaraco.context) que Trivy reporta.
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

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
# --timeout 90: da margen al arranque, que hace una llamada de red externa
# (sincroniza incidentes reales del PNP) antes de aceptar requests.
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--timeout", "90", "run:app"]
