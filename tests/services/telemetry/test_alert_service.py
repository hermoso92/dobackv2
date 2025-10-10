import pytest
from datetime import datetime
from app.services.telemetry.alert_service import TelemetryAlertService
from app.core.exceptions import AlertError
from app.models import TelemetryAlarm

class TestTelemetryAlertService:
    """Pruebas para el servicio de alertas de telemetría."""
    
    @pytest.fixture
    def service(self):
        """Fixture para crear un servicio de alertas."""
        return TelemetryAlertService()
    
    @pytest.fixture
    def sample_data(self):
        """Fixture para crear datos de prueba."""
        return {
            'speed': 130.0,  # Excede el límite
            'rpm': 4500.0,   # Excede el límite
            'fuel': 5.0,     # Por debajo del límite
            'temperature': 90.0,
            'battery': 12.0,
            'acceleration': 0.3,
            'harsh_braking': -0.4
        }
    
    def test_process_data_valid(self, service, sample_data):
        """Prueba el procesamiento de datos válidos."""
        alerts = service.process_data(sample_data)
        assert len(alerts) == 3  # Debería generar 3 alertas
        assert any(a.type == 'speed' for a in alerts)
        assert any(a.type == 'rpm' for a in alerts)
        assert any(a.type == 'fuel' for a in alerts)
    
    def test_process_data_invalid(self, service):
        """Prueba el procesamiento de datos inválidos."""
        with pytest.raises(AlertError):
            service.process_data({})
    
    def test_validate_data_valid(self, service, sample_data):
        """Prueba la validación de datos válidos."""
        assert service.validate_data(sample_data) is True
    
    def test_validate_data_invalid(self, service):
        """Prueba la validación de datos inválidos."""
        assert service.validate_data({}) is False
    
    def test_create_alert(self, service, sample_data):
        """Prueba la creación de alertas."""
        alert = service._create_alert(
            'speed',
            'Velocidad excesiva',
            'HIGH',
            sample_data
        )
        assert isinstance(alert, TelemetryAlarm)
        assert alert.type == 'speed'
        assert alert.severity == 'HIGH'
        assert alert.data == sample_data
    
    def test_handle_error(self, service):
        """Prueba el manejo de errores."""
        error = Exception("Test error")
        service.handle_error(error)  # No debería lanzar excepción
    
    def test_alert_thresholds(self, service):
        """Prueba los umbrales de alerta."""
        assert service.alert_thresholds['speed'] == 120.0
        assert service.alert_thresholds['rpm'] == 4000.0
        assert service.alert_thresholds['fuel'] == 10.0 