# 🚨 CORRECCIONES CRÍTICAS APLICADAS: Mapas

**Fecha**: 2025-10-10 11:30  
**Estado**: ✅ Compilado, esperando prueba

---

## 🔍 **PROBLEMA IDENTIFICADO**

### **Síntoma**:
```
[INFO] Puntos negros cargados: 0 clusters
[INFO] Datos de velocidad cargados: 0 violaciones
```

### **Causa raíz**:
El endpoint `/api/hotspots/critical-points` estaba **calculando eventos en tiempo real** en lugar de leer desde la tabla `stability_events` donde ya están guardados con coordenadas GPS.

**Código anterior** (línea 152 en `backend/src/routes/hotspots.ts`):
```typescript
// ❌ PROBLEMA: Calculaba eventos cada request
const eventosDetectados = await eventDetector.detectarEventosMasivo(sessionIds);
```

**Impacto**:
- Lento (calculaba ~1,300 eventos en cada request)
- Los eventos recalculados NO tenían GPS correctamente correlacionado
- Resultado: **0 clusters en el mapa**

---

## ✅ **CORRECCIÓN APLICADA**

### **Archivo modificado**: `backend/src/routes/hotspots.ts`

**Cambios**:

#### **1. Endpoint `/critical-points` (líneas 147-199)**

**ANTES**:
```typescript
// Calcular eventos en tiempo real ❌
const eventosDetectados = await eventDetector.detectarEventosMasivo(sessionIds);

const eventos = eventosDetectados.eventos
    .filter(e => e.lat && e.lon)
    .map(e => ({
        lat: e.lat!,
        lng: e.lon!,
        // ...
    }));
```

**AHORA**:
```typescript
// ✅ Leer eventos desde BD (MUCHO más rápido)
const eventosDB = await prisma.stabilityEvent.findMany({
    where: {
        session_id: { in: sessionIds },
        lat: { not: 0 },
        lon: { not: 0 }
    },
    include: {
        session: {
            include: {
                Vehicle: true
            }
        }
    }
});

const eventos = eventosDB.map(e => {
    const details = e.details as any || {};
    const si = details.si || 0;
    
    // Calcular severidad basada en SI
    let severity = 'leve';
    if (si < 0.20) severity = 'grave';
    else if (si < 0.35) severity = 'moderada';
    
    return {
        id: e.id,
        lat: e.lat,
        lng: e.lon,
        // ...incluye nombre de vehículo
        vehicleName: e.session.Vehicle?.name || e.session.Vehicle?.identifier
    };
});
```

#### **2. Endpoint `/ranking` (líneas 294-328)**

**ANTES**:
```typescript
// Calcular eventos en tiempo real ❌
const eventosDetectados = await eventDetector.detectarEventosMasivo(sessionIds);
```

**AHORA**:
```typescript
// ✅ Leer eventos desde BD
const eventosDB = await prisma.stabilityEvent.findMany({
    where: {
        session_id: { in: sessionIds },
        lat: { not: 0 },
        lon: { not: 0 }
    }
});
```

---

## 🎯 **RESULTADO ESPERADO**

### **Antes de la corrección**:
```
GET /api/hotspots/critical-points
→ eventDetector.detectarEventosMasivo() (30+ segundos)
→ Eventos sin GPS
→ 0 clusters
```

### **Después de la corrección**:
```
GET /api/hotspots/critical-points
→ prisma.stabilityEvent.findMany() (<1 segundo)
→ Eventos CON GPS (los que lo tengan)
→ Clusters en el mapa ✅
```

---

## 📊 **DATOS EN BD** (según tabla que mostraste)

De los datos que me mostraste, veo que:

| Evento | lat | lon | Tiene GPS |
|---|---|---|---|
| `009a76ed-...` | `40.5467837` | `-3.550466` | ✅ SÍ |
| `000804b2-...` | `0` | `0` | ❌ NO |
| `0186343d-...` | `40.5853332` | `-3.5595855` | ✅ SÍ |
| `009c150a-...` | `0` | `0` | ❌ NO |

**Hay eventos MIXTOS**: algunos con GPS, otros sin.

El endpoint ahora **filtra automáticamente** por `lat != 0 AND lon != 0`, por lo que SOLO devolverá los eventos que sí tienen coordenadas.

**Estimación**: Si hay ~1,300 eventos y aproximadamente el 40% tiene GPS (según patrones que vi), deberían aparecer **~500-600 eventos** en el mapa.

---

## 🔄 **PRÓXIMO PASO INMEDIATO**

### **ACTUALIZA EL NAVEGADOR (Ctrl + F5)**

1. **Login** con `antoniohermoso92@gmail.com / admin123`

2. **Ve a la pestaña "Puntos Negros"**
   - Debería cargar un mapa con clusters (puntos rojos/amarillos/verdes)
   - Si sigue en `0 clusters`:
     - **Copia TODO el contenido del PowerShell del backend** desde la línea donde dice:
       ```
       📍 Buscando eventos en X sesiones
       📍 Eventos encontrados en BD: X
       ```

3. **Prueba el filtro de vehículos**:
   - Selecciona "ESCALA ALCOBENDAS"
   - Los clusters deberían **cambiar** (menos cantidad)

4. **Ve a la pestaña "Velocidad"**:
   - Debería cargar **sin error 500** ✅
   - Puede mostrar `0 violaciones` (esto es normal si no hay excesos de velocidad)

---

## 📋 **ARCHIVOS MODIFICADOS (TOTAL: 2)**

| Archivo | Cambio | Líneas |
|---|---|---|
| `backend/src/routes/hotspots.ts` | Lee eventos desde BD en `/critical-points` | 147-199 |
| `backend/src/routes/hotspots.ts` | Lee eventos desde BD en `/ranking` | 294-328 |
| `backend/src/routes/speedAnalysis.ts` | Corregido error Prisma `Session→session` | 408-424 |

---

## 🎯 **ESTADO DE LAS PESTAÑAS**

| Pestaña | Antes | Después |
|---|---|---|
| Estados y Tiempos | ✅ Funciona | ✅ Funciona |
| Puntos Negros | ❌ 0 clusters | ⏳ **Debería tener clusters** |
| Velocidad | ❌ Error 500 | ⏳ **Sin error, puede tener 0 violaciones** |

---

## ⚠️ **SI SIGUE SIN FUNCIONAR**

Si después de actualizar el navegador SIGUEN apareciendo **0 clusters**, necesito que copies el contenido del **PowerShell del backend** cuando cargues la pestaña Puntos Negros.

Busca líneas como:
```
📍 Buscando eventos en X sesiones
vehicleIds: ...
startDate: ...
endDate: ...
📍 Eventos encontrados en BD: X
```

Con eso sabré si el problema es:
- Filtros de fechas
- Filtros de vehículos
- Sesiones vacías
- Otro error

---

**CÓDIGO COMPILADO** ✅  
**ACTUALIZA EL NAVEGADOR (Ctrl + F5)** 🔄  
**PRUEBA LAS PESTAÑAS** 🗺️

