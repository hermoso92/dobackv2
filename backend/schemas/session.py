"""
Esquemas para serialización de sesiones de estabilidad.
"""

from marshmallow import Schema, fields

class StabilitySessionSchema(Schema):
    """Esquema para serializar sesiones de estabilidad."""
    
    id = fields.Int(dump_only=True)
    vehicle_id = fields.Int(required=True)
    start_time = fields.DateTime(required=True)
    end_time = fields.DateTime(required=True)
    status = fields.Str()
    session_number = fields.Int()
    session_timestamp = fields.DateTime()
    session_duration = fields.Int()
    session_type = fields.Str()
    session_status = fields.Str()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class StabilitySessionCreateSchema(Schema):
    """Esquema para crear sesiones de estabilidad."""
    
    vehicle_id = fields.Int(required=True)
    start_time = fields.DateTime(required=True)
    end_time = fields.DateTime(required=True)
    session_type = fields.Str()
    session_status = fields.Str() 