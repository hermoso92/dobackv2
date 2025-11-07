# 🔍 AUDITORÍA: CÁLCULO DE EVENTOS DE ESTABILIDAD

**Proyecto:** DobackSoft StabilSafe V3  
**Fecha:** 3 de Noviembre de 2025  
**Versión:** 2.0 - ESPECIFICACIÓN NUEVA  
**Auditor:** Sistema de Análisis Automático

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Comparación: Sistema Actual vs. Nueva Especificación](#comparación-sistema-actual-vs-nueva-especificación)
3. [Nueva Especificación de Eventos](#nueva-especificación-de-eventos)
4. [Origen del Índice de Estabilidad (SI)](#origen-del-índice-de-estabilidad-si)
5. [Sistema Actual de Detección](#sistema-actual-de-detección)
6. [Plan de Migración](#plan-de-migración)
7. [Implementación Técnica Recomendada](#implementación-técnica-recomendada)
8. [Hallazgos y Recomendaciones](#hallazgos-y-recomendaciones)

---

## 1. RESUMEN EJECUTIVO

### 🔄 CAMBIO ESTRATÉGICO EN DETECCIÓN DE EVENTOS

Se ha definido una **nueva especificación** para eventos de estabilidad basada en **fenómenos físicos específicos** en lugar del índice SI general.

### Transición de Sistemas

| Aspecto | Sistema Actual | Nueva Especificación |
|---------|----------------|---------------------|
| **Número de eventos** | 8 tipos | **3 tipos** |
| **Base de detección** | SI < 0.50 (índice compuesto) | **Umbrales físicos directos** |
| **Ventana de análisis** | Medición individual | **Ventana temporal** |
| **Severidad** | Por SI (0.20, 0.35, 0.50) | **Por umbrales específicos** |
| **Complejidad** | Alta (múltiples detectores) | **Media (3 detectores claros)** |
| **Precisión física** | Indirecta (vía SI) | **Directa (parámetros físicos)** |

### Estado de Implementación

```
📊 SITUACIÓN ACTUAL
✅ Sistema actual: 8 eventos implementados (funcionando)
🔄 Nueva especificación: 3 eventos definidos (pendiente implementación)
⚠️  Migración: Requiere refactorización completa de detectores
```

---

## 2. COMPARACIÓN: SISTEMA ACTUAL VS. NUEVA ESPECIFICACIÓN

### 2.1. Sistema Actual (8 Eventos)

#### Basado en SI + Parámetros Secundarios

```typescript
// Lógica general actual
if (si < 0.50) {
    // Clasificar severidad por SI
    if (si < 0.20) → GRAVE
    else if (si < 0.35) → MODERADA
    else → LEVE
    
    // Luego añadir tipo específico por condiciones adicionales
}
```

**Eventos actuales:**
1. RIESGO_VUELCO (SI < 0.50)
2. VUELCO_INMINENTE (SI < 0.10 + roll > 10° o gx > 30°/s)
3. DERIVA_PELIGROSA (|gx| > 45°/s)
4. DERIVA_LATERAL_SIGNIFICATIVA (Δ yaw_rate > 0.15)
5. MANIOBRA_BRUSCA (Δgx > 100°/s² o |ay| > 3m/s²)
6. CAMBIO_CARGA (Δroll > 10% + ΔSI > 10%)
7. ZONA_INESTABLE (variaciones rápidas gz + picos gx)
8. CURVA_ESTABLE (informativo, no se guarda)

**Problemas identificados:**
- ❌ **Dependencia excesiva del SI** (que no controlamos)
- ❌ **Demasiados tipos de eventos** (8 es complejo de gestionar)
- ❌ **Umbrales dispersos** (45°/s, 100°/s², 3m/s², etc.)
- ❌ **No diferencia entre estático y dinámico**
- ❌ **Severidad uniforme** por SI (no específica por evento)

### 2.2. Nueva Especificación (3 Eventos)

#### Basada en Fenómenos Físicos con Análisis de Ventana

```typescript
// Nueva lógica propuesta
analizar_ventana(duracion = 1s) {
    extraer_maximos_y_promedios();
    
    // 3 detectores independientes
    if (cumple_criterios_maniobra_brusca()) → MANIOBRA_BRUSCA
    if (cumple_criterios_inclinacion_excesiva()) → INCLINACION_LATERAL_EXCESIVA
    if (cumple_criterios_curva_velocidad()) → CURVA_VELOCIDAD_EXCESIVA
}
```

**Eventos nuevos:**
1. **MANIOBRA_BRUSCA** - Giro/volantazo (|gy| alto, roll bajo)
2. **INCLINACION_LATERAL_EXCESIVA** - Estático/cuasiestático (roll alto, dinámica baja)
3. **CURVA_VELOCIDAD_EXCESIVA** - Dinámico (ay alto, roll moderado)

**Ventajas:**
- ✅ **Basados en física del vehículo** (no en SI opaco)
- ✅ **Separación clara** entre estático vs. dinámico
- ✅ **Umbrales calibrados** físicamente
- ✅ **Análisis de ventana** (más robusto que medición individual)
- ✅ **Severidad por umbral específico** de cada evento

---

## 3. NUEVA ESPECIFICACIÓN DE EVENTOS

### 3.1. EVENTO 1: MANIOBRA BRUSCA (Giro/Volantazo)

#### 📐 Fenómeno Físico

**Descripción:** Picos altos de velocidad angular de roll (gy) con ángulo de inclinación aún bajo. La carrocería todavía no ha desarrollado mucha inclinación, indicando un giro brusco o volantazo reciente.

**Interpretación:** El conductor realiza un cambio rápido de dirección (volantazo) que genera velocidad angular alta, pero el vehículo aún no ha inclinado significativamente porque el evento es muy reciente.

#### 🎯 Umbrales (por ventana de análisis)

```
┌─────────────────────────────────────────────────────┐
│  MANIOBRA_BRUSCA (Giro/Volantazo)                   │
├─────────────────────────────────────────────────────┤
│  Condiciones:                                       │
│  • |ω_roll|max = |gy|max > 15 °/s                  │
│  • |roll|max < 10 °                                │
│  • ay_g puede ser variable (no exige >0.3 g)       │
│                                                     │
│  Severidad:                                         │
│  • MODERADA: 15 °/s ≤ |gy|max < 25 °/s            │
│  • GRAVE:    |gy|max ≥ 25 °/s                     │
└─────────────────────────────────────────────────────┘
```

#### 💻 Pseudocódigo de Implementación

```typescript
function detectarManiobraBrusca(ventana: Medicion[]): EventoDetectado | null {
    // 1. Extraer máximos de la ventana
    const gy_max = Math.max(...ventana.map(m => Math.abs(m.gy)));
    const roll_max = Math.max(...ventana.map(m => Math.abs(m.roll)));
    
    // 2. Verificar condiciones
    if (gy_max > 15 && roll_max < 10) {
        // 3. Clasificar severidad
        const severidad = gy_max >= 25 ? 'GRAVE' : 'MODERADA';
        
        return {
            tipo: 'MANIOBRA_BRUSCA',
            severidad,
            timestamp: ventana[ventana.length - 1].timestamp,
            valores: {
                gy_max,
                roll_max,
                ay_g: calcularAyG(ventana)
            },
            descripcion: `Giro/volantazo brusco: ωroll=${gy_max.toFixed(1)}°/s, roll=${roll_max.toFixed(1)}°`
        };
    }
    
    return null;
}
```

#### 📊 Casos de Uso

| Escenario | gy_max | roll_max | Resultado |
|-----------|--------|----------|-----------|
| Volantazo para esquivar | 28°/s | 6° | 🔴 GRAVE |
| Corrección brusca trayectoria | 18°/s | 8° | 🟠 MODERADA |
| Giro normal | 12°/s | 15° | ⚪ Sin evento |
| Curva cerrada controlada | 8°/s | 18° | ⚪ Sin evento |

---

### 3.2. EVENTO 2: INCLINACIÓN LATERAL EXCESIVA

#### 📐 Fenómeno Físico

**Descripción:** Ángulo de roll grande sostenido con dinámica suave (poca aceleración lateral y poca velocidad angular). Indica inclinación **estática o cuasiestática**.

**Interpretación:** El vehículo está inclinado lateralmente por:
- Pendiente lateral del terreno
- Distribución asimétrica de carga
- Apoyo prolongado en una superficie inclinada
- **NO** es un evento dinámico de conducción

#### 🎯 Umbrales (por ventana de análisis)

```
┌─────────────────────────────────────────────────────┐
│  INCLINACION_LATERAL_EXCESIVA (Estático)            │
├─────────────────────────────────────────────────────┤
│  Condiciones:                                       │
│  • |roll|max > 20 °                                │
│  • ay_g < 0.10 g (baja aceleración lateral)        │
│  • |gy|max < 3 °/s (baja velocidad angular)        │
│                                                     │
│  Severidad:                                         │
│  • MODERADA: 20° < |roll|max < 30°                 │
│  • CRÍTICA:  |roll|max ≥ 30°                       │
│                                                     │
│  Nota: Etiqueta "estático/cuasiestático"           │
└─────────────────────────────────────────────────────┘
```

#### 💻 Pseudocódigo de Implementación

```typescript
function detectarInclinacionExcesiva(ventana: Medicion[]): EventoDetectado | null {
    // 1. Extraer máximos y promedios
    const roll_max = Math.max(...ventana.map(m => Math.abs(m.roll)));
    const gy_max = Math.max(...ventana.map(m => Math.abs(m.gy)));
    const ay_g_promedio = calcularAyGPromedio(ventana);
    
    // 2. Verificar condiciones
    if (roll_max > 20 && ay_g_promedio < 0.10 && gy_max < 3) {
        // 3. Clasificar severidad
        const severidad = roll_max >= 30 ? 'CRITICA' : 'MODERADA';
        
        return {
            tipo: 'INCLINACION_LATERAL_EXCESIVA',
            severidad,
            subtipo: 'ESTATICO',
            timestamp: ventana[ventana.length - 1].timestamp,
            valores: {
                roll_max,
                ay_g: ay_g_promedio,
                gy_max
            },
            descripcion: `Inclinación lateral excesiva (estático): roll=${roll_max.toFixed(1)}°, ay=${(ay_g_promedio*9.81).toFixed(2)}m/s²`
        };
    }
    
    return null;
}
```

#### 📊 Casos de Uso

| Escenario | roll_max | ay_g | gy_max | Resultado |
|-----------|----------|------|--------|-----------|
| Pendiente lateral 35° | 35° | 0.05g | 1°/s | 🔴 CRÍTICA |
| Carga desbalanceada | 25° | 0.08g | 2°/s | 🟠 MODERADA |
| Apoyo en bordillo | 22° | 0.09g | 2.5°/s | 🟠 MODERADA |
| Terreno plano | 5° | 0.02g | 0.5°/s | ⚪ Sin evento |
| Curva normal | 18° | 0.35g | 8°/s | ⚪ Sin evento (dinámica alta) |

---

### 3.3. EVENTO 3: CURVA A VELOCIDAD EXCESIVA

#### 📐 Fenómeno Físico

**Descripción:** Aceleración lateral alta sostenida con ángulo de roll moderado y velocidad angular baja. El **momento de vuelco por ay** supera al momento de restitución antes de que el roll sea muy grande.

**Interpretación:** El vehículo toma una curva a velocidad excesiva para el radio de giro. La fuerza centrífuga (ay) es alta pero el vehículo aún no se ha inclinado mucho porque la curva es relativamente suave (no hay cambios bruscos de dirección).

#### 🎯 Umbrales (por ventana de análisis)

```
┌─────────────────────────────────────────────────────┐
│  CURVA_VELOCIDAD_EXCESIVA (Dinámico)                │
├─────────────────────────────────────────────────────┤
│  Condiciones:                                       │
│  • ay_g_max > 0.30 g (0.35-0.40 g si más estricto) │
│  • |roll|max < 20 °                                │
│  • |gy|max < 10 °/s                                │
│  • Sostenido ≥ 0.30 s (para mayor robustez)        │
│                                                     │
│  Severidad:                                         │
│  • MODERADA: 0.30g ≤ ay_g_max < 0.40g              │
│  • GRAVE:    ay_g_max ≥ 0.40g                      │
│                                                     │
│  Nota: Requiere análisis de duración sostenida     │
└─────────────────────────────────────────────────────┘
```

#### 💻 Pseudocódigo de Implementación

```typescript
function detectarCurvaVelocidadExcesiva(ventana: Medicion[]): EventoDetectado | null {
    // 1. Extraer máximos
    const ay_g_max = Math.max(...ventana.map(m => Math.abs(m.ay) / 9.81));
    const roll_max = Math.max(...ventana.map(m => Math.abs(m.roll)));
    const gy_max = Math.max(...ventana.map(m => Math.abs(m.gy)));
    
    // 2. Verificar duración sostenida (ay > 0.30g por al menos 0.3s)
    const duracionSostenida = calcularDuracionSostenida(
        ventana, 
        (m) => Math.abs(m.ay) / 9.81 > 0.30
    );
    
    // 3. Verificar todas las condiciones
    if (ay_g_max > 0.30 && roll_max < 20 && gy_max < 10 && duracionSostenida >= 0.30) {
        // 4. Clasificar severidad
        const severidad = ay_g_max >= 0.40 ? 'GRAVE' : 'MODERADA';
        
        return {
            tipo: 'CURVA_VELOCIDAD_EXCESIVA',
            severidad,
            subtipo: 'DINAMICO',
            timestamp: ventana[ventana.length - 1].timestamp,
            valores: {
                ay_g_max,
                roll_max,
                gy_max,
                duracion: duracionSostenida
            },
            descripcion: `Curva a velocidad excesiva: ay=${(ay_g_max).toFixed(2)}g, roll=${roll_max.toFixed(1)}°, duración=${(duracionSostenida*1000).toFixed(0)}ms`
        };
    }
    
    return null;
}

function calcularDuracionSostenida(
    ventana: Medicion[], 
    condicion: (m: Medicion) => boolean
): number {
    let duracion = 0;
    let ultimoTimestamp = null;
    
    for (const medicion of ventana) {
        if (condicion(medicion)) {
            if (ultimoTimestamp) {
                duracion += (medicion.timestamp.getTime() - ultimoTimestamp) / 1000;
            }
            ultimoTimestamp = medicion.timestamp.getTime();
        } else {
            ultimoTimestamp = null;
        }
    }
    
    return duracion;
}
```

#### 📊 Casos de Uso

| Escenario | ay_g_max | roll_max | gy_max | Duración | Resultado |
|-----------|----------|----------|--------|----------|-----------|
| Curva autovía 110km/h | 0.45g | 15° | 6°/s | 1.2s | 🔴 GRAVE |
| Rotonda rápida | 0.35g | 18° | 8°/s | 0.8s | 🟠 MODERADA |
| Curva cerrada controlada | 0.38g | 22° | 12°/s | 0.6s | ⚪ Sin evento (roll>20°) |
| Curva normal | 0.25g | 12° | 5°/s | 1.0s | ⚪ Sin evento (ay<0.30g) |
| Volantazo puntual | 0.42g | 8° | 15°/s | 0.1s | ⚪ Sin evento (no sostenido) |

---

## 4. ORIGEN DEL ÍNDICE DE ESTABILIDAD (SI)

### 🔍 HALLAZGO CRÍTICO: SI NO SE CALCULA EN BACKEND

El **Stability Index (SI)** **NO se calcula** en el backend de DobackSoft. Este valor **viene pre-calculado** en el archivo de datos de estabilidad (posición 15 del CSV).

#### Formato del Archivo de Estabilidad

```
POSICIÓN | CAMPO      | UNIDAD | DESCRIPCIÓN
---------|------------|--------|------------------
0        | ax         | m/s²   | Aceleración X
1        | ay         | m/s²   | Aceleración Y (lateral)
2        | az         | m/s²   | Aceleración Z (vertical)
3        | gx         | °/s    | Velocidad angular X (roll) ⚠️ NOTA: puede ser gx
4        | gy         | °/s    | Velocidad angular Y (pitch) ⚠️ NOTA: puede ser gy (roll rate)
5        | gz         | °/s    | Velocidad angular Z (yaw)
6        | roll       | °      | Ángulo de balanceo lateral
7        | pitch      | °      | Ángulo de cabeceo longitudinal
8        | yaw        | °      | Ángulo de guiñada (dirección)
9        | timeantwifi| ms     | Tiempo anterior WiFi
10-14    | usciclo1-5 | μs     | Tiempos de ciclo
15       | SI         | [0,1]  | ⚠️ ÍNDICE DE ESTABILIDAD (PRE-CALCULADO)
16       | accmag     | m/s²   | Magnitud de aceleración
17       | microsds   | μs     | Microsegundos SD
18       | k3         | -      | Clave operacional
```

### ⚠️ IMPORTANTE: Notación de Velocidades Angulares

**VERIFICAR EN DATOS REALES:**
- En el código actual se usa `gy` como velocidad angular de roll (ω_roll)
- En física estándar: `gx` = ω_roll, `gy` = ω_pitch, `gz` = ω_yaw
- **Acción requerida:** Confirmar qué convención usa el hardware embebido

### 📋 RECOMENDACIÓN: SI YA NO ES CRÍTICO

Con la nueva especificación de eventos, el **SI deja de ser fundamental** para la detección. Sin embargo, sigue siendo útil como:
1. **KPI general de sesión** (promedio de estabilidad)
2. **Métrica complementaria** en análisis
3. **Visualización histórica**

---

## 5. SISTEMA ACTUAL DE DETECCIÓN

### Archivo Principal: `eventDetector.ts`

**Ubicación:** `backend/src/services/eventDetector.ts`  
**Líneas de código:** 800+  
**Estado:** ✅ Funcional pero **obsoleto** con nueva especificación

### Función Principal Actual

```typescript
export async function detectarEventosSesion(sessionId: string): Promise<EventoDetectado[]>
```

**Proceso actual:**
1. Cargar mediciones de estabilidad
2. Iterar secuencialmente con buffer de 5 mediciones
3. Aplicar 8 detectores basados en SI < 0.50
4. Clasificar severidad por SI (0.20, 0.35, 0.50)
5. Correlacionar con GPS y rotativo
6. Deduplicar en ventana de 3s
7. Persistir en `stability_events`

### ⚠️ Cambios Necesarios

| Aspecto | Sistema Actual | Nuevo Requerimiento |
|---------|----------------|---------------------|
| **Detectores** | 8 funciones | 3 funciones nuevas |
| **Ventana de análisis** | 5 mediciones fijas | Variable (≥1s de datos) |
| **Clasificación severidad** | Por SI uniforme | Por umbrales específicos |
| **Análisis temporal** | Medición individual | Duración sostenida |
| **Cálculo ay_g** | Directo de ay | ay / 9.81 |

---

## 6. PLAN DE MIGRACIÓN

### Fase 1: PREPARACIÓN (1 semana)

#### 1.1. Validación de Datos

```typescript
// Script de validación: scripts/analisis/validar-datos-eventos.ts

async function validarDatosParaNuevosEventos() {
    // 1. Verificar convención de ejes (gx vs gy para roll rate)
    const samples = await prisma.stabilityMeasurement.findMany({
        take: 1000,
        select: { gx: true, gy: true, gz: true, roll: true, pitch: true, yaw: true }
    });
    
    // Analizar correlación entre gy y cambios en roll
    const correlacion_gy_roll = calcularCorrelacion(
        samples.map(s => s.gy),
        calcularDerivada(samples.map(s => s.roll))
    );
    
    logger.info(`Correlación gy-Δroll: ${correlacion_gy_roll}`);
    // Si correlación > 0.8 → gy es roll rate ✅
    // Si correlación < 0.3 → verificar gx
    
    // 2. Verificar rangos de valores
    const stats = {
        gy_max: Math.max(...samples.map(s => Math.abs(s.gy))),
        roll_max: Math.max(...samples.map(s => Math.abs(s.roll))),
        ay_max: Math.max(...samples.map(s => Math.abs(s.ay)))
    };
    
    logger.info('Estadísticas:', stats);
    
    // 3. Verificar frecuencia de muestreo
    const frecuencia = calcularFrecuenciaMuestreo(samples);
    logger.info(`Frecuencia de muestreo: ${frecuencia} Hz`);
    // Necesario para calcular tamaño de ventana
}
```

#### 1.2. Determinar Tamaño de Ventana

```typescript
// Basado en frecuencia de muestreo
const FRECUENCIA_MUESTREO = 10; // Hz (verificar con datos reales)
const DURACION_VENTANA = 1.0; // segundos
const TAMAÑO_VENTANA = FRECUENCIA_MUESTREO * DURACION_VENTANA; // 10 mediciones

// Para evento 3 (curva velocidad excesiva)
const DURACION_SOSTENIDA_MIN = 0.3; // segundos
const MEDICIONES_SOSTENIDAS_MIN = Math.ceil(FRECUENCIA_MUESTREO * DURACION_SOSTENIDA_MIN); // 3
```

---

### Fase 2: IMPLEMENTACIÓN (2 semanas)

#### 2.1. Crear Nuevo Detector

**Archivo:** `backend/src/services/eventDetectorV2.ts`

```typescript
/**
 * 🚨 DETECTOR DE EVENTOS V2 - ESPECIFICACIÓN FÍSICA
 * Basado en análisis de ventanas temporales y umbrales físicos específicos
 */

import { prisma } from '../config/prisma';
import { createLogger } from '../utils/logger';

const logger = createLogger('EventDetectorV2');

// ============================================================================
// CONFIGURACIÓN Y UMBRALES
// ============================================================================

const CONFIG = {
    // Tamaño de ventana (ajustar según frecuencia de muestreo)
    VENTANA_DURACION_SEGUNDOS: 1.0,
    VENTANA_TAMAÑO_MEDICIONES: 10, // Ajustar según frecuencia real
    
    // Evento 1: Maniobra brusca
    MANIOBRA_BRUSCA: {
        gy_moderada: 15,    // °/s
        gy_grave: 25,       // °/s
        roll_max: 10        // °
    },
    
    // Evento 2: Inclinación lateral excesiva
    INCLINACION_EXCESIVA: {
        roll_moderada: 20,  // °
        roll_critica: 30,   // °
        ay_g_max: 0.10,     // g (baja aceleración)
        gy_max: 3           // °/s (baja velocidad angular)
    },
    
    // Evento 3: Curva velocidad excesiva
    CURVA_VELOCIDAD: {
        ay_g_moderada: 0.30,    // g
        ay_g_grave: 0.40,       // g
        roll_max: 20,           // °
        gy_max: 10,             // °/s
        duracion_sostenida: 0.3 // segundos
    }
};

const G = 9.81; // m/s²

// ============================================================================
// TIPOS
// ============================================================================

export type TipoEventoV2 =
    | 'MANIOBRA_BRUSCA'
    | 'INCLINACION_LATERAL_EXCESIVA'
    | 'CURVA_VELOCIDAD_EXCESIVA';

export type SeveridadV2 = 'MODERADA' | 'GRAVE' | 'CRITICA';

export interface MedicionEstabilidad {
    timestamp: Date;
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;  // ⚠️ VERIFICAR: puede ser roll rate (ω_roll)
    gz: number;
    roll: number;
    pitch: number;
    yaw: number;
}

export interface EventoDetectadoV2 {
    tipo: TipoEventoV2;
    severidad: SeveridadV2;
    subtipo?: 'ESTATICO' | 'DINAMICO';
    timestamp: Date;
    sessionId: string;
    valores: {
        gy_max?: number;
        roll_max?: number;
        ay_g_max?: number;
        ay_g_promedio?: number;
        duracion_sostenida?: number;
    };
    descripcion: string;
    // GPS se añadirá en correlación posterior
    lat?: number;
    lon?: number;
    speed?: number;
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Calcular aceleración lateral en g
 */
function calcularAyG(ay_ms2: number): number {
    return Math.abs(ay_ms2) / G;
}

/**
 * Calcular duración sostenida de una condición en ventana
 */
function calcularDuracionSostenida(
    ventana: MedicionEstabilidad[],
    condicion: (m: MedicionEstabilidad) => boolean
): number {
    let duracionTotal = 0;
    let ultimoTimestamp: number | null = null;
    
    for (const medicion of ventana) {
        if (condicion(medicion)) {
            if (ultimoTimestamp !== null) {
                const dt = (medicion.timestamp.getTime() - ultimoTimestamp) / 1000; // segundos
                duracionTotal += dt;
            }
            ultimoTimestamp = medicion.timestamp.getTime();
        } else {
            ultimoTimestamp = null;
        }
    }
    
    return duracionTotal;
}

// ============================================================================
// DETECTORES DE EVENTOS
// ============================================================================

/**
 * EVENTO 1: MANIOBRA_BRUSCA
 * Picos altos de ω_roll con ángulo roll bajo
 */
function detectarManiobraBrusca(ventana: MedicionEstabilidad[]): EventoDetectadoV2 | null {
    // Extraer máximos
    const gy_max = Math.max(...ventana.map(m => Math.abs(m.gy)));
    const roll_max = Math.max(...ventana.map(m => Math.abs(m.roll)));
    
    // Verificar condiciones
    if (gy_max > CONFIG.MANIOBRA_BRUSCA.gy_moderada && 
        roll_max < CONFIG.MANIOBRA_BRUSCA.roll_max) {
        
        // Clasificar severidad
        const severidad: SeveridadV2 = 
            gy_max >= CONFIG.MANIOBRA_BRUSCA.gy_grave ? 'GRAVE' : 'MODERADA';
        
        return {
            tipo: 'MANIOBRA_BRUSCA',
            severidad,
            timestamp: ventana[ventana.length - 1].timestamp,
            sessionId: '', // Se asignará después
            valores: {
                gy_max,
                roll_max
            },
            descripcion: `Maniobra brusca (giro/volantazo): ωroll=${gy_max.toFixed(1)}°/s, roll=${roll_max.toFixed(1)}°`
        };
    }
    
    return null;
}

/**
 * EVENTO 2: INCLINACION_LATERAL_EXCESIVA
 * Ángulo roll alto con dinámica suave (estático/cuasiestático)
 */
function detectarInclinacionExcesiva(ventana: MedicionEstabilidad[]): EventoDetectadoV2 | null {
    // Extraer máximos y promedios
    const roll_max = Math.max(...ventana.map(m => Math.abs(m.roll)));
    const gy_max = Math.max(...ventana.map(m => Math.abs(m.gy)));
    const ay_g_promedio = ventana.reduce((sum, m) => sum + calcularAyG(m.ay), 0) / ventana.length;
    
    // Verificar condiciones para evento estático/cuasiestático
    if (roll_max > CONFIG.INCLINACION_EXCESIVA.roll_moderada &&
        ay_g_promedio < CONFIG.INCLINACION_EXCESIVA.ay_g_max &&
        gy_max < CONFIG.INCLINACION_EXCESIVA.gy_max) {
        
        // Clasificar severidad
        const severidad: SeveridadV2 = 
            roll_max >= CONFIG.INCLINACION_EXCESIVA.roll_critica ? 'CRITICA' : 'MODERADA';
        
        return {
            tipo: 'INCLINACION_LATERAL_EXCESIVA',
            severidad,
            subtipo: 'ESTATICO',
            timestamp: ventana[ventana.length - 1].timestamp,
            sessionId: '',
            valores: {
                roll_max,
                ay_g_promedio,
                gy_max
            },
            descripcion: `Inclinación lateral excesiva (estático): roll=${roll_max.toFixed(1)}°, ay=${(ay_g_promedio).toFixed(2)}g`
        };
    }
    
    return null;
}

/**
 * EVENTO 3: CURVA_VELOCIDAD_EXCESIVA
 * Aceleración lateral alta sostenida con roll moderado (dinámico)
 */
function detectarCurvaVelocidadExcesiva(ventana: MedicionEstabilidad[]): EventoDetectadoV2 | null {
    // Extraer máximos
    const ay_g_max = Math.max(...ventana.map(m => calcularAyG(m.ay)));
    const roll_max = Math.max(...ventana.map(m => Math.abs(m.roll)));
    const gy_max = Math.max(...ventana.map(m => Math.abs(m.gy)));
    
    // Calcular duración sostenida de ay > 0.30g
    const duracion_sostenida = calcularDuracionSostenida(
        ventana,
        (m) => calcularAyG(m.ay) > CONFIG.CURVA_VELOCIDAD.ay_g_moderada
    );
    
    // Verificar todas las condiciones
    if (ay_g_max > CONFIG.CURVA_VELOCIDAD.ay_g_moderada &&
        roll_max < CONFIG.CURVA_VELOCIDAD.roll_max &&
        gy_max < CONFIG.CURVA_VELOCIDAD.gy_max &&
        duracion_sostenida >= CONFIG.CURVA_VELOCIDAD.duracion_sostenida) {
        
        // Clasificar severidad
        const severidad: SeveridadV2 = 
            ay_g_max >= CONFIG.CURVA_VELOCIDAD.ay_g_grave ? 'GRAVE' : 'MODERADA';
        
        return {
            tipo: 'CURVA_VELOCIDAD_EXCESIVA',
            severidad,
            subtipo: 'DINAMICO',
            timestamp: ventana[ventana.length - 1].timestamp,
            sessionId: '',
            valores: {
                ay_g_max,
                roll_max,
                gy_max,
                duracion_sostenida
            },
            descripcion: `Curva a velocidad excesiva: ay=${ay_g_max.toFixed(2)}g, roll=${roll_max.toFixed(1)}°, duración=${(duracion_sostenida*1000).toFixed(0)}ms`
        };
    }
    
    return null;
}

// ============================================================================
// DETECTOR PRINCIPAL
// ============================================================================

/**
 * Detecta eventos en una sesión usando análisis de ventanas
 */
export async function detectarEventosSesionV2(sessionId: string): Promise<EventoDetectadoV2[]> {
    try {
        logger.info(`Detectando eventos V2 para sesión ${sessionId}`);
        
        // 1. Cargar mediciones ordenadas por timestamp
        const mediciones = await prisma.stabilityMeasurement.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'asc' },
            select: {
                timestamp: true,
                ax: true,
                ay: true,
                az: true,
                gx: true,
                gy: true,
                gz: true,
                roll: true,
                pitch: true,
                yaw: true
            }
        });
        
        if (mediciones.length < CONFIG.VENTANA_TAMAÑO_MEDICIONES) {
            logger.warn(`Sesión ${sessionId} tiene pocas mediciones: ${mediciones.length}`);
            return [];
        }
        
        logger.info(`Analizando ${mediciones.length} mediciones`);
        
        // 2. Análisis por ventanas deslizantes
        const eventos: EventoDetectadoV2[] = [];
        const ventanaSize = CONFIG.VENTANA_TAMAÑO_MEDICIONES;
        
        for (let i = 0; i <= mediciones.length - ventanaSize; i++) {
            const ventana = mediciones.slice(i, i + ventanaSize);
            
            // Aplicar los 3 detectores
            const eventoManiobraBrusca = detectarManiobraBrusca(ventana);
            const eventoInclinacionExcesiva = detectarInclinacionExcesiva(ventana);
            const eventoCurvaVelocidad = detectarCurvaVelocidadExcesiva(ventana);
            
            // Añadir eventos detectados (pueden coexistir)
            if (eventoManiobraBrusca) {
                eventoManiobraBrusca.sessionId = sessionId;
                eventos.push(eventoManiobraBrusca);
            }
            
            if (eventoInclinacionExcesiva) {
                eventoInclinacionExcesiva.sessionId = sessionId;
                eventos.push(eventoInclinacionExcesiva);
            }
            
            if (eventoCurvaVelocidad) {
                eventoCurvaVelocidad.sessionId = sessionId;
                eventos.push(eventoCurvaVelocidad);
            }
        }
        
        logger.info(`Eventos detectados (antes de deduplicación): ${eventos.length}`);
        
        // 3. Deduplicar eventos muy cercanos (ventana de 3s)
        const eventosDedupe = deduplicarEventos(eventos, 3000);
        logger.info(`Eventos después de deduplicación: ${eventosDedupe.length}`);
        
        // 4. Correlacionar con GPS
        await correlacionarConGPS(eventosDedupe, sessionId);
        
        // 5. Filtrar eventos sin GPS
        const eventosConGPS = eventosDedupe.filter(e => e.lat && e.lon);
        logger.info(`Eventos con GPS: ${eventosConGPS.length}`);
        
        return eventosConGPS;
        
    } catch (error: any) {
        logger.error(`Error detectando eventos V2: ${error.message}`);
        throw error;
    }
}

/**
 * Deduplicar eventos del mismo tipo en ventana temporal
 */
function deduplicarEventos(eventos: EventoDetectadoV2[], ventanaMs: number): EventoDetectadoV2[] {
    const resultado: EventoDetectadoV2[] = [];
    const porTipo: Map<TipoEventoV2, EventoDetectadoV2 | null> = new Map();
    
    for (const evento of eventos) {
        const ultimo = porTipo.get(evento.tipo);
        
        if (!ultimo) {
            // Primer evento de este tipo
            porTipo.set(evento.tipo, evento);
            resultado.push(evento);
        } else {
            const dt = evento.timestamp.getTime() - ultimo.timestamp.getTime();
            
            if (dt > ventanaMs) {
                // Fuera de ventana, es un nuevo evento
                porTipo.set(evento.tipo, evento);
                resultado.push(evento);
            } else {
                // Dentro de ventana, mantener el de mayor severidad
                const ordenSeveridad: Record<SeveridadV2, number> = {
                    CRITICA: 3,
                    GRAVE: 2,
                    MODERADA: 1
                };
                
                if (ordenSeveridad[evento.severidad] > ordenSeveridad[ultimo.severidad]) {
                    // Reemplazar el último
                    const idx = resultado.indexOf(ultimo);
                    if (idx >= 0) {
                        resultado[idx] = evento;
                    }
                    porTipo.set(evento.tipo, evento);
                }
            }
        }
    }
    
    return resultado;
}

/**
 * Correlacionar eventos con GPS (±30s)
 */
async function correlacionarConGPS(eventos: EventoDetectadoV2[], sessionId: string): Promise<void> {
    if (eventos.length === 0) return;
    
    // Cargar todos los puntos GPS
    const gpsData = await prisma.gpsMeasurement.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
        select: {
            timestamp: true,
            latitude: true,
            longitude: true,
            speed: true
        }
    });
    
    if (gpsData.length === 0) {
        logger.warn(`No hay datos GPS para sesión ${sessionId}`);
        return;
    }
    
    // Correlacionar cada evento
    for (const evento of eventos) {
        let closestGPS = null;
        let minDiff = Infinity;
        
        for (const gps of gpsData) {
            const diff = Math.abs(gps.timestamp.getTime() - evento.timestamp.getTime());
            if (diff < 30000 && diff < minDiff) {
                minDiff = diff;
                closestGPS = gps;
            }
        }
        
        if (closestGPS) {
            evento.lat = closestGPS.latitude;
            evento.lon = closestGPS.longitude;
            evento.speed = closestGPS.speed;
        }
    }
}

/**
 * Guardar eventos en BD
 */
export async function guardarEventosV2(eventos: EventoDetectadoV2[]): Promise<number> {
    let guardados = 0;
    
    for (const evento of eventos) {
        try {
            await prisma.stability_events.create({
                data: {
                    session_id: evento.sessionId,
                    timestamp: evento.timestamp,
                    type: evento.tipo,
                    severity: evento.severidad,
                    lat: evento.lat || null,
                    lon: evento.lon || null,
                    speed: evento.speed || null,
                    details: {
                        ...evento.valores,
                        subtipo: evento.subtipo,
                        description: evento.descripcion
                    }
                }
            });
            guardados++;
        } catch (error: any) {
            // Ignorar duplicados
            if (error.code !== 'P2002') {
                logger.error(`Error guardando evento: ${error.message}`);
            }
        }
    }
    
    return guardados;
}

export const eventDetectorV2 = {
    detectarEventosSesionV2,
    guardarEventosV2
};
```

#### 2.2. Tests Unitarios

**Archivo:** `backend/src/services/__tests__/eventDetectorV2.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import { 
    detectarManiobraBrusca,
    detectarInclinacionExcesiva,
    detectarCurvaVelocidadExcesiva 
} from '../eventDetectorV2';

describe('EventDetectorV2', () => {
    
    describe('MANIOBRA_BRUSCA', () => {
        it('debe detectar maniobra GRAVE con gy=28°/s, roll=6°', () => {
            const ventana = crearVentana({ gy: 28, roll: 6 });
            const evento = detectarManiobraBrusca(ventana);
            
            expect(evento).not.toBeNull();
            expect(evento.tipo).toBe('MANIOBRA_BRUSCA');
            expect(evento.severidad).toBe('GRAVE');
        });
        
        it('debe detectar maniobra MODERADA con gy=18°/s, roll=8°', () => {
            const ventana = crearVentana({ gy: 18, roll: 8 });
            const evento = detectarManiobraBrusca(ventana);
            
            expect(evento).not.toBeNull();
            expect(evento.severidad).toBe('MODERADA');
        });
        
        it('NO debe detectar con gy=12°/s (bajo umbral)', () => {
            const ventana = crearVentana({ gy: 12, roll: 5 });
            const evento = detectarManiobraBrusca(ventana);
            
            expect(evento).toBeNull();
        });
        
        it('NO debe detectar con roll=15° (excede umbral)', () => {
            const ventana = crearVentana({ gy: 20, roll: 15 });
            const evento = detectarManiobraBrusca(ventana);
            
            expect(evento).toBeNull();
        });
    });
    
    describe('INCLINACION_LATERAL_EXCESIVA', () => {
        it('debe detectar CRÍTICA con roll=35°, dinámica baja', () => {
            const ventana = crearVentana({ 
                roll: 35, 
                ay: 0.05 * 9.81, // 0.05g
                gy: 1 
            });
            const evento = detectarInclinacionExcesiva(ventana);
            
            expect(evento).not.toBeNull();
            expect(evento.severidad).toBe('CRITICA');
            expect(evento.subtipo).toBe('ESTATICO');
        });
        
        it('NO debe detectar con dinámica alta (curva)', () => {
            const ventana = crearVentana({ 
                roll: 25, 
                ay: 0.35 * 9.81, // 0.35g
                gy: 8 
            });
            const evento = detectarInclinacionExcesiva(ventana);
            
            expect(evento).toBeNull();
        });
    });
    
    describe('CURVA_VELOCIDAD_EXCESIVA', () => {
        it('debe detectar GRAVE con ay=0.45g sostenida', () => {
            const ventana = crearVentanaSostenida({ 
                ay: 0.45 * 9.81, 
                roll: 15, 
                gy: 6,
                duracion: 0.8 // 800ms
            });
            const evento = detectarCurvaVelocidadExcesiva(ventana);
            
            expect(evento).not.toBeNull();
            expect(evento.severidad).toBe('GRAVE');
            expect(evento.valores.duracion_sostenida).toBeGreaterThanOrEqual(0.3);
        });
        
        it('NO debe detectar si no es sostenido (0.2s)', () => {
            const ventana = crearVentanaSostenida({ 
                ay: 0.45 * 9.81, 
                roll: 15, 
                gy: 6,
                duracion: 0.2 // Solo 200ms
            });
            const evento = detectarCurvaVelocidadExcesiva(ventana);
            
            expect(evento).toBeNull();
        });
    });
});

// Funciones auxiliares para crear ventanas de test
function crearVentana(params: { gy?: number, roll?: number, ay?: number }): any[] {
    return Array(10).fill(null).map(() => ({
        timestamp: new Date(),
        ax: 0,
        ay: params.ay || 0,
        az: 9.81,
        gx: 0,
        gy: params.gy || 0,
        gz: 0,
        roll: params.roll || 0,
        pitch: 0,
        yaw: 0
    }));
}

function crearVentanaSostenida(params: { 
    ay: number, 
    roll: number, 
    gy: number, 
    duracion: number 
}): any[] {
    const frecuencia = 10; // 10 Hz
    const numMediciones = Math.ceil(frecuencia * params.duracion);
    
    return Array(numMediciones).fill(null).map((_, i) => ({
        timestamp: new Date(Date.now() + i * 100), // 100ms entre mediciones
        ax: 0,
        ay: params.ay,
        az: 9.81,
        gx: 0,
        gy: params.gy,
        gz: 0,
        roll: params.roll,
        pitch: 0,
        yaw: 0
    }));
}
```

---

### Fase 3: VALIDACIÓN (1 semana)

#### 3.1. Script de Comparación

```typescript
// scripts/analisis/comparar-detectores.ts

async function compararDetectores(sessionId: string) {
    // 1. Ejecutar ambos detectores
    const eventosActuales = await eventDetector.detectarEventosSesion(sessionId);
    const eventosNuevos = await eventDetectorV2.detectarEventosSesionV2(sessionId);
    
    // 2. Analizar diferencias
    console.log(`Eventos actuales (V1): ${eventosActuales.length}`);
    console.log(`Eventos nuevos (V2): ${eventosNuevos.length}`);
    
    // 3. Mapeo aproximado
    const mapeo = {
        'MANIOBRA_BRUSCA': ['MANIOBRA_BRUSCA', 'DERIVA_PELIGROSA'],
        'INCLINACION_LATERAL_EXCESIVA': ['RIESGO_VUELCO'],
        'CURVA_VELOCIDAD_EXCESIVA': ['DERIVA_LATERAL_SIGNIFICATIVA']
    };
    
    // 4. Comparar temporalmente
    // ...
}
```

---

### Fase 4: DESPLIEGUE (3 días)

#### 4.1. Despliegue Gradual

1. **Día 1:** Ejecutar ambos detectores en paralelo (solo logging)
2. **Día 2:** Analizar resultados, ajustar umbrales si necesario
3. **Día 3:** Cambiar a detector V2 como principal

#### 4.2. Rollback Plan

```typescript
// Feature flag en config
const USE_EVENT_DETECTOR_V2 = process.env.USE_EVENT_DETECTOR_V2 === 'true';

export async function detectarEventos(sessionId: string) {
    if (USE_EVENT_DETECTOR_V2) {
        return eventDetectorV2.detectarEventosSesionV2(sessionId);
    } else {
        return eventDetector.detectarEventosSesion(sessionId);
    }
}
```

---

## 7. IMPLEMENTACIÓN TÉCNICA RECOMENDADA

### 7.1. Configuración Dinámica de Umbrales

**Tabla:** `event_thresholds_v2`

```sql
CREATE TABLE event_thresholds_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    parameter VARCHAR(50) NOT NULL,
    threshold_value FLOAT NOT NULL,
    severity VARCHAR(20),
    unit VARCHAR(20),
    organization_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT true,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    UNIQUE(event_type, parameter, severity, organization_id)
);

-- Datos iniciales
INSERT INTO event_thresholds_v2 (event_type, parameter, threshold_value, severity, unit) VALUES
-- Maniobra brusca
('MANIOBRA_BRUSCA', 'gy_moderada', 15.0, 'MODERADA', '°/s'),
('MANIOBRA_BRUSCA', 'gy_grave', 25.0, 'GRAVE', '°/s'),
('MANIOBRA_BRUSCA', 'roll_max', 10.0, NULL, '°'),

-- Inclinación lateral excesiva
('INCLINACION_LATERAL_EXCESIVA', 'roll_moderada', 20.0, 'MODERADA', '°'),
('INCLINACION_LATERAL_EXCESIVA', 'roll_critica', 30.0, 'CRITICA', '°'),
('INCLINACION_LATERAL_EXCESIVA', 'ay_g_max', 0.10, NULL, 'g'),
('INCLINACION_LATERAL_EXCESIVA', 'gy_max', 3.0, NULL, '°/s'),

-- Curva velocidad excesiva
('CURVA_VELOCIDAD_EXCESIVA', 'ay_g_moderada', 0.30, 'MODERADA', 'g'),
('CURVA_VELOCIDAD_EXCESIVA', 'ay_g_grave', 0.40, 'GRAVE', 'g'),
('CURVA_VELOCIDAD_EXCESIVA', 'roll_max', 20.0, NULL, '°'),
('CURVA_VELOCIDAD_EXCESIVA', 'gy_max', 10.0, NULL, '°/s'),
('CURVA_VELOCIDAD_EXCESIVA', 'duracion_sostenida', 0.3, NULL, 's');
```

### 7.2. API para Gestión de Umbrales

```typescript
// backend/src/routes/eventThresholds.ts

router.get('/api/event-thresholds', async (req, res) => {
    const organizationId = req.user.organizationId;
    
    const umbrales = await prisma.event_thresholds_v2.findMany({
        where: {
            OR: [
                { organization_id: null }, // Globales
                { organization_id: organizationId } // Específicos
            ],
            active: true
        }
    });
    
    res.json({ success: true, data: umbrales });
});

router.put('/api/event-thresholds/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { threshold_value } = req.body;
    
    await prisma.event_thresholds_v2.update({
        where: { id },
        data: { threshold_value, updated_at: new Date() }
    });
    
    res.json({ success: true });
});
```

---

## 8. HALLAZGOS Y RECOMENDACIONES

### 8.1. ✅ VENTAJAS DE LA NUEVA ESPECIFICACIÓN

1. **Claridad física** - Eventos directamente relacionados con fenómenos físicos
2. **Menos dependencia del SI** - No depende de un índice opaco
3. **Separación estático/dinámico** - Distingue claramente entre tipos de riesgo
4. **Umbrales calibrados** - Basados en límites físicos del vehículo
5. **Más fácil de explicar** - Conceptos comprensibles para operadores
6. **Análisis de ventana** - Más robusto que mediciones individuales

### 8.2. ⚠️ CONSIDERACIONES IMPORTANTES

#### CI-01: Verificar Convención de Ejes
- **Prioridad:** 🔴 CRÍTICA
- **Descripción:** Confirmar que `gy` es efectivamente ω_roll (roll rate)
- **Acción:** Ejecutar script de validación con datos reales

#### CI-02: Calibrar Frecuencia de Muestreo
- **Prioridad:** 🟠 ALTA
- **Descripción:** Determinar frecuencia real para calcular tamaño de ventana
- **Acción:** Analizar timestamps de mediciones en varias sesiones

#### CI-03: Ajustar Umbrales con Datos Reales
- **Prioridad:** 🟠 ALTA
- **Descripción:** Los umbrales pueden requerir ajuste fino con datos del parque
- **Acción:** Ejecutar en modo "logging only" durante 1 semana y analizar

#### CI-04: Definir Severidad de CURVA_VELOCIDAD
- **Prioridad:** 🟡 MEDIA
- **Descripción:** La especificación usa "severo" pero luego GRAVE/MODERADA
- **Acción:** Unificar terminología (usar GRAVE en lugar de "severo")

### 8.3. 🎯 PLAN DE ACCIÓN FINAL

#### Semana 1: PREPARACIÓN
- [ ] Validar convención de ejes (gx vs gy para roll rate)
- [ ] Calcular frecuencia de muestreo promedio
- [ ] Crear tabla `event_thresholds_v2`
- [ ] Desarrollar script de validación

#### Semana 2-3: IMPLEMENTACIÓN
- [ ] Implementar `eventDetectorV2.ts`
- [ ] Crear tests unitarios completos
- [ ] Implementar API de gestión de umbrales
- [ ] Crear script de comparación V1 vs V2

#### Semana 4: VALIDACIÓN
- [ ] Ejecutar ambos detectores en paralelo (10 sesiones)
- [ ] Comparar resultados V1 vs V2
- [ ] Ajustar umbrales según necesidad
- [ ] Validar con equipo técnico

#### Semana 5: DESPLIEGUE
- [ ] Activar detector V2 con feature flag
- [ ] Monitorear logs durante 3 días
- [ ] Confirmar funcionamiento correcto
- [ ] Deprecar detector V1
- [ ] Actualizar documentación

---

## ANEXO A: Comparación de Umbrales

| Concepto | Sistema Actual | Nueva Especificación |
|----------|----------------|---------------------|
| **Base de severidad** | SI < 0.20/0.35/0.50 | Umbrales específicos por evento |
| **Maniobra brusca** | Δgx > 100°/s² o \|ay\| > 3m/s² | \|gy\| > 15°/s (roll rate directo) |
| **Roll crítico** | roll > 10° en vuelco inminente | roll > 20-30° en inclinación excesiva |
| **Aceleración lateral** | ay > 3m/s² | ay > 0.30g sostenida (curva velocidad) |
| **Velocidad angular** | \|gx\| > 45°/s (deriva peligrosa) | \|gy\| > 15°/s (maniobra brusca) |

---

## ANEXO B: Glosario Extendido

| Término | Definición |
|---------|------------|
| **gy (ω_roll)** | Velocidad angular de balanceo (roll rate) en °/s |
| **ay_g** | Aceleración lateral en unidades de g (ay / 9.81) |
| **Ventana temporal** | Conjunto de mediciones consecutivas en un intervalo (ej. 1 segundo) |
| **Evento sostenido** | Condición que se mantiene por una duración mínima (ej. ≥0.3s) |
| **Estático/cuasiestático** | Fenómeno con dinámica baja (cambios lentos) |
| **Dinámico** | Fenómeno con cambios rápidos en el tiempo |

---

**Fin de la Auditoría V2**

