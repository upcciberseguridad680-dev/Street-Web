from flask import Flask, request, jsonify, render_template
import os
from flask_wtf.csrf import CSRFProtect
from app.extensions import limiter
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

    limiter.init_app(app)

    # Custom error handler for rate limiting
    @app.errorhandler(429)
    def ratelimit_handler(e):
        if request.path.startswith('/api/'):
            return jsonify({
                "error": "Rate limit exceeded",
                "message": "Demasiadas solicitudes. Por favor, inténtelo de nuevo más tarde.",
                "retry_after": getattr(e.description, 'retry_after', 60)
            }), 429
        else:
            return render_template('errors/429.html',
                                 retry_after=getattr(e.description, 'retry_after', 60)), 429

    # Register Blueprints
    from app.routes.auth import auth_bp
    from app.routes.main import main_bp
    from app.routes.map import map_bp
    from app.routes.api import api_bp
    from app.routes.reports import reports_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(map_bp)
    app.register_blueprint(api_bp)
    app.register_blueprint(reports_bp)

    @app.context_processor
    def inject_template_helpers():
        return {'now': lambda: datetime.now(timezone.utc)}

    # Initialize database and add sample data
    with app.app_context():
        db.create_all()
        from app.models import User, Incident
        if not User.query.filter_by(username='admin').first():
            admin = User(username='admin', email='admin@streetweb.com', is_admin=True)
            admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
            admin.set_password(admin_password)
            db.session.add(admin)
        if Incident.query.count() == 0:
            from app.pnp_sync import fetch_recent_incidents
            from app.sample_data import generate_sample_incidents
            incidents_data = fetch_recent_incidents()
            if not incidents_data:
                incidents_data = generate_sample_incidents()
            for inc_data in incidents_data:
                incident = Incident(status='approved', **inc_data)
                db.session.add(incident)
            db.session.commit()

    from app.scheduler import start_scheduler
    start_scheduler(app)

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
