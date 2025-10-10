"""
Esquemas para el modelo Fleet.
"""

from marshmallow import Schema, fields, post_dump

class FleetSchema(Schema):
    """
    Esquema para serialización de flotas.
    """
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str()
    company_id = fields.Int(required=True)
    is_active = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    
    # Campos relacionados
    company = fields.Nested('CompanySchema', dump_only=True)
    vehicles = fields.Nested('VehicleSchema', many=True, dump_only=True)
    
    @post_dump
    def remove_none(self, data, **kwargs):
        """
        Elimina campos con valor None.
        """
        return {k: v for k, v in data.items() if v is not None}

class FleetCreateSchema(Schema):
    """
    Esquema para creación de flotas.
    """
    name = fields.Str(required=True)
    description = fields.Str()
    company_id = fields.Int(required=True)

class FleetUpdateSchema(Schema):
    """
    Esquema para actualización de flotas.
    """
    name = fields.Str()
    description = fields.Str()
    company_id = fields.Int()
    is_active = fields.Bool() 