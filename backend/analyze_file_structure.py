#!/usr/bin/env python3
"""
Análisis exhaustivo de todos los archivos de CMadrid
Lee el contenido de cada archivo para detectar calidad de datos, archivos vacíos, etc.
"""

import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import json
import re
import importlib.util

def parse_filename(filename: str) -> Optional[Tuple[str, str, datetime, int]]:
    """Parsear nombre de archivo con múltiples formatos"""
    try:
        # Descarta archivos RealTime
        if "RealTime" in filename or "REALTIME" in filename:
            return None
            
        # Remover extensión
        name = filename.replace('.txt', '')
        
        # Caso 1: Formato estándar Tipo_DOBACK<vehículo>_<YYYY-MM-DD>_<secuencia>
        if '_DOBACK' in name and len(name.split('_')) >= 4:
            parts = name.split('_')
            
            # Buscar la parte que contiene DOBACK
            doback_index = None
            for i, part in enumerate(parts):
                if 'DOBACK' in part:
                    doback_index = i
                    break
            
            if doback_index is not None:
                file_type = parts[0]  # CAN, ESTABILIDAD, GPS, ROTATIVO
                vehicle_part = parts[doback_index]  # DOBACK022
                vehicle = vehicle_part.replace('DOBACK', '')  # 022
                
                # Buscar fecha en formato YYYYMMDD
                date_str = None
                sequence = 0
                
                for part in parts[doback_index + 1:]:
                    if len(part) == 8 and part.isdigit():
                        # Formato YYYYMMDD
                        date_str = f"{part[:4]}-{part[4:6]}-{part[6:8]}"
                    elif part.isdigit() and len(part) <= 3:
                        # Secuencia numérica
                        sequence = int(part)
                
                if date_str:
                    date = datetime.strptime(date_str, '%Y-%m-%d')
                    return file_type, vehicle, date, sequence
        
        # Caso 2: Formato con prefijo numérico: 1_CAN_DOBACK012_20250610_58
        if name[0].isdigit() and '_' in name:
            parts = name.split('_')
            if len(parts) >= 4 and 'DOBACK' in parts[2]:
                file_type = parts[1]  # CAN, ESTABILIDAD, GPS
                vehicle_part = parts[2]  # DOBACK012
                vehicle = vehicle_part.replace('DOBACK', '')
                
                # Buscar fecha en formato YYYYMMDD
                date_str = None
                sequence = 0
                
                for part in parts[3:]:
                    if len(part) == 8 and part.isdigit():
                        date_str = f"{part[:4]}-{part[4:6]}-{part[6:8]}"
                    elif part.isdigit() and len(part) <= 3:
                        sequence = int(part)
                
                if date_str:
                    date = datetime.strptime(date_str, '%Y-%m-%d')
                    return file_type, vehicle, date, sequence
        
        return None
        
    except Exception as e:
        return None

