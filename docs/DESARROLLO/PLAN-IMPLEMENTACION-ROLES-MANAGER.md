# 🚀 PLAN DE IMPLEMENTACIÓN: SISTEMA DE ROLES MANAGER

**Fecha Inicio:** 22 octubre 2025  
**Duración Estimada:** 6 semanas  
**Prioridad:** CRÍTICA

---

## 📋 RESUMEN EJECUTIVO

Este documento detalla el plan de implementación para transformar DobackSoft en un sistema con roles diferenciados:
- **ADMIN**: Acceso total al sistema
- **MANAGER**: "Admin de parque" con acceso limitado a su organización

---

## 🎯 OBJETIVOS

### Objetivos Principales
1. ✅ Unificar roles en todo el sistema (eliminar inconsistencias)
2. ✅ Implementar dashboard específico para MANAGER
3. ✅ Sistema de alertas de archivos faltantes
4. ✅ Reportes automáticos programables
5. ✅ Módulo de administración para MANAGER

### Objetivos Secundarios
6. Optimizar consultas de base de datos
7. Mejorar seguridad y auditoría
8. Documentación completa del sistema

---

## 📅 CRONOGRAMA DETALLADO

### **SEMANA 1: Corrección de Inconsistencias** ⚠️ CRÍTICO

#### Día 1-2: Backend - Unificación de Roles
- [ ] Actualizar `backend/src/types/domain.ts`
- [ ] Actualizar `backend/prisma/schema.prisma`
- [ ] Crear migración de BD
- [ ] Actualizar servicios (AuthService, UserService)
- [ ] Testing de autenticación

#### Día 3-4: Frontend - Unificación de Roles
- [ ] Actualizar `frontend/src/types/auth.ts`
- [ ] Actualizar AuthContext
- [ ] Actualizar servicios auth
- [ ] Sincronizar con backend
- [ ] Testing de login/logout

#### Día 5: Migración de Datos
- [ ] Script SQL de migración USER → MANAGER
- [ ] Backup completo de BD
- [ ] Ejecutar migración en entorno dev
- [ ] Validar datos migrados
- [ ] Documentar proceso

**Entregables:**
- ✅ Roles consistentes en todo el sistema
- ✅ Migración BD completada
- ✅ Tests pasando

---

### **SEMANA 2: Sistema de Permisos Granulares** 🔒

#### Día 1-2: Definición de Permisos
- [ ] Crear enum `Permission` en `frontend/src/utils/permissions.ts`
- [ ] Crear enum `Permission` en `backend/src/types/permissions.ts`
- [ ] Mapear roles → permisos (rolePermissions)
- [ ] Documentar cada permiso

#### Día 3-4: Frontend - Hooks y Componentes
- [ ] Hook `usePermissions()`
- [ ] Componente `PermissionGuard`
- [ ] Actualizar `ProtectedRoute`
- [ ] Actualizar `Navigation.tsx`
- [ ] Testing de permisos

#### Día 5: Backend - Middleware
- [ ] Middleware `requirePermission()`
- [ ] Middleware `requireOrganizationAccess()`
- [ ] Actualizar rutas críticas
- [ ] Logging de intentos fallidos
- [ ] Testing E2E

**Entregables:**
- ✅ Sistema de permisos funcional
- ✅ Middleware de autorización actualizado
- ✅ Navegación filtrada por rol

---

### **SEMANA 3: Dashboard MANAGER - Parte 1** 📊

#### Día 1-2: Componente EstadosYTiemposTab
- [ ] Crear `frontend/src/components/dashboard/EstadosYTiemposTab.tsx`
- [ ] Integrar OperationalKeysTab
- [ ] Gráficos de distribución de tiempo
- [ ] Listado de eventos por estado
- [ ] Exportación a PDF

#### Día 3-4: Adaptar Componentes Existentes
- [ ] `BlackSpotsTab` - filtrar por organización
- [ ] `SpeedAnalysisTab` - filtrar por organización
- [ ] `SessionsAndRoutesView` - filtrar por organización
- [ ] Optimizar queries para MANAGER

#### Día 5: Sistema de Pestañas por Rol
- [ ] Actualizar `UnifiedDashboard.tsx`
- [ ] Filtrado de pestañas por rol
- [ ] Navegación interna del dashboard
- [ ] Testing de visualización

**Entregables:**
- ✅ Dashboard operativo para MANAGER
- ✅ 4 pestañas funcionales (Estados, Puntos, Velocidad, Sesiones)

---

### **SEMANA 4: Dashboard MANAGER - Parte 2** 🚨

#### Día 1-3: Sistema de Alertas
- [ ] Modelo BD `MissingFileAlert` (Prisma)
- [ ] Migración BD
- [ ] `backend/src/services/AlertService.ts`
- [ ] Cron job diario (08:00 AM)
- [ ] `frontend/src/components/alerts/AlertSystemManager.tsx`
- [ ] Notificaciones email
- [ ] Testing de alertas

