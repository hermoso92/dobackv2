"""
Modelo de compañía.
"""

from datetime import datetime
from backend.extensions import db

class Company(db.Model):
    """Modelo de compañía."""
    
    __tablename__ = 'company'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    address = db.Column(db.String(200))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120), unique=True)
    website = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    users = db.relationship('User', back_populates='company', lazy='dynamic')
    fleets = db.relationship('Fleet', back_populates='company', lazy='dynamic')
    
    def to_dict(self):
        """Convierte la compañía a diccionario."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'address': self.address,
            'phone': self.phone,
            'email': self.email,
            'website': self.website,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 