# 🚀 GUÍA RÁPIDA DE DEPLOYMENT

**Sistema de Roles MANAGER - DobackSoft V3**  
**Fecha:** 22 octubre 2025

---

## ⚠️ ANTES DE EMPEZAR

### Requisitos Previos
- ✅ Backup completo de la base de datos
- ✅ Backend y frontend detenidos
- ✅ Acceso a PostgreSQL
- ✅ Node.js y npm instalados
- ✅ Variables de entorno configuradas

### Verificación de Backup

```powershell
# Crear backup completo
pg_dump -U usuario -d stabilsafe_dev > database/backups/backup_pre_roles_$(Get-Date -Format "yyyy-MM-dd_HHmmss").sql

# Verificar que se creó
ls database/backups/ | Sort-Object -Descending | Select-Object -First 1
```

---

## 📋 PASOS DE DEPLOYMENT

### **PASO 1: Migración de Roles (CRÍTICO)**

```powershell
# 1. Ir al directorio backend
cd backend

# 2. Ejecutar migración de roles
npx ts-node scripts/migrations/migrate-user-roles.ts

# 3. Verificar migración exitosa
```

**Resultado esperado:**
```
✓ Conexión a base de datos OK
✓ Total de usuarios en BD: X
⚠ Encontrados Y usuarios con rol 'USER' que serán convertidos a 'MANAGER'
💾 Backup creado: database/backups/backup_roles_migration_...
✓ Migración SQL ejecutada correctamente
✓ No quedan usuarios con rol USER
✅ MIGRACIÓN COMPLETADA CON ÉXITO
```

### **PASO 2: Migración de Tablas de Alertas y Reportes**

```powershell
# Ejecutar migración SQL directa
psql -U usuario -d stabilsafe_dev < database/migrations/002_add_alerts_and_reports.sql

# O usar Prisma Migrate
cd backend
npx prisma migrate dev --name add_alerts_and_reports
```

**Verificar:**
```sql
-- Verificar tablas creadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('MissingFileAlert', 'ScheduledReport');

-- Debe devolver:
-- MissingFileAlert
-- ScheduledReport
```

### **PASO 3: Generar Cliente Prisma**

```powershell
cd backend
npx prisma generate
```

### **PASO 4: Verificar Compilación**

```powershell
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

**Debe compilar sin errores** ✅

### **PASO 5: Iniciar Sistema**

```powershell
# Usar el script oficial
.\iniciar.ps1

# O manualmente
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## ✅ VALIDACIÓN POST-DEPLOYMENT

### 1. Verificar Roles en BD

```sql
-- Distribución de roles
SELECT role, COUNT(*) as total
FROM "User"
GROUP BY role;

-- Debe mostrar:
-- ADMIN: X
-- MANAGER: Y (antiguos USER)
-- OPERATOR: 0
-- VIEWER: 0
```

### 2. Testing de Login

**Como ADMIN:**
1. Login en `http://localhost:5174/login`
2. Verificar que ve TODAS las pestañas en navegación
3. Ir a Dashboard → Ver dashboard ejecutivo completo
4. Ir a Estabilidad, Telemetría, IA, Geofences → Acceso OK

**Como MANAGER:**
1. Crear usuario MANAGER de prueba (desde Admin)
2. Login como ese usuario
3. Verificar navegación limitada:
   - ✅ Panel de Control
   - ✅ Operaciones
   - ✅ Reportes
   - ✅ Alertas
   - ✅ Administración
   - ✅ Mi Cuenta
   - ❌ NO debe ver: Estabilidad, Telemetría, IA, Geofences, etc.
4. Ir a Dashboard → Ver 4 pestañas:
   - Estados & Tiempos
   - Puntos Negros
   - Velocidad
   - Sesiones & Recorridos

### 3. Testing de Funcionalidades Nuevas

**Alertas:**
```powershell
# Ejecutar verificación manual desde backend (como ADMIN)
curl -X POST http://localhost:9998/api/alerts/check \
  -H "Authorization: Bearer TOKEN"

# Verificar en frontend
# Ir a /alerts
# Debe mostrar dashboard de alertas
```

