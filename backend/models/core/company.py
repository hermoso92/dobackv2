"""
Modelo para gestionar las empresas en el sistema.

Este modelo representa una empresa que puede tener múltiples flotas y usuarios asociados.
Cada empresa tiene su propia configuración de alarmas y notificaciones.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
from backend.models.base import Base

class Company(Base):
    """
    Modelo de empresa con sus atributos y relaciones.
    
    Attributes:
        id (int): Identificador único de la empresa
        name (str): Nombre de la empresa
        description (str): Descripción detallada de la empresa
        is_active (bool): Estado de actividad de la empresa
        settings (JSON): Configuración específica de la empresa
        alarm_rules (JSON): Reglas de alarmas personalizadas
        notification_config (JSON): Configuración de notificaciones
        created_at (datetime): Fecha de creación del registro
        updated_at (datetime): Fecha de última actualización
    """
    __tablename__ = 'companies'

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    is_active = Column(Boolean, default=True)
    
    # Configuración en formato JSON
    settings = Column(JSON)
    alarm_rules = Column(JSON)
    notification_config = Column(JSON)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    fleets = relationship('Fleet', back_populates='company', cascade='all, delete-orphan')
    users = relationship('User', back_populates='company')

    def __repr__(self):
        """Representación en string del objeto."""
        return f"<Company(id={self.id}, name='{self.name}')>"

    @property
    def active_fleets(self):
        """
        Retorna las flotas activas de la empresa.
        
        Returns:
            list: Lista de objetos Fleet activos
        """
        return [fleet for fleet in self.fleets if fleet.is_active]

    @property
    def total_vehicles(self):
        """
        Calcula el total de vehículos en todas las flotas.
        
        Returns:
            int: Número total de vehículos
        """
        return sum(len(fleet.vehicles) for fleet in self.fleets)

    @property
    def active_vehicles(self):
        """
        Calcula el total de vehículos activos en todas las flotas.
        
        Returns:
            int: Número total de vehículos activos
        """
        return sum(len([v for v in fleet.vehicles if v.is_active]) for fleet in self.fleets)

    def get_company_stats(self):
        """
        Obtiene estadísticas generales de la empresa.
        
        Returns:
            dict: Diccionario con estadísticas de la empresa
        """
        from backend.models import StabilitySession
        
        return {
            'total_fleets': len(self.fleets),
            'active_fleets': len(self.active_fleets),
            'total_vehicles': self.total_vehicles,
            'active_vehicles': self.active_vehicles,
            'total_sessions': StabilitySession.query.filter(
                StabilitySession.vehicle_id.in_([v.id for f in self.fleets for v in f.vehicles])
            ).count()
        }

    def add_fleet(self, name, description=None):
        """
        Añade una nueva flota a la empresa.
        
        Args:
            name (str): Nombre de la flota
            description (str, optional): Descripción de la flota
            
        Returns:
            Fleet: Objeto Fleet creado
        """
        from backend.models import Fleet
        fleet = Fleet(
            company_id=self.id,
            name=name,
            description=description
        )
        self.fleets.append(fleet)
        return fleet

    def to_dict(self):
        """
        Convierte el objeto a diccionario.
        
        Returns:
            dict: Representación en diccionario del objeto
        """
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_active': self.is_active,
            'settings': self.settings,
            'alarm_rules': self.alarm_rules,
            'notification_config': self.notification_config,
            'total_fleets': len(self.fleets),
            'active_fleets': len(self.active_fleets),
            'total_vehicles': self.total_vehicles,
            'active_vehicles': self.active_vehicles,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 