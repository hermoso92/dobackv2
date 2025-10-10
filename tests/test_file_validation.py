import os
import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from src.automation.validations.file_validation import (
    validate_file_exists,
    validate_telemetry_file,
    validate_stability_file,
    validate_file_metadata,
    FileValidationError
)

# Fixtures para archivos de prueba
@pytest.fixture
def temp_telemetry_file(tmp_path):
    """Fixture que crea un archivo de telemetría temporal válido"""
    file_path = tmp_path / "telemetry.csv"
    
    # Crear datos de telemetría válidos
    data = {
        'timestamp': pd.date_range(start='2024-01-01', periods=10, freq='1min'),
        'vehicle_id': ['VEH001'] * 10,
        'latitude': np.linspace(-90, 90, 10),
        'longitude': np.linspace(-180, 180, 10),
        'speed': np.linspace(0, 100, 10),
        'heading': np.linspace(0, 360, 10),
        'altitude': np.linspace(0, 1000, 10),
        'engine_status': ['ON', 'OFF'] * 5
    }
    
    df = pd.DataFrame(data)
    df.to_csv(file_path, index=False)
    return str(file_path)

@pytest.fixture
def temp_stability_file(tmp_path):
    """Fixture que crea un archivo de estabilidad temporal válido"""
    file_path = tmp_path / "stability.csv"
    
    # Crear datos de estabilidad válidos
    data = {
        'timestamp': pd.date_range(start='2024-01-01', periods=10, freq='1min'),
        'vehicle_id': ['VEH001'] * 10,
        'roll': np.linspace(-180, 180, 10),
        'pitch': np.linspace(-180, 180, 10),
        'yaw': np.linspace(-180, 180, 10),
        'acceleration_x': np.linspace(-98, 98, 10),
        'acceleration_y': np.linspace(-98, 98, 10),
        'acceleration_z': np.linspace(-98, 98, 10),
        'gyro_x': np.linspace(-1000, 1000, 10),
        'gyro_y': np.linspace(-1000, 1000, 10),
        'gyro_z': np.linspace(-1000, 1000, 10),
        'stability_index': np.linspace(0, 100, 10)
    }
    
    df = pd.DataFrame(data)
    df.to_csv(file_path, index=False)
    return str(file_path)

# Tests para validate_file_exists
def test_validate_file_exists_success(temp_telemetry_file):
    """Test para validar un archivo existente"""
    success, messages = validate_file_exists(temp_telemetry_file)
    assert success
    assert "validado correctamente" in messages[0]

def test_validate_file_exists_nonexistent():
    """Test para validar un archivo inexistente"""
    success, messages = validate_file_exists("nonexistent.csv")
    assert not success
    assert "no existe" in messages[0]

def test_validate_file_exists_no_permissions(tmp_path):
    """Test para validar un archivo sin permisos"""
    file_path = tmp_path / "no_permissions.csv"
    file_path.touch()
    os.chmod(file_path, 0o000)
    
    success, messages = validate_file_exists(str(file_path))
    assert not success
    assert "No hay permisos de lectura" in messages[0]

# Tests para validate_telemetry_file
def test_validate_telemetry_file_success(temp_telemetry_file):
    """Test para validar un archivo de telemetría válido"""
    success, messages = validate_telemetry_file(temp_telemetry_file)
    assert success
    assert "validado correctamente" in messages[-1]

def test_validate_telemetry_file_missing_columns(tmp_path):
    """Test para validar un archivo de telemetría con columnas faltantes"""
    file_path = tmp_path / "invalid_telemetry.csv"
    df = pd.DataFrame({'timestamp': ['2024-01-01']})
    df.to_csv(file_path, index=False)
    
    success, messages = validate_telemetry_file(str(file_path))
    assert not success
    assert "Faltan columnas requeridas" in messages[0]

def test_validate_telemetry_file_invalid_data(tmp_path):
    """Test para validar un archivo de telemetría con datos inválidos"""
    file_path = tmp_path / "invalid_telemetry.csv"
    data = {
        'timestamp': ['invalid_date'] * 10,
        'vehicle_id': ['VEH001'] * 10,
        'latitude': [200] * 10,  # Fuera de rango
        'longitude': [200] * 10,  # Fuera de rango
        'speed': [-1] * 10,  # Negativo
        'heading': [400] * 10,  # Fuera de rango
        'altitude': ['invalid'] * 10,
        'engine_status': ['INVALID'] * 10
    }
    df = pd.DataFrame(data)
    df.to_csv(file_path, index=False)
    
    success, messages = validate_telemetry_file(str(file_path))
    assert not success
    assert any("contiene valores inválidos" in msg for msg in messages)

