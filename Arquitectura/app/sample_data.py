import random
from datetime import datetime, timedelta

from app.districts import DISTRICT_COORDINATES, INCIDENT_TYPES

# Distritos con mayor peso de incidentes para simular "zonas calientes"
# reales en un mapa de calor (más reportes concentrados en menos distritos).
HOTSPOT_WEIGHTS = {
    'Callao': 14,
    'San Juan de Lurigancho': 13,
    'Villa El Salvador': 11,
    'Los Olivos': 10,
    'Comas': 10,
    'San Martín de Porres': 9,
    'Ate': 9,
    'Lima Cercado': 9,
    'La Victoria': 8,
    'Villa María del Triunfo': 8,
    'San Juan de Miraflores': 7,
    'Independencia': 6,
}
DEFAULT_WEIGHT = 3

DESCRIPTION_TEMPLATES = {
    'Robo': [
        'Robo de celular en la vía pública',
        'Robo de vehículo estacionado',
        'Robo al paso a transeúnte',
        'Robo en paradero de transporte público',
    ],
    'Asalto': [
        'Asalto a mano armada a peatón',
        'Asalto a comercio local',
        'Asalto a pasajero en unidad de transporte',
    ],
    'Hurto': [
        'Hurto de pertenencias en mercado',
        'Hurto de bolsa en zona comercial',
        'Hurto en paradero durante hora punta',
    ],
    'Riña': [
        'Riña vecinal reportada por serenazgo',
        'Pelea en establecimiento nocturno',
        'Altercado entre transeúntes',
    ],
    'Extorsión': [
        'Extorsión a comerciante local',
        'Cobro de cupo a transportista',
        'Amenaza de extorsión a negocio familiar',
    ],
}

SOURCES = ['Denuncia ciudadana', 'Serenazgo', 'Policía Nacional', 'Testigo ocular', 'Reporte vecinal']


def generate_sample_incidents(seed=42):
    rng = random.Random(seed)
    districts = list(DISTRICT_COORDINATES.keys())
    weights = [HOTSPOT_WEIGHTS.get(d, DEFAULT_WEIGHT) for d in districts]

    now = datetime.utcnow()
    incidents = []

    for district in districts:
        count = HOTSPOT_WEIGHTS.get(district, DEFAULT_WEIGHT)
        base_lat, base_lng = DISTRICT_COORDINATES[district]
        for _ in range(count):
            incident_type = rng.choice(INCIDENT_TYPES)
            severity = rng.choices([1, 2, 3, 4, 5], weights=[2, 3, 4, 3, 2])[0]
            jitter_lat = rng.uniform(-0.012, 0.012)
            jitter_lng = rng.uniform(-0.012, 0.012)
            days_ago = rng.randint(0, 120)
            incidents.append({
                'district': district,
                'incident_type': incident_type,
                'description': rng.choice(DESCRIPTION_TEMPLATES[incident_type]),
                'latitude': base_lat + jitter_lat,
                'longitude': base_lng + jitter_lng,
                'severity': severity,
                'source': rng.choice(SOURCES),
                'date_reported': now - timedelta(days=days_ago, hours=rng.randint(0, 23)),
            })

    return incidents
