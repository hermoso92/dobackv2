"""
Decoradores personalizados para la aplicación.
"""

from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

def admin_required(fn):
    """Decorador que verifica si el usuario es administrador."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current_user = get_jwt_identity()
        if not current_user.get('is_admin'):
            return jsonify(message='Admin access required'), 403
        return fn(*args, **kwargs)
    return wrapper

def company_required(fn):
    """Decorador que verifica si el usuario pertenece a una compañía."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current_user = get_jwt_identity()
        if not current_user.get('company_id'):
            return jsonify(message='Company access required'), 403
        return fn(*args, **kwargs)
    return wrapper 