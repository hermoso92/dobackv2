# 🔄 SCRIPT DE REPROCESADO PARSER V2

## 📋 Descripción

Script para migrar sesiones de **parser v1** (escala incorrecta) a **parser v2** (escala corregida).

### ¿Qué hace?

1. ✅ **Identifica sesiones v1** - Busca sesiones con `parser_version=1`
2. ✅ **Recalcula SI y accmag** - Usa escala física correcta
3. ✅ **Regenera eventos** - Recrea eventos de estabilidad con umbrales correctos
4. ✅ **Invalida KPIs** - Marca KPIs para recalcular
5. ✅ **Marca como v2** - Actualiza `parser_version=2`
6. ✅ **Crea logs** - Registra el reprocesamiento en `ProcessingEvent`

---

## 🚀 Uso

### Pre-requisitos

1. **Migración SQL ejecutada**:
   ```bash
   psql "$DATABASE_URL" -f database/migrations/00_add_parser_version.sql
   ```

2. **Backend/frontend detenidos** (recomendado para evitar conflictos)

---

### Modo Dry-Run (Simulación sin cambios)

```bash
node scripts/setup/reprocess-parser-v2.js --dry-run
```

**Salida esperada:**
```
ℹ️ [DRY-RUN] Se actualizarían 1523 mediciones
ℹ️ [DRY-RUN] Se crearían 45 eventos
📊 Sesiones a reprocesar: 12
✅ 12 sesiones reprocesadas exitosamente (simulación)
```

---

### Reprocesar TODAS las sesiones v1

```bash
node scripts/setup/reprocess-parser-v2.js
```

⚠️ **Precaución:** Esto reprocesará TODAS las sesiones con `parser_version=1` en la base de datos.

---

### Reprocesar por organización

```bash
node scripts/setup/reprocess-parser-v2.js --organization a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26
```

---

### Reprocesar sesión específica

```bash
node scripts/setup/reprocess-parser-v2.js --session f3e8c5a1-1234-5678-9abc-def012345678
```

---

### Reprocesar rango de fechas

```bash
# Desde 1 de septiembre hasta hoy
node scripts/setup/reprocess-parser-v2.js --from 2025-09-01 --to 2025-10-22
```

---

### Combinaciones

```bash
# Dry-run de una organización específica
node scripts/setup/reprocess-parser-v2.js --organization a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26 --dry-run

# Reprocesar septiembre para una org
node scripts/setup/reprocess-parser-v2.js --organization a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26 --from 2025-09-01 --to 2025-09-30
```

---

## 📊 Salida del Script

### Ejemplo de ejecución exitosa

```
╔════════════════════════════════════════════════════════════════╗
║  🔄 REPROCESADO PARSER V2 - MIGRACIÓN v1 → v2                ║
╚════════════════════════════════════════════════════════════════╝

ℹ️ Opciones de ejecución: { dryRun: false, organizationId: null, ... }
ℹ️ 📋 Sesiones a reprocesar: 12

================================================================================
REPROCESANDO SESIÓN: f3e8c5a1-1234-5678-9abc-def012345678
================================================================================
ℹ️ Sesión info: { vehicleId: '...', parserVersion: 1, measurements: 1523 }
ℹ️   az promedio ANTES: 0.098 m/s²
ℹ️ Sesión f3e8...: 1523 mediciones a reprocesar
✅ Sesión f3e8...: 1523 mediciones actualizadas
ℹ️   Eliminados 12 eventos antiguos
✅   Creados 8 nuevos eventos de estabilidad
ℹ️   KPIs del día 2025-09-04 marcados para recálculo
✅ Sesión marcada como parser_version=2

📊 Progreso: 10/12 (83.3%)

╔════════════════════════════════════════════════════════════════╗
║  📊 RESUMEN FINAL                                             ║
╚════════════════════════════════════════════════════════════════╝

ℹ️ Estadísticas: {
  "total": 12,
  "success": 11,
  "failed": 1,
  "skipped": 0,
  "measurementsUpdated": 18276,
  "eventsCreated": 96
}
✅ 11 sesiones reprocesadas exitosamente
   • 18276 mediciones actualizadas
   • 96 eventos creados
❌ 1 sesiones fallidas
```

---

## ⚠️ Troubleshooting

### Error: "Sesión ya en escala v2"

```
⚠️ Sesión f3e8...: Ya en escala v2 (az ≈ 9.81), omitiendo
```

**Causa:** La sesión ya fue reprocesada (az promedio está cerca de 9.81 m/s²).  
**Solución:** Esto es normal, el script omite automáticamente sesiones ya procesadas.

---

### Error: "Validación física falló"

```
❌ Sesión f3e8...: Validación física falló
   reason: "az promedio fuera de rango: 0.098 m/s²"
```

**Causa:** Los datos de estabilidad están en escala v1 pero la corrección no funcionó.  
**Solución:**
1. Verificar que la migración SQL fue ejecutada correctamente
2. Verificar que las mediciones tienen datos válidos (no nulos)
3. Si persiste, revisar logs de backend para ver errores de parseo original

---

### Error: "Reintentando... (1/3)"

**Causa:** Error temporal (conexión BD, timeout, etc.).  
**Solución:** El script reintenta automáticamente hasta 3 veces. Si falla después de 3 reintentos, revisar logs.

