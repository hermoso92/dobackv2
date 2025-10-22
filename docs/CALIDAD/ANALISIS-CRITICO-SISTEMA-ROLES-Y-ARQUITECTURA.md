# 📊 ANÁLISIS CRÍTICO SISTEMA DOBACKSOFT
## Auditoría Completa: Frontend, Backend y Base de Datos

**Fecha:** 22 octubre 2025  
**Versión:** StabilSafe V3  
**Alcance:** Sistema completo de roles, permisos, arquitectura y optimizaciones

---

## 🎯 RESUMEN EJECUTIVO

### Problemas Críticos Identificados

1. **INCONSISTENCIA DE ROLES** (CRÍTICO ⚠️)
   - Backend define: `ADMIN | MANAGER | OPERATOR`
   - Frontend define: `ADMIN | USER | OPERATOR`
   - Base de datos: `ADMIN | USER | OPERATOR | VIEWER`
   - **Impacto:** Fallos de autorización, comportamiento impredecible

2. **FALTA DE SISTEMA DE PERMISOS GRANULARES** (ALTO ⚠️)
   - Solo validación binaria: `adminOnly = true/false`
   - No hay control fino por módulo/funcionalidad
   - MANAGER no tiene capacidades diferenciadas de ADMIN

3. **NAVEGACIÓN SIN CONTROL DE ROLES** (MEDIO ⚠️)
   - Todos los usuarios ven las mismas pestañas (excepto adminOnly)
   - No hay personalización por tipo de usuario
   - MANAGER debería tener vista limitada

4. **FALTA DE SISTEMA DE ALERTAS** (ALTO ⚠️)
   - No existe validación de archivos diarios faltantes
   - No hay notificaciones proactivas de errores
   - No se detectan patrones de fallos de subida

5. **REPORTES AUTOMÁTICOS INEXISTENTES** (ALTO ⚠️)
   - No hay generación programada de reportes
   - No existe sistema de cron jobs para reportes semanales
   - Filtros por rol no implementados

6. **MÓDULO DE ADMINISTRACIÓN INCOMPLETO** (MEDIO ⚠️)
   - No hay gestión de talleres/parques para MANAGER
   - MANAGER no puede crear usuarios subordinados
   - Falta perfil de "admin de parque"

---

## 🔍 ANÁLISIS DETALLADO

### 1. FRONTEND

#### 1.1 Estructura de Roles Actual

```typescript
// frontend/src/types/auth.ts
export type UserRole = 'ADMIN' | 'USER' | 'OPERATOR';
```

**❌ Problemas:**
- No incluye `MANAGER`
- Inconsistente con backend
- No permite extensibilidad futura

**✅ Solución Propuesta:**
```typescript
export enum UserRole {
  ADMIN = 'ADMIN',        // Acceso total al sistema
  MANAGER = 'MANAGER',    // Admin de parque/flota específica
  OPERATOR = 'OPERATOR',  // Usuario operativo básico (futuro)
  VIEWER = 'VIEWER'       // Solo lectura (futuro)
}
```

#### 1.2 Sistema de Navegación

**Estado Actual:**
```typescript
// frontend/src/components/Navigation.tsx (líneas 81-145)
const navItems: NavItem[] = [
  { text: 'Panel de Control', path: '/dashboard', icon: <DashboardIcon /> },
  { text: 'Estabilidad', path: '/stability', icon: <StabilityIcon /> },
  { text: 'Telemetría', path: '/telemetry', icon: <TelemetryIcon /> },
  { text: 'Inteligencia Artificial', path: '/ai', icon: <AIIcon /> },
  { text: 'Geofences', path: '/geofences', icon: <GeofenceIcon /> },
  { text: 'Subir Archivos', path: '/upload', icon: <CloudUploadIcon /> },
  { text: 'Operaciones', path: '/operations', icon: <OperationsIcon /> },
  { text: 'Reportes', path: '/reports', icon: <ReportIcon /> },
  { text: 'Gestión', path: '/administration', icon: <ManagementIcon />, adminOnly: true },
  { text: 'Administración', path: '/admin', icon: <AdminIcon />, adminOnly: true },
  { text: 'Base de Conocimiento', path: '/knowledge-base', icon: <KnowledgeIcon />, adminOnly: true },
  { text: 'Mi Cuenta', path: '/profile', icon: <AccountIcon /> }
];
```

**❌ Problemas:**
1. Sistema binario (adminOnly = true/false) - no escalable
2. No hay diferenciación entre ADMIN y MANAGER
3. Todos ven las mismas opciones
4. No hay agrupación lógica por roles

**✅ Solución Propuesta:**

