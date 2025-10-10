from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.models.base import Base

class ProcessingLog(Base):
    """Modelo para auditar el procesamiento de archivos"""
    __tablename__ = 'processing_logs'

    id = Column(Integer, primary_key=True)
    file_id = Column(Integer, ForeignKey('uploaded_files.id', ondelete='CASCADE'), nullable=False)
    stage = Column(String(50), nullable=False)  # 'validation', 'parsing', 'processing', etc.
    status = Column(String(20), nullable=False)  # 'success', 'error', 'warning'
    message = Column(Text)
    details = Column(JSON)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime)
    duration_ms = Column(Integer)  # Duración en milisegundos
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    file = relationship('UploadedFile', back_populates='processing_logs')

    def __repr__(self):
        return f"<ProcessingLog(id={self.id}, file_id={self.file_id}, stage='{self.stage}', status='{self.status}')>"

    @classmethod
    def create_log(cls, db_session, file_id, stage, status, message=None, details=None):
        """Crea un nuevo registro de procesamiento"""
        log = cls(
            file_id=file_id,
            stage=stage,
            status=status,
            message=message,
            details=details,
            start_time=datetime.utcnow()
        )
        db_session.add(log)
        db_session.flush()
        return log

    def complete(self, status, message=None, details=None):
        """Completa el registro de procesamiento"""
        self.status = status
        if message:
            self.message = message
        if details:
            self.details = details
        self.end_time = datetime.utcnow()
        self.duration_ms = int((self.end_time - self.start_time).total_seconds() * 1000) 