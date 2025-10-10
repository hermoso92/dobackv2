"""
Modelo de sesión de estabilidad.
"""

from datetime import datetime
from backend.extensions import db

class StabilitySession(db.Model):
    """Modelo de sesión de estabilidad."""
    
    __tablename__ = 'stability_session'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime)
    duration = db.Column(db.Integer)  # Duración en segundos
    distance = db.Column(db.Float)    # Distancia en metros
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicle.id'), nullable=False)
    vehicle = db.relationship('Vehicle', back_populates='sessions')
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship('User', back_populates='sessions')
    metrics = db.relationship('StabilityMetric', back_populates='session', lazy='dynamic')
    alarms = db.relationship('StabilityAlarm', back_populates='session', lazy='dynamic')
    events = db.relationship('StabilityEvent', back_populates='session', lazy='dynamic')
    
    def to_dict(self):
        """Convierte la sesión a diccionario."""
        return {
            'id': self.id,
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration': self.duration,
            'distance': self.distance,
            'vehicle_id': self.vehicle_id,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 