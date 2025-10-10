import pytest
import asyncio
from datetime import datetime, timedelta
from src.app.services.system_integrator import SystemIntegrator
from src.app.exceptions import ValidationError

@pytest.fixture
def config():
    return {
        'validation_rules': {
            'acceleration': {'min': -20, 'max': 20},
            'speed': {'min': 0, 'max': 200}
        },
        'stability_config': {
            'ltr_threshold': 0.6,
            'ssf_threshold': 1.0
        },
        'min_processing_rate': 10,
        'max_processing_delay': 5,
        'monitor_interval': 0.1,
        'cleanup_interval': 0.1,
        'data_retention_days': 30
    }

@pytest.fixture
async def integrator(config):
    integrator = SystemIntegrator(config)
    await integrator.start()
    yield integrator
    await integrator.stop()

@pytest.mark.asyncio
async def test_system_start_stop(integrator):
    """Test de inicio y detención del sistema."""
    assert integrator.is_running
    await integrator.stop()
    assert not integrator.is_running

@pytest.mark.asyncio
async def test_telemetry_processing(integrator):
    """Test de procesamiento de telemetría."""
    # Datos de telemetría válidos
    telemetry_data = {
        'acceleration_x': 1.0,
        'acceleration_y': 0.5,
        'acceleration_z': 9.81,
        'speed': 100
    }
    
    # Procesar telemetría
    result = await integrator.process_telemetry(telemetry_data)
    
    assert result is not None
    assert integrator.last_processed is not None
    assert integrator.processing_rate > 0

@pytest.mark.asyncio
async def test_alarm_processing(integrator):
    """Test de procesamiento de alarmas."""
    # Datos de alarma
    alarm_data = {
        'type': 'LTR',
        'level': 'warning',
        'value': 0.7,
        'threshold': 0.6
    }
    
    # Procesar alarma
    await integrator.process_alarm(alarm_data)
    
    # Verificar que la alarma fue procesada
    status = integrator.get_system_status()
    assert status['is_running']

@pytest.mark.asyncio
async def test_callback_registration(integrator):
    """Test de registro y ejecución de callbacks."""
    # Callbacks
    telemetry_callback_called = False
    alarm_callback_called = False
    
    async def telemetry_callback(data):
        nonlocal telemetry_callback_called
        telemetry_callback_called = True
    
    async def alarm_callback(data):
        nonlocal alarm_callback_called
        alarm_callback_called = True
    
    # Registrar callbacks
    integrator.register_telemetry_callback(telemetry_callback)
    integrator.register_alarm_callback(alarm_callback)
    
    # Procesar datos
    await integrator.process_telemetry({
        'acceleration_x': 1.0,
        'acceleration_y': 0.5,
        'acceleration_z': 9.81,
        'speed': 100
    })
    
    await integrator.process_alarm({
        'type': 'LTR',
        'level': 'warning',
        'value': 0.7,
        'threshold': 0.6
    })
    
    # Verificar que los callbacks fueron llamados
    assert telemetry_callback_called
    assert alarm_callback_called

@pytest.mark.asyncio
async def test_system_monitoring(integrator):
    """Test del sistema de monitoreo."""
    # Esperar a que el monitor detecte el procesamiento
    await asyncio.sleep(0.2)
    
    # Verificar estado del sistema
    status = integrator.get_system_status()
    assert status['is_running']
    assert status['processing_rate'] >= 0
    assert status['last_processed'] is not None
    assert status['alarm_callbacks'] >= 0
    assert status['telemetry_callbacks'] >= 0

@pytest.mark.asyncio
async def test_error_handling(integrator):
    """Test de manejo de errores."""
    # Datos inválidos
    invalid_data = {
        'acceleration_x': 100,  # Fuera de rango
        'acceleration_y': 0.5,
        'acceleration_z': 9.81,
        'speed': 100
    }
    
    # Intentar procesar datos inválidos
    with pytest.raises(ValidationError):
        await integrator.process_telemetry(invalid_data)
    
    # Verificar que el sistema sigue funcionando
    assert integrator.is_running
    status = integrator.get_system_status()
    assert status['is_running']

@pytest.mark.asyncio
async def test_processing_rate_monitoring(integrator):
    """Test de monitoreo de tasa de procesamiento."""
    # Configurar tasa de procesamiento baja
    integrator.processing_rate = 5  # Por debajo del mínimo configurado
    
    # Esperar a que el monitor detecte la tasa baja
    await asyncio.sleep(0.2)
    
    # Verificar que el sistema sigue funcionando
    assert integrator.is_running
    status = integrator.get_system_status()
    assert status['is_running']

@pytest.mark.asyncio
async def test_processing_delay_monitoring(integrator):
    """Test de monitoreo de retraso en procesamiento."""
    # Simular retraso en procesamiento
    integrator.last_processed = datetime.now() - timedelta(seconds=10)
    
    # Esperar a que el monitor detecte el retraso
    await asyncio.sleep(0.2)
    
    # Verificar que el sistema sigue funcionando
    assert integrator.is_running
    status = integrator.get_system_status()
    assert status['is_running']

@pytest.mark.asyncio
async def test_data_cleanup(integrator):
    """Test de limpieza de datos antiguos."""
    # Esperar a que se ejecute la limpieza
    await asyncio.sleep(0.2)
    
    # Verificar que el sistema sigue funcionando
    assert integrator.is_running
    status = integrator.get_system_status()
    assert status['is_running']

