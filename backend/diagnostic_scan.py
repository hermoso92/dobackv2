#!/usr/bin/env python3
"""
Script de diagnóstico para ver qué fechas extrae de cada archivo
"""

import os
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional
import re

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FileContentAnalyzer:
    """Analiza el contenido completo de archivos para extraer fechas/horas reales"""
    
    def __init__(self):
        self.date_patterns = [
            r'(\d{4}-\d{2}-\d{2})',  # YYYY-MM-DD
            r'(\d{2}/\d{2}/\d{4})',  # DD/MM/YYYY
            r'(\d{2}-\d{2}-\d{4})',  # DD-MM-YYYY
        ]
        self.time_patterns = [
            r'(\d{2}:\d{2}:\d{2})',  # HH:MM:SS
            r'(\d{2}:\d{2}:\d{2}\.\d{3})',  # HH:MM:SS.mmm
        ]
    
    def extract_real_datetime_from_file(self, file_path: Path, file_type: str) -> Optional[datetime]:
        """Extrae la fecha/hora real del contenido del archivo"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
            
            if not lines:
                return None
            
            # Buscar en las primeras líneas (cabecera)
            header_lines = lines[:10]
            for i, line in enumerate(header_lines):
                dt = self._extract_datetime_from_line(line)
                if dt:
                    logger.info(f"  ✅ Fecha encontrada en línea {i+1} de {file_path.name}: {dt}")
                    return dt
            
            # Si no se encuentra en cabecera, buscar en el contenido
            for i, line in enumerate(lines):
                if i > 100:  # Limitar búsqueda a las primeras 100 líneas
                    break
                dt = self._extract_datetime_from_line(line)
                if dt:
                    logger.info(f"  ✅ Fecha encontrada en línea {i+1} de {file_path.name}: {dt}")
                    return dt
            
            # Si no se encuentra, intentar extraer del nombre del archivo
            dt = self._extract_datetime_from_filename(file_path.name)
            if dt:
                logger.info(f"  ⚠️  Fecha extraída del nombre de {file_path.name}: {dt}")
            else:
                logger.warning(f"  ❌ No se pudo extraer fecha de: {file_path.name}")
            return dt
            
        except Exception as e:
            logger.error(f"  ❌ Error leyendo {file_path}: {e}")
            return None
    
    def _extract_datetime_from_line(self, line: str) -> Optional[datetime]:
        """Extrae fecha y hora de una línea de texto"""
        try:
            # Buscar fecha
            date_match = None
            for pattern in self.date_patterns:
                match = re.search(pattern, line)
                if match:
                    date_match = match.group(1)
                    break
            
            if not date_match:
                return None
            
            # Buscar hora
            time_match = None
            for pattern in self.time_patterns:
                match = re.search(pattern, line)
                if match:
                    time_match = match.group(1)
                    break
            
            if not time_match:
                # Solo fecha, usar 00:00:00
                time_match = "00:00:00"
            
            # Parsear fecha y hora
            if '-' in date_match:
                if len(date_match.split('-')[0]) == 4:  # YYYY-MM-DD
                    date_str = f"{date_match} {time_match}"
                    return datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
                else:  # DD-MM-YYYY
                    date_str = f"{date_match} {time_match}"
                    return datetime.strptime(date_str, "%d-%m-%Y %H:%M:%S")
            elif '/' in date_match:  # DD/MM/YYYY
                date_str = f"{date_match} {time_match}"
                return datetime.strptime(date_str, "%d/%m/%Y %H:%M:%S")
            
        except Exception as e:
            logger.debug(f"Error parseando fecha/hora de línea: {e}")
            return None
    
    def _extract_datetime_from_filename(self, filename: str) -> Optional[datetime]:
        """Extrae fecha del nombre del archivo como fallback"""
        try:
            # Buscar patrón YYYYMMDD en el nombre
            match = re.search(r'(\d{8})', filename)
            if match:
                date_str = match.group(1)
                return datetime.strptime(date_str, "%Y%m%d")
        except:
            pass
        return None

def scan_all_files(base_path: Path) -> Dict[str, Any]:
    """Escanea todos los archivos y muestra las fechas extraídas"""
    analyzer = FileContentAnalyzer()
    results = {}
    
    for company_dir in base_path.iterdir():
        if not company_dir.is_dir():
            continue
        
        company_name = company_dir.name
        results[company_name] = {}
        
        for vehicle_dir in company_dir.iterdir():
            if not vehicle_dir.is_dir():
                continue
            
            vehicle_name = vehicle_dir.name
            results[company_name][vehicle_name] = {}
            
            logger.info(f"\n🔍 Analizando vehículo: {vehicle_name}")
            
            # Buscar carpetas de tipos de archivo
            for type_dir in vehicle_dir.iterdir():
                if not type_dir.is_dir():
                    continue
                
                file_type = type_dir.name.upper()
                if file_type not in ['CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO']:
                    continue
                
                logger.info(f"\n  📁 Tipo: {file_type}")
                results[company_name][vehicle_name][file_type] = []
                
                # Procesar archivos de este tipo
                for file_path in type_dir.glob('*.txt'):
                    if file_path.name.startswith('._') or 'realtime' in file_path.name.lower():
                        continue
                    
                    logger.info(f"    📄 Procesando: {file_path.name}")
                    
                    # Extraer fecha real del contenido
                    real_datetime = analyzer.extract_real_datetime_from_file(file_path, file_type)
                    
                    file_info = {
                        'filename': file_path.name,
                        'real_datetime': real_datetime.isoformat() if real_datetime else None,
                        'date': real_datetime.date().isoformat() if real_datetime else None,
                        'time': real_datetime.time().isoformat() if real_datetime else None
                    }
                    results[company_name][vehicle_name][file_type].append(file_info)
    
    return results

def main():
    """Función principal"""
    # Ruta base de datos
    base_path = Path(__file__).parent / 'data' / 'datosDoback'
    
    logger.info("🚀 Iniciando escaneo de diagnóstico...")
    
    # Escanear todos los archivos
    results = scan_all_files(base_path)
    
    # Guardar resultados
    report_path = Path('diagnostic_scan_report.json')
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, default=str)
    
    logger.info(f"\n📊 Reporte de diagnóstico guardado en: {report_path}")
    
    # Mostrar resumen
    print("\n" + "="*60)
    print("RESUMEN DEL ESCANEO DE DIAGNÓSTICO")
    print("="*60)
    
    for company, vehicles in results.items():
        print(f"\n🏢 Empresa: {company}")
        for vehicle, types in vehicles.items():
            print(f"  🚗 Vehículo: {vehicle}")
            for file_type, files in types.items():
                print(f"    📁 {file_type}: {len(files)} archivos")
                for file_info in files:
                    if file_info['real_datetime']:
                        print(f"      ✅ {file_info['filename']} -> {file_info['real_datetime']}")
                    else:
                        print(f"      ❌ {file_info['filename']} -> SIN FECHA")

if __name__ == "__main__":
    main() 