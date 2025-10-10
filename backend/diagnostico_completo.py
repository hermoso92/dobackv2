#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Diagnóstico completo del procesador Doback Soft
Analiza todos los problemas desde la agrupación hasta la subida
"""

import os
import re
import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import psycopg2

# Configuración
DB_CONFIG = {
    'host': 'localhost',
    'database': 'dobacksoft',
    'user': 'postgres',
    'password': 'cosigein',
    'port': 5432
}
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data', 'datosDoback', 'CMadrid')

class DiagnosticoCompleto:
    def __init__(self):
        self.data_dir = DATA_DIR
        self.db_config = DB_CONFIG
        
    def run_diagnostico(self):
        """Ejecuta diagnóstico completo"""
        print("=" * 80)
        print("DIAGNÓSTICO COMPLETO PROCESADOR DOBACK SOFT")
        print("=" * 80)
        
        # 1. Análisis de estructura de directorios
        print("\n1. ANÁLISIS DE ESTRUCTURA DE DIRECTORIOS")
        print("-" * 50)
        self._analizar_estructura_directorios()
        
        # 2. Análisis de agrupación de sesiones
        print("\n2. ANÁLISIS DE AGRUPACIÓN DE SESIONES")
        print("-" * 50)
        sesiones = self._analizar_agrupacion_sesiones()
        
        # 3. Análisis de parsing de archivos
        print("\n3. ANÁLISIS DE PARSING DE ARCHIVOS")
        print("-" * 50)
        self._analizar_parsing_archivos(sesiones)
        
        # 4. Análisis de creación de sesiones
        print("\n4. ANÁLISIS DE CREACIÓN DE SESIONES")
        print("-" * 50)
        self._analizar_creacion_sesiones(sesiones)
        
        # 5. Análisis de base de datos
        print("\n5. ANÁLISIS DE BASE DE DATOS")
        print("-" * 50)
        self._analizar_base_datos()
        
        print("\n" + "=" * 80)
        print("FIN DEL DIAGNÓSTICO")
        print("=" * 80)
    
    def _analizar_estructura_directorios(self):
        """Analiza la estructura de directorios"""
        if not os.path.exists(self.data_dir):
            print(f"❌ Directorio no encontrado: {self.data_dir}")
            return
        
        print(f"📁 Directorio base: {self.data_dir}")
        
        for vehicle_dir in os.listdir(self.data_dir):
            vehicle_path = os.path.join(self.data_dir, vehicle_dir)
            if not os.path.isdir(vehicle_path):
                continue
            
            print(f"\n  🚗 Vehículo: {vehicle_dir}")
            
            for type_dir in os.listdir(vehicle_path):
                type_path = os.path.join(vehicle_path, type_dir)
                if not os.path.isdir(type_path):
                    continue
                
                files = [f for f in os.listdir(type_path) if f.endswith(('.txt', '.csv'))]
                print(f"    📂 {type_dir}: {len(files)} archivos")
                
                # Mostrar algunos ejemplos
                for i, filename in enumerate(files[:3]):
                    print(f"      - {filename}")
                if len(files) > 3:
                    print(f"      ... y {len(files) - 3} más")
    
    def _analizar_agrupacion_sesiones(self) -> List[Dict]:
        """Analiza cómo se agrupan las sesiones"""
        print("🔍 Analizando agrupación de sesiones...")
        
        sesiones = {}
        problemas = []
        
        for vehicle_dir in os.listdir(self.data_dir):
            vehicle_path = os.path.join(self.data_dir, vehicle_dir)
            if not os.path.isdir(vehicle_path):
                continue
            
            for type_dir in os.listdir(vehicle_path):
                type_path = os.path.join(vehicle_path, type_dir)
                if not os.path.isdir(type_path):
                    continue
                
                tipo = type_dir.upper()
                
                for filename in os.listdir(type_path):
                    if not (filename.endswith('.txt') or filename.endswith('.csv')):
                        continue
                    
                    file_path = os.path.join(type_path, filename)
                    vehicle, date = self._extract_vehicle_date(filename)
                    
                    if not vehicle:
                        vehicle = vehicle_dir.lower()
                    else:
                        vehicle = vehicle.lower()
                    
                    if not date:
                        problemas.append(f"❌ No se pudo extraer fecha de: {filename}")
                        continue
                    
                    key = f"{vehicle}_{date}"
                    
                    if key not in sesiones:
                        sesiones[key] = {
                            'vehicle': vehicle, 
                            'date': date, 
                            'files': {},
                            'archivos_originales': []
                        }
                    
                    sesiones[key]['files'][tipo] = file_path
                    sesiones[key]['archivos_originales'].append(filename)
        
        print(f"\n📊 Resumen de agrupación:")
        print(f"  - Sesiones detectadas: {len(sesiones)}")
        print(f"  - Problemas encontrados: {len(problemas)}")
        
        if problemas:
            print("\n❌ Problemas de extracción de fecha:")
            for problema in problemas[:5]:  # Mostrar solo los primeros 5
                print(f"  {problema}")
            if len(problemas) > 5:
                print(f"  ... y {len(problemas) - 5} más")
        
        print("\n📋 Sesiones agrupadas:")
        for key, session in list(sesiones.items())[:5]:  # Mostrar solo las primeras 5
            print(f"  {key}:")
            for tipo, file_path in session['files'].items():
                print(f"    {tipo}: {os.path.basename(file_path)}")
        
        return list(sesiones.values())
    
    def _extract_vehicle_date(self, filename: str) -> Tuple[Optional[str], Optional[str]]:
        """Extrae vehículo y fecha del nombre del archivo"""
        # Patrón: TIPO_DOBACK<vehículo>_<YYYYMMDD>_<secuencia>.txt
        match = re.search(r'_(DOBACK\d+)_(\d{8})_', filename)
        if match:
            vehicle = match.group(1)
            date_str = match.group(2)
            date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
            return vehicle, date
        return None, None
    
    def _analizar_parsing_archivos(self, sesiones: List[Dict]):
        """Analiza el parsing de archivos"""
        print("🔍 Analizando parsing de archivos...")
        
        for session in sesiones[:3]:  # Analizar solo las primeras 3 sesiones
            print(f"\n📊 Sesión: {session['vehicle']} {session['date']}")
            
            for tipo, file_path in session['files'].items():
                print(f"\n  📄 {tipo}: {os.path.basename(file_path)}")
                
                if tipo == 'CAN':
                    self._analizar_archivo_can(file_path)
                elif tipo == 'GPS':
                    self._analizar_archivo_gps(file_path)
                elif tipo == 'ESTABILIDAD':
                    self._analizar_archivo_estabilidad(file_path)
                elif tipo == 'ROTATIVO':
                    self._analizar_archivo_rotativo(file_path)
    
    def _analizar_archivo_can(self, file_path: str):
        """Analiza archivo CAN"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()[:20]  # Solo primeras 20 líneas
            
            print(f"    📋 Primeras líneas:")
            for i, line in enumerate(lines[:5]):
                print(f"      {i+1}: {line.strip()}")
            
            # Buscar header
            header_encontrado = False
            for i, line in enumerate(lines):
                if 'Timestamp' in line and 'Engine_Speed' in line:
                    print(f"    ✅ Header encontrado en línea {i+1}: {line.strip()}")
                    header_encontrado = True
                    break
            
            if not header_encontrado:
                print(f"    ❌ No se encontró header válido")
                
        except Exception as e:
            print(f"    ❌ Error leyendo archivo: {e}")
    
    def _analizar_archivo_gps(self, file_path: str):
        """Analiza archivo GPS"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()[:20]
            
            print(f"    📋 Primeras líneas:")
            for i, line in enumerate(lines[:5]):
                print(f"      {i+1}: {line.strip()}")
            
            # Contar líneas con datos válidos
            lineas_validas = 0
            lineas_sin_datos = 0
            
            for line in lines[1:]:  # Saltar header
                if 'sin datos' in line.lower():
                    lineas_sin_datos += 1
                elif ',' in line or ';' in line:
                    lineas_validas += 1
            
            print(f"    📊 Líneas válidas: {lineas_validas}")
            print(f"    📊 Líneas sin datos: {lineas_sin_datos}")
            
        except Exception as e:
            print(f"    ❌ Error leyendo archivo: {e}")
    
    def _analizar_archivo_estabilidad(self, file_path: str):
        """Analiza archivo ESTABILIDAD"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()[:20]
            
            print(f"    📋 Primeras líneas:")
            for i, line in enumerate(lines[:5]):
                print(f"      {i+1}: {line.strip()}")
            
            # Verificar estructura
            if len(lines) >= 2:
                header = lines[1].strip()
                if 'ax' in header and 'ay' in header and 'az' in header:
                    print(f"    ✅ Header válido encontrado")
                else:
                    print(f"    ❌ Header no válido: {header}")
            
        except Exception as e:
            print(f"    ❌ Error leyendo archivo: {e}")
    
    def _analizar_archivo_rotativo(self, file_path: str):
        """Analiza archivo ROTATIVO"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()[:20]
            
            print(f"    📋 Primeras líneas:")
            for i, line in enumerate(lines[:5]):
                print(f"      {i+1}: {line.strip()}")
            
            # Contar líneas de datos
            lineas_datos = 0
            for line in lines[1:]:  # Saltar header
                if ';' in line and line.strip():
                    lineas_datos += 1
            
            print(f"    📊 Líneas de datos: {lineas_datos}")
            
        except Exception as e:
            print(f"    ❌ Error leyendo archivo: {e}")
    
    def _analizar_creacion_sesiones(self, sesiones: List[Dict]):
        """Analiza la creación de sesiones"""
        print("🔍 Analizando creación de sesiones...")
        
        conn = psycopg2.connect(**self.db_config)
        try:
            for session in sesiones[:3]:  # Analizar solo las primeras 3
                print(f"\n📊 Sesión: {session['vehicle']} {session['date']}")
                
                # Verificar si existe en BD
                cur = conn.cursor()
                
                # Buscar vehicleId
                cur.execute('SELECT id FROM "Vehicle" WHERE name = %s LIMIT 1', (session['vehicle'],))
                vehicle_row = cur.fetchone()
                if vehicle_row:
                    vehicle_id = vehicle_row[0]
                    print(f"    ✅ VehicleId encontrado: {vehicle_id}")
                else:
                    print(f"    ❌ VehicleId NO encontrado para: {session['vehicle']}")
                    continue
                
                # Buscar organizationId
                cur.execute('SELECT id FROM "Organization" WHERE name = %s LIMIT 1', ('CMadrid',))
                org_row = cur.fetchone()
                if org_row:
                    org_id = org_row[0]
                    print(f"    ✅ OrganizationId encontrado: {org_id}")
                else:
                    print(f"    ❌ OrganizationId NO encontrado para: CMadrid")
                    continue
                
                # Buscar sesión existente
                cur.execute('''SELECT id FROM "Session" WHERE "vehicleId" = %s AND "organizationId" = %s AND DATE("startTime") = %s AND "sessionNumber" = %s LIMIT 1''', 
                          (vehicle_id, org_id, session['date'], 1))
                session_row = cur.fetchone()
                
                if session_row:
                    print(f"    ✅ Sesión ya existe en BD: {session_row[0]}")
                else:
                    print(f"    ➕ Sesión NO existe, se crearía nueva")
                
                cur.close()
                
        finally:
            conn.close()
    
    def _analizar_base_datos(self):
        """Analiza el estado de la base de datos"""
        print("🔍 Analizando base de datos...")
        
        conn = psycopg2.connect(**self.db_config)
        try:
            cur = conn.cursor()
            
            # Contar registros por tabla
            tablas = ['Session', 'CanMeasurement', 'GpsMeasurement', 'StabilityMeasurement', 'RotativoMeasurement']
            
            for tabla in tablas:
                cur.execute(f'SELECT COUNT(*) FROM "{tabla}"')
                count = cur.fetchone()[0]
                print(f"    📊 {tabla}: {count} registros")
            
            # Verificar últimas sesiones creadas
            cur.execute('''SELECT id, "vehicleId", "startTime", "sessionNumber" FROM "Session" ORDER BY "createdAt" DESC LIMIT 5''')
            sessions = cur.fetchall()
            
            print(f"\n    📋 Últimas 5 sesiones creadas:")
            for session in sessions:
                print(f"      - {session[0]}: VehicleId={session[1]}, StartTime={session[2]}, SessionNumber={session[3]}")
            
            cur.close()
            
        finally:
            conn.close()

if __name__ == "__main__":
    diagnostico = DiagnosticoCompleto()
    diagnostico.run_diagnostico() 