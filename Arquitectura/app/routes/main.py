from flask import Blueprint, redirect, url_for, session
from sqlalchemy import func
from app.models import db, Incident
from app.utils import login_required
from app.frontend import render_frontend, serialize_incident

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    return redirect(url_for('main.dashboard'))

@main_bp.route('/dashboard')
@login_required
def dashboard():
    approved = Incident.query.filter_by(status='approved')
    total_incidents = approved.count()
    recent_incidents = approved.order_by(Incident.date_reported.desc()).limit(5).all()
    incident_types = db.session.query(Incident.incident_type.distinct()).filter(Incident.status == 'approved').all()
    incident_types = [t[0] for t in incident_types]
    districts = db.session.query(Incident.district.distinct()).filter(Incident.status == 'approved').all()
    districts = [d[0] for d in districts]
    type_counts = (
        db.session.query(Incident.incident_type, func.count(Incident.id))
        .filter(Incident.status == 'approved')
        .group_by(Incident.incident_type)
        .order_by(func.count(Incident.id).desc())
        .all()
    )

    return render_frontend(
        'dashboard',
        dashboard={
            'totalIncidents': total_incidents,
            'recentIncidents': [serialize_incident(incident) for incident in recent_incidents],
            'incidentTypes': incident_types,
            'districts': districts,
            'typeCounts': [
                {'label': incident_type, 'value': count}
                for incident_type, count in type_counts
            ],
        },
    )
