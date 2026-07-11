"""
Sincroniza incidentes reales desde el servicio publico de denuncias
georreferenciadas del Ministerio del Interior (PNP):
https://seguridadciudadana.mininter.gob.pe/arcgis/rest/services/servicios_ogc/denuncias/MapServer/0

Solo se importan categorias de delito patrimonial y de via publica
(robo, hurto, estafa, extorsion, faltas, alteracion del orden publico).
Se excluyen a proposito las categorias de violencia familiar y sexual:
ese servicio incluye direcciones exactas de esas denuncias y publicarlas
en un mapa de calor publico expondria la ubicacion de victimas.
"""
import json
import logging
import ssl
import urllib.parse
import urllib.request
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

QUERY_URL = (
    'https://seguridadciudadana.mininter.gob.pe/arcgis/rest/services/'
    'servicios_ogc/denuncias/MapServer/0/query'
)

# El servidor de mininter.gob.pe no envia el certificado intermedio de su
# cadena TLS (error "unable to verify the first certificate"), aunque el
# certificado hoja es valido y pertenece al Ministerio del Interior. Se usa
# un contexto sin verificacion solo para este host publico y de solo lectura.
_INSECURE_CONTEXT = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
_INSECURE_CONTEXT.check_hostname = False
_INSECURE_CONTEXT.verify_mode = ssl.CERT_NONE

WHITELISTED_TIPOS = ['PATRIMONIO (DELITO)', 'TRANQUILIDAD PUBLICA (DELITO)', 'FALTAS']

SUBTIPO_TO_INCIDENT_TYPE = {
    'ROBO': 'Robo',
    'HURTO': 'Hurto',
    'EXTORSION': 'Extorsión',
    'ESTAFA Y OTRAS DEFRAUDACIONES': 'Hurto',
    'APROPIACION ILICITA': 'Hurto',
    'RECEPTACION': 'Hurto',
    'USURPACION': 'Hurto',
    'DAÑOS': 'Hurto',
    'PAZ PUBLICA': 'Riña',
    'FALTAS CONTRA LAS PERSONAS': 'Riña',
    'FALTAS CONTRA LA SEGURIDAD PUBLICA': 'Riña',
    'FALTAS CONTRA EL PATRIMONIO': 'Hurto',
    'FALTAS CONTRA LA TRANQUILIDAD PUBLICA': 'Riña',
}

SEVERITY_BY_INCIDENT_TYPE = {'Robo': 4, 'Extorsión': 5, 'Hurto': 2, 'Riña': 3}

SOURCE_LABEL = 'Policía Nacional del Perú (denuncias georreferenciadas)'

REQUEST_TIMEOUT = 10
PAGE_SIZE = 1000


def _request(params):
    url = f'{QUERY_URL}?{urllib.parse.urlencode(params)}'
    with urllib.request.urlopen(url, timeout=REQUEST_TIMEOUT, context=_INSECURE_CONTEXT) as resp:
        return json.loads(resp.read())


def _base_where():
    tipos = ', '.join(f"'{t}'" for t in WHITELISTED_TIPOS)
    return f"departamento_hecho IN ('LIMA','CALLAO') AND tipo_hecho IN ({tipos})"


def _latest_available_date(where_clause):
    data = _request({
        'where': where_clause,
        'outStatistics': json.dumps([{
            'statisticType': 'max',
            'onStatisticField': 'fecha_hora_hecho',
            'outStatisticFieldName': 'maxFecha',
        }]),
        'f': 'json',
    })
    # ArcGIS Server devuelve el alias del campo en minusculas
    # independientemente de como se pida en outStatisticFieldName.
    ms = next(iter(data['features'][0]['attributes'].values()))
    return datetime.utcfromtimestamp(ms / 1000)


def _map_feature(attrs):
    subtipo = (attrs.get('subtipo_hecho') or '').strip()
    incident_type = SUBTIPO_TO_INCIDENT_TYPE.get(subtipo)
    lat, lng = attrs.get('lat_hecho'), attrs.get('long_hecho')
    distrito = attrs.get('distrito_hecho')
    fecha_ms = attrs.get('fecha_hora_hecho')
    objectid = attrs.get('objectid')

    if not incident_type or lat is None or lng is None or not distrito or not fecha_ms or objectid is None:
        return None

    return {
        'district': distrito.title(),
        'incident_type': incident_type,
        'description': f'{subtipo.title()} reportado a la PNP',
        'latitude': lat,
        'longitude': lng,
        'severity': SEVERITY_BY_INCIDENT_TYPE.get(incident_type, 3),
        'source': SOURCE_LABEL,
        'date_reported': datetime.utcfromtimestamp(fecha_ms / 1000),
        'external_id': f'pnp:{objectid}',
    }


def _fetch_page(where_clause, offset, count):
    page = _request({
        'where': where_clause,
        'outFields': 'objectid,distrito_hecho,tipo_hecho,subtipo_hecho,fecha_hora_hecho,lat_hecho,long_hecho',
        'orderByFields': 'fecha_hora_hecho DESC',
        'resultOffset': offset,
        'resultRecordCount': count,
        'returnGeometry': 'false',
        'f': 'json',
    })
    return page.get('features', [])


def fetch_recent_incidents(days=90, max_records=800):
    """
    Trae denuncias reales de Lima y Callao de los ultimos `days` dias,
    contados desde el dato mas reciente disponible en el servicio (el
    dataset del PNP no siempre esta sincronizado con la fecha actual).
    Devuelve [] si el servicio no responde, para que el caller pueda
    usar datos de respaldo sin romper el arranque de la aplicacion.
    """
    base_where = _base_where()

    try:
        latest = _latest_available_date(base_where)
    except Exception:
        logger.warning('No se pudo consultar la fecha mas reciente del PNP.', exc_info=True)
        return []

    start = latest - timedelta(days=days)
    where_clause = f"{base_where} AND fecha_hora_hecho >= TIMESTAMP '{start:%Y-%m-%d %H:%M:%S}'"

    incidents = []
    offset = 0
    try:
        while len(incidents) < max_records:
            features = _fetch_page(where_clause, offset, min(PAGE_SIZE, max_records - len(incidents)))
            if not features:
                break
            for feature in features:
                incident = _map_feature(feature['attributes'])
                if incident:
                    incidents.append(incident)
            offset += len(features)
            if len(features) < PAGE_SIZE:
                break
    except Exception:
        logger.warning('Fallo la sincronizacion con el PNP, se usaran datos de respaldo.', exc_info=True)
        return []

    return incidents


def fetch_latest_incidents(count=200):
    """
    Trae las `count` denuncias mas recientes (sin filtrar por ventana de
    dias) para el poll periodico: como la deduplicacion es por
    external_id, es seguro volver a traer las mismas cada vez y el
    caller simplemente ignora las que ya existen.
    """
    try:
        features = _fetch_page(_base_where(), 0, count)
    except Exception:
        logger.warning('Fallo el poll periodico del PNP.', exc_info=True)
        return []

    incidents = []
    for feature in features:
        incident = _map_feature(feature['attributes'])
        if incident:
            incidents.append(incident)
    return incidents
