"""
Pruebas automatizadas para la API en DobackSoft V2
"""

import logging
import json
import requests
from typing import Dict, List, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class APITester:
    """Clase para probar la API"""
    
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
    def test_vehicles(self) -> bool:
        """Prueba los endpoints de vehículos"""
        try:
            logger.info("Probando endpoints de vehículos...")
            
            # Crear vehículo
            vehicle_data = {
                "name": "Test Vehicle",
                "plate": "TEST-123",
                "type": "car",
                "status": "active"
            }
            
            response = requests.post(
                f"{self.base_url}/api/vehicles",
                headers=self.headers,
                json=vehicle_data
            )
            
            if response.status_code != 201:
                logger.error(f"Error creando vehículo: {response.text}")
                return False
                
            vehicle_id = response.json()["id"]
            
            # Obtener vehículo
            response = requests.get(
                f"{self.base_url}/api/vehicles/{vehicle_id}",
                headers=self.headers
            )
            
            if response.status_code != 200:
                logger.error(f"Error obteniendo vehículo: {response.text}")
                return False
                
            # Actualizar vehículo
            update_data = {"status": "maintenance"}
            response = requests.put(
                f"{self.base_url}/api/vehicles/{vehicle_id}",
                headers=self.headers,
                json=update_data
            )
            
            if response.status_code != 200:
                logger.error(f"Error actualizando vehículo: {response.text}")
                return False
                
            # Eliminar vehículo
            response = requests.delete(
                f"{self.base_url}/api/vehicles/{vehicle_id}",
                headers=self.headers
            )
            
            if response.status_code != 204:
                logger.error(f"Error eliminando vehículo: {response.text}")
                return False
                
            logger.info("Endpoints de vehículos verificados correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en pruebas de vehículos: {str(e)}")
            return False
            
    def test_sessions(self) -> bool:
        """Prueba los endpoints de sesiones"""
        try:
            logger.info("Probando endpoints de sesiones...")
            
            # Crear sesión de estabilidad
            session_data = {
                "vehicle_id": 1,
                "start_time": datetime.now().isoformat(),
                "end_time": (datetime.now() + timedelta(hours=1)).isoformat(),
                "type": "stability"
            }
            
            response = requests.post(
                f"{self.base_url}/api/sessions",
                headers=self.headers,
                json=session_data
            )
            
            if response.status_code != 201:
                logger.error(f"Error creando sesión: {response.text}")
                return False
                
            session_id = response.json()["id"]
            
            # Obtener sesión
            response = requests.get(
                f"{self.base_url}/api/sessions/{session_id}",
                headers=self.headers
            )
            
            if response.status_code != 200:
                logger.error(f"Error obteniendo sesión: {response.text}")
                return False
                
            # Actualizar sesión
            update_data = {"status": "completed"}
            response = requests.put(
                f"{self.base_url}/api/sessions/{session_id}",
                headers=self.headers,
                json=update_data
            )
            
            if response.status_code != 200:
                logger.error(f"Error actualizando sesión: {response.text}")
                return False
                
            # Eliminar sesión
            response = requests.delete(
                f"{self.base_url}/api/sessions/{session_id}",
                headers=self.headers
            )
            
            if response.status_code != 204:
                logger.error(f"Error eliminando sesión: {response.text}")
                return False
                
            logger.info("Endpoints de sesiones verificados correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en pruebas de sesiones: {str(e)}")
            return False
            
    def test_alerts(self) -> bool:
        """Prueba los endpoints de alertas"""
        try:
            logger.info("Probando endpoints de alertas...")
            
            # Crear alerta
            alert_data = {
                "vehicle_id": 1,
                "type": "stability",
                "severity": "high",
                "message": "Test alert",
                "data": {"value": 42}
            }
            
            response = requests.post(
                f"{self.base_url}/api/alerts",
                headers=self.headers,
                json=alert_data
            )
            
            if response.status_code != 201:
                logger.error(f"Error creando alerta: {response.text}")
                return False
                
            alert_id = response.json()["id"]
            
            # Obtener alerta
            response = requests.get(
                f"{self.base_url}/api/alerts/{alert_id}",
                headers=self.headers
            )
            
            if response.status_code != 200:
                logger.error(f"Error obteniendo alerta: {response.text}")
                return False
                
            # Actualizar alerta
            update_data = {"status": "resolved"}
            response = requests.put(
                f"{self.base_url}/api/alerts/{alert_id}",
                headers=self.headers,
                json=update_data
            )
            
            if response.status_code != 200:
                logger.error(f"Error actualizando alerta: {response.text}")
                return False
                
            # Eliminar alerta
            response = requests.delete(
                f"{self.base_url}/api/alerts/{alert_id}",
                headers=self.headers
            )
            
            if response.status_code != 204:
                logger.error(f"Error eliminando alerta: {response.text}")
                return False
                
            logger.info("Endpoints de alertas verificados correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en pruebas de alertas: {str(e)}")
            return False

def test_api(base_url: str, token: str) -> bool:
    """Función principal de prueba de API"""
    tester = APITester(base_url, token)
    
    # Probar endpoints de vehículos
    if not tester.test_vehicles():
        return False
        
    # Probar endpoints de sesiones
    if not tester.test_sessions():
        return False
        
    # Probar endpoints de alertas
    if not tester.test_alerts():
        return False
        
    return True 