"""
Pruebas automatizadas para el login en DobackSoft V2
"""

import logging
import requests
from datetime import datetime
from typing import Dict, Optional

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class LoginTester:
    """Clase para probar el login automático"""
    
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.token: Optional[str] = None
        
    def test_login(self, username: str = "admin", password: str = "admin") -> bool:
        """Prueba el proceso de login"""
        try:
            logger.info("Iniciando prueba de login...")
            
            # Realizar petición de login
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json={"username": username, "password": password}
            )
            
            if response.status_code != 200:
                logger.error(f"Error en login: {response.status_code} - {response.text}")
                return False
                
            # Verificar token
            data = response.json()
            if "token" not in data:
                logger.error("No se recibió token en la respuesta")
                return False
                
            self.token = data["token"]
            logger.info("Login exitoso")
            return True
            
        except Exception as e:
            logger.error(f"Error durante el login: {str(e)}")
            return False
            
    def test_protected_route(self) -> bool:
        """Prueba el acceso a una ruta protegida"""
        if not self.token:
            logger.error("No hay token disponible")
            return False
            
        try:
            logger.info("Probando acceso a ruta protegida...")
            
            response = self.session.get(
                f"{self.base_url}/panel_control",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code != 200:
                logger.error(f"Error en ruta protegida: {response.status_code}")
                return False
                
            logger.info("Acceso a ruta protegida exitoso")
            return True
            
        except Exception as e:
            logger.error(f"Error al acceder a ruta protegida: {str(e)}")
            return False

def test_login():
    """Función principal de prueba de login"""
    tester = LoginTester()
    
    # Probar login
    if not tester.test_login():
        return False
        
    # Probar ruta protegida
    if not tester.test_protected_route():
        return False
        
    return True 