```typescript
interface NavItem {
  text: string;
  path: string;
  icon: ReactElement;
  allowedRoles: UserRole[];  // ⭐ Array de roles permitidos
  requiredPermissions?: string[];  // ⭐ Permisos opcionales
}

const navItems: NavItem[] = [
  // ✅ TODOS LOS USUARIOS
  { 
    text: 'Panel de Control', 
    path: '/dashboard', 
    icon: <DashboardIcon />,
    allowedRoles: [UserRole.ADMIN, UserRole.MANAGER] 
  },
  
  // ✅ MANAGER: Solo pestañas específicas en Dashboard
  // Dashboard interno tiene sub-navegación propia
  
  // ✅ SOLO ADMIN
  { 
    text: 'Estabilidad', 
    path: '/stability', 
    icon: <StabilityIcon />,
    allowedRoles: [UserRole.ADMIN]
  },
  { 
    text: 'Telemetría', 
    path: '/telemetry', 
    icon: <TelemetryIcon />,
    allowedRoles: [UserRole.ADMIN]
  },
  { 
    text: 'Inteligencia Artificial', 
    path: '/ai', 
    icon: <AIIcon />,
    allowedRoles: [UserRole.ADMIN]
  },
  { 
    text: 'Geofences', 
    path: '/geofences', 
    icon: <GeofenceIcon />,
    allowedRoles: [UserRole.ADMIN]
  },
  { 
    text: 'Subir Archivos', 
    path: '/upload', 
    icon: <CloudUploadIcon />,
    allowedRoles: [UserRole.ADMIN]
  },
  { 
    text: 'Operaciones', 
    path: '/operations', 
    icon: <OperationsIcon />,
    allowedRoles: [UserRole.ADMIN]
  },
  
  // ✅ ADMIN Y MANAGER (con permisos diferentes internamente)
  { 
    text: 'Reportes', 
    path: '/reports', 
    icon: <ReportIcon />,
    allowedRoles: [UserRole.ADMIN, UserRole.MANAGER]
  },
  { 
    text: 'Alertas', 
    path: '/alerts', 
    icon: <BellIcon />,
    allowedRoles: [UserRole.ADMIN, UserRole.MANAGER]
  },
  { 
    text: 'Administración', 
    path: '/administration', 
    icon: <ManagementIcon />,
    allowedRoles: [UserRole.ADMIN, UserRole.MANAGER]  // ⭐ Diferente contenido por rol
  },
  
  // ✅ SOLO ADMIN
  { 
    text: 'Configuración Sistema', 
    path: '/admin', 
    icon: <AdminIcon />,
    allowedRoles: [UserRole.ADMIN]
  },
  { 
    text: 'Base de Conocimiento', 
    path: '/knowledge-base', 
    icon: <KnowledgeIcon />,
    allowedRoles: [UserRole.ADMIN]
  },
  
  // ✅ TODOS
  { 
    text: 'Mi Cuenta', 
    path: '/profile', 
    icon: <AccountIcon />,
    allowedRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.VIEWER]
  }
];

// Función de filtrado mejorada
const getFilteredNavItems = (userRole: UserRole) => {
  return navItems.filter(item => item.allowedRoles.includes(userRole));
};
```

#### 1.3 Dashboard - Pestañas para MANAGER

**Requerimiento del Usuario:**
> MANAGER solo ve Dashboard con las pestañas:
> - Estados & Tiempos
> - Puntos Negros
> - Velocidad
> - Sesiones & Recorridos
> - Sistema de Alertas
> - Gestión de Reportes Automáticos
> - Exportar Reporte Detallado

**✅ Implementación Propuesta:**

```typescript
// frontend/src/pages/UnifiedDashboard.tsx

interface DashboardTab {
  id: string;
  label: string;
  icon: ReactElement;
  component: React.ComponentType;
  allowedRoles: UserRole[];
}

const dashboardTabs: DashboardTab[] = [
  // ✅ ADMIN: Ve TODOS los KPIs ejecutivos
  {
    id: 'executive-kpis',
    label: 'KPIs Ejecutivos',
    icon: <DashboardIcon />,
    component: NewExecutiveKPIDashboard,
    allowedRoles: [UserRole.ADMIN]
  },
  
  // ✅ MANAGER: Pestañas operativas
  {
    id: 'estados-tiempos',
    label: 'Estados & Tiempos',
    icon: <ClockIcon />,
    component: EstadosYTiemposTab,  // ⭐ NUEVO
    allowedRoles: [UserRole.MANAGER]
  },
  {
    id: 'puntos-negros',
    label: 'Puntos Negros',
    icon: <AlertIcon />,
    component: BlackSpotsTab,
    allowedRoles: [UserRole.MANAGER]
  },
  {
    id: 'velocidad',
    label: 'Velocidad',
    icon: <SpeedIcon />,
    component: SpeedAnalysisTab,
    allowedRoles: [UserRole.MANAGER]
  },
  {
    id: 'sesiones-recorridos',
    label: 'Sesiones & Recorridos',
    icon: <MapIcon />,
    component: SessionsAndRoutesView,
    allowedRoles: [UserRole.MANAGER]
  },
  {
    id: 'alertas',
    label: 'Sistema de Alertas',
    icon: <BellIcon />,
    component: AlertSystemManager,  // ⭐ NUEVO
    allowedRoles: [UserRole.MANAGER]
  },
  {
    id: 'reportes-automaticos',
    label: 'Reportes Automáticos',
    icon: <ReportIcon />,
    component: AutomaticReportsManager,  // ⭐ NUEVO
    allowedRoles: [UserRole.MANAGER]
  }
];

const UnifiedDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  
  // Filtrar pestañas por rol
  const availableTabs = dashboardTabs.filter(tab => 
    tab.allowedRoles.includes(user?.role as UserRole)
  );
  
  // Renderizar
  return (
    <FilteredPageWrapper>
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
        {availableTabs.map((tab, index) => (
          <Tab 
            key={tab.id} 
            label={tab.label} 
            icon={tab.icon} 
            iconPosition="start" 
          />
        ))}
      </Tabs>
      
      {availableTabs.map((tab, index) => (
        <TabPanel key={tab.id} value={activeTab} index={index}>
          <tab.component />
        </TabPanel>
      ))}
    </FilteredPageWrapper>
  );
};
```

#### 1.4 Sistema de Permisos Granulares

**✅ Crear utilidad de permisos:**

