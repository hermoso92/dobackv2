import pytest
import os
import json
import asyncio
import time
from datetime import datetime, timedelta
from src.app.services.event_manager import EventManager, Event
from src.app.exceptions import EventError, EventManagerError

@pytest.fixture
def event_manager():
    config = {
        'events_dir': 'test_events',
        'events_file': 'test_events.json',
        'events_retention': 604800,  # 7 días
        'max_events': 1000
    }
    return EventManager(config)

@pytest.fixture(autouse=True)
def cleanup():
    yield
    # Limpiar archivos de test
    if os.path.exists('test_events'):
        for file in os.listdir('test_events'):
            os.remove(os.path.join('test_events', file))
        os.rmdir('test_events')

def test_init_event_manager(event_manager):
    # Verificar configuración
    assert event_manager.events_dir == 'test_events'
    assert event_manager.events_file == 'test_events.json'
    assert event_manager.events_retention == 604800
    assert event_manager.max_events == 1000
    
    # Verificar que se creó el directorio
    assert os.path.exists('test_events')
    
    # Verificar métricas iniciales
    assert event_manager.metrics['total_events'] == 0
    assert event_manager.metrics['events_by_type'] == {}
    assert event_manager.metrics['events_by_source'] == {}
    assert event_manager.metrics['subscribers_by_type'] == {}
    assert event_manager.metrics['errors'] == 0

def test_load_events(event_manager):
    # Crear archivo de eventos
    events_data = [
        {
            'type': 'test_event',
            'data': {'key': 'value'},
            'source': 'test_source',
            'timestamp': datetime.utcnow().isoformat()
        }
    ]
    
    os.makedirs('test_events', exist_ok=True)
    with open('test_events/test_events.json', 'w') as f:
        json.dump(events_data, f)
    
    # Cargar eventos
    event_manager._load_events()
    
    # Verificar eventos
    assert len(event_manager.events) == 1
    assert event_manager.events[0].type == 'test_event'
    assert event_manager.events[0].data == {'key': 'value'}
    assert event_manager.events[0].source == 'test_source'

def test_save_events(event_manager):
    # Crear evento
    event = Event('test_event', {'key': 'value'}, 'test_source')
    event_manager.events.append(event)
    
    # Guardar eventos
    event_manager._save_events()
    
    # Verificar archivo
    assert os.path.exists('test_events/test_events.json')
    
    with open('test_events/test_events.json', 'r') as f:
        events_data = json.load(f)
    
    assert len(events_data) == 1
    assert events_data[0]['type'] == 'test_event'
    assert events_data[0]['data'] == {'key': 'value'}
    assert events_data[0]['source'] == 'test_source'

def test_update_metrics(event_manager):
    # Crear eventos
    event1 = Event('type1', {'key': 'value1'}, 'source1')
    event2 = Event('type1', {'key': 'value2'}, 'source1')
    event3 = Event('type2', {'key': 'value3'}, 'source2')
    
    event_manager.events = [event1, event2, event3]
    
    # Actualizar métricas
    event_manager._update_metrics()
    
    # Verificar métricas
    assert event_manager.metrics['total_events'] == 3
    assert event_manager.metrics['events_by_type']['type1'] == 2
    assert event_manager.metrics['events_by_type']['type2'] == 1
    assert event_manager.metrics['events_by_source']['source1'] == 2
    assert event_manager.metrics['events_by_source']['source2'] == 1

@pytest.mark.asyncio
async def test_publish(event_manager):
    # Crear evento
    event = Event('test_event', {'key': 'value'}, 'test_source')
    
    # Publicar evento
    await event_manager.publish(event)
    
    # Verificar evento
    assert len(event_manager.events) == 1
    assert event_manager.events[0].type == 'test_event'
    assert event_manager.events[0].data == {'key': 'value'}
    assert event_manager.events[0].source == 'test_source'
    
    # Verificar métricas
    assert event_manager.metrics['total_events'] == 1
    assert event_manager.metrics['events_by_type']['test_event'] == 1
    assert event_manager.metrics['events_by_source']['test_source'] == 1

def test_subscribe(event_manager):
    # Crear callback
    def callback(event):
        pass
    
    # Suscribir callback
    event_manager.subscribe('test_event', callback)
    
    # Verificar suscripción
    assert 'test_event' in event_manager.subscribers
    assert callback in event_manager.subscribers['test_event']
    
    # Verificar métricas
    assert event_manager.metrics['subscribers_by_type']['test_event'] == 1

