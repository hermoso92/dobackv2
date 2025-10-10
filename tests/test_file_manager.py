import pytest
import os
import json
import io
from unittest.mock import patch, MagicMock
from src.app.services.file_manager import FileManager
from src.app.exceptions import FileManagerError

@pytest.fixture
def file_manager():
    config = {
        'files_dir': 'test_files',
        'temp_dir': 'test_temp',
        'max_file_size': 1024 * 1024,  # 1MB
        'allowed_extensions': ['txt', 'pdf', 'jpg'],
        'max_files': 100
    }
    return FileManager(config)

@pytest.fixture(autouse=True)
def cleanup():
    yield
    # Limpiar archivos de test
    if os.path.exists('test_files'):
        for file in os.listdir('test_files'):
            os.remove(os.path.join('test_files', file))
        os.rmdir('test_files')
    if os.path.exists('test_temp'):
        for file in os.listdir('test_temp'):
            os.remove(os.path.join('test_temp', file))
        os.rmdir('test_temp')

def test_init_file_manager(file_manager):
    # Verificar configuración
    assert file_manager.files_dir == 'test_files'
    assert file_manager.temp_dir == 'test_temp'
    assert file_manager.max_file_size == 1024 * 1024
    assert file_manager.allowed_extensions == ['txt', 'pdf', 'jpg']
    assert file_manager.max_files == 100
    
    # Verificar que se crearon los directorios
    assert os.path.exists('test_files')
    assert os.path.exists('test_temp')
    
    # Verificar métricas iniciales
    assert file_manager.metrics['total_files'] == 0
    assert file_manager.metrics['total_size'] == 0
    assert file_manager.metrics['files_by_type'] == {}
    assert file_manager.metrics['files_by_extension'] == {}
    assert file_manager.metrics['errors'] == 0

def test_load_metadata(file_manager):
    # Crear archivo de metadatos
    metadata = {
        'test_file_1': {
            'filename': 'test1.txt',
            'size': 100,
            'type': 'text/plain',
            'extension': 'txt',
            'created_at': '2023-01-01T00:00:00',
            'modified_at': '2023-01-01T00:00:00'
        }
    }
    
    os.makedirs('test_files', exist_ok=True)
    with open('test_files/metadata.json', 'w') as f:
        json.dump(metadata, f)
    
    # Cargar metadatos
    file_manager._load_metadata()
    
    # Verificar metadatos
    assert len(file_manager.metadata) == 1
    assert file_manager.metadata['test_file_1']['filename'] == 'test1.txt'
    assert file_manager.metadata['test_file_1']['size'] == 100
    assert file_manager.metadata['test_file_1']['type'] == 'text/plain'
    assert file_manager.metadata['test_file_1']['extension'] == 'txt'

def test_save_metadata(file_manager):
    # Crear metadatos
    file_manager.metadata = {
        'test_file_1': {
            'filename': 'test1.txt',
            'size': 100,
            'type': 'text/plain',
            'extension': 'txt',
            'created_at': '2023-01-01T00:00:00',
            'modified_at': '2023-01-01T00:00:00'
        }
    }
    
    # Guardar metadatos
    file_manager._save_metadata()
    
    # Verificar archivo
    assert os.path.exists('test_files/metadata.json')
    
    with open('test_files/metadata.json', 'r') as f:
        saved_metadata = json.load(f)
    
    assert len(saved_metadata) == 1
    assert saved_metadata['test_file_1']['filename'] == 'test1.txt'
    assert saved_metadata['test_file_1']['size'] == 100
    assert saved_metadata['test_file_1']['type'] == 'text/plain'
    assert saved_metadata['test_file_1']['extension'] == 'txt'

def test_update_metrics(file_manager):
    # Crear metadatos
    file_manager.metadata = {
        'test_file_1': {
            'filename': 'test1.txt',
            'size': 100,
            'type': 'text/plain',
            'extension': 'txt',
            'created_at': '2023-01-01T00:00:00',
            'modified_at': '2023-01-01T00:00:00'
        },
        'test_file_2': {
            'filename': 'test2.pdf',
            'size': 200,
            'type': 'application/pdf',
            'extension': 'pdf',
            'created_at': '2023-01-01T00:00:00',
            'modified_at': '2023-01-01T00:00:00'
        }
    }
    
    # Actualizar métricas
    file_manager._update_metrics()
    
    # Verificar métricas
    assert file_manager.metrics['total_files'] == 2
    assert file_manager.metrics['total_size'] == 300
    assert file_manager.metrics['files_by_type']['text/plain'] == 1
    assert file_manager.metrics['files_by_type']['application/pdf'] == 1
    assert file_manager.metrics['files_by_extension']['txt'] == 1
    assert file_manager.metrics['files_by_extension']['pdf'] == 1

def test_generate_file_id(file_manager):
    # Generar ID
    file_id = file_manager._generate_file_id('test.txt')
    
    # Verificar ID
    assert isinstance(file_id, str)
    assert len(file_id) == 32  # MD5 hash length

def test_get_file_metadata(file_manager):
    # Crear archivo de prueba
    test_file = os.path.join('test_files', 'test.txt')
    os.makedirs('test_files', exist_ok=True)
    with open(test_file, 'w') as f:
        f.write('test content')
    
    # Obtener metadatos
    metadata = file_manager._get_file_metadata(test_file)
    
    # Verificar metadatos
    assert metadata['size'] == 13  # 'test content' length
    assert metadata['type'] == 'text/plain'
    assert metadata['extension'] == 'txt'
    assert 'created_at' in metadata
    assert 'modified_at' in metadata

