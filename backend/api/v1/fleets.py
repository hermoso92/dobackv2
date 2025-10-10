"""
Rutas para gestión de flotas.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from ...models import db, Fleet
from ...schemas import FleetSchema, FleetCreateSchema, FleetUpdateSchema
from ...utils.decorators import company_required

bp = Blueprint('fleets', __name__)
fleet_schema = FleetSchema()
fleet_create_schema = FleetCreateSchema()
fleet_update_schema = FleetUpdateSchema()

@bp.route('/fleets', methods=['GET'])
@jwt_required()
def get_fleets():
    """
    Obtiene todas las flotas.
    
    Returns:
        JSON: Lista de flotas.
    """
    try:
        fleets = Fleet.query.all()
        return jsonify(fleet_schema.dump(fleets, many=True)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/fleets/<int:id>', methods=['GET'])
@jwt_required()
def get_fleet(id):
    """
    Obtiene una flota por su ID.
    
    Args:
        id (int): ID de la flota.
        
    Returns:
        JSON: Datos de la flota.
    """
    try:
        fleet = Fleet.query.get_or_404(id)
        return jsonify(fleet_schema.dump(fleet)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/fleets', methods=['POST'])
@jwt_required()
@company_required
def create_fleet():
    """
    Crea una nueva flota.
    
    Returns:
        JSON: Datos de la flota creada.
    """
    try:
        data = fleet_create_schema.load(request.get_json())
        fleet = Fleet(**data)
        db.session.add(fleet)
        db.session.commit()
        return jsonify(fleet_schema.dump(fleet)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/fleets/<int:id>', methods=['PUT'])
@jwt_required()
@company_required
def update_fleet(id):
    """
    Actualiza una flota existente.
    
    Args:
        id (int): ID de la flota.
        
    Returns:
        JSON: Datos de la flota actualizada.
    """
    try:
        fleet = Fleet.query.get_or_404(id)
        data = fleet_update_schema.load(request.get_json())
        for key, value in data.items():
            setattr(fleet, key, value)
        db.session.commit()
        return jsonify(fleet_schema.dump(fleet)), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/fleets/<int:id>', methods=['DELETE'])
@jwt_required()
@company_required
def delete_fleet(id):
    """
    Elimina una flota.
    
    Args:
        id (int): ID de la flota.
        
    Returns:
        JSON: Mensaje de confirmación.
    """
    try:
        fleet = Fleet.query.get_or_404(id)
        db.session.delete(fleet)
        db.session.commit()
        return jsonify({'message': 'Fleet deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500 