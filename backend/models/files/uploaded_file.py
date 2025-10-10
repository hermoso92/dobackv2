from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from backend.models.base import Base

class UploadedFile(Base):
    """Modelo para gestionar los archivos subidos"""
    __tablename__ = 'uploaded_files'

    id = Column(Integer, primary_key=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # 'gps', 'can', 'stability'
    file_size = Column(Integer, nullable=False)  # Tamaño en bytes
    file_hash = Column(String(64), nullable=False, unique=True)  # SHA-256
    upload_path = Column(String(512), nullable=False)
    status = Column(String(20), nullable=False, default='pending')  # 'pending', 'processing', 'completed', 'error'
    error_message = Column(Text)
    metadata = Column(JSON)
    is_processed = Column(Boolean, default=False)
    processing_started_at = Column(DateTime)
    processing_completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    processing_logs = relationship('ProcessingLog', back_populates='file', cascade='all, delete-orphan')
    sessions = relationship('StabilitySession', back_populates='source_file')

    def __repr__(self):
        return f"<UploadedFile(id={self.id}, filename='{self.filename}', type='{self.file_type}', status='{self.status}')>"

    @classmethod
    def create_file(cls, db_session, filename, original_filename, file_type, file_size, file_hash, upload_path, metadata=None):
        """Crea un nuevo registro de archivo subido"""
        file = cls(
            filename=filename,
            original_filename=original_filename,
            file_type=file_type,
            file_size=file_size,
            file_hash=file_hash,
            upload_path=upload_path,
            metadata=metadata or {}
        )
        db_session.add(file)
        db_session.flush()
        return file

    def start_processing(self):
        """Marca el inicio del procesamiento"""
        self.status = 'processing'
        self.processing_started_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def complete_processing(self, success=True, error_message=None):
        """Marca el fin del procesamiento"""
        self.status = 'completed' if success else 'error'
        self.error_message = error_message
        self.is_processed = success
        self.processing_completed_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def get_processing_duration(self):
        """Retorna la duración del procesamiento en segundos"""
        if not self.processing_started_at or not self.processing_completed_at:
            return None
        return (self.processing_completed_at - self.processing_started_at).total_seconds() 