import pytest
from datetime import datetime, timedelta
from app.services.data_persistence import DataPersistence
from app.models.stability import StabilityData, StabilityStatistic, CANData, StabilityThreshold

@pytest.fixture
def data_persistence():
    """Fixture para crear una instancia de DataPersistence."""
    return DataPersistence()

@pytest.fixture
def sample_stability_data():
    """Fixture para crear datos de estabilidad de ejemplo."""
    return StabilityData(
        timestamp=datetime.now(),
        ltr=0.5,
        ssf=1.2,
        roll_angle=5.0,
        pitch_angle=2.0,
        speed=100.0,
        acceleration_x=0.1,
        acceleration_y=0.2,
        acceleration_z=9.81
    )

@pytest.fixture
def sample_can_data():
    """Fixture para crear datos CAN de ejemplo."""
    return CANData(
        timestamp=datetime.now(),
        speed=100.0,
        acceleration_x=0.1,
        acceleration_y=0.2,
        acceleration_z=9.81,
        roll_angle=5.0,
        pitch_angle=2.0
    )

@pytest.fixture
def sample_stability_threshold():
    """Fixture para crear umbrales de estabilidad de ejemplo."""
    return StabilityThreshold(
        ltr_warning=0.6,
        ltr_critical=0.8,
        ssf_warning=1.0,
        ssf_critical=0.8,
        roll_angle_warning=10.0,
        roll_angle_critical=15.0,
        pitch_angle_warning=5.0,
        pitch_angle_critical=10.0
    )

def test_save_stability_data(data_persistence, sample_stability_data):
    """Test para guardar datos de estabilidad."""
    # Guardar datos
    data_persistence.save_stability_data(sample_stability_data)
    
    # Verificar que se guardó correctamente
    saved_data = data_persistence.get_stability_data(
        start_time=sample_stability_data.timestamp - timedelta(seconds=1),
        end_time=sample_stability_data.timestamp + timedelta(seconds=1)
    )
    
    assert len(saved_data) == 1
    assert saved_data[0].ltr == sample_stability_data.ltr
    assert saved_data[0].ssf == sample_stability_data.ssf
    assert saved_data[0].roll_angle == sample_stability_data.roll_angle
    assert saved_data[0].pitch_angle == sample_stability_data.pitch_angle
    assert saved_data[0].speed == sample_stability_data.speed

def test_save_can_data(data_persistence, sample_can_data):
    """Test para guardar datos CAN."""
    # Guardar datos
    data_persistence.save_can_data(sample_can_data)
    
    # Verificar que se guardó correctamente
    saved_data = data_persistence.get_can_data(
        start_time=sample_can_data.timestamp - timedelta(seconds=1),
        end_time=sample_can_data.timestamp + timedelta(seconds=1)
    )
    
    assert len(saved_data) == 1
    assert saved_data[0].speed == sample_can_data.speed
    assert saved_data[0].acceleration_x == sample_can_data.acceleration_x
    assert saved_data[0].acceleration_y == sample_can_data.acceleration_y
    assert saved_data[0].acceleration_z == sample_can_data.acceleration_z
    assert saved_data[0].roll_angle == sample_can_data.roll_angle
    assert saved_data[0].pitch_angle == sample_can_data.pitch_angle

def test_save_stability_threshold(data_persistence, sample_stability_threshold):
    """Test para guardar umbrales de estabilidad."""
    # Guardar umbrales
    data_persistence.save_stability_threshold(sample_stability_threshold)
    
    # Verificar que se guardó correctamente
    saved_threshold = data_persistence.get_stability_threshold()
    
    assert saved_threshold.ltr_warning == sample_stability_threshold.ltr_warning
    assert saved_threshold.ltr_critical == sample_stability_threshold.ltr_critical
    assert saved_threshold.ssf_warning == sample_stability_threshold.ssf_warning
    assert saved_threshold.ssf_critical == sample_stability_threshold.ssf_critical
    assert saved_threshold.roll_angle_warning == sample_stability_threshold.roll_angle_warning
    assert saved_threshold.roll_angle_critical == sample_stability_threshold.roll_angle_critical
    assert saved_threshold.pitch_angle_warning == sample_stability_threshold.pitch_angle_warning
    assert saved_threshold.pitch_angle_critical == sample_stability_threshold.pitch_angle_critical

