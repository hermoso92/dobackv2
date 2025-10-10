from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy import text
from sqlalchemy.orm import Session

class DataInterpolator:
    def __init__(self, db_session: Session):
        self.session = db_session
        
    def interpolate_session_data(self, session_id: int) -> pd.DataFrame:
        """Interpola todos los datos de una sesión a 1Hz."""
        try:
            # 1. Obtener datos de todas las fuentes
            gps_data = self._get_gps_data(session_id)
            can_data = self._get_can_data(session_id)
            stability_data = self._get_stability_data(session_id)
            
            # 2. Generar timeline común
            timeline = self._generate_timeline(session_id)
            
            # 3. Interpolar cada fuente
            interpolated_gps = self._interpolate_source(gps_data, timeline, 'gps')
            interpolated_can = self._interpolate_source(can_data, timeline, 'can')
            interpolated_stability = self._interpolate_source(stability_data, timeline, 'stability')
            
            # 4. Combinar datos interpolados
            combined_data = self._combine_interpolated_data(
                timeline,
                interpolated_gps,
                interpolated_can,
                interpolated_stability
            )
            
            # 5. Calcular calidad de interpolación
            quality_scores = self._calculate_quality_scores(
                combined_data,
                gps_data,
                can_data,
                stability_data
            )
            
            # 6. Insertar datos interpolados
            self._insert_interpolated_data(combined_data, session_id, quality_scores)
            
            return combined_data
            
        except Exception as e:
            print(f"Error interpolando datos: {str(e)}")
            raise
    
    def _get_gps_data(self, session_id: int) -> pd.DataFrame:
        """Obtiene datos GPS de la sesión."""
        return pd.read_sql(
            text("""
                SELECT timestamp, latitude, longitude, altitude, speed, heading
                FROM gps_data 
                WHERE session_id = :id
                ORDER BY timestamp
            """),
            self.session.bind,
            params={"id": session_id}
        )
    
    def _get_can_data(self, session_id: int) -> pd.DataFrame:
        """Obtiene datos CAN de la sesión."""
        return pd.read_sql(
            text("""
                SELECT timestamp, engine_rpm, vehicle_speed, fuel_system_status
                FROM can_data 
                WHERE session_id = :id
                ORDER BY timestamp
            """),
            self.session.bind,
            params={"id": session_id}
        )
    
    def _get_stability_data(self, session_id: int) -> pd.DataFrame:
        """Obtiene datos de estabilidad de la sesión."""
        return pd.read_sql(
            text("""
                SELECT timestamp, roll, pitch, yaw, lateral_acc, vertical_acc
                FROM stability_data 
                WHERE session_id = :id
                ORDER BY timestamp
            """),
            self.session.bind,
            params={"id": session_id}
        )
    
    def _generate_timeline(self, session_id: int) -> pd.DatetimeIndex:
        """Genera un timeline común de 1Hz para la sesión."""
        # Obtener rango temporal de la sesión
        result = self.session.execute(
            text("""
                SELECT session_timestamp, session_duration
                FROM stability_sessions
                WHERE id = :id
            """),
            {"id": session_id}
        ).fetchone()
        
        start_time = result[0]
        duration = result[1]
        
        # Generar timestamps cada segundo
        return pd.date_range(
            start=start_time,
            periods=duration,
            freq='1S'
        )
    
    def _interpolate_source(self, data: pd.DataFrame, timeline: pd.DatetimeIndex, source: str) -> pd.DataFrame:
        """Interpola datos de una fuente al timeline común."""
        if data.empty:
            return pd.DataFrame(index=timeline)
            
        # Configurar índice temporal
        data = data.set_index('timestamp')
        
        # Interpolar cada columna
        interpolated = pd.DataFrame(index=timeline)
        for column in data.columns:
            interpolated[f"{source}_{column}"] = np.interp(
                timeline.astype(np.int64),
                data.index.astype(np.int64),
                data[column].values,
                left=np.nan,
                right=np.nan
            )
            
        return interpolated
    
    def _combine_interpolated_data(self, timeline: pd.DatetimeIndex, *dataframes) -> pd.DataFrame:
        """Combina todos los datos interpolados."""
        combined = pd.DataFrame(index=timeline)
        
        for df in dataframes:
            if not df.empty:
                combined = combined.join(df)
                
        return combined
    
    def _calculate_quality_scores(self, interpolated: pd.DataFrame, *source_data) -> Dict:
        """Calcula métricas de calidad de la interpolación."""
        quality = {}
        
        # Calcular gaps por fuente
        for i, source in enumerate(['gps', 'can', 'stability']):
            if not source_data[i].empty:
                original_timestamps = source_data[i]['timestamp']
                interpolated_timestamps = interpolated.index
                
                # Detectar gaps
                gaps = self._detect_gaps(original_timestamps, interpolated_timestamps)
                
                # Calcular score de calidad
                quality[f"{source}_quality"] = self._calculate_source_quality(
                    gaps,
                    len(original_timestamps),
                    len(interpolated_timestamps)
                )
                
        return quality
    
    def _detect_gaps(self, original: pd.Series, interpolated: pd.DatetimeIndex) -> List[Dict]:
        """Detecta gaps en los datos."""
        gaps = []
        last_timestamp = None
        
        for ts in original:
            if last_timestamp is not None:
                gap = (ts - last_timestamp).total_seconds()
                if gap > 1.0:  # Gap mayor a 1 segundo
                    gaps.append({
                        "start": last_timestamp,
                        "end": ts,
                        "duration": gap
                    })
            last_timestamp = ts
            
        return gaps
    
    def _calculate_source_quality(self, gaps: List[Dict], original_count: int, interpolated_count: int) -> float:
        """Calcula score de calidad para una fuente."""
        if original_count == 0:
            return 0.0
            
        # Calcular porcentaje de datos originales
        data_ratio = original_count / interpolated_count
        
        # Calcular impacto de gaps
        gap_impact = sum(gap["duration"] for gap in gaps) / interpolated_count
        
        # Score final (0-1)
        return max(0.0, min(1.0, data_ratio * (1 - gap_impact)))
    
    def _insert_interpolated_data(self, data: pd.DataFrame, session_id: int, quality_scores: Dict):
        """Inserta los datos interpolados en la base de datos."""
        try:
            # Convertir DataFrame a lista de diccionarios
            records = data.reset_index().to_dict("records")
            
            # Insertar datos interpolados
            self.session.execute(
                text("""
                    INSERT INTO interpolated_session_data 
                    (session_id, timestamp, data, quality_scores, created_at)
                    VALUES 
                    (:session_id, :timestamp, :data, :quality_scores, CURRENT_TIMESTAMP)
                """),
                [{
                    "session_id": session_id,
                    "timestamp": record["timestamp"],
                    "data": {k: v for k, v in record.items() if k != "timestamp"},
                    "quality_scores": quality_scores
                } for record in records]
            )
            
            # Actualizar métricas de calidad en la sesión
            self.session.execute(
                text("""
                    UPDATE stability_sessions 
                    SET interpolation_quality = :quality,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = :id
                """),
                {
                    "id": session_id,
                    "quality": quality_scores
                }
            )
            
            self.session.commit()
            
        except Exception as e:
            print(f"Error insertando datos interpolados: {str(e)}")
            self.session.rollback()
            raise 