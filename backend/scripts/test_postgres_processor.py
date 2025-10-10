#!/usr/bin/env python3
"""
Script de prueba para el procesador PostgreSQL
Ejecuta el procesador con datos reales de Doback
"""

import os
import sys
import re
from datetime import datetime
from pathlib import Path

# Agregar el directorio raíz del proyecto al path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.processors.postgres_processor import PostgresProcessor

def main():
    print("=== PROCESADOR DE DATOS DOBACK - POSTGRESQL ===")
    print()
    
    # Ruta absoluta real de datos
    data_path = Path(__file__).parent.parent / "data" / "datosDoback"
    processor = PostgresProcessor(base_path=str(data_path))
    
    # Escanear y procesar datos
    print("🔍 Escaneando estructura de datos...")
    companies = processor.scan_companies()
    
    if not companies:
        print("❌ No se encontraron empresas en la estructura de datos")
        return
    
    print(f"✅ Encontradas {len(companies)} empresas:")
    for company in companies:
        print(f"   - {company}")
    
    print("\n🚗 Escaneando vehículos...")
    # Escanear archivos para obtener vehículos
    all_files = []
    for company in companies:
        files = processor.scan_files(company)
        all_files.extend(files)
    
    vehicles = list(set([f.vehicle for f in all_files]))
    
    if not vehicles:
        print("❌ No se encontraron vehículos")
        return
    
    print(f"✅ Encontrados {len(vehicles)} vehículos:")
    for vehicle in vehicles:
        print(f"   - {vehicle}")
    
    print("\n📁 Escaneando archivos de datos...")
    sessions = processor.group_sessions(all_files)
    
    if not sessions:
        print("❌ No se encontraron sesiones de datos")
        return
    
    print(f"✅ Encontradas {len(sessions)} sesiones:")
    for session in sessions:
        print(f"   - {session.company}/{session.vehicle} - {session.date.strftime('%Y-%m-%d')} ({len(session.files)} archivos)")
    
    # Procesar automáticamente sin preguntar
    print("\n🔄 Procesando datos automáticamente...")
    try:
        processed_count = 0
        error_count = 0
        
        for session in sessions:
            try:
                if processor.process_session(session):
                    processed_count += 1
                    print(f"   ✅ Sesión procesada: {session.company}/{session.vehicle} - {session.date.strftime('%Y-%m-%d')}")
                else:
                    error_count += 1
                    print(f"   ❌ Error en sesión: {session.company}/{session.vehicle} - {session.date.strftime('%Y-%m-%d')}")
            except Exception as e:
                error_count += 1
                print(f"   ❌ Error en sesión: {session.company}/{session.vehicle} - {e}")
        
        print(f"\n✅ Procesamiento completado:")
        print(f"   - Sesiones procesadas: {processed_count}")
        print(f"   - Errores: {error_count}")
        print(f"   - Total de sesiones: {len(sessions)}")
                
    except Exception as e:
        print(f"❌ Error durante el procesamiento: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 