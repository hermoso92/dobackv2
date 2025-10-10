from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.alert import Alert, db
from ..models.stability_session import StabilitySession
from .. import limiter

alerts_bp = Blueprint('alerts', __name__)

@alerts_bp.route('/', methods=['POST'])
@jwt_required()
@limiter.limit("60 per minute")
def create_alert():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    session = StabilitySession.query.get_or_404(data['session_id'])
    
    if session.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    alert = Alert(
        session_id=data['session_id'],
        user_id=current_user_id,
        type=data['type'],
        severity=data['severity'],
        message=data['message'],
        angle=data.get('angle'),
        speed=data.get('speed'),
        location=data.get('location')
    )
    
    db.session.add(alert)
    session.total_alerts += 1
    db.session.commit()
    
    return jsonify(alert.to_dict()), 201

@alerts_bp.route('/', methods=['GET'])
@jwt_required()
def get_alerts():
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    alerts = Alert.query.filter_by(user_id=current_user_id)\
        .order_by(Alert.created_at.desc())\
        .paginate(page=page, per_page=per_page)
    
    return jsonify({
        'alerts': [alert.to_dict() for alert in alerts.items],
        'total': alerts.total,
        'pages': alerts.pages,
        'current_page': alerts.page
    }), 200

@alerts_bp.route('/<int:alert_id>', methods=['GET'])
@jwt_required()
def get_alert(alert_id):
    current_user_id = get_jwt_identity()
    alert = Alert.query.get_or_404(alert_id)
    
    if alert.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify(alert.to_dict()), 200

@alerts_bp.route('/<int:alert_id>/read', methods=['PUT'])
@jwt_required()
def mark_as_read(alert_id):
    current_user_id = get_jwt_identity()
    alert = Alert.query.get_or_404(alert_id)
    
    if alert.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    alert.is_read = True
    db.session.commit()
    
    return jsonify(alert.to_dict()), 200

@alerts_bp.route('/unread', methods=['GET'])
@jwt_required()
def get_unread_alerts():
    current_user_id = get_jwt_identity()
    alerts = Alert.query.filter_by(user_id=current_user_id, is_read=False)\
        .order_by(Alert.created_at.desc())\
        .all()
    
    return jsonify([alert.to_dict() for alert in alerts]), 200 