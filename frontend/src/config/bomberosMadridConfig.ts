// Configuración específica para Bomberos Madrid
export const BOMBEROS_MADRID_CONFIG = {
    // Información de la organización
    organization: {
        id: 'bomberos-madrid-001',
        name: 'Bomberos Madrid',
        shortName: 'BM',
        logo: '/images/logo-bomberos-madrid.png',
        favicon: '/images/favicon.ico',
    },

    // Información de contacto
    contact: {
        email: 'soporte@bomberosmadrid.es',
        phone: '+34 91 123 45 67',
        address: 'Calle de la Bomba, 1, 28001 Madrid',
        website: 'https://www.bomberosmadrid.es',
        emergency: '080', // Número de emergencias
    },

    // Configuración de mapas
    map: {
        defaultCenter: {
            lat: 40.416775,
            lng: -3.703790,
        },
        defaultZoom: 12,
        bounds: {
            north: 40.5,
            south: 40.3,
            east: -3.6,
            west: -3.8,
        },
    },

    // Configuración de alertas
    alerts: {
        soundEnabled: true,
        vibrationEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        webhookEnabled: false,
        webhookUrl: '',
    },

    // Configuración de reportes
    reports: {
        defaultFormat: 'pdf',
        retentionDays: 180,
        includeCharts: true,
        includeMaps: true,
        includeEvents: true,
        includeTelemetry: true,
    },

    // Configuración de telemetría
    telemetry: {
        defaultDownsample: '5s',
        maxPointsPerSession: 10000,
        realTimeUpdateInterval: 5000, // 5 segundos
        historyDays: 30,
    },

    // Configuración de estabilidad
    stability: {
        defaultMetrics: ['LTR', 'SSF', 'DRS'],
        alertThresholds: {
            LTR: { warning: 0.8, critical: 0.6 },
            SSF: { warning: 1.2, critical: 1.0 },
            DRS: { warning: 0.8, critical: 0.6 },
        },
    },

    // Configuración de vehículos
    vehicles: {
        types: ['TRUCK', 'VAN', 'CAR', 'MOTORCYCLE'],
        statuses: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'EMERGENCY'],
        defaultStatus: 'ACTIVE',
    },

    // Configuración de eventos
    events: {
        types: [
            'FIRE',           // Incendio
            'MEDICAL',        // Médico
            'RESCUE',         // Rescate
            'HAZMAT',         // Materiales peligrosos
            'ROUTINE',        // Rutina
            'MAINTENANCE',    // Mantenimiento
        ],
        severities: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        defaultSeverity: 'MEDIUM',
    },

    // Configuración de zonas
    zones: {
        types: [
            'HIGH_RISK',      // Alto riesgo
            'HIGH_PRIORITY',  // Alta prioridad
            'RESTRICTED',     // Restringida
            'EMERGENCY',      // Emergencia
        ],
        defaultType: 'HIGH_RISK',
    },

    // Configuración de parques
    parks: {
        defaultType: 'FIRE_STATION',
        types: [
            'FIRE_STATION',   // Estación de bomberos
            'DEPOT',          // Depósito
            'TRAINING',       // Entrenamiento
            'ADMINISTRATIVE', // Administrativo
        ],
    },

    // Configuración de usuarios
    users: {
        roles: ['ADMIN', 'USER'],
        defaultRole: 'USER',
        statuses: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
        defaultStatus: 'ACTIVE',
    },

    // Configuración de sesiones
    sessions: {
        types: ['ROUTINE', 'EMERGENCY', 'TRAINING', 'MAINTENANCE'],
        defaultType: 'ROUTINE',
        statuses: ['ACTIVE', 'COMPLETED', 'ERROR'],
        defaultStatus: 'ACTIVE',
    },

    // Configuración de geocercas
    geofences: {
        types: ['POLYGON', 'CIRCLE'],
        defaultType: 'POLYGON',
        providers: ['RADAR', 'LOCAL'],
        defaultProvider: 'LOCAL',
    },

    // Configuración de notificaciones
    notifications: {
        types: [
            'EMERGENCY_ALERT',    // Alerta de emergencia
            'VEHICLE_STATUS',     // Estado del vehículo
            'MAINTENANCE_DUE',    // Mantenimiento pendiente
            'GEOFENCE_ENTER',     // Entrada a geocerca
            'GEOFENCE_EXIT',      // Salida de geocerca
            'SPEED_EXCEEDED',     // Velocidad excedida
        ],
        channels: ['EMAIL', 'SMS', 'PUSH', 'WEBHOOK'],
        defaultChannels: ['EMAIL', 'PUSH'],
    },

    // Configuración de dashboard
    dashboard: {
        defaultWidgets: [
            'vehicle_status',
            'emergency_alerts',
            'recent_events',
            'stability_metrics',
            'telemetry_map',
        ],
        refreshInterval: 30000, // 30 segundos
        maxWidgets: 12,
    },

    // Configuración de exportación
    export: {
        formats: ['PDF', 'CSV', 'JSON', 'GPX'],
        defaultFormat: 'PDF',
        maxRecords: 10000,
        compressionEnabled: true,
    },

    // Configuración de backup
    backup: {
        enabled: true,
        interval: 'daily',
        retention: 30, // días
        location: './backups',
        compression: true,
    },

    // Configuración de logs
    logging: {
        level: 'info',
        maxFiles: 10,
        maxSize: '10MB',
        location: './logs',
    },

    // Configuración de performance
    performance: {
        cacheEnabled: true,
        cacheTTL: 300, // 5 minutos
        compressionEnabled: true,
        paginationLimit: 50,
        maxConcurrentRequests: 10,
    },

    // Configuración de seguridad
    security: {
        sessionTimeout: 3600000, // 1 hora
        maxLoginAttempts: 5,
        lockoutDuration: 900000, // 15 minutos
        passwordMinLength: 8,
        requireSpecialChars: true,
        requireNumbers: true,
        requireUppercase: true,
    },

    // Configuración de integración
    integration: {
        radar: {
            enabled: true,
            apiKey: process.env.VITE_RADAR_PUBLISHABLE_KEY,
            baseUrl: 'https://api.radar.io/v1',
        },
        tomtom: {
            enabled: true,
            apiKey: process.env.VITE_TOMTOM_API_KEY,
            baseUrl: 'https://api.tomtom.com',
        },
        openai: {
            enabled: false, // Solo en backend
            model: 'gpt-3.5-turbo',
        },
    },

    // Configuración de desarrollo
    development: {
        debugMode: process.env.NODE_ENV === 'development',
        mockData: false,
        hotReload: true,
        sourceMaps: true,
    },
};

