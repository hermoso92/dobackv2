# ✅ Checklist de Verificación Completa - DobackSoft V3.0

**Fecha:** _________  
**Verificado por:** _________  
**Versión del sistema:** 3.0.0

---

## 📋 Instrucciones

Marca cada ítem con ✅ cuando lo verifiques exitosamente, o con ❌ si encuentra problemas.

---

## 1. Backend - APIs y Autenticación

### 1.1 Autenticación
- [ ] POST `/api/auth/login` - Login con credenciales correctas funciona
- [ ] POST `/api/auth/login` - Login con credenciales incorrectas falla apropiadamente
- [ ] POST `/api/auth/register` - Registro de nuevo usuario funciona
- [ ] POST `/api/auth/logout` - Logout invalida el token
- [ ] GET `/api/auth/me` - Devuelve información del usuario actual
- [ ] POST `/api/auth/refresh` - Refresco de token funciona

### 1.2 Endpoints Protegidos
- [ ] GET `/api/users` - Requiere autenticación (401 sin token)
- [ ] GET `/api/vehicles` - Requiere autenticación
- [ ] GET `/api/sessions` - Requiere autenticación
- [ ] GET `/api/alerts` - Requiere autenticación

### 1.3 Autorización por Rol
- [ ] ADMIN puede acceder a `/api/users` (200)
- [ ] MANAGER no puede acceder a `/api/system/config` (403)
- [ ] ADMIN puede crear usuarios de cualquier rol
- [ ] MANAGER solo puede crear usuarios MANAGER

**Notas:**
```
_____________________________________________________________
_____________________________________________________________
```

---

## 2. Frontend - Navegación y Componentes

### 2.1 Login y Autenticación
- [ ] Página de login carga correctamente (`/login`)
- [ ] Login como MANAGER funciona
- [ ] Login como ADMIN funciona
- [ ] Logout funciona y redirige a login
- [ ] Token se guarda en cookies httpOnly

### 2.2 Navegación como MANAGER
Login como: `test@bomberosmadrid.es / admin123`

- [ ] Ve solo **6 opciones** en menú lateral
- [ ] ✅ Panel de Control
- [ ] ✅ Operaciones
- [ ] ✅ Reportes
- [ ] ✅ Alertas
- [ ] ✅ Administración
- [ ] ✅ Mi Cuenta
- [ ] ❌ NO ve: Estabilidad, Telemetría, IA, Geofences, Subir, Config, Base Conocimiento

### 2.3 Navegación como ADMIN
Login como: `antoniohermoso92@gmail.com / admin123`

- [ ] Ve todas las **13 opciones** en menú lateral
- [ ] ✅ Panel de Control
- [ ] ✅ Estabilidad
- [ ] ✅ Telemetría
- [ ] ✅ Inteligencia Artificial
- [ ] ✅ Geofences
- [ ] ✅ Subir Archivos
- [ ] ✅ Operaciones
- [ ] ✅ Reportes
- [ ] ✅ Alertas
- [ ] ✅ Administración
- [ ] ✅ Configuración del Sistema
- [ ] ✅ Base de Conocimiento
- [ ] ✅ Mi Cuenta

### 2.4 Dashboard Diferenciado
- [ ] MANAGER ve dashboard con **4 pestañas** operativas
  - [ ] Estados & Tiempos
  - [ ] Puntos Negros
  - [ ] Velocidad
  - [ ] Sesiones & Recorridos
- [ ] ADMIN ve dashboard ejecutivo completo con KPIs
- [ ] Ambos dashboards cargan sin errores de consola

**Notas:**
```
_____________________________________________________________
_____________________________________________________________
```

---

## 3. Base de Datos

### 3.1 Tablas Principales
- [ ] Tabla `User` existe y tiene datos
- [ ] Tabla `Organization` existe
- [ ] Tabla `Vehicle` existe
- [ ] Tabla `Session` existe
- [ ] Tabla `MissingFileAlert` existe (nueva)
- [ ] Tabla `ScheduledReport` existe (nueva)

