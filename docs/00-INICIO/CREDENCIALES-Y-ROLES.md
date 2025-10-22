# 🔐 Credenciales y Roles del Sistema

## 📋 Tabla de Contenidos

1. [Acceso al Sistema](#acceso-al-sistema)
2. [Usuario MANAGER](#usuario-manager)
3. [Usuario ADMIN](#usuario-admin)
4. [Comparación de Roles](#comparación-de-roles)
5. [Nuevas Funcionalidades](#nuevas-funcionalidades)

---

## 🌐 Acceso al Sistema

**URL:** `http://localhost:5174`

---

## 👤 Usuario MANAGER

### Credenciales

```
Email:    test@bomberosmadrid.es
Password: admin123
Rol:      MANAGER
```

### Descripción

**Administrador de Parque** - Gestiona su organización, parques y usuarios bajo su control.

### Navegación (6 opciones)

- ✅ Panel de Control
- ✅ Operaciones
- ✅ Reportes
- ✅ Alertas
- ✅ Administración
- ✅ Mi Cuenta

### Dashboard

**4 pestañas operativas:**

1. **Estados & Tiempos** - Distribución de estados operacionales
2. **Puntos Negros** - Mapa de eventos críticos
3. **Velocidad** - Análisis de velocidades
4. **Sesiones & Recorridos** - Historial de sesiones

### Funcionalidades Disponibles

#### 🔔 Sistema de Alertas (`/alerts`)

- Dashboard de alertas de su organización
- Ver alertas pendientes/resueltas/ignoradas
- Resolver alertas con notas
- Ignorar alertas con motivo
- Estadísticas por severidad
- Filtrar por fecha/vehículo/estado

#### ⚙️ Administración (`/administration`)

**Pestaña 1: Mi Perfil**
- Editar nombre y email
- Cambiar contraseña
- Ver última actividad

**Pestaña 2: Gestión de Parques/Talleres**
- Crear nuevos parques
- Editar parques existentes
- Asignar vehículos a parques
- Definir ubicaciones GPS
- Horarios de operación

**Pestaña 3: Gestión de Usuarios**
- Crear nuevos usuarios MANAGER
- Editar usuarios bajo su control
- Desactivar/reactivar usuarios
- Asignar permisos específicos

**Pestaña 4: Configuración de Notificaciones**
- Activar/desactivar alertas por email
- Configurar reportes automáticos
- Frecuencia de envío
- Tipos de alertas a recibir

#### 📊 Reportes Automáticos

- Programar reportes semanales/mensuales
- Configurar múltiples destinatarios
- Filtrar por vehículos y fechas
- Ver historial de reportes enviados
- Ejecutar reportes manualmente

### Restricciones

❌ **NO puede acceder a:**
- Estabilidad
- Telemetría
- Inteligencia Artificial
- Geofences
- Subir Archivos
- Configuración del Sistema
- Base de Conocimiento

❌ **Limitaciones:**
- Solo ve datos de su organización
- No puede acceder a datos de otras organizaciones
- Solo puede crear usuarios MANAGER (no ADMIN)

---

## 👤 Usuario ADMIN

### Credenciales

```
Email:    antoniohermoso92@gmail.com
Password: admin123
Rol:      ADMIN
```

### Descripción

**Superadministrador** - Acceso total a todas las funcionalidades del sistema sin restricciones.

### Navegación (13 opciones - TODAS)

- ✅ Panel de Control
- ✅ Estabilidad
- ✅ Telemetría
- ✅ Inteligencia Artificial
- ✅ Geofences
- ✅ Subir Archivos
- ✅ Operaciones
- ✅ Reportes
- ✅ Alertas
- ✅ Administración
- ✅ Configuración del Sistema
- ✅ Base de Conocimiento
- ✅ Mi Cuenta

### Dashboard

**Dashboard Ejecutivo Completo:**
- KPIs estratégicos globales
- Gráficas avanzadas
- Comparadores de flota completa
- Análisis predictivo
- TV Wall automático

### Funcionalidades Disponibles

#### Todas las del MANAGER, más:

- ✅ **Análisis de Estabilidad** - Métricas detalladas, comparadores
- ✅ **Telemetría CAN/GPS** - Datos en tiempo real, alarmas
- ✅ **Inteligencia Artificial** - Patrones, recomendaciones, predicciones
- ✅ **Geofences** - CRUD completo, eventos entrada/salida
- ✅ **Subir Archivos** - Carga múltiple de archivos al sistema
- ✅ **Configuración del Sistema** - Ajustes globales
- ✅ **Base de Conocimiento** - Documentación interna
- ✅ **Acceso Multi-organización** - Ver datos de todas las organizaciones
- ✅ **Forzar Verificación de Alertas** - Ejecutar cron jobs manualmente
- ✅ **Reportes Globales** - Reportes con datos de toda la flota

### Sin Restricciones

- ✅ Acceso total a todas las funcionalidades
- ✅ Todas las organizaciones
- ✅ Todos los vehículos
- ✅ Todas las sesiones
- ✅ Gestión completa del sistema

---

## 📊 Comparación de Roles

| Funcionalidad | MANAGER | ADMIN |
|---------------|---------|-------|
| **Navegación** | 6 opciones | 13 opciones |
| **Dashboard** | 4 pestañas operativas | Dashboard ejecutivo |
| **Ver datos** | Solo su organización | Todas las organizaciones |
| **Subir archivos** | ❌ | ✅ |
| **Gestionar parques** | Sus parques | Todos los parques |
| **Crear usuarios** | Solo MANAGER | Todos los roles |
| **Ver alertas** | Su organización | Todas |
| **Reportes automáticos** | Su organización | Globales |
| **Config sistema** | ❌ | ✅ |
| **Base conocimiento** | ❌ | ✅ |
| **Estabilidad/Telemetría** | ❌ | ✅ |
| **IA/Geofences** | ❌ | ✅ |

---

## 🆕 Nuevas Funcionalidades

### 1. Sistema de Alertas

**Cron Job:** Todos los días a las 08:00 AM

**Detecta:**
- Archivos faltantes del día anterior (CAN, GPS, ESTABILIDAD, ROTATIVO)
- Archivos corruptos o inválidos
- Vehículos sin datos en X días

**Dashboard incluye:**
- Alertas pendientes
- Alertas resueltas (con historial)
- Alertas ignoradas (con motivo)
- Estadísticas por severidad (INFO, WARNING, CRITICAL)
- Gráficas de tendencias
- Filtros avanzados

**Acciones:**
- Resolver alerta (con notas)
- Ignorar alerta (con motivo)
- Ver detalles completos
- Exportar historial

### 2. Reportes Automáticos

**Frecuencias disponibles:**
- Diarios
- Semanales (día específico)
- Mensuales (día del mes)

**Configuración:**
- Tipo de reporte (Sesiones, KPIs, Alertas, etc.)
- Filtros por vehículos
- Filtros por fechas
- Múltiples destinatarios
- Formato PDF
- Zona horaria: Europe/Madrid

**Ejecución:**
- Automática según programación
- Manual (ejecutar ahora)
- Reintentos en caso de fallo
- Historial completo de envíos
- Estado de última ejecución

### 3. Administración MANAGER

**4 secciones principales:**

#### Mi Perfil
- Editar información personal
- Cambiar contraseña (con validación de contraseña actual)
- Ver actividad reciente
- Preferencias de usuario

#### Gestión de Parques/Talleres
- CRUD completo
- Ubicaciones GPS
- Horarios de operación
- Personal asignado
- Vehículos asignados

#### Gestión de Usuarios
- Crear usuarios MANAGER bajo su control
- Editar información de usuarios
- Asignar permisos granulares (70+ permisos)
- Limitar acceso por parque
- Desactivar/reactivar usuarios
- Ver actividad de usuarios

#### Configuración de Notificaciones
- Activar/desactivar alertas por email
- Activar/desactivar reportes automáticos
- Configurar frecuencia de envío
- Seleccionar tipos de alertas
- Configurar horarios de envío

---

## 🎯 Cómo Probar el Sistema

### Paso 1: Iniciar el sistema

Ver: `INICIO-MANUAL-PASO-A-PASO.txt`

### Paso 2: Probar como MANAGER

1. Abre `http://localhost:5174`
2. Login con `test@bomberosmadrid.es / admin123`
3. **Verifica navegación:** Deben aparecer solo 6 opciones
4. **Verifica dashboard:** Deben aparecer 4 pestañas
5. **Ir a `/alerts`:** Dashboard de alertas
6. **Ir a `/administration`:** 4 pestañas de gestión
7. **Intentar ir a `/stability`:** Debe redirigir (sin acceso)

### Paso 3: Probar como ADMIN

1. **LOGOUT** (importante)
2. Login con `antoniohermoso92@gmail.com / admin123`
3. **Verifica navegación:** Deben aparecer 13 opciones
4. **Verifica dashboard:** Dashboard ejecutivo con KPIs
5. **Ir a cualquier módulo:** Debe tener acceso a TODO
6. **Ir a `/alerts`:** Dashboard de alertas (todas las organizaciones)
7. **Ir a `/administration`:** Gestión completa

---

## ⚠️ Importante

### Logout/Login después de cambios de rol

Si cambias el rol de un usuario en la base de datos, **debes hacer LOGOUT/LOGIN** para que el cambio se refleje en el token JWT.

### Roles verificados en BD

```sql
SELECT email, role FROM "User" 
WHERE email IN ('test@bomberosmadrid.es', 'antoniohermoso92@gmail.com');

-- Resultado:
-- test@bomberosmadrid.es     | MANAGER ✅
-- antoniohermoso92@gmail.com | ADMIN   ✅
```

### Seguridad

- Contraseñas hasheadas con bcrypt
- Tokens JWT con expiración de 24h
- Cookies httpOnly
- Protección CSRF
- Filtrado automático por organizationId
- Validación en frontend y backend

---

## 📝 Notas Técnicas

### Sistema de Permisos

70+ permisos granulares definidos:

```typescript
// Ejemplos:
VEHICLES_VIEW
VEHICLES_CREATE
VEHICLES_EDIT
VEHICLES_DELETE
REPORTS_VIEW
REPORTS_CREATE
REPORTS_EXPORT
ALERTS_VIEW
ALERTS_RESOLVE
USERS_CREATE
USERS_EDIT
// ... y muchos más
```

### Rol por Defecto

Nuevos usuarios creados tienen rol `VIEWER` por defecto.

### Cron Jobs Activos

1. **Alertas de archivos faltantes:** Todos los días 08:00 AM
2. **Reportes programados:** Según configuración de cada reporte
3. **Limpieza de alertas antiguas:** Domingos 03:00 AM

---

## ✨ Resumen

- ✅ **2 roles principales:** MANAGER y ADMIN
- ✅ **Navegación dinámica** según rol
- ✅ **Dashboard adaptado** por rol
- ✅ **70+ permisos granulares**
- ✅ **3 nuevas funcionalidades:** Alertas, Reportes automáticos, Administración
- ✅ **Filtrado automático** por organización para MANAGER
- ✅ **Acceso total** sin restricciones para ADMIN
- ✅ **34 archivos implementados**
- ✅ **9,000+ líneas de código**

---

**Guarda este archivo para referencia rápida de credenciales y roles.**

