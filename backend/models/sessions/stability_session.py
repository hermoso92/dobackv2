"""
Modelo para las sesiones de estabilidad.
"""

from datetime import datetime
from backend.models.core import Base
from backend.app import db

class StabilitySession(Base):
    """Modelo para las sesiones de estabilidad."""
    
    __tablename__ = 'stability_sessions'
    
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='pending')
    session_number = db.Column(db.Integer)
    session_timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    session_duration = db.Column(db.Integer)  # en segundos
    session_type = db.Column(db.String(20))
    session_status = db.Column(db.String(20))
    
    # Relaciones
    vehicle = db.relationship('Vehicle', backref=db.backref('sessions', lazy=True))
    gps_data = db.relationship('GPSData', backref='session', lazy=True)
    can_data = db.relationship('CANData', backref='session', lazy=True)
    stability_data = db.relationship('StabilityData', backref='session', lazy=True)
    events = db.relationship('Event', backref='session', lazy=True)
    metrics = db.relationship('ProcessedSessionMetric', backref='session', lazy=True)
    
    def __repr__(self):
        return f'<StabilitySession {self.id} - Vehicle {self.vehicle_id}>' 