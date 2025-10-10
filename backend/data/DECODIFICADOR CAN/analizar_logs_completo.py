#!/usr/bin/env python3
"""
Script para analizar todos los archivos de log de errores CAN
y generar un mapeo completo de todos los IDs CAN encontrados.
"""

import os
import re
from pathlib import Path
from collections import defaultdict, Counter
from datetime import datetime

def analizar_todos_los_logs():
    """Analiza todos los archivos de log de errores CAN."""
    print("📊 ANÁLISIS COMPLETO DE LOGS DE ERRORES CAN")
    print("=" * 60)
    
    # Buscar todos los archivos de log
    archivos_log = list(Path('.').glob('errores_can_*.log'))
    
    if not archivos_log:
        print("❌ No se encontraron archivos de log de errores")
        return
    
    print(f"📄 Archivos de log encontrados: {len(archivos_log)}")
    
    # Recopilar todos los errores únicos
    errores_por_id = defaultdict(list)
    total_errores = 0
    archivos_procesados = 0
    
    for archivo_log in archivos_log:
        archivos_procesados += 1
        print(f"📖 Procesando: {archivo_log.name}")
        
        try:
            with open(archivo_log, 'r', encoding='utf-8') as f:
                contenido = f.read()
                
                # Extraer información de errores
                patron_error = r'ID CAN: ([0-9A-Fa-f]+) \(0x([0-9a-f]+)\)\s*\n\s*Cantidad de errores: (\d+)\s*\n\s*Tipo de error: ([^\n]+)'
                errores_encontrados = re.findall(patron_error, contenido, re.MULTILINE)
                
                for id_can, id_hex, cantidad, tipo_error in errores_encontrados:
                    errores_por_id[id_can].append({
                        'cantidad': int(cantidad),
                        'tipo_error': tipo_error,
                        'archivo': archivo_log.name
                    })
                    total_errores += int(cantidad)
                    
        except Exception as e:
            print(f"❌ Error procesando {archivo_log.name}: {e}")
    
    print(f"\n📊 RESUMEN DEL ANÁLISIS:")
    print(f"  📄 Archivos procesados: {archivos_procesados}")
    print(f"  🔢 Total de errores: {total_errores}")
    print(f"  🆔 IDs CAN únicos con errores: {len(errores_por_id)}")
    
    # Generar estadísticas detalladas
    generar_estadisticas_detalladas(errores_por_id, total_errores)
    
    # Generar mapeo completo
    generar_mapeo_completo(errores_por_id)
    
    return errores_por_id

def generar_estadisticas_detalladas(errores_por_id, total_errores):
    """Genera estadísticas detalladas de los errores."""
    print(f"\n📈 ESTADÍSTICAS DETALLADAS")
    print("=" * 40)
    
    # Contar errores por tipo
    tipos_error = Counter()
    for id_can, errores in errores_por_id.items():
        for error in errores:
            tipos_error[error['tipo_error']] += error['cantidad']
    
    print(f"🔍 TOP 10 TIPOS DE ERRORES:")
    for tipo, cantidad in tipos_error.most_common(10):
        porcentaje = (cantidad / total_errores) * 100
        print(f"  {tipo}: {cantidad} ({porcentaje:.1f}%)")
    
    # Contar errores por ID CAN
    errores_por_cantidad = []
    for id_can, errores in errores_por_id.items():
        total_id = sum(error['cantidad'] for error in errores)
        errores_por_cantidad.append((id_can, total_id))
    
    errores_por_cantidad.sort(key=lambda x: x[1], reverse=True)
    
    print(f"\n🔝 TOP 20 IDs CAN CON MÁS ERRORES:")
    for i, (id_can, cantidad) in enumerate(errores_por_cantidad[:20], 1):
        porcentaje = (cantidad / total_errores) * 100
        print(f"  {i:2d}. {id_can}: {cantidad} errores ({porcentaje:.1f}%)")

def generar_mapeo_completo(errores_por_id):
    """Genera un mapeo completo basado en todos los errores encontrados."""
    print(f"\n💻 GENERANDO MAPEO COMPLETO")
    print("=" * 40)
    
    # Separar por tipo (solicitud vs respuesta)
    solicitudes = []
    respuestas = []
    
    for id_can in errores_por_id.keys():
        if id_can.startswith('0C') or id_can.startswith('CF'):
            solicitudes.append(id_can)
        else:
            respuestas.append(id_can)
    
    # Crear archivo de mapeo completo
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    archivo_mapeo = f"mapeo_completo_final_{timestamp}.py"
    
    try:
        with open(archivo_mapeo, 'w', encoding='utf-8') as f:
            f.write("#!/usr/bin/env python3\n")
            f.write('"""\n')
            f.write("MAPEO COMPLETO FINAL DE IDs CAN PARA J1939\n")
            f.write(f"Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Basado en análisis de {len(errores_por_id)} IDs CAN únicos\n")
            f.write('"""\n\n')
            
            f.write("def obtener_mapeo_completo_final():\n")
            f.write('    """Retorna el mapeo completo final de IDs CAN para J1939."""\n')
            f.write("    return {\n")
            
            # Escribir solicitudes
            if solicitudes:
                f.write("        # Valor J1939: 1024 (Engine Data Request)\n")
                for id_can in sorted(solicitudes):
                    f.write(f"        0x{id_can}: 1024,  # Engine Data Request\n")
                f.write("\n")
            
            # Escribir respuestas
            if respuestas:
                f.write("        # Valor J1939: 240 (Engine Data Response)\n")
                for id_can in sorted(respuestas):
                    f.write(f"        0x{id_can}: 240,   # Engine Data Response\n")
            
            f.write("    }\n\n")
            
            # Agregar función para aplicar el mapeo
            f.write("def aplicar_mapeo_completo():\n")
            f.write('    """Aplica el mapeo completo al decodificador."""\n')
            f.write("    mapeo = obtener_mapeo_completo_final()\n")
            f.write("    print(f'📊 Mapeo completo aplicado: {len(mapeo)} IDs CAN')\n")
            f.write("    return mapeo\n")
        
        print(f"📝 Mapeo completo final guardado en: {archivo_mapeo}")
        
        # Mostrar resumen
        print(f"\n📊 RESUMEN DEL MAPEO COMPLETO:")
        print(f"  📤 Solicitudes (1024): {len(solicitudes)}")
        print(f"  📥 Respuestas (240): {len(respuestas)}")
        print(f"  🔢 Total IDs mapeados: {len(errores_por_id)}")
        
        # Mostrar algunos ejemplos
        if solicitudes:
            print(f"\n📤 Ejemplos de solicitudes:")
            for id_can in sorted(solicitudes)[:10]:
                print(f"    0x{id_can}: 1024")
        
        if respuestas:
            print(f"\n📥 Ejemplos de respuestas:")
            for id_can in sorted(respuestas)[:10]:
                print(f"    0x{id_can}: 240")
        
        # Generar código para actualizar el decodificador
        generar_codigo_actualizacion(solicitudes, respuestas)
        
    except Exception as e:
        print(f"❌ Error generando mapeo completo: {e}")

