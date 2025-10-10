#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Auditoría de coordenadas GPS para diagnosticar por qué no se visualizan los recorridos.
"""

import os
import re
from datetime import datetime
from typing import List, Dict, Tuple

def audit_gps_file(file_path: str) -> Dict:
    """Audita un archivo GPS y muestra información sobre sus coordenadas."""
    print(f"\n📁 ARCHIVO: {os.path.basename(file_path)}")
    print(f"   Ruta: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()
        
        # Saltar cabeceras
        data_lines = [line.strip() for line in lines[2:] if line.strip() and 'sin datos GPS' not in line]
        
        if not data_lines:
            print("   ❌ No hay datos GPS válidos en el archivo")
            return {'valid_points': 0, 'in_spain_points': 0, 'total_lines': len(lines)}
        
        print(f"   📊 Total de líneas: {len(lines)}")
        print(f"   📊 Líneas de datos: {len(data_lines)}")
        
        # Analizar primeras 5 líneas
        print(f"\n   🔍 PRIMERAS 5 COORDENADAS:")
        for i, line in enumerate(data_lines[:5]):
            parts = [p.strip() for p in re.split(r'[,;]', line)]
            if len(parts) >= 9:
                try:
                    lat = float(parts[2])
                    lon = float(parts[3])
                    date_str = parts[0]
                    time_str = parts[1]
                    print(f"     {i+1}. {date_str} {time_str} - Lat: {lat}, Lon: {lon}")
                    
                    # Verificar si está en España
                    in_spain = (35.5 <= lat <= 43.8) and (-9.5 <= lon <= 3.5)
                    status = "✅ ESPAÑA" if in_spain else "❌ FUERA"
                    print(f"        {status}")
                    
                except (ValueError, IndexError) as e:
                    print(f"     {i+1}. Error parseando: {e}")
        
        # Analizar últimas 5 líneas
        print(f"\n   🔍 ÚLTIMAS 5 COORDENADAS:")
        for i, line in enumerate(data_lines[-5:]):
            parts = [p.strip() for p in re.split(r'[,;]', line)]
            if len(parts) >= 9:
                try:
                    lat = float(parts[2])
                    lon = float(parts[3])
                    date_str = parts[0]
                    time_str = parts[1]
                    print(f"     {len(data_lines)-4+i}. {date_str} {time_str} - Lat: {lat}, Lon: {lon}")
                    
                    # Verificar si está en España
                    in_spain = (35.5 <= lat <= 43.8) and (-9.5 <= lon <= 3.5)
                    status = "✅ ESPAÑA" if in_spain else "❌ FUERA"
                    print(f"        {status}")
                    
                except (ValueError, IndexError) as e:
                    print(f"     {len(data_lines)-4+i}. Error parseando: {e}")
        
        # Estadísticas generales
        valid_points = 0
        in_spain_points = 0
        
        for line in data_lines:
            parts = [p.strip() for p in re.split(r'[,;]', line)]
            if len(parts) >= 9:
                try:
                    lat = float(parts[2])
                    lon = float(parts[3])
                    valid_points += 1
                    
                    if (35.5 <= lat <= 43.8) and (-9.5 <= lon <= 3.5):
                        in_spain_points += 1
                        
                except (ValueError, IndexError):
                    continue
        
        print(f"\n   📈 ESTADÍSTICAS:")
        print(f"      Puntos válidos: {valid_points}")
        print(f"      Puntos en España: {in_spain_points}")
        print(f"      Porcentaje en España: {(in_spain_points/valid_points*100):.1f}%" if valid_points > 0 else "N/A")
        
        return {
            'valid_points': valid_points,
            'in_spain_points': in_spain_points,
            'total_lines': len(lines)
        }
        
    except Exception as e:
        print(f"   ❌ Error leyendo archivo: {e}")
        return {'valid_points': 0, 'in_spain_points': 0, 'total_lines': 0}

def main():
    """Función principal."""
    print("=" * 80)
    print("🔍 AUDITORÍA DE COORDENADAS GPS - DOBACK022")
    print("=" * 80)
    
    # Archivos GPS de doback022
    base_path = "data/datosDoback/CMadrid/doback022/GPS"
    
    # Archivos específicos de los días 7 y 9
    files_to_audit = [
        "GPS_DOBACK022_20250707_6.txt",  # Día 7
        "GPS_DOBACK022_20250709_0.txt"   # Día 9
    ]
    
    total_stats = {'valid_points': 0, 'in_spain_points': 0, 'total_lines': 0}
    
    for filename in files_to_audit:
        file_path = os.path.join(base_path, filename)
        if os.path.exists(file_path):
            stats = audit_gps_file(file_path)
            total_stats['valid_points'] += stats['valid_points']
            total_stats['in_spain_points'] += stats['in_spain_points']
            total_stats['total_lines'] += stats['total_lines']
        else:
            print(f"\n❌ ARCHIVO NO ENCONTRADO: {filename}")
    
    print("\n" + "=" * 80)
    print("📊 RESUMEN GENERAL")
    print("=" * 80)
    print(f"Total de puntos válidos: {total_stats['valid_points']:,}")
    print(f"Total de puntos en España: {total_stats['in_spain_points']:,}")
    if total_stats['valid_points'] > 0:
        print(f"Porcentaje en España: {(total_stats['in_spain_points']/total_stats['valid_points']*100):.1f}%")
    else:
        print("Porcentaje en España: 0%")
    
    print("\n" + "=" * 80)
    print("💡 DIAGNÓSTICO")
    print("=" * 80)
    
    if total_stats['in_spain_points'] == 0:
        print("❌ PROBLEMA IDENTIFICADO:")
        print("   - No hay puntos GPS válidos dentro de España")
        print("   - Los archivos contienen coordenadas fuera del rango esperado")
        print("   - Posibles causas:")
        print("     * Datos GPS corruptos o erróneos")
        print("     * Coordenadas en formato incorrecto")
        print("     * Valores por defecto (0,0) o fuera de rango")
        print("     * Problema en el proceso de adquisición de datos")
    else:
        print("✅ DATOS VÁLIDOS ENCONTRADOS:")
        print(f"   - {total_stats['in_spain_points']} puntos GPS válidos en España")
        print("   - Los recorridos deberían visualizarse correctamente")

if __name__ == "__main__":
    main() 