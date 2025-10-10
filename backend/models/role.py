"""
Modelo de rol.
"""

from datetime import datetime
from backend.extensions import db

class Role(db.Model):
    """Modelo de rol."""
    
    __tablename__ = 'role'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    users = db.relationship('User', secondary='user_roles', back_populates='roles')
    
    def to_dict(self):
        """Convierte el rol a diccionario."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

# Tabla de asociación para la relación muchos a muchos entre usuarios y roles
user_roles = db.Table('user_roles',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('role_id', db.Integer, db.ForeignKey('role.id'), primary_key=True),
    db.Column('created_at', db.DateTime, default=datetime.utcnow),
    extend_existing=True
) 