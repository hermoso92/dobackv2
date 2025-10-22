# 🔍 AUDITORÍA EXHAUSTIVA - TODOS LOS COMPONENTES

**Fecha:** 21 de Octubre de 2025  
**Sistema:** DobackSoft StabilSafe V3  
**Enfoque:** MICRO → MACRO (De componentes individuales a flujos completos)

---

## 📋 CHECKLIST COMPLETO DE COMPONENTES A AUDITAR

### 🔬 NIVEL MICRO: Componentes Individuales

#### 1. Sistema de Upload
- [ ] **Pestaña "Procesamiento Automático"** existe y carga
- [ ] **Drag & drop** de archivos funciona
- [ ] **Selección de archivos** mediante botón funciona
- [ ] **Validación de formato** de archivos (CAN, GPS, ESTABILIDAD, ROTATIVO)
- [ ] **Extracción de ID de vehículo** del nombre de archivo
- [ ] **Detección de vehículo no existente** → opción de crear
- [ ] **Barra de progreso** de upload funcional
- [ ] **Mensajes de error claros** (archivo corrupto, sin ID, etc.)

#### 2. Generación de Reportes
- [ ] **Botón "Exportar PDF"** visible y habilitado
- [ ] **PDF se genera** al hacer click
- [ ] **PDF se descarga** automáticamente
- [ ] **Nombre del PDF** es descriptivo (incluye fecha, vehículo)
- [ ] **PDF incluye metadatos** correctos
- [ ] **Formato del PDF** es profesional y legible

#### 3. Geocercas (Geofences)
- [ ] **Página de geocercas** carga correctamente
- [ ] **Lista de geocercas** muestra datos
- [ ] **Botón "Crear geocerca"** funciona
- [ ] **Formulario de creación** valida datos
- [ ] **Dibujo en mapa** para definir área funciona
- [ ] **Geocerca se guarda** en BD correctamente
- [ ] **Editar geocerca existente** funciona
- [ ] **Eliminar geocerca** funciona con confirmación
- [ ] **Eventos de entrada/salida** se registran

#### 4. Mapas OSM (OpenStreetMap)
- [ ] **Mapa se renderiza** correctamente
- [ ] **Tiles de OSM** cargan sin errores
- [ ] **Zoom in/out** funciona
- [ ] **Pan/arrastrar** funciona suavemente
- [ ] **Marcadores** se renderizan en posiciones correctas
- [ ] **Popups** abren al click en marcadores
- [ ] **No hay errores HTTP** al cargar tiles
- [ ] **Attribution** (créditos OSM) visible

#### 5. TomTom API
- [ ] **Geocoding** (dirección → coordenadas) funciona
- [ ] **Reverse geocoding** (coordenadas → dirección) funciona
- [ ] **Respuestas dentro del threshold** (<2s)
- [ ] **Errores manejados** correctamente (API key inválida, límite, etc.)
- [ ] **Caché funciona** (no hace requests repetidos)
- [ ] **Fallback a OSM** si TomTom falla

#### 6. KPIs Individuales
- [ ] **KPI: Horas de Conducción** calcula correctamente
- [ ] **KPI: Km Recorridos** suma GPS correctamente
- [ ] **KPI: Tiempo Rotativo ON** (Clave 2 / Clave 5)
- [ ] **KPI: Número de Incidencias** cuenta eventos
- [ ] **KPI: Disponibilidad de Flota** (%)
- [ ] **KPI: Tiempos de Respuesta** (emergencias)
- [ ] **KPI: Rotativo ON%** (tiempo con rotativo / tiempo total)
- [ ] **KPI: Incidencias Críticas** filtra por severidad
- [ ] **KPI: Incidencias Moderadas** filtra por severidad
- [ ] **KPI: Incidencias Leves** filtra por severidad
- [ ] **KPI: Eventos de Estabilidad** cuenta total
- [ ] **KPI: Velocidad Promedio** calcula correctamente
- [ ] **KPI: Velocidad Máxima** identifica correctamente
- [ ] **KPI: Costes Operacionales** (si implementado)
- [ ] **Todos los KPIs muestran valores numéricos** (no "N/A" con datos)
- [ ] **Formato de KPIs** es legible (separadores de miles, decimales)
- [ ] **Unidades** están presentes (km, h, %, etc.)

