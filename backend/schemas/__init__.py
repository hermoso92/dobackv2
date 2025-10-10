"""
Paquete de esquemas para serialización.
"""

from .vehicle import VehicleSchema, VehicleCreateSchema, VehicleUpdateSchema
from .session import StabilitySessionSchema, StabilitySessionCreateSchema
from .user import UserSchema, UserCreateSchema, UserUpdateSchema
from .company import CompanySchema, CompanyCreateSchema, CompanyUpdateSchema
from .fleet import FleetSchema, FleetCreateSchema, FleetUpdateSchema
from .role import RoleSchema, RoleCreateSchema, RoleUpdateSchema
from .alarm_rule import AlarmRuleSchema, AlarmRuleCreateSchema, AlarmRuleUpdateSchema
from .event import EventSchema, EventCreateSchema, EventUpdateSchema

__all__ = [
    'VehicleSchema',
    'VehicleCreateSchema',
    'VehicleUpdateSchema',
    'StabilitySessionSchema',
    'StabilitySessionCreateSchema',
    'UserSchema',
    'UserCreateSchema',
    'UserUpdateSchema',
    'CompanySchema',
    'CompanyCreateSchema',
    'CompanyUpdateSchema',
    'FleetSchema',
    'FleetCreateSchema',
    'FleetUpdateSchema',
    'RoleSchema',
    'RoleCreateSchema',
    'RoleUpdateSchema',
    'AlarmRuleSchema',
    'AlarmRuleCreateSchema',
    'AlarmRuleUpdateSchema',
    'EventSchema',
    'EventCreateSchema',
    'EventUpdateSchema'
] 