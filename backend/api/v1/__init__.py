"""
Blueprint principal de la API v1.
"""

from flask import Blueprint

def init_app(app):
    """Inicializa las rutas de la API."""
    # Importar los blueprints aquí para evitar importaciones circulares
    from . import auth
    from . import companies
    from . import fleets
    from . import vehicles
    from . import sessions
    from . import metrics
    from . import alarms
    from . import events
    from . import executive_dashboard
    from . import kpis
    from . import upload_hook
    
    # Registrar cada blueprint directamente en la aplicación
    app.register_blueprint(auth.bp, url_prefix='/api/v1/auth')
    app.register_blueprint(companies.bp, url_prefix='/api/v1/companies')
    app.register_blueprint(fleets.bp, url_prefix='/api/v1/fleets')
    app.register_blueprint(vehicles.bp, url_prefix='/api/v1/vehicles')
    app.register_blueprint(sessions.bp, url_prefix='/api/v1/sessions')
    app.register_blueprint(metrics.bp, url_prefix='/api/v1/metrics')
    app.register_blueprint(alarms.bp, url_prefix='/api/v1/alarms')
    app.register_blueprint(events.bp, url_prefix='/api/v1/events')
    app.register_blueprint(executive_dashboard.bp, url_prefix='/api/v1')
    app.register_blueprint(kpis.bp, url_prefix='/api/v1')
    app.register_blueprint(upload_hook.bp, url_prefix='/api/v1')

# Exportar los blueprints para que sean accesibles directamente
__all__ = ['auth', 'companies', 'fleets', 'vehicles', 'sessions', 'metrics', 'alarms', 'events', 'executive_dashboard', 'kpis', 'upload_hook', 'init_app'] 