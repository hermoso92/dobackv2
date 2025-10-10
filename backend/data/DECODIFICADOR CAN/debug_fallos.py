#!/usr/bin/env python3
"""
Script de depuración para analizar archivos CAN que fallaron en el procesamiento.
Analiza específicamente por qué no se pudieron decodificar ciertos archivos.
"""

import sys
from pathlib import Path
import pandas as pd
import cantools
from decodificador_can_unificado import DecodificadorCAN, buscar_archivos_can_recursivo

def analizar_archivo_fallido(archivo_path, decodificador):
    """Analiza un archivo específico que falló para entender el motivo."""
    print(f"\n🔍 ANALIZANDO ARCHIVO FALLIDO: {Path(archivo_path).name}")
    print("=" * 60)
    
    try:
        # Leer el archivo
        df, cabeceras = decodificador.leer_archivo_mixto(str(archivo_path))
        if df is None or df.empty:
            print("❌ No se pudieron leer datos válidos del archivo")
            return False
        
        print(f"📊 Líneas leídas: {len(df)}")
        print(f"📋 Columnas: {list(df.columns)}")
        
        # Mostrar primeras líneas
        print("\n📄 Primeras 5 líneas del archivo:")
        print(df.head().to_string())
        
        # Identificar protocolo
        protocolo = decodificador.identificar_protocolo(df)
        print(f"\n🔍 Protocolo identificado: {protocolo}")
        
        if not protocolo:
            print("❌ No se pudo identificar el protocolo")
            return False
        
        # Cargar DBC
        if not decodificador.cargar_dbc(protocolo):
            print("❌ No se pudo cargar la base de datos DBC")
            return False
        
        # Analizar IDs únicos
        if 'ID' in df.columns:
            ids_unicos = df['ID'].unique()
            print(f"\n📋 IDs únicos encontrados ({len(ids_unicos)}):")
            for i, id_val in enumerate(ids_unicos[:10]):  # Mostrar solo los primeros 10
                print(f"  {i+1}. {id_val}")
            if len(ids_unicos) > 10:
                print(f"  ... y {len(ids_unicos) - 10} más")
        
        # Intentar decodificar con análisis detallado
        print(f"\n🔧 Intentando decodificar con análisis detallado...")
        df_decodificado = decodificar_can_detallado(df, decodificador)
        
        if df_decodificado is not None and not df_decodificado.empty:
            print("✅ Decodificación exitosa con análisis detallado")
            return True
        else:
            print("❌ Falló la decodificación incluso con análisis detallado")
            return False
            
    except Exception as e:
        print(f"❌ Error durante el análisis: {str(e)}")
        return False

