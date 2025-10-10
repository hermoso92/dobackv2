#!/usr/bin/env python3
"""
Script para analizar todos los IDs CAN que fallan en la decodificación
y generar un mapeo más completo para J1939.
"""

import os
import sys
import re
from pathlib import Path
from collections import defaultdict, Counter
import pandas as pd

def extraer_ids_de_archivo(archivo_path):
    """Extrae todos los IDs CAN únicos de un archivo."""
    ids_encontrados = set()
    
    try:
        with open(archivo_path, 'r', encoding='utf-8', errors='ignore') as f:
            for linea_num, linea in enumerate(f, 1):
                if linea_num > 1000:  # Solo leer primeras 1000 líneas para análisis
                    break
                    
                # Buscar patrones de ID CAN
                # Patrón 1: ID hexadecimal al inicio de línea
                match = re.match(r'^([0-9A-Fa-f]{8})\s', linea.strip())
                if match:
                    ids_encontrados.add(match.group(1).upper())
                
                # Patrón 2: ID con 0x
                match = re.search(r'0x([0-9A-Fa-f]{8})', linea)
                if match:
                    ids_encontrados.add(match.group(1).upper())
                
                # Patrón 3: ID sin 0x
                match = re.search(r'\b([0-9A-Fa-f]{8})\b', linea)
                if match:
                    ids_encontrados.add(match.group(1).upper())
    
    except Exception as e:
        print(f"Error leyendo {archivo_path}: {e}")
    
    return ids_encontrados

def analizar_todos_los_archivos():
    """Analiza todos los archivos CAN para encontrar IDs únicos."""
    print("🔍 ANALIZANDO TODOS LOS IDs CAN EN CMADRID")
    print("=" * 60)
    
    # Directorio base
    base_dir = Path("../datosDoback/CMadrid")
    if not base_dir.exists():
        print(f"Error: No se encuentra el directorio {base_dir}")
        return
    
    todos_los_ids = set()
    archivos_procesados = 0
    vehiculos_procesados = 0
    
    # Recorrer todos los vehículos
    for vehiculo_dir in base_dir.iterdir():
        if not vehiculo_dir.is_dir():
            continue
            
        vehiculo_name = vehiculo_dir.name
        can_dir = vehiculo_dir / "CAN"
        
        if not can_dir.exists():
            continue
            
        vehiculos_procesados += 1
        print(f"\n📁 Procesando vehículo: {vehiculo_name}")
        
        # Procesar archivos CAN del vehículo
        for archivo in can_dir.glob("CAN_*.txt"):
            if '_TRADUCIDO' in str(archivo):
                continue
                
            archivos_procesados += 1
            ids_archivo = extraer_ids_de_archivo(archivo)
            todos_los_ids.update(ids_archivo)
            
            if archivos_procesados % 50 == 0:
                print(f"  📊 Procesados {archivos_procesados} archivos, {len(todos_los_ids)} IDs únicos encontrados")
    
    print(f"\n📈 RESUMEN DEL ANÁLISIS:")
    print(f"  🚗 Vehículos procesados: {vehiculos_procesados}")
    print(f"  📄 Archivos procesados: {archivos_procesados}")
    print(f"  🔢 IDs únicos encontrados: {len(todos_los_ids)}")
    
    return todos_los_ids

