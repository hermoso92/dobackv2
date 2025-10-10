"""
Configuración de Gunicorn para DobackSoft V2.
"""
import multiprocessing
import os

# Configuración básica
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "gevent"
worker_connections = 1000
timeout = 30
keepalive = 2

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Procesamiento
max_requests = 1000
max_requests_jitter = 50
graceful_timeout = 30

# Seguridad
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Performance
backlog = 2048
worker_tmp_dir = "/dev/shm"

# SSL (si se usa)
# keyfile = "/etc/nginx/ssl/DobackSoft.key"
# certfile = "/etc/nginx/ssl/DobackSoft.crt"

# Preload
preload_app = True

def post_fork(server, worker):
    """
    Hook ejecutado después de crear un worker.
    """
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def pre_fork(server, worker):
    """
    Hook ejecutado antes de crear un worker.
    """
    pass

def pre_exec(server):
    """
    Hook ejecutado antes de reemplazar el proceso actual.
    """
    server.log.info("Forked child, re-executing.")

def when_ready(server):
    """
    Hook ejecutado cuando el servidor está listo.
    """
    server.log.info("Server is ready. Spawning workers")

# Procesos
daemon = False
pidfile = 'gunicorn.pid'
user = None
group = None
tmp_upload_dir = None

# Server mechanics
reload = False
reload_engine = 'auto'

# Server hooks
def on_starting(server):
    pass

def on_reload(server):
    pass

def on_exit(server):
    pass 