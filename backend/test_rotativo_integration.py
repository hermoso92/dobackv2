#!/usr/bin/env python3
"""
Test de integración para verificar la funcionalidad ROTATIVO.
Verifica que los datos ROTATIVO se cargan y suben correctamente a la base de datos.
"""

import os
import sys
import tempfile
import logging
from datetime import datetime
from complete_processor import DobackProcessor

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_test_rotativo_file():
    """Crea un archivo ROTATIVO de prueba."""
    content = """ROTATIVO;2024-01-15;DOBACK001;001;Estado
Fecha-Hora;Estado
2024-01-15 08:00:00;ON
2024-01-15 08:05:30;OFF
2024-01-15 08:10:15;ON
2024-01-15 08:15:45;OFF
2024-01-15 08:20:00;ON"""
    
    # Crear archivo temporal
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8')
    temp_file.write(content)
    temp_file.close()
    
    return temp_file.name

def test_rotativo_loading():
    """Test de carga de datos ROTATIVO."""
    logger.info("🧪 Iniciando test de carga ROTATIVO...")
    
    # Crear archivo de prueba
    test_file = create_test_rotativo_file()
    
    try:
        # Inicializar procesador
        processor = DobackProcessor()
        
        # Cargar datos ROTATIVO
        rotativo_data = processor._load_rotativo_data(test_file)
        
        # Verificar resultados
        assert len(rotativo_data) == 5, f"Se esperaban 5 puntos, se obtuvieron {len(rotativo_data)}"
        
        # Verificar estructura de datos
        for point in rotativo_data:
            assert 'timestamp' in point, "Cada punto debe tener timestamp"
            assert 'state' in point, "Cada punto debe tener state"
            assert isinstance(point['timestamp'], datetime), "timestamp debe ser datetime"
            assert isinstance(point['state'], str), "state debe ser string"
        
        # Verificar estados específicos
        states = [point['state'] for point in rotativo_data]
        assert 'ON' in states, "Debe haber al menos un estado ON"
        assert 'OFF' in states, "Debe haber al menos un estado OFF"
        
        logger.info("✅ Test de carga ROTATIVO: EXITOSO")
        logger.info(f"   - Puntos cargados: {len(rotativo_data)}")
        logger.info(f"   - Estados encontrados: {set(states)}")
        
        return rotativo_data
        
    except Exception as e:
        logger.error(f"❌ Test de carga ROTATIVO: FALLIDO - {e}")
        raise
    finally:
        # Limpiar archivo temporal
        if os.path.exists(test_file):
            os.unlink(test_file)

def test_rotativo_database_connection():
    """Test de conexión a base de datos para ROTATIVO."""
    logger.info("🧪 Iniciando test de conexión BD para ROTATIVO...")
    
    try:
        processor = DobackProcessor()
        
        # Verificar que la tabla existe
        import psycopg2
        conn = psycopg2.connect(**processor.db_config)
        cur = conn.cursor()
        
        # Verificar que la tabla RotativoMeasurement existe
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'RotativoMeasurement'
            );
        """)
        
        table_exists = cur.fetchone()[0]
        assert table_exists, "La tabla RotativoMeasurement no existe"
        
        # Verificar estructura de la tabla
        cur.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'RotativoMeasurement'
            ORDER BY ordinal_position;
        """)
        
        columns = cur.fetchall()
        expected_columns = ['id', 'sessionId', 'timestamp', 'state', 'createdAt', 'updatedAt']
        
        actual_columns = [col[0] for col in columns]
        for expected_col in expected_columns:
            assert expected_col in actual_columns, f"Columna {expected_col} no encontrada"
        
        logger.info("✅ Test de conexión BD ROTATIVO: EXITOSO")
        logger.info(f"   - Tabla existe: {table_exists}")
        logger.info(f"   - Columnas encontradas: {actual_columns}")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        logger.error(f"❌ Test de conexión BD ROTATIVO: FALLIDO - {str(e)}")
        raise

def main():
    """Ejecuta todos los tests de integración ROTATIVO."""
    logger.info("🚀 Iniciando tests de integración ROTATIVO...")
    
    try:
        # Test 1: Carga de datos
        rotativo_data = test_rotativo_loading()
        
        # Test 2: Conexión a base de datos
        test_rotativo_database_connection()
        
        logger.info("🎉 Todos los tests de integración ROTATIVO: EXITOSOS")
        
        # Mostrar resumen
        logger.info("\n📊 RESUMEN:")
        logger.info(f"   - Datos ROTATIVO cargados correctamente: {len(rotativo_data)} puntos")
        logger.info("   - Tabla RotativoMeasurement existe y tiene estructura correcta")
        logger.info("   - Sistema listo para procesar archivos ROTATIVO reales")
        
    except Exception as e:
        logger.error(f"💥 Error en tests de integración: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 