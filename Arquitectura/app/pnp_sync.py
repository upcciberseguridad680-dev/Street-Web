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
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta

from app.districts import DISTRICT_COORDINATES

logger = logging.getLogger(__name__)


def _strip_accents_upper(value):
    normalized = unicodedata.normalize('NFD', value)
    return ''.join(c for c in normalized if unicodedata.category(c) != 'Mn').upper()


# El PNP devuelve los distritos en mayusculas y sin tildes (ej. "SAN MARTIN
# DE PORRES"); un simple .title() los deja con preposiciones capitalizadas
# ("San Martin De Porres") y sin tildes, lo que no calza con el nombre
# canonico de app/districts.py ("San Martín de Porres"). Se normaliza
# (mayusculas, sin tildes) contra esa lista para que el filtro de distrito
# del mapa no termine con entradas duplicadas/inconsistentes.
_CANONICAL_DISTRICT_BY_KEY = {
    _strip_accents_upper(name): name for name in DISTRICT_COORDINATES
}


def _canonical_district(raw_name):
    return _CANONICAL_DISTRICT_BY_KEY.get(_strip_accents_upper(raw_name), raw_name.title())

QUERY_URL = (
    'https://seguridadciudadana.mininter.gob.pe/arcgis/rest/services/'
    'servicios_ogc/denuncias/MapServer/0/query'
)

# El servidor de mininter.gob.pe no envia el certificado intermedio de su
# cadena TLS (error "unable to verify the first certificate"), aunque el
# certificado hoja es valido y pertenece al Ministerio del Interior y encadena
# a una CA raiz de confianza (Sectigo/USERTrust). En vez de desactivar la
# verificacion TLS por completo, se agrega el intermedio faltante (publicado
# por Sectigo en la extension AIA del propio certificado hoja) al contexto,
# manteniendo verify_mode=CERT_REQUIRED y check_hostname=True.
_SECTIGO_ORG_VALIDATION_INTERMEDIATE = """-----BEGIN CERTIFICATE-----
MIIGGTCCBAGgAwIBAgIQE31TnKp8MamkM3AZaIR6jTANBgkqhkiG9w0BAQwFADCB
iDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCk5ldyBKZXJzZXkxFDASBgNVBAcTC0pl
cnNleSBDaXR5MR4wHAYDVQQKExVUaGUgVVNFUlRSVVNUIE5ldHdvcmsxLjAsBgNV
BAMTJVVTRVJUcnVzdCBSU0EgQ2VydGlmaWNhdGlvbiBBdXRob3JpdHkwHhcNMTgx
MTAyMDAwMDAwWhcNMzAxMjMxMjM1OTU5WjCBlTELMAkGA1UEBhMCR0IxGzAZBgNV
BAgTEkdyZWF0ZXIgTWFuY2hlc3RlcjEQMA4GA1UEBxMHU2FsZm9yZDEYMBYGA1UE
ChMPU2VjdGlnbyBMaW1pdGVkMT0wOwYDVQQDEzRTZWN0aWdvIFJTQSBPcmdhbml6
YXRpb24gVmFsaWRhdGlvbiBTZWN1cmUgU2VydmVyIENBMIIBIjANBgkqhkiG9w0B
AQEFAAOCAQ8AMIIBCgKCAQEAnJMCRkVKUkiS/FeN+S3qU76zLNXYqKXsW2kDwB0Q
9lkz3v4HSKjojHpnSvH1jcM3ZtAykffEnQRgxLVK4oOLp64m1F06XvjRFnG7ir1x
on3IzqJgJLBSoDpFUd54k2xiYPHkVpy3O/c8Vdjf1XoxfDV/ElFw4Sy+BKzL+k/h
fGVqwECn2XylY4QZ4ffK76q06Fha2ZnjJt+OErK43DOyNtoUHZZYQkBuCyKFHFEi
rsTIBkVtkuZntxkj5Ng2a4XQf8dS48+wdQHgibSov4o2TqPgbOuEQc6lL0giE5dQ
YkUeCaXMn2xXcEAG2yDoG9bzk4unMp63RBUJ16/9fAEc2wIDAQABo4IBbjCCAWow
HwYDVR0jBBgwFoAUU3m/WqorSs9UgOHYm8Cd8rIDZsswHQYDVR0OBBYEFBfZ1iUn
Z/kxwklD2TA2RIxsqU/rMA4GA1UdDwEB/wQEAwIBhjASBgNVHRMBAf8ECDAGAQH/
AgEAMB0GA1UdJQQWMBQGCCsGAQUFBwMBBggrBgEFBQcDAjAbBgNVHSAEFDASMAYG
BFUdIAAwCAYGZ4EMAQICMFAGA1UdHwRJMEcwRaBDoEGGP2h0dHA6Ly9jcmwudXNl
cnRydXN0LmNvbS9VU0VSVHJ1c3RSU0FDZXJ0aWZpY2F0aW9uQXV0aG9yaXR5LmNy
bDB2BggrBgEFBQcBAQRqMGgwPwYIKwYBBQUHMAKGM2h0dHA6Ly9jcnQudXNlcnRy
dXN0LmNvbS9VU0VSVHJ1c3RSU0FBZGRUcnVzdENBLmNydDAlBggrBgEFBQcwAYYZ
aHR0cDovL29jc3AudXNlcnRydXN0LmNvbTANBgkqhkiG9w0BAQwFAAOCAgEAThNA
lsnD5m5bwOO69Bfhrgkfyb/LDCUW8nNTs3Yat6tIBtbNAHwgRUNFbBZaGxNh10m6
pAKkrOjOzi3JKnSj3N6uq9BoNviRrzwB93fVC8+Xq+uH5xWo+jBaYXEgscBDxLmP
bYox6xU2JPti1Qucj+lmveZhUZeTth2HvbC1bP6mESkGYTQxMD0gJ3NR0N6Fg9N3
OSBGltqnxloWJ4Wyz04PToxcvr44APhL+XJ71PJ616IphdAEutNCLFGIUi7RPSRn
R+xVzBv0yjTqJsHe3cQhifa6ezIejpZehEU4z4CqN2mLYBd0FUiRnG3wTqN3yhsc
SPr5z0noX0+FCuKPkBurcEya67emP7SsXaRfz+bYipaQ908mgWB2XQ8kd5GzKjGf
FlqyXYwcKapInI5v03hAcNt37N3j0VcFcC3mSZiIBYRiBXBWdoY5TtMibx3+bfEO
s2LEPMvAhblhHrrhFYBZlAyuBbuMf1a+HNJav5fyakywxnB2sJCNwQs2uRHY1ihc
6k/+JLcYCpsM0MF8XPtpvcyiTcaQvKZN8rG61ppnW5YCUtCC+cQKXA0o4D/I+pWV
idWkvklsQLI+qGu41SWyxP7x09fn1txDAXYw+zuLXfdKiXyaNb78yvBXAfCNP6CH
MntHWpdLgtJmwsQt6j8k9Kf5qLnjatkYYaA7jBU=
-----END CERTIFICATE-----"""

