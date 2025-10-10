"""
Pruebas automatizadas para la seguridad en DobackSoft V2
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import pytest
import requests
from flask import url_for
from werkzeug.security import generate_password_hash

logger = logging.getLogger(__name__)

class SecurityTester:
    """Clase para probar la seguridad de la aplicación"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        
    def test_authentication(self) -> bool:
        """Prueba la autenticación de usuarios"""
        try:
            logger.info("Probando autenticación de usuarios...")
            
            # Probar inicio de sesión con credenciales válidas
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json={
                    "email": "test@example.com",
                    "password": "test123"
                }
            )
            if response.status_code != 200:
                logger.error("Error en inicio de sesión con credenciales válidas")
                return False
                
            # Probar inicio de sesión con credenciales inválidas
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json={
                    "email": "invalid@example.com",
                    "password": "invalid"
                }
            )
            if response.status_code != 401:
                logger.error("No se rechazó inicio de sesión con credenciales inválidas")
                return False
                
            # Probar acceso a ruta protegida sin autenticación
            self.session.cookies.clear()
            response = self.session.get(f"{self.base_url}/panel_control")
            if response.status_code != 401:
                logger.error("No se rechazó acceso a ruta protegida sin autenticación")
                return False
                
            logger.info("Autenticación de usuarios verificada correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en prueba de autenticación: {str(e)}")
            return False
            
    def test_authorization(self) -> bool:
        """Prueba la autorización de usuarios"""
        try:
            logger.info("Probando autorización de usuarios...")
            
            # Iniciar sesión como usuario normal
            self.session.post(
                f"{self.base_url}/auth/login",
                json={
                    "email": "user@example.com",
                    "password": "user123"
                }
            )
            
            # Probar acceso a rutas de administrador
            response = self.session.get(f"{self.base_url}/admin")
            if response.status_code != 403:
                logger.error("No se rechazó acceso a ruta de administrador")
                return False
                
            # Probar acceso a rutas de usuario
            response = self.session.get(f"{self.base_url}/panel_control")
            if response.status_code != 200:
                logger.error("No se permitió acceso a ruta de usuario")
                return False
                
            # Iniciar sesión como administrador
            self.session.post(
                f"{self.base_url}/auth/login",
                json={
                    "email": "admin@example.com",
                    "password": "admin123"
                }
            )
            
            # Probar acceso a rutas de administrador
            response = self.session.get(f"{self.base_url}/admin")
            if response.status_code != 200:
                logger.error("No se permitió acceso a ruta de administrador")
                return False
                
            logger.info("Autorización de usuarios verificada correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en prueba de autorización: {str(e)}")
            return False
            
    def test_session_management(self) -> bool:
        """Prueba la gestión de sesiones"""
        try:
            logger.info("Probando gestión de sesiones...")
            
            # Iniciar sesión
            self.session.post(
                f"{self.base_url}/auth/login",
                json={
                    "email": "test@example.com",
                    "password": "test123"
                }
            )
            
            # Probar acceso con sesión válida
            response = self.session.get(f"{self.base_url}/panel_control")
            if response.status_code != 200:
                logger.error("No se permitió acceso con sesión válida")
                return False
                
            # Probar cierre de sesión
            response = self.session.post(f"{self.base_url}/auth/logout")
            if response.status_code != 200:
                logger.error("Error en cierre de sesión")
                return False
                
            # Probar acceso con sesión cerrada
            response = self.session.get(f"{self.base_url}/panel_control")
            if response.status_code != 401:
                logger.error("No se rechazó acceso con sesión cerrada")
                return False
                
            logger.info("Gestión de sesiones verificada correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en prueba de gestión de sesiones: {str(e)}")
            return False
            
    def test_password_security(self) -> bool:
        """Prueba la seguridad de contraseñas"""
        try:
            logger.info("Probando seguridad de contraseñas...")
            
            # Probar contraseña corta
            response = self.session.post(
                f"{self.base_url}/auth/register",
                json={
                    "email": "new@example.com",
                    "password": "123"
                }
            )
            if response.status_code != 400:
                logger.error("No se rechazó contraseña corta")
                return False
                
            # Probar contraseña sin números
            response = self.session.post(
                f"{self.base_url}/auth/register",
                json={
                    "email": "new@example.com",
                    "password": "password"
                }
            )
            if response.status_code != 400:
                logger.error("No se rechazó contraseña sin números")
                return False
                
            # Probar contraseña sin letras
            response = self.session.post(
                f"{self.base_url}/auth/register",
                json={
                    "email": "new@example.com",
                    "password": "12345678"
                }
            )
            if response.status_code != 400:
                logger.error("No se rechazó contraseña sin letras")
                return False
                
            # Probar contraseña válida
            response = self.session.post(
                f"{self.base_url}/auth/register",
                json={
                    "email": "new@example.com",
                    "password": "Password123"
                }
            )
            if response.status_code != 200:
                logger.error("No se aceptó contraseña válida")
                return False
                
            logger.info("Seguridad de contraseñas verificada correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en prueba de seguridad de contraseñas: {str(e)}")
            return False
            
    def test_csrf_protection(self) -> bool:
        """Prueba la protección CSRF"""
        try:
            logger.info("Probando protección CSRF...")
            
            # Iniciar sesión
            self.session.post(
                f"{self.base_url}/auth/login",
                json={
                    "email": "test@example.com",
                    "password": "test123"
                }
            )
            
            # Probar solicitud sin token CSRF
            response = self.session.post(
                f"{self.base_url}/api/vehicles",
                json={"name": "Test Vehicle"}
            )
            if response.status_code != 403:
                logger.error("No se rechazó solicitud sin token CSRF")
                return False
                
            # Obtener token CSRF
            response = self.session.get(f"{self.base_url}/api/csrf-token")
            if response.status_code != 200:
                logger.error("Error al obtener token CSRF")
                return False
                
            csrf_token = response.json()["csrf_token"]
            
            # Probar solicitud con token CSRF
            response = self.session.post(
                f"{self.base_url}/api/vehicles",
                json={"name": "Test Vehicle"},
                headers={"X-CSRF-Token": csrf_token}
            )
            if response.status_code != 200:
                logger.error("No se aceptó solicitud con token CSRF")
                return False
                
            logger.info("Protección CSRF verificada correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en prueba de protección CSRF: {str(e)}")
            return False

def test_security(base_url: str) -> bool:
    """Función principal de prueba de seguridad"""
    tester = SecurityTester(base_url)
    
    try:
        # Probar autenticación
        if not tester.test_authentication():
            return False
            
        # Probar autorización
        if not tester.test_authorization():
            return False
            
        # Probar gestión de sesiones
        if not tester.test_session_management():
            return False
            
        # Probar seguridad de contraseñas
        if not tester.test_password_security():
            return False
            
        # Probar protección CSRF
        if not tester.test_csrf_protection():
            return False
            
        return True
        
    except Exception as e:
        logger.error(f"Error en pruebas de seguridad: {str(e)}")
        return False 