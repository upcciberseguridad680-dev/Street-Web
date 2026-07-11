from flask import Flask
import os
from flask_wtf.csrf import CSRFProtect
from app.models import db
from config import config
from datetime import datetime, timezone

def create_app():
    app = Flask(__name__)

    # Load configuration
    env = os.environ.get('APP_ENV') or os.environ.get('FLASK_ENV', 'development')
    app.config.from_object(config.get(env, config['default']))

    csrf = CSRFProtect(app)

    db.init_app(app)

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
            from app.sample_data import generate_sample_incidents
            for inc_data in generate_sample_incidents():
                incident = Incident(status='approved', **inc_data)
                db.session.add(incident)
            db.session.commit()

    # Health check
    @app.route('/health')
    def health():
        from flask import jsonify
        return jsonify({"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}), 200

    return app

if __name__ == '__main__':
    import os
    os.environ['FLASK_APP'] = 'app'
    # We usually run with gunicorn, but for local dev:
    # flask run
    pass
