# ✅ CHECKLIST DE VERIFICACIÓN POST-DEPLOY (STAGING)

**Fecha:** 2025-10-22  
**Objetivo:** Verificar que migraciones, parsers y triggers funcionan correctamente  
**Duración:** 30-45 minutos

---

## 🔍 FASE 1: VERIFICACIÓN DE MIGRACIONES (10 min)

### 1.1 PostGIS Inicializado ✅
```sql
-- Verificar versión PostGIS
SELECT PostGIS_version();
-- Esperado: 3.3.x o superior
```

**Criterio:** ✅ Debe mostrar versión instalada

---

### 1.2 Parser Version Añadida ✅
```sql
-- Verificar columna parser_version
SELECT 
    parser_version, 
    COUNT(*) AS sessions 
FROM "Session" 
GROUP BY parser_version 
ORDER BY parser_version;

-- Esperado:
-- parser_version | sessions
-- 1              | XXX (sesiones antiguas)
```

**Criterio:** ✅ Todas las sesiones tienen parser_version = 1

---

### 1.3 GPS Geography Columna ✅
```sql
-- Verificar columna geog
SELECT COUNT(*) AS total_gps,
       COUNT(geog) AS with_geog,
       COUNT(*) - COUNT(geog) AS missing_geog
FROM "GpsMeasurement";

-- Verificar índice GIST
\d "GpsMeasurement"
-- Debe mostrar: idx_gpsmeasurement_geog_gist
```

**Criterio:** 
- ✅ `missing_geog` = 0 (todos tienen geog)
- ✅ Índice GIST existe

---

### 1.4 Park Geometry PostGIS ✅
```sql
-- Verificar geometry_postgis
SELECT 
    name,
    geometry_postgis IS NOT NULL AS has_postgis_geom,
    geometry IS NOT NULL AS has_json_geom
FROM "Park"
ORDER BY name;

-- Esperado: ambos TRUE para Rozas y Alcobendas
```

**Criterio:** 
- ✅ Rozas y Alcobendas: ambos TRUE
- ✅ Solo 2 parques en total

---

### 1.5 Session Processing Columns ✅
```sql
-- Verificar columnas snake_case
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Session' 
  AND column_name IN (
      'processing_version',
      'matched_distance',
      'matched_duration',
      'matched_geometry',
      'matched_confidence'
  )
ORDER BY column_name;

-- Esperado: 5 columnas listadas
```

**Criterio:** ✅ 5/5 columnas existen

---

### 1.6 Parques Inválidos Eliminados ✅
```sql
-- Verificar solo quedan parques válidos
SELECT name FROM "Park" ORDER BY name;

-- Esperado:
-- Alcobendas
-- Rozas
```

**Criterio:** ✅ Solo 2 parques, ninguno inválido

---

## 🔍 FASE 2: VERIFICACIÓN DE PARSERS (15 min)

### 2.1 GPS Parser - Filtro Velocidad ✅
```sql
-- Verificar que no hay velocidades >200 km/h
SELECT 
    COUNT(*) AS total_puntos,
    COUNT(*) FILTER (WHERE speed > 200) AS velocidades_invalidas,
    MAX(speed) AS velocidad_maxima
FROM "GpsMeasurement";

-- Esperado: velocidades_invalidas = 0
```

**Criterio:** ✅ `velocidades_invalidas` = 0

---

### 2.2 GPS Parser - Filtro Coordenadas España ✅
```sql
-- Verificar que todas las coordenadas están en España (36-44°N, -10 a 5°E)
SELECT 
    COUNT(*) AS total_puntos,
    COUNT(*) FILTER (WHERE latitude < 36 OR latitude > 44) AS lat_fuera_rango,
    COUNT(*) FILTER (WHERE longitude < -10 OR longitude > 5) AS lon_fuera_rango
FROM "GpsMeasurement";

-- Esperado: ambos = 0
```

**Criterio:** ✅ Ambos filtros = 0

---