# Tests para validate_stability_file
def test_validate_stability_file_success(temp_stability_file):
    """Test para validar un archivo de estabilidad válido"""
    success, messages = validate_stability_file(temp_stability_file)
    assert success
    assert "validado correctamente" in messages[-1]

def test_validate_stability_file_missing_columns(tmp_path):
    """Test para validar un archivo de estabilidad con columnas faltantes"""
    file_path = tmp_path / "invalid_stability.csv"
    df = pd.DataFrame({'timestamp': ['2024-01-01']})
    df.to_csv(file_path, index=False)
    
    success, messages = validate_stability_file(str(file_path))
    assert not success
    assert "Faltan columnas requeridas" in messages[0]

def test_validate_stability_file_invalid_data(tmp_path):
    """Test para validar un archivo de estabilidad con datos inválidos"""
    file_path = tmp_path / "invalid_stability.csv"
    data = {
        'timestamp': ['invalid_date'] * 10,
        'vehicle_id': ['VEH001'] * 10,
        'roll': [200] * 10,  # Fuera de rango
        'pitch': [200] * 10,  # Fuera de rango
        'yaw': [200] * 10,  # Fuera de rango
        'acceleration_x': [100] * 10,  # Fuera de rango
        'acceleration_y': [100] * 10,  # Fuera de rango
        'acceleration_z': [100] * 10,  # Fuera de rango
        'gyro_x': [2000] * 10,  # Fuera de rango
        'gyro_y': [2000] * 10,  # Fuera de rango
        'gyro_z': [2000] * 10,  # Fuera de rango
        'stability_index': [200] * 10  # Fuera de rango
    }
    df = pd.DataFrame(data)
    df.to_csv(file_path, index=False)
    
    success, messages = validate_stability_file(str(file_path))
    assert not success
    assert any("contiene valores fuera de rango" in msg for msg in messages)

# Tests para validate_file_metadata
def test_validate_file_metadata_success(temp_telemetry_file):
    """Test para validar metadatos válidos"""
    metadata = {
        'file_type': 'telemetry',
        'version': '1.0',
        'company_id': 'COMP001',
        'vehicle_id': 'VEH001',
        'start_date': '2024-01-01T00:00:00',
        'end_date': '2024-01-01T00:10:00',
        'record_count': 10
    }
    
    success, messages = validate_file_metadata(temp_telemetry_file, metadata)
    assert success
    assert "validados correctamente" in messages[-1]

def test_validate_file_metadata_missing_fields(temp_telemetry_file):
    """Test para validar metadatos con campos faltantes"""
    metadata = {
        'file_type': 'telemetry',
        'version': '1.0'
    }
    
    success, messages = validate_file_metadata(temp_telemetry_file, metadata)
    assert not success
    assert "Faltan campos requeridos" in messages[0]

def test_validate_file_metadata_invalid_type(temp_telemetry_file):
    """Test para validar metadatos con tipo de archivo inválido"""
    metadata = {
        'file_type': 'invalid',
        'version': '1.0',
        'company_id': 'COMP001',
        'vehicle_id': 'VEH001',
        'start_date': '2024-01-01T00:00:00',
        'end_date': '2024-01-01T00:10:00',
        'record_count': 10
    }
    
    success, messages = validate_file_metadata(temp_telemetry_file, metadata)
    assert not success
    assert "Tipo de archivo inválido" in messages[0]

def test_validate_file_metadata_invalid_dates(temp_telemetry_file):
    """Test para validar metadatos con fechas inválidas"""
    metadata = {
        'file_type': 'telemetry',
        'version': '1.0',
        'company_id': 'COMP001',
        'vehicle_id': 'VEH001',
        'start_date': '2024-01-01T00:10:00',  # Fecha posterior
        'end_date': '2024-01-01T00:00:00',    # Fecha anterior
        'record_count': 10
    }
    
    success, messages = validate_file_metadata(temp_telemetry_file, metadata)
    assert not success
    assert "fecha de fin es anterior" in messages[0]

def test_validate_file_metadata_invalid_count(temp_telemetry_file):
    """Test para validar metadatos con conteo de registros inválido"""
    metadata = {
        'file_type': 'telemetry',
        'version': '1.0',
        'company_id': 'COMP001',
        'vehicle_id': 'VEH001',
        'start_date': '2024-01-01T00:00:00',
        'end_date': '2024-01-01T00:10:00',
        'record_count': 5  # Conteo incorrecto
    }
    
    success, messages = validate_file_metadata(temp_telemetry_file, metadata)
    assert not success
    assert "no coincide con el archivo" in messages[0]

"""Test file validation module."""

