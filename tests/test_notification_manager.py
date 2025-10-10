import pytest
import os
import json
from unittest.mock import patch, MagicMock
from src.app.services.notification_manager import NotificationManager, Notification
from src.app.exceptions import NotificationManagerError

@pytest.fixture
def notification_manager():
    config = {
        'notifications_dir': 'test_notifications',
        'notifications_file': 'test_notifications.json',
        'max_notifications': 100,
        'smtp_host': 'smtp.test.com',
        'smtp_port': 587,
        'smtp_user': 'test@test.com',
        'smtp_password': 'test_password',
        'sms_api_key': 'test_sms_key',
        'sms_api_url': 'https://api.test.com/sms',
        'push_api_key': 'test_push_key',
        'push_api_url': 'https://api.test.com/push'
    }
    return NotificationManager(config)

@pytest.fixture(autouse=True)
def cleanup():
    yield
    # Limpiar archivos de test
    if os.path.exists('test_notifications'):
        for file in os.listdir('test_notifications'):
            os.remove(os.path.join('test_notifications', file))
        os.rmdir('test_notifications')

def test_init_notification_manager(notification_manager):
    # Verificar configuración
    assert notification_manager.notifications_dir == 'test_notifications'
    assert notification_manager.notifications_file == 'test_notifications.json'
    assert notification_manager.max_notifications == 100
    assert notification_manager.smtp_host == 'smtp.test.com'
    assert notification_manager.smtp_port == 587
    assert notification_manager.smtp_user == 'test@test.com'
    assert notification_manager.smtp_password == 'test_password'
    assert notification_manager.sms_api_key == 'test_sms_key'
    assert notification_manager.sms_api_url == 'https://api.test.com/sms'
    assert notification_manager.push_api_key == 'test_push_key'
    assert notification_manager.push_api_url == 'https://api.test.com/push'
    
    # Verificar que se creó el directorio
    assert os.path.exists('test_notifications')
    
    # Verificar métricas iniciales
    assert notification_manager.metrics['total_notifications'] == 0
    assert notification_manager.metrics['notifications_by_type'] == {}
    assert notification_manager.metrics['notifications_by_status']['pending'] == 0
    assert notification_manager.metrics['notifications_by_status']['sent'] == 0
    assert notification_manager.metrics['notifications_by_status']['failed'] == 0
    assert notification_manager.metrics['errors'] == 0

def test_load_notifications(notification_manager):
    # Crear archivo de notificaciones
    notifications_data = [
        {
            'type': 'email',
            'recipient': 'test@test.com',
            'subject': 'Test Subject',
            'content': 'Test Content',
            'data': {'key': 'value'},
            'timestamp': '2023-01-01T00:00:00',
            'status': 'sent'
        }
    ]
    
    os.makedirs('test_notifications', exist_ok=True)
    with open('test_notifications/test_notifications.json', 'w') as f:
        json.dump(notifications_data, f)
    
    # Cargar notificaciones
    notification_manager._load_notifications()
    
    # Verificar notificaciones
    assert len(notification_manager.notifications) == 1
    assert notification_manager.notifications[0].type == 'email'
    assert notification_manager.notifications[0].recipient == 'test@test.com'
    assert notification_manager.notifications[0].subject == 'Test Subject'
    assert notification_manager.notifications[0].content == 'Test Content'
    assert notification_manager.notifications[0].data == {'key': 'value'}
    assert notification_manager.notifications[0].status == 'sent'

def test_save_notifications(notification_manager):
    # Crear notificación
    notification = Notification('email', 'test@test.com', 'Test Subject', 'Test Content')
    notification.status = 'sent'
    notification_manager.notifications.append(notification)
    
    # Guardar notificaciones
    notification_manager._save_notifications()
    
    # Verificar archivo
    assert os.path.exists('test_notifications/test_notifications.json')
    
    with open('test_notifications/test_notifications.json', 'r') as f:
        notifications_data = json.load(f)
    
    assert len(notifications_data) == 1
    assert notifications_data[0]['type'] == 'email'
    assert notifications_data[0]['recipient'] == 'test@test.com'
    assert notifications_data[0]['subject'] == 'Test Subject'
    assert notifications_data[0]['content'] == 'Test Content'
    assert notifications_data[0]['status'] == 'sent'