```typescript
// frontend/src/utils/permissions.ts

export enum Permission {
  // Dashboard
  VIEW_EXECUTIVE_DASHBOARD = 'dashboard.view.executive',
  VIEW_MANAGER_DASHBOARD = 'dashboard.view.manager',
  EXPORT_DASHBOARD = 'dashboard.export',
  
  // Vehículos
  VIEW_VEHICLES = 'vehicles.view',
  CREATE_VEHICLES = 'vehicles.create',
  EDIT_VEHICLES = 'vehicles.edit',
  DELETE_VEHICLES = 'vehicles.delete',
  
  // Sesiones
  VIEW_SESSIONS = 'sessions.view',
  UPLOAD_SESSIONS = 'sessions.upload',
  DELETE_SESSIONS = 'sessions.delete',
  EXPORT_SESSIONS = 'sessions.export',
  
  // Reportes
  VIEW_REPORTS = 'reports.view',
  CREATE_REPORTS = 'reports.create',
  SCHEDULE_REPORTS = 'reports.schedule',
  EXPORT_REPORTS = 'reports.export',
  
  // Alertas
  VIEW_ALERTS = 'alerts.view',
  CREATE_ALERTS = 'alerts.create',
  CONFIGURE_ALERTS = 'alerts.configure',
  
  // Usuarios
  VIEW_USERS = 'users.view',
  CREATE_USERS = 'users.create',
  EDIT_USERS = 'users.edit',
  DELETE_USERS = 'users.delete',
  
  // Talleres/Parques
  VIEW_PARKS = 'parks.view',
  CREATE_PARKS = 'parks.create',
  EDIT_PARKS = 'parks.edit',
  DELETE_PARKS = 'parks.delete',
  
  // Sistema
  VIEW_SYSTEM_CONFIG = 'system.config.view',
  EDIT_SYSTEM_CONFIG = 'system.config.edit',
  VIEW_LOGS = 'system.logs.view',
  VIEW_DIAGNOSTICS = 'system.diagnostics.view'
}

// Mapeo de roles a permisos
export const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // ✅ ADMIN tiene TODOS los permisos
    ...Object.values(Permission)
  ],
  
  [UserRole.MANAGER]: [
    // Dashboard limitado
    Permission.VIEW_MANAGER_DASHBOARD,
    Permission.EXPORT_DASHBOARD,
    
    // Vehículos (solo su organización)
    Permission.VIEW_VEHICLES,
    
    // Sesiones (solo su organización)
    Permission.VIEW_SESSIONS,
    Permission.EXPORT_SESSIONS,
    
    // Reportes
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.SCHEDULE_REPORTS,
    
    // Alertas
    Permission.VIEW_ALERTS,
    Permission.CONFIGURE_ALERTS,
    
    // Usuarios (solo crear MANAGER de su organización)
    Permission.VIEW_USERS,
    Permission.CREATE_USERS,  // Solo MANAGER
    
    // Talleres/Parques de su organización
    Permission.VIEW_PARKS,
    Permission.CREATE_PARKS,
    Permission.EDIT_PARKS
  ],
  
  [UserRole.OPERATOR]: [
    Permission.VIEW_MANAGER_DASHBOARD,
    Permission.VIEW_VEHICLES,
    Permission.VIEW_SESSIONS,
    Permission.VIEW_REPORTS,
    Permission.VIEW_ALERTS
  ],
  
  [UserRole.VIEWER]: [
    Permission.VIEW_MANAGER_DASHBOARD,
    Permission.VIEW_VEHICLES,
    Permission.VIEW_SESSIONS,
    Permission.VIEW_REPORTS
  ]
};

// Hook personalizado para permisos
export const usePermissions = () => {
  const { user } = useAuth();
  
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    return rolePermissions[user.role as UserRole]?.includes(permission) ?? false;
  }, [user]);
  
  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    return permissions.some(p => hasPermission(p));
  }, [hasPermission]);
  
  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    return permissions.every(p => hasPermission(p));
  }, [hasPermission]);
  
  return { hasPermission, hasAnyPermission, hasAllPermissions };
};

// Componente de protección por permiso
export const PermissionGuard: React.FC<{
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ permission, fallback = null, children }) => {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};
```

---

### 2. BACKEND

#### 2.1 Inconsistencia de Roles

**Estado Actual:**

```typescript
// backend/src/types/domain.ts (línea 67)
export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATOR';

// backend/src/types/domain.ts (línea 86)
role: 'ADMIN' | 'USER' | 'OPERATOR' | 'VIEWER';  // ❌ INCONSISTENTE
```

**✅ Solución:**

```typescript
// backend/src/types/domain.ts
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  OPERATOR = 'OPERATOR',
  VIEWER = 'VIEWER'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;  // ✅ Usar enum
  status: string;
  organizationId: string;
  isEmailVerified: boolean;
}
```

#### 2.2 Middleware de Autorización

**Estado Actual:**

```typescript
// backend/src/middleware/auth.ts (líneas 152-165)
export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Usuario no autenticado', 401);
    }
    
    const hasRole = roles.includes(req.user.role);
    if (!hasRole) {
      throw new AppError('No tiene permisos para realizar esta acción', 403);
    }
    
    next();
  };
};
```

**❌ Problemas:**
- Solo valida roles, no permisos granulares
- No valida organizationId para MANAGER
- No hay logging detallado de intentos fallidos

**✅ Solución Mejorada:**

```typescript
// backend/src/middleware/authorization.ts

import { Request, Response, NextFunction } from 'express';
import { UserRole, Permission } from '../types/domain';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

// Mapeo de roles a permisos (idéntico al frontend)
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),
  [UserRole.MANAGER]: [
    Permission.VIEW_MANAGER_DASHBOARD,
    Permission.VIEW_VEHICLES,
    Permission.VIEW_SESSIONS,
    Permission.EXPORT_SESSIONS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.SCHEDULE_REPORTS,
    Permission.VIEW_ALERTS,
    Permission.CONFIGURE_ALERTS,
    Permission.VIEW_USERS,
    Permission.CREATE_USERS,
    Permission.VIEW_PARKS,
    Permission.CREATE_PARKS,
    Permission.EDIT_PARKS
  ],
  // ... resto de roles
};

// Middleware por rol
export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'No autenticado');
      }
      
      if (!roles.includes(req.user.role as UserRole)) {
        logger.warn('Acceso denegado por rol', {
          userId: req.user.id,
          requiredRoles: roles,
          userRole: req.user.role,
          path: req.path,
          method: req.method
        });
        throw new AppError(403, 'No tiene permisos para realizar esta acción');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware por permiso (NUEVO)
export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'No autenticado');
      }
      
      const userPermissions = rolePermissions[req.user.role as UserRole] || [];
      
      if (!userPermissions.includes(permission)) {
        logger.warn('Acceso denegado por permiso', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredPermission: permission,
          path: req.path,
          method: req.method
        });
        throw new AppError(403, 'No tiene permisos para realizar esta acción');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware de validación de organización para MANAGER
export const requireOrganizationAccess = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'No autenticado');
      }
      
      // ADMIN puede acceder a cualquier organización
      if (req.user.role === UserRole.ADMIN) {
        return next();
      }
      
      // MANAGER solo puede acceder a su organización
      const requestedOrgId = req.params.organizationId || req.body.organizationId || req.query.organizationId;
      
      if (requestedOrgId && requestedOrgId !== req.user.organizationId) {
        logger.warn('Intento de acceso a organización no autorizada', {
          userId: req.user.id,
          userRole: req.user.role,
          userOrganizationId: req.user.organizationId,
          requestedOrganizationId: requestedOrgId,
          path: req.path
        });
        throw new AppError(403, 'No tiene acceso a esta organización');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

#### 2.3 Actualización de Rutas

**✅ Ejemplo de aplicación:**

```typescript
// backend/src/routes/vehicles.ts

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole, requirePermission, requireOrganizationAccess } from '../middleware/authorization';
import { VehicleController } from '../controllers/VehicleController';
import { UserRole, Permission } from '../types/domain';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Listar vehículos - ADMIN y MANAGER (solo su organización)
router.get('/', 
  requireRole([UserRole.ADMIN, UserRole.MANAGER]),
  requireOrganizationAccess(),
  VehicleController.list
);

