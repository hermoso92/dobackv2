"""
Modelo de vehículo.
"""

from datetime import datetime
from backend.extensions import db

class Vehicle(db.Model):
    """Modelo de vehículo."""
    
    __tablename__ = 'vehicle'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    plate_number = db.Column(db.String(20), unique=True)
    model = db.Column(db.String(100))
    year = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    fleet_id = db.Column(db.Integer, db.ForeignKey('fleet.id'), nullable=False)
    fleet = db.relationship('Fleet', back_populates='vehicles')
    sessions = db.relationship('Session', back_populates='vehicle', lazy='dynamic')
    maintenance_records = db.relationship('MaintenanceRecord', back_populates='vehicle', lazy='dynamic')
    vehicle_kpis = db.relationship('VehicleKPI', back_populates='vehicle', lazy='dynamic')
    
    def to_dict(self):
        """Convierte el vehículo a diccionario."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'plate_number': self.plate_number,
            'model': self.model,
            'year': self.year,
            'fleet_id': self.fleet_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 