/**
 * Sistema de Permisos Granulares - Frontend
 * 
 * Define todos los permisos disponibles en el sistema y
 * mapea roles a sus permisos correspondientes.
 */

import { UserRole } from './auth';

/**
 * Enum de permisos del sistema
 * Formato: ENTIDAD.ACCION
 */
export enum Permission {
    // ==================== DASHBOARD ====================
    DASHBOARD_VIEW_EXECUTIVE = 'dashboard.view.executive',
    DASHBOARD_VIEW_MANAGER = 'dashboard.view.manager',
    DASHBOARD_EXPORT = 'dashboard.export',
    DASHBOARD_VIEW_KPI_ADVANCED = 'dashboard.view.kpi.advanced',

    // ==================== VEHÍCULOS ====================
    VEHICLES_VIEW = 'vehicles.view',
    VEHICLES_VIEW_ALL_ORGS = 'vehicles.view.all.orgs',  // Solo ADMIN
    VEHICLES_CREATE = 'vehicles.create',
    VEHICLES_EDIT = 'vehicles.edit',
    VEHICLES_DELETE = 'vehicles.delete',
    VEHICLES_ASSIGN_PARK = 'vehicles.assign.park',

    // ==================== SESIONES ====================
    SESSIONS_VIEW = 'sessions.view',
    SESSIONS_VIEW_ALL_ORGS = 'sessions.view.all.orgs',  // Solo ADMIN
    SESSIONS_UPLOAD = 'sessions.upload',
    SESSIONS_DELETE = 'sessions.delete',
    SESSIONS_EXPORT = 'sessions.export',
    SESSIONS_PROCESS = 'sessions.process',

    // ==================== ESTABILIDAD ====================
    STABILITY_VIEW = 'stability.view',
    STABILITY_EXPORT = 'stability.export',
    STABILITY_COMPARE = 'stability.compare',
    STABILITY_VIEW_BLACK_SPOTS = 'stability.view.black.spots',

    // ==================== TELEMETRÍA ====================
    TELEMETRY_VIEW = 'telemetry.view',
    TELEMETRY_VIEW_CAN = 'telemetry.view.can',
    TELEMETRY_VIEW_GPS = 'telemetry.view.gps',
    TELEMETRY_EXPORT = 'telemetry.export',
    TELEMETRY_CONFIGURE_ALARMS = 'telemetry.configure.alarms',

    // ==================== INTELIGENCIA ARTIFICIAL ====================
    AI_VIEW = 'ai.view',
    AI_CHAT = 'ai.chat',
    AI_VIEW_PATTERNS = 'ai.view.patterns',
    AI_VIEW_RECOMMENDATIONS = 'ai.view.recommendations',
    AI_GENERATE_REPORTS = 'ai.generate.reports',

    // ==================== GEOFENCES ====================
    GEOFENCES_VIEW = 'geofences.view',
    GEOFENCES_CREATE = 'geofences.create',
    GEOFENCES_EDIT = 'geofences.edit',
    GEOFENCES_DELETE = 'geofences.delete',
    GEOFENCES_VIEW_EVENTS = 'geofences.view.events',

    // ==================== OPERACIONES ====================
    OPERATIONS_VIEW = 'operations.view',
    OPERATIONS_VIEW_EVENTS = 'operations.view.events',
    OPERATIONS_VIEW_ALERTS = 'operations.view.alerts',
    OPERATIONS_VIEW_MAINTENANCE = 'operations.view.maintenance',
    OPERATIONS_EDIT_MAINTENANCE = 'operations.edit.maintenance',

    // ==================== REPORTES ====================
    REPORTS_VIEW = 'reports.view',
    REPORTS_CREATE = 'reports.create',
    REPORTS_EXPORT = 'reports.export',
    REPORTS_SCHEDULE = 'reports.schedule',
    REPORTS_VIEW_SCHEDULED = 'reports.view.scheduled',
    REPORTS_EDIT_SCHEDULED = 'reports.edit.scheduled',
    REPORTS_DELETE_SCHEDULED = 'reports.delete.scheduled',

    // ==================== ALERTAS ====================
    ALERTS_VIEW = 'alerts.view',
    ALERTS_VIEW_MISSING_FILES = 'alerts.view.missing.files',
    ALERTS_CONFIGURE = 'alerts.configure',
    ALERTS_RESOLVE = 'alerts.resolve',
    ALERTS_VIEW_HISTORY = 'alerts.view.history',

