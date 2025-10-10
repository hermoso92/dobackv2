import pytest
from datetime import datetime
from app.services.telemetry.can_processor import CANProcessor
from app.core.exceptions import ProcessingError

class TestCANProcessor:
    """Pruebas para el procesador de datos CAN."""
    
    @pytest.fixture
    def processor(self):
        """Fixture para crear un procesador CAN."""
        return CANProcessor()
    
    @pytest.fixture
    def sample_data(self):
        """Fixture para crear datos de prueba."""
        return {
            '0x7E8': 3000,  # RPM
            '0x7E9': 100,   # Velocidad
            '0x7EA': 0.5,   # Freno
            '0x7EB': 0.0,   # Dirección
            '0x7EC': 75.0,  # Combustible
            '0x7ED': 12.5,  # Batería
            '0x7EE': 85.0   # Temperatura
        }
    
    def test_process_data_valid(self, processor, sample_data):
        """Prueba el procesamiento de datos CAN válidos."""
        result = processor.process_data(sample_data)
        assert result is not None
        assert 'Engine Data' in result
        assert 'Transmission Data' in result
        assert 'Brake Data' in result
    
    def test_process_data_invalid(self, processor):
        """Prueba el procesamiento de datos CAN inválidos."""
        with pytest.raises(ProcessingError):
            processor.process_data({})
    
    def test_validate_data_valid(self, processor, sample_data):
        """Prueba la validación de datos CAN válidos."""
        assert processor.validate_data(sample_data) is True
    
    def test_validate_data_invalid(self, processor):
        """Prueba la validación de datos CAN inválidos."""
        assert processor.validate_data({}) is False
    
    def test_process_value(self, processor):
        """Prueba el procesamiento de valores individuales."""
        value = 3000
        result = processor._process_value(value)
        assert result == value
    
    def test_handle_error(self, processor):
        """Prueba el manejo de errores."""
        error = Exception("Test error")
        processor.handle_error(error)  # No debería lanzar excepción 