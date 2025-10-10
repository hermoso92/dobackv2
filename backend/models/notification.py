"""
Modelo de notificación.
"""

from datetime import datetime
from backend.extensions import db

class Notification(db.Model):
    """Modelo de notificación."""
    
    __tablename__ = 'notification'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False)
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship('User', back_populates='notifications')
    
    def to_dict(self):
        """Convierte la notificación a diccionario."""
        return {
            'id': self.id,
            'type': self.type,
            'message': self.message,
            'timestamp': self.timestamp.isoformat(),
            'is_read': self.is_read,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 