// Crear vehículo - Solo ADMIN
router.post('/', 
  requirePermission(Permission.CREATE_VEHICLES),
  VehicleController.create
);

// Editar vehículo - Solo ADMIN
router.put('/:id', 
  requirePermission(Permission.EDIT_VEHICLES),
  VehicleController.update
);

// Eliminar vehículo - Solo ADMIN
router.delete('/:id', 
  requirePermission(Permission.DELETE_VEHICLES),
  VehicleController.delete
);

export default router;
```

---

### 3. BASE DE DATOS

#### 3.1 Esquema Prisma - Correcciones

**Estado Actual:**

```prisma
// backend/prisma/schema.prisma (líneas 1280-1285)
enum UserRole {
  ADMIN
  USER
  OPERATOR
  VIEWER
}
```

**✅ Corrección:**

```prisma
enum UserRole {
  ADMIN
  MANAGER    // ⭐ AÑADIR
  OPERATOR
  VIEWER
}
```

#### 3.2 Modelo User - Mejoras

**✅ Añadir campos para permisos y gestión:**

```prisma
model User {
  id                String              @id @default(dbgenerated("gen_random_uuid()"))
  email             String              @unique
  name              String
  password          String
  organizationId    String?
  createdAt         DateTime            @default(now())
  updatedAt         DateTime
  role              UserRole            @default(VIEWER)
  status            String              @default("ACTIVE")
  
  // ⭐ NUEVOS CAMPOS
  permissions       String[]            @default([])  // Permisos adicionales específicos
  managedParks      String[]            @default([])  // IDs de parques que gestiona (para MANAGER)
  lastLoginAt       DateTime?                         // Último acceso
  passwordChangedAt DateTime?                         // Última modificación de contraseña
  failedLoginAttempts Int               @default(0)   // Intentos fallidos
  lockedUntil       DateTime?                         // Bloqueo temporal
  
  // Relaciones existentes
  GestorDeEvento    GestorDeEvento[]
  InformeGenerado   InformeGenerado[]
  LogAuditoria      LogAuditoria[]
  MaintenanceRecord MaintenanceRecord[]
  Notification      Notification[]
  Report            Report[]
  Session           Session[]
  SessionUploadLog  SessionUploadLog[]
  organization      Organization?       @relation(fields: [organizationId], references: [id])
  UserConfig        UserConfig?
  Vehicle           Vehicle[]
  ZoneAudit         ZoneAudit[]
  
  @@index([email])
  @@index([organizationId, role])
  @@index([status])
}
```

#### 3.3 Nueva Tabla: ScheduledReports

**✅ Para reportes automáticos semanales:**

```prisma
model ScheduledReport {
  id                String         @id @default(dbgenerated("gen_random_uuid()"))
  userId            String
  organizationId    String
  name              String
  description       String?
  
  // Configuración de programación
  frequency         ReportFrequency  // DAILY, WEEKLY, MONTHLY
  dayOfWeek         Int?            // 0-6 (para WEEKLY)
  dayOfMonth        Int?            // 1-31 (para MONTHLY)
  timeOfDay         String          // "08:00" formato HH:mm
  timezone          String          @default("Europe/Madrid")
  
  // Configuración de filtros
  filters           Json            // Filtros aplicados al reporte
  reportType        ReportType      // STABILITY, CAN_GPS, AI, etc.
  format            ReportFormat    // PDF, EXCEL, CSV
  
  // Destinatarios
  recipients        String[]        // Emails
  
  // Estado
  isActive          Boolean         @default(true)
  lastRunAt         DateTime?
  nextRunAt         DateTime
  lastStatus        String?         // SUCCESS, FAILED, RUNNING
  
  // Auditoría
  createdAt         DateTime        @default(now())
  updatedAt         DateTime
  createdBy         String
  
  User              User            @relation(fields: [userId], references: [id])
  Organization      Organization    @relation(fields: [organizationId], references: [id])
  CreatedByUser     User            @relation("CreatedScheduledReports", fields: [createdBy], references: [id])
  
  @@index([organizationId, isActive])
  @@index([nextRunAt])
}

enum ReportFrequency {
  DAILY
  WEEKLY
  MONTHLY
  CUSTOM
}
```

#### 3.4 Nueva Tabla: MissingFileAlerts

**✅ Para sistema de alertas de archivos faltantes:**

```prisma
model MissingFileAlert {
  id                String         @id @default(dbgenerated("gen_random_uuid()"))
  organizationId    String
  vehicleId         String
  date              DateTime       // Fecha del día que falta
  
  // Archivos esperados
  expectedFiles     String[]       // ["CAN", "ESTABILIDAD", "GPS", "ROTATIVO"]
  missingFiles      String[]       // ["GPS"] - archivos que no se subieron
  uploadedFiles     String[]       // ["CAN", "ESTABILIDAD", "ROTATIVO"]
  
  // Estado
  status            AlertStatus    @default(PENDING)
  severity          AlertSeverity  // INFO, WARNING, ERROR, CRITICAL
  
  // Notificación
  notifiedAt        DateTime?
  notifiedUsers     String[]       // IDs de usuarios notificados
  
  // Resolución
  resolvedAt        DateTime?
  resolvedBy        String?
  resolutionNotes   String?
  
  // Auditoría
  createdAt         DateTime       @default(now())
  updatedAt         DateTime
  
  Organization      Organization   @relation(fields: [organizationId], references: [id])
  Vehicle           Vehicle        @relation(fields: [vehicleId], references: [id])
  ResolvedByUser    User?          @relation(fields: [resolvedBy], references: [id])
  
  @@index([organizationId, date, status])
  @@index([vehicleId, date])
  @@unique([organizationId, vehicleId, date])
}

