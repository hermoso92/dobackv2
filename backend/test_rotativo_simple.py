#!/usr/bin/env python3
"""
Test simplificado para verificar la funcionalidad ROTATIVO.
Solo verifica la carga de datos sin conexión a base de datos.
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
        
        # Mostrar detalles de los datos
        logger.info("   - Detalles de los datos:")
        for i, point in enumerate(rotativo_data):
            logger.info(f"     {i+1}. {point['timestamp']} -> {point['state']}")
        
        return rotativo_data
        
    except Exception as e:
        logger.error(f"❌ Test de carga ROTATIVO: FALLIDO - {e}")
        raise
    finally:
        # Limpiar archivo temporal
        if os.path.exists(test_file):
            os.unlink(test_file)

def test_rotativo_processor_integration():
    """Test de integración con el procesador principal."""
    logger.info("🧪 Iniciando test de integración con procesador...")
    
    try:
        # Inicializar procesador
        processor = DobackProcessor()
        
        # Verificar que el método existe
        assert hasattr(processor, '_load_rotativo_data'), "Método _load_rotativo_data no existe"
        assert hasattr(processor, '_upload_rotativo_data'), "Método _upload_rotativo_data no existe"
        
        # Verificar que es callable
        assert callable(processor._load_rotativo_data), "_load_rotativo_data no es callable"
        assert callable(processor._upload_rotativo_data), "_upload_rotativo_data no es callable"
        
        logger.info("✅ Test de integración con procesador: EXITOSO")
        logger.info("   - Métodos ROTATIVO disponibles en el procesador")
        
    except Exception as e:
        logger.error(f"❌ Test de integración con procesador: FALLIDO - {e}")
        raise

def main():
    """Ejecuta todos los tests de integración ROTATIVO."""
    logger.info("🚀 Iniciando tests de integración ROTATIVO...")
    
    try:
        # Test 1: Carga de datos
        rotativo_data = test_rotativo_loading()
        
        # Test 2: Integración con procesador
        test_rotativo_processor_integration()
        
        logger.info("🎉 Todos los tests de integración ROTATIVO: EXITOSOS")
        
        # Mostrar resumen
        logger.info("\n📊 RESUMEN:")
        logger.info(f"   - Datos ROTATIVO cargados correctamente: {len(rotativo_data)} puntos")
        logger.info("   - Métodos ROTATIVO integrados en el procesador")
        logger.info("   - Sistema listo para procesar archivos ROTATIVO reales")
        logger.info("\n💡 PRÓXIMOS PASOS:")
        logger.info("   - Verificar que la tabla RotativoMeasurement existe en la BD")
        logger.info("   - Probar con archivos ROTATIVO reales del sistema")
        logger.info("   - Validar que el dashboard puede mostrar datos ROTATIVO")
        
    except Exception as e:
        logger.error(f"💥 Error en tests de integración: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 