def analyze_file_content(file_path: Path) -> Dict:
    """Analizar el contenido completo de un archivo"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
        
        if not lines:
            return {
                'status': 'EMPTY',
                'total_lines': 0,
                'header_lines': 0,
                'data_lines': 0,
                'valid_data_lines': 0,
                'invalid_data_lines': 0,
                'first_data_time': None,
                'last_data_time': None,
                'duration_minutes': 0,
                'problems': ['Archivo vacío']
            }
        
        # Analizar cabecera
        header_lines = 0
        data_lines = 0
        valid_data_lines = 0
        invalid_data_lines = 0
        first_data_time = None
        last_data_time = None
        problems = []
        
        # Detectar tipo de archivo por cabecera
        file_type = None
        if lines and ';' in lines[0]:
            header_parts = lines[0].strip().split(';')
            if len(header_parts) >= 1:
                file_type = header_parts[0]
        
        # Analizar cada línea
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
                
            # Detectar si es cabecera
            if i == 0 or 'Fecha' in line or 'Hora' in line or file_type in line:
                header_lines += 1
                continue
            
            data_lines += 1
            
            # Analizar línea de datos según tipo de archivo
            is_valid = False
            
            if file_type == 'CAN':
                # Para archivos CAN, validar que tenga datos hexadecimales
                if 'can0' in line and '[' in line and ']' in line:
                    # Buscar datos hexadecimales después del timestamp
                    parts = line.split()
                    if len(parts) >= 4:
                        # Verificar que haya datos hexadecimales
                        hex_data = parts[3:]
                        if any(len(part) == 2 and all(c in '0123456789ABCDEFabcdef' for c in part) for part in hex_data):
                            is_valid = True
                
            elif file_type == 'GPS':
                # Para archivos GPS, validar que no sea "sin datos GPS"
                if ';' in line:
                    parts = line.split(';')
                    if len(parts) >= 3:
                        # Verificar que no sea "sin datos GPS"
                        if not any('sin datos GPS' in part for part in parts[2:]):
                            is_valid = True
                
            elif file_type == 'ESTABILIDAD':
                # Para archivos de estabilidad, validar que tenga datos numéricos
                if ';' in line:
                    parts = line.split(';')
                    if len(parts) >= 3:
                        # Verificar que haya datos numéricos
                        if any(part.replace('.', '').replace('-', '').isdigit() for part in parts[2:]):
                            is_valid = True
                
            elif file_type == 'ROTATIVO':
                # Para archivos rotativos, validar que tenga datos
                if ';' in line:
                    parts = line.split(';')
                    if len(parts) >= 2:
                        # Verificar que haya datos no vacíos
                        if any(part.strip() for part in parts[1:]):
                            is_valid = True
            
            # Intentar parsear fecha/hora para calcular duración
            try:
                if ';' in line:
                    parts = line.split(';')
                    if len(parts) >= 2:
                        date_str = parts[0]
                        time_str = parts[1]
                        
                        # Formato DD/MM/YYYY HH:MM:SS
                        if '/' in date_str and ':' in time_str:
                            datetime_str = f"{date_str} {time_str}"
                            data_time = datetime.strptime(datetime_str, '%d/%m/%Y %H:%M:%S')
                            
                            if first_data_time is None:
                                first_data_time = data_time
                            last_data_time = data_time
            except:
                pass  # Ignorar errores de parsing de fecha
            
            if is_valid:
                valid_data_lines += 1
            else:
                invalid_data_lines += 1
        
        # Calcular duración
        duration_minutes = 0
        if first_data_time and last_data_time:
            duration = last_data_time - first_data_time
            duration_minutes = duration.total_seconds() / 60
        
        # Detectar problemas según tipo de archivo
        if data_lines == 0:
            problems.append('Solo cabeceras, sin datos')
        elif valid_data_lines == 0:
            if file_type == 'GPS':
                problems.append('Solo "sin datos GPS" o valores vacíos')
            elif file_type == 'CAN':
                problems.append('Sin datos hexadecimales válidos')
            elif file_type == 'ESTABILIDAD':
                problems.append('Sin datos numéricos válidos')
            else:
                problems.append('Sin datos válidos')
        elif valid_data_lines < 10:
            problems.append(f'Pocos datos válidos ({valid_data_lines} líneas)')
        elif duration_minutes < 1:
            problems.append(f'Sesión muy corta ({duration_minutes:.1f} minutos)')
        
        # Determinar estado
        if data_lines == 0:
            status = 'HEADER_ONLY'
        elif valid_data_lines == 0:
            status = 'NO_VALID_DATA'
        elif valid_data_lines < 10:
            status = 'LOW_QUALITY'
        elif duration_minutes < 1:
            status = 'VERY_SHORT'
        else:
            status = 'VALID'
        
        return {
            'status': status,
            'file_type': file_type,
            'total_lines': len(lines),
            'header_lines': header_lines,
            'data_lines': data_lines,
            'valid_data_lines': valid_data_lines,
            'invalid_data_lines': invalid_data_lines,
            'first_data_time': first_data_time,
            'last_data_time': last_data_time,
            'duration_minutes': duration_minutes,
            'problems': problems
        }
        
    except Exception as e:
        return {
            'status': 'ERROR',
            'error': str(e),
            'problems': [f'Error leyendo archivo: {str(e)}']
        }

def try_decode_can(file_path: Path, decodificador_path: Path, max_lines: int = 100) -> Dict:
    """Intentar decodificar una muestra de un archivo CAN usando el decodificador_unificado"""
    try:
        # Importar el decodificador dinámicamente
        spec = importlib.util.spec_from_file_location("decodificador_can_unificado", str(decodificador_path))
        decodificador_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(decodificador_module)
        
        # Crear instancia del decodificador
        decodificador = decodificador_module.DecodificadorCAN()
        
        # Verificar archivos DBC
        if not decodificador.verificar_archivos_dbc():
            return {'decoded': False, 'reason': 'Archivos DBC no encontrados'}
        
        # Leer una muestra del archivo
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = [line.strip() for i, line in enumerate(f) if line.strip() and i < max_lines]
        
        # Filtrar solo líneas de datos CAN (no cabecera)
        data_lines = [line for line in lines if 'can0' in line and '[' in line and ']' in line]
        if not data_lines:
            return {'decoded': False, 'reason': 'Sin tramas CAN detectadas'}
        
        # Crear un archivo temporal con la muestra
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as temp_file:
            # Escribir cabecera CAN
            temp_file.write("CAN;SAMPLE;DOBACK000;1;1;\n")
            # Escribir líneas de datos
            for line in data_lines:
                temp_file.write(line + '\n')
            temp_file_path = temp_file.name
        
        try:
            # Intentar procesar el archivo temporal
            success = decodificador.procesar_archivo(temp_file_path)
            
            # Verificar si se creó el archivo traducido
            translated_file = temp_file_path.replace('.txt', '_TRADUCIDO.csv')
            if success and os.path.exists(translated_file):
                # Leer el archivo traducido para verificar que tiene datos útiles
                with open(translated_file, 'r', encoding='utf-8') as f:
                    translated_lines = f.readlines()
                
                # Contar líneas con datos (excluyendo cabeceras y líneas vacías)
                data_lines_count = len([line for line in translated_lines if line.strip() and not line.startswith('#') and ',' in line])
                
                # Limpiar archivos temporales
                os.unlink(temp_file_path)
                os.unlink(translated_file)
                
                if data_lines_count > 0:
                    return {
                        'decoded': True, 
                        'decoded_lines': len(data_lines), 
                        'useful_lines': data_lines_count,
                        'reason': f'Se decodificaron {data_lines_count} líneas útiles'
                    }
                else:
                    return {'decoded': False, 'reason': 'Decodificación exitosa pero sin datos útiles'}
            else:
                # Limpiar archivo temporal
                os.unlink(temp_file_path)
                return {'decoded': False, 'reason': 'Error en el procesamiento del decodificador'}
                
        except Exception as e:
            # Limpiar archivo temporal si existe
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
            return {'decoded': False, 'reason': f'Error en decodificación: {str(e)}'}
            
    except Exception as e:
        return {'decoded': False, 'reason': f'Error al importar decodificador: {str(e)}'}

def analyze_all_files_cmadrid_detailed(base_path: Path):
    """Análisis exhaustivo de todos los archivos de CMadrid"""
    company = "CMadrid"
    log_file = f"analisis_cmadrid_detallado_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
    
    print(f"\n{'='*80}")
    print(f"ANÁLISIS EXHAUSTIVO DE TODOS LOS ARCHIVOS DE: {company}")
    print(f"Log detallado: {log_file}")
    print(f"{'='*80}")
    
    with open(log_file, 'w', encoding='utf-8') as log:
        log.write(f"ANÁLISIS EXHAUSTIVO DE TODOS LOS ARCHIVOS DE: {company}\n")
        log.write(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        log.write("="*80 + "\n\n")
        
        company_path = base_path / company
        if not company_path.exists():
            print(f"❌ Carpeta de empresa no existe: {company_path}")
            return
        
        # Estadísticas globales
        stats = {
            'total_files': 0,
            'total_size': 0,
            'parseable': 0,
            'realtime': 0,
            'not_parseable': 0,
            'by_status': {
                'VALID': 0,
                'LOW_QUALITY': 0,
                'VERY_SHORT': 0,
                'NO_VALID_DATA': 0,
                'HEADER_ONLY': 0,
                'EMPTY': 0,
                'ERROR': 0
            },
            'by_type': {
                'CAN': {'total': 0, 'valid': 0, 'low_quality': 0, 'no_data': 0},
                'ESTABILIDAD': {'total': 0, 'valid': 0, 'low_quality': 0, 'no_data': 0},
                'GPS': {'total': 0, 'valid': 0, 'low_quality': 0, 'no_data': 0},
                'ROTATIVO': {'total': 0, 'valid': 0, 'low_quality': 0, 'no_data': 0},
                'UNKNOWN': {'total': 0, 'valid': 0, 'low_quality': 0, 'no_data': 0}
            },
            'by_vehicle': {},
            'problems': []
        }
        
        # Recorrer recursivamente todas las carpetas
        for root, dirs, files in os.walk(company_path):
            for file in files:
                file_path = Path(root) / file
                stats['total_files'] += 1
                size = file_path.stat().st_size
                stats['total_size'] += size
                
                # Parsear nombre
                parsed = parse_filename(file)
                is_realtime = "realtime" in file.lower()
                
                if parsed:
                    stats['parseable'] += 1
                    file_type, vehicle, date, sequence = parsed
                    name_status = "✅ Parseable"
                elif is_realtime:
                    stats['realtime'] += 1
                    file_type, vehicle, date, sequence = "REALTIME", "UNKNOWN", None, 0
                    name_status = "⚠️ RealTime"
                else:
                    stats['not_parseable'] += 1
                    file_type, vehicle, date, sequence = "UNKNOWN", "UNKNOWN", None, 0
                    name_status = "❌ No parseable"
                    stats['problems'].append(f"Nombre no parseable: {file}")
                
                # Analizar contenido
                content_analysis = analyze_file_content(file_path)
                can_decode_result = None
                
                # Debug: verificar si es archivo CAN
                print(f"DEBUG: Archivo {file} - Tipo: {file_type}")
                
                if file_type == 'CAN':
                    print(f"DEBUG: Intentando decodificar archivo CAN: {file}")
                    decodificador_path = Path(__file__).parent / 'data' / 'DECODIFICADOR CAN' / 'decodificador_can_unificado.py'
                    print(f"DEBUG: Ruta decodificador: {decodificador_path}")
                    print(f"DEBUG: ¿Existe decodificador?: {decodificador_path.exists()}")
                    
                    if decodificador_path.exists():
                        can_decode_result = try_decode_can(file_path, decodificador_path)
                        print(f"DEBUG: Resultado decodificación: {can_decode_result}")
                    else:
                        can_decode_result = {'decoded': False, 'reason': 'Decodificador no encontrado'}
                        print(f"DEBUG: Decodificador no encontrado")
                else:
                    print(f"DEBUG: No es archivo CAN, tipo: {file_type}")
                
                # Actualizar estadísticas
                status = content_analysis['status']
                stats['by_status'][status] += 1
                
                # Actualizar estadísticas por tipo
                if file_type in stats['by_type']:
                    stats['by_type'][file_type]['total'] += 1
                    if status == 'VALID':
                        stats['by_type'][file_type]['valid'] += 1
                    elif status in ['LOW_QUALITY', 'VERY_SHORT']:
                        stats['by_type'][file_type]['low_quality'] += 1
                    elif status in ['NO_VALID_DATA', 'HEADER_ONLY', 'EMPTY']:
                        stats['by_type'][file_type]['no_data'] += 1
                else:
                    stats['by_type']['UNKNOWN']['total'] += 1
                
                # Actualizar estadísticas por vehículo
                if vehicle not in stats['by_vehicle']:
                    stats['by_vehicle'][vehicle] = {
                        'total': 0, 'valid': 0, 'low_quality': 0, 'no_data': 0,
                        'by_type': {'CAN': 0, 'ESTABILIDAD': 0, 'GPS': 0, 'ROTATIVO': 0}
                    }
                stats['by_vehicle'][vehicle]['total'] += 1
                if status == 'VALID':
                    stats['by_vehicle'][vehicle]['valid'] += 1
                elif status in ['LOW_QUALITY', 'VERY_SHORT']:
                    stats['by_vehicle'][vehicle]['low_quality'] += 1
                elif status in ['NO_VALID_DATA', 'HEADER_ONLY', 'EMPTY']:
                    stats['by_vehicle'][vehicle]['no_data'] += 1
                
                if file_type in stats['by_vehicle'][vehicle]['by_type']:
                    stats['by_vehicle'][vehicle]['by_type'][file_type] += 1
                
                # Escribir análisis detallado al log
                log.write(f"\n{'='*60}\n")
                log.write(f"ARCHIVO: {file}\n")
                log.write(f"RUTA: {file_path.relative_to(base_path)}\n")
                log.write(f"TAMAÑO: {size} bytes\n")
                log.write(f"PARSEADO: {name_status}\n")
                if parsed:
                    log.write(f"TIPO: {file_type}, VEHÍCULO: {vehicle}, FECHA: {date}, SECUENCIA: {sequence}\n")
                
                log.write(f"ANÁLISIS DE CONTENIDO:\n")
                log.write(f"  Estado: {status}\n")
                log.write(f"  Líneas totales: {content_analysis.get('total_lines', 0)}\n")
                log.write(f"  Líneas de cabecera: {content_analysis.get('header_lines', 0)}\n")
                log.write(f"  Líneas de datos: {content_analysis.get('data_lines', 0)}\n")
                log.write(f"  Líneas válidas: {content_analysis.get('valid_data_lines', 0)}\n")
                log.write(f"  Líneas inválidas: {content_analysis.get('invalid_data_lines', 0)}\n")
                
                if content_analysis.get('first_data_time'):
                    log.write(f"  Primera medición: {content_analysis['first_data_time']}\n")
                if content_analysis.get('last_data_time'):
                    log.write(f"  Última medición: {content_analysis['last_data_time']}\n")
                if content_analysis.get('duration_minutes'):
                    log.write(f"  Duración: {content_analysis['duration_minutes']:.1f} minutos\n")
                
                if content_analysis.get('problems'):
                    log.write(f"  Problemas: {', '.join(content_analysis['problems'])}\n")
                
                # Siempre escribir sección de decodificación CAN
                if file_type == 'CAN':
                    if can_decode_result is not None:
                        log.write(f"  DECODIFICACIÓN CAN: {can_decode_result}\n")
                    else:
                        log.write(f"  DECODIFICACIÓN CAN: No se pudo ejecutar\n")
                else:
                    log.write(f"  DECODIFICACIÓN CAN: No aplica (tipo: {file_type})\n")
                
                # Mostrar primeras líneas del archivo
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        first_lines = f.readlines()[:5]
                    log.write(f"  PRIMERAS LÍNEAS:\n")
                    for i, line in enumerate(first_lines):
                        log.write(f"    {i+1}: {line.strip()}\n")
                except:
                    log.write(f"  ERROR: No se pudieron leer las primeras líneas\n")
        
        # Escribir resumen final
        log.write(f"\n{'='*80}\n")
        log.write(f"RESUMEN FINAL\n")
        log.write(f"{'='*80}\n")
        
        log.write(f"\nESTADÍSTICAS GLOBALES:\n")
        log.write(f"  Total archivos: {stats['total_files']}\n")
        log.write(f"  Total tamaño: {stats['total_size']/1024:.1f} KB\n")
        log.write(f"  Parseables: {stats['parseable']}\n")
        log.write(f"  RealTime: {stats['realtime']}\n")
        log.write(f"  No parseables: {stats['not_parseable']}\n")
        
        log.write(f"\nPOR ESTADO:\n")
        for status, count in stats['by_status'].items():
            log.write(f"  {status}: {count}\n")
        
        log.write(f"\nPOR TIPO DE ARCHIVO:\n")
        for file_type, type_stats in stats['by_type'].items():
            if type_stats['total'] > 0:
                log.write(f"  {file_type}:\n")
                log.write(f"    Total: {type_stats['total']}\n")
                log.write(f"    Válidos: {type_stats['valid']}\n")
                log.write(f"    Baja calidad: {type_stats['low_quality']}\n")
                log.write(f"    Sin datos: {type_stats['no_data']}\n")
        
        log.write(f"\nPOR VEHÍCULO:\n")
        for vehicle, vehicle_stats in stats['by_vehicle'].items():
            if vehicle_stats['total'] > 0:
                log.write(f"  {vehicle}:\n")
                log.write(f"    Total: {vehicle_stats['total']}\n")
                log.write(f"    Válidos: {vehicle_stats['valid']}\n")
                log.write(f"    Baja calidad: {vehicle_stats['low_quality']}\n")
                log.write(f"    Sin datos: {vehicle_stats['no_data']}\n")
                log.write(f"    Por tipo: {vehicle_stats['by_type']}\n")
        
        if stats['problems']:
            log.write(f"\nPROBLEMAS DETECTADOS:\n")
            for problem in stats['problems']:
                log.write(f"  - {problem}\n")
        
        # Mostrar resumen en consola
        print(f"\n📊 RESUMEN EN CONSOLA:")
        print(f"  Total archivos: {stats['total_files']}")
        print(f"  Parseables: {stats['parseable']}")
        print(f"  RealTime: {stats['realtime']}")
        print(f"  No parseables: {stats['not_parseable']}")
        print(f"  Válidos: {stats['by_status']['VALID']}")
        print(f"  Baja calidad: {stats['by_status']['LOW_QUALITY']}")
        print(f"  Sin datos válidos: {stats['by_status']['NO_VALID_DATA'] + stats['by_status']['HEADER_ONLY'] + stats['by_status']['EMPTY']}")
        print(f"\n📄 Log detallado guardado en: {log_file}")

def main():
    """Función principal"""
    print("🔍 ANÁLISIS EXHAUSTIVO DE ESTRUCTURA DE ARCHIVOS")
    print("=" * 60)
    
    script_dir = Path(__file__).parent
    base_path = script_dir / "data" / "datosDoback"  # Corregir ruta
    
    print(f"📁 Ruta de datos: {base_path}")
    print(f"¿Existe?: {base_path.exists()}")
    
    if not base_path.exists():
        print(f"❌ Ruta de datos no existe: {base_path}")
        return
    
    # Verificar contenido
    print(f"Contenido de {base_path}: {list(base_path.iterdir())}")
    
    # Verificar CMadrid específicamente
    cmadrid_path = base_path / "CMadrid"
    print(f"📁 Ruta CMadrid: {cmadrid_path}")
    print(f"¿Existe?: {cmadrid_path.exists()}")
    
    if cmadrid_path.exists():
        print(f"Contenido de CMadrid: {list(cmadrid_path.iterdir())}")
        
        # Contar archivos totales
        total_files = 0
        for root, dirs, files in os.walk(cmadrid_path):
            total_files += len(files)
        print(f"Total archivos encontrados: {total_files}")
        
        # Analizar exhaustivamente todos los archivos de CMadrid
        analyze_all_files_cmadrid_detailed(base_path)
    else:
        print(f"❌ Carpeta CMadrid no existe en: {cmadrid_path}")

if __name__ == "__main__":
    main() 