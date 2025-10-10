"""
Esquemas para el modelo Vehicle.
"""

from marshmallow import Schema, fields, validate, validates_schema, ValidationError, post_dump

class VehicleSchema(Schema):
    """
    Esquema para serialización de vehículos.
    """
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    model = fields.Str(required=True)
    plate = fields.Str(required=True)
    fleet_id = fields.Int(required=True)
    status = fields.Str(dump_only=True)
    is_active = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    
    # Campos relacionados
    fleet = fields.Nested('FleetSchema', dump_only=True)
    stability_sessions = fields.Nested('StabilitySessionSchema', many=True, dump_only=True)
    
    @post_dump
    def remove_none(self, data, **kwargs):
        """
        Elimina campos con valor None.
        """
        return {k: v for k, v in data.items() if v is not None}

class VehicleCreateSchema(Schema):
    """
    Esquema para creación de vehículos.
    """
    name = fields.Str(required=True)
    model = fields.Str(required=True)
    plate = fields.Str(required=True)
    fleet_id = fields.Int(required=True)

class VehicleUpdateSchema(Schema):
    """
    Esquema para actualización de vehículos.
    """
    name = fields.Str()
    model = fields.Str()
    plate = fields.Str()
    fleet_id = fields.Int()
    status = fields.Str()
    is_active = fields.Bool()

    @validates_schema
    def validate_vin(self, data, **kwargs):
        """Valida el formato del VIN."""
        if 'vin' in data and data['vin']:
            if not data['vin'].isalnum():
                raise ValidationError('VIN must contain only alphanumeric characters', 'vin') 