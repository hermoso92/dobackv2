"""
Esquemas para el modelo AlarmRule.
"""

from marshmallow import Schema, fields, post_dump

class AlarmRuleSchema(Schema):
    """
    Esquema para serialización de reglas de alarma.
    """
    id = fields.Int(dump_only=True)
    name = fields.String(required=True)
    description = fields.String()
    event_type = fields.String(required=True)
    condition = fields.Dict(required=True)
    severity = fields.Int(required=True)
    is_active = fields.Boolean(required=True)
    created_at = fields.DateTime(dump_only=True)
    
    @post_dump
    def remove_none(self, data, **kwargs):
        """
        Elimina campos con valor None.
        """
        return {k: v for k, v in data.items() if v is not None}

class AlarmRuleCreateSchema(Schema):
    """
    Esquema para creación de reglas de alarma.
    """
    name = fields.String(required=True)
    description = fields.String()
    event_type = fields.String(required=True)
    condition = fields.Dict(required=True)
    severity = fields.Int(required=True)
    is_active = fields.Boolean(required=True)

class AlarmRuleUpdateSchema(Schema):
    """
    Esquema para actualización de reglas de alarma.
    """
    name = fields.String()
    description = fields.String()
    event_type = fields.String()
    condition = fields.Dict()
    severity = fields.Int()
    is_active = fields.Boolean() 