import unittest
import os
import pandas as pd
from datetime import datetime
from src.app.utils.file_validator import validate_gps_file, validate_can_file

class TestFileValidation(unittest.TestCase):
    """Test cases for file validation."""
    
    def setUp(self):
        """Set up test environment."""
        self.test_files_dir = os.path.join(os.path.dirname(__file__), '../docs/archivos')
        self.gps_file = os.path.join(self.test_files_dir, '000012_GPS_DOBACK003_21-04-2025.csv')
        self.can_file = os.path.join(self.test_files_dir, '0000012_CAN_DOBACK003_21-04-2025.csv')
    
    def test_gps_file_format(self):
        """Test GPS file format validation."""
        # Verificar que el archivo existe
        self.assertTrue(os.path.exists(self.gps_file), "GPS file does not exist")
        
        # Verificar que es un archivo CSV
        self.assertTrue(self.gps_file.endswith('.csv'), "File is not a CSV")
        
        # Leer el archivo y verificar la estructura
        df = pd.read_csv(self.gps_file)
        
        # Verificar columnas requeridas
        required_columns = ['Fecha', 'Hora', 'Lat', 'Lon', 'Altitud', 'Velocidad', 'Fix', 'Satelites', 'timestamp']
        for col in required_columns:
            self.assertIn(col, df.columns, f"Required column {col} not found")
        
        # Verificar tipos de datos
        self.assertTrue(pd.api.types.is_numeric_dtype(df['Lat']), "Latitude should be numeric")
        self.assertTrue(pd.api.types.is_numeric_dtype(df['Lon']), "Longitude should be numeric")
        self.assertTrue(pd.api.types.is_numeric_dtype(df['Altitud']), "Altitude should be numeric")
        self.assertTrue(pd.api.types.is_numeric_dtype(df['Velocidad']), "Speed should be numeric")
        self.assertTrue(pd.api.types.is_numeric_dtype(df['Fix']), "Fix should be numeric")
        self.assertTrue(pd.api.types.is_numeric_dtype(df['Satelites']), "Satellites should be numeric")
        
        # Verificar rangos de valores
        self.assertTrue((df['Lat'] >= -90) & (df['Lat'] <= 90).all(), "Latitude out of range")
        self.assertTrue((df['Lon'] >= -180) & (df['Lon'] <= 180).all(), "Longitude out of range")
        self.assertTrue((df['Velocidad'] >= 0).all(), "Speed should be non-negative")
        self.assertTrue((df['Fix'] >= 0) & (df['Fix'] <= 2).all(), "Fix should be 0, 1, or 2")
        self.assertTrue((df['Satelites'] >= 0).all(), "Satellites should be non-negative")
        
        # Verificar formato de timestamp
        try:
            pd.to_datetime(df['timestamp'])
        except ValueError:
            self.fail("Invalid timestamp format")
    
    def test_can_file_format(self):
        """Test CAN file format validation."""
        # Verificar que el archivo existe
        self.assertTrue(os.path.exists(self.can_file), "CAN file does not exist")
        
        # Verificar que es un archivo CSV
        self.assertTrue(self.can_file.endswith('.csv'), "File is not a CSV")
        
        # Leer el archivo y verificar la estructura
        df = pd.read_csv(self.can_file)
        
        # Verificar columnas requeridas
        required_columns = ['Timestamp', 'length', 'response', 'service', 'ParameterID_Service01', 
                          'S1_PID_0C_EngineRPM', 'S1_PID_0D_VehicleSpeed']
        for col in required_columns:
            self.assertIn(col, df.columns, f"Required column {col} not found")
        
        # Verificar tipos de datos
        self.assertTrue(pd.api.types.is_numeric_dtype(df['length']), "Length should be numeric")
        self.assertTrue(pd.api.types.is_numeric_dtype(df['S1_PID_0C_EngineRPM']), "Engine RPM should be numeric")
        self.assertTrue(pd.api.types.is_numeric_dtype(df['S1_PID_0D_VehicleSpeed']), "Vehicle speed should be numeric")
        
        # Verificar rangos de valores
        self.assertTrue((df['length'] >= 0).all(), "Length should be non-negative")
        self.assertTrue((df['S1_PID_0C_EngineRPM'] >= 0).all(), "Engine RPM should be non-negative")
        self.assertTrue((df['S1_PID_0D_VehicleSpeed'] >= 0).all(), "Vehicle speed should be non-negative")
        
        # Verificar formato de timestamp
        try:
            pd.to_datetime(df['Timestamp'])
        except ValueError:
            self.fail("Invalid timestamp format")

if __name__ == '__main__':
    unittest.main() 