def test_unsubscribe(event_manager):
    # Crear callback
    def callback(event):
        pass
    
    # Suscribir y desuscribir callback
    event_manager.subscribe('test_event', callback)
    event_manager.unsubscribe('test_event', callback)
    
    # Verificar que se eliminó la suscripción
    assert 'test_event' not in event_manager.subscribers
    
    # Verificar métricas
    assert 'test_event' not in event_manager.metrics['subscribers_by_type']

def test_get_events(event_manager):
    # Crear eventos
    event1 = Event('type1', {'key': 'value1'}, 'source1')
    event2 = Event('type1', {'key': 'value2'}, 'source1')
    event3 = Event('type2', {'key': 'value3'}, 'source2')
    
    event_manager.events = [event1, event2, event3]
    
    # Obtener eventos por tipo
    type1_events = event_manager.get_events(event_type='type1')
    assert len(type1_events) == 2
    
    # Obtener eventos por fuente
    source1_events = event_manager.get_events(source='source1')
    assert len(source1_events) == 2
    
    # Obtener eventos por tipo y fuente
    filtered_events = event_manager.get_events(event_type='type1', source='source1')
    assert len(filtered_events) == 2

def test_get_event_stats(event_manager):
    # Crear eventos
    event1 = Event('type1', {'key': 'value1'}, 'source1')
    event2 = Event('type1', {'key': 'value2'}, 'source1')
    event3 = Event('type2', {'key': 'value3'}, 'source2')
    
    event_manager.events = [event1, event2, event3]
    event_manager._update_metrics()
    
    # Obtener estadísticas
    stats = event_manager.get_event_stats()
    
    # Verificar estadísticas
    assert stats['total_events'] == 3
    assert stats['events_by_type']['type1'] == 2
    assert stats['events_by_type']['type2'] == 1
    assert stats['events_by_source']['source1'] == 2
    assert stats['events_by_source']['source2'] == 1
    assert stats['errors'] == 0

def test_get_status(event_manager):
    # Obtener estado
    status = event_manager.get_status()
    
    # Verificar propiedades
    assert status['events_dir'] == 'test_events'
    assert status['events_file'] == 'test_events.json'
    assert status['events_retention'] == 604800
    assert status['max_events'] == 1000
    assert 'metrics' in status

@pytest.mark.asyncio
async def test_publish_with_subscribers(event_manager):
    # Crear lista para almacenar eventos recibidos
    received_events = []
    
    # Crear callback
    def callback(event):
        received_events.append(event)
    
    # Suscribir callback
    event_manager.subscribe('test_event', callback)
    
    # Crear y publicar evento
    event = Event('test_event', {'key': 'value'}, 'test_source')
    await event_manager.publish(event)
    
    # Verificar que el callback recibió el evento
    assert len(received_events) == 1
    assert received_events[0].type == 'test_event'
    assert received_events[0].data == {'key': 'value'}
    assert received_events[0].source == 'test_source'

@pytest.mark.asyncio
async def test_publish_with_async_subscriber(event_manager):
    # Crear lista para almacenar eventos recibidos
    received_events = []
    
    # Crear callback asíncrono
    async def async_callback(event):
        received_events.append(event)
    
    # Suscribir callback
    event_manager.subscribe('test_event', async_callback)
    
    # Crear y publicar evento
    event = Event('test_event', {'key': 'value'}, 'test_source')
    await event_manager.publish(event)
    
    # Verificar que el callback recibió el evento
    assert len(received_events) == 1
    assert received_events[0].type == 'test_event'
    assert received_events[0].data == {'key': 'value'}
    assert received_events[0].source == 'test_source'

def test_max_events_limit(event_manager):
    # Crear más eventos que el máximo permitido
    for i in range(event_manager.max_events + 10):
        event = Event('test_event', {'key': f'value{i}'}, 'test_source')
        event_manager.events.append(event)
    
    # Verificar que se mantiene el límite
    assert len(event_manager.events) == event_manager.max_events
    
    # Verificar que se mantienen los eventos más recientes
    assert event_manager.events[-1].data['key'] == f'value{event_manager.max_events + 9}'

