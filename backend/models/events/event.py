from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class Event(Base):
    __tablename__ = 'events'

    id = Column(Integer, primary_key=True)
    
    # Datos básicos
    event_type = Column(String(50), nullable=False)  # alarm, warning, info, error
    severity = Column(String(20), nullable=False)  # low, medium, high, critical
    description = Column(String(500), nullable=False)
    
    # Relaciones
    vehicle_id = Column(Integer, ForeignKey('vehicles.id'), nullable=False)
    session_id = Column(Integer, ForeignKey('stability_sessions.id'))
    user_id = Column(Integer, ForeignKey('users.id'))
    
    # Datos del evento
    timestamp = Column(DateTime, nullable=False)
    location = Column(JSON)  # {lat, lng}
    metrics = Column(JSON)  # Métricas relevantes al momento del evento
    context = Column(JSON)  # Contexto adicional del evento
    
    # Estado
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(Integer, ForeignKey('users.id'))
    acknowledged_at = Column(DateTime)
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relaciones
    vehicle = relationship("Vehicle", back_populates="events")
    session = relationship("StabilitySession", back_populates="events")
    user = relationship("User", foreign_keys=[user_id])
    acknowledger = relationship("User", foreign_keys=[acknowledged_by])
    
    def __repr__(self):
        return f"<Event {self.event_type} - {self.severity}>"
        
    @property
    def is_active(self):
        """Retorna si el evento está activo (no reconocido)"""
        return not self.is_acknowledged
        
    def acknowledge(self, user_id):
        """Marca el evento como reconocido"""
        self.is_acknowledged = True
        self.acknowledged_by = user_id
        self.acknowledged_at = func.now()
        
    def to_dict(self):
        """Convierte el objeto a diccionario"""
        return {
            'id': self.id,
            'event_type': self.event_type,
            'severity': self.severity,
            'description': self.description,
            'vehicle_id': self.vehicle_id,
            'session_id': self.session_id,
            'user_id': self.user_id,
            'timestamp': self.timestamp.isoformat(),
            'location': self.location,
            'metrics': self.metrics,
            'context': self.context,
            'is_acknowledged': self.is_acknowledged,
            'acknowledged_by': self.acknowledged_by,
            'acknowledged_at': self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
    @classmethod
    def create_alarm(cls, vehicle_id, session_id, description, severity, metrics=None, context=None):
        """Crea un evento de tipo alarma"""
        return cls(
            event_type='alarm',
            severity=severity,
            description=description,
            vehicle_id=vehicle_id,
            session_id=session_id,
            metrics=metrics,
            context=context,
            timestamp=func.now()
        )
        
    @classmethod
    def create_warning(cls, vehicle_id, session_id, description, metrics=None, context=None):
        """Crea un evento de tipo advertencia"""
        return cls(
            event_type='warning',
            severity='medium',
            description=description,
            vehicle_id=vehicle_id,
            session_id=session_id,
            metrics=metrics,
            context=context,
            timestamp=func.now()
        )
        
    @classmethod
    def create_info(cls, vehicle_id, session_id, description, metrics=None, context=None):
        """Crea un evento de tipo información"""
        return cls(
            event_type='info',
            severity='low',
            description=description,
            vehicle_id=vehicle_id,
            session_id=session_id,
            metrics=metrics,
            context=context,
            timestamp=func.now()
        ) 