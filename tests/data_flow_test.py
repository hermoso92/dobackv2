"""
Pruebas automatizadas para el flujo de datos en DobackSoft V2
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import os
import tempfile
import json

from src.app.models import (
    User, Company, Vehicle, StabilitySession,
    TelemetrySession, StabilityAlert, TelemetryAlert
)
from src.app.modules.estabilidad.services import StabilityService
from src.app.modules.telemetria.services import TelemetryService
from src.app.modules.ia.services import IAService

logger = logging.getLogger(__name__)

class DataFlowTester:
    """Clase para probar el flujo de datos"""
    
    def __init__(self, db, app):
        self.db = db
        self.app = app
        self.stability_service = StabilityService(db)
        self.telemetry_service = TelemetryService(db)
        self.ia_service = IAService(db)
        
    def test_data_upload(self) -> bool:
        """Prueba la subida de datos"""
        try:
            logger.info("Probando subida de datos...")
            
            # Crear archivo de prueba
            with tempfile.NamedTemporaryFile(suffix='.csv', delete=False) as temp_file:
                # Generar datos de prueba
                data = {
                    'timestamp': [datetime.now().isoformat() for _ in range(10)],
                    'roll': [np.random.uniform(-30, 30) for _ in range(10)],
                    'pitch': [np.random.uniform(-30, 30) for _ in range(10)],
                    'yaw': [np.random.uniform(-180, 180) for _ in range(10)],
                    'speed': [np.random.uniform(0, 120) for _ in range(10)],
                    'acceleration': [np.random.uniform(-2, 2) for _ in range(10)]
                }
                df = pd.DataFrame(data)
                df.to_csv(temp_file.name, index=False)
                
                # Probar subida de datos de estabilidad
                with self.app.test_client() as client:
                    response = client.post(
                        '/estabilidad/upload',
                        data={'file': (temp_file, 'test_data.csv')},
                        content_type='multipart/form-data'
                    )
                    if response.status_code != 200:
                        logger.error("Error en subida de datos de estabilidad")
                        return False
                        
                # Probar subida de datos de telemetría
                with self.app.test_client() as client:
                    response = client.post(
                        '/telemetria/upload',
                        data={'file': (temp_file, 'test_data.csv')},
                        content_type='multipart/form-data'
                    )
                    if response.status_code != 200:
                        logger.error("Error en subida de datos de telemetría")
                        return False
                        
            # Eliminar archivo temporal
            os.unlink(temp_file.name)
            
            logger.info("Subida de datos verificada correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en subida de datos: {str(e)}")
            return False
            
    def test_data_processing(self) -> bool:
        """Prueba el procesamiento de datos"""
        try:
            logger.info("Probando procesamiento de datos...")
            
            # Crear sesión de prueba
            session = StabilitySession(
                vehicle_id=1,
                start_time=datetime.now(),
                end_time=datetime.now() + timedelta(hours=1),
                status='processing',
                metadata={'test': 'data'}
            )
            self.db.session.add(session)
            self.db.session.commit()
            
            # Probar procesamiento de datos de estabilidad
            result = self.stability_service.process_session(session.id)
            if not result:
                logger.error("Error en procesamiento de datos de estabilidad")
                return False
                
            # Probar procesamiento de datos de telemetría
            telemetry_session = TelemetrySession(
                vehicle_id=1,
                start_time=datetime.now(),
                end_time=datetime.now() + timedelta(hours=1),
                status='processing',
                metadata={'test': 'data'}
            )
            self.db.session.add(telemetry_session)
            self.db.session.commit()
            
            result = self.telemetry_service.process_session(telemetry_session.id)
            if not result:
                logger.error("Error en procesamiento de datos de telemetría")
                return False
                
            # Limpiar datos de prueba
            self.db.session.delete(session)
            self.db.session.delete(telemetry_session)
            self.db.session.commit()
            
            logger.info("Procesamiento de datos verificado correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en procesamiento de datos: {str(e)}")
            return False
            
    def test_data_analysis(self) -> bool:
        """Prueba el análisis de datos"""
        try:
            logger.info("Probando análisis de datos...")
            
            # Crear sesión de prueba con datos
            session = StabilitySession(
                vehicle_id=1,
                start_time=datetime.now(),
                end_time=datetime.now() + timedelta(hours=1),
                status='completed',
                metadata={
                    'roll': [10, 15, 20, 25, 30],
                    'pitch': [5, 10, 15, 20, 25],
                    'speed': [30, 40, 50, 60, 70]
                }
            )
            self.db.session.add(session)
            self.db.session.commit()
            
            # Probar análisis de estabilidad
            analysis = self.stability_service.analyze_session(session.id)
            if not analysis:
                logger.error("Error en análisis de datos de estabilidad")
                return False
                
            # Probar análisis de telemetría
            telemetry_session = TelemetrySession(
                vehicle_id=1,
                start_time=datetime.now(),
                end_time=datetime.now() + timedelta(hours=1),
                status='completed',
                metadata={
                    'speed': [30, 40, 50, 60, 70],
                    'acceleration': [0.5, 1.0, 1.5, 2.0, 2.5],
                    'brake': [0, 0, 1, 1, 0]
                }
            )
            self.db.session.add(telemetry_session)
            self.db.session.commit()
            
            analysis = self.telemetry_service.analyze_session(telemetry_session.id)
            if not analysis:
                logger.error("Error en análisis de datos de telemetría")
                return False
                
            # Probar análisis de IA
            ia_analysis = self.ia_service.analyze_session(session.id, telemetry_session.id)
            if not ia_analysis:
                logger.error("Error en análisis de IA")
                return False
                
            # Limpiar datos de prueba
            self.db.session.delete(session)
            self.db.session.delete(telemetry_session)
            self.db.session.commit()
            
            logger.info("Análisis de datos verificado correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en análisis de datos: {str(e)}")
            return False
            
    def test_report_generation(self) -> bool:
        """Prueba la generación de informes"""
        try:
            logger.info("Probando generación de informes...")
            
            # Crear sesión de prueba
            session = StabilitySession(
                vehicle_id=1,
                start_time=datetime.now(),
                end_time=datetime.now() + timedelta(hours=1),
                status='completed',
                metadata={'test': 'data'}
            )
            self.db.session.add(session)
            self.db.session.commit()
            
            # Probar generación de informe de estabilidad
            with self.app.test_client() as client:
                response = client.get(f'/estabilidad/report/{session.id}')
                if response.status_code != 200:
                    logger.error("Error en generación de informe de estabilidad")
                    return False
                    
            # Probar generación de informe de telemetría
            telemetry_session = TelemetrySession(
                vehicle_id=1,
                start_time=datetime.now(),
                end_time=datetime.now() + timedelta(hours=1),
                status='completed',
                metadata={'test': 'data'}
            )
            self.db.session.add(telemetry_session)
            self.db.session.commit()
            
            with self.app.test_client() as client:
                response = client.get(f'/telemetria/report/{telemetry_session.id}')
                if response.status_code != 200:
                    logger.error("Error en generación de informe de telemetría")
                    return False
                    
            # Probar generación de informe de IA
            with self.app.test_client() as client:
                response = client.get(f'/ia/report/{session.id}/{telemetry_session.id}')
                if response.status_code != 200:
                    logger.error("Error en generación de informe de IA")
                    return False
                    
            # Limpiar datos de prueba
            self.db.session.delete(session)
            self.db.session.delete(telemetry_session)
            self.db.session.commit()
            
            logger.info("Generación de informes verificada correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en generación de informes: {str(e)}")
            return False

def test_data_flow(db, app) -> bool:
    """Función principal de prueba del flujo de datos"""
    tester = DataFlowTester(db, app)
    
    try:
        # Probar subida de datos
        if not tester.test_data_upload():
            return False
            
        # Probar procesamiento de datos
        if not tester.test_data_processing():
            return False
            
        # Probar análisis de datos
        if not tester.test_data_analysis():
            return False
            
        # Probar generación de informes
        if not tester.test_report_generation():
            return False
            
        return True
        
    except Exception as e:
        logger.error(f"Error en pruebas de flujo de datos: {str(e)}")
        return False 