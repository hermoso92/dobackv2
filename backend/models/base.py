"""
Modelo base para todos los modelos de la aplicación.
"""

from backend.extensions import db

class BaseModel(db.Model):
    """Clase base para todos los modelos."""
    
    __abstract__ = True
    __table_args__ = {'extend_existing': True} 