from flask import Blueprint, jsonify, request, current_app
from app.models import Incident
from app.utils import login_required
from flask_limiter.util import get_remote_address

def get_limiter():
    """Get the limiter instance from the current app."""
    limiter = current_app.extensions.get('limiter')
    if limiter is None:
        # Create a fallback limiter that doesn't actually limit (for safety)
        class FallbackLimiter:
            def limit(self, limit_string):
                def decorator(f):
                    return f
                return decorator
        return FallbackLimiter()
    return limiter

api_bp = Blueprint('api', __name__)

@api_bp.route('/api')
@get_limiter().limit("60 per minute", key_func=get_remote_address)
def api_home():
    return jsonify({
        "status": "success",
        "message": "Street Web API is running",
        "endpoints": {
            "incidents": "/api/incidents"
        }
    })

@api_bp.route('/api/incidents')
@login_required
@get_limiter().limit("30 per minute", key_func=get_remote_address)
def api_incidents():
    incidents = Incident.query.filter_by(status='approved').all()
    result = []
    for incident in incidents:
        result.append({
            'id': incident.id,
            'district': incident.district,
            'incident_type': incident.incident_type,
            'description': incident.description,
            'latitude': incident.latitude,
            'longitude': incident.longitude,
            'severity': incident.severity,
            'date_reported': incident.date_reported.isoformat() if incident.date_reported else None,
            'source': incident.source
        })
    return jsonify(result)
