from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .base import Base

class NotificationType(enum.Enum):
    EVENT = 'event'
    ALARM = 'alarm'
    SYSTEM = 'system'
    MAINTENANCE = 'maintenance'

class NotificationChannel(enum.Enum):
    EMAIL = 'email'
    SMS = 'sms'
    PUSH = 'push'
    WEB = 'web'

class Notification(Base):
    __tablename__ = 'notifications'

    id = Column(Integer, primary_key=True)
    
    # Relaciones
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    event_id = Column(Integer, ForeignKey('events.id'))
    vehicle_id = Column(Integer, ForeignKey('vehicles.id'))
    
    # Datos de la notificación
    type = Column(Enum(NotificationType), nullable=False)
    channel = Column(Enum(NotificationChannel), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(String(1000), nullable=False)
    priority = Column(String(20), nullable=False)  # 'low', 'medium', 'high', 'urgent'
    
    # Estado
    is_read = Column(Boolean, default=False)
    is_sent = Column(Boolean, default=False)
    sent_at = Column(DateTime)
    read_at = Column(DateTime)
    
    # Metadata
    metadata = Column(JSON)  # Datos adicionales específicos del canal
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relaciones
    user = relationship("User", backref="notifications")
    event = relationship("Event", backref="notifications")
    vehicle = relationship("Vehicle", backref="notifications")
    
    def __repr__(self):
        return f"<Notification {self.id} - {self.type.value} ({self.channel.value})>"
        
    @property
    def is_active(self):
        """Retorna si la notificación está activa"""
        return not self.is_read
        
    def mark_as_sent(self):
        """Marca la notificación como enviada"""
        self.is_sent = True
        self.sent_at = func.now()
        
    def mark_as_read(self):
        """Marca la notificación como leída"""
        self.is_read = True
        self.read_at = func.now()
        
    def to_dict(self):
        """Convierte el objeto a diccionario"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'event_id': self.event_id,
            'vehicle_id': self.vehicle_id,
            'type': self.type.value,
            'channel': self.channel.value,
            'title': self.title,
            'message': self.message,
            'priority': self.priority,
            'is_read': self.is_read,
            'is_sent': self.is_sent,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'metadata': self.metadata,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 