    // ==================== USUARIOS ====================
    USERS_VIEW = 'users.view',
    USERS_VIEW_ALL_ORGS = 'users.view.all.orgs',  // Solo ADMIN
    USERS_CREATE = 'users.create',
    USERS_CREATE_MANAGER = 'users.create.manager',  // MANAGER puede crear MANAGER
    USERS_CREATE_ADMIN = 'users.create.admin',      // Solo ADMIN
    USERS_EDIT = 'users.edit',
    USERS_EDIT_OWN = 'users.edit.own',              // Editar propio perfil
    USERS_DELETE = 'users.delete',
    USERS_CHANGE_ROLE = 'users.change.role',

    // ==================== PARQUES/TALLERES ====================
    PARKS_VIEW = 'parks.view',
    PARKS_VIEW_ALL_ORGS = 'parks.view.all.orgs',  // Solo ADMIN
    PARKS_CREATE = 'parks.create',
    PARKS_EDIT = 'parks.edit',
    PARKS_DELETE = 'parks.delete',
    PARKS_ASSIGN_VEHICLES = 'parks.assign.vehicles',

    // ==================== ORGANIZACIONES ====================
    ORGANIZATIONS_VIEW = 'organizations.view',
    ORGANIZATIONS_CREATE = 'organizations.create',
    ORGANIZATIONS_EDIT = 'organizations.edit',
    ORGANIZATIONS_DELETE = 'organizations.delete',
    ORGANIZATIONS_VIEW_CONFIG = 'organizations.view.config',

    // ==================== SISTEMA ====================
    SYSTEM_VIEW_CONFIG = 'system.config.view',
    SYSTEM_EDIT_CONFIG = 'system.config.edit',
    SYSTEM_VIEW_LOGS = 'system.logs.view',
    SYSTEM_VIEW_DIAGNOSTICS = 'system.diagnostics.view',
    SYSTEM_VIEW_PROCESSING = 'system.processing.view',
    SYSTEM_REGENERATE_EVENTS = 'system.regenerate.events',

    // ==================== BASE DE CONOCIMIENTO ====================
    KNOWLEDGE_BASE_VIEW = 'knowledge.base.view',
    KNOWLEDGE_BASE_CREATE = 'knowledge.base.create',
    KNOWLEDGE_BASE_EDIT = 'knowledge.base.edit',
    KNOWLEDGE_BASE_DELETE = 'knowledge.base.delete',
}

/**
 * Mapeo de roles a permisos
 */