def test_update_metrics(notification_manager):
    # Crear notificaciones
    notification1 = Notification('email', 'test1@test.com', 'Subject 1', 'Content 1')
    notification1.status = 'sent'
    notification2 = Notification('sms', '123456789', 'Subject 2', 'Content 2')
    notification2.status = 'pending'
    notification3 = Notification('push', 'user1', 'Subject 3', 'Content 3')
    notification3.status = 'failed'
    
    notification_manager.notifications = [notification1, notification2, notification3]
    
    # Actualizar métricas
    notification_manager._update_metrics()
    
    # Verificar métricas
    assert notification_manager.metrics['total_notifications'] == 3
    assert notification_manager.metrics['notifications_by_type']['email'] == 1
    assert notification_manager.metrics['notifications_by_type']['sms'] == 1
    assert notification_manager.metrics['notifications_by_type']['push'] == 1
    assert notification_manager.metrics['notifications_by_status']['sent'] == 1
    assert notification_manager.metrics['notifications_by_status']['pending'] == 1
    assert notification_manager.metrics['notifications_by_status']['failed'] == 1

@patch('smtplib.SMTP')
def test_send_email(mock_smtp, notification_manager):
    # Configurar mock
    mock_server = MagicMock()
    mock_smtp.return_value.__enter__.return_value = mock_server
    
    # Enviar email
    notification_manager.send_email(
        'test@test.com',
        'Test Subject',
        'Test Content',
        {'key': 'value'}
    )
    
    # Verificar que se llamó al servidor SMTP
    mock_server.starttls.assert_called_once()
    mock_server.login.assert_called_once_with(
        notification_manager.smtp_user,
        notification_manager.smtp_password
    )
    mock_server.send_message.assert_called_once()
    
    # Verificar notificación
    assert len(notification_manager.notifications) == 1
    assert notification_manager.notifications[0].type == 'email'
    assert notification_manager.notifications[0].recipient == 'test@test.com'
    assert notification_manager.notifications[0].subject == 'Test Subject'
    assert notification_manager.notifications[0].content == 'Test Content'
    assert notification_manager.notifications[0].data == {'key': 'value'}
    assert notification_manager.notifications[0].status == 'sent'

@patch('requests.post')
def test_send_sms(mock_post, notification_manager):
    # Configurar mock
    mock_response = MagicMock()
    mock_response.raise_for_status.return_value = None
    mock_post.return_value = mock_response
    
    # Enviar SMS
    notification_manager.send_sms(
        '123456789',
        'Test Content',
        {'key': 'value'}
    )
    
    # Verificar que se llamó a la API
    mock_post.assert_called_once_with(
        notification_manager.sms_api_url,
        json={
            'api_key': notification_manager.sms_api_key,
            'recipient': '123456789',
            'message': 'Test Content'
        }
    )
    
    # Verificar notificación
    assert len(notification_manager.notifications) == 1
    assert notification_manager.notifications[0].type == 'sms'
    assert notification_manager.notifications[0].recipient == '123456789'
    assert notification_manager.notifications[0].content == 'Test Content'
    assert notification_manager.notifications[0].data == {'key': 'value'}
    assert notification_manager.notifications[0].status == 'sent'

@patch('requests.post')
def test_send_push(mock_post, notification_manager):
    # Configurar mock
    mock_response = MagicMock()
    mock_response.raise_for_status.return_value = None
    mock_post.return_value = mock_response
    
    # Enviar push
    notification_manager.send_push(
        'user1',
        'Test Title',
        'Test Content',
        {'key': 'value'}
    )
    
    # Verificar que se llamó a la API
    mock_post.assert_called_once_with(
        notification_manager.push_api_url,
        json={
            'api_key': notification_manager.push_api_key,
            'recipient': 'user1',
            'title': 'Test Title',
            'content': 'Test Content',
            'data': {'key': 'value'}
        }
    )
    
    # Verificar notificación
    assert len(notification_manager.notifications) == 1
    assert notification_manager.notifications[0].type == 'push'
    assert notification_manager.notifications[0].recipient == 'user1'
    assert notification_manager.notifications[0].subject == 'Test Title'
    assert notification_manager.notifications[0].content == 'Test Content'
    assert notification_manager.notifications[0].data == {'key': 'value'}
    assert notification_manager.notifications[0].status == 'sent'

