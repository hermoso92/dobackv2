"""
Esquemas para el modelo GPSData.
"""

from marshmallow import Schema, fields, post_dump

class GPSDataSchema(Schema):
    """
    Esquema para serialización de datos GPS.
    """
    id = fields.Int(dump_only=True)
    session_id = fields.Int(required=True)
    timestamp = fields.DateTime(required=True)
    latitude = fields.Float(required=True)
    longitude = fields.Float(required=True)
    altitude = fields.Float()
    speed = fields.Float()
    heading = fields.Float()
    accuracy = fields.Float()
    created_at = fields.DateTime(dump_only=True)
    
    # Campos relacionados
    session = fields.Nested('StabilitySessionSchema', dump_only=True)
    
    @post_dump
    def remove_none(self, data, **kwargs):
        """
        Elimina campos con valor None.
        """
        return {k: v for k, v in data.items() if v is not None}

class GPSDataCreateSchema(Schema):
    """
    Esquema para creación de datos GPS.
    """
    session_id = fields.Int(required=True)
    timestamp = fields.DateTime(required=True)
    latitude = fields.Float(required=True)
    longitude = fields.Float(required=True)
    altitude = fields.Float()
    speed = fields.Float()
    heading = fields.Float()
    accuracy = fields.Float()

class GPSDataUpdateSchema(Schema):
    """
    Esquema para actualización de datos GPS.
    """
    timestamp = fields.DateTime()
    latitude = fields.Float()
    longitude = fields.Float()
    altitude = fields.Float()
    speed = fields.Float()
    heading = fields.Float()
    accuracy = fields.Float() 