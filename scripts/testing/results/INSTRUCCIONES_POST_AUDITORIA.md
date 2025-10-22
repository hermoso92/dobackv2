# 📘 Instrucciones Post-Auditoría

**Fecha de Auditoría:** 21 de Octubre de 2025  
**Estado del Sistema:** FUNCIONAL CON CORRECCIONES PENDIENTES  
**Tasa de Éxito:** 60% (10/15 tests pasados)

---

## 🎯 ACCIÓN INMEDIATA REQUERIDA

El sistema está **operativo** pero requiere correcciones **críticas** antes de despliegue en producción.

---

## 📋 CHECKLIST DE CORRECCIONES

### 🔴 CRÍTICO (Bloquean uso productivo)

#### 1. Corregir `/api/sessions` (Error 500)
**Prioridad:** 🔴 MÁXIMA  
**Esfuerzo:** 2-4 horas  
**Ubicación:** `backend/src/routes/sessions.ts`

**Pasos:**
```bash
# 1. Verificar logs del backend
tail -f backend/logs/app.log | grep "sessions"

# 2. Revisar endpoint en routes/sessions.ts
# Buscar línea que causa el error 500

# 3. Verificar query Prisma
# Revisar si faltan relaciones o campos

# 4. Test manual
curl -X GET "http://localhost:9998/api/sessions?organizationId=a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Verificación:**
- [ ] Endpoint devuelve 200 OK
- [ ] Respuesta contiene array de sesiones
- [ ] UI muestra sesiones correctamente

---

#### 2. Aplicar Regla "No-Scroll" en UI
**Prioridad:** 🔴 MÁXIMA  
**Esfuerzo:** 1-2 horas  
**Ubicación:** `frontend/src/styles/global.css`

**Cambios Necesarios:**
```css
/* En global.css - MODIFICAR */
.app-layout {
  overflow-y: hidden; /* Cambiar de 'auto' → 'hidden' */
  height: 100vh;
}

.main-content {
  overflow-y: hidden; /* Cambiar de 'auto' → 'hidden' */
  height: calc(100vh - var(--header-height, 64px));
}

/* Permitir scroll SOLO en contenedores internos */
.dashboard-content,
.tab-content,
.data-table-container {
  overflow-y: auto; /* OK aquí según StabilSafe V2 */
  max-height: 100%;
}
```

**Verificación:**
- [ ] Containers principales no tienen scroll
- [ ] Scroll solo en tablas/listas internas
- [ ] Re-ejecutar auditoría UI: `node scripts/testing/audit-ui-playwright.js`
- [ ] Test "noScrollRule" debe pasar

---

#### 3. Corregir `/api/speed/violations` (Error 500)
**Prioridad:** 🔴 MÁXIMA  
**Esfuerzo:** 3-6 horas  
**Ubicación:** `backend/src/routes/speed.ts` o crear si no existe

**Pasos:**
```bash
# 1. Verificar si endpoint existe
grep -r "speed/violations" backend/src/routes/

# 2. Si no existe, crear endpoint
# Copiar estructura de /api/events y adaptar

# 3. Implementar lógica de negocio
# - Consultar tabla speed_violations o telemetry_data
# - Filtrar por organizationId
# - Aplicar filtros: vehicleId, dateRange, minSpeed
# - Ordenar por severity

# 4. Test manual
curl "http://localhost:9998/api/speed/violations?organizationId=a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Verificación:**
- [ ] Endpoint devuelve 200 OK
- [ ] Tab "Velocidad" muestra datos
- [ ] Gráficas de velocidad funcionan
- [ ] No hay errores 500 en consola

---

#### 4. Corregir `/api/telemetry-v2/sessions` (Error 500)
**Prioridad:** 🔴 MÁXIMA  
**Esfuerzo:** 3-6 horas  
**Ubicación:** `backend/src/routes/telemetry-v2.ts`