### 2.3 Estabilidad Parser - Validación Física (az ≈ 1g) ✅
```sql
-- Verificar aceleración vertical promedio ≈ 9.81 m/s² (1g)
SELECT 
    AVG(az) AS az_promedio,
    STDDEV(az) AS az_desviacion,
    MIN(az) AS az_min,
    MAX(az) AS az_max
FROM "StabilityMeasurement";

-- Esperado: az_promedio entre 9.5 y 10.1 m/s²
```

**Criterio:** ✅ `az_promedio` entre 9.5 y 10.1

---

### 2.4 Rotativo Parser - Claves 0-5 ✅
```sql
-- Verificar distribución de claves operacionales
SELECT 
    key AS clave,
    COUNT(*) AS mediciones
FROM "OperationalKey"
WHERE key IN (0, 1, 2, 3, 4, 5)
GROUP BY key
ORDER BY key;

-- Esperado: 6 filas (claves 0-5)
```

**Criterio:** ✅ 6 claves presentes

---

## 🔍 FASE 3: VERIFICACIÓN DE TRIGGERS (5 min)

### 3.1 Trigger GPS - geog Actualizado ✅
```sql
-- Insertar punto de prueba
INSERT INTO "GpsMeasurement" (
    id, "sessionId", timestamp, longitude, latitude, speed
) VALUES (
    gen_random_uuid(), 
    (SELECT id FROM "Session" LIMIT 1),
    NOW(),
    -3.7038, -- Madrid
    40.4168,
    50
);

-- Verificar que geog se creó automáticamente
SELECT 
    longitude, 
    latitude, 
    geog IS NOT NULL AS geog_creado
FROM "GpsMeasurement"
WHERE timestamp = (SELECT MAX(timestamp) FROM "GpsMeasurement");

-- Limpiar
DELETE FROM "GpsMeasurement" 
WHERE timestamp = (SELECT MAX(timestamp) FROM "GpsMeasurement");
```

**Criterio:** ✅ `geog_creado` = TRUE

---

### 3.2 Trigger Park - JSON Sincronizado ✅
```sql
-- Actualizar geometry_postgis de un parque
UPDATE "Park"
SET geometry_postgis = ST_SetSRID(
    ST_GeomFromText('POINT(-3.7038 40.4168)'), 4326
)
WHERE name = 'Rozas';

-- Verificar que geometry (JSON) se actualizó
SELECT 
    name,
    geometry_postgis IS NOT NULL AS has_postgis,
    geometry IS NOT NULL AS has_json,
    geometry::text
FROM "Park"
WHERE name = 'Rozas';
```

**Criterio:** ✅ Ambos campos actualizados

---

## 🔍 FASE 4: VERIFICACIÓN DE APIs (10 min)

### 4.1 API KPIs Summary ✅
```bash
# GET /api/kpis/summary
curl -X GET "http://localhost:9998/api/kpis/summary" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'

# Verificar respuesta incluye:
# - states (claves 0-5)
# - activity (km, horas)
# - stability (incidencias)
# - quality (índice)
```

**Criterio:** ✅ Respuesta 200 con todos los campos

---

### 4.2 API Stability Events ✅
```bash
# GET /api/stability/events
curl -X GET "http://localhost:9998/api/stability/events" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data | length'

# Verificar hay eventos
```

**Criterio:** ✅ Respuesta 200 con eventos

---

### 4.3 API GPS Tracks ✅
```bash
# GET /api/gps/tracks
curl -X GET "http://localhost:9998/api/gps/tracks?limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data[0]'

# Verificar estructura:
# - latitude, longitude
# - speed < 200
# - geog presente
```

**Criterio:** ✅ Respuesta 200 con tracks válidos

---

### 4.4 API Sessions List ✅
```bash
# GET /api/sessions
curl -X GET "http://localhost:9998/api/sessions?limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data[0]'

# Verificar campos:
# - parser_version (debe ser 1)
# - processing_version
# - matched_*
```

