"""
Pruebas automatizadas para la lógica de negocio en DobackSoft V2
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

logger = logging.getLogger(__name__)

class BusinessTester:
    """Clase para probar la lógica de negocio"""
    
    def __init__(self, db):
        self.db = db
        self.stability_service = StabilityService()
        self.telemetry_service = TelemetryService()
        
    def test_stability_analysis(self) -> bool:
        """Prueba el análisis de estabilidad"""
        try:
            logger.info("Probando análisis de estabilidad...")
            
            # Crear datos de prueba
            test_data = pd.DataFrame({
                'timestamp': pd.date_range(start='2024-01-01', periods=100, freq='S'),
                'roll_angle': np.random.normal(0, 5, 100),
                'pitch_angle': np.random.normal(0, 3, 100),
                'lateral_accel': np.random.normal(0, 0.5, 100),
                'longitudinal_accel': np.random.normal(0, 0.3, 100)
            })
            
            # Analizar datos
            results = self.stability_service.analyze_data(test_data)
            
            # Verificar resultados
            if not isinstance(results, dict):
                logger.error("Resultados de análisis no válidos")
                return False
                
            required_keys = ['events', 'metrics', 'risk_level']
            if not all(key in results for key in required_keys):
                logger.error("Faltan claves en resultados de análisis")
                return False
                
            logger.info("Análisis de estabilidad verificado correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en análisis de estabilidad: {str(e)}")
            return False
            
    def test_telemetry_analysis(self) -> bool:
        """Prueba el análisis de telemetría"""
        try:
            logger.info("Probando análisis de telemetría...")
            
            # Crear datos de prueba
            test_data = pd.DataFrame({
                'timestamp': pd.date_range(start='2024-01-01', periods=100, freq='S'),
                'speed': np.random.normal(50, 10, 100),
                'rpm': np.random.normal(2000, 500, 100),
                'throttle': np.random.normal(30, 10, 100),
                'brake': np.random.normal(0, 5, 100)
            })
            
            # Analizar datos
            results = self.telemetry_service.analyze_data(test_data)
            
            # Verificar resultados
            if not isinstance(results, dict):
                logger.error("Resultados de análisis no válidos")
                return False
                
            required_keys = ['events', 'metrics', 'alerts']
            if not all(key in results for key in required_keys):
                logger.error("Faltan claves en resultados de análisis")
                return False
                
            logger.info("Análisis de telemetría verificado correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en análisis de telemetría: {str(e)}")
            return False
            
    def test_alert_generation(self) -> bool:
        """Prueba la generación de alertas"""
        try:
            logger.info("Probando generación de alertas...")
            
            # Crear datos de prueba
            test_data = pd.DataFrame({
                'timestamp': pd.date_range(start='2024-01-01', periods=100, freq='S'),
                'roll_angle': np.random.normal(0, 10, 100),  # Valores más extremos
                'pitch_angle': np.random.normal(0, 8, 100),
                'lateral_accel': np.random.normal(0, 1, 100),
                'longitudinal_accel': np.random.normal(0, 0.8, 100)
            })
            
            # Analizar datos
            results = self.stability_service.analyze_data(test_data)
            
            # Verificar alertas
            if not results['events']:
                logger.error("No se generaron alertas con datos de prueba")
                return False
                
            # Verificar tipos de alertas
            alert_types = {alert['type'] for alert in results['events']}
            expected_types = {'rollover_risk', 'oversteer', 'understeer'}
            
            if not expected_types.issubset(alert_types):
                logger.error("Faltan tipos de alertas esperadas")
                return False
                
            logger.info("Generación de alertas verificada correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en generación de alertas: {str(e)}")
            return False
            
    def test_report_generation(self) -> bool:
        """Prueba la generación de informes"""
        try:
            logger.info("Probando generación de informes...")
            
            # Crear datos de prueba
            test_data = pd.DataFrame({
                'timestamp': pd.date_range(start='2024-01-01', periods=100, freq='S'),
                'roll_angle': np.random.normal(0, 5, 100),
                'pitch_angle': np.random.normal(0, 3, 100),
                'lateral_accel': np.random.normal(0, 0.5, 100),
                'longitudinal_accel': np.random.normal(0, 0.3, 100)
            })
            
            # Analizar datos
            results = self.stability_service.analyze_data(test_data)
            
            # Generar informe
            report = self.stability_service.generate_report(results)
            
            # Verificar informe
            if not isinstance(report, dict):
                logger.error("Informe generado no válido")
                return False
                
            required_sections = ['summary', 'events', 'metrics', 'graphs']
            if not all(section in report for section in required_sections):
                logger.error("Faltan secciones en el informe")
                return False
                
            logger.info("Generación de informes verificada correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en generación de informes: {str(e)}")
            return False

def test_business_logic(db) -> bool:
    """Función principal de prueba de lógica de negocio"""
    tester = BusinessTester(db)
    
    # Probar análisis de estabilidad
    if not tester.test_stability_analysis():
        return False
        
    # Probar análisis de telemetría
    if not tester.test_telemetry_analysis():
        return False
        
    # Probar generación de alertas
    if not tester.test_alert_generation():
        return False
        
    # Probar generación de informes
    if not tester.test_report_generation():
        return False
        
    return True 