"""
Pruebas automatizadas para la integración entre módulos en DobackSoft V2
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

from src.app.models import (
    User, Company, Vehicle, StabilitySession,
    TelemetrySession, StabilityAlert, TelemetryAlert
)
from src.app.modules.estabilidad.services.stability_service import StabilityService
from src.app.modules.telemetria.services.telemetry_service import TelemetryService
from src.app.modules.ia.services.ai_service import AIService

logger = logging.getLogger(__name__)

class IntegrationTester:
    """Clase para probar la integración entre módulos"""
    
    def __init__(self, db):
        self.db = db
        self.stability_service = StabilityService()
        self.telemetry_service = TelemetryService()
        self.ai_service = AIService()
        
    def test_stability_telemetry_integration(self) -> bool:
        """Prueba la integración entre módulos de estabilidad y telemetría"""
        try:
            logger.info("Probando integración estabilidad-telemetría...")
            
            # Crear datos de prueba para estabilidad
            stability_data = pd.DataFrame({
                'timestamp': pd.date_range(start='2024-01-01', periods=100, freq='S'),
                'roll_angle': np.random.normal(0, 5, 100),
                'pitch_angle': np.random.normal(0, 3, 100),
                'lateral_accel': np.random.normal(0, 0.5, 100),
                'longitudinal_accel': np.random.normal(0, 0.3, 100)
            })
            
            # Crear datos de prueba para telemetría
            telemetry_data = pd.DataFrame({
                'timestamp': pd.date_range(start='2024-01-01', periods=100, freq='S'),
                'speed': np.random.normal(50, 10, 100),
                'rpm': np.random.normal(2000, 500, 100),
                'throttle': np.random.normal(30, 10, 100),
                'brake': np.random.normal(0, 5, 100)
            })
            
            # Analizar datos de estabilidad
            stability_results = self.stability_service.analyze_data(stability_data)
            
            # Analizar datos de telemetría
            telemetry_results = self.telemetry_service.analyze_data(telemetry_data)
            
            # Verificar correlación de eventos
            stability_events = stability_results['events']
            telemetry_events = telemetry_results['events']
            
            if not stability_events or not telemetry_events:
                logger.error("No se generaron eventos en ambos módulos")
                return False
                
            # Verificar que los timestamps coinciden
            stability_times = {event['timestamp'] for event in stability_events}
            telemetry_times = {event['timestamp'] for event in telemetry_events}
            
            if not stability_times.intersection(telemetry_times):
                logger.error("No hay coincidencia de timestamps entre eventos")
                return False
                
            logger.info("Integración estabilidad-telemetría verificada correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en integración estabilidad-telemetría: {str(e)}")
            return False
            
    def test_ai_integration(self) -> bool:
        """Prueba la integración con el módulo de IA"""
        try:
            logger.info("Probando integración con IA...")
            
            # Crear datos de prueba
            test_data = pd.DataFrame({
                'timestamp': pd.date_range(start='2024-01-01', periods=100, freq='S'),
                'roll_angle': np.random.normal(0, 5, 100),
                'pitch_angle': np.random.normal(0, 3, 100),
                'lateral_accel': np.random.normal(0, 0.5, 100),
                'longitudinal_accel': np.random.normal(0, 0.3, 100),
                'speed': np.random.normal(50, 10, 100),
                'rpm': np.random.normal(2000, 500, 100)
            })
            
            # Analizar con IA
            ai_results = self.ai_service.analyze_data(test_data)
            
            # Verificar resultados
            if not isinstance(ai_results, dict):
                logger.error("Resultados de IA no válidos")
                return False
                
            required_keys = ['predictions', 'risk_assessment', 'recommendations']
            if not all(key in ai_results for key in required_keys):
                logger.error("Faltan claves en resultados de IA")
                return False
                
            logger.info("Integración con IA verificada correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en integración con IA: {str(e)}")
            return False
            
    def test_report_integration(self) -> bool:
        """Prueba la integración en la generación de informes"""
        try:
            logger.info("Probando integración en generación de informes...")
            
            # Crear datos de prueba
            test_data = pd.DataFrame({
                'timestamp': pd.date_range(start='2024-01-01', periods=100, freq='S'),
                'roll_angle': np.random.normal(0, 5, 100),
                'pitch_angle': np.random.normal(0, 3, 100),
                'lateral_accel': np.random.normal(0, 0.5, 100),
                'longitudinal_accel': np.random.normal(0, 0.3, 100),
                'speed': np.random.normal(50, 10, 100),
                'rpm': np.random.normal(2000, 500, 100)
            })
            
            # Analizar con todos los servicios
            stability_results = self.stability_service.analyze_data(test_data)
            telemetry_results = self.telemetry_service.analyze_data(test_data)
            ai_results = self.ai_service.analyze_data(test_data)
            
            # Generar informe integrado
            report = self.stability_service.generate_integrated_report(
                stability_results,
                telemetry_results,
                ai_results
            )
            
            # Verificar informe
            if not isinstance(report, dict):
                logger.error("Informe integrado no válido")
                return False
                
            required_sections = [
                'summary',
                'stability_events',
                'telemetry_events',
                'ai_analysis',
                'recommendations',
                'graphs'
            ]
            
            if not all(section in report for section in required_sections):
                logger.error("Faltan secciones en el informe integrado")
                return False
                
            logger.info("Integración en generación de informes verificada correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en integración de informes: {str(e)}")
            return False

def test_integration(db) -> bool:
    """Función principal de prueba de integración"""
    tester = IntegrationTester(db)
    
    # Probar integración estabilidad-telemetría
    if not tester.test_stability_telemetry_integration():
        return False
        
    # Probar integración con IA
    if not tester.test_ai_integration():
        return False
        
    # Probar integración en informes
    if not tester.test_report_integration():
        return False
        
    return True 