enum AlertStatus {
  PENDING
  NOTIFIED
  ACKNOWLEDGED
  RESOLVED
  IGNORED
}

enum AlertSeverity {
  INFO
  WARNING
  ERROR
  CRITICAL
}
```

#### 3.5 Migración de Datos

**✅ Script SQL para actualizar usuarios existentes:**

```sql
-- database/migrations/001_update_user_roles_to_manager.sql

-- Actualizar USER a MANAGER en usuarios con organizationId
UPDATE "User"
SET role = 'MANAGER'
WHERE role = 'USER' 
  AND "organizationId" IS NOT NULL
  AND "organizationId" != '';

-- Log de cambios
INSERT INTO "LogAuditoria" (
  "id",
  "userId",
  "action",
  "entityType",
  "entityId",
  "changes",
  "timestamp"
)
SELECT 
  gen_random_uuid(),
  id,
  'ROLE_MIGRATION',
  'User',
  id,
  jsonb_build_object(
    'oldRole', 'USER',
    'newRole', 'MANAGER',
    'reason', 'Sistema de roles actualizado - USER convertido a MANAGER'
  ),
  NOW()
FROM "User"
WHERE role = 'MANAGER' 
  AND "organizationId" IS NOT NULL;

-- Verificación
SELECT 
  role,
  COUNT(*) as total,
  COUNT(CASE WHEN "organizationId" IS NOT NULL THEN 1 END) as with_org,
  COUNT(CASE WHEN "organizationId" IS NULL THEN 1 END) as without_org
FROM "User"
GROUP BY role;
```

---

### 4. NUEVOS COMPONENTES NECESARIOS

#### 4.1 EstadosYTiemposTab (NUEVO)

**Funcionalidad:**
- Mostrar estados operacionales del vehículo (parque, taller, emergencia, incendio, regreso)
- Gráficos de distribución de tiempo
- Listado de eventos por estado
- Exportación a PDF

**Ubicación:** `frontend/src/components/dashboard/EstadosYTiemposTab.tsx`

#### 4.2 AlertSystemManager (NUEVO)

**Funcionalidad:**
- Dashboard de alertas de archivos faltantes
- Lista de vehículos con archivos pendientes
- Notificaciones configurables (email, push)
- Resolución manual de alertas
- Historial de alertas

**Ubicación:** `frontend/src/components/alerts/AlertSystemManager.tsx`

#### 4.3 AutomaticReportsManager (NUEVO)

**Funcionalidad:**
- CRUD de reportes programados
- Configuración de frecuencia (diaria, semanal, mensual)
- Selección de destinatarios
- Filtros personalizables
- Historial de ejecuciones
- Reenvío manual

**Ubicación:** `frontend/src/components/reports/AutomaticReportsManager.tsx`

#### 4.4 ManagerAdministration (NUEVO)

**Funcionalidad:**
- Editar perfil propio
- Gestionar talleres/parques asignados
- Crear usuarios MANAGER subordinados (misma organización)
- Ver logs de acciones
- Configurar notificaciones

**Ubicación:** `frontend/src/pages/ManagerAdministration.tsx`

---

### 5. SERVICIOS BACKEND NECESARIOS

#### 5.1 AlertService

**Ubicación:** `backend/src/services/AlertService.ts`

**Funcionalidades:**
- Detectar archivos faltantes del día anterior
- Crear alertas automáticamente
- Enviar notificaciones (email, push)
- Resolver alertas
- Generar estadísticas de archivos faltantes

**Ejemplo:**

```typescript
// backend/src/services/AlertService.ts

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { EmailService } from './EmailService';

const prisma = new PrismaClient();

export class AlertService {
  /**
   * Verificar archivos faltantes del día anterior
   * Ejecutar diariamente a las 08:00 AM
   */
  static async checkMissingFiles() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      
      logger.info('Verificando archivos faltantes', { date: yesterday });
      
      // Obtener todos los vehículos activos
      const vehicles = await prisma.vehicle.findMany({
        where: { active: true },
        include: { Organization: true }
      });
      
      const alerts: any[] = [];
      
      for (const vehicle of vehicles) {
        const expectedFiles = ['CAN', 'ESTABILIDAD', 'GPS', 'ROTATIVO'];
        
        // Verificar archivos subidos ayer
        const uploadedFiles = await prisma.archivoSubido.findMany({
          where: {
            vehicleId: vehicle.id,
            uploadedAt: {
              gte: yesterday,
              lte: endOfYesterday
            }
          },
          select: { fileType: true }
        });
        
        const uploadedTypes = [...new Set(uploadedFiles.map(f => f.fileType))];
        const missingTypes = expectedFiles.filter(type => !uploadedTypes.includes(type));
        
        if (missingTypes.length > 0) {
          // Crear o actualizar alerta
          const alert = await prisma.missingFileAlert.upsert({
            where: {
              organizationId_vehicleId_date: {
                organizationId: vehicle.organizationId,
                vehicleId: vehicle.id,
                date: yesterday
              }
            },
            update: {
              missingFiles: missingTypes,
              uploadedFiles: uploadedTypes,
              status: 'PENDING',
              severity: this.calculateSeverity(missingTypes.length, expectedFiles.length),
              updatedAt: new Date()
            },
            create: {
              organizationId: vehicle.organizationId,
              vehicleId: vehicle.id,
              date: yesterday,
              expectedFiles: expectedFiles,
              missingFiles: missingTypes,
              uploadedFiles: uploadedTypes,
              status: 'PENDING',
              severity: this.calculateSeverity(missingTypes.length, expectedFiles.length)
            }
          });
          
          alerts.push(alert);
          
          // Notificar usuarios MANAGER de la organización
          await this.notifyManagers(vehicle.organizationId, alert, vehicle);
        }
      }
      
