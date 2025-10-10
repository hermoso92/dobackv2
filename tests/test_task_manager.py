import pytest
import os
import json
import time
import asyncio
from unittest.mock import patch, MagicMock
from src.app.services.task_manager import TaskManager, Task
from src.app.exceptions import TaskManagerError

@pytest.fixture
def task_manager():
    config = {
        'tasks_dir': 'test_tasks',
        'tasks_file': 'test_tasks.json',
        'max_tasks': 100,
        'max_workers': 2,
        'task_timeout': 3600
    }
    return TaskManager(config)

@pytest.fixture(autouse=True)
def cleanup():
    yield
    # Limpiar archivos de test
    if os.path.exists('test_tasks'):
        for file in os.listdir('test_tasks'):
            os.remove(os.path.join('test_tasks', file))
        os.rmdir('test_tasks')

def test_init_task_manager(task_manager):
    # Verificar configuración
    assert task_manager.tasks_dir == 'test_tasks'
    assert task_manager.tasks_file == 'test_tasks.json'
    assert task_manager.max_tasks == 100
    assert task_manager.max_workers == 2
    assert task_manager.task_timeout == 3600
    
    # Verificar que se creó el directorio
    assert os.path.exists('test_tasks')
    
    # Verificar métricas iniciales
    assert task_manager.metrics['total_tasks'] == 0
    assert task_manager.metrics['tasks_by_status']['pending'] == 0
    assert task_manager.metrics['tasks_by_status']['running'] == 0
    assert task_manager.metrics['tasks_by_status']['completed'] == 0
    assert task_manager.metrics['tasks_by_status']['failed'] == 0
    assert task_manager.metrics['tasks_by_priority'] == {}
    assert task_manager.metrics['total_execution_time'] == 0
    assert task_manager.metrics['errors'] == 0

def test_load_tasks(task_manager):
    # Crear archivo de tareas
    tasks_data = [
        {
            'id': 'test_task_1',
            'name': 'Test Task 1',
            'status': 'completed',
            'result': 'success',
            'error': None,
            'created_at': '2023-01-01T00:00:00',
            'started_at': '2023-01-01T00:00:01',
            'completed_at': '2023-01-01T00:00:02',
            'retries': 0,
            'max_retries': 3,
            'priority': 0
        }
    ]
    
    os.makedirs('test_tasks', exist_ok=True)
    with open('test_tasks/test_tasks.json', 'w') as f:
        json.dump(tasks_data, f)
    
    # Cargar tareas
    task_manager._load_tasks()
    
    # Verificar tareas
    assert len(task_manager.tasks) == 1
    task = task_manager.tasks['test_task_1']
    assert task.id == 'test_task_1'
    assert task.name == 'Test Task 1'
    assert task.status == 'completed'
    assert task.result == 'success'
    assert task.error is None
    assert task.retries == 0
    assert task.max_retries == 3
    assert task.priority == 0

def test_save_tasks(task_manager):
    # Crear tarea
    task = Task('test_task_1', 'Test Task 1', lambda: None)
    task.status = 'completed'
    task.result = 'success'
    task.started_at = datetime.now()
    task.completed_at = datetime.now()
    task_manager.tasks['test_task_1'] = task
    
    # Guardar tareas
    task_manager._save_tasks()
    
    # Verificar archivo
    assert os.path.exists('test_tasks/test_tasks.json')
    
    with open('test_tasks/test_tasks.json', 'r') as f:
        tasks_data = json.load(f)
    
    assert len(tasks_data) == 1
    assert tasks_data[0]['id'] == 'test_task_1'
    assert tasks_data[0]['name'] == 'Test Task 1'
    assert tasks_data[0]['status'] == 'completed'
    assert tasks_data[0]['result'] == 'success'

