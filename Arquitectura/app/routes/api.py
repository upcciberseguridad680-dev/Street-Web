from flask import Blueprint, jsonify
from app.models import Incident
from app.utils import login_required
from app.extensions import limiter
from flask_limiter.util import get_remote_address

api_bp = Blueprint('api', __name__)

@api_bp.route('/api')
@limiter.limit("60 per minute", key_func=get_remote_address)
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
@limiter.limit("30 per minute", key_func=get_remote_address)
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
