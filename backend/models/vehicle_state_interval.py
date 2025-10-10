"""
Modelo para almacenar intervalos de estados operativos de vehículos.
Persiste los estados calculados para consultas rápidas sin reprocesar datos crudos.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, BigInteger, Index, ForeignKey
from sqlalchemy.orm import relationship
from backend.config.database import Base


class VehicleStateInterval(Base):
    """
    Tabla que almacena intervalos de estados operativos de vehículos.
    
    Claves de estado:
    0 - Taller: en geocerca de taller
    1 - Operativo en parque: en geocerca de parque
    2 - Salida en emergencia: salida de parque con rotativo ON
    3 - En siniestro: parado en mismo punto > 1 min
    4 - Fin de actuación/retirada: tras terminar en lugar hasta inicio retorno
    5 - Regreso al parque: retorno sin rotativo hasta entrada parque
    """
    __tablename__ = 'vehicle_state_intervals'

    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Identificación
    vehicle_id = Column(String(50), nullable=False, index=True)
    organization_id = Column(Integer, ForeignKey('organizations.id'), nullable=False, index=True)
    
    # Estado/Clave (0-5)
    state_key = Column(Integer, nullable=False, index=True)  # 0=Taller, 1=Parque, 2=Emergencia, 3=Siniestro, 4=Fin, 5=Regreso
    
    # Intervalo temporal
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=True)  # NULL si estado activo
    duration_seconds = Column(BigInteger, nullable=True)  # Duración en segundos
    
    # Origen del dato
    origin = Column(String(50), nullable=False)  # 'radar_geofence', 'rotativo', 'gps_parado', 'calculated'
    
    # Metadatos opcionales
    geofence_id = Column(String(100), nullable=True)  # ID de geocerca si aplica
    session_id = Column(String(100), nullable=True)  # ID de sesión si aplica
    
    # Datos adicionales (JSON como string para compatibilidad)
    metadata_json = Column(String(500), nullable=True)  # Datos extra como ubicación, velocidad, etc.
    
    # Auditoría
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    organization = relationship("Organization", backref="vehicle_state_intervals")

    # Índices compuestos para consultas frecuentes
    __table_args__ = (
        Index('idx_vehicle_time_range', 'vehicle_id', 'start_time', 'end_time'),
        Index('idx_org_vehicle_state', 'organization_id', 'vehicle_id', 'state_key'),
        Index('idx_time_range_state', 'start_time', 'end_time', 'state_key'),
    )

    def __repr__(self):
        return f"<VehicleStateInterval(vehicle={self.vehicle_id}, state={self.state_key}, start={self.start_time}, duration={self.duration_seconds}s)>"

    @property
    def state_name(self):
        """Retorna el nombre descriptivo del estado"""
        state_names = {
            0: "Taller",
            1: "Operativo en Parque",
            2: "Salida en Emergencia",
            3: "En Siniestro",
            4: "Fin de Actuación",
            5: "Regreso al Parque"
        }
        return state_names.get(self.state_key, "Desconocido")

    def to_dict(self):
        """Convierte el intervalo a diccionario"""
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'organization_id': self.organization_id,
            'state_key': self.state_key,
            'state_name': self.state_name,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration_seconds': self.duration_seconds,
            'origin': self.origin,
            'geofence_id': self.geofence_id,
            'session_id': self.session_id,
            'metadata': self.metadata_json,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

