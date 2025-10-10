"""
Pruebas automatizadas para el análisis de datos en DobackSoft V2
"""

import logging
import requests
from typing import Dict, List, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class DataAnalysisTester:
    """Clase para probar el análisis de datos"""
    
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.session = requests.Session()
        
    def test_stability_analysis(self, session_id: str) -> bool:
        """Prueba el análisis de datos de estabilidad"""
        try:
            logger.info("Probando análisis de estabilidad...")
            
            response = self.session.get(
                f"{self.base_url}/estabilidad/analyze/{session_id}"
            )
            
            if response.status_code != 200:
                logger.error(f"Error en análisis: {response.status_code}")
                return False
                
            data = response.json()
            if not data.get("success"):
                logger.error(f"Error en respuesta: {data.get('error')}")
                return False
                
            # Verificar que se detectaron eventos
            events = data.get("events", [])
            if not events:
                logger.warning("No se detectaron eventos de estabilidad")
                
            logger.info("Análisis de estabilidad exitoso")
            return True
            
        except Exception as e:
            logger.error(f"Error en análisis de estabilidad: {str(e)}")
            return False
            
    def test_telemetry_analysis(self, session_id: str) -> bool:
        """Prueba el análisis de datos de telemetría"""
        try:
            logger.info("Probando análisis de telemetría...")
            
            response = self.session.get(
                f"{self.base_url}/telemetria/analyze/{session_id}"
            )
            
            if response.status_code != 200:
                logger.error(f"Error en análisis: {response.status_code}")
                return False
                
            data = response.json()
            if not data.get("success"):
                logger.error(f"Error en respuesta: {data.get('error')}")
                return False
                
            # Verificar que se detectaron eventos
            events = data.get("events", [])
            if not events:
                logger.warning("No se detectaron eventos de telemetría")
                
            logger.info("Análisis de telemetría exitoso")
            return True
            
        except Exception as e:
            logger.error(f"Error en análisis de telemetría: {str(e)}")
            return False
            
    def test_cross_analysis(self, stability_id: str, telemetry_id: str) -> bool:
        """Prueba el análisis cruzado de datos"""
        try:
            logger.info("Probando análisis cruzado...")
            
            response = self.session.post(
                f"{self.base_url}/ia/analyze",
                json={
                    "stability_id": stability_id,
                    "telemetry_id": telemetry_id
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Error en análisis: {response.status_code}")
                return False
                
            data = response.json()
            if not data.get("success"):
                logger.error(f"Error en respuesta: {data.get('error')}")
                return False
                
            # Verificar que se generó el informe
            report = data.get("report", {})
            if not report:
                logger.warning("No se generó informe de análisis cruzado")
                
            logger.info("Análisis cruzado exitoso")
            return True
            
        except Exception as e:
            logger.error(f"Error en análisis cruzado: {str(e)}")
            return False
            
    def test_comparison(self, session_ids: List[str], analysis_type: str) -> bool:
        """Prueba la comparación de sesiones"""
        try:
            logger.info(f"Probando comparación de {analysis_type}...")
            
            response = self.session.post(
                f"{self.base_url}/{analysis_type}/compare",
                json={"session_ids": session_ids}
            )
            
            if response.status_code != 200:
                logger.error(f"Error en comparación: {response.status_code}")
                return False
                
            data = response.json()
            if not data.get("success"):
                logger.error(f"Error en respuesta: {data.get('error')}")
                return False
                
            # Verificar que se generó la comparación
            comparison = data.get("comparison", {})
            if not comparison:
                logger.warning("No se generó comparación")
                
            logger.info("Comparación exitosa")
            return True
            
        except Exception as e:
            logger.error(f"Error en comparación: {str(e)}")
            return False

def test_data_analysis(stability_id: str, telemetry_id: str):
    """Función principal de prueba de análisis de datos"""
    tester = DataAnalysisTester()
    
    # Probar análisis individuales
    stability_ok = tester.test_stability_analysis(stability_id)
    telemetry_ok = tester.test_telemetry_analysis(telemetry_id)
    
    # Probar análisis cruzado
    cross_ok = tester.test_cross_analysis(stability_id, telemetry_id)
    
    # Probar comparaciones
    stability_compare_ok = tester.test_comparison([stability_id], "estabilidad")
    telemetry_compare_ok = tester.test_comparison([telemetry_id], "telemetria")
    
    return all([
        stability_ok, 
        telemetry_ok, 
        cross_ok,
        stability_compare_ok,
        telemetry_compare_ok
    ]) 