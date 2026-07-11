from flask import Blueprint, request, redirect, url_for, session, flash
from flask_wtf.csrf import generate_csrf
from app.models import db, Incident
from app.utils import login_required, admin_required
from app.frontend import render_frontend, serialize_incident
from app.districts import DISTRICTS, DISTRICT_COORDINATES, INCIDENT_TYPES

reports_bp = Blueprint('reports', __name__)


@reports_bp.route('/reports/new', methods=['GET', 'POST'])
@login_required
def new_report():
    if request.method == 'POST':
        district = request.form.get('district', '')
        incident_type = request.form.get('incident_type', '')
        description = request.form.get('description', '').strip()
        severity = request.form.get('severity', '')
        latitude_val = request.form.get('latitude', '')
        longitude_val = request.form.get('longitude', '')

        errors = []
        if district not in DISTRICT_COORDINATES:
            errors.append('Selecciona un distrito válido.')
        if incident_type not in INCIDENT_TYPES:
            errors.append('Selecciona un tipo de incidente válido.')
        if not description:
            errors.append('Describe brevemente lo ocurrido.')
        if severity not in ('1', '2', '3', '4', '5'):
            errors.append('Selecciona un nivel de severidad.')

        if errors:
            for error in errors:
                flash(error, 'error')
        else:
            try:
                latitude = float(latitude_val) if latitude_val else DISTRICT_COORDINATES[district][0]
                longitude = float(longitude_val) if longitude_val else DISTRICT_COORDINATES[district][1]
            except ValueError:
                latitude, longitude = DISTRICT_COORDINATES[district]

            incident = Incident(
                district=district,
                incident_type=incident_type,
                description=description,
                latitude=latitude,
                longitude=longitude,
                severity=int(severity),
                source=f"Reporte de {session.get('username', 'usuario')}",
                status='pending',
                reported_by=session['user_id'],
            )
            db.session.add(incident)
            db.session.commit()
            flash('Reporte enviado. Quedará visible una vez sea revisado por un administrador.', 'success')
            return redirect(url_for('reports.new_report'))

    return render_frontend(
        'report',
        csrfToken=generate_csrf(),
        report={
            'districts': DISTRICTS,
            'incidentTypes': INCIDENT_TYPES,
        },
    )


@reports_bp.route('/reports/pending')
@admin_required
def pending_reports():
    incidents = Incident.query.filter_by(status='pending').order_by(Incident.date_reported.desc()).all()
    return render_frontend(
        'moderation',
        csrfToken=generate_csrf(),
        moderation={
            'pending': [serialize_incident(incident) for incident in incidents],
        },
    )


@reports_bp.route('/reports/<int:incident_id>/approve', methods=['POST'])
@admin_required
def approve_report(incident_id):
    incident = Incident.query.get_or_404(incident_id)
    incident.status = 'approved'
    db.session.commit()
    flash('Reporte aprobado.', 'success')
    return redirect(url_for('reports.pending_reports'))


@reports_bp.route('/reports/<int:incident_id>/reject', methods=['POST'])
@admin_required
def reject_report(incident_id):
    incident = Incident.query.get_or_404(incident_id)
    incident.status = 'rejected'
    db.session.commit()
    flash('Reporte rechazado.', 'info')
    return redirect(url_for('reports.pending_reports'))
