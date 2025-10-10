from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class StabilityData(Base):
    __tablename__ = 'stability_data'

    id = Column(Integer, primary_key=True)
    
    # Relaciones
    session_id = Column(Integer, ForeignKey('stability_sessions.id'), nullable=False)
    
    # Timestamp
    timestamp = Column(DateTime, nullable=False)
    
    # Datos de orientación
    roll_angle = Column(Float)  # en grados
    pitch_angle = Column(Float)  # en grados
    yaw_angle = Column(Float)  # en grados
    
    # Datos de aceleración
    lateral_acceleration = Column(Float)  # en m/s²
    longitudinal_acceleration = Column(Float)  # en m/s²
    vertical_acceleration = Column(Float)  # en m/s²
    
    # Datos de rotación
    roll_rate = Column(Float)  # en grados/s
    pitch_rate = Column(Float)  # en grados/s
    yaw_rate = Column(Float)  # en grados/s
    
    # Datos de estabilidad
    stability_index = Column(Float)  # Índice de estabilidad calculado
    risk_level = Column(String(20))  # Nivel de riesgo (BAJO, MEDIO, ALTO)
    
    # Datos del sistema
    sensor_status = Column(String(50))
    calibration_status = Column(String(50))
    
    # Metadata
    raw_data = Column(JSON)  # Datos crudos del sensor
    metadata = Column(JSON)  # Datos adicionales
    created_at = Column(DateTime, server_default=func.now())
    
    # Relaciones
    session = relationship("StabilitySession", back_populates="stability_data")
    
    def __repr__(self):
        return f"<StabilityData {self.timestamp} - Risk: {self.risk_level}>"
        
    @property
    def orientation_vector(self):
        """Retorna el vector de orientación (roll, pitch, yaw)"""
        return (self.roll_angle, self.pitch_angle, self.yaw_angle)
        
    @property
    def acceleration_vector(self):
        """Retorna el vector de aceleración (lateral, longitudinal, vertical)"""
        return (self.lateral_acceleration, self.longitudinal_acceleration, self.vertical_acceleration)
        
    @property
    def rotation_vector(self):
        """Retorna el vector de rotación (roll_rate, pitch_rate, yaw_rate)"""
        return (self.roll_rate, self.pitch_rate, self.yaw_rate)
        
    @property
    def is_calibrated(self):
        """Verifica si el sensor está calibrado"""
        return self.calibration_status == 'CALIBRATED'
        
    @property
    def is_stable(self):
        """Verifica si el vehículo está estable"""
        return self.stability_index > 0.7  # Umbral de estabilidad
        
    def to_dict(self):
        """Convierte el objeto a diccionario"""
        return {
            'id': self.id,
            'session_id': self.session_id,
            'timestamp': self.timestamp.isoformat(),
            'roll_angle': self.roll_angle,
            'pitch_angle': self.pitch_angle,
            'yaw_angle': self.yaw_angle,
            'lateral_acceleration': self.lateral_acceleration,
            'longitudinal_acceleration': self.longitudinal_acceleration,
            'vertical_acceleration': self.vertical_acceleration,
            'roll_rate': self.roll_rate,
            'pitch_rate': self.pitch_rate,
            'yaw_rate': self.yaw_rate,
            'stability_index': self.stability_index,
            'risk_level': self.risk_level,
            'sensor_status': self.sensor_status,
            'calibration_status': self.calibration_status,
            'raw_data': self.raw_data,
            'metadata': self.metadata,
            'created_at': self.created_at.isoformat(),
            'is_calibrated': self.is_calibrated,
            'is_stable': self.is_stable
        }
        
    @classmethod
    def create_stability_point(cls, session_id, timestamp, **kwargs):
        """Crea un nuevo punto de datos de estabilidad"""
        return cls(
            session_id=session_id,
            timestamp=timestamp,
            **kwargs
        ) 