def test_get_notifications(notification_manager):
    # Crear notificaciones
    notification1 = Notification('email', 'test1@test.com', 'Subject 1', 'Content 1')
    notification1.status = 'sent'
    notification2 = Notification('sms', '123456789', 'Subject 2', 'Content 2')
    notification2.status = 'pending'
    notification3 = Notification('push', 'user1', 'Subject 3', 'Content 3')
    notification3.status = 'failed'
    
    notification_manager.notifications = [notification1, notification2, notification3]
    
    # Obtener notificaciones por tipo
    email_notifications = notification_manager.get_notifications(notification_type='email')
    assert len(email_notifications) == 1
    assert email_notifications[0].type == 'email'
    
    # Obtener notificaciones por estado
    sent_notifications = notification_manager.get_notifications(status='sent')
    assert len(sent_notifications) == 1
    assert sent_notifications[0].status == 'sent'
    
    # Obtener notificaciones por tipo y estado
    pending_sms = notification_manager.get_notifications(
        notification_type='sms',
        status='pending'
    )
    assert len(pending_sms) == 1
    assert pending_sms[0].type == 'sms'
    assert pending_sms[0].status == 'pending'

def test_get_notification_stats(notification_manager):
    # Crear notificaciones
    notification1 = Notification('email', 'test1@test.com', 'Subject 1', 'Content 1')
    notification1.status = 'sent'
    notification2 = Notification('sms', '123456789', 'Subject 2', 'Content 2')
    notification2.status = 'pending'
    notification3 = Notification('push', 'user1', 'Subject 3', 'Content 3')
    notification3.status = 'failed'
    
    notification_manager.notifications = [notification1, notification2, notification3]
    notification_manager._update_metrics()
    
    # Obtener estadísticas
    stats = notification_manager.get_notification_stats()
    
    # Verificar estadísticas
    assert stats['total_notifications'] == 3
    assert stats['notifications_by_type']['email'] == 1
    assert stats['notifications_by_type']['sms'] == 1
    assert stats['notifications_by_type']['push'] == 1
    assert stats['notifications_by_status']['sent'] == 1
    assert stats['notifications_by_status']['pending'] == 1
    assert stats['notifications_by_status']['failed'] == 1
    assert stats['errors'] == 0

def test_get_status(notification_manager):
    # Obtener estado
    status = notification_manager.get_status()
    
    # Verificar propiedades
    assert status['notifications_dir'] == 'test_notifications'
    assert status['notifications_file'] == 'test_notifications.json'
    assert status['max_notifications'] == 100
    assert status['smtp_host'] == 'smtp.test.com'
    assert status['smtp_port'] == 587
    assert status['sms_api_url'] == 'https://api.test.com/sms'
    assert status['push_api_url'] == 'https://api.test.com/push'
    assert 'metrics' in status

@patch('smtplib.SMTP')
def test_send_email_error(mock_smtp, notification_manager):
    # Configurar mock para lanzar error
    mock_smtp.side_effect = Exception("SMTP Error")
    
    # Intentar enviar email
    with pytest.raises(NotificationManagerError):
        notification_manager.send_email(
            'test@test.com',
            'Test Subject',
            'Test Content'
        )
    
    # Verificar métricas
    assert notification_manager.metrics['errors'] == 1

@patch('requests.post')
def test_send_sms_error(mock_post, notification_manager):
    # Configurar mock para lanzar error
    mock_post.side_effect = Exception("API Error")
    
    # Intentar enviar SMS
    with pytest.raises(NotificationManagerError):
        notification_manager.send_sms(
            '123456789',
            'Test Content'
        )
    
    # Verificar métricas
    assert notification_manager.metrics['errors'] == 1

@patch('requests.post')
def test_send_push_error(mock_post, notification_manager):
    # Configurar mock para lanzar error
    mock_post.side_effect = Exception("API Error")
    
    # Intentar enviar push
    with pytest.raises(NotificationManagerError):
        notification_manager.send_push(
            'user1',
            'Test Title',
            'Test Content'
        )
    
    # Verificar métricas
    assert notification_manager.metrics['errors'] == 1 