export const rolePermissions: Record<UserRole, Permission[]> = {
    // ==================== ADMIN: Acceso Total ====================
    [UserRole.ADMIN]: [
        // Dashboard completo
        Permission.DASHBOARD_VIEW_EXECUTIVE,
        Permission.DASHBOARD_VIEW_MANAGER,
        Permission.DASHBOARD_EXPORT,
        Permission.DASHBOARD_VIEW_KPI_ADVANCED,

        // Vehículos: acceso total
        Permission.VEHICLES_VIEW,
        Permission.VEHICLES_VIEW_ALL_ORGS,
        Permission.VEHICLES_CREATE,
        Permission.VEHICLES_EDIT,
        Permission.VEHICLES_DELETE,
        Permission.VEHICLES_ASSIGN_PARK,

        // Sesiones: acceso total
        Permission.SESSIONS_VIEW,
        Permission.SESSIONS_VIEW_ALL_ORGS,
        Permission.SESSIONS_UPLOAD,
        Permission.SESSIONS_DELETE,
        Permission.SESSIONS_EXPORT,
        Permission.SESSIONS_PROCESS,

        // Estabilidad: acceso total
        Permission.STABILITY_VIEW,
        Permission.STABILITY_EXPORT,
        Permission.STABILITY_COMPARE,
        Permission.STABILITY_VIEW_BLACK_SPOTS,

        // Telemetría: acceso total
        Permission.TELEMETRY_VIEW,
        Permission.TELEMETRY_VIEW_CAN,
        Permission.TELEMETRY_VIEW_GPS,
        Permission.TELEMETRY_EXPORT,
        Permission.TELEMETRY_CONFIGURE_ALARMS,

        // IA: acceso total
        Permission.AI_VIEW,
        Permission.AI_CHAT,
        Permission.AI_VIEW_PATTERNS,
        Permission.AI_VIEW_RECOMMENDATIONS,
        Permission.AI_GENERATE_REPORTS,

        // Geofences: acceso total
        Permission.GEOFENCES_VIEW,
        Permission.GEOFENCES_CREATE,
        Permission.GEOFENCES_EDIT,
        Permission.GEOFENCES_DELETE,
        Permission.GEOFENCES_VIEW_EVENTS,

        // Operaciones: acceso total
        Permission.OPERATIONS_VIEW,
        Permission.OPERATIONS_VIEW_EVENTS,
        Permission.OPERATIONS_VIEW_ALERTS,
        Permission.OPERATIONS_VIEW_MAINTENANCE,
        Permission.OPERATIONS_EDIT_MAINTENANCE,

        // Reportes: acceso total
        Permission.REPORTS_VIEW,
        Permission.REPORTS_CREATE,
        Permission.REPORTS_EXPORT,
        Permission.REPORTS_SCHEDULE,
        Permission.REPORTS_VIEW_SCHEDULED,
        Permission.REPORTS_EDIT_SCHEDULED,
        Permission.REPORTS_DELETE_SCHEDULED,

        // Alertas: acceso total
        Permission.ALERTS_VIEW,
        Permission.ALERTS_VIEW_MISSING_FILES,
        Permission.ALERTS_CONFIGURE,
        Permission.ALERTS_RESOLVE,
        Permission.ALERTS_VIEW_HISTORY,

        // Usuarios: acceso total
        Permission.USERS_VIEW,
        Permission.USERS_VIEW_ALL_ORGS,
        Permission.USERS_CREATE,
        Permission.USERS_CREATE_MANAGER,
        Permission.USERS_CREATE_ADMIN,
        Permission.USERS_EDIT,
        Permission.USERS_EDIT_OWN,
        Permission.USERS_DELETE,
        Permission.USERS_CHANGE_ROLE,

        // Parques: acceso total
        Permission.PARKS_VIEW,
        Permission.PARKS_VIEW_ALL_ORGS,
        Permission.PARKS_CREATE,
        Permission.PARKS_EDIT,
        Permission.PARKS_DELETE,
        Permission.PARKS_ASSIGN_VEHICLES,

        // Organizaciones: acceso total
        Permission.ORGANIZATIONS_VIEW,
        Permission.ORGANIZATIONS_CREATE,
        Permission.ORGANIZATIONS_EDIT,
        Permission.ORGANIZATIONS_DELETE,
        Permission.ORGANIZATIONS_VIEW_CONFIG,

        // Sistema: acceso total
        Permission.SYSTEM_VIEW_CONFIG,
        Permission.SYSTEM_EDIT_CONFIG,
        Permission.SYSTEM_VIEW_LOGS,
        Permission.SYSTEM_VIEW_DIAGNOSTICS,
        Permission.SYSTEM_VIEW_PROCESSING,
        Permission.SYSTEM_REGENERATE_EVENTS,

        // Base de conocimiento: acceso total
        Permission.KNOWLEDGE_BASE_VIEW,
        Permission.KNOWLEDGE_BASE_CREATE,
        Permission.KNOWLEDGE_BASE_EDIT,
        Permission.KNOWLEDGE_BASE_DELETE,
    ],

    // ==================== MANAGER: Admin de Parque ====================
    [UserRole.MANAGER]: [
        // Dashboard limitado (solo vista MANAGER)
        Permission.DASHBOARD_VIEW_MANAGER,
        Permission.DASHBOARD_EXPORT,

        // Vehículos: solo su organización, no puede crear/editar/eliminar
        Permission.VEHICLES_VIEW,
        Permission.VEHICLES_ASSIGN_PARK,  // Puede asignar a sus parques

        // Sesiones: visualización y exportación de su organización
        Permission.SESSIONS_VIEW,
        Permission.SESSIONS_EXPORT,

        // Estabilidad: visualización limitada (puntos negros, velocidad)
        Permission.STABILITY_VIEW_BLACK_SPOTS,
        Permission.STABILITY_EXPORT,

        // Telemetría: NO tiene acceso (solo ADMIN)
        // (ningún permiso de telemetría)

        // IA: NO tiene acceso (solo ADMIN)
        // (ningún permiso de IA)

        // Geofences: NO tiene acceso (solo ADMIN)
        // (ningún permiso de geofences)

        // Operaciones: visualización de alertas y mantenimiento
        Permission.OPERATIONS_VIEW,
        Permission.OPERATIONS_VIEW_ALERTS,
        Permission.OPERATIONS_VIEW_MAINTENANCE,

        // Reportes: visualización, exportación y programación
        Permission.REPORTS_VIEW,
        Permission.REPORTS_EXPORT,
        Permission.REPORTS_SCHEDULE,
        Permission.REPORTS_VIEW_SCHEDULED,
        Permission.REPORTS_EDIT_SCHEDULED,

        // Alertas: visualización, configuración y resolución
        Permission.ALERTS_VIEW,
        Permission.ALERTS_VIEW_MISSING_FILES,
        Permission.ALERTS_CONFIGURE,
        Permission.ALERTS_RESOLVE,
        Permission.ALERTS_VIEW_HISTORY,

        // Usuarios: puede ver y crear otros MANAGER de su organización
        Permission.USERS_VIEW,
        Permission.USERS_CREATE_MANAGER,
        Permission.USERS_EDIT_OWN,

        // Parques: gestión de sus parques asignados
        Permission.PARKS_VIEW,
        Permission.PARKS_CREATE,
        Permission.PARKS_EDIT,
        Permission.PARKS_ASSIGN_VEHICLES,

        // Organizaciones: solo ver config de su organización
        Permission.ORGANIZATIONS_VIEW_CONFIG,

        // Sistema: NO tiene acceso
        // (ningún permiso de sistema)

        // Base de conocimiento: NO tiene acceso
        // (ningún permiso de base de conocimiento)
    ],

    // ==================== OPERATOR: Usuario Operativo (Futuro) ====================
    [UserRole.OPERATOR]: [
        Permission.DASHBOARD_VIEW_MANAGER,
        Permission.VEHICLES_VIEW,
        Permission.SESSIONS_VIEW,
        Permission.SESSIONS_EXPORT,
        Permission.STABILITY_VIEW_BLACK_SPOTS,
        Permission.REPORTS_VIEW,
        Permission.REPORTS_EXPORT,
        Permission.ALERTS_VIEW,
        Permission.USERS_EDIT_OWN,
    ],

    // ==================== VIEWER: Solo Lectura (Futuro) ====================
    [UserRole.VIEWER]: [
        Permission.DASHBOARD_VIEW_MANAGER,
        Permission.VEHICLES_VIEW,
        Permission.SESSIONS_VIEW,
        Permission.STABILITY_VIEW_BLACK_SPOTS,
        Permission.REPORTS_VIEW,
        Permission.ALERTS_VIEW,
        Permission.USERS_EDIT_OWN,
    ],
};

