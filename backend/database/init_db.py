"""
Script para inicializar la base de datos.
"""

import os
import sys
from pathlib import Path

# Agregar el directorio raíz al path de Python
root_dir = Path(__file__).parent.parent.parent
sys.path.append(str(root_dir))

from backend.app import create_app, db
from backend.models import User, Company, Role

def init_db():
    """Inicializa la base de datos con datos de prueba."""
    app = create_app()
    with app.app_context():
        # Crear tablas
        db.create_all()
        
        # Obtener roles existentes
        admin_role = Role.query.filter_by(name='admin').first()
        user_role = Role.query.filter_by(name='user').first()
        
        if not admin_role:
            admin_role = Role(name='admin', description='Administrador del sistema')
            db.session.add(admin_role)
            
        if not user_role:
            user_role = Role(name='user', description='Usuario normal')
            db.session.add(user_role)
        
        # Crear compañía si no existe
        company = Company.query.filter_by(name='Empresa de Prueba').first()
        if not company:
            company = Company(name='Empresa de Prueba')
            db.session.add(company)
            db.session.commit()
        
        # Crear usuario admin si no existe
        admin = User.query.filter_by(email='admin@example.com').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@example.com',
                first_name='Admin',
                last_name='User',
                company_id=company.id
            )
            admin.set_password('admin123')
            admin.roles = [admin_role]
            db.session.add(admin)
        
        # Crear usuario normal si no existe
        user = User.query.filter_by(email='user@example.com').first()
        if not user:
            user = User(
                username='user',
                email='user@example.com',
                first_name='Normal',
                last_name='User',
                company_id=company.id
            )
            user.set_password('user123')
            user.roles = [user_role]
            db.session.add(user)
        
        db.session.commit()

if __name__ == '__main__':
    init_db() 