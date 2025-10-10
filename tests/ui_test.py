"""
Pruebas automatizadas para la interfaz de usuario en DobackSoft V2
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

logger = logging.getLogger(__name__)

class UITester:
    """Clase para probar la interfaz de usuario"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.driver = webdriver.Chrome()
        self.wait = WebDriverWait(self.driver, 10)
        
    def __del__(self):
        self.driver.quit()
        
    def test_login_flow(self) -> bool:
        """Prueba el flujo de inicio de sesión"""
        try:
            logger.info("Probando flujo de inicio de sesión...")
            
            # Navegar a la página de inicio de sesión
            self.driver.get(f"{self.base_url}/auth/login")
            
            # Verificar elementos clave
            self.wait.until(EC.presence_of_element_located((By.ID, "email")))
            self.wait.until(EC.presence_of_element_located((By.ID, "password")))
            self.wait.until(EC.presence_of_element_located((By.ID, "submit")))
            
            # Ingresar credenciales de prueba
            self.driver.find_element(By.ID, "email").send_keys("test@example.com")
            self.driver.find_element(By.ID, "password").send_keys("test123")
            self.driver.find_element(By.ID, "submit").click()
            
            # Verificar redirección al panel de control
            self.wait.until(EC.url_contains("/panel_control"))
            
            logger.info("Flujo de inicio de sesión verificado correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en flujo de inicio de sesión: {str(e)}")
            return False
            
    def test_dashboard_flow(self) -> bool:
        """Prueba el flujo del panel de control"""
        try:
            logger.info("Probando flujo del panel de control...")
            
            # Navegar al panel de control
            self.driver.get(f"{self.base_url}/panel_control")
            
            # Verificar elementos clave
            self.wait.until(EC.presence_of_element_located((By.ID, "vehicles_card")))
            self.wait.until(EC.presence_of_element_located((By.ID, "sessions_card")))
            self.wait.until(EC.presence_of_element_located((By.ID, "alerts_card")))
            
            # Probar interacción con tarjetas
            self.driver.find_element(By.ID, "vehicles_card").click()
            self.wait.until(EC.url_contains("/vehicles"))
            
            self.driver.get(f"{self.base_url}/panel_control")
            self.driver.find_element(By.ID, "sessions_card").click()
            self.wait.until(EC.url_contains("/sessions"))
            
            self.driver.get(f"{self.base_url}/panel_control")
            self.driver.find_element(By.ID, "alerts_card").click()
            self.wait.until(EC.url_contains("/alerts"))
            
            logger.info("Flujo del panel de control verificado correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en flujo del panel de control: {str(e)}")
            return False
            
    def test_stability_flow(self) -> bool:
        """Prueba el flujo del módulo de estabilidad"""
        try:
            logger.info("Probando flujo del módulo de estabilidad...")
            
            # Navegar al módulo de estabilidad
            self.driver.get(f"{self.base_url}/estabilidad")
            
            # Verificar elementos clave
            self.wait.until(EC.presence_of_element_located((By.ID, "vehicle_select")))
            self.wait.until(EC.presence_of_element_located((By.ID, "session_select")))
            self.wait.until(EC.presence_of_element_located((By.ID, "stability_chart")))
            
            # Probar selección de vehículo
            vehicle_select = self.driver.find_element(By.ID, "vehicle_select")
            vehicle_select.click()
            vehicle_select.find_element(By.XPATH, "//option[2]").click()
            
            # Probar selección de sesión
            session_select = self.driver.find_element(By.ID, "session_select")
            session_select.click()
            session_select.find_element(By.XPATH, "//option[2]").click()
            
            # Verificar actualización del gráfico
            self.wait.until(EC.presence_of_element_located((By.CLASS_NAME, "plotly-graph-div")))
            
            # Probar generación de informe
            self.driver.find_element(By.ID, "generate_report").click()
            self.wait.until(EC.presence_of_element_located((By.ID, "report_modal")))
            
            logger.info("Flujo del módulo de estabilidad verificado correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en flujo del módulo de estabilidad: {str(e)}")
            return False
            
    def test_telemetry_flow(self) -> bool:
        """Prueba el flujo del módulo de telemetría"""
        try:
            logger.info("Probando flujo del módulo de telemetría...")
            
            # Navegar al módulo de telemetría
            self.driver.get(f"{self.base_url}/telemetria")
            
            # Verificar elementos clave
            self.wait.until(EC.presence_of_element_located((By.ID, "vehicle_select")))
            self.wait.until(EC.presence_of_element_located((By.ID, "session_select")))
            self.wait.until(EC.presence_of_element_located((By.ID, "telemetry_chart")))
            self.wait.until(EC.presence_of_element_located((By.ID, "map")))
            
            # Probar selección de vehículo
            vehicle_select = self.driver.find_element(By.ID, "vehicle_select")
            vehicle_select.click()
            vehicle_select.find_element(By.XPATH, "//option[2]").click()
            
            # Probar selección de sesión
            session_select = self.driver.find_element(By.ID, "session_select")
            session_select.click()
            session_select.find_element(By.XPATH, "//option[2]").click()
            
            # Verificar actualización del gráfico y mapa
            self.wait.until(EC.presence_of_element_located((By.CLASS_NAME, "plotly-graph-div")))
            self.wait.until(EC.presence_of_element_located((By.CLASS_NAME, "map-container")))
            
            # Probar generación de informe
            self.driver.find_element(By.ID, "generate_report").click()
            self.wait.until(EC.presence_of_element_located((By.ID, "report_modal")))
            
            logger.info("Flujo del módulo de telemetría verificado correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en flujo del módulo de telemetría: {str(e)}")
            return False
            
    def test_ia_flow(self) -> bool:
        """Prueba el flujo del módulo de IA"""
        try:
            logger.info("Probando flujo del módulo de IA...")
            
            # Navegar al módulo de IA
            self.driver.get(f"{self.base_url}/ia")
            
            # Verificar elementos clave
            self.wait.until(EC.presence_of_element_located((By.ID, "stability_session_select")))
            self.wait.until(EC.presence_of_element_located((By.ID, "telemetry_session_select")))
            self.wait.until(EC.presence_of_element_located((By.ID, "ia_analysis")))
            
            # Probar selección de sesiones
            stability_select = self.driver.find_element(By.ID, "stability_session_select")
            stability_select.click()
            stability_select.find_element(By.XPATH, "//option[2]").click()
            
            telemetry_select = self.driver.find_element(By.ID, "telemetry_session_select")
            telemetry_select.click()
            telemetry_select.find_element(By.XPATH, "//option[2]").click()
            
            # Verificar análisis de IA
            self.wait.until(EC.presence_of_element_located((By.ID, "ia_results")))
            
            # Probar generación de informe
            self.driver.find_element(By.ID, "generate_report").click()
            self.wait.until(EC.presence_of_element_located((By.ID, "report_modal")))
            
            logger.info("Flujo del módulo de IA verificado correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en flujo del módulo de IA: {str(e)}")
            return False

def test_ui(base_url: str) -> bool:
    """Función principal de prueba de la interfaz de usuario"""
    tester = UITester(base_url)
    
    try:
        # Probar flujo de inicio de sesión
        if not tester.test_login_flow():
            return False
            
        # Probar flujo del panel de control
        if not tester.test_dashboard_flow():
            return False
            
        # Probar flujo del módulo de estabilidad
        if not tester.test_stability_flow():
            return False
            
        # Probar flujo del módulo de telemetría
        if not tester.test_telemetry_flow():
            return False
            
        # Probar flujo del módulo de IA
        if not tester.test_ia_flow():
            return False
            
        return True
        
    except Exception as e:
        logger.error(f"Error en pruebas de interfaz de usuario: {str(e)}")
        return False 