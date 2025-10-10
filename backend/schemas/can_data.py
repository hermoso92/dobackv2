"""
Esquemas para el modelo CANData.
"""

from marshmallow import Schema, fields, post_dump

class CANDataSchema(Schema):
    """
    Esquema para serialización de datos CAN.
    """
    id = fields.Int(dump_only=True)
    session_id = fields.Int(required=True)
    timestamp = fields.DateTime(required=True)
    speed = fields.Float()
    engine_rpm = fields.Float()
    throttle_position = fields.Float()
    brake_pressure = fields.Float()
    steering_angle = fields.Float()
    fuel_level = fields.Float()
    engine_temperature = fields.Float()
    battery_voltage = fields.Float()
    created_at = fields.DateTime(dump_only=True)
    
    # Campos relacionados
    session = fields.Nested('StabilitySessionSchema', dump_only=True)
    
    @post_dump
    def remove_none(self, data, **kwargs):
        """
        Elimina campos con valor None.
        """
        return {k: v for k, v in data.items() if v is not None}

class CANDataCreateSchema(Schema):
    """
    Esquema para creación de datos CAN.
    """
    session_id = fields.Int(required=True)
    timestamp = fields.DateTime(required=True)
    speed = fields.Float()
    engine_rpm = fields.Float()
    throttle_position = fields.Float()
    brake_pressure = fields.Float()
    steering_angle = fields.Float()
    fuel_level = fields.Float()
    engine_temperature = fields.Float()
    battery_voltage = fields.Float()

class CANDataUpdateSchema(Schema):
    """
    Esquema para actualización de datos CAN.
    """
    timestamp = fields.DateTime()
    speed = fields.Float()
    engine_rpm = fields.Float()
    throttle_position = fields.Float()
    brake_pressure = fields.Float()
    steering_angle = fields.Float()
    fuel_level = fields.Float()
    engine_temperature = fields.Float()
    battery_voltage = fields.Float() 