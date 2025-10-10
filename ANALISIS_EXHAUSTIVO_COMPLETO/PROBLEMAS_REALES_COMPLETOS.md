# ❌ PROBLEMAS REALES DEL SISTEMA - LISTA COMPLETA

**Fecha:** 10 de octubre de 2025  
**Estado:** Auditoría en progreso

---

## 🎯 LO QUE EL USUARIO REPORTA QUE NO FUNCIONA

1. ❌ **Puntos Negros** - NO muestra nada en el mapa
2. ❌ **Velocidad** - NO muestra nada en el mapa
3. ❌ **Filtros** - NO funcionan correctamente
4. ❌ **Radar.com** - 0% uso (geocercas creadas pero no se llaman)
5. ❌ **Reportes** - NO funcionan o están incompletos
6. ❌ **Subida automática** - Individual y masiva no verificadas
7. ❌ **Base de datos** - Revisar TODO

---

## 🔍 PROBLEMAS ENCONTRADOS EN AUDITORÍA

### **PROBLEMA 1: Radar.com NO se está usando (0% uso)**

**Lo que encontré:**
- ✅ Geocercas SÍ están creadas en Radar.com:
  - Alcobendas (externalId: "alcobendas")
  - Las Rozas (externalId: "rozas")
- ❌ `keyCalculator.ts` usa tabla `park` de BD local
- ❌ `keyCalculator.ts` NO llama a `radarService`
- ❌ `radarService.ts` existe pero no se usa

**Archivo:** `backend/src/services/keyCalculator.ts` (línea 74-97)
```typescript
// CÓDIGO ACTUAL:
const parks = await prisma.park.findMany({ ... }); // ❌ Lee de BD local
```

**Lo que DEBERÍA hacer:**
```typescript
// CÓDIGO CORRECTO:
import { radarService } from './radarService';
// Llamar a Radar.com para cada punto GPS
const enGeocerca = await radarService.checkGeofence(lat, lon);
```

**Impacto:**
- Claves operativas NO son precisas
- Radar.com desperdiciado
- Geocercas desactualizadas

---

### **PROBLEMA 2: Puntos Negros mapa vacío**

**Lo que encontré:**
- ✅ Endpoint `/api/hotspots/critical-points` devuelve 3 clusters
- ✅ Clusters tienen `lat`, `lng` válidos
- ✅ Componente `BlackSpotsTab` renderiza `MapContainer`
- ❌ Pero el usuario dice que NO muestra nada

**Causas posibles:**
1. Backend ejecutando código viejo (antes de mis cambios)
2. Clusters vacíos en runtime real
3. Error de renderizado en navegador
4. TomTom API key inválida
5. Leaflet no se carga correctamente

**Verificación necesaria:**
- Reiniciar backend con `.\iniciar.ps1`
- Abrir navegador y ver consola (F12)
- Ver si hay error "Invalid API key" de TomTom
- Ver si Leaflet se carga

---

### **PROBLEMA 3: Velocidad mapa vacío**

**Lo que encontré:**
- ✅ Endpoint `/api/speed/violations` devuelve 2 violaciones
- ⚠️ NO verifiqué si tienen `lat`, `lng`

**Verificación necesaria:**
- Ver estructura de datos de `/api/speed/violations`
- Ver si `SpeedAnalysisTab` recibe datos
- Ver consola de navegador

---

### **PROBLEMA 4: Filtros no funcionan**

**Lo que encontré:**
- ✅ `useGlobalFilters` existe
- ✅ Endpoints tienen parámetros de filtro
- ❌ NO verifiqué que se propaguen correctamente

**Verificación necesaria:**
- Ver flujo completo de filtros:
  1. Usuario cambia filtro en GlobalFiltersBar
  2. useGlobalFilters actualiza estado
  3. Componentes hijos reciben nuevos filtros
  4. Componentes llaman endpoints con filtros
  5. Backend usa filtros en queries

---

### **PROBLEMA 5: Reportes no funcionan**

**Lo que encontré:**
- ⚠️ NO he auditado el sistema de reportes
- ⚠️ NO he verificado generación de PDF
- ⚠️ NO he verificado que incluyan datos correctos

**Verificación necesaria:**
- Ver `DashboardReportsTab.tsx`
- Ver servicios de generación de PDF
- Ver templates de reportes
- Probar generación real

---

### **PROBLEMA 6: Subida de archivos**

**Lo que encontré:**
- ⚠️ NO he auditado upload individual
- ⚠️ NO he auditado upload masivo
- ⚠️ NO he verificado procesamiento automático
- ⚠️ NO he verificado FTP

**Verificación necesaria:**
- Ver componentes de upload
- Ver endpoints de upload
- Ver procesamiento de archivos
- Ver creación de sesiones

---

### **PROBLEMA 7: Base de datos**

**Lo que encontré:**
- ✅ 241 sesiones
- ✅ 784,949 mediciones
- ⚠️ NO he verificado integridad de datos
- ⚠️ NO he verificado índices
- ⚠️ NO he verificado relaciones

**Verificación necesaria:**
- Revisar schema completo
- Ver si hay datos huérfanos
- Ver si hay índices faltantes
- Ver calidad de datos

---

## 🛠️ PLAN DE CORRECCIÓN REAL

### **FASE 1: Auditar TODO (1-2 horas)**
1. ✅ Puntos Negros - endpoint (HECHO: devuelve datos)
2. ⏳ Velocidad - endpoint
3. ⏳ Filtros globales - flujo completo
4. ⏳ Radar.com - integración con keyCalculator
5. ⏳ Reportes - sistema completo
6. ⏳ Subida - upload + procesamiento
7. ⏳ Base de datos - estructura e integridad

### **FASE 2: Corregir TODOS los problemas (2-3 horas)**
1. Integrar Radar.com en keyCalculator
2. Asegurar que mapas reciben datos
3. Corregir flujo de filtros
4. Corregir sistema de reportes
5. Verificar upload funciona

### **FASE 3: Verificar end-to-end (1 hora)**
1. Subir archivo → Ver que se procesa
2. Ver datos en dashboard
3. Cambiar filtros → Ver que se aplican
4. Ver mapas con datos
5. Generar reporte → Ver que funciona

---

**Tiempo total estimado:** 4-6 horas de trabajo REAL

---

## 📋 LO QUE VOY A HACER AHORA

Voy a auditar SISTEMÁTICAMENTE:

1. **Radar.com** - Cómo integrarlo
2. **Filtros** - Flujo completo
3. **Velocidad** - Por qué no muestra mapa
4. **Reportes** - Sistema completo
5. **Upload** - Todo el flujo

**Sin asumir nada. Revisando código REAL.**