**Pasos:**
```bash
# 1. Verificar implementación actual
cat backend/src/routes/telemetry-v2.ts

# 2. Verificar query Prisma
# Buscar prisma.session.findMany() con relaciones

# 3. Revisar campos solicitados
# ¿Faltan campos en schema o relaciones?

# 4. Test manual
curl "http://localhost:9998/api/telemetry-v2/sessions?organizationId=a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Verificación:**
- [ ] Endpoint devuelve 200 OK
- [ ] Tab "Sesiones" carga lista de sesiones
- [ ] Mapa muestra rutas de sesiones
- [ ] No hay errores 500 en consola

---

### 🟠 ALTO (Afectan experiencia)

#### 5. Optimizar Carga del Dashboard (7.4s → <3s)
**Prioridad:** 🟠 ALTA  
**Esfuerzo:** 4-8 horas  
**Ubicación:** `frontend/src/pages/Dashboard.tsx`

**Estrategias:**
```typescript
// 1. Implementar lazy loading
const SpeedAnalysisTab = lazy(() => import('./components/speed/SpeedAnalysisTab'));
const SessionsView = lazy(() => import('./components/sessions/SessionsView'));

// 2. Cargar KPIs en paralelo
const loadDashboardData = async () => {
  const [kpis, devices, events] = await Promise.all([
    fetchKPIs(),
    fetchDevices(),
    fetchEvents()
  ]);
};

// 3. Implementar code splitting
// En vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'charts': ['recharts', 'chart.js'],
        'maps': ['leaflet', 'react-leaflet'],
        'vendor': ['react', 'react-dom']
      }
    }
  }
}
```

**Verificación:**
- [ ] Dashboard carga en <3 segundos
- [ ] Componentes pesados lazy-loaded
- [ ] Bundle size reducido
- [ ] Re-ejecutar auditoría UI

---

#### 6. Optimizar `/api/devices/status` (3.1s → <1s)
**Prioridad:** 🟠 ALTA  
**Esfuerzo:** 2-4 horas  
**Ubicación:** `backend/src/routes/devices.ts`

**Optimizaciones:**
```typescript
// 1. Implementar caché
import { CacheService } from '../services/CacheService';
const cache = new CacheService({ ttl: 30000 }); // 30s

router.get('/status', async (req, res) => {
  const cacheKey = `devices:${organizationId}:${date}`;
  
  let data = cache.get(cacheKey);
  if (!data) {
    data = await getDevicesStatus(organizationId, date);
    cache.set(cacheKey, data);
  }
  
  res.json(data);
});

// 2. Agregar índice en BD
// En prisma/schema.prisma
model Vehicle {
  // ...
  @@index([organizationId, updatedAt])
}

// 3. Paralelizar verificación de archivos
const fileChecks = vehicles.map(v => checkVehicleFiles(v));
const results = await Promise.all(fileChecks);
```

**Verificación:**
- [ ] Endpoint responde en <1 segundo
- [ ] Caché funciona (segundo request instantáneo)
- [ ] Dashboard refresh más rápido

---

#### 7. Corregir `/api/sessions/ranking` (Error 500)
**Prioridad:** 🟠 ALTA  
**Esfuerzo:** 2-3 horas  
**Ubicación:** `backend/src/routes/sessions.ts`

**Pasos:**
```typescript
// Implementar endpoint de ranking
router.get('/ranking', async (req, res) => {
  const { organizationId, metric = 'events', limit = 10 } = req.query;
  
  const sessions = await prisma.session.findMany({
    where: { organizationId },
    include: {
      vehicle: true,
      _count: {
        select: {
          stabilityEvents: true,
          telemetryData: true
        }
      }
    },
    orderBy: metric === 'events' 
      ? { stabilityEvents: { _count: 'desc' } }
      : { duration: 'desc' },
    take: parseInt(limit)
  });
  
  res.json(sessions);
});
```

**Verificación:**
- [ ] Endpoint devuelve 200 OK
- [ ] Ranking muestra top sesiones
- [ ] Tab "Sesiones" muestra ranking

---

#### 8. Verificar Filtros Globales en UI
**Prioridad:** 🟠 ALTA  
**Esfuerzo:** 1-2 horas  
**Ubicación:** `frontend/src/components/filters/GlobalFiltersBar.tsx`

**Debug:**
```typescript
// En GlobalFiltersBar.tsx
console.log('GlobalFiltersBar rendered:', {
  vehicles,
  selectedVehicle,
  isVisible: true
});

// Agregar data-testid para Playwright
<select 
  data-testid="vehicle-filter"
  name="vehicle"
  value={selectedVehicle}
  onChange={handleVehicleChange}
>
  <option value="">Todos los vehículos</option>
  {vehicles.map(v => (
    <option key={v.id} value={v.id}>{v.name}</option>
  ))}
