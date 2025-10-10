#!/usr/bin/env python3
"""
Script de depuración para probar el parsing de archivos Doback
"""

import os
import sys
from datetime import datetime
from typing import Optional, List, Dict

# Configurar logging
import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DebugParser:
    def __init__(self):
        self.data_dir = "data/datosDoback"
    
    def _parse_timestamp(self, time_str: str) -> Optional[datetime]:
        """Parsea un timestamp en varios formatos."""
        time_str = time_str.strip()
        
        formats = [
            '%m/%d/%Y %I:%M:%S%p',  # 07/07/2025 05:21:42PM
            '%Y-%m-%d %H:%M:%S',   # 2025-07-07 14:23:49
            '%m/%d/%Y,%H:%M:%S',   # 07/07/2025,14:23:49
            '%Y-%m-%d %H:%M:%S.%f', # Con microsegundos
            '%m/%d/%Y %H:%M:%S',   # 07/07/2025 14:23:49 (24h)
            '%H:%M:%S',            # Solo tiempo
            '%H:%M:%S %p',         # Solo tiempo con AM/PM
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(time_str, fmt)
            except:
                continue
        
        return None
    
    def test_can_parsing(self, file_path: str):
        """Prueba el parsing de un archivo CAN."""
        logger.info(f"🔍 Probando parsing CAN: {file_path}")
        
        if not os.path.exists(file_path):
            logger.error(f"❌ Archivo no existe: {file_path}")
            return
        
        data = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            logger.info(f"📄 Archivo tiene {len(lines)} líneas")
            
            for i, line in enumerate(lines[:10]):  # Solo primeras 10 líneas para debug
                line = line.strip()
                logger.info(f"Línea {i+1}: '{line}'")
                
                if line and not line.startswith('CAN;'):
                    parts = line.split()
                    logger.info(f"  Partes: {parts}")
                    
                    if len(parts) >= 3:
                        try:
                            date_str = parts[0]
                            time_str = parts[1]
                            timestamp_str = f"{date_str} {time_str}"
                            
                            logger.info(f"  Timestamp string: '{timestamp_str}'")
                            timestamp = self._parse_timestamp(timestamp_str)
                            
                            if timestamp:
                                can_id = parts[3] if len(parts) > 3 else "UNKNOWN"
                                can_data = " ".join(parts[6:]) if len(parts) > 6 else ""
                                
                                data.append({
                                    'timestamp': timestamp,
                                    'value': f"{can_id}: {can_data}"
                                })
                                logger.info(f"  ✅ Datos extraídos: {timestamp} - {can_id}: {can_data}")
                            else:
                                logger.warning(f"  ❌ No se pudo parsear timestamp: '{timestamp_str}'")
                        except Exception as e:
                            logger.error(f"  ❌ Error procesando línea: {e}")
            
            logger.info(f"📊 Total de puntos CAN extraídos: {len(data)}")
            if data:
                logger.info(f"📊 Primer punto: {data[0]}")
            
        except Exception as e:
            logger.error(f"❌ Error leyendo archivo: {e}")
        
        return data
    
    def test_gps_parsing(self, file_path: str):
        """Prueba el parsing de un archivo GPS."""
        logger.info(f"🔍 Probando parsing GPS: {file_path}")
        
        if not os.path.exists(file_path):
            logger.error(f"❌ Archivo no existe: {file_path}")
            return
        
        data = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            logger.info(f"📄 Archivo tiene {len(lines)} líneas")
            
            for i, line in enumerate(lines[:20]):  # Revisar más líneas para debug
                line = line.strip()
                logger.info(f"Línea {i+1}: '{line}'")
                
                if line and not line.startswith('GPS;') and not line.startswith('Fecha,Hora') and 'sin datos GPS' not in line:
                    parts = line.split(',')
                    logger.info(f"  Partes: {parts}")
                    
                    if len(parts) >= 8:
                        try:
                            date_str = parts[0]
                            time_str = parts[1]
                            timestamp_str = f"{date_str} {time_str}"
                            logger.info(f"  Timestamp string: '{timestamp_str}'")
                            timestamp = self._parse_timestamp(timestamp_str)
                            if timestamp:
                                try:
                                    latitude = float(parts[2]) if parts[2] else 0.0
                                    longitude = float(parts[3]) if parts[3] else 0.0
                                    speed = float(parts[8]) if len(parts) > 8 and parts[8] else 0.0
                                except Exception as e:
                                    logger.warning(f"  ⚠️  Error convirtiendo valores numéricos: {e}")
                                    latitude = longitude = speed = 0.0
                                data.append({
                                    'timestamp': timestamp,
                                    'latitude': latitude,
                                    'longitude': longitude,
                                    'speed': speed
                                })
                                logger.info(f"  ✅ Datos extraídos: {timestamp} - Lat:{latitude}, Lon:{longitude}, Speed:{speed}")
                            else:
                                logger.warning(f"  ❌ No se pudo parsear timestamp: '{timestamp_str}'")
                        except Exception as e:
                            logger.error(f"  ❌ Error procesando línea: {e}")
            
            logger.info(f"📊 Total de puntos GPS extraídos: {len(data)}")
            if data:
                logger.info(f"📊 Primer punto: {data[0]}")
            
        except Exception as e:
            logger.error(f"❌ Error leyendo archivo: {e}")
        
        return data
    
    def test_rotativo_parsing(self, file_path: str):
        """Prueba el parsing de un archivo ROTATIVO."""
        logger.info(f"🔍 Probando parsing ROTATIVO: {file_path}")
        
        if not os.path.exists(file_path):
            logger.error(f"❌ Archivo no existe: {file_path}")
            return
        
        data = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            logger.info(f"📄 Archivo tiene {len(lines)} líneas")
            
            for i, line in enumerate(lines[:10]):  # Solo primeras 10 líneas para debug
                line = line.strip()
                logger.info(f"Línea {i+1}: '{line}'")
                
                if line and not line.startswith('ROTATIVO;') and not line.startswith('Fecha-Hora'):
                    parts = line.split(';')
                    logger.info(f"  Partes: {parts}")
                    
                    if len(parts) >= 2:
                        try:
                            timestamp = self._parse_timestamp(parts[0])
                            
                            if timestamp:
                                state = parts[1].strip() == '1'
                                
                                data.append({
                                    'timestamp': timestamp,
                                    'state': state
                                })
                                logger.info(f"  ✅ Datos extraídos: {timestamp} - State:{state}")
                            else:
                                logger.warning(f"  ❌ No se pudo parsear timestamp: '{parts[0]}'")
                        except Exception as e:
                            logger.error(f"  ❌ Error procesando línea: {e}")
            
            logger.info(f"📊 Total de puntos ROTATIVO extraídos: {len(data)}")
            if data:
                logger.info(f"📊 Primer punto: {data[0]}")
            
        except Exception as e:
            logger.error(f"❌ Error leyendo archivo: {e}")
        
        return data
    
    def run_tests(self):
        """Ejecuta todas las pruebas de parsing."""
        logger.info("🚀 Iniciando pruebas de parsing...")
        
        # Archivos de prueba
        test_files = [
            ("CAN", "data/datosDoback/CMadrid/doback022/CAN/CAN_DOBACK022_20250707_0.txt"),
            ("GPS", "data/datosDoback/CMadrid/doback022/GPS/GPS_DOBACK022_20250707_0.txt"),
            ("ROTATIVO", "data/datosDoback/CMadrid/doback022/ROTATIVO/ROTATIVO_DOBACK022_20250707_0.txt")
        ]
        
        for file_type, file_path in test_files:
            logger.info(f"\n{'='*50}")
            logger.info(f"PRUEBA: {file_type}")
            logger.info(f"{'='*50}")
            
            if file_type == "CAN":
                self.test_can_parsing(file_path)
            elif file_type == "GPS":
                self.test_gps_parsing(file_path)
            elif file_type == "ROTATIVO":
                self.test_rotativo_parsing(file_path)

if __name__ == "__main__":
    parser = DebugParser()
    parser.run_tests() 