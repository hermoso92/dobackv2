# 🔄 COMPARACIÓN: Backend Dev (TypeScript) vs Backend Prod (backend-final.js)

## 📊 RESUMEN

| Característica | Backend DEV (TypeScript) | Backend PROD (backend-final.js) | Recomendación |
|----------------|--------------------------|----------------------------------|---------------|
| **Lenguaje** | TypeScript | JavaScript | DEV (tipado) |
| **Estructura** | Modular (routes/controllers) | Monolítico | DEV (organizado) |
| **Endpoint KPIs** | `/api/kpis/dashboard` | `/api/kpis/summary` | Ambos válidos |
| **Cálculo Estados** | ❌ No implementado | ✅ Desde RotativoMeasurement | **PROD** |
| **Cálculo Kilómetros** | ❌ No implementado | ✅ Haversine con GPS | **PROD** |
| **Filtros** | ⚠️ Parcial | ✅ Completos (from, to, vehicleIds) | **PROD** |
| **Validaciones GPS** | ❌ No | ✅ Filtra inválidos | **PROD** |
| **Ignora Clave 0** | ❌ No | ✅ Sí | **PROD** |
| **Hot-reload** | ✅ Sí | ❌ No | DEV |
| **Tipos** | ✅ TypeScript | ❌ No | DEV |

---

## 🔍 DIFERENCIAS CLAVE

### 1. Endpoint de KPIs

#### Backend DEV:
```typescript
// backend/src/routes/kpiRoutes.ts
router.get('/dashboard', getExecutiveDashboardHandler);

// backend/src/controllers/executiveDashboardController.ts
export const getExecutiveDashboardHandler = async (req, res) => {
    // Usa stabilityEvent (modelo Prisma)
    const stabilityEvents = await prisma.stabilityEvent.findMany({...});
    
    // ❌ NO calcula estados desde RotativoMeasurement
    // ⚠️ Usa cálculos simplificados basados en eventos
    // ⚠️ NO tiene filtro por vehicleIds[] (solo vehicle_id o vehicle_ids)
};
```

#### Backend PROD:
```javascript
// backend-final.js
app.get('/api/kpis/summary', async (req, res) => {
    // Lee vehicleIds[] correctamente ✅
    const vehicleIds = req.query['vehicleIds[]'] || req.query.vehicleIds;
    
    // Consulta stability_events (tabla real) ✅
    const sessions = await prisma.session.findMany({
        include: {
            RotativoMeasurement: {...},
            stability_events: {...},
            GpsMeasurement: {...}
        }
    });
    
    // ✅ Calcula estados desde RotativoMeasurement
    // ✅ Calcula kilómetros con Haversine
    // ✅ Ignora Clave 0
    // ✅ Filtra GPS inválidos
});
```

---

### 2. Modelos de Prisma Usados

#### Backend DEV:
- `prisma.stabilityEvent` ← Modelo TypeScript (puede no existir en schema)
- Lee `rotativoState` del evento

#### Backend PROD:
- `prisma.session.include({ stability_events })` ← Tabla real
- Lee estados de `RotativoMeasurement`

---

### 3. Cálculo de % Rotativo

#### Backend DEV:
```typescript
const rotaryOnEvents = stabilityEvents.filter(e => e.rotativoState === 1).length;
const rotaryOffEvents = stabilityEvents.filter(e => e.rotativoState === 0).length;

// ⚠️ Cuenta EVENTOS, no TIEMPO
```

#### Backend PROD:
```javascript
for (let i = 0; i < rotativoData.length - 1; i++) {
    const duration = (next.timestamp - current.timestamp) / 1000;
    const state = parseInt(current.state);
    
    if (state === 2) {
        rotativoOnSeconds += duration; // ✅ Suma DURACIÓN, no eventos
    }
}

rotativo_on_percentage = (rotativoOnSeconds / timeOutsideStation) * 100;
```

---

### 4. Filtros de Vehículos

#### Backend DEV:
```typescript
if (vehicle_id) {
    vehicleFilter.id = vehicle_id;
} else if (vehicle_ids) {
    const ids = vehicle_ids.split(',');
    vehicleFilter.id = { in: ids };
}

// ⚠️ NO soporta vehicleIds[] (que es lo que envía el frontend)
```

#### Backend PROD:
```javascript
const vehicleIds = req.query['vehicleIds[]'] || req.query.vehicleIds;

if (vehicleIds) {
    const ids = Array.isArray(vehicleIds) ? vehicleIds : [vehicleIds];
    sessionWhere.vehicleId = { in: ids };
}

// ✅ Soporta vehicleIds[] correctamente
```

---

## 🎯 CONCLUSIÓN

### Backend PROD (backend-final.js) es SUPERIOR para KPIs porque:

1. ✅ **Cálculos correctos** desde datos reales de RotativoMeasurement
2. ✅ **Kilómetros con Haversine** desde GPS
3. ✅ **Filtros completos** (vehicleIds[], fechas)
4. ✅ **Ignora Clave 0** (Tiempo en Taller = 0)
5. ✅ **Valida GPS** (filtra inválidos)
6. ✅ **Logging detallado** para debug

### Backend DEV (TypeScript) es mejor para:

1. ✅ **Desarrollo** (hot-reload)
2. ✅ **Tipado** (TypeScript)
3. ✅ **Organización** (modular)
4. ✅ **Mantenibilidad** (separación de concerns)

---

## 💡 RECOMENDACIÓN

### Para AHORA (tus correcciones):
**USA `iniciar.ps1`** → Ejecuta `backend-final.js` con todas las correcciones de KPIs

### Para el FUTURO:
**Migrar las correcciones del backend-final.js al backend TypeScript**:
1. Copiar lógica del endpoint `/api/kpis/summary` 
2. Actualizar `executiveDashboardController.ts`
3. Asegurar que use `stability_events` (tabla real)
4. Implementar todas las validaciones y filtros

---

## 📋 FUNCIONALIDADES ÚNICAS DEL BACKEND DEV

Revisando el código TypeScript, encontré:
- ✅ WebSocket service (tiempo real)
- ✅ Alert system (alertas)
- ✅ Middleware de autenticación
- ✅ Sistema de permisos
- ✅ Rate limiting
- ✅ Compresión de respuestas
- ✅ Metrics tracking

**Pero NINGUNA de estas afecta el endpoint de KPIs**, así que puedes usar `iniciar.ps1` sin perder funcionalidades para el dashboard.

---

## ✅ RESPUESTA FINAL

**USA `iniciar.ps1`** para aplicar las correcciones del dashboard. 

El backend dev (TypeScript) NO tiene implementación correcta de KPIs, solo tiene cálculos simplificados. Todas tus correcciones están en `backend-final.js`.