def test_update_metrics(task_manager):
    # Crear tareas
    task1 = Task('test_task_1', 'Test Task 1', lambda: None)
    task1.status = 'completed'
    task1.priority = 1
    
    task2 = Task('test_task_2', 'Test Task 2', lambda: None)
    task2.status = 'pending'
    task2.priority = 2
    
    task3 = Task('test_task_3', 'Test Task 3', lambda: None)
    task3.status = 'failed'
    task3.priority = 1
    
    task_manager.tasks = {
        'test_task_1': task1,
        'test_task_2': task2,
        'test_task_3': task3
    }
    
    # Actualizar métricas
    task_manager._update_metrics()
    
    # Verificar métricas
    assert task_manager.metrics['total_tasks'] == 3
    assert task_manager.metrics['tasks_by_status']['completed'] == 1
    assert task_manager.metrics['tasks_by_status']['pending'] == 1
    assert task_manager.metrics['tasks_by_status']['failed'] == 1
    assert task_manager.metrics['tasks_by_priority'][1] == 2
    assert task_manager.metrics['tasks_by_priority'][2] == 1

@pytest.mark.asyncio
async def test_add_task(task_manager):
    # Función de prueba
    async def test_func():
        return 'success'
    
    # Añadir tarea
    task_id = await task_manager.add_task('Test Task', test_func, priority=1)
    
    # Verificar tarea
    assert task_id in task_manager.tasks
    task = task_manager.tasks[task_id]
    assert task.name == 'Test Task'
    assert task.status == 'pending'
    assert task.priority == 1
    
    # Verificar métricas
    assert task_manager.metrics['total_tasks'] == 1
    assert task_manager.metrics['tasks_by_status']['pending'] == 1
    assert task_manager.metrics['tasks_by_priority'][1] == 1

def test_get_task(task_manager):
    # Crear tarea
    task = Task('test_task_1', 'Test Task 1', lambda: None)
    task_manager.tasks['test_task_1'] = task
    
    # Obtener tarea
    retrieved_task = task_manager.get_task('test_task_1')
    
    # Verificar tarea
    assert retrieved_task == task
    
    # Verificar tarea inexistente
    assert task_manager.get_task('nonexistent_task') is None

def test_get_tasks(task_manager):
    # Crear tareas
    task1 = Task('test_task_1', 'Test Task 1', lambda: None)
    task1.status = 'completed'
    task1.priority = 1
    
    task2 = Task('test_task_2', 'Test Task 2', lambda: None)
    task2.status = 'pending'
    task2.priority = 2
    
    task3 = Task('test_task_3', 'Test Task 3', lambda: None)
    task3.status = 'failed'
    task3.priority = 1
    
    task_manager.tasks = {
        'test_task_1': task1,
        'test_task_2': task2,
        'test_task_3': task3
    }
    
    # Obtener tareas por estado
    completed_tasks = task_manager.get_tasks(status='completed')
    assert len(completed_tasks) == 1
    assert completed_tasks[0].id == 'test_task_1'
    
    # Obtener tareas por prioridad
    priority_1_tasks = task_manager.get_tasks(priority=1)
    assert len(priority_1_tasks) == 2
    assert all(task.priority == 1 for task in priority_1_tasks)
    
    # Obtener tareas por estado y prioridad
    pending_priority_2 = task_manager.get_tasks(status='pending', priority=2)
    assert len(pending_priority_2) == 1
    assert pending_priority_2[0].id == 'test_task_2'

def test_cancel_task(task_manager):
    # Crear tarea
    task = Task('test_task_1', 'Test Task 1', lambda: None)
    task.status = 'pending'
    task_manager.tasks['test_task_1'] = task
    
    # Cancelar tarea
    task_manager.cancel_task('test_task_1')
    
    # Verificar estado
    assert task.status == 'failed'
    assert task.error == "Task cancelled"
    
    # Verificar métricas
    assert task_manager.metrics['tasks_by_status']['failed'] == 1

def test_retry_task(task_manager):
    # Crear tarea
    task = Task('test_task_1', 'Test Task 1', lambda: None)
    task.status = 'failed'
    task.error = "Test error"
    task.retries = 3
    task_manager.tasks['test_task_1'] = task
    
    # Reintentar tarea
    task_manager.retry_task('test_task_1')
    
    # Verificar estado
    assert task.status == 'pending'
    assert task.error is None
    assert task.retries == 0
    
    # Verificar métricas
    assert task_manager.metrics['tasks_by_status']['pending'] == 1