**Reportes Programados:**
```powershell
# Ir a /reports (próximamente tendrá pestaña de programados)
# O crear componente en /administration
```

**Administración MANAGER:**
```powershell
# Ir a /administration como MANAGER
# Debe mostrar 4 pestañas:
# - Mi Perfil
# - Parques/Talleres
# - Usuarios
# - Configuración
```

---

## 🚨 RESOLUCIÓN DE PROBLEMAS

### Problema: "Tabla MissingFileAlert no existe"

**Solución:**
```powershell
cd backend
npx prisma migrate dev --name add_alerts_and_reports
npx prisma generate
```

### Problema: "Permisos no definidos"

**Solución:**
1. Verificar que existen:
   - `frontend/src/types/permissions.ts`
   - `backend/src/types/permissions.ts`
2. Compilar nuevamente:
   ```powershell
   cd frontend && npm run build
   cd backend && npm run build
   ```

### Problema: "Usuario no puede acceder a nada"

**Solución:**
```sql
-- Verificar rol del usuario
SELECT id, email, name, role, "organizationId" 
FROM "User" 
WHERE email = 'email@usuario.com';

-- Si role es NULL o incorrecto, actualizar
UPDATE "User" 
SET role = 'MANAGER' 
WHERE email = 'email@usuario.com';
```

### Problema: "Cron jobs no se ejecutan"

**Solución:**
1. Verificar logs del servidor:
   ```powershell
   tail -f logs/app.log
   # Buscar: "Inicializando cron jobs del sistema"
   ```
2. Verificar que `initializeCronJobs()` se llama en `server.ts`

---

## 📊 CHECKLIST FINAL

### Migración
- [ ] Backup creado correctamente
- [ ] Migración 001 ejecutada (roles)
- [ ] Migración 002 ejecutada (alertas/reportes)
- [ ] Prisma generate ejecutado
- [ ] No hay errores en BD

### Compilación
- [ ] Backend compila sin errores
- [ ] Frontend compila sin errores
- [ ] No hay errores TypeScript

### Testing Funcional
- [ ] ADMIN puede acceder a todo
- [ ] MANAGER ve navegación limitada
- [ ] MANAGER ve dashboard con 4 pestañas
- [ ] ADMIN ve dashboard ejecutivo
- [ ] Alertas funcionan
- [ ] Administración MANAGER funciona

### Cron Jobs
- [ ] Verificación diaria configurada (08:00 AM)
- [ ] Reportes programados inicializados
- [ ] Logs muestran inicialización correcta

---

## 🎯 ROLLBACK EN CASO DE EMERGENCIA

Si algo sale mal:

```powershell
# 1. Detener servidor
# Ctrl+C en todas las terminales

# 2. Restaurar backup
psql -U usuario -d stabilsafe_dev < database/backups/backup_pre_roles_YYYY-MM-DD_HHmmss.sql

# 3. Verificar restauración
psql -U usuario -d stabilsafe_dev -c "SELECT COUNT(*) FROM \"User\";"

# 4. Reiniciar
.\iniciar.ps1
```

---

## ✅ DEPLOYMENT COMPLETADO

Si todos los pasos anteriores están ✅:

**¡SISTEMA ACTUALIZADO CON ÉXITO!** 🎉

**Funcionalidades nuevas disponibles:**
- ✅ Sistema de roles ADMIN/MANAGER
- ✅ Permisos granulares
- ✅ Dashboard diferenciado por rol
- ✅ Sistema de alertas
- ✅ Reportes programados
- ✅ Módulo administración MANAGER

**Próximos pasos:**
- Testing exhaustivo en producción
- Monitoreo de cron jobs
- Feedback de usuarios MANAGER
- Ajustes según necesidades

---

**SOPORTE:**
- Ver documentación completa en `docs/CALIDAD/ANALISIS-CRITICO-SISTEMA-ROLES-Y-ARQUITECTURA.md`
- Ver plan detallado en `docs/DESARROLLO/PLAN-IMPLEMENTACION-ROLES-MANAGER.md`


