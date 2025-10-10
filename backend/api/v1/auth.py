"""
Rutas para autenticación.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash

from app import db
from models import User, Company, Role
from schemas import UserSchema, UserCreateSchema

bp = Blueprint('auth', __name__)
user_schema = UserSchema()
user_create_schema = UserCreateSchema()

@bp.route('/register', methods=['POST'])
def register():
    """
    Registra un nuevo usuario.
    
    Returns:
        JSON: Usuario creado y tokens de acceso.
    """
    try:
        data = request.get_json()
        errors = user_create_schema.validate(data)
        if errors:
            return jsonify({'error': errors}), 400
            
        # Verificar si el usuario ya existe
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
            
        # Verificar si el nombre de usuario ya existe
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already taken'}), 400
            
        # Verificar si la compañía existe
        company = Company.query.get(data['company_id'])
        if not company:
            return jsonify({'error': 'Company not found'}), 404
            
        # Verificar si los roles existen
        roles = Role.query.filter(Role.id.in_(data['role_ids'])).all()
        if len(roles) != len(data['role_ids']):
            return jsonify({'error': 'One or more roles not found'}), 404
            
        # Crear usuario
        user = User(
            username=data['username'],
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            company_id=data['company_id']
        )
        user.set_password(data['password'])
        user.roles = roles
        
        db.session.add(user)
        db.session.commit()
        
        # Generar tokens
        access_token = create_access_token(identity=user_schema.dump(user))
        refresh_token = create_refresh_token(identity=user_schema.dump(user))
        
        return jsonify({
            'user': user_schema.dump(user),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/login', methods=['POST'])
def login():
    """
    Inicia sesión de usuario.
    
    Returns:
        JSON: Tokens de acceso y actualización.
    """
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
            
        user = User.query.filter_by(email=email).first()
        
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({'error': 'Invalid email or password'}), 401
            
        user_data = user_schema.dump(user)
        access_token = create_access_token(identity=user_data)
        refresh_token = create_refresh_token(identity=user_data)
        
        return jsonify({
            'user': user_data,
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Actualiza el token de acceso.
    
    Returns:
        JSON: Nuevo token de acceso.
    """
    try:
        current_user = get_jwt_identity()
        access_token = create_access_token(identity=current_user)
        
        return jsonify({'access_token': access_token}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Obtiene el usuario actual.
    
    Returns:
        JSON: Datos del usuario actual.
    """
    try:
        current_user = get_jwt_identity()
        user = User.query.get(current_user['id'])
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        return jsonify({
            'user': user_schema.dump(user)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500 