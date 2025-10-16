# 📊 VISUALIZACIÓN: CÓMO SE GENERAN SESIONES

**Basado en:** Análisis de 93 archivos reales de CMadrid  
**Fecha:** 2025-10-11

---

## 🎯 EJEMPLO REAL COMPLETO

### **Archivo: ROTATIVO_DOBACK028_20251006.txt**

Este archivo tiene **62 sesiones** en un solo día. Veamos cómo se detectan:

```
┌─────────────────────────────────────────────────────────────────┐
│ Contenido del Archivo (primeras 50 líneas)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ROTATIVO;06/10/2025-04:43:29;DOBACK028;Sesión:1                │
│ Fecha-Hora;Estado                                               │
│                                                                  │
│ 06/10/2025-04:43:29;0  ─┐                                       │
│ 06/10/2025-04:43:44;0   │                                       │
│ 06/10/2025-04:43:59;0   │                                       │
│ 06/10/2025-04:44:14;0   │                                       │
│ 06/10/2025-04:44:29;1   ├─ SESIÓN #1                            │
│ 06/10/2025-04:44:44;1   │  Inicio: 04:43:29                    │
│ 06/10/2025-04:44:59;1   │  Fin: 05:25:45                       │
│ 06/10/2025-04:45:14;1   │  Duración: 42 min                    │
│ ...                     │  Mediciones: 169                     │
│ 06/10/2025-05:25:30;1   │                                       │
│ 06/10/2025-05:25:45;0  ─┘                                       │
│                                                                  │
│         [GAP: 7 minutos sin mediciones]                         │
│                                                                  │
│ 06/10/2025-05:33:01;1  ─┐                                       │
│ 06/10/2025-05:33:16;1   ├─ SESIÓN #2                            │
│ 06/10/2025-05:33:31;1   │  Inicio: 05:33:01                    │
│ ...                     │  Fin: 05:48:16                       │
│ 06/10/2025-05:48:16;0  ─┘  Duración: 15 min                    │
│                            Mediciones: 62                       │
│                                                                  │
│         [GAP: 8 minutos]                                        │
│                                                                  │
│ 06/10/2025-05:56:30;1  ─┐                                       │
│ 06/10/2025-05:56:45;1   ├─ SESIÓN #3                            │
│ ...                     │  Inicio: 05:56:30                    │
│ 06/10/2025-06:10:15;0  ─┘  Duración: 14 min                    │
│                                                                  │
│ ... (59 sesiones más de la misma forma)                        │
│                                                                  │
│ 06/10/2025-23:45:00;1  ─┐                                       │
│ 06/10/2025-23:45:15;1   ├─ SESIÓN #62 (última)                  │
│ ...                     │  Inicio: 23:45:00                    │
│ 06/10/2025-23:59:00;0  ─┘  Fin: 23:59:00                       │
│                            Duración: 14 min                     │
└─────────────────────────────────────────────────────────────────┘

📊 RESULTADO:
   62 sesiones detectadas en este archivo
   Total mediciones: ~721
   Promedio por sesión: 11.6 mediciones
   Duración total actividad: ~6 horas (repartidas en 62 salidas)
```

---

## 📈 CORRELACIÓN ENTRE TIPOS

### **Mismo Día, Diferentes Números de Sesiones**

```
DOBACK028 06/10/2025:

┌────────────────┬──────────┬────────────────────────┐
│ Tipo Archivo   │ Sesiones │ Explicación            │
├────────────────┼──────────┼────────────────────────┤
│ ESTABILIDAD    │    52    │ Gaps detectados: 52    │
│ GPS            │     2    │ Gaps detectados: 2     │
│ ROTATIVO       │    62    │ Gaps detectados: 62    │
└────────────────┴──────────┴────────────────────────┘

Sistema toma: MAX(52, 2, 62) = 62 sesiones

¿Por qué números diferentes?
- ROTATIVO: Registra cada 15s → Detecta gaps pequeños → 62 sesiones
- ESTABILIDAD: Registra a 10 Hz → Detecta la mayoría → 52 sesiones
- GPS: Pierde señal frecuentemente → Solo detecta gaps grandes → 2 sesiones
```

### **Cómo el Sistema Correlaciona:**

```
Para Sesión #15 (creada en BD):
- Timestamp inicio: 10:15:30
- Timestamp fin: 10:16:45

1. Buscar GPS entre 10:15:30 y 10:16:45
   → Encontrados: 75 puntos GPS
   
2. Buscar ESTABILIDAD entre 10:15:30 y 10:16:45
   → Encontradas: 750 mediciones (10 Hz * 75 seg)
   
3. Buscar ROTATIVO entre 10:15:30 y 10:16:45
   → Encontradas: 5 mediciones (cada 15 seg)

Resultado en BD:
- Session: 1 registro
- GpsMeasurement: 75 registros
- StabilityMeasurement: 750 registros
- RotativoMeasurement: 5 registros
```