def decodificar_can_detallado(df, decodificador):
    """Versión detallada del decodificador para depuración."""
    if not decodificador.db:
        print("Error: No se ha cargado ninguna base de datos DBC")
        return None

    # Mapeo de IDs de 29 bits a IDs de 11 bits para J1939
    mapeo_ids = {
        0xCF00400: 1024,  # Engine Data Request
        0x18FEF100: 240,  # Engine Data Response
        0x14FEF100: 240,  # Engine Data Response (variante)
        0x0CF00400: 1024, # Engine Data Request (sin 0x)
        0x0CF00401: 1025, # Engine Data Request (variante)
        0x0CF00402: 1026, # Engine Data Request (variante)
        0x0CF00403: 1027, # Engine Data Request (variante)
        0x0CF00404: 1028, # Engine Data Request (variante)
        0x0CF00405: 1029, # Engine Data Request (variante)
        0x0CF00406: 1030, # Engine Data Request (variante)
        0x0CF00407: 1031, # Engine Data Request (variante)
        0x0CF00408: 1032, # Engine Data Request (variante)
        0x0CF00409: 1033, # Engine Data Request (variante)
        0x0CF0040A: 1034, # Engine Data Request (variante)
        0x0CF0040B: 1035, # Engine Data Request (variante)
        0x0CF0040C: 1036, # Engine Data Request (variante)
        0x0CF0040D: 1037, # Engine Data Request (variante)
        0x0CF0040E: 1038, # Engine Data Request (variante)
        0x0CF0040F: 1039, # Engine Data Request (variante)
        0x0CF00410: 1040, # Engine Data Request (variante)
        0x0CF00411: 1041, # Engine Data Request (variante)
        0x0CF00412: 1042, # Engine Data Request (variante)
        0x0CF00413: 1043, # Engine Data Request (variante)
        0x0CF00414: 1044, # Engine Data Request (variante)
        0x0CF00415: 1045, # Engine Data Request (variante)
        0x0CF00416: 1046, # Engine Data Request (variante)
        0x0CF00417: 1047, # Engine Data Request (variante)
        0x0CF00418: 1048, # Engine Data Request (variante)
        0x0CF00419: 1049, # Engine Data Request (variante)
        0x0CF0041A: 1050, # Engine Data Request (variante)
        0x0CF0041B: 1051, # Engine Data Request (variante)
        0x0CF0041C: 1052, # Engine Data Request (variante)
        0x0CF0041D: 1053, # Engine Data Request (variante)
        0x0CF0041E: 1054, # Engine Data Request (variante)
        0x0CF0041F: 1055, # Engine Data Request (variante)
        0x0CF00420: 1056, # Engine Data Request (variante)
        0x0CF00421: 1057, # Engine Data Request (variante)
        0x0CF00422: 1058, # Engine Data Request (variante)
        0x0CF00423: 1059, # Engine Data Request (variante)
        0x0CF00424: 1060, # Engine Data Request (variante)
        0x0CF00425: 1061, # Engine Data Request (variante)
        0x0CF00426: 1062, # Engine Data Request (variante)
        0x0CF00427: 1063, # Engine Data Request (variante)
        0x0CF00428: 1064, # Engine Data Request (variante)
        0x0CF00429: 1065, # Engine Data Request (variante)
        0x0CF0042A: 1066, # Engine Data Request (variante)
        0x0CF0042B: 1067, # Engine Data Request (variante)
        0x0CF0042C: 1068, # Engine Data Request (variante)
        0x0CF0042D: 1069, # Engine Data Request (variante)
        0x0CF0042E: 1070, # Engine Data Request (variante)
        0x0CF0042F: 1071, # Engine Data Request (variante)
        0x0CF00430: 1072, # Engine Data Request (variante)
        0x0CF00431: 1073, # Engine Data Request (variante)
        0x0CF00432: 1074, # Engine Data Request (variante)
        0x0CF00433: 1075, # Engine Data Request (variante)
        0x0CF00434: 1076, # Engine Data Request (variante)
        0x0CF00435: 1077, # Engine Data Request (variante)
        0x0CF00436: 1078, # Engine Data Request (variante)
        0x0CF00437: 1079, # Engine Data Request (variante)
        0x0CF00438: 1080, # Engine Data Request (variante)
        0x0CF00439: 1081, # Engine Data Request (variante)
        0x0CF0043A: 1082, # Engine Data Request (variante)
        0x0CF0043B: 1083, # Engine Data Request (variante)
        0x0CF0043C: 1084, # Engine Data Request (variante)
        0x0CF0043D: 1085, # Engine Data Request (variante)
        0x0CF0043E: 1086, # Engine Data Request (variante)
        0x0CF0043F: 1087, # Engine Data Request (variante)
        0x0CF00440: 1088, # Engine Data Request (variante)
        0x0CF00441: 1089, # Engine Data Request (variante)
        0x0CF00442: 1090, # Engine Data Request (variante)
        0x0CF00443: 1091, # Engine Data Request (variante)
        0x0CF00444: 1092, # Engine Data Request (variante)
        0x0CF00445: 1093, # Engine Data Request (variante)
        0x0CF00446: 1094, # Engine Data Request (variante)
        0x0CF00447: 1095, # Engine Data Request (variante)
        0x0CF00448: 1096, # Engine Data Request (variante)
        0x0CF00449: 1097, # Engine Data Request (variante)
        0x0CF0044A: 1098, # Engine Data Request (variante)
        0x0CF0044B: 1099, # Engine Data Request (variante)
        0x0CF0044C: 1100, # Engine Data Request (variante)
        0x0CF0044D: 1101, # Engine Data Request (variante)
        0x0CF0044E: 1102, # Engine Data Request (variante)
        0x0CF0044F: 1103, # Engine Data Request (variante)
        0x0CF00450: 1104, # Engine Data Request (variante)
        0x0CF00451: 1105, # Engine Data Request (variante)
        0x0CF00452: 1106, # Engine Data Request (variante)
        0x0CF00453: 1107, # Engine Data Request (variante)
        0x0CF00454: 1108, # Engine Data Request (variante)
        0x0CF00455: 1109, # Engine Data Request (variante)
        0x0CF00456: 1110, # Engine Data Request (variante)
        0x0CF00457: 1111, # Engine Data Request (variante)
        0x0CF00458: 1112, # Engine Data Request (variante)
        0x0CF00459: 1113, # Engine Data Request (variante)
        0x0CF0045A: 1114, # Engine Data Request (variante)
        0x0CF0045B: 1115, # Engine Data Request (variante)
        0x0CF0045C: 1116, # Engine Data Request (variante)
        0x0CF0045D: 1117, # Engine Data Request (variante)
        0x0CF0045E: 1118, # Engine Data Request (variante)
        0x0CF0045F: 1119, # Engine Data Request (variante)
        0x0CF00460: 1120, # Engine Data Request (variante)
        0x0CF00461: 1121, # Engine Data Request (variante)
        0x0CF00462: 1122, # Engine Data Request (variante)
        0x0CF00463: 1123, # Engine Data Request (variante)
        0x0CF00464: 1124, # Engine Data Request (variante)
        0x0CF00465: 1125, # Engine Data Request (variante)
        0x0CF00466: 1126, # Engine Data Request (variante)
        0x0CF00467: 1127, # Engine Data Request (variante)
        0x0CF00468: 1128, # Engine Data Request (variante)
        0x0CF00469: 1129, # Engine Data Request (variante)
        0x0CF0046A: 1130, # Engine Data Request (variante)
        0x0CF0046B: 1131, # Engine Data Request (variante)
        0x0CF0046C: 1132, # Engine Data Request (variante)
        0x0CF0046D: 1133, # Engine Data Request (variante)
        0x0CF0046E: 1134, # Engine Data Request (variante)
        0x0CF0046F: 1135, # Engine Data Request (variante)
        0x0CF00470: 1136, # Engine Data Request (variante)
        0x0CF00471: 1137, # Engine Data Request (variante)
        0x0CF00472: 1138, # Engine Data Request (variante)
        0x0CF00473: 1139, # Engine Data Request (variante)
        0x0CF00474: 1140, # Engine Data Request (variante)
        0x0CF00475: 1141, # Engine Data Request (variante)
        0x0CF00476: 1142, # Engine Data Request (variante)
        0x0CF00477: 1143, # Engine Data Request (variante)
        0x0CF00478: 1144, # Engine Data Request (variante)
        0x0CF00479: 1145, # Engine Data Request (variante)
        0x0CF0047A: 1146, # Engine Data Request (variante)
        0x0CF0047B: 1147, # Engine Data Request (variante)
        0x0CF0047C: 1148, # Engine Data Request (variante)
        0x0CF0047D: 1149, # Engine Data Request (variante)
        0x0CF0047E: 1150, # Engine Data Request (variante)
        0x0CF0047F: 1151, # Engine Data Request (variante)
        0x0CF00480: 1152, # Engine Data Request (variante)
        0x0CF00481: 1153, # Engine Data Request (variante)
        0x0CF00482: 1154, # Engine Data Request (variante)
        0x0CF00483: 1155, # Engine Data Request (variante)
        0x0CF00484: 1156, # Engine Data Request (variante)
        0x0CF00485: 1157, # Engine Data Request (variante)
        0x0CF00486: 1158, # Engine Data Request (variante)
        0x0CF00487: 1159, # Engine Data Request (variante)
        0x0CF00488: 1160, # Engine Data Request (variante)
        0x0CF00489: 1161, # Engine Data Request (variante)
        0x0CF0048A: 1162, # Engine Data Request (variante)
        0x0CF0048B: 1163, # Engine Data Request (variante)
        0x0CF0048C: 1164, # Engine Data Request (variante)
        0x0CF0048D: 1165, # Engine Data Request (variante)
        0x0CF0048E: 1166, # Engine Data Request (variante)
        0x0CF0048F: 1167, # Engine Data Request (variante)
        0x0CF00490: 1168, # Engine Data Request (variante)
        0x0CF00491: 1169, # Engine Data Request (variante)
        0x0CF00492: 1170, # Engine Data Request (variante)
        0x0CF00493: 1171, # Engine Data Request (variante)
        0x0CF00494: 1172, # Engine Data Request (variante)
        0x0CF00495: 1173, # Engine Data Request (variante)
        0x0CF00496: 1174, # Engine Data Request (variante)
        0x0CF00497: 1175, # Engine Data Request (variante)
        0x0CF00498: 1176, # Engine Data Request (variante)
        0x0CF00499: 1177, # Engine Data Request (variante)
        0x0CF0049A: 1178, # Engine Data Request (variante)
        0x0CF0049B: 1179, # Engine Data Request (variante)
        0x0CF0049C: 1180, # Engine Data Request (variante)
        0x0CF0049D: 1181, # Engine Data Request (variante)
        0x0CF0049E: 1182, # Engine Data Request (variante)
        0x0CF0049F: 1183, # Engine Data Request (variante)
        0x0CF004A0: 1184, # Engine Data Request (variante)
        0x0CF004A1: 1185, # Engine Data Request (variante)
        0x0CF004A2: 1186, # Engine Data Request (variante)
        0x0CF004A3: 1187, # Engine Data Request (variante)
        0x0CF004A4: 1188, # Engine Data Request (variante)
        0x0CF004A5: 1189, # Engine Data Request (variante)
        0x0CF004A6: 1190, # Engine Data Request (variante)
        0x0CF004A7: 1191, # Engine Data Request (variante)
        0x0CF004A8: 1192, # Engine Data Request (variante)
        0x0CF004A9: 1193, # Engine Data Request (variante)
        0x0CF004AA: 1194, # Engine Data Request (variante)
        0x0CF004AB: 1195, # Engine Data Request (variante)
        0x0CF004AC: 1196, # Engine Data Request (variante)
        0x0CF004AD: 1197, # Engine Data Request (variante)
        0x0CF004AE: 1198, # Engine Data Request (variante)
        0x0CF004AF: 1199, # Engine Data Request (variante)
        0x0CF004B0: 1200, # Engine Data Request (variante)
        0x0CF004B1: 1201, # Engine Data Request (variante)
        0x0CF004B2: 1202, # Engine Data Request (variante)
        0x0CF004B3: 1203, # Engine Data Request (variante)
        0x0CF004B4: 1204, # Engine Data Request (variante)
        0x0CF004B5: 1205, # Engine Data Request (variante)
        0x0CF004B6: 1206, # Engine Data Request (variante)
        0x0CF004B7: 1207, # Engine Data Request (variante)
        0x0CF004B8: 1208, # Engine Data Request (variante)
        0x0CF004B9: 1209, # Engine Data Request (variante)
        0x0CF004BA: 1210, # Engine Data Request (variante)
        0x0CF004BB: 1211, # Engine Data Request (variante)
        0x0CF004BC: 1212, # Engine Data Request (variante)
        0x0CF004BD: 1213, # Engine Data Request (variante)
        0x0CF004BE: 1214, # Engine Data Request (variante)
        0x0CF004BF: 1215, # Engine Data Request (variante)
        0x0CF004C0: 1216, # Engine Data Request (variante)
        0x0CF004C1: 1217, # Engine Data Request (variante)
        0x0CF004C2: 1218, # Engine Data Request (variante)
        0x0CF004C3: 1219, # Engine Data Request (variante)
        0x0CF004C4: 1220, # Engine Data Request (variante)
        0x0CF004C5: 1221, # Engine Data Request (variante)
        0x0CF004C6: 1222, # Engine Data Request (variante)
        0x0CF004C7: 1223, # Engine Data Request (variante)
        0x0CF004C8: 1224, # Engine Data Request (variante)
        0x0CF004C9: 1225, # Engine Data Request (variante)
        0x0CF004CA: 1226, # Engine Data Request (variante)
        0x0CF004CB: 1227, # Engine Data Request (variante)
        0x0CF004CC: 1228, # Engine Data Request (variante)
        0x0CF004CD: 1229, # Engine Data Request (variante)
        0x0CF004CE: 1230, # Engine Data Request (variante)
        0x0CF004CF: 1231, # Engine Data Request (variante)
        0x0CF004D0: 1232, # Engine Data Request (variante)
        0x0CF004D1: 1233, # Engine Data Request (variante)
        0x0CF004D2: 1234, # Engine Data Request (variante)
        0x0CF004D3: 1235, # Engine Data Request (variante)
        0x0CF004D4: 1236, # Engine Data Request (variante)
        0x0CF004D5: 1237, # Engine Data Request (variante)
        0x0CF004D6: 1238, # Engine Data Request (variante)
        0x0CF004D7: 1239, # Engine Data Request (variante)
        0x0CF004D8: 1240, # Engine Data Request (variante)
        0x0CF004D9: 1241, # Engine Data Request (variante)
        0x0CF004DA: 1242, # Engine Data Request (variante)
        0x0CF004DB: 1243, # Engine Data Request (variante)
        0x0CF004DC: 1244, # Engine Data Request (variante)
        0x0CF004DD: 1245, # Engine Data Request (variante)
        0x0CF004DE: 1246, # Engine Data Request (variante)
        0x0CF004DF: 1247, # Engine Data Request (variante)
        0x0CF004E0: 1248, # Engine Data Request (variante)
        0x0CF004E1: 1249, # Engine Data Request (variante)
        0x0CF004E2: 1250, # Engine Data Request (variante)
        0x0CF004E3: 1251, # Engine Data Request (variante)
        0x0CF004E4: 1252, # Engine Data Request (variante)
        0x0CF004E5: 1253, # Engine Data Request (variante)
        0x0CF004E6: 1254, # Engine Data Request (variante)
        0x0CF004E7: 1255, # Engine Data Request (variante)
        0x0CF004E8: 1256, # Engine Data Request (variante)
        0x0CF004E9: 1257, # Engine Data Request (variante)
        0x0CF004EA: 1258, # Engine Data Request (variante)
        0x0CF004EB: 1259, # Engine Data Request (variante)
        0x0CF004EC: 1260, # Engine Data Request (variante)
        0x0CF004ED: 1261, # Engine Data Request (variante)
        0x0CF004EE: 1262, # Engine Data Request (variante)
        0x0CF004EF: 1263, # Engine Data Request (variante)
        0x0CF004F0: 1264, # Engine Data Request (variante)
        0x0CF004F1: 1265, # Engine Data Request (variante)
        0x0CF004F2: 1266, # Engine Data Request (variante)
        0x0CF004F3: 1267, # Engine Data Request (variante)
        0x0CF004F4: 1268, # Engine Data Request (variante)
        0x0CF004F5: 1269, # Engine Data Request (variante)
        0x0CF004F6: 1270, # Engine Data Request (variante)
        0x0CF004F7: 1271, # Engine Data Request (variante)
        0x0CF004F8: 1272, # Engine Data Request (variante)
        0x0CF004F9: 1273, # Engine Data Request (variante)
        0x0CF004FA: 1274, # Engine Data Request (variante)
        0x0CF004FB: 1275, # Engine Data Request (variante)
        0x0CF004FC: 1276, # Engine Data Request (variante)
        0x0CF004FD: 1277, # Engine Data Request (variante)
        0x0CF004FE: 1278, # Engine Data Request (variante)
        0x0CF004FF: 1279, # Engine Data Request (variante)
    }
    
    # Analizar IDs únicos y sus frecuencias
    if 'ID' in df.columns:
        ids_unicos = df['ID'].unique()
        print(f"\n📋 Análisis de IDs únicos ({len(ids_unicos)}):")
        
        # Contar frecuencia de cada ID
        id_counts = df['ID'].value_counts()
        print("Top 10 IDs más frecuentes:")
        for i, (id_val, count) in enumerate(id_counts.head(10).items()):
            print(f"  {i+1}. ID {id_val}: {count} mensajes")
        
        # Verificar si hay IDs conocidos en el mapeo
        ids_mapeados = 0
        for id_val in ids_unicos:
            if id_val in mapeo_ids:
                ids_mapeados += 1
        
        print(f"\n📊 IDs mapeados: {ids_mapeados}/{len(ids_unicos)} ({ids_mapeados/len(ids_unicos)*100:.1f}%)")
        
        # Mostrar IDs no mapeados
        ids_no_mapeados = [id_val for id_val in ids_unicos if id_val not in mapeo_ids]
        if ids_no_mapeados:
            print(f"\n❌ IDs no mapeados ({len(ids_no_mapeados)}):")
            for i, id_val in enumerate(ids_no_mapeados[:10]):
                print(f"  {i+1}. {id_val}")
            if len(ids_no_mapeados) > 10:
                print(f"  ... y {len(ids_no_mapeados) - 10} más")
    
    # Intentar decodificar algunos mensajes de muestra
    print(f"\n🔧 Intentando decodificar mensajes de muestra...")
    mensajes_decodificados = 0
    mensajes_fallidos = 0
    
    for idx, row in df.head(100).iterrows():  # Probar solo los primeros 100
        try:
            if 'ID' in row and 'Data' in row:
                id_val = row['ID']
                data = row['Data']
                
                # Intentar mapear ID si es necesario
                id_mapeado = mapeo_ids.get(id_val, id_val)
                
                # Buscar mensaje en la base de datos
                mensaje = decodificador.db.get_message_by_frame_id(id_mapeado)
                if mensaje:
                    # Decodificar datos
                    datos_decodificados = mensaje.decode(bytes.fromhex(data.replace(' ', '')))
                    mensajes_decodificados += 1
                else:
                    mensajes_fallidos += 1
        except Exception as e:
            mensajes_fallidos += 1
    
    print(f"📊 Resultados de decodificación de muestra:")
    print(f"  ✅ Mensajes decodificados: {mensajes_decodificados}")
    print(f"  ❌ Mensajes fallidos: {mensajes_fallidos}")
    
    if mensajes_decodificados > 0:
        print("✅ El archivo contiene mensajes decodificables")
        return df  # Retornar el DataFrame original si hay mensajes decodificables
    else:
        print("❌ No se pudieron decodificar mensajes de muestra")
        return None

