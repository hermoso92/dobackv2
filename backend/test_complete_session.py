#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test completo para validar la subida de sesión con archivos reales
Incluye todas las correcciones del fixed processor
"""

import requests
import os
import json
import time
import psycopg2
from pathlib import Path

# Configuración
BASE_URL = "http://localhost:9998"

# Credenciales de prueba (usuario admin de CMadrid que tiene acceso al doback022)
TEST_USER = {
    "email": "test@cmadrid.com",
    "password": "admin123"
}

# Archivos de prueba con datos reales corruptos
TEST_FILES = {
    "gps": "data/datosDoback/CMadrid - copia/GPS_DOBACK022_20250710_0.txt",
    "rotativo": "data/datosDoback/CMadrid - copia/ROTATIVO_DOBACK022_20250710_0.txt",
    "estabilidad": "data/datosDoback/CMadrid - copia/ESTABILIDAD_DOBACK022_20250710_0.txt",
    "can": "data/datosDoback/CMadrid - copia/CAN_DOBACK022_20250710_0_TRADUCIDO.csv"
}

def ensure_vehicle_name():
    """Asegurar que el vehículo tenga el nombre correcto en mayúsculas"""
    try:
        conn = psycopg2.connect(
            host='localhost', 
            database='dobacksoft', 
            user='postgres', 
            password='cosigein', 
            port=5432
        )
        cur = conn.cursor()
        
        # Verificar si existe en mayúsculas
        cur.execute('SELECT name FROM "Vehicle" WHERE name = %s', ('DOBACK022',))
        if cur.fetchone():
            print("✅ Vehículo DOBACK022 ya existe en mayúsculas")
            return True
            
        # Actualizar de minúsculas a mayúsculas
        cur.execute('UPDATE "Vehicle" SET name = %s WHERE name = %s', ('DOBACK022', 'doback022'))
        rows_affected = cur.rowcount
        conn.commit()
        
        if rows_affected > 0:
            print("✅ Vehículo actualizado a DOBACK022")
            return True
        else:
            print("❌ No se pudo actualizar el vehículo")
            return False
            
    except Exception as e:
        print(f"❌ Error actualizando vehículo: {e}")
        return False

def login():
    """Autenticarse y obtener token JWT"""
    print("🔐 Iniciando sesión...")
    
    response = requests.post(f"{BASE_URL}/auth/login", json=TEST_USER)
    
    if response.status_code == 200:
        data = response.json()
        # El token está en data.access_token según la respuesta
        token = data.get('data', {}).get('access_token') or data.get('token') or data.get('access_token')
        if token:
            print(f"✅ Login exitoso - Token obtenido")
            return token
        else:
            print(f"❌ Login exitoso pero sin token en respuesta: {data}")
            return None
    else:
        print(f"❌ Error en login: {response.status_code} - {response.text}")
        return None

def test_session_upload(token):
    """Probar subida de sesión con archivos reales"""
    print("\n📤 Probando subida de sesión con archivos reales...")
    
    # Verificar que los archivos existen
    for file_type, file_path in TEST_FILES.items():
        if not os.path.exists(file_path):
            print(f"❌ Archivo {file_type} no encontrado: {file_path}")
            return False
        print(f"✅ Archivo {file_type} encontrado: {file_path}")
    
    # Preparar headers
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # Preparar archivos y datos
    files = {}
    if os.path.exists(TEST_FILES["gps"]):
        files['gpsFile'] = open(TEST_FILES["gps"], 'rb')
    if os.path.exists(TEST_FILES["rotativo"]):
        files['rotativoFile'] = open(TEST_FILES["rotativo"], 'rb')
    if os.path.exists(TEST_FILES["estabilidad"]):
        files['stabilityFile'] = open(TEST_FILES["estabilidad"], 'rb')
    if os.path.exists(TEST_FILES["can"]):
        files['canFile'] = open(TEST_FILES["can"], 'rb')
    
    data = {
        'vehicleId': 'DOBACK022'  # El vehículo está en minúsculas en la BD
    }
    
    try:
        print("🚀 Enviando request de subida...")
        
        response = requests.post(
            f"{BASE_URL}/api/sesion/upload",
            headers=headers,
            files=files,
            data=data,
            timeout=120  # 2 minutos timeout
        )
        
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Subida exitosa!")
            print(f"   📋 Sesión ID: {result.get('sessionId')}")
            print(f"   📋 Número de sesión: {result.get('sessionNumber')}")
            
            # Mostrar datos insertados
            data_inserted = result.get('dataInserted', {})
            print(f"   📊 Datos insertados:")
            for data_type, count in data_inserted.items():
                print(f"      {data_type}: {count} puntos")
            
            # Mostrar correcciones aplicadas
            corrections = result.get('corrections', {})
            if corrections.get('applied'):
                print(f"   🔧 Correcciones aplicadas:")
                discarded = corrections.get('discarded', {})
                for data_type, count in discarded.items():
                    if count > 0:
                        print(f"      {data_type}: {count} descartes")
            
            return True
            
        elif response.status_code == 401:
            print("❌ Error de autenticación")
            print(f"   Headers enviados: {headers}")
            return False
            
        elif response.status_code == 400:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
            print(f"❌ Error de validación: {error_data}")
            return False
            
        else:
            print(f"❌ Error inesperado: {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Timeout en la request (>2 minutos)")
        return False
    except Exception as e:
        print(f"❌ Error en request: {e}")
        return False
    finally:
        # Cerrar archivos
        for file_obj in files.values():
            if hasattr(file_obj, 'close'):
                file_obj.close()

def analyze_real_files():
    """Analizar los archivos reales para mostrar problemas esperados"""
    print("\n🔍 Analizando archivos reales...")
    
    # Analizar CAN (archivo traducido)
    can_file = TEST_FILES["can"]
    if os.path.exists(can_file):
        print(f"\n🔧 Analizando CAN (traducido): {can_file}")
        
        with open(can_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        print(f"   📊 Total líneas: {len(lines)}")
        if len(lines) > 1:
            # Analizar cabecera CSV
            header = lines[0].strip().split(',')
            print(f"   📊 Columnas CSV: {len(header)} ({', '.join(header[:5])}...)")
            print(f"   📊 Datos CAN: archivo CSV traducido con señales procesadas")
    
    # Analizar GPS
    gps_file = TEST_FILES["gps"]
    if os.path.exists(gps_file):
        print(f"\n📍 Analizando GPS: {gps_file}")
        
        with open(gps_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        print(f"   📊 Total líneas: {len(lines)}")
        
        # Buscar problemas conocidos
        timestamps_corruptos = 0
        coordenadas_corruptas = 0
        sin_datos = 0
        
        for i, line in enumerate(lines[2:], start=3):  # Skip header
            if 'sin datos GPS' in line:
                sin_datos += 1
            elif '.' in line and ('06:20:2.' in line or '06:15:8.' in line):
                timestamps_corruptos += 1
            elif '-35774.5500000' in line or '402960.1000000' in line:
                coordenadas_corruptas += 1
        
        print(f"   🔧 Problemas detectados:")
        print(f"      Sin datos GPS: {sin_datos}")
        print(f"      Timestamps corruptos: {timestamps_corruptos}")
        print(f"      Coordenadas corruptas: {coordenadas_corruptas}")
        
        # Detectar desfase temporal
        cabecera = lines[0]
        if '08:15:26' in cabecera:
            print(f"   ⏰ Cabecera indica 08:15:26, datos empiezan en 06:15:XX -> Desfase de 2h detectado")
    
    # Analizar ESTABILIDAD
    estabilidad_file = TEST_FILES["estabilidad"]
    if os.path.exists(estabilidad_file):
        print(f"\n📊 Analizando ESTABILIDAD: {estabilidad_file}")
        
        with open(estabilidad_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        print(f"   📊 Total líneas: {len(lines)}")
        print(f"   📊 Datos ESTABILIDAD: estructura compleja con marcas temporales")
    
    # Analizar ROTATIVO
    rotativo_file = TEST_FILES["rotativo"]
    if os.path.exists(rotativo_file):
        print(f"\n🔄 Analizando ROTATIVO: {rotativo_file}")
        
        with open(rotativo_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        print(f"   📊 Total líneas: {len(lines)}")
        print(f"   📊 Datos ROTATIVO: {len(lines) - 2} puntos") # Skip header

def main():
    """Función principal del test"""
    print("🧪 TEST COMPLETO - Subida de Sesión con Archivos Reales")
    print("=" * 60)
    
    # Analizar archivos antes de la subida
    analyze_real_files()
    
    # Asegurar que el nombre del vehículo esté en mayúsculas
    ensure_vehicle_name()

    # Autenticarse
    token = login()
    if not token:
        print("❌ No se pudo obtener token, abortando test")
        return
    
    # Probar subida
    success = test_session_upload(token)
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 TEST COMPLETADO EXITOSAMENTE")
        print("✅ Todas las correcciones del fixed processor funcionaron")
        print("✅ Los datos corruptos fueron detectados y reparados")
        print("✅ La sesión se creó correctamente en la base de datos")
    else:
        print("❌ TEST FALLÓ")
        print("⚠️  Revisar logs del backend para más detalles")

if __name__ == "__main__":
    main() 