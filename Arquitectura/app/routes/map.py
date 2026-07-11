from flask import Blueprint, request
from app.models import db, Incident
from app.utils import login_required
from app.frontend import render_frontend, serialize_incident
from datetime import datetime

map_bp = Blueprint('map', __name__)

@map_bp.route('/heatmap')
@login_required
def heatmap():
    incident_types = db.session.query(Incident.incident_type.distinct()).filter(Incident.status == 'approved').all()
    incident_types = [t[0] for t in incident_types]
    districts = db.session.query(Incident.district.distinct()).filter(Incident.status == 'approved').all()
    districts = [d[0] for d in districts]
    incident_type = request.args.get('type', '')
    district = request.args.get('district', '')
    start_date = request.args.get('start_date', '')
    end_date = request.args.get('end_date', '')
    query = Incident.query.filter_by(status='approved')
    if incident_type:
        query = query.filter(Incident.incident_type == incident_type)
    if district:
        query = query.filter(Incident.district == district)
    if start_date:
        try:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(Incident.date_reported >= start_date_obj)
        except ValueError:
            pass
    if end_date:
        try:
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
            query = query.filter(Incident.date_reported <= end_date_obj)
        except ValueError:
            pass
    incidents = query.all()
    heatmap_data = []
    for incident in incidents:
        heatmap_data.append({
            'lat': incident.latitude,
            'lng': incident.longitude,
            'intensity': incident.severity,
            'district': incident.district,
            'type': incident.incident_type,
            'description': incident.description or '',
            'date': incident.date_reported.strftime('%Y-%m-%d %H:%M') if incident.date_reported else 'Sin fecha'
        })
    return render_frontend(
        'heatmap',
        heatmap={
            'incidents': [serialize_incident(incident) for incident in incidents],
            'heatmapPoints': heatmap_data,
            'incidentTypes': incident_types,
            'districts': districts,
            'filters': {
                'type': incident_type,
                'district': district,
                'startDate': start_date,
                'endDate': end_date,
            },
        },
    )
