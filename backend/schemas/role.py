"""
Esquema para el modelo Role.
"""

from marshmallow import Schema, fields, post_dump

class RoleSchema(Schema):
    """
    Esquema para serialización de roles.
    """
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str()
    permissions = fields.Dict()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    
    @post_dump
    def remove_none(self, data, **kwargs):
        """
        Elimina campos con valor None.
        """
        return {k: v for k, v in data.items() if v is not None}

class RoleCreateSchema(Schema):
    """
    Esquema para creación de roles.
    """
    name = fields.Str(required=True)
    description = fields.Str()
    permissions = fields.Dict()

class RoleUpdateSchema(Schema):
    """
    Esquema para actualización de roles.
    """
    name = fields.Str()
    description = fields.Str()
    permissions = fields.Dict() 