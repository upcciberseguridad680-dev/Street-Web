from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    is_admin = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        from werkzeug.security import check_password_hash
        return check_password_hash(self.password_hash, password)

class Incident(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    district = db.Column(db.String(100), nullable=False)
    incident_type = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    severity = db.Column(db.Integer, default=1)  # 1-5 scale
    date_reported = db.Column(db.DateTime, default=datetime.utcnow)
    source = db.Column(db.String(100))
    status = db.Column(db.String(20), default='approved', nullable=False)  # pending | approved | rejected
    reported_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    external_id = db.Column(db.String(50), unique=True, nullable=True)  # id de la fuente externa (ej. PNP), para no duplicar en cada sync

    reporter = db.relationship('User', backref='reported_incidents')


class LoginAttempt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False, index=True)
    ip_address = db.Column(db.String(45), nullable=False)  # IPv6 compatible
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    success = db.Column(db.Boolean, default=False, nullable=False)
