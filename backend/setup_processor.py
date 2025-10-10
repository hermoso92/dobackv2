#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
===============================================================================
DOBACK SOFT - SCRIPT DE CONFIGURACIÓN DEL PROCESADOR
===============================================================================

Este script ayuda a configurar el procesador completo de Doback Soft,
verificando dependencias, configurando la base de datos y validando
la estructura de directorios.

USO:
    python setup_processor.py

AUTOR: Doback Soft Development Team
FECHA: 2025-07-10
VERSIÓN: 1.0.0
===============================================================================
"""

import os
import sys
import json
import subprocess
import getpass
from pathlib import Path

def print_banner():
    """Muestra el banner del script de configuración."""
    print("=" * 70)
    print("DOBACK SOFT - CONFIGURACIÓN DEL PROCESADOR COMPLETO")
    print("=" * 70)
    print()

def check_python_version():
    """Verifica la versión de Python."""
    print("🔍 Verificando versión de Python...")
    
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Error: Se requiere Python 3.8 o superior")
        print(f"   Versión actual: {version.major}.{version.minor}.{version.micro}")
        return False
    
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} - OK")
    return True

def check_dependencies():
    """Verifica las dependencias requeridas."""
    print("\n🔍 Verificando dependencias...")
    
    required_packages = [
        ('psycopg2-binary', 'psycopg2'),
        ('pandas', 'pandas'),
        ('numpy', 'numpy')
    ]
    
    missing_packages = []
    
    for package_name, import_name in required_packages:
        try:
            __import__(import_name)
            print(f"✅ {package_name} - OK")
        except ImportError:
            print(f"❌ {package_name} - FALTANTE")
            missing_packages.append(package_name)
    
    if missing_packages:
        print(f"\n📦 Instalando dependencias faltantes...")
        for package in missing_packages:
            try:
                subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
                print(f"✅ {package} instalado correctamente")
            except subprocess.CalledProcessError:
                print(f"❌ Error instalando {package}")
                return False
    
    return True

def check_directory_structure():
    """Verifica la estructura de directorios."""
    print("\n🔍 Verificando estructura de directorios...")
    
    base_dir = Path(__file__).parent
    required_dirs = [
        base_dir / 'data' / 'datosDoback',
        base_dir / 'data' / 'DECODIFICADOR CAN'
    ]
    
    for dir_path in required_dirs:
        if dir_path.exists():
            print(f"✅ {dir_path} - OK")
        else:
            print(f"❌ {dir_path} - NO ENCONTRADO")
            print(f"   Creando directorio...")
            try:
                dir_path.mkdir(parents=True, exist_ok=True)
                print(f"✅ Directorio creado: {dir_path}")
            except Exception as e:
                print(f"❌ Error creando directorio: {e}")
                return False
    
    return True

def check_decoder():
    """Verifica el decodificador CAN."""
    print("\n🔍 Verificando decodificador CAN...")
    
    decoder_path = Path(__file__).parent / 'data' / 'DECODIFICADOR CAN' / 'decodificador_can_unificado.py'
    
    if decoder_path.exists():
        print(f"✅ Decodificador encontrado: {decoder_path}")
        return True
    else:
        print(f"⚠️  Decodificador no encontrado: {decoder_path}")
        print("   El procesador funcionará sin decodificación CAN")
        return True

def test_database_connection(config):
    """Prueba la conexión a la base de datos."""
    print("\n🔍 Probando conexión a la base de datos...")
    
    try:
        import psycopg2
        conn = psycopg2.connect(**config)
        conn.close()
        print("✅ Conexión a PostgreSQL - OK")
        return True
    except ImportError:
        print("❌ psycopg2 no está instalado")
        return False
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def get_database_config():
    """Obtiene la configuración de la base de datos del usuario."""
    print("\n⚙️  Configuración de la base de datos")
    print("-" * 40)
    
    config = {}
    
    # Host
    config['host'] = input("Host (localhost): ").strip() or 'localhost'
    
    # Puerto
    port_input = input("Puerto (5432): ").strip() or '5432'
    try:
        config['port'] = int(port_input)
    except ValueError:
        print("❌ Puerto inválido, usando 5432")
        config['port'] = 5432
    
    # Base de datos
    config['database'] = input("Base de datos (dobacksoft): ").strip() or 'dobacksoft'
    
    # Usuario
    config['user'] = input("Usuario (postgres): ").strip() or 'postgres'
    
    # Contraseña
    config['password'] = getpass.getpass("Contraseña: ")
    
    return config

def create_config_file(config):
    """Crea el archivo de configuración."""
    print("\n💾 Creando archivo de configuración...")
    
    config_file = Path(__file__).parent / 'processor_config.json'
    
    try:
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        print(f"✅ Configuración guardada en: {config_file}")
        return True
    except Exception as e:
        print(f"❌ Error guardando configuración: {e}")
        return False

def update_processor_config(config):
    """Actualiza la configuración en el archivo complete_processor.py."""
    print("\n🔧 Actualizando configuración en complete_processor.py...")
    
    processor_file = Path(__file__).parent / 'complete_processor.py'
    
    if not processor_file.exists():
        print("❌ Archivo complete_processor.py no encontrado")
        return False
    
    try:
        # Leer el archivo
        with open(processor_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Reemplazar la configuración de la base de datos
        old_config = """DATABASE_CONFIG = {
    'host': 'localhost',
    'database': 'dobacksoft',
    'user': 'postgres',
    'password': 'postgres',
    'port': 5432
}"""
        
        new_config = f"""DATABASE_CONFIG = {{
    'host': '{config['host']}',
    'database': '{config['database']}',
    'user': '{config['user']}',
    'password': '{config['password']}',
    'port': {config['port']}
}}"""
        
        content = content.replace(old_config, new_config)
        
        # Guardar el archivo
        with open(processor_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ Configuración actualizada en complete_processor.py")
        return True
        
    except Exception as e:
        print(f"❌ Error actualizando configuración: {e}")
        return False

def create_sample_data():
    """Crea datos de ejemplo para testing."""
    print("\n📁 Creando datos de ejemplo...")
    
    sample_dir = Path(__file__).parent / 'data' / 'datosDoback' / 'CMadrid' / 'doback022'
    sample_dir.mkdir(parents=True, exist_ok=True)
    
    # Crear archivo GPS de ejemplo
    gps_file = sample_dir / 'GPS_DOBACK022_20250710_0.txt'
    if not gps_file.exists():
        gps_content = """GPS;2025-07-10;doback022;0
