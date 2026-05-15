# Street Web - Sistema de Monitoreo de Seguridad en Lima y Callao

Una aplicación web para visualizar y monitorear datos de inseguridad ciudadana en Lima y Callao, con sistema de autenticación, mapa de calor y pipeline CI/CD integrado.

## Características

- **Autenticación de usuarios**: Sistema de login seguro con registro de usuarios
- **Mapa de calor interactivo**: Visualización de incidentes de inseguridad por distrito y tipo
- **Filtrado avanzado**: Por tipo de incidente, distrito y rango de fechas
- **Dashboard estadístico**: Resumen de incidentes y tendencias
- **API REST**: Endpoints para acceder a los datos de incidentes
- **Pipeline CI/CD**: Integración continua y despliegue automático con GitHub Actions y Render
- **Análisis de seguridad**: Escaneo SAST integrado con Bandit
- **Dockerizado**: Fácil despliegue en cualquier entorno

## Arquitectura

- **Backend**: Python con Flask y SQLAlchemy
- **Frontend**: HTML5, CSS3, JavaScript con Leaflet.js para mapas
- **Base de datos**: SQLite (desarrollo) / PostgreSQL (producción en Render)
- **Mapas**: Leaflet.js con plugin de heatmap
- **CI/CD**: GitHub Actions → Render (Desarrollo → Smoke Test → Producción)

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
   cd streetweb
   ```

2. Crear entorno virtual:
   ```bash
   python -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate
   ```

3. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```

4. Ejecutar la aplicación:
   ```bash
   python app.py
   ```

5. Acceder en: http://localhost:5000

## Despliegue con Docker

1. Construir la imagen:
   ```bash
   docker build -t streetweb .
   ```

2. Ejecutar el contenedor:
   ```bash
   docker run -p 5000:5000 streetweb
   ```

## Despliegue en Render

1. Crear cuenta en [Render.com](https://render.com)
2. Conectar tu repositorio de GitHub
3. Crear un nuevo "Web Service"
4. Configurar:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn --bind 0.0.0.0:$PORT app:app`
   - Environment Variables:
     - `SECRET_KEY`: Tu clave secreta segura
     - `DATABASE_URL`: URL de tu base de datos PostgreSQL en Render

## Pipeline CI/CD

El pipeline incluye las siguientes etapas:

1. **CI (Integración Continua)**:
   - Checkout del código
   - Configuración de Python 3.11
   - Instalación de dependencias
   - Verificación de importación de la aplicación
   - Análisis de seguridad estático con Bandit

2. **CD (Despliegue Continuo)**:
   - Deploy a entorno de desarrollo en Render
   - Espera a que el servicio inicie
   - Smoke test para verificar que el servicio responde
   - Deploy a entorno de producción en Render (solo si el smoke test pasa)

## Variables de Entorno Necesarias para Render

Para que el pipeline funcione correctamente en Render, necesitas configurar estas variables de entorno en tu repositorio de GitHub (Settings > Secrets > Actions):

- `RENDER_DEV_HOOK`: URL del deploy hook de tu servicio de desarrollo en Render
- `RENDER_PROD_HOOK`: URL del deploy hook de tu servicio de producción en Render

## Uso de la Aplicación

1. **Registro de Usuario**: Crea una nueva cuenta en la página de registro
2. **Inicio de Sesión**: Accede con tus credenciales
3. **Dashboard**: Vista general con estadísticas y incidentes recientes
4. **Mapa de Calor**: Visualiza los incidentes en un mapa interactivo con filtros
5. **API**: Accede a `/api/incidents` para obtener los datos en formato JSON

## Credenciales de Acceso (Desarrollo)

Para facilitar las pruebas, se crea automáticamente un usuario administrador:
- Usuario: `admin`
- Contraseña: `admin123` 
  **⚠️ Importante: Cambiar esta contraseña en producción**

## Licencia

Este proyecto está destinado para fines educativos en el curso de Arquitectura de Aplicaciones.