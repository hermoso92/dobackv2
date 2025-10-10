#!/usr/bin/env python3
"""
Script para actualizar el decodificador con el mapeo completo
Generado: 2025-09-12 13:31:07
"""

def actualizar_mapeo_ids():
    """Actualiza el mapeo de IDs en el decodificador."""
    
    # Leer el archivo del decodificador
    with open('decodificador_can_unificado.py', 'r', encoding='utf-8') as f:
        contenido = f.read()
    
    # Generar nuevo mapeo
    nuevo_mapeo = '''
        # Mapeo de IDs de 29 bits a IDs de 11 bits para J1939 (COMPLETO FINAL)
        mapeo_ids = {
            # Valor J1939: 1024 (Engine Data Request)
            0x0C000003: 1024,  # Engine Data Request

            # Valor J1939: 240 (Engine Data Response)
            0x10F0072A: 240,   # Engine Data Response
            0x14FEF100: 240,   # Engine Data Response
            0x18011721: 240,   # Engine Data Response
            0x18011771: 240,   # Engine Data Response
            0x18D0EE17: 240,   # Engine Data Response
            0x18E0FF17: 240,   # Engine Data Response
            0x18E8FFEE: 240,   # Engine Data Response
            0x18EA17F9: 240,   # Engine Data Response
            0x18EAEE27: 240,   # Engine Data Response
            0x18EAFF03: 240,   # Engine Data Response
            0x18EAFF17: 240,   # Engine Data Response
            0x18EBFF10: 240,   # Engine Data Response
            0x18ECFF00: 240,   # Engine Data Response
            0x18ECFF10: 240,   # Engine Data Response
            0x18ECFF29: 240,   # Engine Data Response
            0x18EEFF03: 240,   # Engine Data Response
            0x18EEFF10: 240,   # Engine Data Response
            0x18F00029: 240,   # Engine Data Response
            0x18F00400: 240,   # Engine Data Response
            0x18FD0900: 240,   # Engine Data Response
            0x18FD7C00: 240,   # Engine Data Response
            0x18FD7D17: 240,   # Engine Data Response
            0x18FD9200: 240,   # Engine Data Response
            0x18FDB200: 240,   # Engine Data Response
            0x18FE5600: 240,   # Engine Data Response
            0x18FE700B: 240,   # Engine Data Response
            0x18FEC017: 240,   # Engine Data Response
            0x18FEC1EE: 240,   # Engine Data Response
            0x18FECA00: 240,   # Engine Data Response
            0x18FECA0B: 240,   # Engine Data Response
            0x18FECA21: 240,   # Engine Data Response
            0x18FECA2A: 240,   # Engine Data Response
            0x18FECA45: 240,   # Engine Data Response
            0x18FECA6D: 240,   # Engine Data Response
            0x18FECA71: 240,   # Engine Data Response
            0x18FECA72: 240,   # Engine Data Response
            0x18FECAA0: 240,   # Engine Data Response
            0x18FECAEC: 240,   # Engine Data Response
            0x18FECAED: 240,   # Engine Data Response
            0x18FECAFC: 240,   # Engine Data Response
            0x18FEDF00: 240,   # Engine Data Response
            0x18FEE400: 240,   # Engine Data Response
            0x18FEE500: 240,   # Engine Data Response
            0x18FEE6EE: 240,   # Engine Data Response
            0x18FEE900: 240,   # Engine Data Response
            0x18FEEE00: 240,   # Engine Data Response
            0x18FEEF00: 240,   # Engine Data Response
            0x18FEEF21: 240,   # Engine Data Response
            0x18FEF500: 240,   # Engine Data Response
            0x18FEF521: 240,   # Engine Data Response
            0x18FEF700: 240,   # Engine Data Response
            0x18FEF721: 240,   # Engine Data Response
            0x18FEFF00: 240,   # Engine Data Response
            0x18FF2917: 240,   # Engine Data Response
            0x18FF4072: 240,   # Engine Data Response
            0x1CDEEE17: 240,   # Engine Data Response
            0x1CE8FFEE: 240,   # Engine Data Response
        }'''
    
    # Reemplazar el mapeo en el archivo
    import re
    patron = r'# Mapeo de IDs de 29 bits.*?\n        }'
    contenido_actualizado = re.sub(patron, nuevo_mapeo, contenido, flags=re.DOTALL)
    
    # Guardar archivo actualizado
    with open('decodificador_can_unificado.py', 'w', encoding='utf-8') as f:
        f.write(contenido_actualizado)
    
    print('✅ Decodificador actualizado con mapeo completo')
    print(f'📊 Total IDs mapeados: {len(solicitudes) + len(respuestas)}')
