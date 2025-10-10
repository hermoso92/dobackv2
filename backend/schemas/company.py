"""
Esquema para el modelo Company.
"""

from marshmallow import Schema, fields, post_dump

class CompanySchema(Schema):
    """
    Esquema para serialización de compañías.
    """
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str()
    is_active = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    
    # Campos relacionados
    fleets = fields.Nested('FleetSchema', many=True, dump_only=True)
    users = fields.Nested('UserSchema', many=True, dump_only=True)
    
    @post_dump
    def remove_none(self, data, **kwargs):
        """
        Elimina campos con valor None.
        """
        return {k: v for k, v in data.items() if v is not None}

class CompanyCreateSchema(Schema):
    """
    Esquema para creación de compañías.
    """
    name = fields.Str(required=True)
    description = fields.Str()

class CompanyUpdateSchema(Schema):
    """
    Esquema para actualización de compañías.
    """
    name = fields.Str()
    description = fields.Str()
    is_active = fields.Bool() 