"""
Rutas para la gestión de vehículos.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from marshmallow import ValidationError
from datetime import datetime, timedelta

from ...models import db, Vehicle, Fleet, StabilitySession, Event
from ...schemas import VehicleSchema, VehicleCreateSchema, VehicleUpdateSchema
from ...utils.decorators import admin_required, company_required

bp = Blueprint('vehicles', __name__)
vehicle_schema = VehicleSchema()
vehicles_schema = VehicleSchema(many=True)
vehicle_create_schema = VehicleCreateSchema()
vehicle_update_schema = VehicleUpdateSchema()

@bp.route('/vehicles', methods=['GET'])
@jwt_required()
def get_vehicles():
    """
    Obtiene todos los vehículos.
    
    Returns:
        JSON: Lista de vehículos.
    """
    try:
        vehicles = Vehicle.query.all()
        return jsonify(vehicle_schema.dump(vehicles, many=True)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/vehicles/<string:id>', methods=['GET'])
@jwt_required()
def get_vehicle(id):
    """
    Obtiene un vehículo por su ID.
    
    Args:
        id (int): ID del vehículo.
        
    Returns:
        JSON: Datos del vehículo.
    """
    try:
        vehicle = Vehicle.query.get_or_404(id)
        return jsonify(vehicle_schema.dump(vehicle)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/vehicles', methods=['POST'])
@jwt_required()
@company_required
def create_vehicle():
    """
    Crea un nuevo vehículo.
    
    Returns:
        JSON: Datos del vehículo creado.
    """
    try:
        data = vehicle_create_schema.load(request.get_json())
        vehicle = Vehicle(**data)
        db.session.add(vehicle)
        db.session.commit()
        return jsonify(vehicle_schema.dump(vehicle)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/vehicles/<string:id>', methods=['PUT'])
@jwt_required()
@company_required
def update_vehicle(id):
    """
    Actualiza un vehículo existente.
    
    Args:
        id (int): ID del vehículo.
        
    Returns:
        JSON: Datos del vehículo actualizado.
    """
    try:
        vehicle = Vehicle.query.get_or_404(id)
        data = vehicle_update_schema.load(request.get_json())
        for key, value in data.items():
            setattr(vehicle, key, value)
        db.session.commit()
        return jsonify(vehicle_schema.dump(vehicle)), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/vehicles/<string:id>', methods=['DELETE'])
@jwt_required()
@company_required
def delete_vehicle(id):
    """
    Elimina un vehículo.
    
    Args:
        id (int): ID del vehículo.
        
    Returns:
        JSON: Mensaje de confirmación.
    """
    try:
        vehicle = Vehicle.query.get_or_404(id)
        db.session.delete(vehicle)
        db.session.commit()
        return jsonify({'message': 'Vehicle deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<string:vehicle_id>/stats', methods=['GET'])
@jwt_required()
@company_required
def get_vehicle_stats(vehicle_id):
    """
    Obtiene estadísticas detalladas de un vehículo.
    
    Args:
        vehicle_id (int): ID del vehículo.
        
    Returns:
        JSON: Estadísticas del vehículo incluyendo:
            - total_sessions: Número total de sesiones
            - sessions_with_events: Número de sesiones con eventos
            - last_critical_event: Último evento crítico
            - average_stability_score: Puntuación media de estabilidad
            - total_distance: Distancia total recorrida
            - total_duration: Duración total de las sesiones
    """
    try:
        company_id = get_jwt_identity().get('company_id')
        vehicle = Vehicle.query.join(Fleet).filter(
            Vehicle.id == vehicle_id,
            Fleet.company_id == company_id
        ).first_or_404()
        
        # Obtener estadísticas básicas
        total_sessions = StabilitySession.query.filter_by(vehicle_id=vehicle_id).count()
        
        # Sesiones con eventos
        sessions_with_events = db.session.query(StabilitySession).join(
            Event, StabilitySession.id == Event.session_id
        ).filter(StabilitySession.vehicle_id == vehicle_id).distinct().count()
        
        # Último evento crítico
        last_critical_event = Event.query.join(
            StabilitySession, Event.session_id == StabilitySession.id
        ).filter(
            StabilitySession.vehicle_id == vehicle_id,
            Event.severity == 'critical'
        ).order_by(Event.timestamp.desc()).first()
        
        # Estadísticas de estabilidad
        stability_stats = db.session.query(
            db.func.avg(StabilitySession.stability_score).label('avg_score'),
            db.func.sum(StabilitySession.total_distance).label('total_distance'),
            db.func.sum(StabilitySession.session_duration).label('total_duration')
        ).filter(StabilitySession.vehicle_id == vehicle_id).first()
        
        stats = {
            'total_sessions': total_sessions,
            'sessions_with_events': sessions_with_events,
            'last_critical_event': {
                'timestamp': last_critical_event.timestamp.isoformat() if last_critical_event else None,
                'type': last_critical_event.event_type if last_critical_event else None,
                'description': last_critical_event.description if last_critical_event else None
            },
            'average_stability_score': float(stability_stats.avg_score) if stability_stats.avg_score else 0,
            'total_distance': float(stability_stats.total_distance) if stability_stats.total_distance else 0,
            'total_duration': float(stability_stats.total_duration) if stability_stats.total_duration else 0
        }
        
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500 