def main():
    """Función principal de depuración."""
    print("🔍 DEPURADOR DE ARCHIVOS CAN FALLIDOS")
    print("=" * 50)
    
    # Verificar archivos DBC
    decodificador = DecodificadorCAN()
    if not decodificador.verificar_archivos_dbc():
        print("❌ No se pueden encontrar los archivos DBC necesarios.")
        return
    
    # Directorio CMadrid
    directorio_cmadrid = Path(__file__).parent.parent / 'datosDoback' / 'CMadrid'
    
    if not directorio_cmadrid.exists():
        print(f"❌ Directorio CMadrid no encontrado: {directorio_cmadrid}")
        return
    
    # Buscar archivos CAN
    archivos_can = buscar_archivos_can_recursivo(directorio_cmadrid)
    print(f"📁 Archivos CAN encontrados: {len(archivos_can)}")
    
    # Filtrar archivos que no han sido procesados (sin sufijo _TRADUCIDO)
    archivos_sin_procesar = []
    for archivo in archivos_can:
        if '_TRADUCIDO' not in str(archivo):
            archivos_sin_procesar.append(archivo)
    
    print(f"📋 Archivos sin procesar: {len(archivos_sin_procesar)}")
    
    # Analizar algunos archivos de muestra
    archivos_a_analizar = archivos_sin_procesar[:5]  # Analizar solo los primeros 5
    
    print(f"\n🔍 Analizando {len(archivos_a_analizar)} archivos de muestra...")
    
    for archivo in archivos_a_analizar:
        analizar_archivo_fallido(archivo, decodificador)
    
    print(f"\n✅ Análisis completado")

if __name__ == "__main__":
    main()