# 📊 ANÁLISIS COMPLETO DEL DASHBOARD CLIENTE – DobackSoft StabilSafe V2

**Fecha:** 03/11/2025  
**Versión:** 2.0  
**Tipo:** Documentación funcional del producto

---

> **✅ CORRECCIONES APLICADAS - DASHBOARD FUNCIONANDO**
>
> Se han aplicado correcciones críticas al Dashboard:
>
> **ANTES (❌ Incorrecto):**
> - ADMIN: Dashboard sin pestañas (TV Wall)
> - MANAGER: Dashboard con pestañas
> - Filtros NO se mostraban
> - MANAGERS veían todos los módulos del menú
>
> **AHORA (✅ Correcto):**
> - **ADMIN y MANAGER:** Mismo dashboard con **4 pestañas + filtros globales**
> - **Filtros visibles:** Parque, Vehículos, Fechas, Severidad
> - **Menú restringido para MANAGERS:** Solo "Panel de Control" + "Mi Cuenta"
> - **Menú completo para ADMINS:** 13 opciones (Dashboard + 11 módulos + Mi Cuenta)
>
> **🔄 Para ver los cambios:**
> 1. Asegúrate de que el frontend se recompiló sin errores
> 2. Refresca el navegador con `Ctrl + Shift + R` (limpiar caché)
> 3. Haz login nuevamente
> 4. Accede a `/dashboard` → Deberías ver las 4 pestañas y los filtros arriba

---

## 📋 ÍNDICE