#### 7. Filtros Globales
- [ ] **Filtro de vehículo** (dropdown) renderiza
- [ ] **Filtro de fecha inicio** funciona
- [ ] **Filtro de fecha fin** funciona
- [ ] **Filtro de tipo de camino** (si existe)
- [ ] **Filtro de severidad** (si existe)
- [ ] **Filtros persisten** al cambiar de tab
- [ ] **Botón "Limpiar filtros"** funciona

#### 8. Tabs de Navegación
- [ ] **Tab "Estados & Tiempos"** carga
- [ ] **Tab "Puntos Negros"** carga
- [ ] **Tab "Velocidad"** carga
- [ ] **Tab "Sesiones"** carga
- [ ] **Tab "Reportes"** carga
- [ ] **Tab activo** se resalta visualmente
- [ ] **Cambio de tab** es instantáneo (<500ms)

---

### 🏗️ NIVEL MEDIO: Integraciones

#### 9. Upload → Procesamiento → BD
- [ ] **Archivo subido** se guarda en filesystem
- [ ] **Procesamiento automático** se dispara
- [ ] **Parser extrae datos** correctamente (CAN, GPS, ESTABILIDAD, ROTATIVO)
- [ ] **Sesión se crea** en tabla `Session`
- [ ] **Eventos se generan** en tabla `StabilityEvent`
- [ ] **Datos telemetry** se guardan en `TelemetryData`
- [ ] **Segmentos** se correlacionan correctamente
- [ ] **Post-processor** calcula métricas agregadas
- [ ] **Reporte de procesamiento** se genera
- [ ] **Estado del archivo** se actualiza (`.processed`)

#### 10. Sesiones → Eventos → Dashboard
- [ ] **Sesiones con eventos** aparecen en dashboard
- [ ] **KPIs se actualizan** con datos de sesiones nuevas
- [ ] **Filtro por sesión** funciona
- [ ] **Click en sesión** muestra detalles
- [ ] **Eventos de la sesión** se listan correctamente

#### 11. Eventos → Mapa GPS
- [ ] **Eventos con coordenadas** se pintan en mapa
- [ ] **Color del marcador** según severidad
- [ ] **Click en marcador** abre popup con detalles del evento
- [ ] **Mapa se centra** en primer evento al cargar
- [ ] **Ruta GPS** se dibuja como línea en mapa
- [ ] **Puntos negros** se agrupan visualmente (clustering)

#### 12. Filtros → Datos Mostrados
- [ ] **Cambio de fecha** recarga datos filtrados
- [ ] **Cambio de vehículo** filtra eventos y sesiones
- [ ] **Múltiples filtros** se aplican en AND
- [ ] **Gráficas se actualizan** con datos filtrados
- [ ] **KPIs se recalculan** con datos filtrados
- [ ] **Mapa se actualiza** con puntos filtrados

#### 13. Geocercas → Eventos
- [ ] **Entrada a geocerca** genera evento
- [ ] **Salida de geocerca** genera evento
- [ ] **Tiempo dentro** se calcula correctamente
- [ ] **Violaciones de geocerca** se registran
- [ ] **Alertas de geocerca** se disparan (si configuradas)
- [ ] **Geocercas se muestran** en mapa de telemetría

#### 14. Sesiones → Comparador de Estabilidad
- [ ] **Selección de 2+ sesiones** funciona
- [ ] **Comparador carga** con sesiones seleccionadas
- [ ] **Gráficas comparativas** muestran datos correctos
- [ ] **Métricas lado a lado** visibles
- [ ] **Diferencias resaltadas** (mejor/peor)
- [ ] **Solo sesiones de estabilidad** comparables (no mezclar tipos)

---

### 🌍 NIVEL MACRO: Flujos End-to-End

#### 15. Flujo Completo: Upload → Dashboard → Comparador → PDF
**Secuencia:**
1. Subir archivos (ESTABILIDAD + GPS + ROTATIVO) de DOBACK023 del 30-09-2025
2. Verificar procesamiento automático completa exitosamente
3. Ir a Dashboard y verificar que KPIs muestran datos nuevos
4. Ir a "Puntos Negros" y verificar eventos en mapa
5. Ir a "Sesiones" y seleccionar sesión recién creada
6. Abrir comparador con 2 sesiones
7. Exportar PDF del comparador
8. Verificar PDF contiene:
   - Métricas de ambas sesiones
   - Gráficas comparativas
   - Mapa con rutas
   - Análisis IA (si implementado)

