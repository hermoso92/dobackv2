"""
Módulo de modelos de la base de datos.
"""

from backend.extensions import db

# Importar modelos en el orden correcto para evitar importaciones circulares
from .role import Role, user_roles
from .user import User
from .company import Company
from .fleet import Fleet
from .vehicle import Vehicle
from .stability_session import StabilitySession
from .event import Event
from .alert import Alert
from .alarm_rule import AlarmRule
from .notification import Notification
from .maintenance_record import MaintenanceRecord
from .vehicle_kpi import VehicleKPI

__all__ = [
    'db',
    'User',
    'Company',
    'Fleet',
    'Role',
    'user_roles',
    'Vehicle',
    'StabilitySession',
    'Event',
    'Alert',
    'AlarmRule',
    'Notification',
    'MaintenanceRecord',
    'VehicleKPI'
] 