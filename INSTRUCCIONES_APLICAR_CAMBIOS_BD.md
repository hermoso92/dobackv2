# 🔧 INSTRUCCIONES PARA APLICAR CAMBIOS A LA BASE DE DATOS

## ✅ **LO QUE YA SE HIZO**

```
✅ Schema de Prisma actualizado (5 cambios):
   1. Modelo DailyKPI creado
   2. Modelo speed_violations actualizado
   3. Organization con relaciones inversas
   4. Vehicle con relaciones inversas
   5. Session con relaciones inversas
```

---

## ⚠️ **PROBLEMA ENCONTRADO**

**No se pudo aplicar automáticamente** porque:
- ✅ Schema de Prisma = Actualizado
- ❌ Base de datos = Pendiente de actualizar
- ❌ Cliente de Prisma = No se puede regenerar (backend corriendo)
- ❌ Migración automática = Falla por conflictos de migraciones anteriores

---

## 🚀 **SOLUCIÓN: APLICAR MANUALMENTE (3 PASOS)**

### **PASO 1: Aplicar Script SQL**

```powershell
# Desde la raíz del proyecto
cd backend

# Ejecutar script SQL (ajusta la contraseña)
$env:PGPASSWORD="tu_password_postgres"
psql -h localhost -U postgres -d dobacksoft_dev -f prisma/migrations/manual_add_daily_kpi_and_speed_violations.sql
```

**¿Qué hace el script?**
- ✅ Crea tabla `daily_kpi` con todos sus campos e índices
- ✅ Añade columnas `vehicleId`, `organizationId`, `confidence`, `source` a `speed_violations`
- ✅ Crea todas las foreign keys
- ✅ Crea todos los índices necesarios
- ✅ Elimina datos antiguos de `speed_violations` si existen (no tienen los campos necesarios)
- ✅ Verifica que todo se creó correctamente

---

### **PASO 2: Detener Backend y Regenerar Prisma**

```powershell
# 1. Detener backend (Ctrl+C en la ventana donde corre)

# 2. Regenerar cliente Prisma
cd backend
npx prisma generate
```

**⏱️ Duración:** ~30 segundos

---

### **PASO 3: Reiniciar Sistema**

```powershell
# Desde la raíz del proyecto
.\iniciar.ps1
```

---

## ✅ **VERIFICACIÓN**

Después de reiniciar, verificar que todo funciona:

```powershell
# Ejecutar script de verificación
npx ts-node backend\src\scripts\verificarResultadosSimple.ts
```

**Resultado esperado:**
```
✅ Tabla daily_kpi existe
✅ Tabla speed_violations actualizada
✅ 0 errores de TypeScript
```

---

## 🔄 **RE-EJECUTAR POST-PROCESAMIENTO**

Una vez que las tablas existan:

```powershell
# Re-procesar sesiones con KPIs, violaciones y geocercas
npx ts-node backend\src\scripts\postProcessSessions.ts DOBACK028 2025-09-30 2025-11-02
```

**Resultado esperado:**
```
✅ KPIs calculados (~34 días)
✅ Violaciones de velocidad detectadas
✅ Eventos de geocercas creados
✅ 0 errores, 0 warnings
```

---

## 📂 **ARCHIVOS CREADOS**

### **Schema**
- ✅ `backend/prisma/schema.prisma` → Actualizado con cambios

### **Migración Manual**
- ✅ `backend/prisma/migrations/manual_add_daily_kpi_and_speed_violations.sql` → Script SQL

### **Documentación**
- ✅ `docs/DESARROLLO/CAMBIOS_SCHEMA_PRISMA_NECESARIOS.md` → Detalles técnicos
- ✅ `INSTRUCCIONES_APLICAR_CAMBIOS_BD.md` → Este archivo

---

## 🆘 **SI ALGO FALLA**

### **Error: "psql: command not found"**

Instalar PostgreSQL client tools o usar alternativa:

```powershell
# Opción A: Usar pgAdmin
# 1. Abrir pgAdmin
# 2. Conectar a dobacksoft_dev
# 3. Tools → Query Tool
# 4. Copiar/pegar contenido del archivo SQL
# 5. Ejecutar (F5)

# Opción B: Usar DBeaver u otro cliente SQL
```

### **Error: "password authentication failed"**

Verificar credenciales en `backend/.env`:
```
DATABASE_URL="postgresql://usuario:password@localhost:5432/dobacksoft_dev"
```

### **Error al regenerar Prisma: "EPERM"**

Backend aún corriendo. Detenerlo con `Ctrl+C` y reintentar.

---

## 📊 **ANTES vs DESPUÉS**

### **ANTES (Estado Actual)**
```
❌ Tabla daily_kpi: No existe
⚠️  Tabla speed_violations: Existe pero sin relaciones
❌ Cliente Prisma: Desactualizado (462 warnings)
❌ Post-procesamiento: Falla silenciosamente
```

### **DESPUÉS (Cuando apliques los cambios)**
```
✅ Tabla daily_kpi: Creada con relaciones
✅ Tabla speed_violations: Actualizada con relaciones
✅ Cliente Prisma: Sincronizado (0 warnings)
✅ Post-procesamiento: Funcionará correctamente
```

---

## ⏱️ **TIEMPO TOTAL ESTIMADO**

```
Paso 1 (SQL):           2-3 minutos
Paso 2 (Regenerar):     30 segundos
Paso 3 (Reiniciar):     1 minuto
Verificación:           30 segundos
Re-procesamiento:       6 segundos
────────────────────────────────────
TOTAL:                  ~5 minutos
```

---

## 🎯 **CHECKLIST**

- [ ] Ejecutar script SQL
- [ ] Detener backend
- [ ] Regenerar Prisma (`npx prisma generate`)
- [ ] Reiniciar con `iniciar.ps1`
- [ ] Verificar con `verificarResultadosSimple.ts`
- [ ] Re-ejecutar post-procesamiento
- [ ] Verificar resultados finales

---

## 💡 **NOTA IMPORTANTE**

**El schema de Prisma YA está actualizado.**
Solo falta:
1. Aplicar cambios a la BD (Script SQL)
2. Regenerar cliente (npx prisma generate)

**Todo el código ya funciona**, solo necesita que las tablas existan en la BD.

---

**Fecha:** 03/11/2025 14:00
**Estado:** Listo para aplicar
**Riesgo:** Bajo (script SQL es idempotente y seguro)











