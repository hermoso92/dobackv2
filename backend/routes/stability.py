from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from ..models.stability_session import StabilitySession, db
from ..models.alert import Alert
from .. import limiter

stability_bp = Blueprint('stability', __name__)

@stability_bp.route('/sessions', methods=['POST'])
@jwt_required()
@limiter.limit("60 per minute")
def create_session():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    session = StabilitySession(
        user_id=current_user_id,
        vehicle_id=data['vehicle_id'],
        status='active'
    )
    
    db.session.add(session)
    db.session.commit()
    
    return jsonify(session.to_dict()), 201

@stability_bp.route('/sessions/<int:session_id>', methods=['PUT'])
@jwt_required()
@limiter.limit("60 per minute")
def update_session(session_id):
    current_user_id = get_jwt_identity()
    session = StabilitySession.query.get_or_404(session_id)
    
    if session.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if 'status' in data:
        session.status = data['status']
        if data['status'] == 'completed':
            session.end_time = datetime.utcnow()
    
    if 'risk_level' in data:
        session.risk_level = data['risk_level']
    
    if 'max_angle' in data:
        session.max_angle = data['max_angle']
    
    if 'avg_angle' in data:
        session.avg_angle = data['avg_angle']
    
    db.session.commit()
    
    return jsonify(session.to_dict()), 200

@stability_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_sessions():
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    sessions = StabilitySession.query.filter_by(user_id=current_user_id)\
        .order_by(StabilitySession.created_at.desc())\
        .paginate(page=page, per_page=per_page)
    
    return jsonify({
        'sessions': [session.to_dict() for session in sessions.items],
        'total': sessions.total,
        'pages': sessions.pages,
        'current_page': sessions.page
    }), 200

@stability_bp.route('/sessions/<int:session_id>', methods=['GET'])
@jwt_required()
def get_session(session_id):
    current_user_id = get_jwt_identity()
    session = StabilitySession.query.get_or_404(session_id)
    
    if session.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify(session.to_dict()), 200

@stability_bp.route('/sessions/<int:session_id>/alerts', methods=['GET'])
@jwt_required()
def get_session_alerts(session_id):
    current_user_id = get_jwt_identity()
    session = StabilitySession.query.get_or_404(session_id)
    
    if session.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    alerts = Alert.query.filter_by(session_id=session_id)\
        .order_by(Alert.created_at.desc())\
        .all()
    
    return jsonify([alert.to_dict() for alert in alerts]), 200

@stability_bp.route('/vehicle/<int:vehicle_id>/sessions', methods=['GET'])
@jwt_required()
def get_vehicle_sessions(vehicle_id):
    current_user_id = get_jwt_identity()
    
    sessions = StabilitySession.query.filter_by(
        vehicle_id=vehicle_id,
        user_id=current_user_id
    ).order_by(StabilitySession.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'data': [session.to_dict() for session in sessions],
        'message': 'Sesiones obtenidas exitosamente'
    }), 200 