### 3.2 Enums
- [ ] Enum `UserRole` tiene: ADMIN, MANAGER, OPERATOR, VIEWER
- [ ] Enum `AlertStatus` tiene: PENDING, RESOLVED, IGNORED
- [ ] Enum `AlertSeverity` tiene: INFO, WARNING, CRITICAL
- [ ] Enum `ReportFrequency` tiene: DAILY, WEEKLY, MONTHLY

### 3.3 Usuarios y Roles
- [ ] Usuario `test@bomberosmadrid.es` tiene rol MANAGER
- [ ] Usuario `antoniohermoso92@gmail.com` tiene rol ADMIN
- [ ] Hay al menos 2 organizaciones en la BD
- [ ] Cada usuario tiene `organizationId` asignado (excepto ADMIN si aplica)

### 3.4 Relaciones
- [ ] User → Organization (foreignKey válido)
- [ ] Vehicle → Organization (foreignKey válido)
- [ ] MissingFileAlert → User, Vehicle, Organization
- [ ] ScheduledReport → User, Organization

**Notas:**
```
_____________________________________________________________
_____________________________________________________________
```

---

## 4. Sistema de Roles y Permisos

### 4.1 Permisos ADMIN
- [ ] Puede ver todos los vehículos de todas las organizaciones
- [ ] Puede crear/editar/eliminar usuarios de cualquier rol
- [ ] Puede acceder a configuración del sistema
- [ ] Puede ver alertas de todas las organizaciones
- [ ] Puede ver reportes de todas las organizaciones

### 4.2 Permisos MANAGER
- [ ] Solo ve vehículos de su organización
- [ ] Solo puede crear usuarios MANAGER (no ADMIN)
- [ ] No puede acceder a configuración del sistema
- [ ] Solo ve alertas de su organización
- [ ] Solo ve sus propios reportes programados

### 4.3 Filtrado por Organización
- [ ] MANAGER al consultar `/api/vehicles` solo ve de su org
- [ ] MANAGER al consultar `/api/alerts` solo ve de su org
- [ ] ADMIN puede ver datos de todas las organizaciones
- [ ] Filtrado es automático (no puede evadirse)

**Notas:**
```
_____________________________________________________________
_____________________________________________________________
```

---

## 5. Sistema de Alertas

### 5.1 Configuración
- [ ] Cron job programado para las 08:00 AM
- [ ] Servicio `AlertService` implementado
- [ ] Endpoint GET `/api/alerts` funciona
- [ ] Endpoint POST `/api/alerts/:id/resolve` funciona
- [ ] Endpoint POST `/api/alerts/:id/ignore` funciona

### 5.2 Dashboard de Alertas (`/alerts`)
- [ ] Página carga correctamente
- [ ] Muestra estadísticas (pending, resolved, ignored)
- [ ] Muestra lista de alertas
- [ ] Filtros funcionan (por estado, fecha, vehículo)
- [ ] Botón "Resolver" funciona
- [ ] Botón "Ignorar" funciona
- [ ] Modal de resolución permite añadir notas

### 5.3 Flujo Completo
- [ ] Alerta se crea cuando falta archivo del día anterior
- [ ] Alerta tiene severidad correcta (INFO/WARNING/CRITICAL)
- [ ] MANAGER recibe notificación (si configurado)
- [ ] Alerta puede ser resuelta con notas
- [ ] Alerta puede ser ignorada con motivo
- [ ] Historial se mantiene correctamente

**Notas:**
```
_____________________________________________________________
_____________________________________________________________
```

---

## 6. Reportes Automáticos

### 6.1 Configuración
- [ ] Servicio `ScheduledReportService` implementado
- [ ] Endpoint GET `/api/scheduled-reports` funciona
- [ ] Endpoint POST `/api/scheduled-reports` funciona (crear)
- [ ] Endpoint PUT `/api/scheduled-reports/:id` funciona (editar)
- [ ] Endpoint DELETE `/api/scheduled-reports/:id` funciona
- [ ] Endpoint POST `/api/scheduled-reports/:id/execute` funciona (ejecutar manual)

