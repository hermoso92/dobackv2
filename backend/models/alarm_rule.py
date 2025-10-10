"""
Modelo de regla de alarma.
"""

from datetime import datetime
from backend.extensions import db

class AlarmRule(db.Model):
    """Modelo de regla de alarma."""
    
    __tablename__ = 'alarm_rule'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    metric = db.Column(db.String(50), nullable=False)
    operator = db.Column(db.String(20), nullable=False)  # gt, lt, eq, ne, ge, le
    threshold = db.Column(db.Float, nullable=False)
    severity = db.Column(db.String(20), nullable=False)  # info, warning, error, critical
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convierte la regla de alarma a diccionario."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'metric': self.metric,
            'operator': self.operator,
            'threshold': self.threshold,
            'severity': self.severity,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 