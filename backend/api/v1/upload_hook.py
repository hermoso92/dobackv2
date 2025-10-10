"""
Hook para integrar procesamiento de estados después del upload.
Este endpoint se debe llamar después de procesar archivos.
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from backend.config.database import get_db
from backend.services.upload_integration_service import UploadIntegrationService
from backend.utils.logger import logger

bp = Blueprint('upload_hook', __name__)


@bp.route('/upload/process-states', methods=['POST'])
@jwt_required()
def process_states_after_upload():
    """
    POST /api/v1/upload/process-states
    
    Procesa estados después de subir archivos.
    
    Body:
    {
        "vehicle_id": "DOBACK023",
        "date": "2025-01-15"
    }
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
        data = request.get_json()
        vehicle_id = data.get('vehicle_id')
        date_str = data.get('date')
        
        if not vehicle_id or not date_str:
            return jsonify({
                'success': False,
                'error': 'vehicle_id and date are required'
            }), 400
        
        # Convertir fecha
        try:
            date = datetime.fromisoformat(date_str)
        except ValueError:
            return jsonify({
                'success': False,
                'error': 'Invalid date format. Use YYYY-MM-DD'
            }), 400
        
        # Obtener servicio
        db = next(get_db())
        integration_service = UploadIntegrationService(db)
        
        # Procesar estados
        logger.info(f"Procesando estados para {vehicle_id} - {date.date()}")
        result = integration_service.process_uploaded_day(
            vehicle_id=vehicle_id,
            organization_id=organization_id,
            date=date
        )
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': result['message']
            }), 400
    
    except Exception as e:
        logger.error(f"Error procesando estados: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/upload/batch-process-states', methods=['POST'])
@jwt_required()
def batch_process_states():
    """
    POST /api/v1/upload/batch-process-states
    
    Procesa estados para múltiples días/vehículos.
    
    Body:
    {
        "vehicles": [
            {"vehicle_id": "DOBACK023", "date": "2025-01-15"},
            {"vehicle_id": "DOBACK027", "date": "2025-01-16"}
        ]
    }
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
        data = request.get_json()
        vehicles_data = data.get('vehicles', [])
        
        if not vehicles_data:
            return jsonify({
                'success': False,
                'error': 'vehicles array is required'
            }), 400
        
        # Preparar lista de procesamiento
        vehicle_dates = []
        for item in vehicles_data:
            vehicle_id = item.get('vehicle_id')
            date_str = item.get('date')
            
            if vehicle_id and date_str:
                try:
                    date = datetime.fromisoformat(date_str)
                    vehicle_dates.append((vehicle_id, organization_id, date))
                except ValueError:
                    logger.warning(f"Fecha inválida: {date_str}")
        
        if not vehicle_dates:
            return jsonify({
                'success': False,
                'error': 'No valid vehicles/dates provided'
            }), 400
        
        # Obtener servicio
        db = next(get_db())
        integration_service = UploadIntegrationService(db)
        
        # Procesar batch
        logger.info(f"Procesando {len(vehicle_dates)} días en batch")
        result = integration_service.process_batch(vehicle_dates)
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
    
    except Exception as e:
        logger.error(f"Error en procesamiento batch: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

