#!/usr/bin/env python3
"""
Script para verificar qué IDs están disponibles en el DBC J1939
"""

import cantools
import os

def verificar_dbc():
    """Verifica qué IDs están disponibles en el DBC J1939."""
    
    # Cargar el DBC
    dbc_file = 'CSS-Electronics-SAE-J1939-2019-07_v1.0.dbc'
    
    if not os.path.exists(dbc_file):
        print(f"❌ No se encontró el archivo DBC: {dbc_file}")
        return
    
    try:
        db = cantools.database.load_file(dbc_file)
        print(f"✅ DBC cargado exitosamente: {dbc_file}")
        print(f"📊 Total de mensajes en el DBC: {len(db.messages)}")
        
        # Mostrar algunos mensajes de ejemplo
        print("\n📋 Primeros 10 mensajes del DBC:")
        for i, msg in enumerate(db.messages[:10]):
            print(f"  {i+1}. ID: 0x{msg.frame_id:03X} ({msg.frame_id}) - {msg.name}")
        
        # Buscar IDs específicos que aparecen en los archivos CAN
        ids_buscar = [0xCF00400, 0x18FEF100]
        print(f"\n🔍 Buscando IDs específicos:")
        
        for id_can in ids_buscar:
            try:
                mensaje = db.get_message_by_frame_id(id_can)
                if mensaje:
                    print(f"  ✅ ID 0x{id_can:X} ({id_can}) encontrado: {mensaje.name}")
                else:
                    print(f"  ❌ ID 0x{id_can:X} ({id_can}) NO encontrado en el DBC")
            except KeyError:
                print(f"  ❌ ID 0x{id_can:X} ({id_can}) NO encontrado en el DBC")
        
        # Mostrar IDs similares (que empiecen con 0xCF o 0x18)
        print(f"\n🔍 IDs similares en el DBC:")
        ids_similares = []
        for msg in db.messages:
            if msg.frame_id & 0xFF000000 == 0xCF000000 or msg.frame_id & 0xFF000000 == 0x18000000:
                ids_similares.append((msg.frame_id, msg.name))
        
        if ids_similares:
            print("  IDs que empiezan con 0xCF o 0x18:")
            for id_can, nombre in ids_similares[:10]:  # Mostrar solo los primeros 10
                print(f"    - 0x{id_can:X} ({id_can}): {nombre}")
        else:
            print("  No se encontraron IDs similares")
            
    except Exception as e:
        print(f"❌ Error al cargar el DBC: {e}")

if __name__ == "__main__":
    verificar_dbc()
    input("\nPresiona ENTER para salir...") 