      logger.info('Verificación de archivos completada', {
        totalVehicles: vehicles.length,
        alertsCreated: alerts.length
      });
      
      return alerts;
    } catch (error) {
      logger.error('Error verificando archivos faltantes', error);
      throw error;
    }
  }
  
  /**
   * Calcular severidad según cantidad de archivos faltantes
   */
  private static calculateSeverity(missing: number, total: number): string {
    const percentage = (missing / total) * 100;
    if (percentage >= 75) return 'CRITICAL';
    if (percentage >= 50) return 'ERROR';
    if (percentage >= 25) return 'WARNING';
    return 'INFO';
  }
  
  /**
   * Notificar a usuarios MANAGER
   */
  private static async notifyManagers(organizationId: string, alert: any, vehicle: any) {
    try {
      // Buscar MANAGERs de la organización
      const managers = await prisma.user.findMany({
        where: {
          organizationId,
          role: 'MANAGER',
          status: 'ACTIVE'
        },
        include: {
          UserConfig: true
        }
      });
      
      for (const manager of managers) {
        // Verificar preferencias de notificación
        const preferences = manager.UserConfig?.notificationPreferences as any;
        if (preferences?.emailAlerts !== false) {
          await EmailService.sendMissingFilesAlert(
            manager.email,
            manager.name,
            vehicle,
            alert
          );
        }
        
        // Crear notificación in-app
        await prisma.notification.create({
          data: {
            userId: manager.id,
            type: 'ALERT',
            channel: 'IN_APP',
            title: `Archivos faltantes - ${vehicle.name}`,
            message: `Faltan ${alert.missingFiles.length} archivo(s) del ${alert.date.toLocaleDateString()}: ${alert.missingFiles.join(', ')}`,
            priority: alert.severity,
            relatedEntity: 'MissingFileAlert',
            relatedEntityId: alert.id,
            status: 'PENDING'
          }
        });
      }
      
      // Actualizar alerta con usuarios notificados
      await prisma.missingFileAlert.update({
        where: { id: alert.id },
        data: {
          notifiedAt: new Date(),
          notifiedUsers: managers.map(m => m.id)
        }
      });
      
      logger.info('Managers notificados', {
        alertId: alert.id,
        managersNotified: managers.length
      });
    } catch (error) {
      logger.error('Error notificando managers', error);
    }
  }
}
```

#### 5.2 ScheduledReportService

**Ubicación:** `backend/src/services/ScheduledReportService.ts`

**Funcionalidades:**
- CRUD de reportes programados
- Ejecutor de reportes programados (cron job)
- Generación y envío automático
- Logging de ejecuciones

**Ejemplo:**

```typescript
// backend/src/services/ScheduledReportService.ts

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { ReportService } from './ReportService';
import { EmailService } from './EmailService';

const prisma = new PrismaClient();

export class ScheduledReportService {
  private static cronJobs: Map<string, cron.ScheduledTask> = new Map();
  
  /**
   * Inicializar todos los cron jobs de reportes programados
   */
  static async initializeScheduledReports() {
    try {
      logger.info('Inicializando reportes programados');
      
      const scheduledReports = await prisma.scheduledReport.findMany({
        where: { isActive: true }
      });
      
      for (const report of scheduledReports) {
        this.scheduleReport(report);
      }
      
      logger.info('Reportes programados inicializados', {
        total: scheduledReports.length
      });
    } catch (error) {
      logger.error('Error inicializando reportes programados', error);
    }
  }
  
  /**
   * Programar un reporte
   */
  static scheduleReport(report: any) {
    try {
      // Convertir configuración a expresión cron
      const cronExpression = this.buildCronExpression(
        report.frequency,
        report.dayOfWeek,
        report.dayOfMonth,
        report.timeOfDay
      );
      
      logger.info('Programando reporte', {
        reportId: report.id,
        name: report.name,
        cronExpression
      });
      
      // Crear cron job
      const job = cron.schedule(cronExpression, async () => {
        await this.executeReport(report.id);
      }, {
        timezone: report.timezone
      });
      
      // Guardar referencia
      this.cronJobs.set(report.id, job);
      
      // Actualizar nextRunAt
      const nextRun = this.calculateNextRun(cronExpression, report.timezone);
      await prisma.scheduledReport.update({
        where: { id: report.id },
        data: { nextRunAt: nextRun }
      });
      
    } catch (error) {
      logger.error('Error programando reporte', { reportId: report.id, error });
    }
  }
  
  /**
   * Ejecutar un reporte programado
   */
  static async executeReport(reportId: string) {
    try {
      logger.info('Ejecutando reporte programado', { reportId });
      
      // Marcar como ejecutándose
      await prisma.scheduledReport.update({
        where: { id: reportId },
        data: { lastStatus: 'RUNNING', lastRunAt: new Date() }
      });
      
      const scheduledReport = await prisma.scheduledReport.findUnique({
        where: { id: reportId },
        include: {
          User: true,
          Organization: true
        }
      });
      
      if (!scheduledReport) {
        throw new Error('Reporte programado no encontrado');
      }
      
      // Generar reporte usando filtros configurados
      const reportData = await ReportService.generateReport({
        userId: scheduledReport.userId,
        organizationId: scheduledReport.organizationId,
        type: scheduledReport.reportType,
        format: scheduledReport.format,
        filters: scheduledReport.filters as any
      });
      
      // Enviar por email a destinatarios
      for (const recipient of scheduledReport.recipients) {
        await EmailService.sendScheduledReport(
          recipient,
          scheduledReport.name,
          reportData
        );
      }
      
      // Actualizar estado
      const nextRun = this.calculateNextRun(
        this.buildCronExpression(
          scheduledReport.frequency,
          scheduledReport.dayOfWeek,
          scheduledReport.dayOfMonth,
          scheduledReport.timeOfDay
        ),
        scheduledReport.timezone
      );
      
      await prisma.scheduledReport.update({
        where: { id: reportId },
        data: {
          lastStatus: 'SUCCESS',
          nextRunAt: nextRun
        }
      });
      
      logger.info('Reporte programado ejecutado con éxito', {
        reportId,
        recipients: scheduledReport.recipients.length
      });
      
    } catch (error) {
      logger.error('Error ejecutando reporte programado', { reportId, error });
      
      // Actualizar estado de error
      await prisma.scheduledReport.update({
        where: { id: reportId },
        data: { lastStatus: 'FAILED' }
      });
    }
  }
  
