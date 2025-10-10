"""
Esquemas para el modelo StabilityData.
"""

from marshmallow import Schema, fields, post_dump
from marshmallow.validate import Range, OneOf

class StabilityDataBaseSchema(Schema):
    """Schema base para datos de estabilidad"""
    id = fields.Int(dump_only=True)
    session_id = fields.Int(required=True)
    timestamp = fields.DateTime(required=True)
    
    # Ángulos de estabilidad
    roll = fields.Float(validate=Range(min=-180, max=180))
    pitch = fields.Float(validate=Range(min=-180, max=180))
    yaw = fields.Float(validate=Range(min=-180, max=180))
    
    # Aceleraciones
    acceleration_x = fields.Float()
    acceleration_y = fields.Float()
    acceleration_z = fields.Float()
    
    # Métricas de estabilidad
    stability_index = fields.Float(validate=Range(min=0, max=1))
    risk_level = fields.String(validate=OneOf(['BAJO', 'MEDIO', 'ALTO']))
    
    # Calibración
    is_calibrated = fields.Boolean()
    calibration_status = fields.String()
    
    # Metadata y timestamps
    metadata = fields.Dict(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    
    @post_dump
    def remove_none_values(self, data, **kwargs):
        """Elimina campos con valor None"""
        return {
            key: value for key, value in data.items() 
            if value is not None
        }

class StabilityDataSchema(StabilityDataBaseSchema):
    """Schema para lectura de datos de estabilidad"""
    # Campos calculados
    is_stable = fields.Boolean(dump_only=True)
    needs_calibration = fields.Boolean(dump_only=True)
    
    # Relaciones
    session = fields.Nested('StabilitySessionSchema', only=('id', 'session_number'))

class StabilityDataCreateSchema(StabilityDataBaseSchema):
    """Schema para crear nuevos datos de estabilidad"""
    pass

class StabilityDataUpdateSchema(StabilityDataBaseSchema):
    """Schema para actualizar datos de estabilidad"""
    session_id = fields.Int(dump_only=True)  # No permitir cambiar la sesión
    timestamp = fields.DateTime(dump_only=True)  # No permitir cambiar el timestamp

class StabilityDataListSchema(Schema):
    """Schema para listar datos de estabilidad"""
    items = fields.Nested(StabilityDataSchema, many=True)
    total = fields.Int()
    page = fields.Int()
    per_page = fields.Int()
    pages = fields.Int()

class StabilityDataStatsSchema(Schema):
    """Schema para estadísticas de datos de estabilidad"""
    total_points = fields.Int()
    average_stability = fields.Float()
    max_roll = fields.Float()
    max_pitch = fields.Float()
    risk_levels = fields.Dict(keys=fields.Str(), values=fields.Int())
    calibration_status = fields.Dict(keys=fields.Str(), values=fields.Int()) 