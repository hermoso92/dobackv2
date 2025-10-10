"""
Pruebas automatizadas para la carga de datos en DobackSoft V2
"""

import logging
import os
import requests
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class DataUploadTester:
    """Clase para probar la carga de datos"""
    
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.session = requests.Session()
        
    def test_stability_upload(self, file_path: str) -> bool:
        """Prueba la carga de datos de estabilidad"""
        try:
            logger.info("Probando carga de datos de estabilidad...")
            
            if not os.path.exists(file_path):
                logger.error(f"Archivo no encontrado: {file_path}")
                return False
                
            with open(file_path, 'rb') as f:
                files = {'file': f}
                response = self.session.post(
                    f"{self.base_url}/estabilidad/upload",
                    files=files
                )
                
            if response.status_code != 200:
                logger.error(f"Error en carga: {response.status_code}")
                return False
                
            data = response.json()
            if not data.get("success"):
                logger.error(f"Error en respuesta: {data.get('error')}")
                return False
                
            logger.info("Carga de estabilidad exitosa")
            return True
            
        except Exception as e:
            logger.error(f"Error en carga de estabilidad: {str(e)}")
            return False
            
    def test_telemetry_upload(self, file_path: str) -> bool:
        """Prueba la carga de datos de telemetría"""
        try:
            logger.info("Probando carga de datos de telemetría...")
            
            if not os.path.exists(file_path):
                logger.error(f"Archivo no encontrado: {file_path}")
                return False
                
            with open(file_path, 'rb') as f:
                files = {'file': f}
                response = self.session.post(
                    f"{self.base_url}/telemetria/upload",
                    files=files
                )
                
            if response.status_code != 200:
                logger.error(f"Error en carga: {response.status_code}")
                return False
                
            data = response.json()
            if not data.get("success"):
                logger.error(f"Error en respuesta: {data.get('error')}")
                return False
                
            logger.info("Carga de telemetría exitosa")
            return True
            
        except Exception as e:
            logger.error(f"Error en carga de telemetría: {str(e)}")
            return False
            
    def test_batch_upload(self, stability_files: List[str], telemetry_files: List[str]) -> bool:
        """Prueba la carga por lotes"""
        try:
            logger.info("Probando carga por lotes...")
            
            results = []
            
            # Cargar archivos de estabilidad
            for file in stability_files:
                results.append(self.test_stability_upload(file))
                
            # Cargar archivos de telemetría
            for file in telemetry_files:
                results.append(self.test_telemetry_upload(file))
                
            return all(results)
            
        except Exception as e:
            logger.error(f"Error en carga por lotes: {str(e)}")
            return False

def test_data_upload(stability_file: str, telemetry_file: str):
    """Función principal de prueba de carga de datos"""
    tester = DataUploadTester()
    
    # Probar cargas individuales
    stability_ok = tester.test_stability_upload(stability_file)
    telemetry_ok = tester.test_telemetry_upload(telemetry_file)
    
    # Probar carga por lotes
    batch_ok = tester.test_batch_upload([stability_file], [telemetry_file])
    
    return all([stability_ok, telemetry_ok, batch_ok]) 