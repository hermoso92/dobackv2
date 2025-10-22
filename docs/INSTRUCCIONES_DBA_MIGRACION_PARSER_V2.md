# INSTRUCCIONES DBA – MIGRACIÓN PARSER V2 (RUNBOOK ÚNICO)

> Objetivo: pasar el sistema a **parser v2** (escala corregida), normalizar columnas, estabilizar GPS/GEO y limpiar datos inválidos.  
> Este runbook **reemplaza** cualquier documento previo. Mantiene **Quick Start** y **verificaciones**.

---

## 🚀 Quick Start

1) **Extensiones y versión de parser**
```sh
psql "$DATABASE_URL" -f database/migrations/01_postgis_init.sql
psql "$DATABASE_URL" -f database/migrations/00_add_parser_version.sql
```

2) **Geo estable (GPS + Parks)**
```sh
psql "$DATABASE_URL" -f database/migrations/02_geo_backfill_and_sync.sql
```

3) **Normalizar columnas de sesión (snake_case)**
```sh
psql "$DATABASE_URL" -f database/migrations/03_session_processing_columns.sql
```

4) **Limpieza de parques inválidos** (multi-tenant: fijar contexto)
```sh
psql "$DATABASE_URL" -c "SET app.org_id = 'TU-ORG-UUID';" \
     -f database/migrations/04_cleanup_invalid_parks.sql
# Single-tenant: omite el SET y ejecuta el .sql
```

5) **Verificaciones rápidas**
```sql
-- Parser
SELECT parser_version, COUNT(*) FROM "Session" GROUP BY 1 ORDER BY 1;

-- GPS
SELECT COUNT(*) AS gps_without_geog FROM "GpsMeasurement" WHERE geog IS NULL;

-- Parks
SELECT
  COUNT(*) FILTER (WHERE geometry_postgis IS NULL AND geometry IS NOT NULL) AS parks_missing_geom_after_init,
  COUNT(*) FILTER (WHERE geometry_postgis IS NOT NULL AND geometry IS NULL) AS parks_missing_json_after_trigger
FROM "Park";

-- Session columns
SELECT column_name FROM information_schema.columns
WHERE table_name='Session'
  AND column_name IN ('processing_version','matched_distance','matched_duration','matched_geometry','matched_confidence')
ORDER BY column_name;
```

---

## 📋 Detalle por fases

### Fase F1 — Parser V2 (escala corregida)

* Asegura `parser_version` en `Session` (DEFAULT 1).
* El backend **debe** setear `parser_version=2` al reprocesar con el parser corregido (división por 100 antes de /9.81).

### Fase F2 — Geo estable

* `GpsMeasurement.geog` (`geography(POINT,4326)`) con índice GIST y trigger de mantenimiento.
* `Park.geometry_postgis` como **fuente de verdad**; `geometry` JSONB se escribe desde el trigger (GeoJSON).
* **Contrato:** edición en PostGIS → refleja JSON; no al revés (evita ping-pong).

### Fase F3 — Columnas de sesión (snake_case)

* `processingVersion` → `processing_version` (preserva datos).
* `matchedDistance|Duration|Geometry|Confidence` → `matched_distance|duration|geometry|confidence`.
* Idempotente, con `DROP COLUMN` de las camelCase (opcional, ya incluido).

### Fase F4 — Limpieza "parques"

* Borrado **seguro** con `SET app.org_id` si multi-tenant y columna `organization_id` existe.
* Pre y post-checks incluidos; resultado esperado: solo quedan parques válidos.

---

## 🔁 Rollback y seguridad

* Todos los scripts son **idempotentes**.
* Si algún paso falla:
  1. `ROLLBACK` del script en curso.
  2. Corregir causa (p.ej., columna faltante en tablas personalizadas).
  3. Re-ejecutar el script (no deja el esquema en estado intermedio).

---

## ✅ Criterios de aceptación (QA)

* `Session.parser_version` presente y poblado (1/2).
* `Session.processing_version` presente (`'1.0'` por defecto).
* `GpsMeasurement.geog` no nulo cuando haya `longitude/latitude`.
* `Park.geometry_postgis` y `geometry` sincronizados (trigger activo).
* Columnas `matched_*` en **snake_case**, sin duplicados camelCase.
* Parques inválidos eliminados con pre/post-checks OK.

---

## 🧪 Post-migración recomendada

### Paso 1: Reprocesar sesiones (v1 → v2)

**Script automatizado disponible:**

```bash
# 1. Dry-run (simulación)
node scripts/setup/reprocess-parser-v2.js --dry-run

# 2. Reprocesar TODAS las sesiones v1
node scripts/setup/reprocess-parser-v2.js

# 3. Reprocesar por organización
node scripts/setup/reprocess-parser-v2.js --organization ORG_UUID

# 4. Reprocesar rango de fechas
node scripts/setup/reprocess-parser-v2.js --from 2025-09-01 --to 2025-10-22

# 5. Reprocesar sesión específica
node scripts/setup/reprocess-parser-v2.js --session SESSION_UUID
```

**Documentación completa:** `scripts/setup/README_REPROCESS_PARSER_V2.md`

---

### Paso 2: Verificar física corregida

```bash
node scripts/analisis/verify-scale-fix.js
```

**Resultado esperado:**
```
✅ TEST 1: Gravedad (az ≈ 9.81 m/s²) PASS
✅ TEST 2: Aceleración lateral razonable PASS  
✅ TEST 3: Magnitud consistente PASS
🎉 El fix de escala 100x está funcionando correctamente
```

---

### Paso 3: Recalcular KPIs/IA

Los KPIs se recalcularán automáticamente al:
- Abrir el dashboard
- Seleccionar una sesión
- Ejecutar reportes

Para forzar recálculo inmediato:

```sql
-- Invalidar todos los KPIs para recalcular
UPDATE "AdvancedVehicleKPI"
SET isValid = false, updatedAt = NOW()
WHERE date >= '2025-09-01';
```

---

### Paso 4: Tests de física en CI (opcional)

```js
// tests/unit/parsers/stability.physics.test.ts
describe('Stability Parser V2 - Physics Validation', () => {
  it('should have az ≈ 9.81 m/s² (gravity)', () => {
    const measurements = parseStabilityFile(buffer);
    const meanAz = mean(measurements.map(m => m.az));
    expect(meanAz).toBeGreaterThan(9.5);
    expect(meanAz).toBeLessThan(10.1);
  });
  
  it('should have lateral accelerations < 5g', () => {
    const measurements = parseStabilityFile(buffer);
    const maxLateral = max(measurements.map(m => Math.abs(m.ay)));
    expect(maxLateral).toBeLessThan(50); // 5g ≈ 50 m/s²
  });
});
```

---

**FIN DEL RUNBOOK**

