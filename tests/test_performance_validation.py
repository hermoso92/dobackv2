import pytest
import time
import psutil
import json
from datetime import datetime, timedelta
from src.automation.validations.performance_validation import (
    validate_response_time,
    validate_resource_usage,
    validate_concurrent_requests,
    validate_database_performance,
    validate_api_performance,
    validate_memory_usage,
    validate_cpu_usage,
    validate_disk_io,
    validate_network_io
)

# Fixtures para pruebas de rendimiento
@pytest.fixture
def valid_response_time():
    """Fixture que proporciona tiempos de respuesta válidos"""
    return {
        'endpoint': '/api/vehicles',
        'method': 'GET',
        'response_time_ms': 150,
        'max_response_time_ms': 200,
        'percentile_95_ms': 180,
        'percentile_99_ms': 190
    }

@pytest.fixture
def valid_resource_usage():
    """Fixture que proporciona uso de recursos válido"""
    return {
        'cpu_percent': 45.5,
        'memory_percent': 60.2,
        'disk_io_percent': 30.0,
        'network_io_percent': 25.5,
        'max_cpu_percent': 80.0,
        'max_memory_percent': 85.0,
        'max_disk_io_percent': 70.0,
        'max_network_io_percent': 75.0
    }

@pytest.fixture
def valid_concurrent_requests():
    """Fixture que proporciona configuración de solicitudes concurrentes válida"""
    return {
        'total_requests': 1000,
        'concurrent_users': 100,
        'ramp_up_time_seconds': 60,
        'sustained_time_seconds': 300,
        'ramp_down_time_seconds': 60,
        'success_rate_percent': 99.9,
        'error_rate_percent': 0.1,
        'timeout_seconds': 30
    }

# Tests para validate_response_time
def test_validate_response_time_success(valid_response_time):
    """Test para validar tiempo de respuesta válido"""
    success, messages = validate_response_time(valid_response_time)
    assert success
    assert "Tiempo de respuesta válido" in messages[0]

def test_validate_response_time_exceeded():
    """Test para validar tiempo de respuesta excedido"""
    response_time = valid_response_time.copy()
    response_time['response_time_ms'] = 250  # Excede el máximo
    
    success, messages = validate_response_time(response_time)
    assert not success
    assert "Tiempo de respuesta excedido" in messages[0]

def test_validate_response_time_percentile_exceeded():
    """Test para validar percentil de tiempo de respuesta excedido"""
    response_time = valid_response_time.copy()
    response_time['percentile_95_ms'] = 210  # Excede el máximo
    
    success, messages = validate_response_time(response_time)
    assert not success
    assert "Percentil de tiempo de respuesta excedido" in messages[0]

# Tests para validate_resource_usage
def test_validate_resource_usage_success(valid_resource_usage):
    """Test para validar uso de recursos válido"""
    success, messages = validate_resource_usage(valid_resource_usage)
    assert success
    assert "Uso de recursos válido" in messages[0]

def test_validate_resource_usage_cpu_exceeded():
    """Test para validar uso de CPU excedido"""
    resource_usage = valid_resource_usage.copy()
    resource_usage['cpu_percent'] = 90.0  # Excede el máximo
    
    success, messages = validate_resource_usage(resource_usage)
    assert not success
    assert "Uso de CPU excedido" in messages[0]

def test_validate_resource_usage_memory_exceeded():
    """Test para validar uso de memoria excedido"""
    resource_usage = valid_resource_usage.copy()
    resource_usage['memory_percent'] = 90.0  # Excede el máximo
    
    success, messages = validate_resource_usage(resource_usage)
    assert not success
    assert "Uso de memoria excedido" in messages[0]

# Tests para validate_concurrent_requests
def test_validate_concurrent_requests_success(valid_concurrent_requests):
    """Test para validar solicitudes concurrentes válidas"""
    success, messages = validate_concurrent_requests(valid_concurrent_requests)
    assert success
    assert "Solicitudes concurrentes válidas" in messages[0]