def test_clear_tasks(task_manager):
    # Crear tareas
    task1 = Task('test_task_1', 'Test Task 1', lambda: None)
    task2 = Task('test_task_2', 'Test Task 2', lambda: None)
    task_manager.tasks = {
        'test_task_1': task1,
        'test_task_2': task2
    }
    
    # Limpiar tareas
    task_manager.clear_tasks()
    
    # Verificar que se limpiaron
    assert len(task_manager.tasks) == 0
    
    # Verificar métricas
    assert task_manager.metrics['total_tasks'] == 0

def test_get_task_stats(task_manager):
    # Crear tareas
    task1 = Task('test_task_1', 'Test Task 1', lambda: None)
    task1.status = 'completed'
    task1.priority = 1
    
    task2 = Task('test_task_2', 'Test Task 2', lambda: None)
    task2.status = 'pending'
    task2.priority = 2
    
    task_manager.tasks = {
        'test_task_1': task1,
        'test_task_2': task2
    }
    task_manager._update_metrics()
    
    # Obtener estadísticas
    stats = task_manager.get_task_stats()
    
    # Verificar estadísticas
    assert stats['total_tasks'] == 2
    assert stats['tasks_by_status']['completed'] == 1
    assert stats['tasks_by_status']['pending'] == 1
    assert stats['tasks_by_priority'][1] == 1
    assert stats['tasks_by_priority'][2] == 1
    assert stats['total_execution_time'] == 0
    assert stats['errors'] == 0

def test_get_status(task_manager):
    # Obtener estado
    status = task_manager.get_status()
    
    # Verificar propiedades
    assert status['tasks_dir'] == 'test_tasks'
    assert status['tasks_file'] == 'test_tasks.json'
    assert status['max_tasks'] == 100
    assert status['max_workers'] == 2
    assert status['task_timeout'] == 3600
    assert status['running'] == False
    assert status['active_workers'] == 0
    assert status['queue_size'] == 0
    assert 'metrics' in status

@pytest.mark.asyncio
async def test_worker_execution(task_manager):
    # Función de prueba
    async def test_func():
        return 'success'
    
    # Iniciar TaskManager
    task_manager.start()
    
    # Añadir tarea
    task_id = await task_manager.add_task('Test Task', test_func)
    
    # Esperar a que se procese
    await asyncio.sleep(0.1)
    
    # Verificar tarea
    task = task_manager.tasks[task_id]
    assert task.status == 'completed'
    assert task.result == 'success'
    
    # Detener TaskManager
    task_manager.stop()

@pytest.mark.asyncio
async def test_worker_error(task_manager):
    # Función de prueba que lanza error
    async def test_func():
        raise Exception("Test error")
    
    # Iniciar TaskManager
    task_manager.start()
    
    # Añadir tarea
    task_id = await task_manager.add_task('Test Task', test_func)
    
    # Esperar a que se procese
    await asyncio.sleep(0.1)
    
    # Verificar tarea
    task = task_manager.tasks[task_id]
    assert task.status == 'failed'
    assert str(task.error) == "Test error"
    assert task.retries == 1
    
    # Verificar métricas
    assert task_manager.metrics['errors'] == 1
    
    # Detener TaskManager
    task_manager.stop()

@pytest.mark.asyncio
async def test_worker_retry(task_manager):
    # Contador de intentos
    attempts = 0
    
    # Función de prueba que falla dos veces
    async def test_func():
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            raise Exception("Test error")
        return 'success'
    
    # Iniciar TaskManager
    task_manager.start()
    
    # Añadir tarea
    task_id = await task_manager.add_task('Test Task', test_func)
    
    # Esperar a que se procese
    await asyncio.sleep(0.2)
    
    # Verificar tarea
    task = task_manager.tasks[task_id]
    assert task.status == 'completed'
    assert task.result == 'success'
    assert task.retries == 2
    
    # Detener TaskManager
    task_manager.stop() 