  /**
   * Construir expresión cron desde configuración
   */
  private static buildCronExpression(
    frequency: string,
    dayOfWeek?: number | null,
    dayOfMonth?: number | null,
    timeOfDay?: string
  ): string {
    const [hour, minute] = (timeOfDay || '08:00').split(':');
    
    switch (frequency) {
      case 'DAILY':
        return `${minute} ${hour} * * *`;
      
      case 'WEEKLY':
        return `${minute} ${hour} * * ${dayOfWeek || 1}`;
      
      case 'MONTHLY':
        return `${minute} ${hour} ${dayOfMonth || 1} * *`;
      
      default:
        throw new Error(`Frecuencia no soportada: ${frequency}`);
    }
  }
  
  /**
   * Calcular próxima ejecución
   */
  private static calculateNextRun(cronExpression: string, timezone: string): Date {
    const interval = cron.parseExpression(cronExpression, {
      tz: timezone
    });
    return interval.next().toDate();
  }
}
```

---

### 6. EVALUACIÓN DE BASE DE DATOS

#### 6.1 PostgreSQL vs Firebase

**Usuario pregunta:** "Replantear Firebase por ejemplo"

**Análisis Crítico:**

| Aspecto | PostgreSQL (Actual) | Firebase | Recomendación |
|---------|---------------------|----------|---------------|
| **Relaciones complejas** | ✅ Excelente - JOIN, FK | ❌ Limitado - NoSQL | **PostgreSQL** |
| **Consultas analíticas** | ✅ SQL avanzado, índices | ❌ Limitadas, lentas | **PostgreSQL** |
| **Datos geoespaciales** | ✅ PostGIS nativo | ❌ No soportado | **PostgreSQL** |
| **Escalabilidad horizontal** | ⚠️ Complejo | ✅ Automático | Firebase |
| **Tiempo real** | ⚠️ Requiere WebSockets | ✅ Nativo | Firebase |
| **Costos** | ✅ Predecibles | ⚠️ Variables por uso | **PostgreSQL** |
| **Migraciones** | ✅ Prisma Migrate | ⚠️ Sin soporte | **PostgreSQL** |
| **Backup/Restore** | ✅ Nativo, pg_dump | ⚠️ Dependiente de Google | **PostgreSQL** |
| **Performance reporting** | ✅ Índices, EXPLAIN | ❌ Opaco | **PostgreSQL** |
| **Datos tabulares grandes** | ✅ Optimizado | ❌ Ineficiente | **PostgreSQL** |

**🎯 RECOMENDACIÓN FINAL: MANTENER POSTGRESQL**

**Razones:**

1. **Datos relacionales complejos:** DobackSoft tiene 40+ tablas con relaciones FK complejas
2. **Consultas analíticas:** KPIs requieren JOINs, GROUP BY, window functions
3. **PostGIS:** Geofences y GPS requieren operaciones geoespaciales avanzadas
4. **Reportes:** Generación de PDFs requiere agregaciones SQL complejas
5. **Consistencia ACID:** Crítico para integridad de datos de seguridad

**Optimizaciones Recomendadas en PostgreSQL:**

```sql
-- 1. Índices compuestos para consultas frecuentes
CREATE INDEX idx_session_org_vehicle_date ON "Session" ("organizationId", "vehicleId", "startTime" DESC);
CREATE INDEX idx_gps_session_timestamp ON "GpsMeasurement" ("sessionId", "timestamp" DESC);
CREATE INDEX idx_stability_session_severity ON "StabilityMeasurement" ("sessionId", "severity", "timestamp");

-- 2. Índices parciales para consultas filtradas
CREATE INDEX idx_active_vehicles ON "Vehicle" ("organizationId", "id") WHERE active = true AND status = 'ACTIVE';
CREATE INDEX idx_pending_alerts ON "MissingFileAlert" ("organizationId", "date") WHERE status = 'PENDING';

-- 3. Particionamiento por fecha para tablas grandes
CREATE TABLE "GpsMeasurement_2025_10" PARTITION OF "GpsMeasurement"
FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

-- 4. Vistas materializadas para KPIs frecuentes
CREATE MATERIALIZED VIEW dashboard_kpis_daily AS
SELECT 
  "organizationId",
  DATE("startTime") as date,
  COUNT(DISTINCT "vehicleId") as active_vehicles,
  SUM("matchedduration") / 3600 as total_hours,
  SUM("matcheddistance") / 1000 as total_km,
  COUNT(*) as total_sessions
FROM "Session"
WHERE "startTime" >= NOW() - INTERVAL '30 days'
GROUP BY "organizationId", DATE("startTime");

CREATE UNIQUE INDEX ON dashboard_kpis_daily ("organizationId", date);

-- Refrescar cada hora
CREATE OR REPLACE FUNCTION refresh_dashboard_kpis()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_kpis_daily;
END;
$$ LANGUAGE plpgsql;

-- 5. Limpieza automática de datos antiguos
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Archivar sesiones antiguas (>2 años)
  DELETE FROM "GpsMeasurement" 
  WHERE "sessionId" IN (
    SELECT id FROM "Session" 
    WHERE "startTime" < NOW() - INTERVAL '2 years'
  );
  
  DELETE FROM "StabilityMeasurement"
  WHERE "sessionId" IN (
    SELECT id FROM "Session" 
    WHERE "startTime" < NOW() - INTERVAL '2 years'
  );
  
  -- Archivar alertas resueltas (>6 meses)
  DELETE FROM "MissingFileAlert"
  WHERE status = 'RESOLVED' 
    AND "resolvedAt" < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;