**Validación:**
- [ ] **Paso 1 (Upload):** Archivos subidos OK
- [ ] **Paso 2 (Procesamiento):** Reporte generado, estado `.processed`
- [ ] **Paso 3 (Dashboard):** KPIs actualizados con valores >0
- [ ] **Paso 4 (Mapa):** Puntos visibles, click abre detalles
- [ ] **Paso 5 (Sesiones):** Sesión listada, detalles correctos
- [ ] **Paso 6 (Comparador):** 2 sesiones lado a lado
- [ ] **Paso 7 (PDF):** PDF descargado
- [ ] **Paso 8 (Contenido PDF):** Datos reales presentes

#### 16. Flujo: Geocercas → Alertas → Notificaciones
**Secuencia:**
1. Crear geocerca de prueba (ej. zona de parque)
2. Subir sesión con GPS que entra/sale de zona
3. Verificar eventos de entrada/salida en BD
4. Configurar alerta para entrada a zona
5. Verificar que alerta se dispara
6. Verificar notificación (si implementada)

**Validación:**
- [ ] **Paso 1:** Geocerca creada y visible en mapa
- [ ] **Paso 2:** Sesión procesada
- [ ] **Paso 3:** Eventos en tabla `GeofenceEvent`
- [ ] **Paso 4:** Alerta configurada
- [ ] **Paso 5:** Alerta registrada en logs/BD
- [ ] **Paso 6:** Notificación enviada (email/push)

#### 17. Flujo: Todas las Pestañas con Datos Reales
**Objetivo:** Navegar TODAS las pestañas y verificar que muestran datos reales (no "sin datos")

**Pestañas a Validar:**
- [ ] **Panel de Control (Dashboard Principal)**
  - [ ] KPIs con valores >0
  - [ ] Gráfica de tendencias con datos
  - [ ] Lista de alertas recientes (si hay)
  - [ ] Estado de flota (disponible/fuera de servicio)

- [ ] **Estados & Tiempos**
  - [ ] Gráfica de estados operacionales con barras
  - [ ] Tabla de segmentos con datos
  - [ ] Tiempo total calculado
  - [ ] Porcentaje rotativo ON

- [ ] **Puntos Negros**
  - [ ] Mapa con marcadores
  - [ ] Lista de eventos críticos
  - [ ] Filtros funcionan
  - [ ] Click en punto abre detalles

- [ ] **Velocidad**
  - [ ] Gráfica de velocidad vs tiempo
  - [ ] Tabla de violaciones de velocidad
  - [ ] Velocidad promedio/máxima
  - [ ] Filtro por tipo de camino

- [ ] **Sesiones**
  - [ ] Lista de sesiones con fechas
  - [ ] Mapa con ruta GPS
  - [ ] Detalles de sesión seleccionada
  - [ ] Ranking de sesiones

- [ ] **Reportes**
  - [ ] Opciones de generación de reporte
  - [ ] Selector de tipo de reporte
  - [ ] Preview (si existe)
  - [ ] Botón exportar funciona

- [ ] **Telemetría (si es tab aparte)**
  - [ ] Datos CAN en tabla/gráfica
  - [ ] GPS en mapa
  - [ ] Sincronización temporal CAN+GPS

- [ ] **Inteligencia Artificial (si implementada)**
  - [ ] Chat IA responde
  - [ ] Patrones detectados
  - [ ] Recomendaciones generadas

#### 18. Regla No-Scroll con Scroll Real
**Objetivo:** Validar que scroll solo existe donde DEBE existir

**Contenedores que NO deben tener scroll:**
- [ ] `.app-layout` → `overflow-y: hidden`
- [ ] `.main-content` → `overflow-y: hidden`
- [ ] `main` → `overflow-y: hidden`

**Contenedores que SÍ pueden tener scroll:**
- [ ] `.dashboard-content` → `overflow-y: auto` (OK)
- [ ] `.tab-content` → `overflow-y: auto` (OK)
- [ ] `.data-table-container` → `overflow-y: auto` (OK)
- [ ] `.session-list` → `overflow-y: auto` (OK)
- [ ] `.event-list` → `overflow-y: auto` (OK)

**Validación con Datos Reales:**
- [ ] Cargar 100+ sesiones en tabla
- [ ] Verificar que tabla tiene scroll interno
- [ ] Verificar que contenedor principal NO tiene scroll
- [ ] Cambiar de tab y verificar consistencia

