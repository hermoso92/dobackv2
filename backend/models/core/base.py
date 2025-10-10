"""
Clase base para modelos.
"""

from datetime import datetime
from typing import Any, Dict, Optional
from backend.app import db

class Base(db.Model):
    """Clase base abstracta para todos los modelos."""
    
    __abstract__ = True
    
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    def save(self) -> None:
        """Guarda el objeto en la base de datos."""
        db.session.add(self)
        db.session.commit()
        
    def delete(self) -> None:
        """Elimina el objeto de la base de datos."""
        db.session.delete(self)
        db.session.commit()
        
    @classmethod
    def get_by_id(cls, id: int) -> Optional['Base']:
        """Obtiene un objeto por su ID."""
        return db.session.query(cls).get(id)
        
    @classmethod
    def get_all(cls) -> list['Base']:
        """Obtiene todos los objetos de la clase."""
        return db.session.query(cls).all()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convierte el objeto a un diccionario."""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        } 