### 6.2 Creación de Reporte
- [ ] Puede seleccionar frecuencia (DAILY, WEEKLY, MONTHLY)
- [ ] Puede seleccionar día de la semana (para WEEKLY)
- [ ] Puede seleccionar día del mes (para MONTHLY)
- [ ] Puede seleccionar hora (formato HH:MM)
- [ ] Puede añadir múltiples destinatarios (emails)
- [ ] Puede filtrar por vehículos específicos

### 6.3 Ejecución
- [ ] Cron job programa reportes según configuración
- [ ] Calcula `nextRunAt` correctamente
- [ ] Ejecuta reporte en la fecha/hora programada
- [ ] Genera PDF correctamente
- [ ] Envía email a destinatarios (si configurado)
- [ ] Actualiza `lastRunAt` después de ejecutar

### 6.4 Permisos
- [ ] MANAGER solo ve sus propios reportes
- [ ] MANAGER puede crear reportes filtrados por su organización
- [ ] ADMIN ve todos los reportes
- [ ] ADMIN puede crear reportes globales

**Notas:**
```
_____________________________________________________________
_____________________________________________________________
```

---

## 7. Administración MANAGER (`/administration`)

### 7.1 Pestaña: Mi Perfil
- [ ] Muestra información actual del usuario
- [ ] Puede editar nombre
- [ ] Puede editar email
- [ ] Puede cambiar contraseña
- [ ] Validación de contraseña actual funciona
- [ ] Muestra última actividad
- [ ] Cambios se guardan correctamente

### 7.2 Pestaña: Gestión de Parques/Talleres
- [ ] Muestra lista de parques de la organización
- [ ] Puede crear nuevo parque
- [ ] Puede editar parque existente
- [ ] Puede eliminar parque
- [ ] Puede asignar ubicación GPS
- [ ] Puede definir horarios de operación
- [ ] Solo ve parques de su organización

### 7.3 Pestaña: Gestión de Usuarios
- [ ] Muestra lista de usuarios bajo su control
- [ ] Puede crear nuevo usuario MANAGER
- [ ] No puede crear usuario ADMIN (botón deshabilitado)
- [ ] Puede editar usuarios existentes
- [ ] Puede desactivar/reactivar usuarios
- [ ] Puede asignar permisos específicos
- [ ] Solo ve usuarios de su organización

### 7.4 Pestaña: Configuración de Notificaciones
- [ ] Puede activar/desactivar alertas por email
- [ ] Puede activar/desactivar reportes automáticos
- [ ] Puede configurar frecuencia de envío
- [ ] Puede seleccionar tipos de alertas a recibir
- [ ] Cambios se guardan correctamente
- [ ] Recibe confirmación visual de cambios

**Notas:**
```
_____________________________________________________________
_____________________________________________________________
```

---

## 8. Integración Completa - Flujos End-to-End

### 8.1 Flujo de Alerta
1. [ ] Sistema detecta archivo faltante del día anterior
2. [ ] Crea alerta en BD con severidad apropiada
3. [ ] MANAGER ve alerta en dashboard `/alerts`
4. [ ] MANAGER puede resolver o ignorar alerta
5. [ ] Alerta actualiza su estado en BD
6. [ ] Historial se mantiene correctamente

### 8.2 Flujo de Reporte Programado
1. [ ] MANAGER crea reporte semanal para cada lunes a las 08:00
2. [ ] Sistema calcula `nextRunAt` = próximo lunes 08:00
3. [ ] El lunes a las 08:00, cron job ejecuta reporte
4. [ ] Sistema genera PDF con datos filtrados
5. [ ] Envía email a destinatarios configurados
6. [ ] Actualiza `lastRunAt` y `nextRunAt`
7. [ ] MANAGER ve historial de ejecuciones

### 8.3 Flujo de Administración
1. [ ] MANAGER accede a `/administration`
2. [ ] Edita su perfil (nombre, contraseña)
3. [ ] Crea un nuevo parque con ubicación GPS
4. [ ] Crea un nuevo usuario MANAGER subordinado
5. [ ] Asigna permisos específicos al nuevo usuario
6. [ ] Nuevo usuario puede hacer login
7. [ ] Nuevo usuario solo ve datos de la organización