@pytest.mark.asyncio
async def test_event_creation():
    # Crear evento
    data = {'test': 'data'}
    event = Event('test_event', data, 'test_source')
    
    # Verificar propiedades
    assert event.type == 'test_event'
    assert event.data == data
    assert event.source == 'test_source'
    assert event.timestamp is not None
    assert event.id is not None

def test_event_to_dict():
    # Crear evento
    event = Event('test_event', {'test': 'data'}, 'test_source')
    
    # Convertir a diccionario
    event_dict = event.to_dict()
    
    # Verificar propiedades
    assert event_dict['type'] == 'test_event'
    assert event_dict['data'] == {'test': 'data'}
    assert event_dict['source'] == 'test_source'
    assert event_dict['timestamp'] is not None
    assert event_dict['id'] is not None

@pytest.mark.asyncio
async def test_start_stop(event_manager):
    # Iniciar gestor
    await event_manager.start()
    assert event_manager.is_running is True
    assert event_manager.processing_task is not None
    
    # Detener gestor
    await event_manager.stop()
    assert event_manager.is_running is False
    assert not event_manager.processing_task.is_running()

@pytest.mark.asyncio
async def test_publish_event(event_manager):
    # Iniciar gestor
    await event_manager.start()
    
    # Crear y publicar evento
    event = Event('test_event', {'data': 'test'}, 'test_source')
    await event_manager.publish(event)
    
    # Verificar métricas
    assert event_manager.metrics['total_events'] == 1
    
    # Detener gestor
    await event_manager.stop()

@pytest.mark.asyncio
async def test_subscribe_unsubscribe(event_manager):
    # Crear callback
    received_events = []
    async def callback(event):
        received_events.append(event)
    
    # Suscribir callback
    event_manager.subscribe('test_event', callback)
    assert event_manager.metrics['active_subscribers'] == 1
    
    # Publicar evento
    event = Event('test_event', {'data': 'test'})
    await event_manager.publish(event)
    
    # Esperar procesamiento
    await asyncio.sleep(0.1)
    
    # Verificar que se recibió el evento
    assert len(received_events) == 1
    assert received_events[0].type == 'test_event'

@pytest.mark.asyncio
async def test_process_events(event_manager):
    # Iniciar gestor
    await event_manager.start()
    
    # Crear y publicar eventos
    events = [
        Event('test_event', {'data': f'test_{i}'})
        for i in range(5)
    ]
    
    for event in events:
        await event_manager.publish(event)
    
    # Esperar procesamiento
    await asyncio.sleep(0.1)
    
    # Verificar métricas
    assert event_manager.metrics['total_events'] == 5
    assert event_manager.metrics['processed_events'] == 5
    
    # Detener gestor
    await event_manager.stop()

@pytest.mark.asyncio
async def test_handle_event_error(event_manager):
    # Crear callback con error
    async def error_callback(event):
        raise Exception("Test error")
    
    # Suscribir callback
    event_manager.subscribe('test_event', error_callback)
    
    # Publicar evento
    event = Event('test_event', {'data': 'test'})
    await event_manager.publish(event)
    
    # Esperar procesamiento
    await asyncio.sleep(0.1)
    
    # Verificar métricas
    assert event_manager.metrics['failed_events'] == 1

def test_cleanup_events(event_manager):
    # Añadir eventos
    for i in range(1100):  # Más que max_events
        event = Event('test_event', {'data': f'test_{i}'})
        event_manager.events.append(event)
    
    # Limpiar eventos
    event_manager._cleanup_events()
    
    # Verificar que se mantiene el límite
    assert len(event_manager.events) == 1000

def test_get_events(event_manager):
    # Añadir eventos de prueba
    now = datetime.utcnow()
    events = [
        Event('type1', {'data': 'test1'}, timestamp=now - timedelta(minutes=2)),
        Event('type2', {'data': 'test2'}, timestamp=now - timedelta(minutes=1)),
        Event('type1', {'data': 'test3'}, timestamp=now)
    ]
    event_manager.events = events
    
    # Obtener todos los eventos
    all_events = event_manager.get_events()
    assert len(all_events) == 3
    
    # Filtrar por tipo
    type1_events = event_manager.get_events(event_type='type1')
    assert len(type1_events) == 2
    
    # Filtrar por tiempo
    start_time = now - timedelta(minutes=1, 30)
    end_time = now - timedelta(minutes=30)
    time_filtered = event_manager.get_events(
        start_time=start_time,
        end_time=end_time
    )
    assert len(time_filtered) == 1 