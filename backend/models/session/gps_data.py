from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class GPSData(Base):
    __tablename__ = 'gps_data'

    id = Column(Integer, primary_key=True)
    
    # Relaciones
    session_id = Column(Integer, ForeignKey('stability_sessions.id'), nullable=False)
    
    # Timestamp
    timestamp = Column(DateTime, nullable=False)
    
    # Coordenadas
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude = Column(Float)
    
    # Datos de movimiento
    speed = Column(Float)  # en km/h
    heading = Column(Float)  # en grados
    acceleration = Column(Float)  # en m/s²
    
    # Calidad de señal
    satellites = Column(Integer)
    hdop = Column(Float)  # Horizontal Dilution of Precision
    fix_quality = Column(Integer)  # 0=invalid, 1=GPS fix, 2=DGPS fix
    
    # Metadata
    metadata = Column(JSON)  # Datos adicionales
    created_at = Column(DateTime, server_default=func.now())
    
    # Relaciones
    session = relationship("StabilitySession", back_populates="gps_data")
    
    def __repr__(self):
        return f"<GPSData {self.timestamp} - Lat: {self.latitude}, Lon: {self.longitude}>"
        
    @property
    def coordinates(self):
        """Retorna las coordenadas como tupla (lat, lon)"""
        return (self.latitude, self.longitude)
        
    @property
    def has_valid_fix(self):
        """Retorna si tiene una fijación GPS válida"""
        return self.fix_quality > 0
        
    @property
    def has_high_accuracy(self):
        """Retorna si tiene alta precisión"""
        return self.hdop is not None and self.hdop < 2.0
        
    def to_dict(self):
        """Convierte el objeto a diccionario"""
        return {
            'id': self.id,
            'session_id': self.session_id,
            'timestamp': self.timestamp.isoformat(),
            'latitude': self.latitude,
            'longitude': self.longitude,
            'altitude': self.altitude,
            'speed': self.speed,
            'heading': self.heading,
            'acceleration': self.acceleration,
            'satellites': self.satellites,
            'hdop': self.hdop,
            'fix_quality': self.fix_quality,
            'metadata': self.metadata,
            'created_at': self.created_at.isoformat(),
            'has_valid_fix': self.has_valid_fix,
            'has_high_accuracy': self.has_high_accuracy
        }
        
    @classmethod
    def create_gps_point(cls, session_id, timestamp, latitude, longitude, **kwargs):
        """Crea un nuevo punto GPS"""
        return cls(
            session_id=session_id,
            timestamp=timestamp,
            latitude=latitude,
            longitude=longitude,
            **kwargs
        ) 