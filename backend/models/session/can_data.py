from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class CANData(Base):
    __tablename__ = 'can_data'

    id = Column(Integer, primary_key=True)
    
    # Relaciones
    session_id = Column(Integer, ForeignKey('stability_sessions.id'), nullable=False)
    
    # Timestamp
    timestamp = Column(DateTime, nullable=False)
    
    # Identificación del mensaje
    can_id = Column(String(10), nullable=False)  # ID del mensaje CAN en hexadecimal
    message_type = Column(String(50))  # Tipo de mensaje (ej: velocidad, aceleración, etc)
    
    # Datos del vehículo
    speed = Column(Float)  # en km/h
    engine_rpm = Column(Float)
    throttle_position = Column(Float)  # en porcentaje
    brake_pressure = Column(Float)  # en bar
    steering_angle = Column(Float)  # en grados
    
    # Datos de estabilidad
    lateral_acceleration = Column(Float)  # en m/s²
    longitudinal_acceleration = Column(Float)  # en m/s²
    vertical_acceleration = Column(Float)  # en m/s²
    roll_rate = Column(Float)  # en grados/s
    pitch_rate = Column(Float)  # en grados/s
    yaw_rate = Column(Float)  # en grados/s
    
    # Datos del sistema
    system_status = Column(String(50))
    warning_flags = Column(Integer)
    
    # Metadata
    raw_data = Column(JSON)  # Datos crudos del mensaje CAN
    metadata = Column(JSON)  # Datos adicionales
    created_at = Column(DateTime, server_default=func.now())
    
    # Relaciones
    session = relationship("StabilitySession", back_populates="can_data")
    
    def __repr__(self):
        return f"<CANData {self.timestamp} - ID: {self.can_id}, Type: {self.message_type}>"
        
    @property
    def has_warnings(self):
        """Retorna si hay advertencias activas"""
        return self.warning_flags > 0
        
    @property
    def acceleration_vector(self):
        """Retorna el vector de aceleración (lateral, longitudinal, vertical)"""
        return (self.lateral_acceleration, self.longitudinal_acceleration, self.vertical_acceleration)
        
    @property
    def rotation_vector(self):
        """Retorna el vector de rotación (roll, pitch, yaw)"""
        return (self.roll_rate, self.pitch_rate, self.yaw_rate)
        
    def to_dict(self):
        """Convierte el objeto a diccionario"""
        return {
            'id': self.id,
            'session_id': self.session_id,
            'timestamp': self.timestamp.isoformat(),
            'can_id': self.can_id,
            'message_type': self.message_type,
            'speed': self.speed,
            'engine_rpm': self.engine_rpm,
            'throttle_position': self.throttle_position,
            'brake_pressure': self.brake_pressure,
            'steering_angle': self.steering_angle,
            'lateral_acceleration': self.lateral_acceleration,
            'longitudinal_acceleration': self.longitudinal_acceleration,
            'vertical_acceleration': self.vertical_acceleration,
            'roll_rate': self.roll_rate,
            'pitch_rate': self.pitch_rate,
            'yaw_rate': self.yaw_rate,
            'system_status': self.system_status,
            'warning_flags': self.warning_flags,
            'raw_data': self.raw_data,
            'metadata': self.metadata,
            'created_at': self.created_at.isoformat(),
            'has_warnings': self.has_warnings
        }
        
    @classmethod
    def create_can_message(cls, session_id, timestamp, can_id, **kwargs):
        """Crea un nuevo mensaje CAN"""
        return cls(
            session_id=session_id,
            timestamp=timestamp,
            can_id=can_id,
            **kwargs
        ) 