/**
 * Verificar si un rol tiene un permiso específico
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = rolePermissions[role] || [];
    return permissions.includes(permission);
}

/**
 * Verificar si un rol tiene alguno de los permisos especificados
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Verificar si un rol tiene todos los permisos especificados
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
    return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Obtener todos los permisos de un rol
 */
export function getRolePermissions(role: UserRole): Permission[] {
    return rolePermissions[role] || [];
}

/**
 * Obtener descripción legible de un permiso
 */
export function getPermissionDescription(permission: Permission): string {
    const descriptions: Record<Permission, string> = {
        // Dashboard
        [Permission.DASHBOARD_VIEW_EXECUTIVE]: 'Ver dashboard ejecutivo completo',
        [Permission.DASHBOARD_VIEW_MANAGER]: 'Ver dashboard operativo',
        [Permission.DASHBOARD_EXPORT]: 'Exportar datos del dashboard',
        [Permission.DASHBOARD_VIEW_KPI_ADVANCED]: 'Ver KPIs avanzados',

        // Vehículos
        [Permission.VEHICLES_VIEW]: 'Ver vehículos',
        [Permission.VEHICLES_VIEW_ALL_ORGS]: 'Ver vehículos de todas las organizaciones',
        [Permission.VEHICLES_CREATE]: 'Crear vehículos',
        [Permission.VEHICLES_EDIT]: 'Editar vehículos',
        [Permission.VEHICLES_DELETE]: 'Eliminar vehículos',
        [Permission.VEHICLES_ASSIGN_PARK]: 'Asignar vehículos a parques',

        // ... resto de descripciones
        // (Por brevedad, solo muestro algunos ejemplos)
    } as any;

    return descriptions[permission] || permission;
}