**Notas:**
```
_____________________________________________________________
_____________________________________________________________
```

---

## 9. Performance y Usabilidad

### 9.1 Tiempos de Carga
- [ ] Login responde en menos de 2 segundos
- [ ] Dashboard MANAGER carga en menos de 3 segundos
- [ ] Dashboard ADMIN carga en menos de 5 segundos
- [ ] Lista de alertas carga en menos de 2 segundos
- [ ] Navegación entre páginas es fluida (<1 segundo)

### 9.2 Experiencia de Usuario
- [ ] No hay errores visibles en consola del navegador (F12)
- [ ] Mensajes de error son claros y útiles
- [ ] Spinners de carga aparecen en operaciones largas
- [ ] Confirmaciones visuales después de acciones (toast, alert)
- [ ] Formularios tienen validación en tiempo real

### 9.3 Responsive Design
- [ ] Dashboard se ve bien en pantalla completa
- [ ] Dashboard se adapta a ventanas más pequeñas
- [ ] Scroll funciona correctamente donde es necesario
- [ ] Menú lateral es accesible en todas las resoluciones

**Notas:**
```
_____________________________________________________________
_____________________________________________________________
```

---

## 10. Seguridad

### 10.1 Autenticación
- [ ] Contraseñas están hasheadas en BD (bcrypt)
- [ ] Tokens JWT expiran correctamente (24h)
- [ ] Logout invalida el token en el cliente
- [ ] No se pueden hacer requests sin token válido

### 10.2 Autorización
- [ ] MANAGER no puede acceder a rutas de ADMIN (403)
- [ ] MANAGER no puede ver datos de otras organizaciones
- [ ] Middleware de autorización funciona en todas las rutas
- [ ] No se pueden bypassear permisos con requests directos

### 10.3 Protección de Datos
- [ ] Filtrado por `organizationId` es automático
- [ ] No se exponen IDs sensibles en URLs
- [ ] Cookies tienen flag `httpOnly`
- [ ] Headers de seguridad configurados (Helmet)

### 10.4 Validación
- [ ] Inputs están sanitizados
- [ ] SQL injection no es posible (Prisma)
- [ ] XSS no es posible (React escaping)
- [ ] CSRF protection implementado

**Notas:**
```
_____________________________________________________________
_____________________________________________________________
```

---

## 📊 Resumen Final

**Total de ítems:** ~150  
**Verificados exitosamente:** _____ / 150  
**Con problemas:** _____ / 150  
**Tasa de éxito:** _____% 

### Estado General
- [ ] ✅ Sistema 100% funcional - Aprobado para producción
- [ ] ⚠️ Sistema funcional con advertencias menores
- [ ] ❌ Sistema tiene problemas críticos - No aprobado

### Problemas Críticos Encontrados
```
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
```

### Recomendaciones
```
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
```

---

**Firma:** _________  
**Fecha:** _________

---

## 💡 Instrucciones de Uso

1. **Imprime este checklist** o guárdalo en un editor markdown
2. **Inicia el sistema** con `.\iniciar.ps1`
3. **Ve verificando cada ítem** uno por uno
4. **Marca con ✅ o ❌** según corresponda
5. **Toma notas** en los espacios provistos
6. **Calcula el porcentaje** de éxito al final
7. **Guarda el checklist** con fecha para referencia futura

## 🔧 Herramientas Útiles

- `.\verificar-sistema.ps1` - Verificación automática
- `.\monitorear-logs.ps1` - Ver logs en tiempo real
- `.\ver-logs.ps1` - Ver últimos logs
- Browser DevTools (F12) - Ver errores de consola

## 📚 Documentación Relacionada

- `CREDENCIALES-SISTEMA.txt` - Credenciales de acceso
- `INICIO-MANUAL-PASO-A-PASO.txt` - Guía de inicio
- `docs/00-INICIO/CREDENCIALES-Y-ROLES.md` - Documentación de roles
- `SISTEMA-FUNCIONANDO.txt` - Estado actual del sistema

