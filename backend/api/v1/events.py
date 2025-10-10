"""
Rutas para la gestión de eventos.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from marshmallow import ValidationError
from datetime import datetime, timedelta

from ...models import db, Event, StabilitySession, Vehicle, Fleet
from ...schemas import EventSchema, EventCreateSchema
from ...utils.decorators import company_required

bp = Blueprint('events', __name__)
event_schema = EventSchema()
events_schema = EventSchema(many=True)
event_create_schema = EventCreateSchema()

@bp.route('/session/<int:session_id>', methods=['GET'])
@jwt_required()
@company_required
def get_session_events(session_id):
    """
    Obtiene los eventos de una sesión específica.
    
    Args:
        session_id (int): ID de la sesión.
        
    Returns:
        JSON: Lista de eventos de la sesión.
    """
    try:
        company_id = get_jwt_identity().get('company_id')
        session = StabilitySession.query.join(
            Vehicle, StabilitySession.vehicle_id == Vehicle.id
        ).join(
            Fleet, Vehicle.fleet_id == Fleet.id
        ).filter(
            StabilitySession.id == session_id,
            Fleet.company_id == company_id
        ).first_or_404()
        
        events = Event.query.filter_by(session_id=session_id).order_by(
            Event.timestamp.desc()
        ).all()
        
        return jsonify(events_schema.dump(events)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/vehicle/<string:vehicle_id>', methods=['GET'])
@jwt_required()
@company_required
def get_vehicle_events(vehicle_id):
    """
    Obtiene los eventos de un vehículo específico.
    Permite filtrar por tipo de evento, severidad y rango de fechas.
    
    Args:
        vehicle_id (int): ID del vehículo.
        
    Query Parameters:
        event_type (str): Tipo de evento
        severity (str): Severidad del evento
        start_date (str): Fecha de inicio (ISO format)
        end_date (str): Fecha de fin (ISO format)
        
    Returns:
        JSON: Lista de eventos del vehículo.
    """
    try:
        company_id = get_jwt_identity().get('company_id')
        vehicle = Vehicle.query.join(Fleet).filter(
            Vehicle.id == vehicle_id,
            Fleet.company_id == company_id
        ).first_or_404()
        
        query = Event.query.join(
            StabilitySession, Event.session_id == StabilitySession.id
        ).filter(StabilitySession.vehicle_id == vehicle_id)
        
        # Aplicar filtros
        event_type = request.args.get('event_type')
        if event_type:
            query = query.filter(Event.event_type == event_type)
            
        severity = request.args.get('severity')
        if severity:
            query = query.filter(Event.severity == severity)
            
        start_date = request.args.get('start_date')
        if start_date:
            query = query.filter(Event.timestamp >= datetime.fromisoformat(start_date))
            
        end_date = request.args.get('end_date')
        if end_date:
            query = query.filter(Event.timestamp <= datetime.fromisoformat(end_date))
            
        events = query.order_by(Event.timestamp.desc()).all()
        return jsonify(events_schema.dump(events)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('', methods=['POST'])
@jwt_required()
@company_required
def create_event():
    """
    Crea un nuevo evento.
    
    Returns:
        JSON: Detalles del evento creado.
    """
    try:
        data = request.get_json()
        validated_data = event_create_schema.load(data)
        
        event = Event(**validated_data)
        db.session.add(event)
        db.session.commit()
        
        return jsonify(event_schema.dump(event)), 201
    except ValidationError as e:
        return jsonify({'error': e.messages}), 422
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:event_id>', methods=['GET'])
@jwt_required()
@company_required
def get_event(event_id):
    """
    Obtiene los detalles de un evento específico.
    
    Args:
        event_id (int): ID del evento.
        
    Returns:
        JSON: Detalles del evento.
    """
    try:
        company_id = get_jwt_identity().get('company_id')
        event = Event.query.join(
            StabilitySession, Event.session_id == StabilitySession.id
        ).join(
            Vehicle, StabilitySession.vehicle_id == Vehicle.id
        ).join(
            Fleet, Vehicle.fleet_id == Fleet.id
        ).filter(
            Event.id == event_id,
            Fleet.company_id == company_id
        ).first_or_404()
        
        return jsonify(event_schema.dump(event)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500 