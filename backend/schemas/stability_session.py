"""
Esquemas para el modelo StabilitySession.
"""

from marshmallow import Schema, fields, post_dump

class StabilitySessionSchema(Schema):
    """
    Esquema para serialización de sesiones de estabilidad.
    """
    id = fields.Int(dump_only=True)
    vehicle_id = fields.Int(required=True)
    start_time = fields.DateTime(required=True)
    end_time = fields.DateTime(required=True)
    status = fields.String(required=True)
    average_stability_score = fields.Float()
    max_risk_level = fields.Int()
    total_distance = fields.Float()
    average_speed = fields.Float()
    max_speed = fields.Float()
    created_at = fields.DateTime(dump_only=True)
    
    # Campos relacionados
    vehicle = fields.Nested('VehicleSchema', dump_only=True)
    gps_data = fields.Nested('GPSDataSchema', many=True, dump_only=True)
    can_data = fields.Nested('CANDataSchema', many=True, dump_only=True)
    stability_data = fields.Nested('StabilityDataSchema', many=True, dump_only=True)
    detected_events = fields.Nested('DetectedEventSchema', many=True, dump_only=True)
    
    @post_dump
    def remove_none(self, data, **kwargs):
        """
        Elimina campos con valor None.
        """
        return {k: v for k, v in data.items() if v is not None}

class StabilitySessionCreateSchema(Schema):
    """
    Esquema para creación de sesiones de estabilidad.
    """
    vehicle_id = fields.Int(required=True)
    start_time = fields.DateTime(required=True)
    end_time = fields.DateTime(required=True)
    status = fields.String(required=True)
    average_stability_score = fields.Float()
    max_risk_level = fields.Int()
    total_distance = fields.Float()
    average_speed = fields.Float()
    max_speed = fields.Float()

class StabilitySessionUpdateSchema(Schema):
    """
    Esquema para actualización de sesiones de estabilidad.
    """
    start_time = fields.DateTime()
    end_time = fields.DateTime()
    status = fields.String()
    average_stability_score = fields.Float()
    max_risk_level = fields.Int()
    total_distance = fields.Float()
    average_speed = fields.Float()
    max_speed = fields.Float() 