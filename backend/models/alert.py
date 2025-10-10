"""
Modelo de alerta.
"""

from datetime import datetime
from backend.extensions import db

class Alert(db.Model):
    """Modelo de alerta."""
    
    __tablename__ = 'alert'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, nullable=False)
    severity = db.Column(db.String(20), nullable=False)  # info, warning, error, critical
    status = db.Column(db.String(20), nullable=False, default='active')  # active, acknowledged, resolved
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    session_id = db.Column(db.Integer, db.ForeignKey('stability_session.id'), nullable=False)
    session = db.relationship('StabilitySession', back_populates='alarms')
    
    def to_dict(self):
        """Convierte la alerta a diccionario."""
        return {
            'id': self.id,
            'type': self.type,
            'description': self.description,
            'timestamp': self.timestamp.isoformat(),
            'severity': self.severity,
            'status': self.status,
            'session_id': self.session_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 