**Criterio:** ✅ Respuesta 200 con sesiones

---

## 🔍 FASE 5: VERIFICACIÓN FRONTEND (10 min)

### 5.1 Login Funciona ✅
```
1. Abrir: http://localhost:5174/login
2. Ingresar credenciales
3. Verificar redirección a /dashboard
```

**Criterio:** ✅ Login exitoso

---

### 5.2 Dashboard Carga ✅
```
1. Verificar KPIs se muestran
2. Verificar no hay errores en consola
3. Verificar filtros funcionan
4. Verificar cambio de tabs funciona
```

**Criterio:** ✅ Todo carga correctamente

---

### 5.3 Dashboard Refactorizado Funciona ✅
```
1. Abrir DevTools → Network
2. Verificar componente ExecutiveDashboard carga
3. Verificar no hay imports fallidos
4. Verificar hooks funcionan (KPIs, Maps, Parks)
```

**Criterio:** ✅ Sin errores 404 ni warnings críticos

---

### 5.4 Exportación PDF ✅
```
1. Ir a Dashboard → Panel General
2. Click en "EXPORTAR PDF"
3. Verificar PDF se genera
4. Verificar incluye KPIs y gráficas
```

**Criterio:** ✅ PDF generado correctamente

---

### 5.5 Filtros Globales ✅
```
1. Cambiar rango de fechas
2. Seleccionar vehículo específico
3. Verificar KPIs se actualizan
4. Verificar no hay errores
```

**Criterio:** ✅ Filtros actualizan datos

---

### 5.6 Upload Page ✅
```
1. Ir a /upload
2. Verificar componente modular carga
3. Verificar tabs funcionan
4. Subir archivo de prueba
```

**Criterio:** ✅ Upload funciona

---

## 📊 RESUMEN DE VERIFICACIÓN

### Scoring

| Fase | Tests | Pasados | Porcentaje |
|------|-------|---------|------------|
| **Migraciones** | 6 | __/6 | __% |
| **Parsers** | 4 | __/4 | __% |
| **Triggers** | 2 | __/2 | __% |
| **APIs** | 4 | __/4 | __% |
| **Frontend** | 6 | __/6 | __% |
| **TOTAL** | **22** | **__/22** | **__% ** |

---

### Criterios de Aceptación

| Resultado | Acción |
|-----------|--------|
| **22/22 (100%)** | ✅ Deploy a producción inmediato |
| **20-21/22 (90%+)** | ✅ Deploy con monitoreo intensivo |
| **18-19/22 (80%+)** | 🟡 Corregir fallos menores antes |
| **<18/22 (<80%)** | ❌ NO deploy, investigar problemas |

---

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### Problema 1: `az_promedio` fuera de rango
**Causa:** Datos con parser v1 (escala x100)  
**Solución:** Ejecutar reprocess con parser v2

### Problema 2: Parques inválidos aún presentes
**Causa:** SQL no ejecutado  
**Solución:** Ejecutar `04_cleanup_invalid_parks.sql`

### Problema 3: Frontend 404 en componentes
**Causa:** Build incompleto  
**Solución:** `npm run build` y limpiar cache

### Problema 4: APIs 500 error
**Causa:** Migraciones no aplicadas  
**Solución:** Verificar migraciones en orden

---

## ✅ CHECKLIST EJECUTIVO

```
PRE-DEPLOY:
□ Migraciones ejecutadas en orden
□ Backup de BD tomado
□ Build exitoso (frontend + backend)
□ Linter sin errores críticos

POST-DEPLOY STAGING:
□ 22/22 tests pasados
□ Performance aceptable (<3s)
□ Sin errores en logs
□ Monitoreo activo

READY FOR PRODUCTION:
□ QA aprobado
□ Stakeholders informados
□ Rollback plan listo
□ Monitoreo 24/7 preparado
```

---

**FIN DEL CHECKLIST**

**Usar este checklist para verificar cada deploy a staging/producción**