def generar_codigo_actualizacion(solicitudes, respuestas):
    """Genera el código para actualizar el decodificador."""
    print(f"\n🔧 GENERANDO CÓDIGO DE ACTUALIZACIÓN")
    print("=" * 40)
    
    archivo_actualizacion = "actualizar_decodificador.py"
    
    try:
        with open(archivo_actualizacion, 'w', encoding='utf-8') as f:
            f.write("#!/usr/bin/env python3\n")
            f.write('"""\n')
            f.write("Script para actualizar el decodificador con el mapeo completo\n")
            f.write(f"Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write('"""\n\n')
            
            f.write("def actualizar_mapeo_ids():\n")
            f.write('    """Actualiza el mapeo de IDs en el decodificador."""\n')
            f.write("    \n")
            f.write("    # Leer el archivo del decodificador\n")
            f.write("    with open('decodificador_can_unificado.py', 'r', encoding='utf-8') as f:\n")
            f.write("        contenido = f.read()\n")
            f.write("    \n")
            f.write("    # Generar nuevo mapeo\n")
            f.write("    nuevo_mapeo = '''\n")
            f.write("        # Mapeo de IDs de 29 bits a IDs de 11 bits para J1939 (COMPLETO FINAL)\n")
            f.write("        mapeo_ids = {\n")
            
            # Escribir solicitudes
            if solicitudes:
                f.write("            # Valor J1939: 1024 (Engine Data Request)\n")
                for id_can in sorted(solicitudes):
                    f.write(f"            0x{id_can}: 1024,  # Engine Data Request\n")
                f.write("\n")
            
            # Escribir respuestas
            if respuestas:
                f.write("            # Valor J1939: 240 (Engine Data Response)\n")
                for id_can in sorted(respuestas):
                    f.write(f"            0x{id_can}: 240,   # Engine Data Response\n")
            
            f.write("        }'''\n")
            f.write("    \n")
            f.write("    # Reemplazar el mapeo en el archivo\n")
            f.write("    import re\n")
            f.write("    patron = r'# Mapeo de IDs de 29 bits.*?\\n        }'\n")
            f.write("    contenido_actualizado = re.sub(patron, nuevo_mapeo, contenido, flags=re.DOTALL)\n")
            f.write("    \n")
            f.write("    # Guardar archivo actualizado\n")
            f.write("    with open('decodificador_can_unificado.py', 'w', encoding='utf-8') as f:\n")
            f.write("        f.write(contenido_actualizado)\n")
            f.write("    \n")
            f.write("    print('✅ Decodificador actualizado con mapeo completo')\n")
            f.write("    print(f'📊 Total IDs mapeados: {len(solicitudes) + len(respuestas)}')\n")
        
        print(f"📝 Código de actualización guardado en: {archivo_actualizacion}")
        print(f"💡 Para aplicar el mapeo completo, ejecuta: python {archivo_actualizacion}")
        
    except Exception as e:
        print(f"❌ Error generando código de actualización: {e}")

def main():
    """Función principal."""
    print("🔍 ANALIZADOR COMPLETO DE LOGS DE ERRORES CAN")
    print("=" * 60)
    print("Este script analizará todos los archivos de log de errores")
    print("para generar un mapeo completo de todos los IDs CAN encontrados.")
    print("=" * 60)
    
    # Analizar todos los logs
    errores_por_id = analizar_todos_los_logs()
    
    if errores_por_id:
        print(f"\n🎉 ANÁLISIS COMPLETO FINALIZADO")
        print("=" * 60)
        print("✅ Se han analizado todos los archivos de log")
        print("📊 Se ha generado un mapeo completo de IDs CAN")
        print("💻 Se ha creado código para actualizar el decodificador")
        print("🚀 El sistema está listo para mapeo completo")
    else:
        print(f"\n❌ ANÁLISIS COMPLETO FINALIZADO CON ERRORES")
        print("=" * 60)
        print("⚠️ No se pudieron procesar los archivos de log")

if __name__ == "__main__":
    main()