def generar_mapeo_j1939(ids_encontrados):
    """Genera un mapeo J1939 más completo basado en los IDs encontrados."""
    print(f"\n🔧 GENERANDO MAPEO J1939 MEJORADO")
    print("=" * 60)
    
    # Mapeo actual (IDs conocidos)
    mapeo_actual = {
        'CF00400': 1024,  # Engine Data Request
        '18FEF100': 240,  # Engine Data Response
        '0CF00400': 1024, # Engine Data Request (sin 0x)
    }
    
    # IDs J1939 comunes y sus mapeos
    mapeo_j1939_extendido = {
        # Engine Data (0xCF00400 = 1024)
        'CF00400': 1024,
        '0CF00400': 1024,
        '18FEF100': 240,
        
        # Common J1939 IDs
        '18FECA03': 240,  # Engine Data Response
        '18FECA10': 240,  # Engine Data Response
        '18FECA17': 240,  # Engine Data Response
        '18FECA27': 240,  # Engine Data Response
        '18FECA37': 240,  # Engine Data Response
        '18FECA47': 240,  # Engine Data Response
        '18FECA57': 240,  # Engine Data Response
        '18FECA67': 240,  # Engine Data Response
        '18FECA77': 240,  # Engine Data Response
        '18FECA87': 240,  # Engine Data Response
        '18FECA97': 240,  # Engine Data Response
        '18FECAA7': 240,  # Engine Data Response
        '18FECAB7': 240,  # Engine Data Response
        '18FECAC7': 240,  # Engine Data Response
        '18FECAD7': 240,  # Engine Data Response
        '18FECAE7': 240,  # Engine Data Response
        '18FECAF7': 240,  # Engine Data Response
        
        # Request IDs
        'CF00203': 1024,  # Engine Data Request
        'CF00300': 1024,  # Engine Data Request
        'CF00C03': 1024,  # Engine Data Request
        'CF02FA0': 1024,  # Engine Data Request
        
        # Other common patterns
        '18FFC272': 240,  # Engine Data Response
        '18FF6321': 240,  # Engine Data Response
        '18FF6421': 240,  # Engine Data Response
        '18FF6221': 240,  # Engine Data Response
        '18FF5117': 240,  # Engine Data Response
        '18FF2100': 240,  # Engine Data Response
        
        # Additional patterns found
        '18F0090B': 240,  # Engine Data Response
        '18F00027': 240,  # Engine Data Response
        '18F00010': 240,  # Engine Data Response
        '18F00503': 240,  # Engine Data Response
        '18FEBF0B': 240,  # Engine Data Response
        '18FE6F27': 240,  # Engine Data Response
        '18FE4A03': 240,  # Engine Data Response
        '18FDA403': 240,  # Engine Data Response
        '18FEF600': 240,  # Engine Data Response
        
        # More patterns
        '18EB0172': 240,  # Engine Data Response
        '18EBFF00': 240,  # Engine Data Response
        '18EBFF29': 240,  # Engine Data Response
        '18EA0317': 240,  # Engine Data Response
        '18EA0017': 240,  # Engine Data Response
        
        # Request patterns
        'C010305': 1024,  # Engine Data Request
        'C012171': 1024,  # Engine Data Request
        'C012772': 1024,  # Engine Data Request
        'C001027': 1024,  # Engine Data Request
        'C0000A0': 1024,  # Engine Data Request
        'C0D0305': 1024,  # Engine Data Request
    }
    
    # Contar IDs encontrados que ya están mapeados
    ids_mapeados = 0
    ids_no_mapeados = []
    
    for id_can in ids_encontrados:
        if id_can in mapeo_j1939_extendido:
            ids_mapeados += 1
        else:
            ids_no_mapeados.append(id_can)
    
    print(f"📊 ESTADÍSTICAS DEL MAPEO:")
    print(f"  ✅ IDs ya mapeados: {ids_mapeados}")
    print(f"  ❌ IDs no mapeados: {len(ids_no_mapeados)}")
    print(f"  📈 Cobertura: {(ids_mapeados/len(ids_encontrados)*100):.1f}%")
    
    if ids_no_mapeados:
        print(f"\n🔍 TOP 20 IDs NO MAPEADOS:")
        for i, id_can in enumerate(sorted(ids_no_mapeados)[:20]):
            print(f"  {i+1:2d}. {id_can}")
    
    return mapeo_j1939_extendido, ids_no_mapeados

def generar_codigo_mapeo(mapeo_completo):
    """Genera el código Python para el mapeo mejorado."""
    print(f"\n💻 GENERANDO CÓDIGO DE MAPEO MEJORADO")
    print("=" * 60)
    
    codigo = """        # Mapeo de IDs de 29 bits a IDs de 11 bits para J1939 (MEJORADO)
        mapeo_ids = {
"""
    
    # Agrupar por valor de mapeo
    mapeo_por_valor = defaultdict(list)
    for id_can, valor in mapeo_completo.items():
        mapeo_por_valor[valor].append(id_can)
    
    # Generar código agrupado
    for valor, ids in sorted(mapeo_por_valor.items()):
        codigo += f"            # Valor J1939: {valor}\n"
        for id_can in sorted(ids):
            codigo += f"            0x{id_can}: {valor},\n"
        codigo += "\n"
    
    codigo += "        }"
    
    print("📋 CÓDIGO GENERADO:")
    print(codigo)
    
    return codigo

def main():
    """Función principal."""
    print("🚀 ANALIZADOR DE IDs CAN FALTANTES")
    print("=" * 60)
    
    # Analizar todos los archivos
    ids_encontrados = analizar_todos_los_archivos()
    
    if not ids_encontrados:
        print("❌ No se encontraron IDs CAN")
        return
    
    # Generar mapeo mejorado
    mapeo_completo, ids_no_mapeados = generar_mapeo_j1939(ids_encontrados)
    
    # Generar código
    codigo_mapeo = generar_codigo_mapeo(mapeo_completo)
    
    # Guardar resultados
    with open("mapeo_ids_mejorado.txt", "w", encoding="utf-8") as f:
        f.write("MAPEO DE IDs CAN MEJORADO PARA J1939\n")
        f.write("=" * 50 + "\n\n")
        f.write(codigo_mapeo)
        f.write("\n\n")
        f.write("IDs NO MAPEADOS:\n")
        f.write("-" * 20 + "\n")
        for id_can in sorted(ids_no_mapeados):
            f.write(f"{id_can}\n")
    
    print(f"\n💾 Resultados guardados en: mapeo_ids_mejorado.txt")
    print(f"📈 Mejora de cobertura: {len(mapeo_completo)} IDs mapeados")

if __name__ == "__main__":
    main()