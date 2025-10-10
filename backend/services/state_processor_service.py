"""
Servicio para procesar y calcular estados operativos de vehículos.
Transforma datos crudos (GPS, rotativo, geocercas) en intervalos de estados.
"""
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from backend.models.vehicle_state_interval import VehicleStateInterval
from backend.utils.logger import logger


class StateProcessorService:
    """
    Procesa datos crudos y calcula intervalos de estados operativos.
    
    Estados:
    0 - Taller
    1 - Operativo en Parque
    2 - Salida en Emergencia
    3 - En Siniestro
    4 - Fin de Actuación
    5 - Regreso al Parque
    """
    
    # Umbrales configurables
    STOPPED_THRESHOLD_SECONDS = 60  # 1 minuto parado para considerar Clave 3
    MOVEMENT_THRESHOLD_KMH = 5  # Velocidad mínima para considerar movimiento
    
    def __init__(self, db: Session):
        self.db = db
    
    def process_vehicle_day(
        self, 
        vehicle_id: str, 
        organization_id: int,
        date: datetime,
        geofence_events: List[Dict],
        gps_data: List[Dict],
        rotativo_data: List[Dict]
    ) -> List[VehicleStateInterval]:
        """
        Procesa un día completo de datos de un vehículo y genera intervalos de estados.
        
        Args:
            vehicle_id: ID del vehículo
            organization_id: ID de la organización
            date: Fecha a procesar
            geofence_events: Eventos de entrada/salida de geocercas de Radar.com
            gps_data: Datos GPS con posiciones y velocidades
            rotativo_data: Datos de estado del rotativo
            
        Returns:
            Lista de intervalos de estados creados
        """
        logger.info(f"Procesando estados del vehículo {vehicle_id} para {date.date()}")
        
        intervals = []
        
        # 1. Procesar estados basados en geocercas (Clave 0 y 1)
        geofence_intervals = self._process_geofence_states(
            vehicle_id, organization_id, geofence_events
        )
        intervals.extend(geofence_intervals)
        
        # 2. Procesar salidas en emergencia (Clave 2)
        # Requiere salida de parque + rotativo ON
        emergency_intervals = self._process_emergency_departures(
            vehicle_id, organization_id, geofence_events, rotativo_data, gps_data
        )
        intervals.extend(emergency_intervals)
        
        # 3. Procesar estados en siniestro (Clave 3)
        # Parado >1min en mismo punto
        incident_intervals = self._process_incident_states(
            vehicle_id, organization_id, gps_data, rotativo_data
        )
        intervals.extend(incident_intervals)
        
        # 4. Procesar regresos al parque (Clave 5)
        # Movimiento sin rotativo hacia parque
        return_intervals = self._process_return_to_station(
            vehicle_id, organization_id, geofence_events, rotativo_data, gps_data
        )
        intervals.extend(return_intervals)
        
        # 5. Calcular Clave 4 (fin de actuación) por diferencia
        # Es el tiempo entre Clave 3 y Clave 5
        end_intervals = self._calculate_end_of_operation(intervals)
        intervals.extend(end_intervals)
        
        # 6. Persistir intervalos en base de datos
        saved_intervals = self._save_intervals(intervals)
        
        logger.info(f"Procesados {len(saved_intervals)} intervalos para {vehicle_id}")
        return saved_intervals
    
    def _process_geofence_states(
        self,
        vehicle_id: str,
        organization_id: int,
        geofence_events: List[Dict]
    ) -> List[VehicleStateInterval]:
        """
        Procesa eventos de geocercas para generar estados Clave 0 (Taller) y Clave 1 (Parque).
        """
        intervals = []
        
        # Ordenar eventos por timestamp
        sorted_events = sorted(geofence_events, key=lambda x: x.get('timestamp', ''))
        
        # Rastrear entradas activas
        active_entries = {}
        
        for event in sorted_events:
            geofence_id = event.get('geofence_id')
            geofence_type = event.get('geofence_type', '').lower()  # 'parque' o 'taller'
            event_type = event.get('event_type', '').lower()  # 'entry' o 'exit'
            timestamp = datetime.fromisoformat(event.get('timestamp'))
            
            # Determinar clave de estado según tipo de geocerca
            if 'taller' in geofence_type:
                state_key = 0  # Taller
            elif 'parque' in geofence_type or 'park' in geofence_type:
                state_key = 1  # Parque
            else:
                continue
            
            if event_type == 'entry':
                # Registrar entrada
                active_entries[geofence_id] = {
                    'state_key': state_key,
                    'start_time': timestamp,
                    'geofence_id': geofence_id,
                    'geofence_type': geofence_type
                }
            elif event_type == 'exit' and geofence_id in active_entries:
                # Crear intervalo de entrada a salida
                entry = active_entries.pop(geofence_id)
                duration = int((timestamp - entry['start_time']).total_seconds())
                
                interval = VehicleStateInterval(
                    vehicle_id=vehicle_id,
                    organization_id=organization_id,
                    state_key=entry['state_key'],
                    start_time=entry['start_time'],
                    end_time=timestamp,
                    duration_seconds=duration,
                    origin='radar_geofence',
                    geofence_id=geofence_id,
                    metadata_json=json.dumps({'geofence_type': entry['geofence_type']})
                )
                intervals.append(interval)
        
        return intervals
    
    def _process_emergency_departures(
        self,
        vehicle_id: str,
        organization_id: int,
        geofence_events: List[Dict],
        rotativo_data: List[Dict],
        gps_data: List[Dict]
    ) -> List[VehicleStateInterval]:
        """
        Procesa salidas en emergencia (Clave 2).
        Requiere: salida de parque + rotativo ON.
        """
        intervals = []
        
        # Encontrar salidas de parque
        park_exits = [
            e for e in geofence_events 
            if e.get('event_type', '').lower() == 'exit' 
            and ('parque' in e.get('geofence_type', '').lower() or 'park' in e.get('geofence_type', '').lower())
        ]
        
        for exit_event in park_exits:
            exit_time = datetime.fromisoformat(exit_event.get('timestamp'))
            
            # Verificar si rotativo estaba ON en el momento de salida (±2 min)
            rotativo_on = self._is_rotativo_on(rotativo_data, exit_time, tolerance_seconds=120)
            
            if rotativo_on:
                # Buscar fin de estado: llegada al lugar (parado >1min) o cambio de rotativo
                end_time = self._find_arrival_time(gps_data, exit_time)
                
                if end_time:
                    duration = int((end_time - exit_time).total_seconds())
                    
                    interval = VehicleStateInterval(
                        vehicle_id=vehicle_id,
                        organization_id=organization_id,
                        state_key=2,  # Salida en emergencia
                        start_time=exit_time,
                        end_time=end_time,
                        duration_seconds=duration,
                        origin='rotativo',
                        geofence_id=exit_event.get('geofence_id'),
                        metadata_json=json.dumps({'exit_type': 'emergency'})
                    )
                    intervals.append(interval)
        
        return intervals
    
    def _process_incident_states(
        self,
        vehicle_id: str,
        organization_id: int,
        gps_data: List[Dict],
        rotativo_data: List[Dict]
    ) -> List[VehicleStateInterval]:
        """
        Procesa estados en siniestro (Clave 3).
        Detecta vehículo parado >1min en mismo punto.
        """
        intervals = []
        
        if not gps_data:
            return intervals
        
        # Ordenar por timestamp
        sorted_gps = sorted(gps_data, key=lambda x: x.get('timestamp', ''))
        
        stopped_start = None
        last_position = None
        
        for i, point in enumerate(sorted_gps):
            timestamp = datetime.fromisoformat(point.get('timestamp'))
            lat = point.get('latitude')
            lon = point.get('longitude')
            speed = point.get('speed', 0)
            
            # Considerar parado si velocidad < umbral
            is_stopped = speed < self.MOVEMENT_THRESHOLD_KMH
            
            if is_stopped:
                if stopped_start is None:
                    # Inicio de periodo parado
                    stopped_start = timestamp
                    last_position = (lat, lon)
                else:
                    # Verificar si sigue en mismo punto (±50m)
                    if self._is_same_location(last_position, (lat, lon), tolerance_meters=50):
                        # Calcular duración parado
                        stopped_duration = (timestamp - stopped_start).total_seconds()
                        
                        # Si >1min, crear/extender intervalo Clave 3
                        if stopped_duration > self.STOPPED_THRESHOLD_SECONDS:
                            # Verificar si ya hay un intervalo abierto
                            if not intervals or intervals[-1].end_time is not None:
                                # Crear nuevo intervalo
                                interval = VehicleStateInterval(
                                    vehicle_id=vehicle_id,
                                    organization_id=organization_id,
                                    state_key=3,  # En siniestro
                                    start_time=stopped_start,
                                    end_time=None,  # Aún activo
                                    duration_seconds=None,
                                    origin='gps_parado',
                                    metadata_json=json.dumps({
                                        'latitude': lat,
                                        'longitude': lon
                                    })
                                )
                                intervals.append(interval)
                    else:
                        # Se movió, cerrar intervalo si existe
                        if intervals and intervals[-1].end_time is None:
                            intervals[-1].end_time = timestamp
                            intervals[-1].duration_seconds = int(
                                (timestamp - intervals[-1].start_time).total_seconds()
                            )
                        stopped_start = None
            else:
                # En movimiento, cerrar intervalo si existe
                if stopped_start is not None:
                    if intervals and intervals[-1].end_time is None:
                        intervals[-1].end_time = timestamp
                        intervals[-1].duration_seconds = int(
                            (timestamp - intervals[-1].start_time).total_seconds()
                        )
                    stopped_start = None
        
        return intervals
    
    def _process_return_to_station(
        self,
        vehicle_id: str,
        organization_id: int,
        geofence_events: List[Dict],
        rotativo_data: List[Dict],
        gps_data: List[Dict]
    ) -> List[VehicleStateInterval]:
        """
        Procesa regresos al parque (Clave 5).
        Desde inicio de retorno (sin rotativo) hasta entrada en parque.
        """
        intervals = []
        
        # Encontrar entradas a parque
        park_entries = [
            e for e in geofence_events 
            if e.get('event_type', '').lower() == 'entry' 
            and ('parque' in e.get('geofence_type', '').lower() or 'park' in e.get('geofence_type', '').lower())
        ]
        
        for entry_event in park_entries:
            entry_time = datetime.fromisoformat(entry_event.get('timestamp'))
            
            # Buscar inicio de retorno: último cambio de rotativo OFF a ON antes de entrada
            return_start = self._find_return_start(rotativo_data, gps_data, entry_time)
            
            if return_start:
                duration = int((entry_time - return_start).total_seconds())
                
                interval = VehicleStateInterval(
                    vehicle_id=vehicle_id,
                    organization_id=organization_id,
                    state_key=5,  # Regreso al parque
                    start_time=return_start,
                    end_time=entry_time,
                    duration_seconds=duration,
                    origin='calculated',
                    geofence_id=entry_event.get('geofence_id'),
                    metadata_json=json.dumps({'return_type': 'to_station'})
                )
                intervals.append(interval)
        
        return intervals
    
    def _calculate_end_of_operation(
        self, 
        intervals: List[VehicleStateInterval]
    ) -> List[VehicleStateInterval]:
        """
        Calcula intervalos Clave 4 (fin de actuación) por diferencia.
        Es el tiempo entre fin de Clave 3 e inicio de Clave 5.
        """
        end_intervals = []
        
        # Ordenar intervalos por tiempo de inicio
        sorted_intervals = sorted(intervals, key=lambda x: x.start_time)
        
        for i, interval in enumerate(sorted_intervals):
            # Buscar fin de Clave 3
            if interval.state_key == 3 and interval.end_time:
                # Buscar siguiente Clave 5
                for j in range(i + 1, len(sorted_intervals)):
                    next_interval = sorted_intervals[j]
                    if next_interval.state_key == 5:
                        # Crear Clave 4 entre ellos
                        duration = int(
                            (next_interval.start_time - interval.end_time).total_seconds()
                        )
                        
                        if duration > 0:
                            end_interval = VehicleStateInterval(
                                vehicle_id=interval.vehicle_id,
                                organization_id=interval.organization_id,
                                state_key=4,  # Fin de actuación
                                start_time=interval.end_time,
                                end_time=next_interval.start_time,
                                duration_seconds=duration,
                                origin='calculated',
                                metadata_json=json.dumps({'calculated_from': 'key3_to_key5'})
                            )
                            end_intervals.append(end_interval)
                        break
        
        return end_intervals
    
    def _save_intervals(
        self, 
        intervals: List[VehicleStateInterval]
    ) -> List[VehicleStateInterval]:
        """
        Persiste intervalos en base de datos.
        """
        saved = []
        
        for interval in intervals:
            try:
                self.db.add(interval)
                self.db.commit()
                self.db.refresh(interval)
                saved.append(interval)
            except Exception as e:
                logger.error(f"Error guardando intervalo: {e}")
                self.db.rollback()
        
        return saved
    
    # Métodos auxiliares
    
    def _is_rotativo_on(
        self, 
        rotativo_data: List[Dict], 
        timestamp: datetime,
        tolerance_seconds: int = 60
    ) -> bool:
        """Verifica si el rotativo estaba ON en un momento dado."""
        for data in rotativo_data:
            data_time = datetime.fromisoformat(data.get('timestamp'))
            if abs((data_time - timestamp).total_seconds()) <= tolerance_seconds:
                return data.get('rotativo', False) or data.get('clave') == 2
        return False
    
    def _find_arrival_time(
        self, 
        gps_data: List[Dict], 
        start_time: datetime
    ) -> Optional[datetime]:
        """Encuentra el momento de llegada (primera vez parado >1min después de inicio)."""
        sorted_gps = sorted(
            [g for g in gps_data if datetime.fromisoformat(g.get('timestamp')) > start_time],
            key=lambda x: x.get('timestamp', '')
        )
        
        stopped_start = None
        last_position = None
        
        for point in sorted_gps:
            timestamp = datetime.fromisoformat(point.get('timestamp'))
            speed = point.get('speed', 0)
            lat = point.get('latitude')
            lon = point.get('longitude')
            
            if speed < self.MOVEMENT_THRESHOLD_KMH:
                if stopped_start is None:
                    stopped_start = timestamp
                    last_position = (lat, lon)
                else:
                    if self._is_same_location(last_position, (lat, lon)):
                        stopped_duration = (timestamp - stopped_start).total_seconds()
                        if stopped_duration > self.STOPPED_THRESHOLD_SECONDS:
                            return stopped_start
            else:
                stopped_start = None
        
        return None
    
    def _find_return_start(
        self,
        rotativo_data: List[Dict],
        gps_data: List[Dict],
        entry_time: datetime
    ) -> Optional[datetime]:
        """Encuentra el inicio del retorno (último movimiento sin rotativo antes de entrada)."""
        # Buscar último cambio de rotativo antes de entrada
        relevant_rotativo = [
            r for r in rotativo_data 
            if datetime.fromisoformat(r.get('timestamp')) < entry_time
        ]
        
        if not relevant_rotativo:
            return None
        
        # Ordenar inversamente (más reciente primero)
        sorted_rotativo = sorted(
            relevant_rotativo,
            key=lambda x: x.get('timestamp', ''),
            reverse=True
        )
        
        # Buscar primer momento con rotativo OFF
        for data in sorted_rotativo:
            if not data.get('rotativo', True) and data.get('clave') != 2:
                return datetime.fromisoformat(data.get('timestamp'))
        
        return None
    
    def _is_same_location(
        self, 
        pos1: Tuple[float, float], 
        pos2: Tuple[float, float],
        tolerance_meters: float = 50
    ) -> bool:
        """Verifica si dos posiciones GPS son el mismo lugar (con tolerancia)."""
        if not pos1 or not pos2:
            return False
        
        # Aproximación simple usando diferencia de coordenadas
        # 1 grado ≈ 111km, entonces tolerance_meters/111000 grados
        tolerance_deg = tolerance_meters / 111000
        
        lat_diff = abs(pos1[0] - pos2[0])
        lon_diff = abs(pos1[1] - pos2[1])
        
        return lat_diff <= tolerance_deg and lon_diff <= tolerance_deg

