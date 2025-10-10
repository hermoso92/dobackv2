"""
Esquemas para el modelo DetectedEvent.
"""

from marshmallow import Schema, fields, post_dump

class DetectedEventSchema(Schema):
    """
    Esquema para serialización de eventos detectados.
    """
    id = fields.Int(dump_only=True)
    session_id = fields.Int(required=True)
    event_type = fields.String(required=True)
    timestamp = fields.DateTime(required=True)
    severity = fields.Int(required=True)
    description = fields.String()
    metadata = fields.Dict()
    created_at = fields.DateTime(dump_only=True)
    
    # Campos relacionados
    session = fields.Nested('StabilitySessionSchema', dump_only=True)
    
    @post_dump
    def remove_none(self, data, **kwargs):
        """
        Elimina campos con valor None.
        """
        return {k: v for k, v in data.items() if v is not None}

class DetectedEventCreateSchema(Schema):
    """
    Esquema para creación de eventos detectados.
    """
    session_id = fields.Int(required=True)
    event_type = fields.String(required=True)
    timestamp = fields.DateTime(required=True)
    severity = fields.Int(required=True)
    description = fields.String()
    metadata = fields.Dict()

class DetectedEventUpdateSchema(Schema):
    """
    Esquema para actualización de eventos detectados.
    """
    event_type = fields.String()
    timestamp = fields.DateTime()
    severity = fields.Int()
    description = fields.String()
    metadata = fields.Dict() 