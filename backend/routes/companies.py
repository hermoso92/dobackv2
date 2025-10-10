"""
Rutas para la gestión de compañías.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import Company, User
from backend.app import db

bp = Blueprint('companies', __name__, url_prefix='/api/v1/companies')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_companies():
    """Obtener lista de compañías."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.is_admin:
        companies = Company.query.all()
    else:
        companies = [user.company]
    
    return jsonify([{
        'id': company.id,
        'name': company.name,
        'description': company.description,
        'email': company.email,
        'phone': company.phone,
        'address': company.address,
        'city': company.city,
        'state': company.state,
        'country': company.country,
        'postal_code': company.postal_code,
        'is_active': company.is_active,
        'created_at': company.created_at.isoformat(),
        'updated_at': company.updated_at.isoformat()
    } for company in companies]), 200

@bp.route('/<int:company_id>', methods=['GET'])
@jwt_required()
def get_company(company_id):
    """Obtener detalles de una compañía específica."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    company = Company.query.get_or_404(company_id)
    
    if not user.is_admin and user.company_id != company.id:
        return jsonify({'error': 'No autorizado'}), 403
    
    return jsonify({
        'id': company.id,
        'name': company.name,
        'description': company.description,
        'email': company.email,
        'phone': company.phone,
        'address': company.address,
        'city': company.city,
        'state': company.state,
        'country': company.country,
        'postal_code': company.postal_code,
        'is_active': company.is_active,
        'created_at': company.created_at.isoformat(),
        'updated_at': company.updated_at.isoformat()
    }), 200

@bp.route('/', methods=['POST'])
@jwt_required()
def create_company():
    """Crear una nueva compañía."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user.is_admin:
        return jsonify({'error': 'No autorizado'}), 403
    
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'El nombre es requerido'}), 400
    
    company = Company(
        name=data['name'],
        description=data.get('description'),
        email=data.get('email'),
        phone=data.get('phone'),
        address=data.get('address'),
        city=data.get('city'),
        state=data.get('state'),
        country=data.get('country'),
        postal_code=data.get('postal_code')
    )
    
    db.session.add(company)
    db.session.commit()
    
    return jsonify({
        'id': company.id,
        'name': company.name,
        'description': company.description,
        'email': company.email,
        'phone': company.phone,
        'address': company.address,
        'city': company.city,
        'state': company.state,
        'country': company.country,
        'postal_code': company.postal_code,
        'is_active': company.is_active,
        'created_at': company.created_at.isoformat(),
        'updated_at': company.updated_at.isoformat()
    }), 201

@bp.route('/<int:company_id>', methods=['PUT'])
@jwt_required()
def update_company(company_id):
    """Actualizar una compañía existente."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user.is_admin:
        return jsonify({'error': 'No autorizado'}), 403
    
    company = Company.query.get_or_404(company_id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No se proporcionaron datos'}), 400
    
    if 'name' in data:
        company.name = data['name']
    if 'description' in data:
        company.description = data['description']
    if 'email' in data:
        company.email = data['email']
    if 'phone' in data:
        company.phone = data['phone']
    if 'address' in data:
        company.address = data['address']
    if 'city' in data:
        company.city = data['city']
    if 'state' in data:
        company.state = data['state']
    if 'country' in data:
        company.country = data['country']
    if 'postal_code' in data:
        company.postal_code = data['postal_code']
    if 'is_active' in data:
        company.is_active = data['is_active']
    
    db.session.commit()
    
    return jsonify({
        'id': company.id,
        'name': company.name,
        'description': company.description,
        'email': company.email,
        'phone': company.phone,
        'address': company.address,
        'city': company.city,
        'state': company.state,
        'country': company.country,
        'postal_code': company.postal_code,
        'is_active': company.is_active,
        'created_at': company.created_at.isoformat(),
        'updated_at': company.updated_at.isoformat()
    }), 200

@bp.route('/<int:company_id>', methods=['DELETE'])
@jwt_required()
def delete_company(company_id):
    """Eliminar una compañía."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user.is_admin:
        return jsonify({'error': 'No autorizado'}), 403
    
    company = Company.query.get_or_404(company_id)
    
    # Verificar si hay usuarios o flotas asociadas
    if company.users or company.fleets:
        return jsonify({'error': 'No se puede eliminar una compañía con usuarios o flotas asociadas'}), 400
    
    db.session.delete(company)
    db.session.commit()
    
    return '', 204 