Fecha-Hora;Latitud;Longitud;Altitud;Velocidad;Satelites;Calidad
2025-07-10 10:00:00;40.4168;-3.7038;655;25.5;8;N/A
2025-07-10 10:00:01;40.4169;-3.7039;656;26.0;8;N/A
2025-07-10 10:00:02;40.4170;-3.7040;657;26.5;8;N/A"""
        
        with open(gps_file, 'w', encoding='utf-8') as f:
            f.write(gps_content)
        print(f"✅ Archivo GPS de ejemplo creado: {gps_file}")
    
    # Crear archivo CAN de ejemplo
    can_file = sample_dir / 'CAN_DOBACK022_20250710_0.txt'
    if not can_file.exists():
        can_content = """CAN;2025-07-10;doback022;0
Timestamp;ID;Data
2025-07-10 10:00:00;0x100;01 02 03 04 05 06 07 08
2025-07-10 10:00:01;0x200;09 0A 0B 0C 0D 0E 0F 10
2025-07-10 10:00:02;0x300;11 12 13 14 15 16 17 18"""
        
        with open(can_file, 'w', encoding='utf-8') as f:
            f.write(can_content)
        print(f"✅ Archivo CAN de ejemplo creado: {can_file}")
    
    # Crear archivo de estabilidad de ejemplo
    stability_file = sample_dir / 'ESTABILIDAD_DOBACK022_20250710_0.txt'
    if not stability_file.exists():
        stability_content = """ESTABILIDAD;2025-07-10;doback022;0
