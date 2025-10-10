"""
Pruebas automatizadas para la base de datos en DobackSoft V2
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import os
import tempfile

from src.app.models import (
    User, Company, Vehicle, StabilitySession,
    TelemetrySession, StabilityAlert, TelemetryAlert,
    KnowledgeBase, KnowledgeCategory, KnowledgeArticle
)

logger = logging.getLogger(__name__)

class DatabaseTester:
    """Clase para probar la base de datos"""
    
    def __init__(self, db):
        self.db = db
        
    def test_user_operations(self) -> bool:
        """Prueba operaciones con usuarios"""
        try:
            logger.info("Probando operaciones con usuarios...")
            
            # Crear usuario
            user = User(
                username='test_user',
                email='test@example.com',
                password='test_password',
                role='user',
                company_id=1,
                is_active=True
            )
            self.db.session.add(user)
            self.db.session.commit()
            
            # Leer usuario
            saved_user = User.query.filter_by(username='test_user').first()
            if not saved_user:
                logger.error("Usuario no encontrado después de crear")
                return False
                
            # Actualizar usuario
            saved_user.email = 'updated@example.com'
            self.db.session.commit()
            
            updated_user = User.query.filter_by(username='test_user').first()
            if updated_user.email != 'updated@example.com':
                logger.error("Usuario no actualizado correctamente")
                return False
                
            # Eliminar usuario
            self.db.session.delete(updated_user)
            self.db.session.commit()
            
            deleted_user = User.query.filter_by(username='test_user').first()
            if deleted_user:
                logger.error("Usuario no eliminado correctamente")
                return False
                
            logger.info("Operaciones con usuarios verificadas correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en operaciones con usuarios: {str(e)}")
            return False
            
    def test_company_operations(self) -> bool:
        """Prueba operaciones con empresas"""
        try:
            logger.info("Probando operaciones con empresas...")
            
            # Crear empresa
            company = Company(
                name='Test Company',
                code='TEST',
                type='customer',
                address='Test Address',
                city='Test City',
                country='Test Country',
                tax_id='TEST123456',
                status='active',
                subscription_type='basic'
            )
            self.db.session.add(company)
            self.db.session.commit()
            
            # Leer empresa
            saved_company = Company.query.filter_by(code='TEST').first()
            if not saved_company:
                logger.error("Empresa no encontrada después de crear")
                return False
                
            # Actualizar empresa
            saved_company.status = 'inactive'
            self.db.session.commit()
            
            updated_company = Company.query.filter_by(code='TEST').first()
            if updated_company.status != 'inactive':
                logger.error("Empresa no actualizada correctamente")
                return False
                
            # Eliminar empresa
            self.db.session.delete(updated_company)
            self.db.session.commit()
            
            deleted_company = Company.query.filter_by(code='TEST').first()
            if deleted_company:
                logger.error("Empresa no eliminada correctamente")
                return False
                
            logger.info("Operaciones con empresas verificadas correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en operaciones con empresas: {str(e)}")
            return False
            
    def test_vehicle_operations(self) -> bool:
        """Prueba operaciones con vehículos"""
        try:
            logger.info("Probando operaciones con vehículos...")
            
            # Crear vehículo
            vehicle = Vehicle(
                name='Test Vehicle',
                plate='TEST-123',
                type='car',
                status='active',
                company_id=1
            )
            self.db.session.add(vehicle)
            self.db.session.commit()
            
            # Leer vehículo
            saved_vehicle = Vehicle.query.filter_by(plate='TEST-123').first()
            if not saved_vehicle:
                logger.error("Vehículo no encontrado después de crear")
                return False
                
            # Actualizar vehículo
            saved_vehicle.status = 'inactive'
            self.db.session.commit()
            
            updated_vehicle = Vehicle.query.filter_by(plate='TEST-123').first()
            if updated_vehicle.status != 'inactive':
                logger.error("Vehículo no actualizado correctamente")
                return False
                
            # Eliminar vehículo
            self.db.session.delete(updated_vehicle)
            self.db.session.commit()
            
            deleted_vehicle = Vehicle.query.filter_by(plate='TEST-123').first()
            if deleted_vehicle:
                logger.error("Vehículo no eliminado correctamente")
                return False
                
            logger.info("Operaciones con vehículos verificadas correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en operaciones con vehículos: {str(e)}")
            return False
            
    def test_session_operations(self) -> bool:
        """Prueba operaciones con sesiones"""
        try:
            logger.info("Probando operaciones con sesiones...")
            
            # Crear sesión de estabilidad
            stability_session = StabilitySession(
                vehicle_id=1,
                start_time=datetime.now(),
                end_time=datetime.now() + timedelta(hours=1),
                status='completed',
                metadata={'test': 'data'}
            )
            self.db.session.add(stability_session)
            self.db.session.commit()
            
            # Leer sesión
            saved_session = StabilitySession.query.filter_by(vehicle_id=1).first()
            if not saved_session:
                logger.error("Sesión no encontrada después de crear")
                return False
                
            # Actualizar sesión
            saved_session.status = 'failed'
            self.db.session.commit()
            
            updated_session = StabilitySession.query.filter_by(vehicle_id=1).first()
            if updated_session.status != 'failed':
                logger.error("Sesión no actualizada correctamente")
                return False
                
            # Eliminar sesión
            self.db.session.delete(updated_session)
            self.db.session.commit()
            
            deleted_session = StabilitySession.query.filter_by(vehicle_id=1).first()
            if deleted_session:
                logger.error("Sesión no eliminada correctamente")
                return False
                
            logger.info("Operaciones con sesiones verificadas correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en operaciones con sesiones: {str(e)}")
            return False
            
    def test_alert_operations(self) -> bool:
        """Prueba operaciones con alertas"""
        try:
            logger.info("Probando operaciones con alertas...")
            
            # Crear alerta de estabilidad
            stability_alert = StabilityAlert(
                session_id=1,
                timestamp=datetime.now(),
                type='rollover_risk',
                severity='high',
                description='Test alert',
                metadata={'test': 'data'}
            )
            self.db.session.add(stability_alert)
            self.db.session.commit()
            
            # Leer alerta
            saved_alert = StabilityAlert.query.filter_by(session_id=1).first()
            if not saved_alert:
                logger.error("Alerta no encontrada después de crear")
                return False
                
            # Actualizar alerta
            saved_alert.severity = 'medium'
            self.db.session.commit()
            
            updated_alert = StabilityAlert.query.filter_by(session_id=1).first()
            if updated_alert.severity != 'medium':
                logger.error("Alerta no actualizada correctamente")
                return False
                
            # Eliminar alerta
            self.db.session.delete(updated_alert)
            self.db.session.commit()
            
            deleted_alert = StabilityAlert.query.filter_by(session_id=1).first()
            if deleted_alert:
                logger.error("Alerta no eliminada correctamente")
                return False
                
            logger.info("Operaciones con alertas verificadas correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en operaciones con alertas: {str(e)}")
            return False
            
    def test_knowledge_operations(self) -> bool:
        """Prueba operaciones con base de conocimiento"""
        try:
            logger.info("Probando operaciones con base de conocimiento...")
            
            # Crear categoría
            category = KnowledgeCategory(
                name='Test Category',
                description='Test Description',
                is_active=True
            )
            self.db.session.add(category)
            self.db.session.commit()
            
            # Crear artículo
            article = KnowledgeArticle(
                title='Test Article',
                content='Test Content',
                category_id=category.id,
                author_id=1,
                is_active=True
            )
            self.db.session.add(article)
            self.db.session.commit()
            
            # Leer artículo
            saved_article = KnowledgeArticle.query.filter_by(title='Test Article').first()
            if not saved_article:
                logger.error("Artículo no encontrado después de crear")
                return False
                
            # Actualizar artículo
            saved_article.content = 'Updated Content'
            self.db.session.commit()
            
            updated_article = KnowledgeArticle.query.filter_by(title='Test Article').first()
            if updated_article.content != 'Updated Content':
                logger.error("Artículo no actualizado correctamente")
                return False
                
            # Eliminar artículo y categoría
            self.db.session.delete(updated_article)
            self.db.session.delete(category)
            self.db.session.commit()
            
            deleted_article = KnowledgeArticle.query.filter_by(title='Test Article').first()
            deleted_category = KnowledgeCategory.query.filter_by(name='Test Category').first()
            
            if deleted_article or deleted_category:
                logger.error("Artículo o categoría no eliminados correctamente")
                return False
                
            logger.info("Operaciones con base de conocimiento verificadas correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error en operaciones con base de conocimiento: {str(e)}")
            return False

def test_database(db) -> bool:
    """Función principal de prueba de la base de datos"""
    tester = DatabaseTester(db)
    
    try:
        # Probar operaciones con usuarios
        if not tester.test_user_operations():
            return False
            
        # Probar operaciones con empresas
        if not tester.test_company_operations():
            return False
            
        # Probar operaciones con vehículos
        if not tester.test_vehicle_operations():
            return False
            
        # Probar operaciones con sesiones
        if not tester.test_session_operations():
            return False
            
        # Probar operaciones con alertas
        if not tester.test_alert_operations():
            return False
            
        # Probar operaciones con base de conocimiento
        if not tester.test_knowledge_operations():
            return False
            
        return True
        
    except Exception as e:
        logger.error(f"Error en pruebas de base de datos: {str(e)}")
        return False 