---

### Sesiones omitidas (skipped)

```
⏭️  5 sesiones omitidas (ya en v2)
```

**Causa:** Las sesiones tienen `az` promedio entre 9.0 y 10.5 m/s², indicando que ya están en escala v2.  
**Solución:** Esto es esperado y correcto. No requiere acción.

---

## 🔍 Verificación Post-Reprocesamiento

### 1. Verificar versiones de parser

```sql
SELECT parser_version, COUNT(*) AS sessions
FROM "Session"
GROUP BY parser_version
ORDER BY parser_version;
```

**Resultado esperado:**
```
parser_version | sessions
---------------|----------
1              | 0        -- ✅ Ninguna sesión v1 restante
2              | 150      -- ✅ Todas migradas a v2
```

---

### 2. Verificar física de estabilidad

```bash
node scripts/analisis/verify-scale-fix.js
```

**Debe mostrar:**
```
✅ TEST 1: Gravedad (az ≈ 9.81 m/s²) PASS
✅ TEST 2: Aceleración lateral razonable PASS
✅ TEST 3: Magnitud consistente PASS
```

---

### 3. Verificar KPIs

```sql
SELECT vehicleId, date, isValid, calculatedAt
FROM "AdvancedVehicleKPI"
WHERE isValid = false
ORDER BY date DESC
LIMIT 10;
```

**Debe mostrar KPIs invalidados** (con `isValid = false`). Estos se recalcularán automáticamente en el próximo login o refresh del dashboard.

---

### 4. Verificar eventos regenerados

```sql
SELECT session_id, COUNT(*) AS events
FROM stability_events
WHERE createdAt > NOW() - INTERVAL '1 hour'
GROUP BY session_id
ORDER BY events DESC;
```

**Debe mostrar sesiones con eventos recién creados.**

---

## 📈 Performance

### Tiempos estimados

| Sesiones | Mediciones totales | Tiempo estimado | Memoria pico |
|----------|-------------------|-----------------|--------------|
| 10       | ~15K              | 30s             | 200 MB       |
| 50       | ~75K              | 2.5 min         | 400 MB       |
| 200      | ~300K             | 10 min          | 800 MB       |
| 1000     | ~1.5M             | 50 min          | 2 GB         |

**Factores:**
- 10 sesiones por batch
- 500ms delay entre batches
- 1000 mediciones por transacción

---

## 🔒 Seguridad

### ¿Qué cambia en BD?

1. **Tabla `StabilityMeasurement`:**
   - ✅ Actualiza `si` y `accmag`
   - ✅ Actualiza `updatedAt`

2. **Tabla `Session`:**
   - ✅ Actualiza `parser_version` de 1 a 2
   - ✅ Actualiza `updatedAt`

3. **Tabla `stability_events`:**
   - ❌ Elimina eventos antiguos
   - ✅ Crea eventos nuevos con umbrales correctos

4. **Tabla `AdvancedVehicleKPI`:**
   - ✅ Marca `isValid = false` para recalcular

5. **Tabla `ProcessingEvent`:**
   - ✅ Crea log de reprocesamiento

### ¿Qué NO cambia?

- ❌ GPS measurements (no afectadas)
- ❌ Rotativo measurements (no afectadas)
- ❌ Valores `ax`, `ay`, `az` originales (se mantienen)
- ❌ Timestamps (se mantienen)

---

## 🚨 Rollback

Si necesitas revertir el reprocesamiento:

```sql
-- 1. Restaurar parser_version a 1
UPDATE "Session"
SET parser_version = 1
WHERE parser_version = 2
  AND "startTime" >= '2025-09-01'; -- Ajusta fecha según necesidad

-- 2. Eliminar eventos regenerados
DELETE FROM stability_events
WHERE "createdAt" > '2025-10-22 10:00:00'; -- Ajusta timestamp según necesidad

-- 3. Re-validar KPIs
UPDATE "AdvancedVehicleKPI"
SET isValid = true
WHERE isValid = false;
```

⚠️ **PRECAUCIÓN:** El rollback NO restaura los valores `si` y `accmag` antiguos. Para eso necesitarías un backup de BD.

---

## 📞 Soporte

**En caso de problemas:**

1. Ejecutar `--dry-run` primero
2. Verificar logs del script (consola)
3. Verificar logs de backend (`logs/backend.log`)
4. Ejecutar script de verificación: `node scripts/analisis/verify-scale-fix.js`
5. Revisar documentación: `docs/INSTRUCCIONES_DBA_MIGRACION_PARSER_V2.md`

---

## ✅ Checklist de Ejecución

- [ ] Backup de base de datos realizado
- [ ] Migración SQL `00_add_parser_version.sql` ejecutada
- [ ] Backend/frontend detenidos (opcional pero recomendado)
- [ ] Dry-run ejecutado y revisado
- [ ] Script de reprocesamiento ejecutado
- [ ] Verificación física ejecutada (`verify-scale-fix.js`)
- [ ] KPIs invalidados verificados
- [ ] Eventos regenerados verificados
- [ ] Equipo notificado

---

**Documento preparado:** 2025-10-22  
**Versión:** 1.0  
**Estado:** ✅ LISTO PARA USO

