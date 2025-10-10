import pytest
import os
import subprocess
from unittest.mock import Mock, patch
from src.app.deployment.setup import DeploymentSetup

@pytest.fixture
def deployment_setup():
    """Fixture para el gestor de despliegue."""
    return DeploymentSetup('test')

def test_init_deployment_setup(deployment_setup):
    """Prueba la inicialización del gestor de despliegue."""
    assert deployment_setup.environment == 'test'
    assert deployment_setup.root_dir.name == 'DobackSoft-V2-Organized'

def test_create_directories(deployment_setup):
    """Prueba la creación de directorios."""
    with patch('pathlib.Path.mkdir') as mock_mkdir:
        deployment_setup._create_directories()
        
        # Verificar que se llamó a mkdir para cada directorio
        assert mock_mkdir.call_count == 5
        mock_mkdir.assert_any_call(parents=True, exist_ok=True)

def test_install_dependencies(deployment_setup):
    """Prueba la instalación de dependencias."""
    with patch('subprocess.run') as mock_run:
        # Simular sistema Linux
        with patch('os.name', 'posix'):
            deployment_setup._install_dependencies()
            
            # Verificar llamadas a pip y apt-get
            mock_run.assert_any_call(
                ['pip', 'install', '-r', 'requirements.txt'],
                check=True
            )
            mock_run.assert_any_call(
                ['apt-get', 'update'],
                check=True
            )
            mock_run.assert_any_call(
                ['apt-get', 'install', '-y', 'postgresql', 'redis-server', 'nginx', 'supervisor'],
                check=True
            )

def test_setup_database(deployment_setup):
    """Prueba la configuración de la base de datos."""
    with patch('subprocess.run') as mock_run:
        deployment_setup._setup_database()
        
        # Verificar llamadas a psql
        mock_run.assert_any_call(
            ['sudo', '-u', 'postgres', 'psql', '-c', "CREATE USER DobackSoft WITH PASSWORD 'DobackSoft';"],
            check=True
        )
        mock_run.assert_any_call(
            ['sudo', '-u', 'postgres', 'psql', '-c', "CREATE DATABASE DobackSoft_test;"],
            check=True
        )
        mock_run.assert_any_call(
            ['sudo', '-u', 'postgres', 'psql', '-c', "GRANT ALL PRIVILEGES ON DATABASE DobackSoft_test TO DobackSoft;"],
            check=True
        )
        mock_run.assert_any_call(
            ['alembic', 'upgrade', 'head'],
            check=True
        )

def test_setup_services(deployment_setup):
    """Prueba la configuración de servicios."""
    with patch('builtins.open', Mock()) as mock_open, \
         patch('subprocess.run') as mock_run:
        
        deployment_setup._setup_services()
        
        # Verificar escritura de configuraciones
        assert mock_open.call_count == 2
        
        # Verificar reinicio de servicios
        mock_run.assert_any_call(['systemctl', 'restart', 'nginx'], check=True)
        mock_run.assert_any_call(['supervisorctl', 'reload'], check=True)

def test_setup_ssl(deployment_setup):
    """Prueba la configuración de SSL."""
    with patch('subprocess.run') as mock_run:
        deployment_setup._setup_ssl()
        
        # Verificar generación de certificado
        mock_run.assert_called_once()
        args = mock_run.call_args[0][0]
        assert args[0] == 'openssl'
        assert args[1] == 'req'
        assert args[2] == '-x509'
        assert args[3] == '-nodes'
        assert args[4] == '-days'
        assert args[5] == '365'
        assert args[6] == '-newkey'
        assert args[7] == 'rsa:2048'
        assert args[8] == '-keyout'
        assert args[9] == '/etc/ssl/private/DobackSoft.key'
        assert args[10] == '-out'
        assert args[11] == '/etc/ssl/certs/DobackSoft.crt'
        assert args[12] == '-subj'
        assert args[13] == '/CN=DobackSoft'

def test_generate_nginx_config(deployment_setup):
    """Prueba la generación de configuración de Nginx."""
    config = deployment_setup._generate_nginx_config()
    
    assert 'server {' in config
    assert 'listen 80;' in config
    assert 'server_name DobackSoft;' in config
    assert 'proxy_pass http://127.0.0.1:8000;' in config
    assert 'location /static {' in config
    assert 'location /media {' in config

def test_generate_supervisor_config(deployment_setup):
    """Prueba la generación de configuración de Supervisor."""
    config = deployment_setup._generate_supervisor_config()
    
    assert '[program:DobackSoft]' in config
    assert f'command=python {deployment_setup.root_dir}/app/main.py' in config
    assert f'directory={deployment_setup.root_dir}' in config
    assert 'user=DobackSoft' in config
    assert 'autostart=true' in config
    assert 'autorestart=true' in config
    assert 'stderr_logfile=/var/log/supervisor/DobackSoft.err.log' in config
    assert 'stdout_logfile=/var/log/supervisor/DobackSoft.out.log' in config
    assert 'environment=DobackSoft_ENV="test"' in config

def test_deploy(deployment_setup):
    """Prueba el despliegue completo."""
    with patch.object(deployment_setup.config_setup, 'generate_config') as mock_generate, \
         patch.object(deployment_setup.config_setup, 'validate_config') as mock_validate, \
         patch.object(deployment_setup.config_setup, 'save_config') as mock_save, \
         patch.object(deployment_setup, 'setup_environment') as mock_setup:
        
        # Configurar mocks
        mock_generate.return_value = {'test': 'config'}
        mock_validate.return_value = True
        
        # Ejecutar despliegue
        deployment_setup.deploy()
        
        # Verificar llamadas
        mock_generate.assert_called_once_with('test')
        mock_validate.assert_called_once_with({'test': 'config'})
        mock_save.assert_called_once_with({'test': 'config'})
        mock_setup.assert_called_once()

def test_deploy_invalid_config(deployment_setup):
    """Prueba el despliegue con configuración inválida."""
    with patch.object(deployment_setup.config_setup, 'generate_config') as mock_generate, \
         patch.object(deployment_setup.config_setup, 'validate_config') as mock_validate, \
         patch.object(deployment_setup.config_setup, 'save_config') as mock_save, \
         patch.object(deployment_setup, 'setup_environment') as mock_setup:
        
        # Configurar mocks
        mock_generate.return_value = {'test': 'config'}
        mock_validate.return_value = False
        
        # Ejecutar despliegue
        with pytest.raises(ValueError):
            deployment_setup.deploy()
        
        # Verificar que no se llamó a setup_environment
        mock_setup.assert_not_called() 