---

## 🧪 TESTS ESPECÍFICOS DE CÁLCULO

### KPIs que DEBEN calcularse correctamente:

#### 1. Horas de Conducción
```
Fórmula: Suma de duraciones de segmentos con estado != "EN_PARQUE"
Input: Segmentos de sesión
Output: HH:MM (ej. 05:23)
Test: Subir sesión de 2h → verificar que KPI muestra ~2:00h
```

#### 2. Km Recorridos
```
Fórmula: Suma de distancias entre puntos GPS consecutivos (Haversine)
Input: Puntos GPS de sesión
Output: XXX.XX km (ej. 123.45)
Test: Sesión conocida → verificar que km coincide con ruta real
```

#### 3. Tiempo Rotativo ON
```
Fórmula: Suma de duraciones con clave=2 o clave=5
Input: Archivos ROTATIVO
Output: HH:MM + porcentaje del total
Test: Archivo con 1h total, 30min rotativo → verificar 50%
```

#### 4. Incidencias por Severidad
```
Fórmula: Contar eventos donde SI > threshold
Input: Eventos de estabilidad
Output: Count por severidad (crítico, moderado, leve)
Test: Archivo con 5 eventos críticos → verificar count=5
```

#### 5. Velocidad Promedio
```
Fórmula: (Suma velocidades) / (puntos con velocidad válida)
Input: Puntos GPS con campo velocidad
Output: XX.X km/h
Test: 10 puntos [10,20,30,...,100] → verificar avg=55 km/h
```

---

## 🎯 PRIORIZACIÓN DE TESTS

### 🔴 CRÍTICO (Debe pasar 100%)
1. Upload funciona → sesión se crea
2. Eventos se generan → aparecen en BD
3. KPIs muestran valores >0 con datos reales
4. Mapa OSM renderiza
5. PDF se genera y descarga
6. Filtros afectan datos mostrados
7. Todas las pestañas cargan sin error 500
8. Regla No-Scroll cumplida

### 🟠 ALTO (Debe pasar >80%)
1. TomTom API responde
2. Geocercas funcionales (CRUD)
3. Comparador con 2+ sesiones
4. PDF contiene datos reales (no vacío)
5. Todos los KPIs calculan correctamente
6. Marcadores en mapa clickeables
7. Gráficas muestran datos

### 🟡 MEDIO (Debe pasar >60%)
1. Notificaciones push/email
2. IA genera recomendaciones
3. Reportes avanzados
4. Performance <3s en dashboard
5. Caché funciona correctamente

---

## 📊 FORMATO DE REPORTE ESPERADO

```json
{
  "timestamp": "2025-10-21T22:00:00Z",
  "enfoque": "MICRO → MACRO",
  "summary": {
    "micro": {
      "total": 50,
      "passed": 45,
      "failed": 5,
      "successRate": "90%"
    },
    "medio": {
      "total": 20,
      "passed": 18,
      "failed": 2,
      "successRate": "90%"
    },
    "macro": {
      "total": 10,
      "passed": 9,
      "failed": 1,
      "successRate": "90%"
    },
    "overall": {
      "total": 80,
      "passed": 72,
      "failed": 8,
      "successRate": "90%"
    }
  },
  "detailedResults": {
    "micro": [
      {
        "component": "OSM Map",
        "test": "Map renders with tiles",
        "pass": true,
        "details": { "tilesLoaded": 12 }
      },
      ...
    ],
    "medio": [...],
    "macro": [...]
  },
  "screenshots": ["00-login.png", "01-dashboard.png", ...],
  "criticalIssues": [],
  "recommendations": []
}
```

---

## ✅ CRITERIO DE ÉXITO GLOBAL

**Sistema se considera AUDIT-READY cuando:**
- ✅ Tasa de éxito MICRO ≥ 90%
- ✅ Tasa de éxito MEDIO ≥ 85%
- ✅ Tasa de éxito MACRO ≥ 80%
- ✅ 0 problemas críticos pendientes
- ✅ Todos los flujos end-to-end completados
- ✅ PDF contiene datos reales
- ✅ Regla No-Scroll cumplida

---

**FIN DEL CHECKLIST**

*Este documento define TODOS los componentes que deben auditarse de MICRO a MACRO*

