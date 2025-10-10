"""
Rutas para la gestión de sesiones de estabilidad.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from marshmallow import ValidationError
from datetime import datetime, timedelta

from ...models import db, StabilitySession, Vehicle, Fleet, Event
from ...schemas import StabilitySessionSchema, StabilitySessionCreateSchema
from ...utils.decorators import company_required

bp = Blueprint('sessions', __name__)
session_schema = StabilitySessionSchema()
sessions_schema = StabilitySessionSchema(many=True)
session_create_schema = StabilitySessionCreateSchema()

@bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_sessions():
    """
    Obtiene todas las sesiones.
    
    Returns:
        JSON: Lista de sesiones.
    """
    try:
        sessions = StabilitySession.query.all()
        return jsonify(session_schema.dump(sessions, many=True)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/sessions/<int:id>', methods=['GET'])
@jwt_required()
def get_session(id):
    """
    Obtiene una sesión por su ID.
    
    Args:
        id (int): ID de la sesión.
        
    Returns:
        JSON: Datos de la sesión.
    """
    try:
        session = StabilitySession.query.get_or_404(id)
        return jsonify(session_schema.dump(session)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/sessions', methods=['POST'])
@jwt_required()
@company_required
def create_session():
    """
    Crea una nueva sesión.
    
    Returns:
        JSON: Datos de la sesión creada.
    """
    try:
        data = session_create_schema.load(request.get_json())
        session = StabilitySession(**data)
        db.session.add(session)
        db.session.commit()
        return jsonify(session_schema.dump(session)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/sessions/<int:id>', methods=['DELETE'])
@jwt_required()
@company_required
def delete_session(id):
    """
    Elimina una sesión.
    
    Args:
        id (int): ID de la sesión.
        
    Returns:
        JSON: Mensaje de confirmación.
    """
    try:
        session = StabilitySession.query.get_or_404(id)
        db.session.delete(session)
        db.session.commit()
        return jsonify({'message': 'Session deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/vehicle/<string:vehicle_id>', methods=['GET'])
@jwt_required()
@company_required
def get_vehicle_sessions(vehicle_id):
    """
    Obtiene las sesiones de un vehículo específico.
    
    Args:
        vehicle_id (int): ID del vehículo.
        
    Returns:
        JSON: Lista de sesiones del vehículo.
    """
    try:
        company_id = get_jwt_identity().get('company_id')
        vehicle = Vehicle.query.join(Fleet).filter(
            Vehicle.id == vehicle_id,
            Fleet.company_id == company_id
        ).first_or_404()
        
        sessions = StabilitySession.query.filter_by(vehicle_id=vehicle_id).order_by(
            StabilitySession.session_timestamp.desc()
        ).all()
        
        return jsonify(sessions_schema.dump(sessions)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/sessions/<int:session_id>/status', methods=['PUT'])
@jwt_required()
@company_required
def update_session_status(session_id):
    """
    Actualiza el estado de una sesión.
    
    Args:
        session_id (int): ID de la sesión.
        
    Returns:
        JSON: Detalles de la sesión actualizada.
    """
    try:
        session = StabilitySession.query.get_or_404(session_id)
        data = request.get_json()
        
        if 'status' not in data:
            return jsonify({'error': 'Status is required'}), 400
            
        session.session_status = data['status']
        db.session.commit()
        
        return jsonify(session_schema.dump(session)), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500 