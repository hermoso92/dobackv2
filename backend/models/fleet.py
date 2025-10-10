"""
Modelo de flota.
"""

from datetime import datetime
from backend.extensions import db

class Fleet(db.Model):
    """Modelo de flota."""
    
    __tablename__ = 'fleet'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=False)
    company = db.relationship('Company', back_populates='fleets')
    vehicles = db.relationship('Vehicle', back_populates='fleet', lazy='dynamic')
    
    def to_dict(self):
        """Convierte la flota a diccionario."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'company_id': self.company_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 