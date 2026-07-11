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

@main_bp.route('/advisor')
@login_required
def advisor():
    from app.districts import DISTRICTS, INCIDENT_TYPES

    # Query all approved incidents
    incidents = Incident.query.filter_by(status='approved').all()

    # Calculate stats per district
    stats = {}

    # Group incidents by district
    by_district = {d: [] for d in DISTRICTS}
    for inc in incidents:
        if inc.district in by_district:
            by_district[inc.district].append(inc)

    # Find max incidents in any district to normalize risk
    max_incidents = max(len(incs) for incs in by_district.values()) if by_district else 0
    if max_incidents == 0:
        max_incidents = 1

    for d in DISTRICTS:
        incs = by_district[d]
        total = len(incs)
        if total > 0:
            avg_severity = sum(i.severity for i in incs) / total
            types = [i.incident_type for i in incs]
            top_type = max(set(types), key=types.count)
        else:
            avg_severity = 0.0
            top_type = "Ninguno"

        # Risk factor calculation: 60% frequency weight, 40% severity weight
        freq_score = total / max_incidents
        sev_score = avg_severity / 5.0

        if total == 0:
            risk_score = 0.0
        else:
            risk_score = (freq_score * 0.6) + (sev_score * 0.4)

        safety_index = int(round(max(0.0, min(1.0, 1.0 - risk_score)) * 100))

        stats[d] = {
            'total': total,
            'avgSeverity': round(avg_severity, 1),
            'topType': top_type,
            'safetyIndex': safety_index
        }

    return render_frontend(
        'advisor',
        advisor={
            'districts': DISTRICTS,
            'incidentTypes': INCIDENT_TYPES,
            'stats': stats
        }
    )