```

---

### 7. PLAN DE IMPLEMENTACIÓN

#### Fase 1: Corrección de Inconsistencias (1 semana)

**✅ Tareas:**
1. Unificar tipos de roles en todo el codebase
2. Actualizar Prisma schema y migrar BD
3. Actualizar middleware de autorización
4. Sincronizar frontend y backend

**🎯 Prioridad:** CRÍTICA

#### Fase 2: Sistema de Permisos Granulares (1 semana)

**✅ Tareas:**
1. Implementar enum de permisos
2. Crear mapa rol-permisos
3. Actualizar ProtectedRoute y componentes
4. Actualizar rutas backend

**🎯 Prioridad:** ALTA

#### Fase 3: Dashboard MANAGER (2 semanas)

**✅ Tareas:**
1. Crear EstadosYTiemposTab
2. Adaptar componentes existentes (BlackSpots, Speed, Sessions)
3. Sistema de pestañas por rol
4. Exportación específica

**🎯 Prioridad:** ALTA

#### Fase 4: Sistema de Alertas (1 semana)

**✅ Tareas:**
1. Crear modelo MissingFileAlert
2. Implementar AlertService
3. Crear cron job diario
4. Componente AlertSystemManager
5. Notificaciones email/push

**🎯 Prioridad:** ALTA

#### Fase 5: Reportes Automáticos (2 semanas)

**✅ Tareas:**
1. Crear modelo ScheduledReport
2. Implementar ScheduledReportService
3. Configurar cron jobs dinámicos
4. Componente AutomaticReportsManager
5. Integración con EmailService

**🎯 Prioridad:** MEDIA

#### Fase 6: Módulo Administración MANAGER (1 semana)

**✅ Tareas:**
1. Página ManagerAdministration
2. CRUD de talleres/parques
3. Creación de usuarios MANAGER
4. Gestión de perfil
5. Logs de auditoría

**🎯 Prioridad:** MEDIA

#### Fase 7: Optimización BD (1 semana)

**✅ Tareas:**
1. Crear índices compuestos
2. Implementar particionamiento
3. Vistas materializadas para KPIs
4. Scripts de limpieza automática
5. Monitoreo de performance

**🎯 Prioridad:** BAJA

---

## 📈 MÉTRICAS DE ÉXITO

### KPIs de Implementación

1. **Seguridad:**
   - ✅ 0 inconsistencias de roles
   - ✅ 100% de rutas protegidas con permisos correctos
   - ✅ Auditoría completa de accesos

2. **Funcionalidad:**
   - ✅ MANAGER puede acceder solo a sus módulos
   - ✅ Alertas detectan 100% de archivos faltantes
   - ✅ Reportes automáticos se envían sin fallos

3. **Performance:**
   - ✅ Consultas Dashboard <2s
   - ✅ Generación reportes <10s
   - ✅ Carga inicial <3s

4. **Usabilidad:**
   - ✅ Navegación intuitiva por rol
   - ✅ 0 opciones no accesibles visibles
   - ✅ Feedback claro de permisos

---

## 🚨 RIESGOS IDENTIFICADOS

### Alto Riesgo

1. **Migración de roles existentes**
   - **Impacto:** Usuarios pueden perder acceso
   - **Mitigación:** Script de migración con rollback, testing exhaustivo

2. **Cambios en autenticación**
   - **Impacto:** Sesiones activas pueden invalidarse
   - **Mitigación:** Implementación gradual, backward compatibility

### Medio Riesgo

3. **Performance de alertas diarias**
   - **Impacto:** Carga adicional en BD
   - **Mitigación:** Ejecución en horario de baja carga, índices optimizados

4. **Cron jobs de reportes**
   - **Impacto:** Fallos silenciosos sin monitoreo
   - **Mitigación:** Logging detallado, alertas de fallos

---

## 📝 CONCLUSIONES Y RECOMENDACIONES

### Conclusiones Principales

1. **✅ PostgreSQL es la elección correcta** - No migrar a Firebase
2. **⚠️ Inconsistencia de roles es crítica** - Requiere corrección inmediata
3. **✅ Arquitectura general es sólida** - React + Node.js + Prisma bien implementado
4. **⚠️ Falta sistema de permisos granulares** - Implementar antes de escalar
5. **✅ Módulos bien estructurados** - Fácil agregar funcionalidades nuevas

### Recomendaciones Estratégicas

#### Corto Plazo (1 mes)
1. Corregir inconsistencia de roles
2. Implementar sistema de permisos
3. Crear dashboard MANAGER
4. Sistema de alertas básico

#### Medio Plazo (3 meses)
5. Reportes automáticos completos
6. Módulo administración MANAGER
7. Optimizaciones BD
8. Testing exhaustivo

#### Largo Plazo (6 meses)
9. Sistema de roles extensible (OPERATOR, VIEWER)
10. API pública para integraciones
11. Multi-tenancy avanzado
12. Analytics y ML

---

## 📚 DOCUMENTACIÓN ADICIONAL

**Archivos Relacionados:**
- `docs/DESARROLLO/GUIA-ROLES-Y-PERMISOS.md` (crear)
- `docs/API/ENDPOINTS-POR-ROL.md` (crear)
- `docs/FRONTEND/COMPONENTES-PROTEGIDOS.md` (crear)
- `docs/BACKEND/MIDDLEWARE-AUTORIZACION.md` (crear)

**Scripts Necesarios:**
- `scripts/migrations/migrate-user-roles.ts`
- `scripts/cron/check-missing-files-daily.ts`
- `scripts/cron/execute-scheduled-reports.ts`
- `scripts/utils/sync-role-permissions.ts`

---

**✅ ESTE DOCUMENTO DEBE SER REVISADO Y APROBADO ANTES DE INICIAR LA IMPLEMENTACIÓN**


