import pytest
from datetime import datetime, timedelta
from src.app.services.data_persistence import DataPersistence
from src.app.models.stability import StabilityData, StabilityStatistic, CANData, StabilityThreshold
from src.app.services.telemetry import TelemetryService
from src.app.services.stability import StabilityService

@pytest.fixture
def data_persistence():
    """Fixture para crear una instancia de DataPersistence."""
    return DataPersistence()

@pytest.fixture
def telemetry_service():
    """Fixture para crear una instancia de TelemetryService."""
    return TelemetryService()

@pytest.fixture
def stability_service():
    """Fixture para crear una instancia de StabilityService."""
    return StabilityService()

def test_integration_telemetry_stability_persistence(data_persistence, telemetry_service, stability_service):
    """Test de integración entre telemetría, estabilidad y persistencia."""
    # Crear datos de telemetría
    telemetry_data = {
        "timestamp": datetime.now(),
        "speed": 100.0,
        "acceleration_x": 0.1,
        "acceleration_y": 0.2,
        "acceleration_z": 9.81,
        "roll_angle": 5.0,
        "pitch_angle": 2.0
    }
    
    # Procesar telemetría
    can_data = telemetry_service.process_telemetry(telemetry_data)
    
    # Guardar datos CAN
    data_persistence.save_can_data(can_data)
    
    # Procesar estabilidad
    stability_data = stability_service.process_stability(can_data)
    
    # Guardar datos de estabilidad
    data_persistence.save_stability_data(stability_data)
    
    # Verificar datos guardados
    saved_can_data = data_persistence.get_can_data(
        start_time=can_data.timestamp - timedelta(seconds=1),
        end_time=can_data.timestamp + timedelta(seconds=1)
    )
    
    saved_stability_data = data_persistence.get_stability_data(
        start_time=stability_data.timestamp - timedelta(seconds=1),
        end_time=stability_data.timestamp + timedelta(seconds=1)
    )
    
    assert len(saved_can_data) == 1
    assert len(saved_stability_data) == 1
    assert saved_can_data[0].speed == can_data.speed
    assert saved_stability_data[0].ltr == stability_data.ltr
    assert saved_stability_data[0].ssf == stability_data.ssf

def test_integration_threshold_alarms(data_persistence, stability_service):
    """Test de integración entre umbrales y alarmas."""
    # Crear umbrales
    threshold = StabilityThreshold(
        ltr_warning=0.6,
        ltr_critical=0.8,
        ssf_warning=1.0,
        ssf_critical=0.8,
        roll_angle_warning=10.0,
        roll_angle_critical=15.0,
        pitch_angle_warning=5.0,
        pitch_angle_critical=10.0
    )
    
    # Guardar umbrales
    data_persistence.save_stability_threshold(threshold)
    
    # Crear datos que superan los umbrales
    can_data = CANData(
        timestamp=datetime.now(),
        speed=100.0,
        acceleration_x=0.1,
        acceleration_y=0.2,
        acceleration_z=9.81,
        roll_angle=threshold.roll_angle_critical + 1.0,
        pitch_angle=threshold.pitch_angle_critical + 1.0
    )
    
    # Procesar estabilidad
    stability_data = stability_service.process_stability(can_data)
    stability_data.ltr = threshold.ltr_critical + 0.1
    stability_data.ssf = threshold.ssf_critical - 0.1
    
    # Guardar datos de estabilidad
    data_persistence.save_stability_data(stability_data)
    
    # Obtener alarmas
    alarms = data_persistence.get_stability_alarms(
        start_time=stability_data.timestamp - timedelta(seconds=1),
        end_time=stability_data.timestamp + timedelta(seconds=1)
    )
    
    assert len(alarms) == 4
    assert any(alarm.type == "LTR" and alarm.level == "critical" for alarm in alarms)
    assert any(alarm.type == "SSF" and alarm.level == "critical" for alarm in alarms)
    assert any(alarm.type == "ROLL_ANGLE" and alarm.level == "critical" for alarm in alarms)
    assert any(alarm.type == "PITCH_ANGLE" and alarm.level == "critical" for alarm in alarms)

def test_integration_statistics(data_persistence, telemetry_service, stability_service):
    """Test de integración para estadísticas."""
    # Crear múltiples datos de telemetría
    for i in range(5):
        telemetry_data = {
            "timestamp": datetime.now() + timedelta(seconds=i),
            "speed": 100.0 + i,
            "acceleration_x": 0.1 + i * 0.1,
            "acceleration_y": 0.2 + i * 0.1,
            "acceleration_z": 9.81,
            "roll_angle": 5.0 + i,
            "pitch_angle": 2.0 + i
        }
        
        can_data = telemetry_service.process_telemetry(telemetry_data)
        stability_data = stability_service.process_stability(can_data)
        data_persistence.save_stability_data(stability_data)
    
    # Obtener estadísticas
    stats = data_persistence.get_stability_statistics(
        start_time=datetime.now() - timedelta(seconds=1),
        end_time=datetime.now() + timedelta(seconds=5)
    )
    
    assert stats.ltr_mean is not None
    assert stats.ltr_max is not None
    assert stats.ltr_min is not None
    assert stats.ssf_mean is not None
    assert stats.ssf_max is not None
    assert stats.ssf_min is not None
    assert stats.roll_angle_mean is not None
    assert stats.roll_angle_max is not None
    assert stats.roll_angle_min is not None
    assert stats.pitch_angle_mean is not None
    assert stats.pitch_angle_max is not None
    assert stats.pitch_angle_min is not None
    assert stats.speed_mean is not None
    assert stats.speed_max is not None
    assert stats.speed_min is not None

def test_integration_cleanup(data_persistence, telemetry_service, stability_service):
    """Test de integración para limpieza de datos."""
    # Crear datos antiguos
    old_time = datetime.now() - timedelta(days=2)
    telemetry_data = {
        "timestamp": old_time,
        "speed": 100.0,
        "acceleration_x": 0.1,
        "acceleration_y": 0.2,
        "acceleration_z": 9.81,
        "roll_angle": 5.0,
        "pitch_angle": 2.0
    }
    
    can_data = telemetry_service.process_telemetry(telemetry_data)
    stability_data = stability_service.process_stability(can_data)
    
    data_persistence.save_can_data(can_data)
    data_persistence.save_stability_data(stability_data)
    
    # Crear datos recientes
    recent_time = datetime.now()
    telemetry_data["timestamp"] = recent_time
    can_data = telemetry_service.process_telemetry(telemetry_data)
    stability_data = stability_service.process_stability(can_data)
    
    data_persistence.save_can_data(can_data)
    data_persistence.save_stability_data(stability_data)
    
    # Limpiar datos antiguos
    data_persistence.cleanup_old_data(days=1)
    
    # Verificar que solo quedan los datos recientes
    saved_can_data = data_persistence.get_can_data(
        start_time=datetime.now() - timedelta(days=1),
        end_time=datetime.now()
    )
    
    saved_stability_data = data_persistence.get_stability_data(
        start_time=datetime.now() - timedelta(days=1),
        end_time=datetime.now()
    )
    
    assert len(saved_can_data) == 1
    assert len(saved_stability_data) == 1
    assert saved_can_data[0].timestamp == recent_time
    assert saved_stability_data[0].timestamp == recent_time 