def test_save_file(file_manager):
    # Crear archivo de prueba
    file_content = b'test content'
    file = io.BytesIO(file_content)
    
    # Guardar archivo
    file_id = file_manager.save_file(file, 'test.txt')
    
    # Verificar archivo
    assert os.path.exists(os.path.join('test_files', file_id))
    
    with open(os.path.join('test_files', file_id), 'rb') as f:
        saved_content = f.read()
    
    assert saved_content == file_content
    
    # Verificar metadatos
    assert file_id in file_manager.metadata
    assert file_manager.metadata[file_id]['filename'] == 'test.txt'
    assert file_manager.metadata[file_id]['size'] == 13
    assert file_manager.metadata[file_id]['type'] == 'text/plain'
    assert file_manager.metadata[file_id]['extension'] == 'txt'

def test_save_file_too_large(file_manager):
    # Crear archivo demasiado grande
    file_content = b'x' * (file_manager.max_file_size + 1)
    file = io.BytesIO(file_content)
    
    # Verificar que se lanza error
    with pytest.raises(FileManagerError):
        file_manager.save_file(file, 'test.txt')

def test_save_file_invalid_extension(file_manager):
    # Crear archivo con extensión no permitida
    file_content = b'test content'
    file = io.BytesIO(file_content)
    
    # Verificar que se lanza error
    with pytest.raises(FileManagerError):
        file_manager.save_file(file, 'test.exe')

def test_get_file(file_manager):
    # Crear archivo de prueba
    file_content = b'test content'
    file = io.BytesIO(file_content)
    file_id = file_manager.save_file(file, 'test.txt')
    
    # Obtener archivo
    retrieved_file = file_manager.get_file(file_id)
    
    # Verificar contenido
    assert retrieved_file.read() == file_content
    
    # Verificar archivo inexistente
    assert file_manager.get_file('nonexistent_file') is None

def test_get_file_metadata(file_manager):
    # Crear archivo de prueba
    file_content = b'test content'
    file = io.BytesIO(file_content)
    file_id = file_manager.save_file(file, 'test.txt')
    
    # Obtener metadatos
    metadata = file_manager.get_file_metadata(file_id)
    
    # Verificar metadatos
    assert metadata['filename'] == 'test.txt'
    assert metadata['size'] == 13
    assert metadata['type'] == 'text/plain'
    assert metadata['extension'] == 'txt'
    
    # Verificar archivo inexistente
    assert file_manager.get_file_metadata('nonexistent_file') is None

def test_get_files(file_manager):
    # Crear archivos de prueba
    file1 = io.BytesIO(b'test content 1')
    file2 = io.BytesIO(b'test content 2')
    file3 = io.BytesIO(b'test content 3')
    
    file_manager.save_file(file1, 'test1.txt')
    file_manager.save_file(file2, 'test2.pdf')
    file_manager.save_file(file3, 'test3.txt')
    
    # Obtener archivos por tipo
    txt_files = file_manager.get_files(file_type='text/plain')
    assert len(txt_files) == 2
    assert all(f['type'] == 'text/plain' for f in txt_files)
    
    # Obtener archivos por extensión
    pdf_files = file_manager.get_files(extension='pdf')
    assert len(pdf_files) == 1
    assert all(f['extension'] == 'pdf' for f in pdf_files)
    
    # Obtener archivos por tipo y extensión
    txt_files = file_manager.get_files(file_type='text/plain', extension='txt')
    assert len(txt_files) == 2
    assert all(f['type'] == 'text/plain' and f['extension'] == 'txt' for f in txt_files)

def test_delete_file(file_manager):
    # Crear archivo de prueba
    file_content = b'test content'
    file = io.BytesIO(file_content)
    file_id = file_manager.save_file(file, 'test.txt')
    
    # Eliminar archivo
    file_manager.delete_file(file_id)
    
    # Verificar que se eliminó
    assert not os.path.exists(os.path.join('test_files', file_id))
    assert file_id not in file_manager.metadata
    
    # Verificar métricas
    assert file_manager.metrics['total_files'] == 0
    assert file_manager.metrics['total_size'] == 0

def test_clear_files(file_manager):
    # Crear archivos de prueba
    file1 = io.BytesIO(b'test content 1')
    file2 = io.BytesIO(b'test content 2')
    
    file_manager.save_file(file1, 'test1.txt')
    file_manager.save_file(file2, 'test2.txt')
    
    # Limpiar archivos
    file_manager.clear_files()
    
    # Verificar que se limpiaron
    assert len(os.listdir('test_files')) == 0
    assert len(file_manager.metadata) == 0
    
    # Verificar métricas
    assert file_manager.metrics['total_files'] == 0
    assert file_manager.metrics['total_size'] == 0

def test_get_file_stats(file_manager):
    # Crear archivos de prueba
    file1 = io.BytesIO(b'test content 1')
    file2 = io.BytesIO(b'test content 2')
    
    file_manager.save_file(file1, 'test1.txt')
    file_manager.save_file(file2, 'test2.pdf')
    
    # Obtener estadísticas
    stats = file_manager.get_file_stats()
    
    # Verificar estadísticas
    assert stats['total_files'] == 2
    assert stats['total_size'] == 26
    assert stats['files_by_type']['text/plain'] == 1
    assert stats['files_by_type']['application/pdf'] == 1
    assert stats['files_by_extension']['txt'] == 1
    assert stats['files_by_extension']['pdf'] == 1
    assert stats['errors'] == 0

def test_get_status(file_manager):
    # Obtener estado
    status = file_manager.get_status()
    
    # Verificar propiedades
    assert status['files_dir'] == 'test_files'
    assert status['temp_dir'] == 'test_temp'
    assert status['max_file_size'] == 1024 * 1024
    assert status['allowed_extensions'] == ['txt', 'pdf', 'jpg']
    assert status['max_files'] == 100
    assert 'metrics' in status 