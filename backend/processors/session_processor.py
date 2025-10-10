from typing import Dict, List
import pandas as pd
import numpy as np
from datetime import datetime
from sqlalchemy import text

class SessionProcessor:
    def __init__(self, db_session):
        self.session = db_session
    
    def create_session_record(self, session_data: Dict, file_id: int) -> int:
        """Crea un registro de sesión en la base de datos."""
        # Parsear cabecera
        header_parts = session_data["header"].split('\t')
        session_info = {
            "session_number": int(header_parts[3]),
            "session_timestamp": datetime.strptime(header_parts[1], "%d/%m/%Y %I:%M:%S%p"),
            "source_file_id": file_id,
            "processing_status": "pending"
        }
        
        # Insertar sesión
        result = self.session.execute(
            text("""
                INSERT INTO stability_sessions 
                (session_number, session_timestamp, source_file_id, processing_status)
                VALUES (:number, :timestamp, :file_id, :status)
                RETURNING id
            """),
            session_info
        )
        return result.fetchone()[0]
    
    def insert_session_data(self, session_data: Dict, session_id: int, file_type: str):
        """Inserta los datos de la sesión según su tipo."""
        if file_type == "GPS":
            self._insert_gps_data(session_data, session_id)
        elif file_type == "CAN":
            self._insert_can_data(session_data, session_id)
        elif file_type == "STABILITY":
            self._insert_stability_data(session_data, session_id)
    
    def _insert_gps_data(self, session_data: Dict, session_id: int):
        """Inserta datos GPS."""
        for line in session_data["data"]:
            parts = line.split(',')
            if len(parts) >= 7:
                self.session.execute(
                    text("""
                        INSERT INTO gps_data 
                        (session_id, timestamp, latitude, longitude, altitude, speed, satellites, quality)
                        VALUES (:session_id, :timestamp, :lat, :lon, :alt, :speed, :sat, :qual)
                    """),
                    {
                        "session_id": session_id,
                        "timestamp": datetime.strptime(parts[0] + parts[1], "%d/%m/%Y%I:%M:%S%p"),
                        "lat": float(parts[2]),
                        "lon": float(parts[3]),
                        "alt": float(parts[4]),
                        "speed": float(parts[5]),
                        "sat": int(parts[6]),
                        "qual": int(parts[7]) if len(parts) > 7 else None
                    }
                )
    
    def _insert_can_data(self, session_data: Dict, session_id: int):
        """Inserta datos CAN."""
        for line in session_data["data"]:
            parts = line.split(',')
            if len(parts) >= 8:
                self.session.execute(
                    text("""
                        INSERT INTO can_data 
                        (session_id, timestamp, engine_rpm, vehicle_speed, fuel_status)
                        VALUES (:session_id, :timestamp, :rpm, :speed, :fuel)
                    """),
                    {
                        "session_id": session_id,
                        "timestamp": datetime.strptime(parts[0], "%I:%M:%S%p"),
                        "rpm": float(parts[5]) if parts[5] else None,
                        "speed": float(parts[6]) if parts[6] else None,
                        "fuel": parts[7] if len(parts) > 7 else None
                    }
                )
    
    def _insert_stability_data(self, session_data: Dict, session_id: int):
        """Inserta datos de estabilidad."""
        for line in session_data["data"]:
            parts = line.split(';')
            if len(parts) >= 9:
                self.session.execute(
                    text("""
                        INSERT INTO stability_data 
                        (session_id, timestamp, acceleration, lateral_acceleration, 
                         vertical_acceleration, roll_angle, pitch_angle, yaw_angle)
                        VALUES (:session_id, :timestamp, :acc, :lat_acc, :vert_acc, 
                                :roll, :pitch, :yaw)
                    """),
                    {
                        "session_id": session_id,
                        "timestamp": datetime.strptime(parts[9], "%H:%M:%S.%f"),
                        "acc": float(parts[0]),
                        "lat_acc": float(parts[1]),
                        "vert_acc": float(parts[2]),
                        "roll": float(parts[6]),
                        "pitch": float(parts[7]),
                        "yaw": float(parts[8])
                    }
                )
    
    def interpolate_metrics(self, session_id: int):
        """Interpola métricas a 1Hz."""
        # Obtener datos
        gps_data = pd.read_sql(
            "SELECT * FROM gps_data WHERE session_id = :id",
            self.session.bind,
            params={"id": session_id}
        )
        can_data = pd.read_sql(
            "SELECT * FROM can_data WHERE session_id = :id",
            self.session.bind,
            params={"id": session_id}
        )
        stability_data = pd.read_sql(
            "SELECT * FROM stability_data WHERE session_id = :id",
            self.session.bind,
            params={"id": session_id}
        )
        
        # Crear índice temporal
        start_time = min(
            gps_data["timestamp"].min(),
            can_data["timestamp"].min(),
            stability_data["timestamp"].min()
        )
        end_time = max(
            gps_data["timestamp"].max(),
            can_data["timestamp"].max(),
            stability_data["timestamp"].max()
        )
        
        # Generar timestamps de 1Hz
        timestamps = pd.date_range(start=start_time, end=end_time, freq='1S')
        
        # Interpolar datos
        interpolated = pd.DataFrame(index=timestamps)
        
        # Interpolar GPS
        if not gps_data.empty:
            gps_data.set_index("timestamp", inplace=True)
            interpolated = interpolated.join(
                gps_data[["latitude", "longitude", "speed"]].interpolate(method='time')
            )
        
        # Interpolar CAN
        if not can_data.empty:
            can_data.set_index("timestamp", inplace=True)
            interpolated = interpolated.join(
                can_data[["engine_rpm", "vehicle_speed"]].interpolate(method='time')
            )
        
        # Interpolar Estabilidad
        if not stability_data.empty:
            stability_data.set_index("timestamp", inplace=True)
            interpolated = interpolated.join(
                stability_data[["roll_angle", "pitch_angle", "yaw_angle"]].interpolate(method='time')
            )
        
        # Calcular métricas adicionales
        interpolated["stability_score"] = self._calculate_stability_score(interpolated)
        interpolated["risk_level"] = self._calculate_risk_level(interpolated)
        
        # Insertar métricas procesadas
        for timestamp, row in interpolated.iterrows():
            self.session.execute(
                text("""
                    INSERT INTO processed_session_metrics 
                    (session_id, timestamp, latitude, longitude, velocity, 
                     pitch, roll, yaw, engine_rpm, stability_score, risk_level)
                    VALUES (:session_id, :timestamp, :lat, :lon, :vel, 
                            :pitch, :roll, :yaw, :rpm, :score, :risk)
                """),
                {
                    "session_id": session_id,
                    "timestamp": timestamp,
                    "lat": row.get("latitude"),
                    "lon": row.get("longitude"),
                    "vel": row.get("speed"),
                    "pitch": row.get("pitch_angle"),
                    "roll": row.get("roll_angle"),
                    "yaw": row.get("yaw_angle"),
                    "rpm": row.get("engine_rpm"),
                    "score": row.get("stability_score"),
                    "risk": row.get("risk_level")
                }
            )
    
    def _calculate_stability_score(self, data: pd.DataFrame) -> float:
        """Calcula el score de estabilidad basado en múltiples factores."""
        # Implementar lógica de cálculo
        return 0.0
    
    def _calculate_risk_level(self, data: pd.DataFrame) -> int:
        """Calcula el nivel de riesgo basado en múltiples factores."""
        # Implementar lógica de cálculo
        return 0 