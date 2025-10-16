"""
Servicio para calcular y agregar KPIs operativos.
Consulta intervalos de estados y datos crudos para generar métricas.
"""
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

# Usar consultas SQL directas para OperationalStateSegment
from backend.utils.logger import logger


class KPIService:
    """
    Servicio para calcular KPIs operativos basados en intervalos de estados.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_states_summary(
        self,
        organization_id: str,
        vehicle_ids: Optional[List[str]] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None
    ) -> Dict:
        """
        Obtiene resumen de estados (claves 0-5) agregados por duración.
        
        Returns:
            {
                'states': [
                    {'key': 0, 'name': 'Taller', 'duration_seconds': 3600, 'count': 2},
                    ...
                ],
                'total_time_seconds': 86400,
                'time_outside_station': 25200  # Claves 2+3+4+5
            }
        """
        try:
            # Construir query SQL directa
            from sqlalchemy import text
            
            # Construir filtros WHERE
            where_conditions = ["s.\"organizationId\" = :org_id"]
            params = {'org_id': organization_id}
            
            if vehicle_ids:
                where_conditions.append("s.\"vehicleId\" = ANY(:vehicle_ids)")
                params['vehicle_ids'] = vehicle_ids
            
            if from_date:
                where_conditions.append("oss.\"startTime\" >= :from_date")
                params['from_date'] = from_date
            
            if to_date:
                where_conditions.append("oss.\"endTime\" <= :to_date")
                params['to_date'] = to_date
            
            where_clause = " AND ".join(where_conditions)
            
            query = text(f"""
                SELECT 
                    oss.clave,
                    SUM(oss.\"durationSeconds\") as total_duration,
                    COUNT(oss.id) as count
                FROM operational_state_segments oss
                JOIN "Session" s ON oss.\"sessionId\" = s.id
                WHERE {where_clause}
                GROUP BY oss.clave
                ORDER BY oss.clave
            """)
            
            results = self.db.execute(query, params).fetchall()
            
            # Mapeo de nombres de estados
            state_names = {
                0: "Taller",
                1: "Operativo en Parque",
                2: "Salida en Emergencia",
                3: "En Siniestro",
                4: "Fin de Actuación",
                5: "Regreso al Parque"
            }
            
            states = []
            total_time = 0
            time_outside = 0  # Claves 2+3+4+5
            
            for row in results:
                state_key = row.clave
                duration = int(row.total_duration or 0)
                count = int(row.count or 0)
                
                states.append({
                    'key': state_key,
                    'name': state_names.get(state_key, f'Estado {state_key}'),
                    'duration_seconds': duration,
                    'duration_formatted': self._format_duration(duration),
                    'count': count
                })
                
                total_time += duration
                
                # Tiempo fuera del parque = claves 2+3+4+5
                if state_key in [2, 3, 4, 5]:
                    time_outside += duration
            
            # Asegurar que todos los estados estén presentes (aunque sea con 0)
            existing_keys = {s['key'] for s in states}
            for key in range(6):
                if key not in existing_keys:
                    states.append({
                        'key': key,
                        'name': state_names.get(key, f'Estado {key}'),
                        'duration_seconds': 0,
                        'duration_formatted': '00:00:00',
                        'count': 0
                    })
            
            # Ordenar por clave
            states.sort(key=lambda x: x['key'])
            
            return {
                'states': states,
                'total_time_seconds': total_time,
                'total_time_formatted': self._format_duration(total_time),
                'time_outside_station': time_outside,
                'time_outside_formatted': self._format_duration(time_outside)
            }
        
        except Exception as e:
            logger.error(f"Error calculando resumen de estados: {e}")
            return {
                'states': [],
                'total_time_seconds': 0,
                'total_time_formatted': '00:00:00',
                'time_outside_station': 0,
                'time_outside_formatted': '00:00:00'
            }
    
    def get_activity_metrics(
        self,
        organization_id: str,
        vehicle_ids: Optional[List[str]] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None
    ) -> Dict:
        """
        Calcula métricas de actividad (km, horas conducción, rotativo, salidas emergencia).
        
        Returns:
            {
                'km_total': 450.5,
                'driving_hours': 8.5,
                'driving_hours_formatted': '08:30:00',
                'rotativo_on_seconds': 7200,
                'rotativo_on_percentage': 25.5,
                'rotativo_on_formatted': '02:00:00',
                'emergency_departures': 12
            }
        """
        try:
            # Obtener datos de GPS para calcular km (esto debería venir de otra tabla)
            # Por ahora usamos una aproximación
            km_total = self._calculate_distance_traveled(
                organization_id, vehicle_ids, from_date, to_date
            )
            
            # Calcular horas de conducción (tiempo fuera de parque y taller)
            driving_time = self._calculate_driving_time(
                organization_id, vehicle_ids, from_date, to_date
            )
            
            # Calcular tiempo con rotativo ON (Clave 2 principalmente)
            rotativo_time = self._calculate_rotativo_time(
                organization_id, vehicle_ids, from_date, to_date
            )
            
            # Contar salidas en emergencia (inicios de Clave 2)
            emergency_departures = self._count_emergency_departures(
                organization_id, vehicle_ids, from_date, to_date
            )
            
            # Calcular porcentaje de tiempo con rotativo
            rotativo_percentage = 0
            if driving_time > 0:
                rotativo_percentage = (rotativo_time / driving_time) * 100
            
            return {
                'km_total': round(km_total, 1),
                'driving_hours': round(driving_time / 3600, 1),
                'driving_hours_formatted': self._format_duration(int(driving_time)),
                'rotativo_on_seconds': rotativo_time,
                'rotativo_on_percentage': round(rotativo_percentage, 1),
                'rotativo_on_formatted': self._format_duration(rotativo_time),
                'emergency_departures': emergency_departures
            }
        
        except Exception as e:
            logger.error(f"Error calculando métricas de actividad: {e}")
            return {
                'km_total': 0,
                'driving_hours': 0,
                'driving_hours_formatted': '00:00:00',
                'rotativo_on_seconds': 0,
                'rotativo_on_percentage': 0,
                'rotativo_on_formatted': '00:00:00',
                'emergency_departures': 0
            }
    
    def get_stability_metrics(
        self,
        organization_id: str,
        vehicle_ids: Optional[List[str]] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None
    ) -> Dict:
        """
        Obtiene métricas de incidencias de estabilidad.
        
        Returns:
            {
                'total_incidents': 45,
                'critical': 5,
                'moderate': 15,
                'light': 25
            }
        """
        try:
            # Aquí deberías consultar la tabla de eventos de estabilidad
            # Por ahora retornamos estructura vacía
            # Esto se debe conectar con la tabla stability_events
            
            from sqlalchemy import text
            
            # Query directo a stability_events
            query = text("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN severity = 'G' THEN 1 ELSE 0 END) as critical,
                    SUM(CASE WHEN severity = 'M' THEN 1 ELSE 0 END) as moderate,
                    SUM(CASE WHEN severity = 'L' THEN 1 ELSE 0 END) as light
                FROM stability_events
                WHERE organization_id = :org_id
                AND (:from_date IS NULL OR timestamp >= :from_date)
                AND (:to_date IS NULL OR timestamp <= :to_date)
                AND (:vehicle_ids IS NULL OR vehicle_id = ANY(:vehicle_ids))
            """)
            
            result = self.db.execute(
                query,
                {
                    'org_id': organization_id,
                    'from_date': from_date,
                    'to_date': to_date,
                    'vehicle_ids': vehicle_ids
                }
            ).fetchone()
            
            if result:
                return {
                    'total_incidents': int(result[0] or 0),
                    'critical': int(result[1] or 0),
                    'moderate': int(result[2] or 0),
                    'light': int(result[3] or 0)
                }
            else:
                return {
                    'total_incidents': 0,
                    'critical': 0,
                    'moderate': 0,
                    'light': 0
                }
        
        except Exception as e:
            logger.error(f"Error calculando métricas de estabilidad: {e}")
            return {
                'total_incidents': 0,
                'critical': 0,
                'moderate': 0,
                'light': 0
            }
    
    # Métodos auxiliares privados
    
    def _calculate_distance_traveled(
        self,
        organization_id: str,
        vehicle_ids: Optional[List[str]],
        from_date: Optional[datetime],
        to_date: Optional[datetime]
    ) -> float:
        """Calcula distancia total recorrida basándose en datos GPS."""
        try:
            # Query para obtener suma de distancias de sesiones GPS
            from sqlalchemy import text
            
            query = text("""
                SELECT COALESCE(SUM(distance_km), 0) as total_km
                FROM gps_sessions
                WHERE organization_id = :org_id
                AND (:from_date IS NULL OR start_time >= :from_date)
                AND (:to_date IS NULL OR end_time <= :to_date)
                AND (:vehicle_ids IS NULL OR vehicle_id = ANY(:vehicle_ids))
            """)
            
            result = self.db.execute(
                query,
                {
                    'org_id': organization_id,
                    'from_date': from_date,
                    'to_date': to_date,
                    'vehicle_ids': vehicle_ids
                }
            ).fetchone()
            
            return float(result[0] or 0) if result else 0.0
        except Exception as e:
            logger.error(f"Error calculando distancia: {e}")
            return 0.0
    
    def _calculate_driving_time(
        self,
        organization_id: str,
        vehicle_ids: Optional[List[str]],
        from_date: Optional[datetime],
        to_date: Optional[datetime]
    ) -> int:
        """Calcula tiempo total de conducción (fuera de parque y taller)."""
        from sqlalchemy import text
        
        # Construir filtros WHERE
        where_conditions = [
            "s.\"organizationId\" = :org_id",
            "oss.clave IN (2, 3, 4, 5)"
        ]
        params = {'org_id': organization_id}
        
        if vehicle_ids:
            where_conditions.append("s.\"vehicleId\" = ANY(:vehicle_ids)")
            params['vehicle_ids'] = vehicle_ids
        
        if from_date:
            where_conditions.append("oss.\"startTime\" >= :from_date")
            params['from_date'] = from_date
        
        if to_date:
            where_conditions.append("oss.\"endTime\" <= :to_date")
            params['to_date'] = to_date
        
        where_clause = " AND ".join(where_conditions)
        
        query = text(f"""
            SELECT SUM(oss.\"durationSeconds\") as total_duration
            FROM operational_state_segments oss
            JOIN "Session" s ON oss.\"sessionId\" = s.id
            WHERE {where_clause}
        """)
        
        result = self.db.execute(query, params).scalar()
        return int(result or 0)
    
    def _calculate_rotativo_time(
        self,
        organization_id: str,
        vehicle_ids: Optional[List[str]],
        from_date: Optional[datetime],
        to_date: Optional[datetime]
    ) -> int:
        """Calcula tiempo total con rotativo ON (Clave 2 principalmente)."""
        from sqlalchemy import text
        
        # Construir filtros WHERE
        where_conditions = [
            "s.\"organizationId\" = :org_id",
            "oss.clave = 2"  # Salida en emergencia
        ]
        params = {'org_id': organization_id}
        
        if vehicle_ids:
            where_conditions.append("s.\"vehicleId\" = ANY(:vehicle_ids)")
            params['vehicle_ids'] = vehicle_ids
        
        if from_date:
            where_conditions.append("oss.\"startTime\" >= :from_date")
            params['from_date'] = from_date
        
        if to_date:
            where_conditions.append("oss.\"endTime\" <= :to_date")
            params['to_date'] = to_date
        
        where_clause = " AND ".join(where_conditions)
        
        query = text(f"""
            SELECT SUM(oss.\"durationSeconds\") as total_duration
            FROM operational_state_segments oss
            JOIN "Session" s ON oss.\"sessionId\" = s.id
            WHERE {where_clause}
        """)
        
        result = self.db.execute(query, params).scalar()
        return int(result or 0)
    
    def _count_emergency_departures(
        self,
        organization_id: str,
        vehicle_ids: Optional[List[str]],
        from_date: Optional[datetime],
        to_date: Optional[datetime]
    ) -> int:
        """Cuenta número de salidas en emergencia (inicios de Clave 2)."""
        from sqlalchemy import text
        
        # Construir filtros WHERE
        where_conditions = [
            "s.\"organizationId\" = :org_id",
            "oss.clave = 2"  # Salida en emergencia
        ]
        params = {'org_id': organization_id}
        
        if vehicle_ids:
            where_conditions.append("s.\"vehicleId\" = ANY(:vehicle_ids)")
            params['vehicle_ids'] = vehicle_ids
        
        if from_date:
            where_conditions.append("oss.\"startTime\" >= :from_date")
            params['from_date'] = from_date
        
        if to_date:
            where_conditions.append("oss.\"startTime\" <= :to_date")
            params['to_date'] = to_date
        
        where_clause = " AND ".join(where_conditions)
        
        query = text(f"""
            SELECT COUNT(oss.id) as count
            FROM operational_state_segments oss
            JOIN "Session" s ON oss.\"sessionId\" = s.id
            WHERE {where_clause}
        """)
        
        result = self.db.execute(query, params).scalar()
        return int(result or 0)
    
    def _format_duration(self, seconds: int) -> str:
        """Formatea duración en segundos a formato HH:MM:SS."""
        if seconds < 0:
            seconds = 0
        
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        secs = seconds % 60
        
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"

