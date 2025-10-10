"""
Rutas para empresas.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from backend.app import db
from backend.models import Company
from backend.schemas import CompanySchema, CompanyCreateSchema, CompanyUpdateSchema

bp = Blueprint('companies', __name__)
company_schema = CompanySchema()
company_create_schema = CompanyCreateSchema()
company_update_schema = CompanyUpdateSchema()

@bp.route('/', methods=['GET'])
@jwt_required()
def get_companies():
    """
    Obtiene todas las empresas.
    
    Returns:
        JSON: Lista de empresas.
    """
    try:
        companies = Company.query.all()
        return jsonify({
            'companies': [company_schema.dump(company) for company in companies]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_company(id):
    """
    Obtiene una empresa por su ID.
    
    Args:
        id: ID de la empresa.
        
    Returns:
        JSON: Empresa.
    """
    try:
        company = Company.query.get_or_404(id)
        return jsonify(company_schema.dump(company)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/', methods=['POST'])
@jwt_required()
def create_company():
    """
    Crea una nueva empresa.
    
    Returns:
        JSON: Empresa creada.
    """
    try:
        data = request.get_json()
        errors = company_create_schema.validate(data)
        if errors:
            return jsonify({'error': errors}), 400
            
        company = Company(**data)
        db.session.add(company)
        db.session.commit()
        
        return jsonify(company_schema.dump(company)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_company(id):
    """
    Actualiza una empresa.
    
    Args:
        id: ID de la empresa.
        
    Returns:
        JSON: Empresa actualizada.
    """
    try:
        company = Company.query.get_or_404(id)
        data = request.get_json()
        
        errors = company_update_schema.validate(data)
        if errors:
            return jsonify({'error': errors}), 400
            
        for key, value in data.items():
            setattr(company, key, value)
            
        db.session.commit()
        
        return jsonify(company_schema.dump(company)), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_company(id):
    """
    Elimina una empresa.
    
    Args:
        id: ID de la empresa.
        
    Returns:
        JSON: Mensaje de éxito.
    """
    try:
        company = Company.query.get_or_404(id)
        db.session.delete(company)
        db.session.commit()
        
        return jsonify({'message': 'Company deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500 