def test_validate_concurrent_requests_low_success_rate():
    """Test para validar tasa de éxito baja en solicitudes concurrentes"""
    concurrent_requests = valid_concurrent_requests.copy()
    concurrent_requests['success_rate_percent'] = 95.0  # Por debajo del mínimo
    
    success, messages = validate_concurrent_requests(concurrent_requests)
    assert not success
    assert "Tasa de éxito insuficiente" in messages[0]

def test_validate_concurrent_requests_high_error_rate():
    """Test para validar tasa de error alta en solicitudes concurrentes"""
    concurrent_requests = valid_concurrent_requests.copy()
    concurrent_requests['error_rate_percent'] = 5.0  # Por encima del máximo
    
    success, messages = validate_concurrent_requests(concurrent_requests)
    assert not success
    assert "Tasa de error excedida" in messages[0]

# Tests para validate_database_performance
def test_validate_database_performance_success():
    """Test para validar rendimiento de base de datos válido"""
    db_performance = {
        'query_time_ms': 50,
        'max_query_time_ms': 100,
        'transactions_per_second': 1000,
        'min_transactions_per_second': 500,
        'connection_pool_size': 20,
        'max_connection_pool_size': 50,
        'active_connections': 15,
        'max_active_connections': 40
    }
    
    success, messages = validate_database_performance(db_performance)
    assert success
    assert "Rendimiento de base de datos válido" in messages[0]

def test_validate_database_performance_slow_query():
    """Test para validar consulta lenta en base de datos"""
    db_performance = {
        'query_time_ms': 150,  # Excede el máximo
        'max_query_time_ms': 100,
        'transactions_per_second': 1000,
        'min_transactions_per_second': 500
    }
    
    success, messages = validate_database_performance(db_performance)
    assert not success
    assert "Tiempo de consulta excedido" in messages[0]

def test_validate_database_performance_low_throughput():
    """Test para validar rendimiento bajo en base de datos"""
    db_performance = {
        'query_time_ms': 50,
        'max_query_time_ms': 100,
        'transactions_per_second': 400,  # Por debajo del mínimo
        'min_transactions_per_second': 500
    }
    
    success, messages = validate_database_performance(db_performance)
    assert not success
    assert "Rendimiento insuficiente" in messages[0]

# Tests para validate_api_performance
def test_validate_api_performance_success():
    """Test para validar rendimiento de API válido"""
    api_performance = {
        'endpoint': '/api/vehicles',
        'method': 'GET',
        'response_time_ms': 100,
        'max_response_time_ms': 200,
        'requests_per_second': 500,
        'min_requests_per_second': 200,
        'error_rate_percent': 0.1,
        'max_error_rate_percent': 1.0
    }
    
    success, messages = validate_api_performance(api_performance)
    assert success
    assert "Rendimiento de API válido" in messages[0]

def test_validate_api_performance_slow_response():
    """Test para validar respuesta lenta en API"""
    api_performance = {
        'endpoint': '/api/vehicles',
        'method': 'GET',
        'response_time_ms': 250,  # Excede el máximo
        'max_response_time_ms': 200,
        'requests_per_second': 500,
        'min_requests_per_second': 200
    }
    
    success, messages = validate_api_performance(api_performance)
    assert not success
    assert "Tiempo de respuesta excedido" in messages[0]

def test_validate_api_performance_high_error_rate():
    """Test para validar tasa de error alta en API"""
    api_performance = {
        'endpoint': '/api/vehicles',
        'method': 'GET',
        'response_time_ms': 100,
        'max_response_time_ms': 200,
        'requests_per_second': 500,
        'min_requests_per_second': 200,
        'error_rate_percent': 2.0,  # Por encima del máximo
        'max_error_rate_percent': 1.0
    }
    
    success, messages = validate_api_performance(api_performance)
    assert not success
    assert "Tasa de error excedida" in messages[0]