@pytest.mark.asyncio
async def test_concurrent_processing(integrator):
    """Test de procesamiento concurrente."""
    # Crear múltiples tareas de procesamiento
    tasks = []
    for _ in range(5):
        tasks.append(integrator.process_telemetry({
            'acceleration_x': 1.0,
            'acceleration_y': 0.5,
            'acceleration_z': 9.81,
            'speed': 100
        }))
    
    # Ejecutar tareas concurrentemente
    results = await asyncio.gather(*tasks)
    
    # Verificar resultados
    assert all(result is not None for result in results)
    assert integrator.is_running
    status = integrator.get_system_status()
    assert status['is_running']

@pytest.mark.asyncio
async def test_multiple_alarm_types(integrator):
    """Test de procesamiento de diferentes tipos de alarmas."""
    alarm_types = ['LTR', 'SSF', 'ROLLOVER']
    alarm_levels = ['warning', 'critical']
    
    for alarm_type in alarm_types:
        for level in alarm_levels:
            alarm_data = {
                'type': alarm_type,
                'level': level,
                'value': 0.7,
                'threshold': 0.6
            }
            await integrator.process_alarm(alarm_data)
    
    # Verificar que el sistema sigue funcionando
    assert integrator.is_running
    status = integrator.get_system_status()
    assert status['is_running']

@pytest.mark.asyncio
async def test_telemetry_validation_rules(integrator):
    """Test de reglas de validación de telemetría."""
    test_cases = [
        # Caso válido
        {
            'acceleration_x': 1.0,
            'acceleration_y': 0.5,
            'acceleration_z': 9.81,
            'speed': 100
        },
        # Caso inválido: aceleración fuera de rango
        {
            'acceleration_x': 100,
            'acceleration_y': 0.5,
            'acceleration_z': 9.81,
            'speed': 100
        },
        # Caso inválido: velocidad negativa
        {
            'acceleration_x': 1.0,
            'acceleration_y': 0.5,
            'acceleration_z': 9.81,
            'speed': -10
        }
    ]
    
    for i, test_case in enumerate(test_cases):
        if i == 0:
            # Caso válido
            result = await integrator.process_telemetry(test_case)
            assert result is not None
        else:
            # Casos inválidos
            with pytest.raises(ValidationError):
                await integrator.process_telemetry(test_case)

@pytest.mark.asyncio
async def test_callback_error_handling(integrator):
    """Test de manejo de errores en callbacks."""
    error_occurred = False
    
    async def error_callback(data):
        nonlocal error_occurred
        error_occurred = True
        raise Exception("Error en callback")
    
    # Registrar callback con error
    integrator.register_telemetry_callback(error_callback)
    
    # Procesar telemetría
    await integrator.process_telemetry({
        'acceleration_x': 1.0,
        'acceleration_y': 0.5,
        'acceleration_z': 9.81,
        'speed': 100
    })
    
    # Verificar que el error fue manejado
    assert error_occurred
    assert integrator.is_running
    status = integrator.get_system_status()
    assert status['is_running']

@pytest.mark.asyncio
async def test_system_restart(integrator):
    """Test de reinicio del sistema."""
    # Detener sistema
    await integrator.stop()
    assert not integrator.is_running
    
    # Reiniciar sistema
    await integrator.start()
    assert integrator.is_running
    
    # Verificar estado
    status = integrator.get_system_status()
    assert status['is_running']
    assert status['processing_rate'] >= 0
    assert status['last_processed'] is not None

@pytest.mark.asyncio
async def test_cleanup_interval(integrator):
    """Test de intervalo de limpieza de datos."""
    # Configurar intervalo corto para testing
    integrator.config['cleanup_interval'] = 0.1
    
    # Esperar múltiples ciclos de limpieza
    for _ in range(3):
        await asyncio.sleep(0.2)
        assert integrator.is_running
    
    # Verificar estado final
    status = integrator.get_system_status()
    assert status['is_running']

@pytest.mark.asyncio
async def test_monitor_interval(integrator):
    """Test de intervalo de monitoreo."""
    # Configurar intervalo corto para testing
    integrator.config['monitor_interval'] = 0.1
    
    # Esperar múltiples ciclos de monitoreo
    for _ in range(3):
        await asyncio.sleep(0.2)
        assert integrator.is_running
    
    # Verificar estado final
    status = integrator.get_system_status()
    assert status['is_running']

@pytest.mark.asyncio
async def test_system_under_load(integrator):
    """Test del sistema bajo carga."""
    # Crear múltiples tareas de procesamiento
    tasks = []
    for _ in range(20):  # Aumentar carga
        tasks.append(integrator.process_telemetry({
            'acceleration_x': 1.0,
            'acceleration_y': 0.5,
            'acceleration_z': 9.81,
            'speed': 100
        }))
        tasks.append(integrator.process_alarm({
            'type': 'LTR',
            'level': 'warning',
            'value': 0.7,
            'threshold': 0.6
        }))
    
    # Ejecutar tareas concurrentemente
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Verificar resultados
    assert all(result is not None for result in results if not isinstance(result, Exception))
    assert integrator.is_running
    status = integrator.get_system_status()
    assert status['is_running'] 