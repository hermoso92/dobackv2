"""
Esquemas para el modelo Event.
"""

from marshmallow import Schema, fields, post_dump

class EventSchema(Schema):
    """
    Esquema para serialización de eventos.
    """
    id = fields.Int(dump_only=True)
    session_id = fields.Int(required=True)
    event_type = fields.Str(required=True)
    timestamp = fields.DateTime(required=True)
    severity = fields.Int(required=True)
    description = fields.Str(required=True)
    data = fields.Dict(required=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    
    @post_dump
    def remove_none(self, data, **kwargs):
        """
        Elimina campos con valor None.
        """
        return {k: v for k, v in data.items() if v is not None}

class EventCreateSchema(Schema):
    """
    Esquema para creación de eventos.
    """
    session_id = fields.Int(required=True)
    event_type = fields.Str(required=True)
    timestamp = fields.DateTime(required=True)
    severity = fields.Int(required=True)
    description = fields.Str(required=True)
    data = fields.Dict(required=True)

class EventUpdateSchema(Schema):
    """
    Esquema para actualización de eventos.
    """
    event_type = fields.Str()
    severity = fields.Int()
    description = fields.Str()
    data = fields.Dict() 