// Configuración de colores específicos
export const BOMBEROS_MADRID_COLORS = {
    primary: '#D32F2F',
    secondary: '#FFA000',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    text: {
        primary: '#212121',
        secondary: '#757575',
        disabled: '#BDBDBD',
    },
    emergency: {
        fire: '#D32F2F',
        medical: '#FF9800',
        rescue: '#2196F3',
        hazmat: '#9C27B0',
    },
    severity: {
        LOW: '#4CAF50',
        MEDIUM: '#FF9800',
        HIGH: '#FF5722',
        CRITICAL: '#D32F2F',
    },
    status: {
        ACTIVE: '#4CAF50',
        INACTIVE: '#9E9E9E',
        MAINTENANCE: '#FF9800',
        EMERGENCY: '#D32F2F',
    },
};

// Configuración de textos específicos
export const BOMBEROS_MADRID_TEXTS = {
    app: {
        name: 'DobackSoft - Bomberos Madrid',
        shortName: 'BM-DobackSoft',
        description: 'Sistema de gestión de vehículos y emergencias para Bomberos Madrid',
        version: '1.0.0',
    },
    navigation: {
        dashboard: 'Panel de Control',
        vehicles: 'Vehículos',
        telemetry: 'Telemetría',
        stability: 'Estabilidad',
        events: 'Eventos',
        reports: 'Reportes',
        settings: 'Configuración',
        profile: 'Perfil',
    },
    actions: {
        create: 'Crear',
        edit: 'Editar',
        delete: 'Eliminar',
        view: 'Ver',
        export: 'Exportar',
        import: 'Importar',
        generate: 'Generar',
        download: 'Descargar',
        upload: 'Subir',
        save: 'Guardar',
        cancel: 'Cancelar',
        confirm: 'Confirmar',
        search: 'Buscar',
        filter: 'Filtrar',
        sort: 'Ordenar',
    },
    messages: {
        success: {
            created: 'Creado exitosamente',
            updated: 'Actualizado exitosamente',
            deleted: 'Eliminado exitosamente',
            saved: 'Guardado exitosamente',
            exported: 'Exportado exitosamente',
            imported: 'Importado exitosamente',
        },
        error: {
            generic: 'Ha ocurrido un error',
            network: 'Error de conexión',
            validation: 'Datos inválidos',
            unauthorized: 'No autorizado',
            forbidden: 'Acceso denegado',
            notFound: 'No encontrado',
            server: 'Error del servidor',
        },
        warning: {
            unsavedChanges: 'Hay cambios sin guardar',
            confirmDelete: '¿Estás seguro de que quieres eliminar este elemento?',
            sessionExpired: 'Tu sesión ha expirado',
        },
        info: {
            loading: 'Cargando...',
            noData: 'No hay datos disponibles',
            selectItem: 'Selecciona un elemento',
            searchResults: 'Resultados de búsqueda',
        },
    },
};

export default BOMBEROS_MADRID_CONFIG;
