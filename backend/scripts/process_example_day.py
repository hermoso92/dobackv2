"""
Script de ejemplo para procesar un día de datos de un vehículo.
Demuestra cómo usar StateProcessorService para generar intervalos de estados.
"""
from datetime import datetime, timedelta
from backend.config.database import get_db
from backend.services.state_processor_service import StateProcessorService
from backend.utils.logger import logger


def generate_example_data():
    """
    Genera datos de ejemplo para un día completo de operación.
    Simula un día típico de bomberos con salidas en emergencia.
    """
    base_date = datetime(2025, 1, 15, 0, 0, 0)
    
    # Eventos de geocercas (Radar.com)
    geofence_events = [
        # Inicio del día en parque
        {'timestamp': (base_date + timedelta(hours=0)).isoformat(), 
         'event_type': 'entry', 'geofence_type': 'parque', 'geofence_id': 'park_cmadrid_1'},
        
        # Primera salida en emergencia
        {'timestamp': (base_date + timedelta(hours=8, minutes=15)).isoformat(), 
         'event_type': 'exit', 'geofence_type': 'parque', 'geofence_id': 'park_cmadrid_1'},
        
        # Regreso al parque
        {'timestamp': (base_date + timedelta(hours=10, minutes=30)).isoformat(), 
         'event_type': 'entry', 'geofence_type': 'parque', 'geofence_id': 'park_cmadrid_1'},
        
        # Segunda salida en emergencia
        {'timestamp': (base_date + timedelta(hours=14, minutes=45)).isoformat(), 
         'event_type': 'exit', 'geofence_type': 'parque', 'geofence_id': 'park_cmadrid_1'},
        
        # Regreso final
        {'timestamp': (base_date + timedelta(hours=16, minutes=20)).isoformat(), 
         'event_type': 'entry', 'geofence_type': 'parque', 'geofence_id': 'park_cmadrid_1'},
    ]
    
    # Datos GPS (posiciones y velocidades)
    gps_data = []
    
    # Primera salida: movimiento hacia siniestro
    for minute in range(15, 45):  # 8:15 a 8:45
        speed = 60 if minute < 40 else 20  # Velocidad alta, luego desacelera
        gps_data.append({
            'timestamp': (base_date + timedelta(hours=8, minutes=minute)).isoformat(),
            'latitude': 40.4168 + (minute - 15) * 0.001,
            'longitude': -3.7038 + (minute - 15) * 0.001,
            'speed': speed
        })
    
    # En siniestro: parado 90 minutos
    for minute in range(45, 165):  # 8:45 a 10:45
        gps_data.append({
            'timestamp': (base_date + timedelta(hours=8, minutes=minute)).isoformat(),
            'latitude': 40.4468,  # Misma posición
            'longitude': -3.6738,
            'speed': 0  # Parado
        })
    
    # Regreso: movimiento hacia parque
    for minute in range(165, 210):  # 10:45 a 11:30
        speed = 40
        gps_data.append({
            'timestamp': (base_date + timedelta(hours=8, minutes=minute)).isoformat(),
            'latitude': 40.4468 - (minute - 165) * 0.001,
            'longitude': -3.6738 - (minute - 165) * 0.001,
            'speed': speed
        })
    
    # Segunda salida similar
    for minute in range(45, 95):  # 14:45 a 15:35
        speed = 70 if minute < 80 else 10
        gps_data.append({
            'timestamp': (base_date + timedelta(hours=14, minutes=minute)).isoformat(),
            'latitude': 40.4168 + (minute - 45) * 0.0012,
            'longitude': -3.7038 + (minute - 45) * 0.0012,
            'speed': speed
        })
    
    # Datos de rotativo
    rotativo_data = [
        # Rotativo ON para primera salida
        {'timestamp': (base_date + timedelta(hours=8, minutes=15)).isoformat(), 
         'rotativo': True, 'clave': 2},
        {'timestamp': (base_date + timedelta(hours=8, minutes=45)).isoformat(), 
         'rotativo': False, 'clave': 3},  # Llega al siniestro
        
        # Rotativo ON para segunda salida
        {'timestamp': (base_date + timedelta(hours=14, minutes=45)).isoformat(), 
         'rotativo': True, 'clave': 2},
        {'timestamp': (base_date + timedelta(hours=15, minutes=35)).isoformat(), 
         'rotativo': False, 'clave': 5},  # Regreso
    ]
    
    return geofence_events, gps_data, rotativo_data


def main():
    """
    Ejecuta el procesamiento de ejemplo.
    """
    logger.info("=== Iniciando procesamiento de día de ejemplo ===")
    
    # Obtener sesión de base de datos
    db = next(get_db())
    
    try:
        # Crear servicio de procesamiento
        processor = StateProcessorService(db)
        
        # Generar datos de ejemplo
        geofence_events, gps_data, rotativo_data = generate_example_data()
        
        logger.info(f"Datos generados:")
        logger.info(f"  - {len(geofence_events)} eventos de geocercas")
        logger.info(f"  - {len(gps_data)} puntos GPS")
        logger.info(f"  - {len(rotativo_data)} cambios de rotativo")
        
        # Procesar día completo
        intervals = processor.process_vehicle_day(
            vehicle_id='DOBACK023',
            organization_id=1,
            date=datetime(2025, 1, 15),
            geofence_events=geofence_events,
            gps_data=gps_data,
            rotativo_data=rotativo_data
        )
        
        # Mostrar resultados
        logger.info(f"\n=== Resultados del procesamiento ===")
        logger.info(f"Total de intervalos generados: {len(intervals)}")
        
        for interval in intervals:
            logger.info(f"\n{interval.state_name} (Clave {interval.state_key}):")
            logger.info(f"  - Inicio: {interval.start_time}")
            logger.info(f"  - Fin: {interval.end_time}")
            logger.info(f"  - Duración: {interval.duration_seconds} segundos")
            logger.info(f"  - Origen: {interval.origin}")
        
        logger.info("\n=== Procesamiento completado exitosamente ===")
        
    except Exception as e:
        logger.error(f"Error en el procesamiento: {e}")
        raise
    finally:
        db.close()


if __name__ == '__main__':
    main()

