"""
Rutas para gestión de métricas.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from ...models import db, StabilitySession, Vehicle, Fleet, VehicleKPI
from ...utils.decorators import company_required

bp = Blueprint('metrics', __name__)

print("DEBUG: metrics.py cargado")

@bp.route('/metrics', methods=['GET'])
@jwt_required()
def get_metrics():
    """
    Obtiene métricas generales del sistema.
    
    Returns:
        JSON: Métricas del sistema.
    """
    try:
        # Obtener métricas de sesiones
        sessions = StabilitySession.query.all()
        total_sessions = len(sessions)
        
        # Calcular promedios
        if total_sessions > 0:
            avg_stability = sum(s.average_stability_score or 0 for s in sessions) / total_sessions
            avg_risk = sum(s.max_risk_level or 0 for s in sessions) / total_sessions
            avg_distance = sum(s.total_distance or 0 for s in sessions) / total_sessions
            avg_speed = sum(s.average_speed or 0 for s in sessions) / total_sessions
        else:
            avg_stability = 0
            avg_risk = 0
            avg_distance = 0
            avg_speed = 0
        
        # Obtener métricas de vehículos
        vehicles = Vehicle.query.all()
        total_vehicles = len(vehicles)
        active_vehicles = len([v for v in vehicles if v.is_active])
        
        # Obtener métricas de flotas
        fleets = Fleet.query.all()
        total_fleets = len(fleets)
        active_fleets = len([f for f in fleets if f.is_active])
        
        metrics = {
            'sessions': {
                'total': total_sessions,
                'average_stability_score': round(avg_stability, 2),
                'average_risk_level': round(avg_risk, 2),
                'average_distance': round(avg_distance, 2),
                'average_speed': round(avg_speed, 2)
            },
            'vehicles': {
                'total': total_vehicles,
                'active': active_vehicles,
                'inactive': total_vehicles - active_vehicles
            },
            'fleets': {
                'total': total_fleets,
                'active': active_fleets,
                'inactive': total_fleets - active_fleets
            }
        }
        
        return jsonify(metrics), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/metrics/vehicles/<string:vehicle_id>', methods=['GET'])
@jwt_required()
def get_vehicle_metrics(vehicle_id):
    """
    Obtiene el KPI real de un vehículo desde VehicleKPI.
    """
    try:
        kpi = VehicleKPI.query.filter_by(vehicleId=vehicle_id).order_by(VehicleKPI.date.desc()).first()
        if not kpi:
            return jsonify({'error': 'No KPI found'}), 404
        return jsonify(kpi.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/metrics/vehicles-ids', methods=['GET'])
@jwt_required()
def list_vehicle_kpi_ids():
    ids = [row.vehicleId for row in VehicleKPI.query.all()]
    return jsonify({'vehicleIds': ids}), 200

@bp.route('/metrics/fleets/<int:fleet_id>', methods=['GET'])
@jwt_required()
def get_fleet_metrics(fleet_id):
    """
    Obtiene métricas específicas de una flota.
    
    Args:
        fleet_id (int): ID de la flota.
        
    Returns:
        JSON: Métricas de la flota.
    """
    try:
        # Obtener vehículos de la flota
        vehicles = Vehicle.query.filter_by(fleet_id=fleet_id).all()
        total_vehicles = len(vehicles)
        active_vehicles = len([v for v in vehicles if v.is_active])
        
        # Obtener todas las sesiones de los vehículos de la flota
        sessions = []
        for vehicle in vehicles:
            sessions.extend(StabilitySession.query.filter_by(vehicle_id=vehicle.id).all())
        
        total_sessions = len(sessions)
        
        # Calcular promedios
        if total_sessions > 0:
            avg_stability = sum(s.average_stability_score or 0 for s in sessions) / total_sessions
            avg_risk = sum(s.max_risk_level or 0 for s in sessions) / total_sessions
            avg_distance = sum(s.total_distance or 0 for s in sessions) / total_sessions
            avg_speed = sum(s.average_speed or 0 for s in sessions) / total_sessions
        else:
            avg_stability = 0
            avg_risk = 0
            avg_distance = 0
            avg_speed = 0
        
        metrics = {
            'vehicles': {
                'total': total_vehicles,
                'active': active_vehicles,
                'inactive': total_vehicles - active_vehicles
            },
            'sessions': {
                'total': total_sessions,
                'average_stability_score': round(avg_stability, 2),
                'average_risk_level': round(avg_risk, 2),
                'average_distance': round(avg_distance, 2),
                'average_speed': round(avg_speed, 2)
            }
        }
        
        return jsonify(metrics), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500 