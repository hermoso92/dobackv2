"""
Modelo para gestionar las flotas de vehículos en el sistema.

Este modelo representa una flota de vehículos perteneciente a una empresa.
Cada flota puede tener múltiples vehículos y configuraciones específicas.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class Fleet(Base):
    """
    Modelo de flota con sus atributos y relaciones.
    
    Attributes:
        id (int): Identificador único de la flota
        company_id (int): ID de la empresa a la que pertenece
        name (str): Nombre de la flota
        description (str): Descripción detallada de la flota
        is_active (bool): Estado de actividad de la flota
        settings (JSON): Configuración específica de la flota
        created_at (datetime): Fecha de creación del registro
        updated_at (datetime): Fecha de última actualización
    """
    __tablename__ = 'fleets'

    id = Column(Integer, primary_key=True)
    
    # Datos básicos
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
    
    # Configuración
    settings = Column(JSON)  # Configuración específica de la flota
    alarm_rules = Column(JSON)  # Reglas de alarma específicas
    notification_config = Column(JSON)  # Configuración de notificaciones
    
    # Estado
    is_active = Column(Boolean, default=True)
    
    # Estadísticas
    total_vehicles = Column(Integer, default=0)
    active_vehicles = Column(Integer, default=0)
    total_distance = Column(Float, default=0.0)
    total_sessions = Column(Integer, default=0)
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relaciones
    company = relationship("Company", back_populates="fleets")
    vehicles = relationship("Vehicle", back_populates="fleet")
    
    def __repr__(self):
        """Representación en string del objeto."""
        return f"<Fleet(id={self.id}, name='{self.name}', company_id={self.company_id})>"
        
    @property
    def active_vehicles_count(self):
        """Retorna el número de vehículos activos"""
        return len([v for v in self.vehicles if v.is_active])
        
    @property
    def total_vehicles_count(self):
        """Retorna el número total de vehículos"""
        return len(self.vehicles)
        
    def get_statistics(self):
        """Obtiene estadísticas de la flota"""
        from .stability_session import StabilitySession
        
        stats = {
            'total_vehicles': self.total_vehicles_count,
            'active_vehicles': self.active_vehicles_count,
            'total_sessions': self.total_sessions,
            'total_distance': self.total_distance,
            'average_stability_score': 0.0,
            'risk_level_distribution': {
                'low': 0,
                'medium': 0,
                'high': 0
            }
        }
        
        # Calcular estadísticas de sesiones
        sessions = StabilitySession.query.filter_by(fleet_id=self.id).all()
        if sessions:
            stats['average_stability_score'] = sum(s.stability_score for s in sessions) / len(sessions)
            for session in sessions:
                stats['risk_level_distribution'][session.risk_level] += 1
                
        return stats
        
    def add_vehicle(self, vehicle):
        """Añade un vehículo a la flota"""
        if vehicle not in self.vehicles:
            self.vehicles.append(vehicle)
            self.total_vehicles += 1
            if vehicle.is_active:
                self.active_vehicles += 1
                
    def remove_vehicle(self, vehicle):
        """Elimina un vehículo de la flota"""
        if vehicle in self.vehicles:
            self.vehicles.remove(vehicle)
            self.total_vehicles -= 1
            if vehicle.is_active:
                self.active_vehicles -= 1
                
    def to_dict(self):
        """Convierte el objeto a diccionario"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'company_id': self.company_id,
            'settings': self.settings,
            'alarm_rules': self.alarm_rules,
            'notification_config': self.notification_config,
            'is_active': self.is_active,
            'total_vehicles': self.total_vehicles,
            'active_vehicles': self.active_vehicles,
            'total_distance': self.total_distance,
            'total_sessions': self.total_sessions,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 