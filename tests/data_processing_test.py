"""
Pruebas automatizadas para la carga y procesamiento de datos en DobackSoft V2
"""

import logging
import requests
import os
import json
from typing import Dict, List, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class DataProcessingTester:
    """Clase para probar la carga y procesamiento de datos"""
    
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.session = requests.Session()
        
    def test_stability_upload(self, file_path: str, vehicle_id: str) -> Optional[str]:
        """Prueba la carga de datos de estabilidad"""
        try:
            logger.info("Probando carga de datos de estabilidad...")
            
            with open(file_path, "rb") as f:
                files = {"file": f}
                data = {"vehicle_id": vehicle_id}
                
                response = self.session.post(
                    f"{self.base_url}/estabilidad/upload",
                    files=files,
                    data=data
                )
                
            if response.status_code != 200:
                logger.error(f"Error en carga: {response.status_code}")
                return None
                
            result = response.json()
            if not result.get("success"):
                logger.error(f"Error en procesamiento: {result.get('error')}")
                return None
                
            session_id = result.get("session_id")
            if not session_id:
                logger.error("No se recibió ID de sesión")
                return None
                
            logger.info("Carga de datos de estabilidad exitosa")
            return session_id
            
        except Exception as e:
            logger.error(f"Error en carga de datos: {str(e)}")
            return None
            
    def test_telemetry_upload(self, file_path: str, vehicle_id: str) -> Optional[str]:
        """Prueba la carga de datos de telemetría"""
        try:
            logger.info("Probando carga de datos de telemetría...")
            
            with open(file_path, "rb") as f:
                files = {"file": f}
                data = {"vehicle_id": vehicle_id}
                
                response = self.session.post(
                    f"{self.base_url}/telemetria/upload",
                    files=files,
                    data=data
                )
                
            if response.status_code != 200:
                logger.error(f"Error en carga: {response.status_code}")
                return None
                
            result = response.json()
            if not result.get("success"):
                logger.error(f"Error en procesamiento: {result.get('error')}")
                return None
                
            session_id = result.get("session_id")
            if not session_id:
                logger.error("No se recibió ID de sesión")
                return None
                
            logger.info("Carga de datos de telemetría exitosa")
            return session_id
            
        except Exception as e:
            logger.error(f"Error en carga de datos: {str(e)}")
            return None
            
    def test_data_processing(self, session_id: str, analysis_type: str) -> bool:
        """Prueba el procesamiento de datos"""
        try:
            logger.info(f"Probando procesamiento de datos de {analysis_type}...")
            
            response = self.session.post(
                f"{self.base_url}/{analysis_type}/process/{session_id}"
            )
            
            if response.status_code != 200:
                logger.error(f"Error en procesamiento: {response.status_code}")
                return False
                
            result = response.json()
            if not result.get("success"):
                logger.error(f"Error en procesamiento: {result.get('error')}")
                return False
                
            # Verificar que se generaron eventos
            events = result.get("events", [])
            if not events:
                logger.warning("No se generaron eventos")
                
            # Verificar que se generaron gráficas
            graphs = result.get("graphs", [])
            if not graphs:
                logger.error("No se generaron gráficas")
                return False
                
            logger.info("Procesamiento de datos exitoso")
            return True
            
        except Exception as e:
            logger.error(f"Error en procesamiento: {str(e)}")
            return False
            
    def test_data_association(self, session_id: str, vehicle_id: str, analysis_type: str) -> bool:
        """Prueba la asociación de datos con vehículo"""
        try:
            logger.info(f"Probando asociación de datos de {analysis_type}...")
            
            response = self.session.post(
                f"{self.base_url}/{analysis_type}/associate/{session_id}",
                json={"vehicle_id": vehicle_id}
            )
            
            if response.status_code != 200:
                logger.error(f"Error en asociación: {response.status_code}")
                return False
                
            result = response.json()
            if not result.get("success"):
                logger.error(f"Error en asociación: {result.get('error')}")
                return False
                
            logger.info("Asociación de datos exitosa")
            return True
            
        except Exception as e:
            logger.error(f"Error en asociación: {str(e)}")
            return False

def test_data_processing(stability_file: str, telemetry_file: str, vehicle_id: str):
    """Función principal de prueba de procesamiento de datos"""
    tester = DataProcessingTester()
    
    # Probar carga de datos
    stability_id = tester.test_stability_upload(stability_file, vehicle_id)
    telemetry_id = tester.test_telemetry_upload(telemetry_file, vehicle_id)
    
    if not stability_id or not telemetry_id:
        return False
        
    # Probar procesamiento
    stability_ok = tester.test_data_processing(stability_id, "estabilidad")
    telemetry_ok = tester.test_data_processing(telemetry_id, "telemetria")
    
    # Probar asociación
    stability_assoc_ok = tester.test_data_association(stability_id, vehicle_id, "estabilidad")
    telemetry_assoc_ok = tester.test_data_association(telemetry_id, vehicle_id, "telemetria")
    
    return all([
        stability_ok,
        telemetry_ok,
        stability_assoc_ok,
        telemetry_assoc_ok
    ]) 