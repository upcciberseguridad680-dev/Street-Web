from flask import Flask, request
import os
from flask_wtf.csrf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from app.models import db
from config import config
from datetime import datetime, timezone

def create_app():
    app = Flask(__name__)

    # Load configuration
    env = os.environ.get('APP_ENV') or os.environ.get('FLASK_ENV', 'development')
    app.config.from_object(config.get(env, config['default']))

    # Fail fast in production if required secrets are missing
    if env == 'production':
        required_secrets = ['SECRET_KEY', 'ADMIN_PASSWORD']
        missing = [k for k in required_secrets if not os.environ.get(k)]
        if missing:
            raise RuntimeError(f"Missing required environment variables in production: {', '.join(missing)}")

    csrf = CSRFProtect(app)

    db.init_app(app)

    # Initialize rate limiter
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=["200 per hour"]
    )
    limiter.init_app(app)

    # Register Blueprints
    from app.routes.auth import auth_bp
    from app.routes.main import main_bp
    from app.routes.map import map_bp
    from app.routes.api import api_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(map_bp)
    app.register_blueprint(api_bp)

    @app.context_processor
    def inject_template_helpers():
        return {'now': lambda: datetime.now(timezone.utc)}

    # Initialize database and add sample data
    with app.app_context():
        db.create_all()
        from app.models import User, Incident
        if not User.query.filter_by(username='admin').first():
            admin = User(username='admin', email='admin@streetweb.com')
            admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
            admin.set_password(admin_password)
            db.session.add(admin)
        if Incident.query.count() == 0:
            sample_incidents = [
                {'district': 'Miraflores', 'incident_type': 'Robo', 'description': 'Robo de celular en parque Kennedy', 'latitude': -12.1216, 'longitude': -77.0282, 'severity': 3, 'source': 'Policía Nacional'},
                {'district': 'San Isidro', 'incident_type': 'Asalto', 'description': 'Asalto a mano armada en vía pública', 'latitude': -12.1032, 'longitude': -77.0362, 'severity': 4, 'source': 'Denuncia ciudadana'},
                {'district': 'Barranco', 'incident_type': 'Hurto', 'description': 'Hurto de bolsa en malecón', 'latitude': -12.1516, 'longitude': -77.0123, 'severity': 2, 'source': 'Testigo ocular'},
                {'district': 'La Punta', 'incident_type': 'Riña', 'description': 'Pelea en establecimiento nocturno', 'latitude': -12.0663, 'longitude': -77.1368, 'severity': 3, 'source': 'Serenazgo'},
                {'district': 'Callao', 'incident_type': 'Robo', 'description': 'Robo a transporte público', 'latitude': -12.0566, 'longitude': -77.1181, 'severity': 4, 'source': 'Policía del Callao'},
                {'district': 'Villa El Salvador', 'incident_type': 'Extorsión', 'description': 'Extorsión a pequeño comerciante', 'latitude': -12.1881, 'longitude': -76.9845, 'severity': 5, 'source': 'Denuncia anónima'}
            ]
            for inc_data in sample_incidents:
                incident = Incident(**inc_data)
                db.session.add(incident)
            db.session.commit()

    # Health check
    @app.route('/health')
    def health():
        from flask import jsonify
        return jsonify({"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}), 200

    @app.after_request
    def set_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' https://unpkg.com https://cdnjs.cloudflare.com; "
            "style-src 'self' https://unpkg.com; "
            "img-src 'self' data: https://*.basemaps.cartocdn.com"
        )
        response.headers['Permissions-Policy'] = 'geolocation=(), camera=(), microphone=()'
        response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
        # HSTS - only add in production (when using HTTPS)
        if request.is_secure:
            response.headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains'
        return response

    return app

if __name__ == '__main__':
    import os
    os.environ['FLASK_APP'] = 'app'
    # We usually run with gunicorn, but for local dev:
    # flask run
    pass
