# Street Web - Sistema de Monitoreo de Seguridad en Lima y Callao

Una aplicación web para visualizar y monitorear datos de inseguridad ciudadana en Lima y Callao, con sistema de autenticación, mapa de calor y configuración lista para desplegar en Render.

## Características

- **Autenticación de usuarios**: Sistema de login seguro con registro de usuarios
- **Mapa de calor interactivo**: Visualización de incidentes de inseguridad por distrito y tipo
- **Filtrado avanzado**: Por tipo de incidente, distrito y rango de fechas
- **Dashboard estadístico**: Resumen de incidentes y tendencias
- **API REST**: Endpoints para acceder a los datos de incidentes
- **CI**: Verificación automática con GitHub Actions
- **Deploy en Render**: Configuración declarativa con `render.yaml`
- **Análisis de seguridad**: Escaneo SAST integrado con Bandit, CodeQL y DAST con OWASP ZAP
- **Dockerizado**: Fácil despliegue en cualquier entorno

## Arquitectura

- **Backend**: Python con Flask y SQLAlchemy
- **Frontend**: React, TypeScript y Vite, con Leaflet.js para mapas
- **Base de datos**: SQLite (desarrollo) / PostgreSQL (producción en Render)
- **Mapas**: Leaflet.js con plugin de heatmap
- **CI/CD**: GitHub Actions para validación y Render para despliegue

## Requisitos

- Python 3.11+
- Git
- Docker (opcional, para contenerización)
- Cuenta en GitHub
- Cuenta en Render (para despliegue)

## Instalación Local

1. Clonar el repositorio:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd streetweb/Arquitectura
   ```

2. Crear entorno virtual:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # En Windows: .venv\Scripts\activate
   ```

3. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```

4. Compilar el frontend:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

5. Ejecutar la aplicación:
   ```bash
   python run.py
   ```

6. Acceder en: http://localhost:5000

## Despliegue con Docker

1. Construir la imagen:
   ```bash
   docker build -t streetweb .
   ```

2. Ejecutar el contenedor:
   ```bash
   docker run -p 5000:5000 streetweb
   ```

## Enlaces de Acceso

| Ambiente | Frontend (Interfaz) | Backend (Servidor/API) |
| :--- | :--- | :--- |
| **Desarrollo** | [Link Desarrollo](#) | [Link Desarrollo](#) |
| **Producción** | [Link Producción](#) | [Link Producción](#) |

## Despliegue en Render

El repositorio incluye un `render.yaml` en la raíz para crear el servicio desde Render Blueprint.

Configuración equivalente:

- Root Directory: `Arquitectura`
- Build Command: `bash build.sh`
- Start Command: `gunicorn --bind 0.0.0.0:$PORT run:app`
- Health Check Path: `/health`

## Pipeline CI/CD

El pipeline incluye:

1. **CI (Integración Continua)**:
   - Checkout del código
   - Configuración de Python 3.11
   - Instalación de dependencias
   - Compilación del frontend
   - Verificación de importación de la aplicación
   - Análisis de seguridad estático con Bandit
   - Análisis de seguridad semántico con CodeQL
   - Escaneo de vulnerabilidades en sistema de archivos con Trivy FS
   - Escaneo de vulnerabilidades en imagen Docker con Trivy Image
   - Auditoría de dependencias Python con pip-audit
   - Pruebas de seguridad dinámicas (DAST) con OWASP ZAP

El despliegue lo gestiona Render cuando el repositorio está conectado al servicio o Blueprint, pero solo después de que pasen todas las etapas de seguridad.

## Uso de la Aplicación

1. **Registro de Usuario**: Crea una nueva cuenta en la página de registro
2. **Inicio de Sesión**: Accede con tus credenciales
3. **Dashboard**: Vista general con estadísticas y incidentes recientes
4. **Mapa de Calor**: Visualiza los incidentes en un mapa interactivo con filtros
5. **API**: Accede a `/api/incidents` para obtener los datos en formato JSON

## Licencia

Este proyecto está destinado para fines educativos en el curso de Arquitectura de Aplicaciones.