---

## 🔢 EJEMPLOS VISUALES DE CASOS REALES

### **CASO 1: Sesión Normal (GPS Bueno)**

```
DOBACK024 08/10/2025 - Sesión #3

ROTATIVO (cada 15s):
├─ 08:15:30 OFF  ─┐
├─ 08:15:45 OFF   │
├─ 08:16:00 ON    ├─ 12 minutos
├─ 08:16:15 ON    │  de actividad
├─ ...            │
└─ 08:27:30 OFF  ─┘

GPS (cada 1s):
├─ 08:15:30 40.5565, -3.6031  ─┐
├─ 08:15:31 40.5566, -3.6032   │
├─ 08:15:32 40.5567, -3.6033   ├─ 720 puntos GPS
├─ ...                         │  (12 min * 60 seg)
└─ 08:27:30 40.5680, -3.6145  ─┘

ESTABILIDAD (cada 0.1s):
├─ 08:15:30.0 ax:-18, ay:-38, si:0.89  ─┐
├─ 08:15:30.1 ax:-17, ay:-39, si:0.89   │
├─ 08:15:30.2 ax:-16, ay:-40, si:0.89   ├─ 7,200 mediciones
├─ ...                                  │  (12 min * 60 * 10)
└─ 08:27:30.0 ax:-15, ay:-41, si:0.88  ─┘

RESULTADO EN BD:
Session #1 (08:15:30 - 08:27:30):
├─ GpsMeasurement: 720 registros ✅
├─ StabilityMeasurement: 7,200 registros ✅
├─ RotativoMeasurement: 48 registros ✅
└─ DataQualityMetrics: 100% GPS válido ✅
```

---

### **CASO 2: Sesión Sin GPS (GPS 0%)**

```
DOBACK026 26/09/2025 - Sesión #5

ROTATIVO (cada 15s):
├─ 14:30:00 OFF  ─┐
├─ 14:30:15 OFF   │
├─ 14:30:30 ON    ├─ 8 minutos
├─ ...            │
└─ 14:38:00 OFF  ─┘

GPS (cada 1s):
├─ sin datos GPS   ← Sin señal
├─ sin datos GPS
├─ sin datos GPS
└─ ... (todas las líneas)

ESTABILIDAD (cada 0.1s):
├─ 14:30:00.0 ax:-20, ay:-40, si:0.88  ─┐
├─ 14:30:00.1 ax:-19, ay:-41, si:0.88   ├─ 4,800 mediciones
├─ ...                                  │  (8 min * 60 * 10)
└─ 14:38:00.0 ax:-18, ay:-42, si:0.87  ─┘

RESULTADO EN BD:
Session #5 (14:30:00 - 14:38:00):
├─ GpsMeasurement: 0 registros ❌ (sin GPS)
├─ StabilityMeasurement: 4,800 registros ✅
├─ RotativoMeasurement: 32 registros ✅
└─ DataQualityMetrics: 0% GPS válido ⚠️

Implicaciones:
- KPI "Horas conducción": ✅ Funciona (usa ROTATIVO)
- KPI "Kilómetros": ❌ Será 0 (necesita GPS)
- KPI "Incidencias": ✅ Funciona (usa ESTABILIDAD)
- Claves operacionales: ❌ No funciona (necesita GPS)
```

---

### **CASO 3: Día con 62 Sesiones (Extremo)**

```
DOBACK028 06/10/2025 - DÍA COMPLETO

Línea temporal del día:
06:15  S1  ─┐ ┌─ S2 ─┐ ┌─ S3  ┌S4┐     ┌─ S5 ─┐
06:30      ─┘ └──────┘ └─────┘   └─────┘       └─ ...
            GAP  GAP     GAP      GAP    GAP

... (sesiones 6-61)

23:45 ┌─ S62 ─┐
23:59 └────────┘

Estadísticas del día:
- Total sesiones: 62
- Sesiones cortas (< 5 min): 45
- Sesiones medias (5-15 min): 14
- Sesiones largas (> 15 min): 3
- Total tiempo activo: ~6 horas
- Total gaps: ~18 horas

Interpretación:
→ Día de entrenamiento/práctica
→ Muchas salidas cortas
→ Pausas frecuentes
→ Actividad distribuida todo el día
```

---

## 🔍 DETECCIÓN PASO A PASO

### **Algoritmo Visual:**