# Tests para validate_memory_usage
def test_validate_memory_usage_success():
    """Test para validar uso de memoria válido"""
    memory_usage = {
        'total_mb': 8192,
        'used_mb': 4096,
        'free_mb': 4096,
        'used_percent': 50.0,
        'max_used_percent': 80.0,
        'swap_total_mb': 4096,
        'swap_used_mb': 0,
        'swap_free_mb': 4096
    }
    
    success, messages = validate_memory_usage(memory_usage)
    assert success
    assert "Uso de memoria válido" in messages[0]

def test_validate_memory_usage_high_usage():
    """Test para validar uso de memoria alto"""
    memory_usage = {
        'total_mb': 8192,
        'used_mb': 7000,  # Uso alto
        'free_mb': 1192,
        'used_percent': 85.0,  # Excede el máximo
        'max_used_percent': 80.0
    }
    
    success, messages = validate_memory_usage(memory_usage)
    assert not success
    assert "Uso de memoria excedido" in messages[0]

# Tests para validate_cpu_usage
def test_validate_cpu_usage_success():
    """Test para validar uso de CPU válido"""
    cpu_usage = {
        'cpu_percent': 45.0,
        'max_cpu_percent': 80.0,
        'cpu_count': 4,
        'load_average_1min': 1.5,
        'load_average_5min': 1.2,
        'load_average_15min': 1.0
    }
    
    success, messages = validate_cpu_usage(cpu_usage)
    assert success
    assert "Uso de CPU válido" in messages[0]

def test_validate_cpu_usage_high_usage():
    """Test para validar uso de CPU alto"""
    cpu_usage = {
        'cpu_percent': 90.0,  # Excede el máximo
        'max_cpu_percent': 80.0,
        'cpu_count': 4,
        'load_average_1min': 3.5  # Carga alta
    }
    
    success, messages = validate_cpu_usage(cpu_usage)
    assert not success
    assert "Uso de CPU excedido" in messages[0]

# Tests para validate_disk_io
def test_validate_disk_io_success():
    """Test para validar I/O de disco válido"""
    disk_io = {
        'read_bytes_per_sec': 1000000,
        'write_bytes_per_sec': 500000,
        'max_read_bytes_per_sec': 2000000,
        'max_write_bytes_per_sec': 1000000,
        'read_ops_per_sec': 100,
        'write_ops_per_sec': 50,
        'max_read_ops_per_sec': 200,
        'max_write_ops_per_sec': 100
    }
    
    success, messages = validate_disk_io(disk_io)
    assert success
    assert "I/O de disco válido" in messages[0]

def test_validate_disk_io_high_usage():
    """Test para validar I/O de disco alto"""
    disk_io = {
        'read_bytes_per_sec': 2500000,  # Excede el máximo
        'write_bytes_per_sec': 500000,
        'max_read_bytes_per_sec': 2000000,
        'max_write_bytes_per_sec': 1000000
    }
    
    success, messages = validate_disk_io(disk_io)
    assert not success
    assert "I/O de disco excedido" in messages[0]

# Tests para validate_network_io
def test_validate_network_io_success():
    """Test para validar I/O de red válido"""
    network_io = {
        'bytes_sent_per_sec': 1000000,
        'bytes_recv_per_sec': 2000000,
        'max_bytes_sent_per_sec': 2000000,
        'max_bytes_recv_per_sec': 4000000,
        'packets_sent_per_sec': 1000,
        'packets_recv_per_sec': 2000,
        'max_packets_sent_per_sec': 2000,
        'max_packets_recv_per_sec': 4000
    }
    
    success, messages = validate_network_io(network_io)
    assert success
    assert "I/O de red válido" in messages[0]

def test_validate_network_io_high_usage():
    """Test para validar I/O de red alto"""
    network_io = {
        'bytes_sent_per_sec': 3000000,  # Excede el máximo
        'bytes_recv_per_sec': 2000000,
        'max_bytes_sent_per_sec': 2000000,
        'max_bytes_recv_per_sec': 4000000
    }
    
    success, messages = validate_network_io(network_io)
    assert not success
    assert "I/O de red excedido" in messages[0] 