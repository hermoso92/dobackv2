"""
Servicio de integración entre el upload de archivos y el procesamiento de estados.
Se ejecuta después de que los archivos son procesados para generar intervalos de estados.
"""
from datetime import datetime
from typing import List, Dict, Optional
from sqlalchemy.orm import Session

from backend.services.state_processor_service import StateProcessorService
from backend.utils.logger import logger


class UploadIntegrationService:
    """
    Integra el procesamiento de archivos con la generación de estados operativos.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.state_processor = StateProcessorService(db)
    
    def process_uploaded_day(
        self,
        vehicle_id: str,
        organization_id: int,
        date: datetime
    ) -> Dict:
        """
        Procesa un día de datos recién subidos y genera intervalos de estados.
        
        Args:
            vehicle_id: ID del vehículo
            organization_id: ID de la organización
            date: Fecha del día procesado
            
        Returns:
            Dict con resultados del procesamiento
        """
        try:
            logger.info(f"Integrando procesamiento para {vehicle_id} - {date.date()}")
            
            # 1. Obtener datos de geocercas (Radar.com)
            geofence_events = self._get_geofence_events(vehicle_id, date)
            logger.info(f"  ✓ {len(geofence_events)} eventos de geocercas")
            
            # 2. Obtener datos GPS
            gps_data = self._get_gps_data(vehicle_id, date)
            logger.info(f"  ✓ {len(gps_data)} puntos GPS")
            
            # 3. Obtener datos de rotativo
            rotativo_data = self._get_rotativo_data(vehicle_id, date)
            logger.info(f"  ✓ {len(rotativo_data)} registros de rotativo")
            
            # 4. Procesar estados si hay datos suficientes
            if not gps_data and not geofence_events:
                logger.warning(f"  ⚠ No hay datos suficientes para procesar estados")
                return {
                    'success': False,
                    'message': 'Datos insuficientes para generar estados',
                    'intervals_generated': 0
                }
            
            # 5. Generar intervalos de estados
            intervals = self.state_processor.process_vehicle_day(
                vehicle_id=vehicle_id,
                organization_id=organization_id,
                date=date,
                geofence_events=geofence_events,
                gps_data=gps_data,
                rotativo_data=rotativo_data
            )
            
            logger.info(f"  ✓ {len(intervals)} intervalos de estados generados")
            
            return {
                'success': True,
                'intervals_generated': len(intervals),
                'message': f'Procesados {len(intervals)} intervalos de estados'
            }
            
        except Exception as e:
            logger.error(f"Error en integración de procesamiento: {e}")
            return {
                'success': False,
                'message': f'Error: {str(e)}',
                'intervals_generated': 0
            }
    
    def _get_geofence_events(
        self,
        vehicle_id: str,
        date: datetime
    ) -> List[Dict]:
        """
        Obtiene eventos de geocercas desde Radar.com o tabla local.
        """
        try:
            # Query a tabla de eventos de geocercas si existe
            from sqlalchemy import text
            
            query = text("""
                SELECT 
                    timestamp,
                    event_type,
                    geofence_type,
                    geofence_id
                FROM geofence_events
                WHERE vehicle_id = :vehicle_id
                AND DATE(timestamp) = DATE(:date)
                ORDER BY timestamp
            """)
            
            result = self.db.execute(
                query,
                {'vehicle_id': vehicle_id, 'date': date}
            ).fetchall()
            
            events = []
            for row in result:
                events.append({
                    'timestamp': row[0].isoformat() if row[0] else None,
                    'event_type': row[1],
                    'geofence_type': row[2],
                    'geofence_id': row[3]
                })
            
            return events
            
        except Exception as e:
            logger.warning(f"No se pudieron obtener eventos de geocercas: {e}")
            return []
    
    def _get_gps_data(
        self,
        vehicle_id: str,
        date: datetime
    ) -> List[Dict]:
        """
        Obtiene datos GPS procesados del día.
        """
        try:
            from sqlalchemy import text
            
            query = text("""
                SELECT 
                    timestamp,
                    latitude,
                    longitude,
                    speed
                FROM gps_measurements
                WHERE vehicle_id = :vehicle_id
                AND DATE(timestamp) = DATE(:date)
                ORDER BY timestamp
            """)
            
            result = self.db.execute(
                query,
                {'vehicle_id': vehicle_id, 'date': date}
            ).fetchall()
            
            gps_points = []
            for row in result:
                gps_points.append({
                    'timestamp': row[0].isoformat() if row[0] else None,
                    'latitude': float(row[1]) if row[1] else None,
                    'longitude': float(row[2]) if row[2] else None,
                    'speed': float(row[3]) if row[3] else 0
                })
            
            return gps_points
            
        except Exception as e:
            logger.warning(f"No se pudieron obtener datos GPS: {e}")
            return []
    
    def _get_rotativo_data(
        self,
        vehicle_id: str,
        date: datetime
    ) -> List[Dict]:
        """
        Obtiene datos de rotativo del día.
        """
        try:
            from sqlalchemy import text
            
            query = text("""
                SELECT 
                    timestamp,
                    rotativo,
                    clave
                FROM rotativo_data
                WHERE vehicle_id = :vehicle_id
                AND DATE(timestamp) = DATE(:date)
                ORDER BY timestamp
            """)
            
            result = self.db.execute(
                query,
                {'vehicle_id': vehicle_id, 'date': date}
            ).fetchall()
            
            rotativo_records = []
            for row in result:
                rotativo_records.append({
                    'timestamp': row[0].isoformat() if row[0] else None,
                    'rotativo': bool(row[1]) if row[1] is not None else False,
                    'clave': int(row[2]) if row[2] is not None else 0
                })
            
            return rotativo_records
            
        except Exception as e:
            logger.warning(f"No se pudieron obtener datos de rotativo: {e}")
            return []
    
    def process_batch(
        self,
        vehicle_dates: List[tuple]
    ) -> Dict:
        """
        Procesa múltiples días de múltiples vehículos.
        
        Args:
            vehicle_dates: Lista de tuplas (vehicle_id, organization_id, date)
            
        Returns:
            Dict con estadísticas del procesamiento
        """
        total_processed = 0
        total_intervals = 0
        errors = []
        
        for vehicle_id, organization_id, date in vehicle_dates:
            try:
                result = self.process_uploaded_day(vehicle_id, organization_id, date)
                if result['success']:
                    total_processed += 1
                    total_intervals += result['intervals_generated']
                else:
                    errors.append({
                        'vehicle_id': vehicle_id,
                        'date': date.isoformat(),
                        'error': result['message']
                    })
            except Exception as e:
                errors.append({
                    'vehicle_id': vehicle_id,
                    'date': date.isoformat(),
                    'error': str(e)
                })
        
        return {
            'total_days_processed': total_processed,
            'total_intervals_generated': total_intervals,
            'errors': errors
        }

