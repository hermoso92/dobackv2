import pytest
from datetime import datetime
from app.services.telemetry.statistics_service import TelemetryStatisticsService
from app.core.exceptions import StatisticsError
from app.models import TelemetryStatistic

class TestTelemetryStatisticsService:
    """Pruebas para el servicio de estadísticas de telemetría."""
    
    @pytest.fixture
    def service(self):
        """Fixture para crear un servicio de estadísticas."""
        return TelemetryStatisticsService()
    
    @pytest.fixture
    def sample_data(self):
        """Fixture para crear datos de prueba."""
        return [
            {
                'speed': 100.0,
                'rpm': 3000.0,
                'fuel': 75.0
            },
            {
                'speed': 120.0,
                'rpm': 3500.0,
                'fuel': 70.0
            },
            {
                'speed': 80.0,
                'rpm': 2500.0,
                'fuel': 65.0
            }
        ]
    
    def test_process_data_valid(self, service, sample_data):
        """Prueba el procesamiento de datos válidos."""
        stats = service.process_data(sample_data)
        assert isinstance(stats, TelemetryStatistic)
        assert stats.avg_speed == 100.0
        assert stats.max_speed == 120.0
        assert stats.min_speed == 80.0
        assert stats.avg_rpm == 3000.0
        assert stats.max_rpm == 3500.0
        assert stats.min_rpm == 2500.0
    
    def test_process_data_invalid(self, service):
        """Prueba el procesamiento de datos inválidos."""
        with pytest.raises(StatisticsError):
            service.process_data([])
    
    def test_validate_data_valid(self, service, sample_data):
        """Prueba la validación de datos válidos."""
        assert service.validate_data(sample_data) is True
    
    def test_validate_data_invalid(self, service):
        """Prueba la validación de datos inválidos."""
        assert service.validate_data([]) is False
    
    def test_calculate_trends(self, service, sample_data):
        """Prueba el cálculo de tendencias."""
        trends = service.calculate_trends(sample_data)
        assert 'speed_trend' in trends
        assert 'rpm_trend' in trends
        assert 'fuel_trend' in trends
    
    def test_calculate_correlations(self, service, sample_data):
        """Prueba el cálculo de correlaciones."""
        correlations = service.calculate_correlations(sample_data)
        assert 'speed_rpm_correlation' in correlations
        assert 'speed_fuel_correlation' in correlations
        assert 'rpm_fuel_correlation' in correlations
    
    def test_handle_error(self, service):
        """Prueba el manejo de errores."""
        error = Exception("Test error")
        service.handle_error(error)  # No debería lanzar excepción 