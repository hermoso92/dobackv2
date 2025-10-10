"""
Modelo de registro de mantenimiento.
"""

from datetime import datetime
from backend.extensions import db

class MaintenanceRecord(db.Model):
    """Modelo de registro de mantenimiento."""
    
    __tablename__ = 'maintenance_record'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    date = db.Column(db.DateTime, nullable=False)
    cost = db.Column(db.Float)
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending, in_progress, completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicle.id'), nullable=False)
    vehicle = db.relationship('Vehicle', back_populates='maintenance_records')
    
    def to_dict(self):
        """Convierte el registro de mantenimiento a diccionario."""
        return {
            'id': self.id,
            'type': self.type,
            'description': self.description,
            'date': self.date.isoformat(),
            'cost': self.cost,
            'status': self.status,
            'vehicle_id': self.vehicle_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 