def test_cleanup_old_data(data_persistence, sample_stability_data, sample_can_data):
    """Test para limpiar datos antiguos."""
    # Guardar datos
    data_persistence.save_stability_data(sample_stability_data)
    data_persistence.save_can_data(sample_can_data)
    
    # Limpiar datos antiguos
    data_persistence.cleanup_old_data(days=0)
    
    # Verificar que se limpiaron los datos
    stability_data = data_persistence.get_stability_data(
        start_time=datetime.now() - timedelta(days=1),
        end_time=datetime.now()
    )
    can_data = data_persistence.get_can_data(
        start_time=datetime.now() - timedelta(days=1),
        end_time=datetime.now()
    )
    
    assert len(stability_data) == 0
    assert len(can_data) == 0

def test_get_stability_statistics(data_persistence, sample_stability_data):
    """Test para obtener estadísticas de estabilidad."""
    # Guardar datos
    data_persistence.save_stability_data(sample_stability_data)
    
    # Obtener estadísticas
    stats = data_persistence.get_stability_statistics(
        start_time=sample_stability_data.timestamp - timedelta(seconds=1),
        end_time=sample_stability_data.timestamp + timedelta(seconds=1)
    )
    
    assert stats.ltr_mean == sample_stability_data.ltr
    assert stats.ltr_max == sample_stability_data.ltr
    assert stats.ltr_min == sample_stability_data.ltr
    assert stats.ssf_mean == sample_stability_data.ssf
    assert stats.ssf_max == sample_stability_data.ssf
    assert stats.ssf_min == sample_stability_data.ssf
    assert stats.roll_angle_mean == sample_stability_data.roll_angle
    assert stats.roll_angle_max == sample_stability_data.roll_angle
    assert stats.roll_angle_min == sample_stability_data.roll_angle
    assert stats.pitch_angle_mean == sample_stability_data.pitch_angle
    assert stats.pitch_angle_max == sample_stability_data.pitch_angle
    assert stats.pitch_angle_min == sample_stability_data.pitch_angle
    assert stats.speed_mean == sample_stability_data.speed
    assert stats.speed_max == sample_stability_data.speed
    assert stats.speed_min == sample_stability_data.speed

def test_get_stability_alarms(data_persistence, sample_stability_data, sample_stability_threshold):
    """Test para obtener alarmas de estabilidad."""
    # Guardar umbrales
    data_persistence.save_stability_threshold(sample_stability_threshold)
    
    # Guardar datos con valores que superan los umbrales
    sample_stability_data.ltr = sample_stability_threshold.ltr_critical + 0.1
    sample_stability_data.ssf = sample_stability_threshold.ssf_critical - 0.1
    sample_stability_data.roll_angle = sample_stability_threshold.roll_angle_critical + 1.0
    sample_stability_data.pitch_angle = sample_stability_threshold.pitch_angle_critical + 1.0
    
    data_persistence.save_stability_data(sample_stability_data)
    
    # Obtener alarmas
    alarms = data_persistence.get_stability_alarms(
        start_time=sample_stability_data.timestamp - timedelta(seconds=1),
        end_time=sample_stability_data.timestamp + timedelta(seconds=1)
    )
    
    assert len(alarms) == 4
    assert any(alarm.type == "LTR" and alarm.level == "critical" for alarm in alarms)
    assert any(alarm.type == "SSF" and alarm.level == "critical" for alarm in alarms)
    assert any(alarm.type == "ROLL_ANGLE" and alarm.level == "critical" for alarm in alarms)
    assert any(alarm.type == "PITCH_ANGLE" and alarm.level == "critical" for alarm in alarms) 