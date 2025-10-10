"""
Pruebas automatizadas para la generación de informes en DobackSoft V2
"""

import logging
import requests
import os
from typing import Dict, List, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class ReportGenerationTester:
    """Clase para probar la generación de informes"""
    
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.session = requests.Session()
        
    def test_stability_report(self, session_id: str) -> bool:
        """Prueba la generación de informe de estabilidad"""
        try:
            logger.info("Probando generación de informe de estabilidad...")
            
            response = self.session.get(
                f"{self.base_url}/estabilidad/report/{session_id}"
            )
            
            if response.status_code != 200:
                logger.error(f"Error en generación: {response.status_code}")
                return False
                
            # Verificar que se generó el PDF
            if not response.headers.get("Content-Type", "").startswith("application/pdf"):
                logger.error("No se generó PDF de informe")
                return False
                
            # Guardar el PDF para verificación
            report_path = f"stability_report_{session_id}.pdf"
            with open(report_path, "wb") as f:
                f.write(response.content)
                
            if not os.path.exists(report_path):
                logger.error("No se pudo guardar el PDF")
                return False
                
            logger.info("Generación de informe de estabilidad exitosa")
            return True
            
        except Exception as e:
            logger.error(f"Error en generación de informe: {str(e)}")
            return False
            
    def test_telemetry_report(self, session_id: str) -> bool:
        """Prueba la generación de informe de telemetría"""
        try:
            logger.info("Probando generación de informe de telemetría...")
            
            response = self.session.get(
                f"{self.base_url}/telemetria/report/{session_id}"
            )
            
            if response.status_code != 200:
                logger.error(f"Error en generación: {response.status_code}")
                return False
                
            # Verificar que se generó el PDF
            if not response.headers.get("Content-Type", "").startswith("application/pdf"):
                logger.error("No se generó PDF de informe")
                return False
                
            # Guardar el PDF para verificación
            report_path = f"telemetry_report_{session_id}.pdf"
            with open(report_path, "wb") as f:
                f.write(response.content)
                
            if not os.path.exists(report_path):
                logger.error("No se pudo guardar el PDF")
                return False
                
            logger.info("Generación de informe de telemetría exitosa")
            return True
            
        except Exception as e:
            logger.error(f"Error en generación de informe: {str(e)}")
            return False
            
    def test_ia_report(self, stability_id: str, telemetry_id: str) -> bool:
        """Prueba la generación de informe de IA"""
        try:
            logger.info("Probando generación de informe de IA...")
            
            response = self.session.post(
                f"{self.base_url}/ia/report",
                json={
                    "stability_id": stability_id,
                    "telemetry_id": telemetry_id
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Error en generación: {response.status_code}")
                return False
                
            # Verificar que se generó el PDF
            if not response.headers.get("Content-Type", "").startswith("application/pdf"):
                logger.error("No se generó PDF de informe")
                return False
                
            # Guardar el PDF para verificación
            report_path = f"ia_report_{stability_id}_{telemetry_id}.pdf"
            with open(report_path, "wb") as f:
                f.write(response.content)
                
            if not os.path.exists(report_path):
                logger.error("No se pudo guardar el PDF")
                return False
                
            logger.info("Generación de informe de IA exitosa")
            return True
            
        except Exception as e:
            logger.error(f"Error en generación de informe: {str(e)}")
            return False
            
    def test_comparison_report(self, session_ids: List[str], analysis_type: str) -> bool:
        """Prueba la generación de informe de comparación"""
        try:
            logger.info(f"Probando generación de informe de comparación de {analysis_type}...")
            
            response = self.session.post(
                f"{self.base_url}/{analysis_type}/report/compare",
                json={"session_ids": session_ids}
            )
            
            if response.status_code != 200:
                logger.error(f"Error en generación: {response.status_code}")
                return False
                
            # Verificar que se generó el PDF
            if not response.headers.get("Content-Type", "").startswith("application/pdf"):
                logger.error("No se generó PDF de informe")
                return False
                
            # Guardar el PDF para verificación
            report_path = f"comparison_report_{'_'.join(session_ids)}.pdf"
            with open(report_path, "wb") as f:
                f.write(response.content)
                
            if not os.path.exists(report_path):
                logger.error("No se pudo guardar el PDF")
                return False
                
            logger.info("Generación de informe de comparación exitosa")
            return True
            
        except Exception as e:
            logger.error(f"Error en generación de informe: {str(e)}")
            return False

def test_report_generation(stability_id: str, telemetry_id: str):
    """Función principal de prueba de generación de informes"""
    tester = ReportGenerationTester()
    
    # Probar generación de informes individuales
    stability_ok = tester.test_stability_report(stability_id)
    telemetry_ok = tester.test_telemetry_report(telemetry_id)
    
    # Probar generación de informe de IA
    ia_ok = tester.test_ia_report(stability_id, telemetry_id)
    
    # Probar generación de informes de comparación
    stability_compare_ok = tester.test_comparison_report([stability_id], "estabilidad")
    telemetry_compare_ok = tester.test_comparison_report([telemetry_id], "telemetria")
    
    return all([
        stability_ok, 
        telemetry_ok, 
        ia_ok,
        stability_compare_ok,
        telemetry_compare_ok
    ]) 