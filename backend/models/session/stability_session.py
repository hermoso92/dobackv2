from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class StabilitySession(Base):
    __tablename__ = 'stability_sessions'

    id = Column(Integer, primary_key=True)
    
    # Relaciones
    vehicle_id = Column(Integer, ForeignKey('vehicles.id'), nullable=False)
    file_id = Column(Integer, ForeignKey('uploaded_files.id'), nullable=False)
    
    # Identificación de la sesión
    session_number = Column(Integer, nullable=False)
    session_timestamp = Column(DateTime, nullable=False)
    
    # Duración y tipo
    session_duration = Column(Integer)  # en segundos
    session_type = Column(String(50))  # NORMAL, TEST, CALIBRATION, etc.
    session_status = Column(String(50))  # ACTIVE, COMPLETED, ERROR, etc.
    
    # Métricas de la sesión
    total_distance = Column(Float)  # en metros
    average_speed = Column(Float)  # en km/h
    max_speed = Column(Float)  # en km/h
    
    # Indicadores de estabilidad
    stability_score = Column(Float)  # 0-1, score general de estabilidad
    risk_level = Column(String(20))  # BAJO, MEDIO, ALTO
    
    # Flags y metadata
    has_incidents = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_completed = Column(Boolean, default=False)
    session_metadata = Column(JSON)  # Datos adicionales de la sesión
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relaciones
    vehicle = relationship("Vehicle", back_populates="stability_sessions")
    file = relationship("UploadedFile", back_populates="stability_sessions")
    stability_data = relationship("StabilityData", back_populates="session", cascade="all, delete-orphan")
    gps_data = relationship("GPSData", back_populates="session", cascade="all, delete-orphan")
    can_data = relationship("CANData", back_populates="session", cascade="all, delete-orphan")
    alarms = relationship("Alarm", back_populates="session", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<StabilitySession {self.session_number} - Vehicle {self.vehicle_id}>"
        
    @property
    def is_valid(self):
        """Verifica si la sesión es válida"""
        return (self.is_completed and 
                self.stability_score is not None and 
                self.risk_level is not None)
                
    @property
    def has_alarms(self):
        """Verifica si la sesión tiene alarmas"""
        return len(self.alarms) > 0
        
    @property
    def data_points_count(self):
        """Retorna el número total de puntos de datos"""
        return (len(self.stability_data) + 
                len(self.gps_data) + 
                len(self.can_data))
                
    def to_dict(self):
        """Convierte el objeto a diccionario"""
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'file_id': self.file_id,
            'session_number': self.session_number,
            'session_timestamp': self.session_timestamp.isoformat(),
            'session_duration': self.session_duration,
            'session_type': self.session_type,
            'session_status': self.session_status,
            'total_distance': self.total_distance,
            'average_speed': self.average_speed,
            'max_speed': self.max_speed,
            'stability_score': self.stability_score,
            'risk_level': self.risk_level,
            'has_incidents': self.has_incidents,
            'is_active': self.is_active,
            'is_completed': self.is_completed,
            'session_metadata': self.session_metadata,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_valid': self.is_valid,
            'has_alarms': self.has_alarms,
            'data_points_count': self.data_points_count
        }
        
    @classmethod
    def create_session(cls, vehicle_id, file_id, session_number, session_timestamp, **kwargs):
        """Crea una nueva sesión de estabilidad"""
        return cls(
            vehicle_id=vehicle_id,
            file_id=file_id,
            session_number=session_number,
            session_timestamp=session_timestamp,
            **kwargs
        )
        
    def update_status(self, status):
        """Actualiza el estado de la sesión"""
        self.session_status = status
        if status == 'COMPLETED':
            self.is_completed = True
            self.is_active = False
        elif status == 'ERROR':
            self.is_active = False
            
    def calculate_metrics(self):
        """Calcula las métricas de la sesión"""
        if not self.stability_data:
            return
            
        # Calcular distancia total
        if self.gps_data:
            self.total_distance = sum(
                point.distance_to_previous 
                for point in self.gps_data 
                if point.distance_to_previous is not None
            )
            
        # Calcular velocidades
        if self.gps_data:
            speeds = [point.speed for point in self.gps_data if point.speed is not None]
            if speeds:
                self.average_speed = sum(speeds) / len(speeds)
                self.max_speed = max(speeds)
                
        # Calcular score de estabilidad
        stability_scores = [
            point.stability_index 
            for point in self.stability_data 
            if point.stability_index is not None
        ]
        if stability_scores:
            self.stability_score = sum(stability_scores) / len(stability_scores)
            
        # Determinar nivel de riesgo
        if self.stability_score is not None:
            if self.stability_score >= 0.8:
                self.risk_level = 'BAJO'
            elif self.stability_score >= 0.5:
                self.risk_level = 'MEDIO'
            else:
                self.risk_level = 'ALTO'
                
        # Verificar incidentes
        self.has_incidents = any(
            point.risk_level == 'ALTO' 
            for point in self.stability_data 
            if point.risk_level is not None
        ) 