_VERIFIED_CONTEXT = ssl.create_default_context()
_VERIFIED_CONTEXT.load_verify_locations(cadata=_SECTIGO_ORG_VALIDATION_INTERMEDIATE)

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

REQUEST_TIMEOUT = 15
PAGE_SIZE = 1000


def _request(params):
    # QUERY_URL es una constante https:// fija de este modulo, no input de
    # usuario: no hay riesgo de esquemas file:// u otros no permitidos.
    url = f'{QUERY_URL}?{urllib.parse.urlencode(params)}'
    with urllib.request.urlopen(url, timeout=REQUEST_TIMEOUT, context=_VERIFIED_CONTEXT) as resp:  # nosec B310
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
    # Envuelto en try/except: una denuncia individual con un campo en un
    # formato inesperado no debe tirar toda la pagina/lote ya parseado.
    try:
        subtipo = str(attrs.get('subtipo_hecho') or '').strip()
        incident_type = SUBTIPO_TO_INCIDENT_TYPE.get(subtipo)
        lat, lng = attrs.get('lat_hecho'), attrs.get('long_hecho')
        distrito = attrs.get('distrito_hecho')
        fecha_ms = attrs.get('fecha_hora_hecho')
        objectid = attrs.get('objectid')

        if not incident_type or lat is None or lng is None or not distrito or not fecha_ms or objectid is None:
            return None

        return {
            'district': _canonical_district(str(distrito)),
            'incident_type': incident_type,
            'description': f'{subtipo.title()} reportado a la PNP',
            'latitude': float(lat),
            'longitude': float(lng),
            'severity': SEVERITY_BY_INCIDENT_TYPE.get(incident_type, 3),
            'source': SOURCE_LABEL,
            'date_reported': datetime.utcfromtimestamp(fecha_ms / 1000),
            'external_id': f'pnp:{objectid}',
        }
    except (TypeError, ValueError, OSError):
        logger.warning('Denuncia del PNP con formato inesperado, se omite: %r', attrs)
        return None


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
    while len(incidents) < max_records:
        try:
            features = _fetch_page(where_clause, offset, min(PAGE_SIZE, max_records - len(incidents)))
        except Exception:
            # Se corta la paginacion pero se conservan los incidentes ya
            # traidos: perder la ultima pagina no debe tirar las anteriores.
            logger.warning('Fallo una pagina de la sincronizacion con el PNP, se usa lo ya obtenido.', exc_info=True)
            break
        if not features:
            break
        for feature in features:
            incident = _map_feature(feature['attributes'])
            if incident:
                incidents.append(incident)
        offset += len(features)
        if len(features) < PAGE_SIZE:
            break

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
