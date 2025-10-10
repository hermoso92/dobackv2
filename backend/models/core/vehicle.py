"""
Modelo para gestionar los vehículos en el sistema.

Este modelo representa un vehículo perteneciente a una flota, con sus características
técnicas, estado y datos de seguimiento.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class Vehicle(Base):
    """
    Modelo de vehículo con sus atributos y relaciones.
    
    Attributes:
        id (int): Identificador único del vehículo
        fleet_id (int): ID de la flota a la que pertenece
        name (str): Nombre del vehículo
        plate_number (str): Número de matrícula
        description (str): Descripción detallada del vehículo
        is_active (bool): Estado de actividad del vehículo
        vehicle_type (str): Tipo de vehículo
        manufacturer (str): Fabricante del vehículo
        model (str): Modelo del vehículo
        year (int): Año de fabricación
        weight (float): Peso del vehículo en kg
        dimensions (JSON): Dimensiones del vehículo
        technical_specs (JSON): Especificaciones técnicas
        last_maintenance (datetime): Fecha del último mantenimiento
        next_maintenance (datetime): Fecha del próximo mantenimiento
        created_at (datetime): Fecha de creación del registro
        updated_at (datetime): Fecha de última actualización
    """
    __tablename__ = 'vehicles'

    id = Column(Integer, primary_key=True)
    fleet_id = Column(Integer, ForeignKey('fleets.id'), nullable=False)
    name = Column(String(100), nullable=False)
    plate_number = Column(String(20), unique=True, nullable=False)
    description = Column(String(500))
    is_active = Column(Boolean, default=True)
    
    # Información técnica
    vehicle_type = Column(String(50))
    manufacturer = Column(String(100))
    model = Column(String(100))
    year = Column(Integer)
    weight = Column(Float)  # en kg
    dimensions = Column(JSON)  # {length, width, height}
    technical_specs = Column(JSON)
    
    # Mantenimiento
    last_maintenance = Column(DateTime)
    next_maintenance = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    fleet = relationship('Fleet', back_populates='vehicles')
    sessions = relationship('StabilitySession', back_populates='vehicle', cascade='all, delete-orphan')

    def __repr__(self):
        """Representación en string del objeto."""
        return f"<Vehicle(id={self.id}, name='{self.name}', plate='{self.plate_number}')>"

    @property
    def active_sessions(self):
        """
        Retorna las sesiones activas del vehículo.
        
        Returns:
            list: Lista de objetos StabilitySession activos
        """
        return [session for session in self.sessions if session.session_status == 'active']

    def get_vehicle_stats(self):
        """
        Obtiene estadísticas del vehículo.
        
        Returns:
            dict: Diccionario con estadísticas del vehículo
        """
        return {
            'total_sessions': len(self.sessions),
            'active_sessions': len(self.active_sessions),
            'sessions_with_events': len([s for s in self.sessions if s.has_incidents]),
            'last_session': max([s.session_timestamp for s in self.sessions]) if self.sessions else None
        }

    def needs_maintenance(self):
        """
        Verifica si el vehículo necesita mantenimiento.
        
        Returns:
            bool: True si necesita mantenimiento, False en caso contrario
        """
        if not self.next_maintenance:
            return False
        return datetime.utcnow() >= self.next_maintenance

    @property
    def active_sessions_count(self):
        """Retorna el número de sesiones activas"""
        return len([s for s in self.sessions if s.session_status == 'active'])
        
    @property
    def total_sessions_count(self):
        """Retorna el número total de sesiones"""
        return len(self.sessions)
        
    def get_statistics(self):
        """Obtiene estadísticas del vehículo"""
        from .stability_session import StabilitySession
        
        stats = {
            'total_sessions': self.total_sessions_count,
            'active_sessions': self.active_sessions_count,
            'sessions_with_events': len([s for s in self.sessions if s.has_incidents]),
            'last_session': max([s.session_timestamp for s in self.sessions]) if self.sessions else None,
            'last_maintenance': self.last_maintenance.isoformat() if self.last_maintenance else None,
            'next_maintenance': self.next_maintenance.isoformat() if self.next_maintenance else None
        }
        
        return stats
        
    def update_maintenance(self, last_date, next_date):
        """Actualiza las fechas de mantenimiento"""
        self.last_maintenance = last_date
        self.next_maintenance = next_date
        
    def update_statistics(self):
        """Actualiza las estadísticas del vehículo"""
        if self.sessions:
            self.total_sessions_count = len(self.sessions)
            self.active_sessions_count = len([s for s in self.sessions if s.session_status == 'active'])
            self.sessions_with_events = len([s for s in self.sessions if s.has_incidents])
            
            # Calcular última sesión
            self.last_session = max([s.session_timestamp for s in self.sessions])
            
            # Calcular nivel de riesgo
            risk_scores = [s.risk_level for s in self.sessions]
            if 'high' in risk_scores:
                self.risk_level = 'high'
            elif 'medium' in risk_scores:
                self.risk_level = 'medium'
            else:
                self.risk_level = 'low'
                
    def to_dict(self):
        """Convierte el objeto a diccionario"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'fleet_id': self.fleet_id,
            'plate_number': self.plate_number,
            'vehicle_type': self.vehicle_type,
            'manufacturer': self.manufacturer,
            'model': self.model,
            'year': self.year,
            'weight': self.weight,
            'dimensions': self.dimensions,
            'technical_specs': self.technical_specs,
            'is_active': self.is_active,
            'last_maintenance': self.last_maintenance.isoformat() if self.last_maintenance else None,
            'next_maintenance': self.next_maintenance.isoformat() if self.next_maintenance else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 