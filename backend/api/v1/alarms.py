"""
Rutas para gestión de alarmas.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from ...models import db, AlarmRule
from ...schemas import AlarmRuleSchema, AlarmRuleCreateSchema, AlarmRuleUpdateSchema
from ...utils.decorators import admin_required

bp = Blueprint('alarms', __name__)
alarm_schema = AlarmRuleSchema()
alarm_create_schema = AlarmRuleCreateSchema()
alarm_update_schema = AlarmRuleUpdateSchema()

@bp.route('/alarms', methods=['GET'])
@jwt_required()
def get_alarms():
    """
    Obtiene todas las reglas de alarma.
    
    Returns:
        JSON: Lista de reglas de alarma.
    """
    try:
        alarms = AlarmRule.query.all()
        return jsonify(alarm_schema.dump(alarms, many=True)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/alarms/<int:id>', methods=['GET'])
@jwt_required()
def get_alarm(id):
    """
    Obtiene una regla de alarma por su ID.
    
    Args:
        id (int): ID de la regla de alarma.
        
    Returns:
        JSON: Datos de la regla de alarma.
    """
    try:
        alarm = AlarmRule.query.get_or_404(id)
        return jsonify(alarm_schema.dump(alarm)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/alarms', methods=['POST'])
@jwt_required()
@admin_required
def create_alarm():
    """
    Crea una nueva regla de alarma.
    
    Returns:
        JSON: Datos de la regla de alarma creada.
    """
    try:
        data = alarm_create_schema.load(request.get_json())
        alarm = AlarmRule(**data)
        db.session.add(alarm)
        db.session.commit()
        return jsonify(alarm_schema.dump(alarm)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/alarms/<int:id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_alarm(id):
    """
    Actualiza una regla de alarma existente.
    
    Args:
        id (int): ID de la regla de alarma.
        
    Returns:
        JSON: Datos de la regla de alarma actualizada.
    """
    try:
        alarm = AlarmRule.query.get_or_404(id)
        data = alarm_update_schema.load(request.get_json())
        for key, value in data.items():
            setattr(alarm, key, value)
        db.session.commit()
        return jsonify(alarm_schema.dump(alarm)), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/alarms/<int:id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_alarm(id):
    """
    Elimina una regla de alarma.
    
    Args:
        id (int): ID de la regla de alarma.
        
    Returns:
        JSON: Mensaje de confirmación.
    """
    try:
        alarm = AlarmRule.query.get_or_404(id)
        db.session.delete(alarm)
        db.session.commit()
        return jsonify({'message': 'Alarm rule deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500 