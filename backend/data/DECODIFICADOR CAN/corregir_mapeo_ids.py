#!/usr/bin/env python3
"""
Script para corregir el mapeo de IDs CAN faltantes.
Añade los IDs encontrados en los archivos reales al mapeo del decodificador.
"""

import sys
from pathlib import Path
from decodificador_can_unificado import DecodificadorCAN, buscar_archivos_can_recursivo

def analizar_ids_faltantes():
    """Analiza todos los archivos CAN para encontrar IDs no mapeados."""
    print("🔍 ANALIZADOR DE IDs CAN FALTANTES")
    print("=" * 50)
    
    # Directorio CMadrid
    directorio_cmadrid = Path(__file__).parent.parent / 'datosDoback' / 'CMadrid'
    
    # Buscar archivos CAN
    archivos_can = buscar_archivos_can_recursivo(directorio_cmadrid)
    print(f"📁 Archivos CAN encontrados: {len(archivos_can)}")
    
    # Crear decodificador para leer archivos
    decodificador = DecodificadorCAN()
    
    # Conjunto para almacenar todos los IDs únicos encontrados
    todos_los_ids = set()
    archivos_analizados = 0
    
    print(f"\n🔍 Analizando archivos para encontrar IDs únicos...")
    
    # Analizar una muestra de archivos (primeros 20 para no sobrecargar)
    for archivo in archivos_can[:20]:
        try:
            df, cabeceras = decodificador.leer_archivo_mixto(str(archivo))
            if df is not None and 'ID' in df.columns:
                ids_unicos = df['ID'].unique()
                todos_los_ids.update(ids_unicos)
                archivos_analizados += 1
                print(f"  ✅ {Path(archivo).name}: {len(ids_unicos)} IDs únicos")
        except Exception as e:
            print(f"  ❌ Error en {Path(archivo).name}: {str(e)}")
    
    print(f"\n📊 RESUMEN DEL ANÁLISIS:")
    print(f"  Archivos analizados: {archivos_analizados}")
    print(f"  IDs únicos encontrados: {len(todos_los_ids)}")
    
    # Mostrar todos los IDs encontrados
    print(f"\n📋 TODOS LOS IDs ENCONTRADOS:")
    for i, id_val in enumerate(sorted(todos_los_ids), 1):
        print(f"  {i:2d}. {id_val}")
    
    return todos_los_ids

def generar_mapeo_corregido(ids_encontrados):
    """Genera un mapeo corregido con todos los IDs encontrados."""
    print(f"\n🔧 GENERANDO MAPEO CORREGIDO")
    print("=" * 40)
    
    # Mapeo base existente
    mapeo_base = {
        0xCF00400: 1024,  # Engine Data Request
        0x18FEF100: 240,  # Engine Data Response
        0x14FEF100: 240,  # Engine Data Response (variante)
    }
    
    # Convertir IDs encontrados a enteros y crear mapeo
    mapeo_corregido = {}
    
    for id_str in ids_encontrados:
        try:
            # Convertir string a entero (hex)
            if id_str.startswith('0x'):
                id_int = int(id_str, 16)
            else:
                id_int = int(id_str, 16)
            
            # Mapear a ID de 11 bits (usar el mismo valor por ahora)
            mapeo_corregido[id_int] = id_int & 0x7FF  # Máscara para 11 bits
            
        except ValueError:
            print(f"  ⚠️  No se pudo convertir ID: {id_str}")
    
    print(f"📋 MAPEO CORREGIDO GENERADO:")
    print(f"  IDs mapeados: {len(mapeo_corregido)}")
    
    # Mostrar el mapeo
    print(f"\n📄 CÓDIGO DEL MAPEO CORREGIDO:")
    print("    mapeo_ids = {")
    for id_orig, id_mapeado in sorted(mapeo_corregido.items()):
        print(f"        0x{id_orig:X}: {id_mapeado},  # {hex(id_orig)} -> {hex(id_mapeado)}")
    print("    }")
    
    return mapeo_corregido

def crear_script_corregido():
    """Crea un script con el mapeo corregido."""
    print(f"\n📝 CREANDO SCRIPT CORREGIDO")
    print("=" * 35)
    
    # Leer el archivo original
    archivo_original = Path(__file__).parent / 'decodificador_can_unificado.py'
    
    with open(archivo_original, 'r', encoding='utf-8') as f:
        contenido = f.read()
    
    # Crear backup
    backup_path = archivo_original.with_suffix('.py.backup')
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(contenido)
    
    print(f"✅ Backup creado: {backup_path}")
    
    # Generar nuevo mapeo
    ids_encontrados = analizar_ids_faltantes()
    mapeo_corregido = generar_mapeo_corregido(ids_encontrados)
    
    # Crear el nuevo mapeo como string
    mapeo_str = "    mapeo_ids = {\n"
    for id_orig, id_mapeado in sorted(mapeo_corregido.items()):
        mapeo_str += f"        0x{id_orig:X}: {id_mapeado},  # {hex(id_orig)} -> {hex(id_mapeado)}\n"
    mapeo_str += "    }"
    
    print(f"\n🔧 APLICANDO CORRECCIÓN AL DECODIFICADOR...")
    
    # Buscar y reemplazar el mapeo en el archivo
    import re
    
    # Patrón para encontrar el mapeo existente
    patron_mapeo = r'mapeo_ids = \{[^}]+\}'
    
    # Reemplazar el mapeo
    contenido_corregido = re.sub(patron_mapeo, mapeo_str, contenido, flags=re.DOTALL)
    
    # Guardar archivo corregido
    archivo_corregido = archivo_original.with_suffix('.py.corregido')
    with open(archivo_corregido, 'w', encoding='utf-8') as f:
        f.write(contenido_corregido)
    
    print(f"✅ Archivo corregido creado: {archivo_corregido}")
    print(f"\n📋 INSTRUCCIONES:")
    print(f"  1. Revisar el archivo corregido: {archivo_corregido}")
    print(f"  2. Si está correcto, reemplazar el original:")
    print(f"     mv {archivo_corregido} {archivo_original}")
    print(f"  3. Probar el decodificador corregido")

def main():
    """Función principal."""
    print("🔧 CORRECTOR DE MAPEO DE IDs CAN")
    print("=" * 40)
    
    try:
        crear_script_corregido()
        print(f"\n✅ PROCESO COMPLETADO")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())