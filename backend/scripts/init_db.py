"""
Script para inicializar la base de datos con datos básicos.
"""

import os
import sys
from datetime import datetime

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.app import create_app, db
from backend.models import User, Company, Role
from werkzeug.security import generate_password_hash

def init_db():
    """Inicializa la base de datos con datos básicos."""
    app = create_app()
    
    with app.app_context():
        # Eliminar todas las tablas existentes
        db.drop_all()
        
        # Crear tablas
        db.create_all()
        
        # Crear roles básicos
        roles = {
            'admin': Role(
                name='admin',
                description='Administrador del sistema'
            ),
            'user': Role(
                name='user',
                description='Usuario normal'
            ),
            'viewer': Role(
                name='viewer',
                description='Usuario de solo lectura'
            )
        }
        
        # Guardar roles
        for role in roles.values():
            if not Role.query.filter_by(name=role.name).first():
                db.session.add(role)
        db.session.commit()
        
        # Crear compañía por defecto
        company = Company.query.filter_by(name='DobackSoft').first()
        if not company:
            company = Company(
                name='DobackSoft',
                description='Compañía por defecto',
                email='admin@DobackSoft.com',
                phone='+1234567890',
                address='123 Main St',
                website='https://DobackSoft.com'
            )
            db.session.add(company)
            db.session.commit()
        
        # Crear usuario administrador
        admin = User.query.filter_by(email='admin@DobackSoft.com').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@DobackSoft.com',
                first_name='Admin',
                last_name='User',
                company_id=company.id,
                is_active=True
            )
            admin.set_password('admin123')
            admin.roles = [roles['admin']]
            db.session.add(admin)
            db.session.commit()
        
        print('Base de datos inicializada correctamente.')

if __name__ == '__main__':
    init_db() 