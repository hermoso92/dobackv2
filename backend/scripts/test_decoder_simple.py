#!/usr/bin/env python3
"""
Script simple para diagnosticar problemas con el decodificador CAN
"""

import sys
from pathlib import Path

print("🔍 Diagnóstico del Decodificador CAN")
print("=" * 40)

# 1. Verificar Python
print(f"🐍 Python version: {sys.version}")

# 2. Verificar dependencias
try:
    import cantools
    print(f"✅ cantools version: {cantools.__version__}")
except ImportError as e:
    print(f"❌ cantools no disponible: {e}")

try:
    import pandas as pd
    print(f"✅ pandas version: {pd.__version__}")
except ImportError as e:
    print(f"❌ pandas no disponible: {e}")

# 3. Verificar archivos
decoder_path = Path(__file__).parent.parent / 'data' / 'DECODIFICADOR CAN' / 'decodificador_can_unificado.py'
print(f"📁 Decodificador existe: {decoder_path.exists()}")

if decoder_path.exists():
    print(f"📊 Tamaño: {decoder_path.stat().st_size} bytes")
    
    # 4. Verificar archivos DBC
    dbc_dir = decoder_path.parent
    dbc_files = list(dbc_dir.glob("*.dbc"))
    print(f"📋 Archivos DBC encontrados: {len(dbc_files)}")
    for dbc in dbc_files:
        print(f"   - {dbc.name}")

# 5. Verificar datos de CMadrid
cmadrid_path = Path(__file__).parent.parent / 'data' / 'datosDoback' / 'CMadrid'
print(f"📁 CMadrid existe: {cmadrid_path.exists()}")

if cmadrid_path.exists():
    vehicles = [d for d in cmadrid_path.iterdir() if d.is_dir()]
    print(f"🚗 Vehículos encontrados: {len(vehicles)}")
    for vehicle in vehicles:
        can_dir = vehicle / 'CAN'
        if can_dir.exists():
            can_files = list(can_dir.glob("*.txt"))
            print(f"   - {vehicle.name}: {len(can_files)} archivos CAN")

print("\n✅ Diagnóstico completado") 