```
Leer archivo: ROTATIVO_DOBACK028_20251006.txt

Línea 1: ROTATIVO;06/10/2025-04:43:29;DOBACK028;Sesión:1
         └─ Extraer fecha base: 06/10/2025

Línea 2: Fecha-Hora;Estado
         └─ Cabecera (ignorar)

Línea 3: 06/10/2025-04:43:29;0
         └─ Timestamp: 04:43:29
         └─ Sesión actual: #1
         └─ Añadir a sesión #1

Línea 4: 06/10/2025-04:43:44;0
         └─ Timestamp: 04:43:44
         └─ Gap: 15 segundos (< 5 min)
         └─ Continuar sesión #1

... (165 líneas más)

Línea 169: 06/10/2025-05:25:45;0
           └─ Timestamp: 05:25:45
           └─ Gap: 15 segundos
           └─ Última medición de sesión #1
           └─ GUARDAR SESIÓN #1 (04:43:29 - 05:25:45)

Línea 170: 06/10/2025-05:33:01;1
           └─ Timestamp: 05:33:01
           └─ Gap: 7 minutos 16 segundos (> 5 min) ← NUEVA SESIÓN
           └─ Sesión actual: #2
           └─ Añadir a sesión #2

... (continuar hasta línea 721)

RESULTADO FINAL:
✅ 62 sesiones detectadas
✅ Cada una con su rango temporal
✅ Listas para guardar en BD
```

---

## 📊 TABLA COMPARATIVA DE FRECUENCIAS

```
┌──────────────┬────────────┬─────────────┬──────────────────┐
│ Tipo         │ Frecuencia │ Datos/Min   │ Uso Principal    │
├──────────────┼────────────┼─────────────┼──────────────────┤
│ ROTATIVO     │ ~15 seg    │ 4           │ Claves operac.   │
│ GPS          │ ~1 seg     │ 60          │ Ruta/kilómetros  │
│ ESTABILIDAD  │ 10 Hz      │ 600         │ Eventos/índice   │
└──────────────┴────────────┴─────────────┴──────────────────┘

Para una sesión de 10 minutos:
- ROTATIVO: ~40 mediciones
- GPS: ~600 mediciones (si hay señal)
- ESTABILIDAD: ~6,000 mediciones
```

---

## 🎯 FLUJO COMPLETO DE PROCESAMIENTO