</select>
```

**Verificación:**
- [ ] Filtros se renderizan correctamente
- [ ] Selector de vehículos visible
- [ ] Playwright detecta selectores
- [ ] Test "globalFilters" pasa

---

## 🔄 FLUJO DE CORRECCIÓN RECOMENDADO

### Semana 1 (Críticos)
```
Día 1-2: Corregir /api/sessions (C1)
Día 2-3: Aplicar regla No-Scroll (C2)
Día 3-4: Corregir /api/speed/violations (C3)
Día 4-5: Corregir /api/telemetry-v2/sessions (C4)
```

### Semana 2 (Altos)
```
Día 1-2: Optimizar dashboard load (A1)
Día 3: Optimizar /api/devices/status (A2)
Día 4: Corregir /api/sessions/ranking (A3)
Día 5: Verificar filtros globales (A4)
```

---

## ✅ VALIDACIÓN POST-CORRECCIÓN

### Ejecutar Suite Completa de Tests
```powershell
# 1. Reiniciar servicios
.\iniciar.ps1

# 2. Esperar 30 segundos

# 3. Ejecutar auditoría backend
cd scripts\testing
.\audit-dashboard.ps1

# 4. Ejecutar auditoría UI
node audit-ui-playwright.js

# 5. Verificar reportes
cat results\AUDITORIA_COMPLETA_*.md
```

### Criterios de Éxito
- [ ] **Tasa de Éxito Backend:** ≥80% (4/5 endpoints OK)
- [ ] **Tasa de Éxito UI:** 100% (10/10 tests OK)
- [ ] **Tasa Global:** ≥90%
- [ ] **0 Problemas Críticos**
- [ ] **Dashboard Load:** <3 segundos
- [ ] **API Response:** <1 segundo promedio
- [ ] **Errores de Consola:** <5 warnings

---

## 📊 MÉTRICAS DE PROGRESO

### Estado Actual (Post-Auditoría Inicial)
```
Backend Tests:     2/5  (40%)  ❌
UI Tests:          8/10 (80%)  ⚠️
Tasa Global:       10/15 (60%) ⚠️
Problemas Críticos: 4          🔴
Problemas Altos:    4          🟠
```

### Objetivo Post-Corrección
```
Backend Tests:     5/5  (100%) ✅
UI Tests:          10/10 (100%) ✅
Tasa Global:       15/15 (100%) ✅
Problemas Críticos: 0          ✅
Problemas Altos:    0          ✅
```

---

## 📁 ARCHIVOS DE REFERENCIA

### Reportes de Auditoría
- **Completo:** `scripts/testing/results/AUDITORIA_COMPLETA_FINAL_21OCT2025.md`
- **Resumen JSON:** `scripts/testing/results/auditoria-resumen-ejecutivo.json`
- **Backend:** `scripts/testing/results/20251022_001911/audit-report.md`
- **UI:** `scripts/testing/results/ui-audit-results.json`

### Screenshots
- **Carpeta:** `scripts/testing/results/screenshots/`
- **Archivos:** 8 imágenes PNG de login y todos los tabs

### Logs
- **Backend:** `backend/logs/app.log`
- **Auditoría:** `scripts/testing/results/20251022_001911/audit-debug.log`

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: "Backend no disponible"
```powershell
# Verificar puerto
Get-NetTCPConnection -LocalPort 9998

# Si no hay proceso, reiniciar
.\iniciar.ps1
```

### Error: "Playwright tests fail"
```bash
# Reinstalar Playwright
npm install playwright
npx playwright install
```

### Error: "Database connection failed"
```bash
# Verificar PostgreSQL
psql -U postgres -d dobacksoft -c "SELECT 1;"

# Si falla, iniciar PostgreSQL
net start postgresql-x64-14
```

---

## 📞 CONTACTO Y SOPORTE

Para dudas sobre la auditoría o implementación de correcciones:
- **Documentación Completa:** `scripts/testing/README.md`
- **Checklist Manual:** `scripts/testing/dashboard-ui-checklist.md`
- **Configuración:** `scripts/testing/audit-config.sample.json`

---

**Última Actualización:** 21 de Octubre de 2025, 22:20 UTC  
**Generado por:** Sistema Automatizado de Auditoría Cursor AI

