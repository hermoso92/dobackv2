#!/bin/bash
# ========================================
# Script: Eliminar referencias CAN del código
# ========================================
# Fecha: 2025-10-22
# Uso: bash scripts/cleanup/eliminar-referencias-can.sh
# ========================================

echo "🧹 Eliminando referencias CAN del sistema..."

# Archivos Python CAN a eliminar
echo "📦 Eliminando archivos Python CAN..."
rm -f backend/models/session/can_data.py
rm -f backend/execute_decoder.py
rm -f backend/INSTRUCCIONES_DECODIFICADOR.md
rm -f backend/scripts/decode_*.py
rm -f backend/scripts/run_decoder_correct.py
rm -f backend/auto_decode_can_cmadrid.py

# Carpeta decodificador CAN
echo "📦 Eliminando carpeta decodificador..."
rm -rf "backend/data/DECODIFICADOR CAN/"

echo "✅ Limpieza CAN completada"
echo "⚠️  IMPORTANTE: Ejecutar búsqueda manual de imports CAN en código TypeScript"
echo "    grep -r 'CanMeasurement' backend/src/"
echo "    grep -r 'canMeasurement' backend/src/"
echo "    grep -r 'can_measurement' backend/src/"