#### Día 4-5: Integración Dashboard
- [ ] Pestaña "Sistema de Alertas" en dashboard
- [ ] Badge de alertas pendientes
- [ ] Resolución manual de alertas
- [ ] Historial de alertas
- [ ] Exportación de alertas

**Entregables:**
- ✅ Sistema de alertas funcional
- ✅ Detección diaria automática
- ✅ Notificaciones a MANAGER

---

### **SEMANA 5: Reportes Automáticos** 📈

#### Día 1-2: Backend - Modelo y Servicio
- [ ] Modelo BD `ScheduledReport` (Prisma)
- [ ] Migración BD
- [ ] `backend/src/services/ScheduledReportService.ts`
- [ ] Cron jobs dinámicos
- [ ] Integración con ReportService
- [ ] Envío automático por email

#### Día 3-4: Frontend - Gestor de Reportes
- [ ] `frontend/src/components/reports/AutomaticReportsManager.tsx`
- [ ] CRUD de reportes programados
- [ ] Configuración de frecuencia (diaria/semanal/mensual)
- [ ] Selección de destinatarios
- [ ] Filtros personalizables
- [ ] Historial de ejecuciones

#### Día 5: Testing y Validación
- [ ] Testing de generación
- [ ] Testing de envío
- [ ] Validación de filtros
- [ ] Documentación de uso

**Entregables:**
- ✅ Reportes automáticos funcionales
- ✅ Configuración flexible
- ✅ Envío automático por email

---

### **SEMANA 6: Módulo Administración MANAGER** ⚙️

#### Día 1-2: Gestión de Perfil y Parques
- [ ] `frontend/src/pages/ManagerAdministration.tsx`
- [ ] Edición de perfil propio
- [ ] CRUD de talleres/parques
- [ ] Asignación de vehículos a parques
- [ ] Validación de permisos

#### Día 3-4: Creación de Usuarios MANAGER
- [ ] Formulario de creación de usuarios
- [ ] Validación: solo MANAGER de misma organización
- [ ] Asignación de parques gestionados
- [ ] Notificación por email a nuevo usuario
- [ ] Logs de auditoría

#### Día 5: Logs y Documentación
- [ ] Historial de acciones del MANAGER
- [ ] Configuración de notificaciones
- [ ] Guía de usuario MANAGER
- [ ] Testing completo del módulo

**Entregables:**
- ✅ Módulo administración funcional
- ✅ MANAGER puede crear usuarios subordinados
- ✅ Gestión de talleres/parques

---

## 🗂️ ESTRUCTURA DE ARCHIVOS NUEVOS

### Frontend

```
frontend/src/
├── components/
│   ├── dashboard/
│   │   ├── EstadosYTiemposTab.tsx          ⭐ NUEVO
│   │   └── ManagerDashboardLayout.tsx      ⭐ NUEVO
│   ├── alerts/
│   │   ├── AlertSystemManager.tsx          ⭐ NUEVO
│   │   ├── AlertList.tsx                   ⭐ NUEVO
│   │   ├── AlertDetails.tsx                ⭐ NUEVO
│   │   └── AlertNotificationSettings.tsx   ⭐ NUEVO
│   ├── reports/
│   │   ├── AutomaticReportsManager.tsx     ⭐ NUEVO
│   │   ├── ScheduledReportForm.tsx         ⭐ NUEVO
│   │   ├── ScheduledReportList.tsx         ⭐ NUEVO
│   │   └── ReportExecutionHistory.tsx      ⭐ NUEVO
│   └── administration/
│       ├── ManagerUserCreation.tsx         ⭐ NUEVO
│       ├── ParkManagement.tsx              ⭐ NUEVO
│       └── ProfileEditor.tsx               ⭐ NUEVO
├── pages/
│   └── ManagerAdministration.tsx           ⭐ NUEVO
├── utils/
│   └── permissions.ts                      ⭐ NUEVO
└── types/
    └── permissions.ts                      ⭐ NUEVO
```

### Backend

```
backend/src/
├── services/
│   ├── AlertService.ts                     ⭐ NUEVO
│   ├── ScheduledReportService.ts           ⭐ NUEVO
│   └── EmailService.ts                     ✏️ ACTUALIZAR
├── middleware/
│   └── authorization.ts                    ⭐ NUEVO
├── controllers/
│   ├── AlertController.ts                  ⭐ NUEVO
│   ├── ScheduledReportController.ts        ⭐ NUEVO
│   └── ManagerController.ts                ⭐ NUEVO
├── routes/
│   ├── alerts.ts                           ⭐ NUEVO
│   ├── scheduledReports.ts                 ⭐ NUEVO
│   └── manager.ts                          ⭐ NUEVO
├── cron/
│   ├── check-missing-files.ts              ⭐ NUEVO
│   └── execute-scheduled-reports.ts        ⭐ NUEVO
└── types/
    └── permissions.ts                      ⭐ NUEVO
```

### Base de Datos

