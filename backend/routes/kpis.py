"""
Rutas API para KPIs operativos.
"""
from datetime import datetime
from typing import Optional, List
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from backend.config.database import get_db
from backend.services.kpi_service import KPIService
from backend.utils.logger import logger

kpis_bp = Blueprint('kpis', __name__, url_prefix='/api/kpis')


@kpis_bp.route('/states', methods=['GET'])
@jwt_required()
def get_states_summary():
    """
    GET /api/kpis/states?from=YYYY-MM-DD&to=YYYY-MM-DD&vehicleIds[]=X&vehicleIds[]=Y
    
    Retorna resumen de estados (claves 0-5) agregados por duración.
    """
    try:
        # Obtener usuario actual
        current_user = get_jwt_identity()
        organization_id = current_user.get('organizationId')
        
        if not organization_id:
            return jsonify({
                'success': False,
                'error': 'Organization ID not found'
            }), 400
        
        # Parsear parámetros
        from_date_str = request.args.get('from')
        to_date_str = request.args.get('to')
        vehicle_ids = request.args.getlist('vehicleIds[]')
        
        # Convertir fechas
        from_date = None
        to_date = None
        
        if from_date_str:
            try:
                from_date = datetime.fromisoformat(from_date_str)
            except ValueError:
                pass
        
        if to_date_str:
            try:
                to_date = datetime.fromisoformat(to_date_str)
            except ValueError:
                pass
        
        # Obtener servicio
        db = next(get_db())
        kpi_service = KPIService(db)
        
        # Calcular resumen
        summary = kpi_service.get_states_summary(
            organization_id=organization_id,
            vehicle_ids=vehicle_ids if vehicle_ids else None,
            from_date=from_date,
            to_date=to_date
        )
        
        return jsonify({
            'success': True,
            'data': summary
        }), 200
    
    except Exception as e:
        logger.error(f"Error en /kpis/states: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@kpis_bp.route('/activity', methods=['GET'])
@jwt_required()
def get_activity_metrics():
    """
    GET /api/kpis/activity?from=YYYY-MM-DD&to=YYYY-MM-DD&vehicleIds[]=X
    
    Retorna métricas de actividad (km, horas, rotativo, salidas emergencia).
    """
    try:
        # Obtener usuario actual
        current_user = get_jwt_identity()
        organization_id = current_user.get('organizationId')
        
        if not organization_id:
            return jsonify({
                'success': False,
                'error': 'Organization ID not found'
            }), 400
        
        # Parsear parámetros
        from_date_str = request.args.get('from')
        to_date_str = request.args.get('to')
        vehicle_ids = request.args.getlist('vehicleIds[]')
        
        # Convertir fechas
        from_date = None
        to_date = None
        
        if from_date_str:
            try:
                from_date = datetime.fromisoformat(from_date_str)
            except ValueError:
                pass
        
        if to_date_str:
            try:
                to_date = datetime.fromisoformat(to_date_str)
            except ValueError:
                pass
        
        # Obtener servicio
        db = next(get_db())
        kpi_service = KPIService(db)
        
        # Calcular métricas
        metrics = kpi_service.get_activity_metrics(
            organization_id=organization_id,
            vehicle_ids=vehicle_ids if vehicle_ids else None,
            from_date=from_date,
            to_date=to_date
        )
        
        return jsonify({
            'success': True,
            'data': metrics
        }), 200
    
    except Exception as e:
        logger.error(f"Error en /kpis/activity: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@kpis_bp.route('/stability', methods=['GET'])
@jwt_required()
def get_stability_metrics():
    """
    GET /api/kpis/stability?from=YYYY-MM-DD&to=YYYY-MM-DD&vehicleIds[]=X
    
    Retorna métricas de incidencias de estabilidad.
    """
    try:
        # Obtener usuario actual
        current_user = get_jwt_identity()
        organization_id = current_user.get('organizationId')
        
        if not organization_id:
            return jsonify({
                'success': False,
                'error': 'Organization ID not found'
            }), 400
        
        # Parsear parámetros
        from_date_str = request.args.get('from')
        to_date_str = request.args.get('to')
        vehicle_ids = request.args.getlist('vehicleIds[]')
        
        # Convertir fechas
        from_date = None
        to_date = None
        
        if from_date_str:
            try:
                from_date = datetime.fromisoformat(from_date_str)
            except ValueError:
                pass
        
        if to_date_str:
            try:
                to_date = datetime.fromisoformat(to_date_str)
            except ValueError:
                pass
        
        # Obtener servicio
        db = next(get_db())
        kpi_service = KPIService(db)
        
        # Calcular métricas
        metrics = kpi_service.get_stability_metrics(
            organization_id=organization_id,
            vehicle_ids=vehicle_ids if vehicle_ids else None,
            from_date=from_date,
            to_date=to_date
        )
        
        return jsonify({
            'success': True,
            'data': metrics
        }), 200
    
    except Exception as e:
        logger.error(f"Error en /kpis/stability: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@kpis_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_complete_summary():
    """
    GET /api/kpis/summary?from=YYYY-MM-DD&to=YYYY-MM-DD&vehicleIds[]=X
    
    Retorna resumen completo con todos los KPIs.
    """
    try:
        # Obtener usuario actual
        current_user = get_jwt_identity()
        organization_id = current_user.get('organizationId')
        
        if not organization_id:
            return jsonify({
                'success': False,
                'error': 'Organization ID not found'
            }), 400
        
        # Parsear parámetros
        from_date_str = request.args.get('from')
        to_date_str = request.args.get('to')
        vehicle_ids = request.args.getlist('vehicleIds[]')
        
        # Convertir fechas
        from_date = None
        to_date = None
        
        if from_date_str:
            try:
                from_date = datetime.fromisoformat(from_date_str)
            except ValueError:
                pass
        
        if to_date_str:
            try:
                to_date = datetime.fromisoformat(to_date_str)
            except ValueError:
                pass
        
        # Obtener servicio
        db = next(get_db())
        kpi_service = KPIService(db)
        
        # Calcular todos los KPIs
        states = kpi_service.get_states_summary(
            organization_id=organization_id,
            vehicle_ids=vehicle_ids if vehicle_ids else None,
            from_date=from_date,
            to_date=to_date
        )
        
        activity = kpi_service.get_activity_metrics(
            organization_id=organization_id,
            vehicle_ids=vehicle_ids if vehicle_ids else None,
            from_date=from_date,
            to_date=to_date
        )
        
        stability = kpi_service.get_stability_metrics(
            organization_id=organization_id,
            vehicle_ids=vehicle_ids if vehicle_ids else None,
            from_date=from_date,
            to_date=to_date
        )
        
        return jsonify({
            'success': True,
            'data': {
                'states': states,
                'activity': activity,
                'stability': stability
            }
        }), 200
    
    except Exception as e:
        logger.error(f"Error en /kpis/summary: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