Timestamp;AccelX;AccelY;AccelZ;GyroX;GyroY;GyroZ
2025-07-10 10:00:00;0.1;0.2;9.8;0.01;0.02;0.03
2025-07-10 10:00:01;0.11;0.21;9.81;0.011;0.021;0.031
2025-07-10 10:00:02;0.12;0.22;9.82;0.012;0.022;0.032"""
        
        with open(stability_file, 'w', encoding='utf-8') as f:
            f.write(stability_content)
        print(f"✅ Archivo de estabilidad de ejemplo creado: {stability_file}")
    
    # Crear archivo rotativo de ejemplo
    rotativo_file = sample_dir / 'ROTATIVO_DOBACK022_20250710_0.txt'
    if not rotativo_file.exists():
        rotativo_content = """ROTATIVO;2025-07-10;doback022;0
Timestamp;RPM;Velocidad;Combustible
2025-07-10 10:00:00;1500;25.5;75.2
2025-07-10 10:00:01;1520;26.0;75.1
2025-07-10 10:00:02;1540;26.5;75.0"""
        
        with open(rotativo_file, 'w', encoding='utf-8') as f:
            f.write(rotativo_content)
        print(f"✅ Archivo rotativo de ejemplo creado: {rotativo_file}")

def run_test():
    """Ejecuta una prueba del procesador."""
    print("\n🧪 Ejecutando prueba del procesador...")
    
    try:
        from complete_processor import DobackProcessor
        
        processor = DobackProcessor()
        sessions = processor.scan_files_and_find_sessions()
        
        print(f"✅ Prueba exitosa - {len(sessions)} sesiones encontradas")
        return True
        
    except Exception as e:
        print(f"❌ Error en la prueba: {e}")
        return False

def main():
    """Función principal del script de configuración."""
    print_banner()
    
    # Verificaciones iniciales
    if not check_python_version():
        return False
    
    if not check_dependencies():
        return False
    
    if not check_directory_structure():
        return False
    
    if not check_decoder():
        return False
    
    # Configuración de la base de datos
    print("\n" + "=" * 70)
    print("CONFIGURACIÓN DE LA BASE DE DATOS")
    print("=" * 70)
    
    config = get_database_config()
    
    if not test_database_connection(config):
        print("\n❌ No se pudo conectar a la base de datos")
        retry = input("¿Desea continuar sin verificar la conexión? (s/N): ").strip().lower()
        if retry != 's':
            return False
    
    # Guardar configuración
    if not create_config_file(config):
        return False
    
    if not update_processor_config(config):
        return False
    
    # Crear datos de ejemplo
    create_sample = input("\n¿Desea crear datos de ejemplo para testing? (S/n): ").strip().lower()
    if create_sample != 'n':
        create_sample_data()
    
    # Ejecutar prueba
    print("\n" + "=" * 70)
    print("PRUEBA FINAL")
    print("=" * 70)
    
    if run_test():
        print("\n🎉 ¡Configuración completada exitosamente!")
        print("\n📋 Resumen:")
        print("   ✅ Python y dependencias verificadas")
        print("   ✅ Estructura de directorios creada")
        print("   ✅ Configuración de base de datos guardada")
        print("   ✅ Procesador probado correctamente")
        print("\n🚀 Para ejecutar el procesador:")
        print("   python complete_processor.py")
        print("\n📖 Para más información:")
        print("   Ver README_COMPLETE_PROCESSOR.md")
        return True
    else:
        print("\n❌ La configuración no se completó correctamente")
        print("   Revise los errores anteriores")
        return False

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n❌ Configuración cancelada por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        sys.exit(1) 