```
┌──────────────────────────────────────────────────────────────┐
│ PASO 1: LECTURA DE ARCHIVOS                                  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Sistema lee 3 archivos del mismo vehículo y fecha:           │
│                                                               │
│ ┌────────────────────────────────────────────────┐           │
│ │ ROTATIVO_DOBACK028_20251006.txt                │           │
│ │ ├─ 721 líneas                                  │           │
│ │ ├─ Frecuencia: cada 15 segundos                │           │
│ │ └─ Detecta: 62 sesiones                        │           │
│ └────────────────────────────────────────────────┘           │
│                                                               │
│ ┌────────────────────────────────────────────────┐           │
│ │ GPS_DOBACK028_20251006.txt                     │           │
│ │ ├─ 7,556 líneas                                │           │
│ │ ├─ Frecuencia: cada 1 segundo                  │           │
│ │ ├─ 98% válido, 2% "sin datos GPS"             │           │
│ │ └─ Detecta: 2 sesiones                         │           │
│ └────────────────────────────────────────────────┘           │
│                                                               │
│ ┌────────────────────────────────────────────────┐           │
│ │ ESTABILIDAD_DOBACK028_20251006.txt             │           │
│ │ ├─ 85,880 líneas                               │           │
│ │ ├─ Frecuencia: 10 Hz (10 mediciones/segundo)   │           │
│ │ └─ Detecta: 52 sesiones                        │           │
│ └────────────────────────────────────────────────┘           │
│                                                               │
└──────────────────────────────────────────────────────────────┘

                            ↓

┌──────────────────────────────────────────────────────────────┐
│ PASO 2: DETERMINACIÓN DE NÚMERO DE SESIONES                  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Sistema toma el MÁXIMO:                                      │
│                                                               │
│ numSesiones = Math.max(                                      │
│     sesionesRotativo.length,    // 62                       │
│     sesionesGPS.length,          // 2                        │
│     sesionesEstabilidad.length   // 52                       │
│ )                                                             │
│                                                               │
│ Resultado: 62 sesiones a crear                               │
│                                                               │
└──────────────────────────────────────────────────────────────┘

                            ↓

┌──────────────────────────────────────────────────────────────┐
│ PASO 3: CORRELACIÓN TEMPORAL (Para cada sesión)              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Para Sesión #1:                                              │
│ ┌─────────────────────────────────────────────┐              │
│ │ ROTATIVO: Sesión #1 (04:43:29 - 05:25:45)  │              │
│ │ ├─ startTime: 04:43:29                      │              │
│ │ └─ endTime: 05:25:45                        │              │
│ └─────────────────────────────────────────────┘              │
│                                                               │
│ Buscar GPS en ese rango temporal:                            │
│ ├─ GPS entre 04:43:29 y 05:25:45                            │
│ └─ Encontrados: 2,536 puntos                                 │
│                                                               │
│ Buscar ESTABILIDAD en ese rango:                             │
│ ├─ ESTABILIDAD entre 04:43:29 y 05:25:45                    │
│ └─ Encontradas: 25,360 mediciones                            │
│                                                               │
│ Crear Sesión en BD:                                          │
│ ├─ Session: 1 registro                                       │
│ ├─ GpsMeasurement: 2,536 registros                          │
│ ├─ StabilityMeasurement: 25,360 registros                   │
│ └─ RotativoMeasurement: 169 registros                        │
│                                                               │
│ ... (repetir para sesiones 2-62)                             │
│                                                               │
└──────────────────────────────────────────────────────────────┘

                            ↓

┌──────────────────────────────────────────────────────────────┐
│ PASO 4: GUARDAR EN BD                                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Para cada sesión:                                            │
│ 1. Verificar si ya existe (vehicleId + startTime + number)   │
│    │                                                          │
│    ├─ SI existe → OMITIR (return { created: false })         │
│    │   └─ Incrementar totalSkipped                           │
│    │                                                          │
│    └─ NO existe → CREAR                                      │
│        ├─ Crear Session                                      │
│        ├─ Guardar GPS (lotes de 1000)                        │
│        ├─ Guardar Estabilidad (lotes de 1000)                │
│        ├─ Guardar Rotativo                                   │
│        ├─ Guardar DataQualityMetrics                         │
│        ├─ Incrementar totalSaved                             │
│        └─ return { created: true }                           │
│                                                               │
│ TOTALES FINALES:                                             │
│ - totalSaved: 678 sesiones (nuevas)                          │
│ - totalSkipped: 161 sesiones (duplicadas)                    │
│ - Total procesadas: 839 sesiones                             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 📋 RESUMEN DE TUS 5 VEHÍCULOS

```
┌────────────┬─────────┬─────────┬──────────┬─────────────┐
│ Vehículo   │ Archivos│ Sesiones│ GPS Prom │ Días        │
├────────────┼─────────┼─────────┼──────────┼─────────────┤
│ DOBACK023  │    6    │   ~20   │   87%✅  │ 2 días      │
│ DOBACK024  │   28    │  ~137   │   78%✅  │ 10 días     │
│ DOBACK026  │    2    │    ~7   │    0%❌  │ 1 día       │
│ DOBACK027  │   30    │  ~193   │   70%⚠️  │ 10 días     │
│ DOBACK028  │   27    │  ~478   │   73%⚠️  │ 9 días      │
├────────────┼─────────┼─────────┼──────────┼─────────────┤
│ TOTAL      │   93    │  ~835   │   72%    │ 14 días     │
└────────────┴─────────┴─────────┴──────────┴─────────────┘

Interpretación de tus 678 creadas + 161 omitidas:
- 678: Sesiones nuevas que no estaban en BD
- 161: Sesiones que YA estaban (de procesamiento anterior)
- Total archivos procesados: ~835 sesiones posibles
```

---

## ✅ AHORA ENTIENDES

**Generación de sesiones:**
1. ✅ Se detectan automáticamente por gaps de tiempo
2. ✅ 1 archivo puede tener 1-62 sesiones
3. ✅ Sesiones se correlacionan por tiempo (no por índice)
4. ✅ Sistema toma el máximo de sesiones entre los 3 tipos
5. ✅ Sesiones duplicadas se omiten automáticamente

**Razones de omisión:**
- ⚠️ "Sesión duplicada" = Ya existía en BD (mismo vehículo+fecha+número)
- 💡 Normal si reprocesas sin limpiar BD
- 💡 Solución: Limpiar BD antes de procesar

**Información en reporte detallado:**
- ✅ Cada sesión muestra: ID, inicio, fin, mediciones
- ✅ Estado: CREADA o OMITIDA
- ✅ Razón: "Nueva" o "Duplicada"
- ✅ Navegable por vehículo y archivo

---

**📚 Referencias:**
- Análisis completo: `resumendoback/`
- Sistema upload: `docs/SISTEMA_UPLOAD_COMPLETO.md`

**Última actualización:** 2025-10-11 20:45

