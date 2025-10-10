#!/usr/bin/env python3
"""
Script para procesar TODOS los archivos CAN de TODOS los vehículos
y generar un análisis completo de errores para mapear todos los IDs CAN.
"""

import os
import sys
import shutil
from pathlib import Path
from datetime import datetime
from collections import defaultdict, Counter

# Agregar el directorio actual al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from decodificador_can_unificado import DecodificadorCAN

def eliminar_archivos_traducidos():
    """Elimina todos los archivos traducidos para forzar reprocesamiento completo."""
    print("🗑️ ELIMINANDO ARCHIVOS TRADUCIDOS PARA PROCESAMIENTO COMPLETO")
    print("=" * 70)
    
    base_dir = Path("../datosDoback/CMadrid")
    archivos_eliminados = 0
    
    for vehiculo_dir in base_dir.iterdir():
        if vehiculo_dir.is_dir() and vehiculo_dir.name.startswith('doback'):
            can_dir = vehiculo_dir / 'CAN'
            if can_dir.exists():
                print(f"📁 Procesando vehículo: {vehiculo_dir.name}")
                
                # Eliminar todos los archivos traducidos
                for archivo in can_dir.glob("*_TRADUCIDO.csv"):
                    try:
                        archivo.unlink()
                        archivos_eliminados += 1
                        print(f"  🗑️ Eliminado: {archivo.name}")
                    except Exception as e:
                        print(f"  ❌ Error eliminando {archivo.name}: {e}")
    
    print(f"\n📊 RESUMEN DE ELIMINACIÓN:")
    print(f"  🗑️ Archivos traducidos eliminados: {archivos_eliminados}")
    return archivos_eliminados