1. [Introducción](#introducción)
2. [Dashboard MANAGER - Vista con Pestañas](#dashboard-manager---vista-con-pestañas)
3. [Pestaña 1: Estados & Tiempos](#pestaña-1-estados--tiempos)
4. [Pestaña 2: Puntos Negros](#pestaña-2-puntos-negros)
5. [Pestaña 3: Velocidad](#pestaña-3-velocidad)
6. [Pestaña 4: Sesiones & Recorridos](#pestaña-4-sesiones--recorridos)
7. [Dashboard ADMIN - TV Wall Ejecutivo](#dashboard-admin---tv-wall-ejecutivo)
8. [Módulos Adicionales del Menú](#módulos-adicionales-del-menú)
9. [Subida Automática](#subida-automática)
10. [Flujo de Información General](#flujo-de-información-general)
11. [Valor Integral para el Cliente](#valor-integral-para-el-cliente)

---

## INTRODUCCIÓN

El **Dashboard** de DobackSoft presenta **DOS versiones diferentes** según el ROL del usuario:

### 🔑 ROLES DEL SISTEMA

#### **1. MANAGER (Cliente Final)**
**Acceso restringido:**
- ✅ Solo puede acceder al **Dashboard** con 4 pestañas
- ✅ Solo puede acceder a **Mi Cuenta** (gestión de perfil)
- ❌ **NO tiene acceso** a otros módulos (Telemetría, Estabilidad, Geofences, etc.)

**Dashboard muestra 4 pestañas operacionales:**
1. **Estados & Tiempos** - Análisis de claves operacionales
2. **Puntos Negros** - Mapa de calor de zonas peligrosas
3. **Velocidad** - Análisis de excesos según normativa DGT
4. **Sesiones & Recorridos** - Listado de sesiones con mapas GPS

#### **2. ADMIN (Administrador del Sistema)**
**Acceso completo:**
- ✅ Acceso al **Dashboard** con las mismas 4 pestañas que MANAGER
- ✅ Acceso a **todos los módulos adicionales** desde el menú:
  - 📊 Estabilidad
  - 📡 Telemetría
  - 🤖 Inteligencia Artificial
  - 🗺️ Geofences
  - ☁️ Subir Archivos
  - 🔧 Operaciones
  - 📈 Reportes
  - 🔔 Alertas
  - ⚙️ Administración
  - 🛠️ Configuración Sistema
  - 📚 Base de Conocimiento
  - 👤 Mi Cuenta

### 📱 NAVEGACIÓN Y PERMISOS

El sistema tiene un **menú lateral con módulos** que se muestran según el rol:

#### **Menú para MANAGER:**
```
🏠 Panel de Control  ← Dashboard con 4 pestañas
👤 Mi Cuenta        ← Gestión de perfil
```
**Total:** Solo 2 opciones de menú (acceso restringido)

#### **Menú para ADMIN:**
```
🏠 Panel de Control       ← Dashboard con 4 pestañas (igual que MANAGER)
📊 Estabilidad           ← Análisis de eventos de estabilidad
📡 Telemetría            ← Datos CAN + GPS detallados
🤖 Inteligencia Artificial ← Copiloto IA
🗺️ Geofences             ← Gestión de zonas geográficas
☁️ Subir Archivos        ← Upload manual de archivos
🔧 Operaciones           ← Eventos, alertas, mantenimiento
📈 Reportes              ← Generación de informes
🔔 Alertas               ← Gestión de alertas
⚙️ Administración        ← Gestión de usuarios y sistema
🛠️ Configuración Sistema ← Configuración avanzada
📚 Base de Conocimiento  ← Documentación
👤 Mi Cuenta            ← Gestión de perfil
```
**Total:** 13 opciones de menú (acceso completo)

---

## DASHBOARD MANAGER - VISTA CON PESTAÑAS

### 🎯 Acceso

**Ruta:** `/dashboard`  
**Rol requerido:** MANAGER (no ADMIN)  
**Componente:** `UnifiedDashboard.tsx` (modo MANAGER)

### 🧭 Estructura de Navegación

El Dashboard MANAGER presenta **4 pestañas horizontales** en la parte superior:

```
┌─────────────────────────────────────────────────────────────┐
│  [Estados & Tiempos] [Puntos Negros] [Velocidad] [Sesiones] │
└─────────────────────────────────────────────────────────────┘
```

Cada pestaña muestra información específica con filtros globales heredados del `FilteredPageWrapper`.

### 🔧 Filtros Globales

Todos los datos del Dashboard MANAGER pueden filtrarse por:
- **Vehículos:** Selector múltiple de vehículos
- **Rango de fechas:** Desde/Hasta
- **Estado del rotativo:** Todos / ON / OFF
- **Severidad:** Todos / Graves / Moderadas / Leves

Los filtros se aplican automáticamente a todas las pestañas.

### Arquitectura General

- **Frontend:** React + TypeScript + Tailwind CSS + Material-UI
- **Backend:** Node.js + Express + Prisma ORM
- **Mapas:** Leaflet + TomTom
- **Exportación:** jsPDF para reportes automáticos
- **Tiempo real:** React Query para actualización automática de datos

---

## PESTAÑA 1: ESTADOS & TIEMPOS

### 🧩 FUNCIONALIDADES

La pestaña **Estados & Tiempos** analiza la distribución de tiempo operacional según las **claves de bomberos** (0-5), proporcionando métricas críticas para la gestión de flota.

#### **1.1 Listado de Sesiones**
- **Vista en tabla/tarjetas** con información resumida:
  - Vehículo asociado (nombre real del bombero)
  - Fecha y hora de inicio/fin
  - Duración total formateada (`HH:MM`)
  - Distancia recorrida (km)
  - Velocidad promedio y máxima
  - Número de eventos de estabilidad detectados
  - Estado de la sesión (completada, activa, interrumpida)

#### **1.2 Filtros y Búsqueda**
- **Filtro por vehículo:** Selector desplegable con todos los vehículos de la organización
- **Filtro por fechas:** Rango temporal (desde/hasta)
- **Ordenación:** Por fecha, duración, distancia o número de eventos

#### **1.3 Visualización de Recorrido en Mapa**
Al seleccionar una sesión, se muestra:
- **Mapa interactivo** con el recorrido GPS completo
- **Trayectoria en línea azul** conectando puntos GPS
- **Marcadores de eventos** coloreados por severidad:
  - 🔴 Rojo: Eventos graves
  - 🟠 Naranja: Eventos moderados
  - 🟡 Amarillo: Eventos leves
- **Puntos de inicio y fin** con marcadores especiales
- **Estadísticas en tiempo real:**
  - Puntos GPS válidos procesados
  - Eventos detectados durante el recorrido
  - Saltos GPS filtrados (para mostrar rutas realistas)
  - Distancia máxima entre puntos consecutivos

#### **1.4 Ranking de Sesiones**
Panel lateral dinámico que clasifica sesiones por:
- **Total de eventos** (sesiones más críticas)
- **Distancia recorrida** (operaciones más largas)
- **Duración** (tiempo de servicio)
- **Velocidad promedio** (eficiencia operacional)

Cada entrada del ranking muestra:
- Posición (con colores especiales para podio: 🥇🥈🥉)
- Vehículo y fecha
- Desglose por severidad (graves/moderadas/leves)
- Métricas clave según criterio de ordenación

#### **1.5 Exportación a PDF**
Genera reporte completo con:
- Captura del mapa con trayectoria completa
- Lista de eventos geocodificados (dirección real)
- Métricas de la sesión
- Análisis de estabilidad

### 🔗 BACKEND / FUENTES DE DATOS

#### **Tablas principales:**
- **`Session`:** Datos base (id, vehicleId, organizationId, startTime, endTime)
- **`GpsMeasurement`:** Puntos GPS con timestamp, lat, lng, speed
- **`StabilityEvent`:** Eventos críticos detectados (tipo, severidad, coordenadas)
- **`Vehicle`:** Información del vehículo (nombre, matrícula)

#### **Endpoints utilizados:**
```typescript
GET /api/telemetry-v2/sessions
GET /api/sessions/:id
GET /api/session-route/:id
GET /api/sessions/ranking
```

#### **Servicios de procesamiento:**
- **`SessionDetectorV2`:** Detecta sesiones individuales en archivos subidos
- **`TemporalCorrelator`:** Correlaciona archivos GPS + Estabilidad + Rotativo
- **`RouteProcessorService`:** Procesa y valida rutas GPS
- **`GeofenceRuleEngine`:** Detecta entradas/salidas de geocercas

### 👨‍💻 FLUJO DE INFORMACIÓN

```
1. SUBIDA AUTOMÁTICA
   ↓
   Archivos detectados (GPS.csv, Estabilidad.csv, Rotativo.csv)
   
2. DETECCIÓN DE SESIONES
   ↓
   SessionDetectorV2 analiza gaps temporales (>5 min = nueva sesión)
   
3. CORRELACIÓN TEMPORAL
   ↓
   TemporalCorrelator agrupa archivos de la misma sesión por timestamp
   
4. VALIDACIÓN Y CREACIÓN
   ↓
   SessionValidator verifica integridad → Sesión creada en BD
   
5. POST-PROCESAMIENTO AUTOMÁTICO
   ↓
   - Generación de eventos de estabilidad
   - Cálculo de segmentos operacionales
   - Procesamiento de rutas GPS
   - Detección de violaciones de velocidad
   - Eventos de geocercas
   
6. VISUALIZACIÓN EN DASHBOARD
   ↓
   Cliente ve sesión completa con mapa, eventos y métricas
```

### 💼 VALOR PARA EL CLIENTE

El cliente obtiene:

✅ **Visibilidad completa** de todas las operaciones realizadas  
✅ **Trazabilidad GPS exacta** de cada salida de emergencia  
✅ **Identificación rápida** de sesiones críticas (más eventos)  
✅ **Comparación de rendimiento** entre vehículos y turnos  
✅ **Evidencia documentada** con mapas para análisis post-incidente  
✅ **Exportación profesional** para reportes internos o auditorías

**Decisiones que puede tomar:**
- ¿Qué vehículos tienen más eventos críticos?
- ¿Qué rutas son más peligrosas?
- ¿Cuánto tiempo duran las emergencias reales?
- ¿Qué conductores necesitan formación adicional?

---

## PESTAÑA 2: PUNTOS NEGROS

### 🧩 FUNCIONALIDADES

La pestaña **Puntos Negros** (Heatmap de Eventos) identifica **zonas geográficas con alta concentración de eventos de estabilidad**, ayudando a detectar tramos peligrosos.

#### **2.1 Resumen de Claves Operacionales**

Muestra tiempo total y porcentaje por cada clave:

| Clave | Significado | Información mostrada |
|-------|-------------|---------------------|
| **0** | Taller / Mantenimiento | Tiempo en reparación/revisión |
| **1** | Operativo en Parque | Tiempo disponible sin salir |
| **2** | Salida en Emergencia | Tiempo con rotativo activo en ruta |
| **3** | En Siniestro | Tiempo en el lugar del incidente |
| **4** | Fin de Actuación | Tiempo post-intervención |
| **5** | Regreso al Parque | Tiempo volviendo a base |

#### **2.2 Métricas Calculadas**

- **Tiempo total operativo** (suma de todas las claves)
- **Tiempo en parque vs. fuera de parque**
- **Tiempo con rotativo encendido vs. apagado**
- **Disponibilidad real** (Clave 1 = listo para salir)
- **Tiempo de respuesta promedio** (desde Clave 2 hasta Clave 3)
- **Eficiencia de retorno** (duración de Clave 5)

#### **2.3 Visualización Gráfica**

- **Gráfica de barras apiladas** por día/semana/mes
- **Gráfica circular** (pie chart) de distribución porcentual
- **Timeline temporal** mostrando secuencia de claves en una sesión
- **Comparativa entre vehículos** (múltiples barras)

#### **2.4 Filtros Avanzados**

- **Por vehículo/grupo de vehículos**
- **Por rango de fechas**
- **Por turno** (mañana, tarde, noche)
- **Solo emergencias** (filtrar Claves 2, 3, 4, 5)

#### **2.5 Alertas Automáticas**

El sistema detecta y resalta:
- ⚠️ Tiempo excesivo en Taller (Clave 0 > 20% del total)
- ⚠️ Bajo tiempo operativo (Clave 1 < 50% del total)
- ⚠️ Emergencias incompletas (falta alguna clave en secuencia)

### 🔗 BACKEND / FUENTES DE DATOS

#### **Tablas principales:**
- **`OperationalKey`:** Segmentos de claves detectados (sessionId, keyType, startTime, endTime, durationSeconds)
- **`RotativoMeasurement`:** Estado del rotativo por timestamp
- **`Session`:** Contexto de la sesión
- **`Park`:** Geocercas de parques (para detectar Clave 1)
- **`GpsMeasurement`:** Coordenadas para validar presencia en parque/taller

#### **Endpoints utilizados:**
```typescript
GET /api/operational-keys/summary
GET /api/operational-keys/:sessionId
GET /api/kpis/states-summary
```

#### **Servicios de procesamiento:**
- **`keyCalculatorBackup`:** Motor principal de cálculo de claves
- **`OperationalKeyCalculator`:** Generador de segmentos operacionales
- **`radarIntegration`:** Geocodificación inversa para validar ubicaciones

### 👨‍💻 FLUJO DE INFORMACIÓN

```
1. POST-UPLOAD: Sesión creada
   ↓
   
2. CÁLCULO AUTOMÁTICO DE SEGMENTOS
   ↓
   keyCalculatorBackup.calcularYGuardarSegmentos(sessionId)
   
3. ANÁLISIS DE ROTATIVO
   ↓
   - Rotativo ON → Posible Clave 2, 3, 4 o 5
   - Rotativo OFF → Posible Clave 0 o 1
   
4. ANÁLISIS DE UBICACIÓN (GPS)
   ↓
   - Dentro de geocerca de parque → Clave 1 o 5
   - Fuera de parque → Clave 2, 3 o 4
   - En taller → Clave 0
   
5. ANÁLISIS DE VELOCIDAD
   ↓
   - Velocidad < 5 km/h + Rotativo ON + Fuera de parque → Clave 3 (En siniestro)
   - Velocidad > 5 km/h + Rotativo ON → Clave 2 o 5
   
6. GENERACIÓN DE SEGMENTOS
   ↓
   Se crean registros en OperationalKey con:
   - keyType (0-5)
   - startTime, endTime
   - durationSeconds
   - metadata (coordenadas, velocidad promedio)
   
7. AGREGACIÓN PARA DASHBOARD
   ↓
   /api/operational-keys/summary calcula totales por tipo
   
8. VISUALIZACIÓN
   ↓
   Cliente ve distribución de tiempos con gráficas interactivas
```

### 💼 VALOR PARA EL CLIENTE

El cliente obtiene:

✅ **Visibilidad de disponibilidad real** de cada vehículo  
✅ **Identificación de cuellos de botella** (vehículos en taller)  
✅ **Análisis de eficiencia operacional** (tiempo de respuesta)  
✅ **Cumplimiento normativo** (tiempos de conducción)  
✅ **Planificación de turnos** basada en demanda real  
✅ **Justificación de inversiones** (vehículos adicionales si baja disponibilidad)

**Decisiones que puede tomar:**
- ¿Tenemos suficientes vehículos operativos?
- ¿Cuánto tiempo pasan realmente en emergencias?
- ¿Qué vehículo necesita mantenimiento urgente?
- ¿Los tiempos de retorno son eficientes?
- ¿Cumplimos con las normativas de tiempos de conducción?

---

## PESTAÑA 3: VELOCIDAD

### 🧩 FUNCIONALIDADES

La pestaña **Velocidad** analiza los **excesos de velocidad** según normativa **DGT para vehículos de emergencia**, clasificándolos por severidad y contexto.

#### **3.1 Clasificación de Excesos según Normativa DGT**

El sistema aplica límites dinámicos según:

| Tipo de Vía | Sin Rotativo | Con Rotativo (Emergencia) |
|-------------|-------------|--------------------------|
| **Urbana** | 50 km/h | 80 km/h |
| **Interurbana** | 90 km/h | 120 km/h |
| **Autopista** | 120 km/h | 140 km/h |
| **Dentro del Parque** | **20 km/h (fijo)** | **20 km/h (fijo)** |

#### **3.2 Severidad de Violaciones**

- **LEVE:** Exceso de 1-10 km/h sobre el límite
- **MODERADO:** Exceso de 10-20 km/h
- **GRAVE:** Exceso >20 km/h (requiere acción inmediata)

#### **3.3 Estadísticas Globales**

Tarjetas KPI mostrando:
- **Total de excesos** detectados en el período
- **Excesos graves** (clickable para ver detalle)
- **Excesos moderados** (clickable)
- **Excesos leves** (clickable)
- **Excesos con rotativo encendido** (justificados por emergencia)
- **Exceso promedio** en km/h

#### **3.4 Mapa de Velocidad con Clustering**

- **Mapa interactivo** con todos los puntos de exceso
- **Clustering automático** para agrupar excesos cercanos
- **Colores por severidad:**
  - 🔴 Rojo: Graves
  - 🟠 Naranja: Moderados
  - 🟡 Amarillo: Leves
- **Popup detallado** al hacer clic:
  - Vehículo involucrado
  - Velocidad registrada vs. límite
  - Exceso en km/h
  - Tipo de vía
  - Estado del rotativo
  - Timestamp exacto
  - Coordenadas GPS

#### **3.5 Ranking de Tramos con Excesos**

Panel lateral mostrando los **15 tramos más problemáticos:**
- **Ubicación geocodificada** (dirección real)
- **Total de violaciones** en ese punto
- **Exceso promedio**
- **Desglose por severidad** (graves/moderados/leves)
- **Clickable** para centrar mapa en ese punto

#### **3.6 Modal de Desglose de Incidencias**

Al hacer clic en una categoría (Graves, Moderados, Leves):
- **Lista completa** de todos los excesos de esa categoría
- **Información detallada** de cada uno:
  - Vehículo
  - Fecha y hora exacta
  - Velocidad / Límite / Exceso
  - Tipo de vía
  - Estado del rotativo
  - Coordenadas GPS
- **Click en incidencia** centra el mapa en ese punto

#### **3.7 Filtros Específicos**

- **Por rotativo:** Todos / Solo ON / Solo OFF
- **Por clasificación:** Todos / Graves / Moderados / Leves
- **Por tipo de vía:** Todas / Urbana / Interurbana / Autopista

#### **3.8 Exportación a PDF Detallado**

Genera reporte profesional con:
- KPIs de excesos
- Tabla de los 30 excesos más graves
- Límites aplicados según normativa
- Análisis de resultados
- Clasificación de severidad

### 🔗 BACKEND / FUENTES DE DATOS

#### **Tablas principales:**
- **`SpeedViolation`:** Registro de cada exceso (timestamp, speed, speedLimit, violationType, rotativoOn, roadType, lat, lng)
- **`GpsMeasurement`:** Velocidad registrada en cada punto GPS
- **`RotativoMeasurement`:** Estado del rotativo en ese momento
- **`Park`:** Geocercas de parques (para límite de 20 km/h)
- **`Session`:** Contexto del vehículo y organización

#### **Endpoints utilizados:**
```typescript
GET /api/speed-analysis/violations
GET /api/speed-analysis/critical-zones
GET /api/speed-analysis/stats
```

#### **Servicios de procesamiento:**
- **`speedAnalyzer`:** Motor de detección de excesos
- **`detectarExcesosSesion()`:** Analiza velocidad punto por punto
- **`DGTLimitsCalculator`:** Aplica límites dinámicos según contexto
- **`RoadTypeDetector`:** Clasifica tipo de vía (urbana/interurbana/autopista)

### 👨‍💻 FLUJO DE INFORMACIÓN

```
1. POST-UPLOAD: GPS procesado
   ↓
   
2. DETECCIÓN AUTOMÁTICA DE VIOLACIONES
   ↓
   speedAnalyzer.analizarVelocidades(sessionIds)
   
3. POR CADA PUNTO GPS:
   ↓
   a) Obtener velocidad registrada
   b) Obtener estado del rotativo en ese timestamp
   c) Detectar tipo de vía (GPS + clasificador de carreteras)
   d) Comprobar si está dentro del parque
   
4. CÁLCULO DE LÍMITE DINÁMICO
   ↓
   Si dentro del parque: límite = 20 km/h (fijo)
   Si fuera del parque:
      - Urbana: 50 km/h (sin rotativo) / 80 km/h (con rotativo)
      - Interurbana: 90 km/h / 120 km/h
      - Autopista: 120 km/h / 140 km/h
   
5. CLASIFICACIÓN DE SEVERIDAD
   ↓
   Exceso = velocidad - límite
   Si exceso > 20 km/h → GRAVE
   Si exceso entre 10-20 km/h → MODERADO
   Si exceso entre 1-10 km/h → LEVE
   
6. CREACIÓN DE REGISTRO
   ↓
   Si hay exceso → SpeedViolation creado en BD con:
   - vehicleId, sessionId
   - timestamp, lat, lng
   - speed, speedLimit, excess
   - violationType (grave/moderado/leve)
   - rotativoOn (true/false)
   - roadType (urban/interurban/highway)
   
7. AGREGACIÓN PARA DASHBOARD
   ↓
   /api/speed-analysis/violations → Todos los excesos
   /api/speed-analysis/critical-zones → Ranking de tramos
   
8. VISUALIZACIÓN
   ↓
   Cliente ve mapa + estadísticas + ranking + modal de detalles
```

### 💼 VALOR PARA EL CLIENTE

El cliente obtiene:

✅ **Cumplimiento normativo DGT** automático  
✅ **Identificación de conductores de riesgo** (vehículos con más excesos)  
✅ **Identificación de tramos peligrosos** (ranking de zonas críticas)  
✅ **Justificación de excesos** (con rotativo activo en emergencia)  
✅ **Evidencia para formación** (mapas y datos concretos)  
✅ **Protección legal** (demostrar que excesos fueron justificados por emergencia)

**Decisiones que puede tomar:**
- ¿Qué conductores necesitan formación en conducción de emergencia?
- ¿Qué tramos son más peligrosos y requieren precaución especial?
- ¿Los excesos ocurren principalmente en emergencias (rotativo ON)?
- ¿Necesitamos revisar rutas alternativas para ciertos destinos?
- ¿Cumplimos con las normativas de velocidad adaptadas a vehículos prioritarios?

---

## PESTAÑA 4: SESIONES & RECORRIDOS

### 🧩 FUNCIONALIDADES

La pestaña **Sesiones & Recorridos** muestra el listado completo de todas las sesiones operacionales registradas con visualización de rutas GPS, permitiendo al cliente:

#### **4.1 Mapa de Calor (Heatmap)**

- **Visualización de densidad** de eventos críticos
- **Gradiente de colores:**
  - 🟢 Verde: Pocas incidencias
  - 🟡 Amarillo: Incidencias moderadas
  - 🔴 Rojo intenso: Alta concentración de eventos
- **Ajuste dinámico** según nivel de zoom

#### **4.2 Marcadores de Puntos Críticos**

Cada punto negro muestra:
- **Ubicación exacta** (lat, lng)
- **Dirección geocodificada** (calle/carretera real)
- **Severidad dominante** (grave/moderada/leve)
- **Frecuencia de eventos** (número total)
- **Última ocurrencia** (fecha del último evento)
- **Vehículos involucrados** (IDs de vehículos afectados)

#### **4.3 Clustering Inteligente**

- Agrupa eventos cercanos (<100m) en un único punto crítico
- **Número en el cluster** indica cantidad de eventos agrupados
- **Click para expandir** y ver eventos individuales

#### **4.4 Ranking de Puntos Negros (Top 15)**

Panel lateral con los puntos más críticos:

**Posiciones de podio:**
- 🥇 #1: Medalla de oro (punto más peligroso)
- 🥈 #2: Medalla de plata
- 🥉 #3: Medalla de bronce

**Información de cada punto:**
- **Ubicación** (dirección real)
- **Total de eventos** acumulados
- **Desglose por severidad:**
  - Graves: X eventos
  - Moderados: X eventos
  - Leves: X eventos
- **Frecuencia relativa** (eventos/día)
- **Severidad dominante**

**Interacción:**
- Click en un punto del ranking centra el mapa en esa ubicación
- Zoom automático a nivel 15 para detalle

#### **4.5 Filtros Específicos**

- **Por severidad mínima:** Solo graves / Moderadas o superiores / Todas
- **Por frecuencia mínima:** Mínimo X eventos para considerarse punto negro
- **Por tipo de evento:** Dangerous drift, Rollover risk, etc.
- **Por vehículo:** Solo eventos de vehículos seleccionados
- **Por rango de fechas**

#### **4.6 Análisis de Correlación**

El sistema detecta automáticamente:
- **Puntos negros relacionados con velocidad** (coincidencia con excesos)
- **Puntos negros en geocercas** (entrada/salida de parques)
- **Patrones temporales** (eventos nocturnos vs. diurnos)
- **Vehículos más afectados** en cada punto

#### **4.7 Exportación de Informe**

PDF generado con:
- Captura del mapa de calor
- Tabla del ranking completo
- Análisis estadístico de cada punto
- Recomendaciones de actuación

### 🔗 BACKEND / FUENTES DE DATOS

#### **Tablas principales:**
- **`StabilityEvent`:** Eventos de estabilidad con coordenadas (lat, lng, type, severity, timestamp)
- **`Session`:** Contexto del vehículo
- **`GpsMeasurement`:** Validación de coordenadas GPS
- **`SpeedViolation`:** Correlación con excesos de velocidad

#### **Endpoints utilizados:**
```typescript
GET /api/kpis/heatmap
GET /api/kpis/critical-points
GET /api/stability/events/clustering
```

#### **Servicios de procesamiento:**
- **`HeatmapGenerator`:** Genera densidad de eventos
- **`CriticalPointsDetector`:** Identifica zonas de alta frecuencia
- **`EventClusteringService`:** Agrupa eventos cercanos
- **`geocodingService`:** Convierte coordenadas a direcciones

### 👨‍💻 FLUJO DE INFORMACIÓN

```
1. POST-UPLOAD: Eventos de estabilidad generados
   ↓
   
2. ALMACENAMIENTO DE EVENTOS
   ↓
   Cada evento guardado en StabilityEvent con:
   - sessionId
   - timestamp
   - lat, lng (coordenadas GPS)
   - type (dangerous_drift, rollover_risk, etc.)
   - severity (GRAVE, MODERADA, LEVE)
   
3. AGREGACIÓN ESPACIAL
   ↓
   /api/kpis/heatmap procesa todos los eventos y genera:
   - Grid de densidad (cuadrículas de 100m x 100m)
   - Peso por severidad (graves = 3x, moderadas = 2x, leves = 1x)
   
4. DETECCIÓN DE PUNTOS CRÍTICOS
   ↓
   CriticalPointsDetector identifica zonas con:
   - Frecuencia > umbral (ej. >5 eventos)
   - Alta severidad acumulada
   
5. CLUSTERING DE EVENTOS
   ↓
   EventClusteringService agrupa eventos cercanos (<100m):
   - Calcula centroide del cluster
   - Suma frecuencia total
   - Determina severidad dominante
   
6. GEOCODIFICACIÓN INVERSA
   ↓
   Para cada punto crítico:
   geocodingService.reverseGeocode(lat, lng) → Dirección real
   
7. RANKING Y ORDENACIÓN
   ↓
   Puntos críticos ordenados por:
   - Total de eventos (descendente)
   - Severidad dominante (graves primero)
   - Frecuencia relativa
   
8. VISUALIZACIÓN
   ↓
   Cliente ve:
   - Mapa de calor con gradiente de colores
   - Marcadores de puntos críticos clickables
   - Ranking lateral con top 15
```

### 💼 VALOR PARA EL CLIENTE

El cliente obtiene:

✅ **Identificación visual de tramos peligrosos** en su zona operativa  
✅ **Priorización de zonas** que requieren atención especial  
✅ **Planificación de rutas alternativas** para evitar puntos negros  
✅ **Evidencia para formación** (mostrar a conductores dónde ser más cuidadosos)  
✅ **Justificación de inversiones** (mejoras en infraestructura o señalización)  
✅ **Análisis de tendencias** (¿mejora o empeora un punto con el tiempo?)

**Decisiones que puede tomar:**
- ¿Qué carreteras son las más peligrosas para nuestras operaciones?
- ¿Necesitamos solicitar mejoras en ciertos tramos a las autoridades?
- ¿Qué rutas alternativas podemos usar para emergencias?
- ¿Los puntos negros coinciden con zonas de alta velocidad?
- ¿Hay patrones temporales (puntos más peligrosos de noche)?

---

## DASHBOARD ADMIN - MISMAS PESTAÑAS + ACCESO A MÓDULOS

### 🧩 FUNCIONALIDADES

Cuando un usuario con rol **ADMIN** accede a `/dashboard`, ve **exactamente las mismas 4 pestañas que un MANAGER**, pero con acceso adicional a módulos avanzados desde el menú lateral.

#### **1. Dashboard Idéntico al MANAGER**

El ADMIN ve las mismas 4 pestañas:
1. **Estados & Tiempos**
2. **Puntos Negros**
3. **Velocidad**
4. **Sesiones & Recorridos**

Con los mismos **filtros globales**:
- Selector de Parque
- Selector de Vehículos
- Rango de fechas
- Severidad

#### **2. Diferencia Clave: Acceso a Módulos Adicionales**

Desde el **menú lateral**, el ADMIN puede acceder a:

**Módulos Técnicos:**
- 📊 **Estabilidad** - Análisis profundo de eventos
- 📡 **Telemetría** - Datos CAN + GPS con replay
- 🤖 **Inteligencia Artificial** - Copiloto IA

**Módulos de Gestión:**
- ☁️ **Subir Archivos** - Upload manual de sesiones
- 🗺️ **Geofences** - Creación/edición de geocercas
- 🔧 **Operaciones** - Gestión de eventos y mantenimiento
- 🔔 **Alertas** - Configuración de alertas

**Módulos Administrativos:**
- 📈 **Reportes** - Generación automática de informes
- ⚙️ **Administración** - Gestión de usuarios y organizaciones
- 🛠️ **Configuración Sistema** - Parámetros avanzados
- 📚 **Base de Conocimiento** - Documentación del sistema

### 💼 VALOR PARA EL ADMINISTRADOR

El ADMIN obtiene:

✅ **Misma vista operacional** que sus clientes (MANAGERS)  
✅ **Empatía con el usuario final** (ve lo mismo que ellos ven)  
✅ **Acceso a herramientas avanzadas** cuando las necesita  
✅ **Control completo del sistema** desde módulos especializados  
✅ **Flexibilidad** para hacer análisis profundos o gestión administrativa

---

## MÓDULOS ADICIONALES DEL MENÚ

Además del Dashboard principal, el sistema tiene **módulos independientes** accesibles desde el menú lateral:

### 📡 1. TELEMETRÍA (/telemetry)

**Componente:** `UnifiedTelemetria.tsx`

**Funcionalidades:**
- Datos CAN detallados (RPM, temperatura, voltaje, etc.)
- Puntos GPS en mapa interactivo con timeline
- Visualización de sesiones completas
- Replay de sesiones (modo reproducción)
- Exportación de datos telemetría

**Pestañas internas:**
- Datos CAN
- Mapa GPS
- Alarmas configurables
- Comparador CAN/GPS

### 📊 2. ESTABILIDAD (/stability)

**Componente:** `UnifiedEstabilidad.tsx`

**Funcionalidades:**
- Análisis de eventos de estabilidad (dangerous_drift, rollover_risk)
- Métricas de Índice de Estabilidad (SI)
- Gráficas de aceleraciones (lateral, longitudinal, vertical)
- Comparador de sesiones de estabilidad
- Eventos críticos con severidad

### 🗺️ 3. GEOCERCAS (/geofences)

**Componente:** `UnifiedGeofences.tsx`

**Funcionalidades:**
- Creación/edición de geocercas (círculos, polígonos)
- Detección automática de entrada/salida
- Alertas basadas en geocercas
- Visualización de eventos de geocercas
- Gestión de parques y talleres

### 🔧 4. OPERACIONES (/operations)

**Componente:** `UnifiedOperations.tsx`

**Funcionalidades:**
- Gestión de eventos operacionales
- Alertas con severidad configurable
- Mantenimiento preventivo y correctivo
- Calendario de operaciones
- Historial de actuaciones

### 📈 5. REPORTES (/reports)

**Componente:** `UnifiedReports.tsx`

**Funcionalidades:**
- Generación de reportes automáticos
- Plantillas de reportes (ejecutivo, operacional, técnico)
- Exportación en múltiples formatos (PDF, Excel, CSV)
- Reportes programados
- Historial de reportes generados

### 📚 6. BASE DE CONOCIMIENTO (/knowledge-base)

**Funcionalidades:**
- Documentación interna del sistema
- Guías de uso para usuarios
- FAQs y resolución de problemas
- Tutoriales en video (si disponibles)

### ⚙️ 7. ADMINISTRACIÓN (/admin)

**Solo para ADMIN**

**Funcionalidades:**
- Gestión de usuarios (crear, editar, eliminar)
- Gestión de vehículos (alta, baja, configuración)
- Configuración de límites DGT
- Configuración de geocercas organizacionales
- Logs del sistema
- Diagnósticos avanzados

---

## SUBIDA AUTOMÁTICA

### 🧩 FUNCIONALIDADES

La pestaña **Subida Automática** NO es visible directamente para el cliente final, ya que opera **en segundo plano** de forma completamente automática. Sin embargo, desde el módulo de **Administración**, el ADMIN puede ver el estado del sistema de subida.

#### **5.1 Detección Automática de Archivos**

El sistema monitorea continuamente:
- **Carpeta FTP** configurada por organización
- **Formulario web de subida** (alternativa manual)
- **Detección de nuevos archivos** cada X minutos (configurable)

**Tipos de archivo detectados:**
- `ESTABILIDAD_*.csv` / `Estabilidad_*.csv`
- `GPS_*.csv` / `GPS *.csv`
- `Rotativo_*.csv` / `ROTATIVO_*.csv`

#### **5.2 Procesamiento Automático**

Una vez detectados, el sistema:

1. **Valida formato y contenido** de cada archivo
2. **Extrae ID de vehículo** del nombre del archivo
3. **Verifica que el vehículo exista** en la BD
   - Si NO existe → Ofrece crearlo automáticamente
4. **Detecta fecha base** del archivo (nombre o timestamps internos)
5. **Agrupa archivos** del mismo vehículo y fecha
6. **Procesa en lote** para eficiencia

#### **5.3 Reporte de Procesamiento**

Al finalizar, genera reporte automático con:
- **Archivos procesados:** Nombre, tamaño, tipo
- **Sesiones creadas:** Número de sesión, rango horario, duración
- **Eventos generados:** Total por sesión, desglose por severidad
- **Errores encontrados:** Archivos corruptos, falta de ID, datos inválidos
- **Acciones sugeridas:** Crear vehículo, corregir formato, etc.

#### **5.4 Notificaciones Automáticas**

El sistema puede enviar:
- **Email al administrador** cuando se procesan archivos nuevos
- **Alertas** si hay errores críticos
- **Resumen diario** de actividad de subida

#### **5.5 Panel de Monitoreo (Solo ADMIN)**

Vista administrativa mostrando:
- **Últimos archivos subidos** (tabla con estado)
- **Estadísticas de procesamiento:**
  - Archivos procesados hoy/semana/mes
  - Sesiones creadas hoy/semana/mes
  - Tasa de éxito (% sin errores)
- **Logs de actividad** (últimas 100 operaciones)
- **Cola de procesamiento** (archivos pendientes)

#### **5.6 Configuración del Sistema**

El ADMIN puede ajustar:
- **Intervalo de escaneo** del FTP (minutos)
- **Reglas de validación** (strictness)
- **Creación automática de vehículos** (ON/OFF)
- **Notificaciones** (email, push, webhook)
- **Filtro de fechas** (solo procesar desde X fecha)

### 🔗 BACKEND / FUENTES DE DATOS

#### **Tablas principales:**
- **`UploadLog`:** Registro de cada operación de subida
- **`ProcessingQueue`:** Cola de archivos pendientes
- **`Session`:** Sesiones creadas a partir de archivos
- **`Vehicle`:** Vehículos asociados a archivos

#### **Endpoints utilizados (internos):**
```typescript
POST /api/upload/ftp-scan       // Escaneo manual del FTP
POST /api/upload/process-files   // Procesar archivos manualmente
GET /api/upload/logs             // Ver logs de subida
GET /api/upload/stats            // Estadísticas de procesamiento
```

#### **Servicios de procesamiento:**
- **`FTPMonitor`:** Escanea FTP periódicamente
- **`UnifiedFileProcessorV2`:** Procesador principal
- **`SessionDetectorV2`:** Detecta sesiones en archivos
- **`TemporalCorrelator`:** Correlaciona archivos
- **`UploadPostProcessor`:** Post-procesamiento automático
- **`parseEstabilidadRobust`:** Parser de archivos de estabilidad
- **`parseGPSRobust`:** Parser de archivos GPS
- **`parseRotativoRobust`:** Parser de archivos de rotativo

### 👨‍💻 FLUJO DE INFORMACIÓN

```
1. DETECCIÓN AUTOMÁTICA
   ↓
   FTPMonitor escanea carpeta FTP cada 5 minutos
   Encuentra nuevos archivos: ["Estabilidad_V01_2025-10-15.csv", "GPS_V01_2025-10-15.csv", "Rotativo_V01_2025-10-15.csv"]
   
2. VALIDACIÓN INICIAL
   ↓
   - Verificar formato de nombre
   - Extraer ID de vehículo (V01)
   - Verificar que vehículo existe en BD
   
3. PARSEO DE ARCHIVOS
   ↓
   Estabilidad: parseEstabilidadRobust(buffer) → Mediciones con timestamps
   GPS: parseGPSRobust(buffer) → Puntos GPS con coordenadas
   Rotativo: parseRotativoRobust(buffer) → Estados del rotativo
   
4. DETECCIÓN DE SESIONES
   ↓
   SessionDetectorV2 analiza gaps temporales en cada archivo:
   - Si gap > 5 minutos → Nueva sesión
   - Resultado: [Sesión 1, Sesión 2, ...] por archivo
   
5. CORRELACIÓN TEMPORAL
   ↓
   TemporalCorrelator agrupa sesiones de los 3 archivos:
   - Sesión 1 de Estabilidad + Sesión 1 de GPS + Sesión 1 de Rotativo
   - Usa overlapping temporal (90% de coincidencia)
   
6. VALIDACIÓN DE SESIONES
   ↓
   SessionValidator verifica:
   - Al menos Estabilidad + GPS presentes
   - Rotativo opcional
   - Duración mínima (configurable)
   - Sin saltos GPS mayores a 5 km
   
7. CREACIÓN EN BD
   ↓
   Por cada sesión válida:
   - Crear registro en tabla Session
   - Insertar mediciones en StabilityMeasurement
   - Insertar puntos en GpsMeasurement
   - Insertar estados en RotativoMeasurement
   
8. POST-PROCESAMIENTO AUTOMÁTICO
   ↓
   UploadPostProcessor.process([sessionId1, sessionId2, ...])
   
   a) Generar eventos de estabilidad:
      processAndSaveStabilityEvents(sessionId)
      → Detecta dangerous_drift, rollover_risk, etc.
   
   b) Generar segmentos operacionales:
      generateOperationalSegments(sessionId)
      → Calcula claves 0-5
   
   c) Geoprocesamiento:
      routeProcessorService.processSession(sessionId)
      → Valida rutas GPS, detecta geocercas
   
   d) Detección de violaciones de velocidad:
      speedAnalyzer.detectarExcesosSesion(sessionId)
      → Identifica excesos según normativa DGT
   
9. GENERACIÓN DE REPORTE
   ↓
   Crear ProcessingReport con:
   - Archivos procesados
   - Sesiones creadas
   - Eventos generados
   - Errores encontrados
   
10. NOTIFICACIÓN
    ↓
    Enviar email al ADMIN:
    "3 archivos procesados, 2 sesiones creadas, 47 eventos detectados"
    
11. ACTUALIZACIÓN DE DASHBOARD
    ↓
    Cliente ve nuevas sesiones automáticamente en pestañas:
    - Sesiones
    - Tiempos
    - Velocidades
    - Puntos Negros
```

### 💼 VALOR PARA EL CLIENTE

El cliente obtiene:

✅ **Procesamiento automático 24/7** sin intervención manual  
✅ **Datos disponibles minutos después** de finalizar una operación  
✅ **Cero carga administrativa** para el personal de bomberos  
✅ **Validación automática** de datos (detección de errores)  
✅ **Creación automática** de sesiones correlacionadas  
✅ **Análisis completo** generado en segundo plano (eventos, claves, velocidades, etc.)  
✅ **Notificaciones de estado** para transparencia

**Valor crítico:**
- El bombero solo necesita **conectar el datalogger al PC** y los datos se suben solos vía FTP
- No necesita saber nada de análisis técnico
- **Inmediatez:** Datos listos para revisar al día siguiente
- **Fiabilidad:** Sistema automático reduce errores humanos

---

## FLUJO DE INFORMACIÓN GENERAL

### 🔄 Ciclo Completo de Datos

```
┌─────────────────────────────────────────────────────────────────────┐
│                         OPERACIÓN REAL                              │
│  Bombero sale en emergencia con datalogger grabando datos          │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FINALIZACIÓN DE TURNO                            │
│  Bombero conecta datalogger → Archivos copiados a carpeta FTP      │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│               DETECCIÓN AUTOMÁTICA (5 min)                          │
│  FTPMonitor detecta nuevos archivos CSV                             │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PROCESAMIENTO                                     │
│  1. Parseo de archivos (Estabilidad, GPS, Rotativo)                │
│  2. Detección de sesiones por gaps temporales                       │
│  3. Correlación de archivos de la misma sesión                      │
│  4. Validación de datos                                              │
│  5. Creación de sesiones en BD                                       │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│              POST-PROCESAMIENTO AUTOMÁTICO                           │
│  1. Eventos de estabilidad (dangerous_drift, rollover_risk)         │
│  2. Segmentos operacionales (claves 0-5)                            │
│  3. Geoprocesamiento (rutas, geocercas)                             │
│  4. Violaciones de velocidad (DGT)                                   │
│  5. Agregación de KPIs                                               │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  VISUALIZACIÓN EN DASHBOARD                          │
│                                                                      │
│  📋 SESIONES: Listado completo con mapas y eventos                  │
│  ⏱️ TIEMPOS: Distribución por claves operacionales                  │
│  🏎️ VELOCIDADES: Excesos según normativa DGT                        │
│  ⚫ PUNTOS NEGROS: Mapa de calor de zonas peligrosas                │
│                                                                      │
│  Cliente accede y ve toda la información lista para usar            │
└─────────────────────────────────────────────────────────────────────┘
```

### ⚙️ Arquitectura de Procesamiento

```
┌────────────────────┐
│   ARCHIVOS CSV     │
│ (FTP o Formulario) │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  UnifiedFileProcessor  │ ─────► Detecta sesiones (gaps temporales)
│       V2           │
└────────┬───────────┘
         │
         ├───► SessionDetectorV2    │ Encuentra sesiones en cada archivo
         ├───► TemporalCorrelator   │ Agrupa archivos de misma sesión
         ├───► SessionValidator     │ Valida datos
         └───► BD: Session creada   │
                │
                ▼
┌───────────────────────────────┐
│  UploadPostProcessor          │
│  (Procesamiento Automático)   │
└───────────┬───────────────────┘
            │
            ├───► StabilityEventService      │ Genera eventos críticos
            ├───► OperationalKeyCalculator   │ Calcula claves 0-5
            ├───► RouteProcessorService      │ Valida rutas GPS
            ├───► SpeedAnalyzer              │ Detecta excesos
            ├───► GeofenceRuleEngine         │ Eventos de geocercas
            └───► KPICacheService            │ Actualiza cache
                    │
                    ▼
┌───────────────────────────────┐
│  BASE DE DATOS                │
│                               │
│  Session                      │ ─┐
│  StabilityEvent               │  │
│  OperationalKey               │  ├─► Fuentes de datos
│  SpeedViolation               │  │   para Dashboard
│  GpsMeasurement               │  │
│  RotativoMeasurement          │ ─┘
└───────────────────────────────┘
                │
                ▼
┌───────────────────────────────┐
│      DASHBOARD CLIENTE        │
│                               │
│  React Query (auto-refresh)   │ ─► Actualización cada 30s
│  Filtros por vehículo/fecha   │
│  Exportación PDF en 1 clic    │
│  Mapas interactivos           │
└───────────────────────────────┘
```

---

## CONEXIONES ENTRE PESTAÑAS

### 🔗 Interrelaciones Funcionales

#### **1. Sesiones → Tiempos**

Desde la pestaña **Sesiones**, al hacer clic en una sesión específica:
- El usuario puede ver el **desglose de tiempos** (claves 0-5) de esa sesión
- Se abre un modal o se navega a **Tiempos** con filtro pre-aplicado a esa sesión
- Muestra timeline temporal con secuencia exacta de claves

**Ejemplo:**
```
Sesión: Vehículo B01 - 15/10/2025 - 14:32 a 16:18
→ Click en "Ver tiempos"
→ Abre Tiempos mostrando:
   Clave 1: 14:32 - 14:38 (6 min) - En parque
   Clave 2: 14:38 - 14:52 (14 min) - Salida en emergencia
   Clave 3: 14:52 - 15:45 (53 min) - En siniestro
   Clave 4: 15:45 - 15:48 (3 min) - Fin de actuación
   Clave 5: 15:48 - 16:12 (24 min) - Regreso al parque
   Clave 1: 16:12 - 16:18 (6 min) - De nuevo en parque
```

#### **2. Sesiones → Velocidades**

Desde **Sesiones**, al visualizar el mapa de una sesión:
- Los **eventos en rojo** pueden representar excesos de velocidad
- Click en un punto del mapa → Popup muestra si hubo exceso
- Botón **"Ver excesos de esta sesión"** navega a **Velocidades** con filtro aplicado

**Ejemplo:**
```
Sesión: Vehículo B03 - 16/10/2025
→ Mapa muestra 3 marcadores rojos en autopista A-1
→ Click en "Ver todos los excesos"
→ Abre Velocidades mostrando:
   - 3 excesos graves en A-1 km 45
   - Velocidad: 152 km/h (límite 140 km/h con rotativo)
   - Exceso: +12 km/h (GRAVE)
```

#### **3. Sesiones → Puntos Negros**

Los eventos detectados en una sesión **alimentan directamente** el mapa de puntos negros:
- Cada **evento de estabilidad** (dangerous_drift, rollover_risk) se acumula en el heatmap
- Si una sesión tiene muchos eventos en una zona específica, esa zona aparecerá como **punto negro**

**Flujo:**
```
Sesión procesada → Eventos generados → Agregados al heatmap
→ Si zona acumula >5 eventos → Aparece en Puntos Negros ranking
```

#### **4. Velocidades → Puntos Negros**

Existe **correlación automática** entre excesos de velocidad y puntos negros:
- El sistema detecta si un **punto negro coincide con zona de excesos**
- En el popup del punto negro se muestra: "⚡ También hay 8 excesos de velocidad en esta zona"
- Permite identificar si la peligrosidad de un punto se debe a velocidad excesiva

**Ejemplo:**
```
Punto Negro #1: Carretera M-607 km 12
- 15 eventos de estabilidad (8 graves, 5 moderadas, 2 leves)
- ⚡ Correlación: 12 excesos de velocidad en este tramo
→ Conclusión: Zona peligrosa por curvas cerradas + alta velocidad
```

#### **5. Tiempos → Dashboard General**

Los datos de **Tiempos** (claves operacionales) se usan para calcular KPIs generales del Dashboard:
- **Disponibilidad:** % de tiempo en Clave 1 (operativo en parque)
- **Utilización:** % de tiempo en Clave 2, 3, 4, 5 (fuera del parque)
- **Tiempo de respuesta promedio:** Desde Clave 2 hasta Clave 3
- **Eficiencia de retorno:** Duración promedio de Clave 5

#### **6. Todas → Exportación PDF**

Desde cualquier pestaña, el usuario puede:
- **Exportar vista actual a PDF** con datos filtrados
- Los PDFs incluyen información de **múltiples pestañas** relacionadas:
  - Reporte de sesión incluye: mapa (Sesiones), eventos (Puntos Negros), excesos (Velocidades)
  - Reporte de tiempos incluye: distribución de claves, sesiones relacionadas
  - Reporte de velocidades incluye: mapa de excesos, ranking de tramos, estadísticas

---

## VALOR INTEGRAL PARA EL CLIENTE

### 💼 Visión Completa del Sistema

El **Dashboard** de DobackSoft ofrece una **solución integral** para la gestión de flota de vehículos de emergencia, con un enfoque en:

#### **1. Automatización Total**

✅ El cliente **NO necesita hacer nada** después de conectar el datalogger  
✅ Los datos se procesan automáticamente en minutos  
✅ Todos los análisis (eventos, claves, velocidades, puntos negros) se generan solos  
✅ El Dashboard se actualiza en tiempo real sin intervención

#### **2. Toma de Decisiones Basada en Datos**

El cliente puede responder preguntas críticas:

**Operacionales:**
- ¿Cuántos vehículos están disponibles realmente?
- ¿Cuánto tiempo pasan en emergencias vs. en parque?
- ¿Qué vehículos tienen más eventos críticos?

**Seguridad:**
- ¿Qué tramos son los más peligrosos?
- ¿Dónde ocurren más eventos de estabilidad?
- ¿Los excesos de velocidad están justificados por emergencias?

**Formación:**
- ¿Qué conductores necesitan formación adicional?
- ¿En qué zonas deben ser más cuidadosos?
- ¿Qué patrones de conducción son peligrosos?

**Cumplimiento:**
- ¿Cumplimos con las normativas de velocidad DGT?
- ¿Los tiempos de conducción son adecuados?
- ¿Tenemos evidencia documental para auditorías?

**Gestión:**
- ¿Necesitamos más vehículos (disponibilidad baja)?
- ¿Qué vehículos necesitan mantenimiento urgente?
- ¿Justificamos inversiones en mejoras de infraestructura?

#### **3. Evidencia Documental**

Cada pestaña genera **reportes profesionales en PDF** con:
- Mapas de alta calidad
- Datos georreferenciados (direcciones reales)
- Gráficas y estadísticas
- Análisis automático con conclusiones

**Usos:**
- Reportes para mandos superiores
- Evidencia para seguros tras incidentes
- Justificación de excesos en emergencias
- Auditorías de cumplimiento normativo
- Formación de nuevos conductores

#### **4. Visibilidad 360° de la Operación**

El cliente tiene una **visión completa** de su flota:
- **Histórico completo:** Todas las operaciones desde el primer día
- **Análisis en tiempo real:** Datos disponibles minutos después de finalizar
- **Comparativas:** Entre vehículos, turnos, períodos temporales
- **Tendencias:** ¿Mejora o empeora la seguridad con el tiempo?

#### **5. Ahorro de Tiempo y Costes**

**Antes de DobackSoft:**
- Análisis manual de datos (horas/días de trabajo)
- Reportes hechos en Excel (propensos a errores)
- Sin trazabilidad GPS real
- Sin correlación entre datos

**Con DobackSoft:**
- ✅ Análisis automático en 2-3 minutos
- ✅ Reportes PDF en 1 clic
- ✅ Mapas interactivos con eventos geolocalizados
- ✅ Correlación automática de todos los datos

**Ahorro estimado:**
- **8-10 horas/semana** de trabajo administrativo
- **100% precisión** (vs. errores humanos en Excel)
- **Respuesta inmediata** a solicitudes de informes

#### **6. Mejora Continua**

El sistema permite **monitoreo de eficacia** de medidas tomadas:
- Se detecta un punto negro → Se forma a los conductores → ¿Bajan los eventos en ese punto?
- Se identifican excesos recurrentes → Se ajustan rutas → ¿Mejora el cumplimiento?
- Se detecta bajo tiempo operativo → Se revisa mantenimiento → ¿Aumenta disponibilidad?

**Métricas de mejora visibles:**
- Evolución de puntos negros (¿desaparecen con formación?)
- Reducción de excesos de velocidad
- Aumento de tiempo operativo (Clave 1)
- Mejora de tiempos de respuesta

---

## 📊 RESUMEN EJECUTIVO

### Dashboard en Cifras

| Métrica | Valor |
|---------|-------|
| **Versiones de Dashboard** | 2 (MANAGER con pestañas, ADMIN TV Wall) |
| **Pestañas MANAGER** | 4 (Estados & Tiempos, Puntos Negros, Velocidad, Sesiones & Recorridos) |
| **Módulos del menú** | 7 (Telemetría, Estabilidad, Geocercas, Operaciones, Reportes, Base Conocimiento, Administración) |
| **Tiempo de procesamiento** | 2-3 minutos desde subida hasta visualización |
| **Actualización de datos** | Automática (configurable) |
| **Fuentes de datos** | 15+ tablas de BD |
| **Servicios de procesamiento** | 20+ servicios automáticos |
| **Tipos de análisis** | Estabilidad, Claves operacionales, Velocidad, Geolocalización, Telemetría |
| **Exportaciones** | PDF en 1 clic desde todas las pestañas y módulos |
| **Mapas interactivos** | 5 (Sesiones, Velocidades, Puntos Negros, Telemetría, Geocercas) |
| **KPIs calculados** | 30+ métricas operacionales |
| **Roles soportados** | 2 (ADMIN, MANAGER) |

### Flujo Completo (de datos a decisión)

```
Datalogger → FTP → Procesamiento (2-3 min) → Dashboard → Análisis → Decisión
                                                           ↓
                                                      Exportación PDF
                                                           ↓
                                                      Acción (formación, 
                                                              cambio de rutas,
                                                              mantenimiento)
```

### Valor Único de DobackSoft

✅ **Único sistema del mercado** especializado en vehículos de emergencia de bomberos  
✅ **Dashboard adaptativo por rol** (MANAGER operacional vs. ADMIN ejecutivo)  
✅ **Normativa DGT integrada** (límites de velocidad adaptativos)  
✅ **Claves operacionales** (0-5) únicas del sector  
✅ **Procesamiento 100% automático** (cero carga administrativa)  
✅ **Análisis de estabilidad avanzado** (dangerous_drift, rollover_risk)  
✅ **Geolocalización de eventos** con direcciones reales  
✅ **Exportación profesional** para reportes y auditorías  
✅ **Arquitectura modular** (7 módulos independientes)

### Diferenciadores Clave

**🎯 PARA MANAGERS (Cliente Final):**
- Dashboard con 4 pestañas operacionales enfocadas en análisis diario
- Filtros globales para personalizar vistas
- Acceso rápido a sesiones, tiempos, velocidades y puntos críticos
- Exportación directa a PDF de cualquier vista

**🎯 PARA ADMINS (Administradores):**
- Dashboard ejecutivo tipo TV Wall para monitoreo general
- Acceso a 7 módulos especializados desde menú lateral
- Control completo del sistema (usuarios, vehículos, configuración)
- Herramientas de diagnóstico y regeneración masiva

**🔄 FLUJO INTEGRADO:**
- Subida automática → Procesamiento → Dashboard actualizado
- Sin intervención manual en ningún paso
- Datos disponibles en 2-3 minutos tras finalizar operación
- Notificaciones automáticas de procesamiento completado

---

**Documento generado:** 03/11/2025  
**Versión:** 2.0  
**Para:** Documentación interna y presentaciones comerciales  
**Autor:** Equipo DobackSoft

