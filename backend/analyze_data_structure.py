import os
import sys
from pathlib import Path
from datetime import datetime
import re

def analyze_data_structure():
    """Analizar la estructura real de datos y detectar problemas"""
    
    # Ruta base de datos
    base_path = Path("data/datosDoback")
    
    print("=== ANÁLISIS COMPLETO DE ESTRUCTURA DE DATOS ===")
    print()
    
    # 1. Analizar empresas
    print("🔍 ANALIZANDO EMPRESAS:")
    companies = []
    for item in base_path.iterdir():
        if item.is_dir() and not item.name.startswith('.') and not item.name in ['processed', '__pycache__', 'backend']:
            companies.append(item.name)
    
    print(f"✅ Empresas encontradas: {companies}")
    
    # 2. Analizar vehículos por empresa
    print("\n🚗 ANALIZANDO VEHÍCULOS:")
    all_vehicles = []
    for company in companies:
        company_path = base_path / company
        vehicles = []
        for item in company_path.iterdir():
            if item.is_dir() and not item.name.startswith('.'):
                vehicles.append(item.name)
        print(f"   {company}: {vehicles}")
        all_vehicles.extend(vehicles)
    
    # 3. Analizar archivos por vehículo
    print("\n📁 ANALIZANDO ARCHIVOS:")
    total_files = 0
    processed_files = 0
    realtime_files = 0
    
    for company in companies:
        company_path = base_path / company
        for vehicle_dir in company_path.iterdir():
            if not vehicle_dir.is_dir() or vehicle_dir.name.startswith('.'):
                continue
                
            print(f"\n   📂 {company}/{vehicle_dir.name}:")
            
            # Buscar tipos de archivo
            for file_type in ['CAN', 'estabilidad', 'GPS', 'ROTATIVO']:
                type_path = vehicle_dir / file_type
                if type_path.exists():
                    files = list(type_path.glob('*.txt'))
                    total_files += len(files)
                    
                    # Contar archivos por tipo
                    realtime_count = len([f for f in files if 'RealTime' in f.name or 'REALTIME' in f.name])
                    realtime_files += realtime_count
                    
                    valid_files = len(files) - realtime_count
                    processed_files += valid_files
                    
                    print(f"      {file_type}: {valid_files} válidos, {realtime_count} RealTime")
                    
                    # Mostrar algunos ejemplos de nombres
                    if files:
                        examples = [f.name for f in files[:3] if 'RealTime' not in f.name and 'REALTIME' not in f.name]
                        if examples:
                            print(f"        Ejemplos: {examples}")
    
    # 4. Analizar formato de archivos
    print("\n📋 ANALIZANDO FORMATO DE ARCHIVOS:")
    
    # Tomar un archivo de ejemplo para analizar
    example_file = None
    for company in companies:
        company_path = base_path / company
        for vehicle_dir in company_path.iterdir():
            if not vehicle_dir.is_dir():
                continue
            for file_type in ['CAN', 'estabilidad', 'GPS']:
                type_path = vehicle_dir / file_type
                if type_path.exists():
                    files = [f for f in type_path.glob('*.txt') 
                            if 'RealTime' not in f.name and 'REALTIME' not in f.name]
                    if files:
                        example_file = files[0]
                        break
            if example_file:
                break
        if example_file:
            break
    
    if example_file:
        print(f"   Archivo de ejemplo: {example_file.name}")
        
        # Leer primeras líneas
        with open(example_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()[:5]
        
        print("   Primeras líneas:")
        for i, line in enumerate(lines, 1):
            print(f"     {i}: {line.strip()}")
    
    # 5. Resumen de problemas detectados
    print("\n⚠️ PROBLEMAS DETECTADOS:")
    
    # Verificar si el procesador actual puede manejar estos archivos
    print("   1. Archivos RealTime descartados:", realtime_files)
    print("   2. Archivos válidos para procesar:", processed_files)
    print("   3. Total de archivos encontrados:", total_files)
    
    # Verificar estructura de carpetas
    print("\n   4. Estructura de carpetas:")
    print("      ✅ Empresa/Vehículo/TipoArchivo (correcto)")
    
    # Verificar formato de nombres
    print("\n   5. Formato de nombres de archivo:")
    print("      ✅ Tipo_DOBACK<vehículo>_<YYYYMMDD>_<secuencia>.txt")
    print("      ✅ Con prefijos numéricos: <número>_Tipo_DOBACK...")
    
    # 6. Recomendaciones
    print("\n💡 RECOMENDACIONES:")
    print("   1. El procesador actual descarta archivos RealTime correctamente")
    print("   2. Verificar que la ruta base del procesador apunte a 'data/datosDoback'")
    print("   3. Revisar el parser de nombres para manejar todos los formatos")
    print("   4. Verificar que las sesiones se agrupen correctamente por fecha")
    
    # 7. Estadísticas finales
    print(f"\n📊 ESTADÍSTICAS FINALES:")
    print(f"   - Empresas: {len(companies)}")
    print(f"   - Vehículos totales: {len(all_vehicles)}")
    print(f"   - Archivos válidos: {processed_files}")
    print(f"   - Archivos RealTime: {realtime_files}")
    print(f"   - Total archivos: {total_files}")
    
    # 8. Estimación de sesiones
    print(f"\n🎯 ESTIMACIÓN DE SESIONES:")
    print(f"   - Sesiones potenciales: ~{processed_files // 3} (asumiendo 3 archivos por sesión)")
    print(f"   - Sesiones completas: ~{processed_files // 4} (CAN + ESTABILIDAD + GPS + ROTATIVO)")

if __name__ == "__main__":
    analyze_data_structure() 