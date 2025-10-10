"""
Esquemas para el modelo User.
"""

from marshmallow import Schema, fields, post_dump
from .company import CompanySchema
from .role import RoleSchema

class UserSchema(Schema):
    """
    Esquema para serialización de usuarios.
    """
    id = fields.Int(dump_only=True)
    email = fields.Email(required=True)
    name = fields.Method('get_full_name', dump_only=True)
    role = fields.Method('get_primary_role', dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    
    def get_full_name(self, obj):
        """Obtiene el nombre completo del usuario."""
        return f"{obj.first_name} {obj.last_name}".strip()
    
    def get_primary_role(self, obj):
        """Obtiene el rol principal del usuario."""
        if obj.roles:
            return obj.roles[0].name
        return 'user'
    
    @post_dump
    def remove_none(self, data, **kwargs):
        """
        Elimina campos con valor None.
        """
        return {k: v for k, v in data.items() if v is not None}

class UserCreateSchema(Schema):
    """
    Esquema para creación de usuarios.
    """
    username = fields.Str(required=True)
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)
    first_name = fields.Str(required=True)
    last_name = fields.Str(required=True)
    company_id = fields.Int(required=True)
    role_ids = fields.List(fields.Int(), required=True)

class UserUpdateSchema(Schema):
    """
    Esquema para actualización de usuarios.
    """
    username = fields.Str()
    email = fields.Email()
    first_name = fields.Str()
    last_name = fields.Str()
    is_active = fields.Bool()
    company_id = fields.Int()
    role_ids = fields.List(fields.Int())

class CompanySchema(Schema):
    """
    Esquema para serialización de compañías.
    """
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str()

class RoleSchema(Schema):
    """
    Esquema para serialización de roles.
    """
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str() 