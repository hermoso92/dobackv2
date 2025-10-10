import pytest
import os
import time
from datetime import datetime, timedelta
from src.app.services.deployment_manager import DeploymentManager, Deployment
from src.app.exceptions import DeploymentError

@pytest.fixture
def deployment_manager():
    config = {
        'deploy_dir': 'test_deployments',
        'backup_dir': 'test_backups',
        'environments': ['development', 'staging', 'production']
    }
    return DeploymentManager(config)

@pytest.fixture(autouse=True)
def cleanup():
    # Limpiar directorios de prueba
    yield
    for dir_name in ['test_deployments', 'test_backups']:
        if os.path.exists(dir_name):
            import shutil
            shutil.rmtree(dir_name)

def test_create_deployment(deployment_manager):
    # Crear despliegue
    config = {
        'scripts': ['echo "test"']
    }
    deployment = deployment_manager.create_deployment('1.0.0', 'development', config)
    
    # Verificar propiedades
    assert deployment.version == '1.0.0'
    assert deployment.environment == 'development'
    assert deployment.config == config
    assert deployment.status == 'pending'
    assert not deployment.metrics['success']
    
    # Verificar métricas
    assert deployment_manager.metrics['total_deployments'] == 1
    assert deployment_manager.metrics['environment_deployments']['development'] == 1

def test_create_deployment_invalid_environment(deployment_manager):
    # Intentar crear despliegue con ambiente inválido
    with pytest.raises(DeploymentError) as exc:
        deployment_manager.create_deployment('1.0.0', 'invalid', {})
    
    assert "Ambiente no válido" in str(exc.value)

def test_deploy(deployment_manager):
    # Crear despliegue
    config = {
        'scripts': ['echo "test"']
    }
    deployment = deployment_manager.create_deployment('1.0.0', 'development', config)
    
    # Ejecutar despliegue
    deployment_manager.deploy(deployment)
    
    # Verificar estado
    assert deployment.status == 'completed'
    assert deployment.metrics['success']
    assert deployment.metrics['start_time'] is not None
    assert deployment.metrics['end_time'] is not None
    assert deployment.metrics['duration'] is not None
    
    # Verificar métricas
    assert deployment_manager.metrics['successful_deployments'] == 1
    assert deployment_manager.metrics['failed_deployments'] == 0

def test_deploy_failed(deployment_manager):
    # Crear despliegue con script inválido
    config = {
        'scripts': ['invalid_command']
    }
    deployment = deployment_manager.create_deployment('1.0.0', 'development', config)
    
    # Intentar ejecutar despliegue
    with pytest.raises(DeploymentError):
        deployment_manager.deploy(deployment)
    
    # Verificar estado
    assert deployment.status == 'failed'
    assert not deployment.metrics['success']
    assert deployment.metrics['error'] is not None
    
    # Verificar métricas
    assert deployment_manager.metrics['successful_deployments'] == 0
    assert deployment_manager.metrics['failed_deployments'] == 1

def test_rollback(deployment_manager):
    # Crear despliegue
    config = {
        'scripts': ['echo "test"']
    }
    deployment = deployment_manager.create_deployment('1.0.0', 'development', config)
    
    # Ejecutar despliegue
    deployment_manager.deploy(deployment)
    
    # Crear backup manual
    backup_path = os.path.join(deployment_manager.backup_dir, deployment.version)
    os.makedirs(backup_path)
    with open(os.path.join(backup_path, 'test.txt'), 'w') as f:
        f.write('backup')
    
    # Revertir despliegue
    deployment_manager.rollback(deployment)
    
    # Verificar estado
    assert deployment.status == 'rolled_back'
    
    # Verificar que se restauró el backup
    deploy_path = os.path.join(deployment_manager.deploy_dir, deployment.version)
    assert os.path.exists(os.path.join(deploy_path, 'test.txt'))

def test_rollback_without_backup(deployment_manager):
    # Crear despliegue
    config = {
        'scripts': ['echo "test"']
    }
    deployment = deployment_manager.create_deployment('1.0.0', 'development', config)
    
    # Intentar revertir sin backup
    with pytest.raises(DeploymentError) as exc:
        deployment_manager.rollback(deployment)
    
    assert "No existe backup" in str(exc.value)

def test_get_deployments(deployment_manager):
    # Crear despliegues
    config = {
        'scripts': ['echo "test"']
    }
    deployment1 = deployment_manager.create_deployment('1.0.0', 'development', config)
    deployment2 = deployment_manager.create_deployment('1.0.1', 'staging', config)
    deployment3 = deployment_manager.create_deployment('1.0.2', 'production', config)
    
    # Ejecutar despliegues
    deployment_manager.deploy(deployment1)
    deployment_manager.deploy(deployment2)
    deployment_manager.deploy(deployment3)
    
    # Obtener todos los despliegues
    all_deployments = deployment_manager.get_deployments()
    assert len(all_deployments) == 3
    
    # Obtener despliegues por ambiente
    dev_deployments = deployment_manager.get_deployments(environment='development')
    assert len(dev_deployments) == 1
    assert dev_deployments[0].version == '1.0.0'
    
    # Obtener despliegues por estado
    completed_deployments = deployment_manager.get_deployments(status='completed')
    assert len(completed_deployments) == 3
    assert all(d.status == 'completed' for d in completed_deployments)

def test_get_deployments_with_time_range(deployment_manager):
    # Crear despliegues en diferentes tiempos
    config = {
        'scripts': ['echo "test"']
    }
    deployment1 = deployment_manager.create_deployment('1.0.0', 'development', config)
    deployment_manager.deploy(deployment1)
    
    time.sleep(1)
    start_time = datetime.now()
    
    deployment2 = deployment_manager.create_deployment('1.0.1', 'development', config)
    deployment_manager.deploy(deployment2)
    
    time.sleep(1)
    end_time = datetime.now()
    
    deployment3 = deployment_manager.create_deployment('1.0.2', 'development', config)
    deployment_manager.deploy(deployment3)
    
    # Obtener despliegues en rango de tiempo
    deployments = deployment_manager.get_deployments(
        start_time=start_time,
        end_time=end_time
    )
    assert len(deployments) == 1
    assert deployments[0].version == '1.0.1'

def test_get_deployment_stats(deployment_manager):
    # Crear despliegues
    config = {
        'scripts': ['echo "test"']
    }
    deployment1 = deployment_manager.create_deployment('1.0.0', 'development', config)
    deployment2 = deployment_manager.create_deployment('1.0.1', 'staging', config)
    deployment3 = deployment_manager.create_deployment('1.0.2', 'production', config)
    
    # Ejecutar despliegues
    deployment_manager.deploy(deployment1)
    deployment_manager.deploy(deployment2)
    
    # Fallar un despliegue
    with pytest.raises(DeploymentError):
        deployment_manager.deploy(deployment3)
    
    # Obtener estadísticas
    stats = deployment_manager.get_deployment_stats()
    
    # Verificar estadísticas
    assert stats['total_deployments'] == 3
    assert stats['successful_deployments'] == 2
    assert stats['failed_deployments'] == 1
    assert stats['environment_deployments']['development'] == 1
    assert stats['environment_deployments']['staging'] == 1
    assert stats['environment_deployments']['production'] == 1

def test_get_status(deployment_manager):
    # Obtener estado
    status = deployment_manager.get_status()
    
    # Verificar propiedades
    assert isinstance(status, dict)
    assert 'deploy_dir' in status
    assert 'backup_dir' in status
    assert 'environments' in status
    assert 'stats' in status 