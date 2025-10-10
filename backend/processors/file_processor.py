from typing import Dict, List, Optional
import os
import hashlib
from datetime import datetime
import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session
from .session_processor import SessionProcessor
from .metrics_processor import MetricsProcessor
from .alarm_processor import AlarmProcessor
from .overspeed_processor import OverspeedProcessor

class FileProcessor:
    def __init__(self, db_session: Session):
        self.session = db_session
        self.session_processor = SessionProcessor(db_session)
        self.metrics_processor = MetricsProcessor(db_session)
        self.alarm_processor = AlarmProcessor(db_session)
        self.overspeed_processor = OverspeedProcessor(db_session)
        
    def process_file(self, file_path: str, vehicle_id: int) -> Dict:
        """Procesa un archivo de datos."""
        try:
            # 1. Validar archivo y calcular hash
            if not self._validate_file(file_path):
                raise ValueError("Archivo inválido")
                
            file_hash = self._calculate_file_hash(file_path)
            if self._is_duplicate(file_hash):
                return {
                    "status": "error",
                    "message": "Archivo duplicado",
                    "file_hash": file_hash
                }
            
            # 2. Crear registro de archivo
            file_id = self._create_file_record(file_path, file_hash)
            
            # 3. Detectar y procesar sesiones
            sessions = self._detect_sessions(file_path)
            processed_sessions = []
            
            for session_data in sessions:
                # Validar y crear sesión
                session_id = self._create_session(session_data, vehicle_id, file_id)
                if not session_id:
                    continue
                    
                # Procesar datos según tipo
                self._process_session_data(session_id, session_data)
                
                # Procesar métricas y alarmas
                self._process_metrics_and_alarms(session_id)
                
                processed_sessions.append(session_id)
            
            # 4. Actualizar estado del archivo
            self._update_file_status(file_id, len(processed_sessions))
            
            return {
                "status": "success",
                "file_id": file_id,
                "processed_sessions": processed_sessions,
                "message": f"Procesados {len(processed_sessions)} sesiones"
            }
            
        except Exception as e:
            self._log_error(file_id if 'file_id' in locals() else None, str(e))
            return {
                "status": "error",
                "message": str(e)
            }
    
    def _validate_file(self, file_path: str) -> bool:
        """Valida que el archivo exista y tenga el formato correcto."""
        if not os.path.exists(file_path):
            return False
            
        # Validar extensión
        valid_extensions = [".gps", ".can", ".stb"]
        file_ext = os.path.splitext(file_path)[1].lower()
        if file_ext not in valid_extensions:
            return False
            
        # Validar contenido mínimo
        try:
            with open(file_path, 'r') as f:
                header = f.readline().strip()
                if not header:
                    return False
        except:
            return False
            
        return True
    
    def _calculate_file_hash(self, file_path: str) -> str:
        """Calcula el hash SHA-256 del archivo."""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    def _is_duplicate(self, file_hash: str) -> bool:
        """Verifica si el archivo ya existe en la base de datos."""
        result = self.session.execute(
            text("SELECT id FROM uploaded_files WHERE file_hash = :hash"),
            {"hash": file_hash}
        ).fetchone()
        return result is not None
    
    def _create_file_record(self, file_path: str, file_hash: str) -> int:
        """Crea un registro en uploaded_files."""
        filename = os.path.basename(file_path)
        file_type = os.path.splitext(filename)[1][1:].upper()
        
        result = self.session.execute(
            text("""
                INSERT INTO uploaded_files 
                (filename, file_type, file_hash, processing_status, created_at)
                VALUES (:filename, :type, :hash, 'processing', CURRENT_TIMESTAMP)
                RETURNING id
            """),
            {
                "filename": filename,
                "type": file_type,
                "hash": file_hash
            }
        )
        self.session.commit()
        return result.fetchone()[0]
    
    def _detect_sessions(self, file_path: str) -> List[Dict]:
        """Detecta las sesiones en el archivo."""
        sessions = []
        current_session = None
        
        with open(file_path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                    
                # Detectar cabecera de sesión
                if line.startswith(('GPS;', 'CAN;', 'STB;')):
                    if current_session:
                        sessions.append(current_session)
                    current_session = {
                        "header": line,
                        "data": [],
                        "type": line.split(';')[0]
                    }
                elif current_session:
                    current_session["data"].append(line)
        
        if current_session:
            sessions.append(current_session)
            
        return sessions
    
    def _create_session(self, session_data: Dict, vehicle_id: int, file_id: int) -> Optional[int]:
        """Crea un registro de sesión."""
        try:
            # Parsear cabecera
            header_parts = session_data["header"].split(';')
            if len(header_parts) < 5:
                raise ValueError("Formato de cabecera inválido")
                
            session_number = int(header_parts[3])
            session_timestamp = datetime.strptime(header_parts[1], '%d/%m/%Y %I:%M:%S%p')
            
            # Verificar duplicado de sesión
            existing = self.session.execute(
                text("""
                    SELECT id FROM stability_sessions 
                    WHERE vehicle_id = :vehicle_id 
                    AND session_number = :session_number
                    AND session_timestamp = :timestamp
                """),
                {
                    "vehicle_id": vehicle_id,
                    "session_number": session_number,
                    "timestamp": session_timestamp
                }
            ).fetchone()
            
            if existing:
                print(f"Sesión duplicada: {session_number}")
                return None
            
            # Crear sesión
            result = self.session.execute(
                text("""
                    INSERT INTO stability_sessions 
                    (vehicle_id, session_number, session_timestamp, session_type,
                     session_status, uploaded_file_id, created_at)
                    VALUES 
                    (:vehicle_id, :session_number, :timestamp, :type,
                     'processing', :file_id, CURRENT_TIMESTAMP)
                    RETURNING id
                """),
                {
                    "vehicle_id": vehicle_id,
                    "session_number": session_number,
                    "timestamp": session_timestamp,
                    "type": session_data["type"],
                    "file_id": file_id
                }
            )
            self.session.commit()
            return result.fetchone()[0]
            
        except Exception as e:
            print(f"Error creando sesión: {str(e)}")
            self.session.rollback()
            return None
    
    def _process_session_data(self, session_id: int, session_data: Dict):
        """Procesa los datos de la sesión según su tipo."""
        try:
            self.session_processor.insert_session_data(
                session_id=session_id,
                data=session_data["data"],
                data_type=session_data["type"]
            )
        except Exception as e:
            print(f"Error procesando datos de sesión {session_id}: {str(e)}")
            raise
    
    def _process_metrics_and_alarms(self, session_id: int):
        """Procesa métricas y alarmas para una sesión."""
        try:
            # Procesar métricas
            self.metrics_processor.process_metrics(session_id)
            
            # Procesar alarmas
            self.alarm_processor.process_alarms(session_id)
            
            # Procesar eventos de exceso de velocidad
            try:
                inserted = self.overspeed_processor.process(session_id)
                print(f"OverspeedProcessor: insertados {inserted} eventos de límite superado (sesión {session_id})")
            except Exception as os_err:
                print(f"Error en OverspeedProcessor para sesión {session_id}: {os_err}")
            
            # Actualizar estado de sesión
            self._update_session_status(session_id, "completed")
            
        except Exception as e:
            print(f"Error procesando métricas/alarmas de sesión {session_id}: {str(e)}")
            self._update_session_status(session_id, "failed")
            raise
    
    def _update_file_status(self, file_id: int, processed_sessions: int):
        """Actualiza el estado del archivo procesado."""
        try:
            self.session.execute(
                text("""
                    UPDATE uploaded_files 
                    SET processing_status = 'completed',
                        processed_sessions = :sessions,
                        processing_completed_at = CURRENT_TIMESTAMP
                    WHERE id = :id
                """),
                {
                    "id": file_id,
                    "sessions": processed_sessions
                }
            )
            self.session.commit()
        except Exception as e:
            print(f"Error actualizando estado de archivo: {str(e)}")
            self.session.rollback()
    
    def _update_session_status(self, session_id: int, status: str):
        """Actualiza el estado de una sesión."""
        try:
            self.session.execute(
                text("""
                    UPDATE stability_sessions 
                    SET session_status = :status,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = :id
                """),
                {"id": session_id, "status": status}
            )
            self.session.commit()
        except Exception as e:
            print(f"Error actualizando estado de sesión: {str(e)}")
            self.session.rollback()
    
    def _log_error(self, file_id: Optional[int], error_message: str):
        """Registra un error en el log."""
        try:
            self.session.execute(
                text("""
                    INSERT INTO processing_errors 
                    (file_id, error_message, created_at)
                    VALUES (:file_id, :message, CURRENT_TIMESTAMP)
                """),
                {
                    "file_id": file_id,
                    "message": error_message
                }
            )
            self.session.commit()
        except Exception as e:
            print(f"Error registrando error: {str(e)}")
            self.session.rollback() 