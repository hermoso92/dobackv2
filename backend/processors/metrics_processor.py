from typing import Dict, List
import pandas as pd
import numpy as np
from sqlalchemy import text
from sqlalchemy.orm import Session

class MetricsProcessor:
    def __init__(self, db_session: Session):
        self.session = db_session
        
    def process_metrics(self, session_id: int):
        """Procesa las métricas de una sesión."""
        try:
            # 1. Obtener datos brutos
            raw_data = self._get_raw_data(session_id)
            
            # 2. Calcular métricas
            metrics = self._calculate_metrics(raw_data)
            
            # 3. Insertar métricas procesadas
            self._insert_processed_metrics(metrics, session_id)
            
        except Exception as e:
            print(f"Error procesando métricas: {str(e)}")
    
    def _get_raw_data(self, session_id: int) -> pd.DataFrame:
        """Obtiene los datos brutos de la sesión."""
        return pd.read_sql(
            text("""
                SELECT * FROM stability_data 
                WHERE session_id = :id
                ORDER BY timestamp
            """),
            self.session.bind,
            params={"id": session_id}
        )
    
    def _calculate_metrics(self, data: pd.DataFrame) -> pd.DataFrame:
        """Calcula las métricas de estabilidad."""
        metrics = pd.DataFrame()
        
        # Timestamps
        metrics["timestamp"] = data["timestamp"]
        
        # Métricas básicas
        metrics["velocity"] = data["velocity"]
        metrics["acceleration"] = data["acceleration"]
        metrics["roll"] = data["roll"]
        metrics["pitch"] = data["pitch"]
        metrics["yaw"] = data["yaw"]
        
        # Métricas derivadas
        metrics["roll_rate"] = self._calculate_rate(data["roll"])
        metrics["pitch_rate"] = self._calculate_rate(data["pitch"])
        metrics["yaw_rate"] = self._calculate_rate(data["yaw"])
        
        # Métricas de estabilidad
        metrics["lateral_acceleration"] = self._calculate_lateral_acceleration(data)
        metrics["vertical_acceleration"] = self._calculate_vertical_acceleration(data)
        metrics["stability_index"] = self._calculate_stability_index(metrics)
        
        return metrics
    
    def _calculate_rate(self, series: pd.Series) -> pd.Series:
        """Calcula la tasa de cambio de una serie."""
        return series.diff() / series.index.to_series().diff().dt.total_seconds()
    
    def _calculate_lateral_acceleration(self, data: pd.DataFrame) -> pd.Series:
        """Calcula la aceleración lateral."""
        return data["velocity"] * data["yaw_rate"]
    
    def _calculate_vertical_acceleration(self, data: pd.DataFrame) -> pd.Series:
        """Calcula la aceleración vertical."""
        return data["acceleration"] * np.sin(data["pitch"])
    
    def _calculate_stability_index(self, metrics: pd.DataFrame) -> pd.Series:
        """Calcula el índice de estabilidad."""
        # Pesos para cada componente
        weights = {
            "roll": 0.3,
            "pitch": 0.3,
            "yaw": 0.2,
            "lateral_acceleration": 0.1,
            "vertical_acceleration": 0.1
        }
        
        # Normalizar cada componente
        normalized = {}
        for component, weight in weights.items():
            if component in metrics.columns:
                normalized[component] = self._normalize_metric(metrics[component])
        
        # Calcular índice ponderado
        stability_index = pd.Series(0, index=metrics.index)
        for component, value in normalized.items():
            stability_index += value * weights[component]
            
        return stability_index
    
    def _normalize_metric(self, series: pd.Series) -> pd.Series:
        """Normaliza una métrica a un rango [0,1]."""
        min_val = series.min()
        max_val = series.max()
        if max_val == min_val:
            return pd.Series(0.5, index=series.index)
        return (series - min_val) / (max_val - min_val)
    
    def _insert_processed_metrics(self, metrics: pd.DataFrame, session_id: int):
        """Inserta las métricas procesadas en la base de datos."""
        try:
            # Convertir DataFrame a lista de diccionarios
            records = metrics.to_dict("records")
            
            # Insertar en batch
            self.session.execute(
                text("""
                    INSERT INTO processed_session_metrics 
                    (session_id, timestamp, velocity, acceleration, roll, pitch, yaw,
                     roll_rate, pitch_rate, yaw_rate, lateral_acceleration,
                     vertical_acceleration, stability_index)
                    VALUES 
                    (:session_id, :timestamp, :velocity, :acceleration, :roll, :pitch, :yaw,
                     :roll_rate, :pitch_rate, :yaw_rate, :lateral_acceleration,
                     :vertical_acceleration, :stability_index)
                """),
                [{"session_id": session_id, **record} for record in records]
            )
            self.session.commit()
            
        except Exception as e:
            print(f"Error insertando métricas procesadas: {str(e)}")
            self.session.rollback() 