```
backend/prisma/
└── migrations/
    ├── 001_update_user_roles.sql           ⭐ NUEVO
    ├── 002_add_missing_file_alerts.sql     ⭐ NUEVO
    ├── 003_add_scheduled_reports.sql       ⭐ NUEVO
    └── 004_add_user_permissions.sql        ⭐ NUEVO
```

---

## ✅ CHECKLIST DE VALIDACIÓN

### Semana 1: Roles
- [ ] Backend y frontend usan mismos roles
- [ ] Migración de USER a MANAGER completada
- [ ] Tests de autenticación pasando
- [ ] Login/logout funciona correctamente

### Semana 2: Permisos
- [ ] Hook usePermissions() funcional
- [ ] Navegación filtrada por rol
- [ ] Rutas backend protegidas correctamente
- [ ] Logging de accesos fallidos

### Semana 3-4: Dashboard
- [ ] MANAGER ve solo sus pestañas
- [ ] ADMIN ve dashboard completo
- [ ] Todos los datos filtrados por organización
- [ ] Exportación funciona correctamente
- [ ] Alertas se crean automáticamente
- [ ] Notificaciones llegan a MANAGER

### Semana 5: Reportes
- [ ] CRUD de reportes programados funcional
- [ ] Cron jobs se ejecutan correctamente
- [ ] Reportes se generan automáticamente
- [ ] Emails se envían a destinatarios
- [ ] Historial de ejecuciones visible

### Semana 6: Administración
- [ ] MANAGER puede editar su perfil
- [ ] MANAGER puede crear talleres/parques
- [ ] MANAGER puede crear usuarios MANAGER
- [ ] Solo puede crear en su organización
- [ ] Logs de auditoría funcionan

---

## 🚨 RIESGOS Y MITIGACIONES

### Riesgo 1: Pérdida de Acceso Post-Migración
**Probabilidad:** Alta  
**Impacto:** Crítico  
**Mitigación:**
- Backup completo antes de migración
- Script de rollback preparado
- Testing exhaustivo en dev/staging
- Usuario admin de emergencia

### Riesgo 2: Performance de Alertas Diarias
**Probabilidad:** Media  
**Impacto:** Medio  
**Mitigación:**
- Ejecutar en horario de baja carga (08:00)
- Optimizar queries con índices
- Procesamiento en lotes
- Monitoring de tiempo de ejecución

### Riesgo 3: Fallo de Cron Jobs
**Probabilidad:** Media  
**Impacto:** Alto  
**Mitigación:**
- Logging detallado
- Alertas de fallos a admin
- Retry automático
- Monitoreo con healthchecks

### Riesgo 4: Inconsistencia de Permisos
**Probabilidad:** Baja  
**Impacto:** Alto  
**Mitigación:**
- Tests E2E exhaustivos
- Script de validación de permisos
- Revisión manual de rutas críticas
- Auditoría de seguridad

---

## 📊 MÉTRICAS DE ÉXITO

### KPIs Técnicos
- ✅ 0 inconsistencias de roles detectadas
- ✅ 100% de rutas protegidas correctamente
- ✅ Queries dashboard <2s
- ✅ Alertas generadas en <30s
- ✅ Reportes generados en <10s

### KPIs Funcionales
- ✅ MANAGER puede hacer todas sus tareas sin admin
- ✅ Alertas detectan 100% de archivos faltantes
- ✅ Reportes se envían sin fallos
- ✅ 0 accesos no autorizados

### KPIs de Calidad
- ✅ Code coverage >80%
- ✅ 0 errores críticos en producción
- ✅ Documentación completa
- ✅ Guías de usuario creadas

---

## 📝 NOTAS DE IMPLEMENTACIÓN

### Orden de Implementación
1. **SIEMPRE backend primero, luego frontend**
2. **Una feature a la vez, completamente funcional**
3. **Testing después de cada componente**
4. **Deploy incremental, no big bang**

### Comunicación
- **Reuniones diarias:** 15 min standup
- **Demos semanales:** Viernes 16:00
- **Documentación:** Actualizar en cada merge

### Testing
- **Unit tests:** Cada servicio/componente
- **Integration tests:** Flujos completos
- **E2E tests:** Escenarios de usuario
- **Manual testing:** Checklist de validación

---

## 🔗 RECURSOS ADICIONALES

**Documentos Relacionados:**
- `docs/CALIDAD/ANALISIS-CRITICO-SISTEMA-ROLES-Y-ARQUITECTURA.md`
- `docs/DESARROLLO/GUIA-ROLES-Y-PERMISOS.md` (crear)
- `docs/API/ENDPOINTS-POR-ROL.md` (crear)

**Ejemplos de Código:**
- Ver análisis crítico para ejemplos completos
- Consultar documentación de Prisma para migraciones
- Revisar documentación de node-cron para cron jobs

---

**✅ ESTE PLAN DEBE SER REVISADO SEMANALMENTE Y AJUSTADO SEGÚN PROGRESO**


