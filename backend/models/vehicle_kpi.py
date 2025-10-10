"""
Modelo de KPI de vehículo.
"""

from datetime import datetime
from backend.extensions import db

class VehicleKPI(db.Model):
    """Modelo de KPI de vehículo."""
    __tablename__ = 'VehicleKPI'
    __table_args__ = {'extend_existing': True}

    id = db.Column('id', db.String, primary_key=True)
    vehicleId = db.Column('vehicleId', db.String, db.ForeignKey('vehicle.id'), nullable=False)
    date = db.Column('date', db.Date, nullable=False)
    clave2Minutes = db.Column('clave2Minutes', db.Integer)
    clave5Minutes = db.Column('clave5Minutes', db.Integer)
    outOfParkMinutes = db.Column('outOfParkMinutes', db.Integer)
    eventsHigh = db.Column('eventsHigh', db.Integer)
    eventsModerate = db.Column('eventsModerate', db.Integer)
    timeInWorkshop = db.Column('timeInWorkshop', db.Integer)
    createdAt = db.Column('createdAt', db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column('updatedAt', db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relación inversa
    vehicle = db.relationship('Vehicle', back_populates='vehicle_kpis')

    def to_dict(self):
        return {
            'id': self.id,
            'vehicleId': self.vehicleId,
            'date': self.date.isoformat() if self.date else None,
            'clave2Minutes': self.clave2Minutes,
            'clave5Minutes': self.clave5Minutes,
            'outOfParkMinutes': self.outOfParkMinutes,
            'eventsHigh': self.eventsHigh,
            'eventsModerate': self.eventsModerate,
            'timeInWorkshop': self.timeInWorkshop,
            'createdAt': self.createdAt.isoformat() if self.createdAt else None,
            'updatedAt': self.updatedAt.isoformat() if self.updatedAt else None,
        } 