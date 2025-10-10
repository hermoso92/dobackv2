"""
Pruebas automatizadas para la base de datos en DobackSoft V2
"""

import logging
import os
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from src.app.models import db, User, Vehicle, Company, StabilitySession, TelemetrySession

logger = logging.getLogger(__name__)

class DatabaseTester:
    """Clase para probar la base de datos"""
    
    def __init__(self, db_uri: str):
        self.engine = create_engine(db_uri)
        self.Session = sessionmaker(bind=self.engine)
        
    def test_connection(self) -> bool:
        """Prueba la conexión a la base de datos"""
        try:
            logger.info("Probando conexión a la base de datos...")
            
            with self.engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                if result.scalar() == 1:
                    logger.info("Conexión exitosa")
                    return True
                    
            logger.error("Error en la conexión")
            return False
            
        except Exception as e:
            logger.error(f"Error al conectar: {str(e)}")
            return False
            
    def test_tables(self) -> bool:
        """Prueba la existencia de tablas"""
        try:
            logger.info("Probando existencia de tablas...")
            
            required_tables = [
                "users", "vehicles", "companies",
                "stability_sessions", "telemetry_sessions",
                "stability_alerts", "telemetry_alerts",
                "knowledge_base", "knowledge_categories",
                "knowledge_articles", "dashboard_configs"
            ]
            
            with self.engine.connect() as conn:
                for table in required_tables:
                    result = conn.execute(
                        text(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table}')")
                    )
                    if not result.scalar():
                        logger.error(f"Tabla {table} no existe")
                        return False
                        
            logger.info("Todas las tablas existen")
            return True
            
        except Exception as e:
            logger.error(f"Error al verificar tablas: {str(e)}")
            return False
            
    def test_relationships(self) -> bool:
        """Prueba las relaciones entre tablas"""
        try:
            logger.info("Probando relaciones entre tablas...")
            
            session = self.Session()
            
            # Crear datos de prueba
            company = Company(
                name="Test Company",
                code="TEST",
                type="customer",
                status="active"
            )
            session.add(company)
            session.commit()
            
            user = User(
                email="test@example.com",
                password="test123",
                company_id=company.id,
                role="user"
            )
            session.add(user)
            session.commit()
            
            vehicle = Vehicle(
                name="Test Vehicle",
                plate="TEST-123",
                company_id=company.id
            )
            session.add(vehicle)
            session.commit()
            
            # Probar relaciones
            if not user.company or user.company.id != company.id:
                logger.error("Error en relación User-Company")
                return False
                
            if not vehicle.company or vehicle.company.id != company.id:
                logger.error("Error en relación Vehicle-Company")
                return False
                
            # Limpiar datos de prueba
            session.delete(user)
            session.delete(vehicle)
            session.delete(company)
            session.commit()
            
            logger.info("Relaciones verificadas correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error al verificar relaciones: {str(e)}")
            return False
            
        finally:
            session.close()
            
    def test_constraints(self) -> bool:
        """Prueba las restricciones de la base de datos"""
        try:
            logger.info("Probando restricciones...")
            
            session = self.Session()
            
            # Probar restricción de unicidad en email
            user1 = User(
                email="test@example.com",
                password="test123"
            )
            session.add(user1)
            session.commit()
            
            user2 = User(
                email="test@example.com",
                password="test123"
            )
            session.add(user2)
            
            try:
                session.commit()
                logger.error("No se respetó restricción de unicidad en email")
                return False
            except:
                session.rollback()
                
            # Probar restricción de clave foránea
            vehicle = Vehicle(
                name="Test Vehicle",
                plate="TEST-123",
                company_id=999999  # ID inexistente
            )
            session.add(vehicle)
            
            try:
                session.commit()
                logger.error("No se respetó restricción de clave foránea")
                return False
            except:
                session.rollback()
                
            # Limpiar datos de prueba
            session.delete(user1)
            session.commit()
            
            logger.info("Restricciones verificadas correctamente")
            return True
            
        except Exception as e:
            logger.error(f"Error al verificar restricciones: {str(e)}")
            return False
            
        finally:
            session.close()

def test_database(db_uri: str) -> bool:
    """Función principal de prueba de base de datos"""
    tester = DatabaseTester(db_uri)
    
    # Probar conexión
    if not tester.test_connection():
        return False
        
    # Probar tablas
    if not tester.test_tables():
        return False
        
    # Probar relaciones
    if not tester.test_relationships():
        return False
        
    # Probar restricciones
    if not tester.test_constraints():
        return False
        
    return True 