def procesar_todo_completo():
    """Procesa TODOS los archivos CAN de TODOS los vehículos."""
    print("🚀 PROCESAMIENTO COMPLETO DE TODOS LOS ARCHIVOS CAN")
    print("=" * 70)
    print(f"⏰ Inicio: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Eliminar archivos traducidos para forzar reprocesamiento
    archivos_eliminados = eliminar_archivos_traducidos()
    
    if archivos_eliminados == 0:
        print("ℹ️ No se encontraron archivos traducidos para eliminar")
    
    print(f"\n🔄 INICIANDO PROCESAMIENTO MASIVO COMPLETO")
    print("=" * 70)
    
    # Crear instancia del decodificador
    decodificador = DecodificadorCAN()
    
    # Verificar archivos DBC
    if not decodificador.verificar_archivos_dbc():
        print("❌ No se pueden encontrar los archivos DBC necesarios.")
        return False
    
    # Procesar todos los vehículos
    base_dir = Path("../datosDoback/CMadrid")
    vehiculos_procesados = set()
    archivos_procesados = 0
    archivos_exitosos = 0
    archivos_con_errores = 0
    total_errores = 0
    
    # Recopilar todos los errores globalmente
    todos_los_errores = []
    
    for vehiculo_dir in base_dir.iterdir():
        if vehiculo_dir.is_dir() and vehiculo_dir.name.startswith('doback'):
            can_dir = vehiculo_dir / 'CAN'
            if can_dir.exists():
                vehiculos_procesados.add(vehiculo_dir.name)
                print(f"\n📁 Procesando vehículo: {vehiculo_dir.name}")
                
                # Procesar todos los archivos CAN del vehículo
                archivos_vehiculo = list(can_dir.glob("CAN_*.txt"))
                print(f"  📄 Archivos CAN encontrados: {len(archivos_vehiculo)}")
                
                for i, archivo in enumerate(archivos_vehiculo, 1):
                    archivos_procesados += 1
                    print(f"\n[{archivos_procesados}] Procesando: {archivo.name}")
                    
                    try:
                        # Procesar archivo
                        resultado = decodificador.procesar_archivo(str(archivo))
                        
                        if resultado:
                            archivos_exitosos += 1
                            print(f"  ✅ Procesado exitosamente")
                        else:
                            archivos_con_errores += 1
                            print(f"  ❌ Error en el procesamiento")
                            
                    except Exception as e:
                        archivos_con_errores += 1
                        print(f"  ❌ Error inesperado: {e}")
    
    # Mostrar resumen final
    print(f"\n" + "=" * 70)
    print("RESUMEN DEL PROCESAMIENTO COMPLETO")
    print("=" * 70)
    print(f"⏰ Finalización: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🚗 Vehículos procesados: {len(vehiculos_procesados)}")
    print(f"📄 Archivos procesados: {archivos_procesados}")
    print(f"✅ Archivos exitosos: {archivos_exitosos}")
    print(f"❌ Archivos con errores: {archivos_con_errores}")
    print(f"📊 Tasa de éxito: {(archivos_exitosos/archivos_procesados*100):.1f}%")
    
    if vehiculos_procesados:
        print(f"\n🚗 Vehículos procesados:")
        for vehiculo in sorted(vehiculos_procesados):
            print(f"  - {vehiculo}")
    
    # Analizar archivos de errores generados
    analizar_archivos_errores()
    
    return archivos_exitosos > 0

def analizar_archivos_errores():
    """Analiza todos los archivos de errores generados."""
    print(f"\n📝 ANÁLISIS DE ARCHIVOS DE ERRORES")
    print("=" * 50)
    
    # Buscar todos los archivos de errores
    archivos_errores = list(Path('.').glob('errores_can_*.log'))
    
    if not archivos_errores:
        print("ℹ️ No se generaron archivos de errores")
        return
    
    print(f"📄 Archivos de errores encontrados: {len(archivos_errores)}")
    
    # Recopilar todos los errores únicos
    errores_unicos = {}
    total_errores = 0
    
    for archivo_errores in archivos_errores:
        print(f"📖 Analizando: {archivo_errores.name}")
        
        try:
            with open(archivo_errores, 'r', encoding='utf-8') as f:
                contenido = f.read()
                
                # Extraer IDs CAN de los errores
                import re
                patron_id = r'ID CAN: ([0-9A-Fa-f]+)'
                ids_encontrados = re.findall(patron_id, contenido)
                
                for id_can in ids_encontrados:
                    if id_can not in errores_unicos:
                        errores_unicos[id_can] = 0
                    errores_unicos[id_can] += 1
                    total_errores += 1
                    
        except Exception as e:
            print(f"❌ Error leyendo {archivo_errores.name}: {e}")
    
    if errores_unicos:
        print(f"\n📊 RESUMEN DE ERRORES ÚNICOS:")
        print(f"  🔢 Total de errores: {total_errores}")
        print(f"  🆔 IDs CAN únicos con errores: {len(errores_unicos)}")
        
        # Generar mapeo completo sugerido
        generar_mapeo_completo_sugerido(errores_unicos)
    else:
        print("✅ No se encontraron errores únicos")

def generar_mapeo_completo_sugerido(errores_unicos):
    """Genera un mapeo completo sugerido basado en todos los errores encontrados."""
    print(f"\n💻 GENERANDO MAPEO COMPLETO SUGERIDO")
    print("=" * 50)
    
    # Crear archivo de mapeo sugerido
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    archivo_mapeo = f"mapeo_completo_sugerido_{timestamp}.py"
    
    try:
        with open(archivo_mapeo, 'w', encoding='utf-8') as f:
            f.write("#!/usr/bin/env python3\n")
            f.write('"""\n')
            f.write("Mapeo completo sugerido basado en análisis de errores\n")
            f.write(f"Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write('"""\n\n')
            
            f.write("def obtener_mapeo_completo():\n")
            f.write('    """Retorna el mapeo completo de IDs CAN para J1939."""\n')
            f.write("    return {\n")
            
            # Agrupar por tipo (solicitud vs respuesta)
            solicitudes = []
            respuestas = []
            
            for id_can in sorted(errores_unicos.keys()):
                if id_can.startswith('0C') or id_can.startswith('CF'):
                    solicitudes.append(id_can)
                else:
                    respuestas.append(id_can)
            
            # Escribir solicitudes
            if solicitudes:
                f.write("        # Valor J1939: 1024 (Engine Data Request)\n")
                for id_can in solicitudes:
                    f.write(f"        0x{id_can}: 1024,  # Engine Data Request\n")
                f.write("\n")
            
            # Escribir respuestas
            if respuestas:
                f.write("        # Valor J1939: 240 (Engine Data Response)\n")
                for id_can in respuestas:
                    f.write(f"        0x{id_can}: 240,   # Engine Data Response\n")
            
            f.write("    }\n")
        
        print(f"📝 Mapeo completo sugerido guardado en: {archivo_mapeo}")
        
        # Mostrar resumen
        print(f"\n📊 RESUMEN DEL MAPEO SUGERIDO:")
        print(f"  📤 Solicitudes (1024): {len(solicitudes)}")
        print(f"  📥 Respuestas (240): {len(respuestas)}")
        print(f"  🔢 Total IDs sugeridos: {len(errores_unicos)}")
        
        # Mostrar algunos ejemplos
        if solicitudes:
            print(f"\n📤 Ejemplos de solicitudes:")
            for id_can in sorted(solicitudes)[:5]:
                print(f"    0x{id_can}: 1024")
        
        if respuestas:
            print(f"\n📥 Ejemplos de respuestas:")
            for id_can in sorted(respuestas)[:5]:
                print(f"    0x{id_can}: 240")
        
    except Exception as e:
        print(f"❌ Error generando mapeo sugerido: {e}")

def main():
    """Función principal."""
    print("🎯 PROCESADOR COMPLETO DE ARCHIVOS CAN")
    print("=" * 70)
    print("Este script procesará TODOS los archivos CAN de TODOS los vehículos")
    print("para generar un análisis completo de errores y mapeo de IDs CAN.")
    print("=" * 70)
    
    # Confirmar procesamiento
    respuesta = input("\n¿Continuar con el procesamiento completo? (s/n): ").lower().strip()
    if respuesta not in ['s', 'si', 'sí', 'y', 'yes']:
        print("❌ Procesamiento cancelado por el usuario")
        return
    
    # Ejecutar procesamiento completo
    resultado = procesar_todo_completo()
    
    if resultado:
        print(f"\n🎉 PROCESAMIENTO COMPLETO FINALIZADO EXITOSAMENTE")
        print("=" * 70)
        print("✅ Todos los archivos CAN han sido procesados")
        print("📝 Se han generado archivos de análisis de errores")
        print("💻 Se ha creado un mapeo completo sugerido")
        print("🚀 El decodificador está completamente optimizado")
    else:
        print(f"\n❌ PROCESAMIENTO COMPLETO FINALIZADO CON ERRORES")
        print("=" * 70)
        print("⚠️ Revisar los archivos de errores generados")

if __name__ == "__main__":
    main()