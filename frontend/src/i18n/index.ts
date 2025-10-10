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
        'auth.register': 'Registrarse'
    };

    return translations[key] || key;
};

// Export por defecto para compatibilidad
export default { t }; 