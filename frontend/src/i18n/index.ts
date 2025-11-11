// Mock básico de i18n para desarrollo
export const t = (key: string, options?: any): string => {
    // Traducciones básicas en español
    const translations: Record<string, string> = {
        'dashboard.title': 'Dashboard',
        'dashboard.events': 'Eventos',
        'dashboard.vehicles': 'Vehículos',
        'dashboard.analysis': 'Análisis',
        'dashboard.timeline': 'Timeline',
        'events.critical': 'Crítico',
        'events.danger': 'Peligroso',
        'events.moderate': 'Moderado',
        'events.low': 'Bajo',
        'common.loading': 'Cargando...',
        'common.error': 'Error',
        'common.save': 'Guardar',
        'common.cancel': 'Cancelar',
        'common.delete': 'Eliminar',
        'common.edit': 'Editar',
        'auth.login': 'Iniciar sesión',
        'auth.logout': 'Cerrar sesión',
        'auth.register': 'Registrarse',
        // ... existing code ...
        'login_marketing_product': 'Sistema integral de estabilidad para flotas de emergencia',
        'login_feature_heading': 'Funcionalidades principales',
        'login_feat_monitor': 'Monitoreo en tiempo real de todos los vehículos',
        'login_feat_alerts': 'Alertas inteligentes y multicanal',
        'login_feat_reports': 'Reportes ejecutivos listos para compartir',
        'login_feat_security': 'Seguridad avanzada con cifrado extremo a extremo',
        'login_feat_access': 'Acceso controlado por roles y organización',
        'login_benefit_heading': 'Beneficios inmediatos',
        'login_benefit_efficiency': 'Incrementa la eficiencia operativa en cada intervención',
        'login_benefit_cost': 'Reduce costes mediante mantenimiento predictivo',
        'login_benefit_security': 'Protege la flota con telemetría certificada',
        'login_footer_text': 'DobackSoft: estabilidad operacional con inteligencia',
        'login_email': 'Correo electrónico',
        'login_password': 'Contraseña',
        'login_button': 'Iniciar sesión',
        // ... existing code ...
    };

    return translations[key] || key;
};

// Export por defecto para compatibilidad
export default { t }; 