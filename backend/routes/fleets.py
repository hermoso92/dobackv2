"""
Rutas para la gestión de flotas.
"""

from flask import Blueprint, jsonify, request
from backend.models.fleet import Fleet
from backend.models.vehicle import Vehicle
from backend.models.user import User
from backend.app import db
from backend.utils.auth import admin_required, company_admin_required

fleets_bp = Blueprint('fleets', __name__, url_prefix='/api/v1/fleets')

@fleets_bp.route('/', methods=['GET'])
@admin_required
def get_fleets():
    """Obtiene todas las flotas."""
    fleets = Fleet.query.all()
    return jsonify({
        'status': 'success',
        'data': [fleet.to_dict() for fleet in fleets]
    })

@fleets_bp.route('/<int:fleet_id>', methods=['GET'])
@company_admin_required
def get_fleet(fleet_id):
    """Obtiene una flota específica."""
    fleet = Fleet.query.get_or_404(fleet_id)
    
    # Verificar que el usuario tenga acceso a la flota
    if not current_user.is_admin and fleet.company_id != current_user.company_id:
        return jsonify({
            'status': 'error',
            'message': 'No tienes permiso para acceder a esta flota'
        }), 403
    
    return jsonify({
        'status': 'success',
        'data': fleet.to_dict()
    })

@fleets_bp.route('/', methods=['POST'])
@company_admin_required
def create_fleet():
    """Crea una nueva flota."""
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({
            'status': 'error',
            'message': 'Se requiere el nombre de la flota'
        }), 400
    
    # Si el usuario no es admin, asignar automáticamente su compañía
    if not current_user.is_admin:
        data['company_id'] = current_user.company_id
    
    fleet = Fleet(
        name=data['name'],
        description=data.get('description'),
        company_id=data['company_id']
    )
    
    db.session.add(fleet)
    db.session.commit()
    
    return jsonify({
        'status': 'success',
        'message': 'Flota creada exitosamente',
        'data': fleet.to_dict()
    }), 201

@fleets_bp.route('/<int:fleet_id>', methods=['PUT'])
@company_admin_required
def update_fleet(fleet_id):
    """Actualiza una flota existente."""
    fleet = Fleet.query.get_or_404(fleet_id)
    
    # Verificar que el usuario tenga acceso a la flota
    if not current_user.is_admin and fleet.company_id != current_user.company_id:
        return jsonify({
            'status': 'error',
            'message': 'No tienes permiso para modificar esta flota'
        }), 403
    
    data = request.get_json()
    
    if 'name' in data:
        fleet.name = data['name']
    if 'description' in data:
        fleet.description = data['description']
    if 'is_active' in data:
        fleet.is_active = data['is_active']
    
    db.session.commit()
    
    return jsonify({
        'status': 'success',
        'message': 'Flota actualizada exitosamente',
        'data': fleet.to_dict()
    })

@fleets_bp.route('/<int:fleet_id>', methods=['DELETE'])
@company_admin_required
def delete_fleet(fleet_id):
    """Elimina una flota."""
    fleet = Fleet.query.get_or_404(fleet_id)
    
    # Verificar que el usuario tenga acceso a la flota
    if not current_user.is_admin and fleet.company_id != current_user.company_id:
        return jsonify({
            'status': 'error',
            'message': 'No tienes permiso para eliminar esta flota'
        }), 403
    
    # Verificar si hay vehículos asociados
    if fleet.vehicles:
        return jsonify({
            'status': 'error',
            'message': 'No se puede eliminar la flota porque tiene vehículos asociados'
        }), 400
    
    db.session.delete(fleet)
    db.session.commit()
    
    return jsonify({
        'status': 'success',
        'message': 'Flota eliminada exitosamente'
    }) 