from flask import get_flashed_messages, render_template, session


def serialize_incident(incident):
    return {
        "id": incident.id,
        "district": incident.district,
        "incidentType": incident.incident_type,
        "description": incident.description or "",
        "latitude": incident.latitude,
        "longitude": incident.longitude,
        "severity": incident.severity,
        "dateReported": incident.date_reported.isoformat() if incident.date_reported else None,
        "source": incident.source or "No especificada",
    }


def render_frontend(page, **payload):
    user = None
    if session.get("user_id"):
        user = {
            "id": session["user_id"],
            "username": session.get("username", "Usuario"),
        }

    flash_messages = [
        {"category": category, "message": message}
        for category, message in get_flashed_messages(with_categories=True)
    ]

    app_data = {
        "page": page,
        "user": user,
        "flashMessages": flash_messages,
        **payload,
    }

    return render_template("app.html", app_data=app_data)
