import logging
import os

from apscheduler.schedulers.background import BackgroundScheduler

from app.models import db, Incident
from app.pnp_sync import fetch_latest_incidents

logger = logging.getLogger(__name__)

_scheduler = None


def sync_new_incidents(app):
    """Trae las denuncias mas recientes del PNP y agrega solo las que
    todavia no existen (por external_id). Pensado para correr periodicamente
    mientras el proceso este vivo, sin depender de un reinicio de la app."""
    with app.app_context():
        added = 0
        for data in fetch_latest_incidents():
            if Incident.query.filter_by(external_id=data['external_id']).first():
                continue
            db.session.add(Incident(status='approved', **data))
            added += 1
        if added:
            db.session.commit()
        logger.info('Sincronizacion PNP: %s incidentes nuevos', added)
        return added


def _is_reloader_parent_process():
    # Evita que el proceso "monitor" del reloader de Flask (FLASK_DEBUG=1)
    # arranque un segundo scheduler ademas del que corre en el proceso hijo.
    return os.environ.get('FLASK_DEBUG') == '1' and os.environ.get('WERKZEUG_RUN_MAIN') != 'true'


def start_scheduler(app):
    global _scheduler
    if _scheduler is not None or _is_reloader_parent_process():
        return _scheduler

    interval_minutes = int(os.environ.get('PNP_SYNC_INTERVAL_MINUTES', '15'))
    scheduler = BackgroundScheduler(daemon=True)
    scheduler.add_job(
        lambda: sync_new_incidents(app),
        'interval',
        minutes=interval_minutes,
        id='pnp_sync',
    )
    scheduler.start()
    _scheduler = scheduler
    return scheduler
