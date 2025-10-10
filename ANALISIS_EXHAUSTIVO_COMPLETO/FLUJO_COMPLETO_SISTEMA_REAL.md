# 🔄 FLUJO COMPLETO DEL SISTEMA - ANÁLISIS REAL

**Objetivo:** Entender TODO el sistema end-to-end para encontrar TODOS los problemas

---

## 📊 FLUJO COMPLETO QUE DEBO VERIFICAR

### **FLUJO 1: SUBIDA DE ARCHIVOS**
```
Usuario sube archivos (individual/masivo/FTP)
    ↓
Backend recibe archivos
    ↓
Parser procesa archivos (CAN, GPS, ESTABILIDAD, ROTATIVO)
    ↓
Extrae ID de archivo
    ↓
Busca/crea vehículo
    ↓
Crea sesión
    ↓
Guarda mediciones en BD
    ↓
Actualiza estado (procesado/error)
```

### **FLUJO 2: CÁLCULO DE KPIS**
```
Usuario abre Dashboard
    ↓
Frontend obtiene filtros globales (fecha, vehículos)
    ↓
Frontend llama /api/kpis/summary con filtros
    ↓
Backend obtiene sesiones filtradas
    ↓
Backend llama kpiCalculator
    ↓
kpiCalculator llama keyCalculator (claves)
    ↓
kpiCalculator llama eventDetector (eventos)
    ↓
kpiCalculator llama speedAnalyzer (velocidad)
    ↓
Backend devuelve JSON con KPIs
    ↓
Frontend muestra KPIs en dashboard
```

### **FLUJO 3: PUNTOS NEGROS (MAPA)**
```
Usuario hace clic en pestaña "Puntos Negros"
    ↓
Frontend llama /api/hotspots/critical-points
    ↓
Backend usa eventDetector
    ↓
Backend agrupa eventos por proximidad (clustering)
    ↓
Backend devuelve clusters con lat/lng
    ↓
Frontend recibe clusters
    ↓
Frontend pasa clusters al componente MapContainer
    ↓
MAPA MUESTRA PUNTOS ← ❌ AQUÍ FALLA
```

### **FLUJO 4: VELOCIDAD (MAPA)**
```
Usuario hace clic en pestaña "Velocidad"
    ↓
Frontend llama /api/speed/violations
    ↓
Backend usa speedAnalyzer
    ↓
Backend devuelve violaciones con lat/lng
    ↓
Frontend recibe violaciones
    ↓
Frontend pasa violaciones al componente MapContainer
    ↓
MAPA MUESTRA PUNTOS ← ❌ AQUÍ FALLA
```

### **FLUJO 5: GEOCERCAS (RADAR.COM)**
```
keyCalculator necesita determinar si vehículo está en parque
    ↓
keyCalculator debe llamar API de Radar.com
    ↓
Radar.com devuelve si coordenadas están en geocerca
    ↓
keyCalculator calcula clave según resultado
```

**❌ PROBLEMA:** Radar.com muestra 0% uso → NO se está llamando

### **FLUJO 6: REPORTES**
```
Usuario hace clic en "Exportar PDF"
    ↓
Frontend llama servicio de reportes
    ↓
Backend genera PDF con KPIs, mapas, gráficas
    ↓
Backend devuelve PDF
    ↓
Frontend descarga PDF
```

---

## 🔍 AUDITORÍA POR PROBLEMA

### **PROBLEMA 1: Puntos Negros - No muestra mapa**

**Posibles causas:**
1. ❌ Endpoint no devuelve datos
2. ❌ Datos no tienen lat/lng
3. ❌ Componente no renderiza MapContainer
4. ❌ Clusters vacío
5. ❌ Error en consola de navegador

**Verificación necesaria:**
- Ver qué devuelve `/api/hotspots/critical-points`
- Ver si tiene `clusters` con `lat`, `lng`
- Ver código del componente MapContainer
- Ver si hay errores de renderizado

### **PROBLEMA 2: Velocidad - No muestra mapa**

**Posibles causas:**
1. ❌ Endpoint no devuelve datos
2. ❌ Datos no tienen lat/lng
3. ❌ Componente no renderiza MapContainer
4. ❌ Violations vacío

**Verificación necesaria:**
- Ver qué devuelve `/api/speed/violations`
- Ver si tiene `violations` con `lat`, `lng`
- Ver código del componente

### **PROBLEMA 3: Radar.com 0% uso**

**Posibles causas:**
1. ❌ keyCalculator NO llama API de Radar
2. ❌ keyCalculator usa lógica local (coordenadas hardcodeadas)
3. ❌ API key no configurada
4. ❌ No se está usando keyCalculator en absoluto

**Verificación necesaria:**
- Ver código de keyCalculator
- Ver si llama `radarService`
- Ver si `radarService` hace peticiones HTTP a Radar.com
- Ver configuración de API key

### **PROBLEMA 4: Filtros no funcionan**

**Posibles causas:**
1. ❌ Filtros globales no se propagan
2. ❌ Endpoints no usan filtros recibidos
3. ❌ Frontend no envía filtros correctamente

**Verificación necesaria:**
- Ver `useGlobalFilters`
- Ver cómo se pasan filtros a componentes
- Ver si endpoints usan parámetros de query

---

**Empezando verificación sistemática...**

