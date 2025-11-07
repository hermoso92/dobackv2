# 🔄 SISTEMA HÍBRIDO DE EVENTOS V2 - ESPECIFICACIÓN FINAL

**Fecha:** 3 de Noviembre de 2025  
**Versión:** 2.0 (Sistema Híbrido Correcto)  
**Estado:** ✅ Implementado y listo para validación

---

## 📊 ARQUITECTURA DEL SISTEMA HÍBRIDO

### Flujo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│  SISTEMA HÍBRIDO: SI (Filtro) + Tipos Físicos (Clasificación)  │
└─────────────────────────────────────────────────────────────────┘

📍 VENTANA TEMPORAL (1 segundo ≈ 10 mediciones)
   ↓
   [m1, m2, m3, m4, m5, m6, m7, m8, m9, m10]
   
🔍 PASO 1: FILTRO POR SI (Mandamiento M3.1)
   ↓
   si_min = min(m1.si, m2.si, ..., m10.si)
   
   ¿si_min < 0.50?
   ├─ NO  → ✋ Sin evento (condición normal)
   └─ SÍ  → ⬇️ Continuar
   
📊 PASO 2: CLASIFICAR SEVERIDAD POR SI (Mandamiento M3.2)
   ↓
   SI < 0.20  → 🔴 GRAVE
   0.20-0.35  → 🟠 MODERADA
   0.35-0.50  → 🟡 LEVE
   
🎯 PASO 3: DETERMINAR TIPO POR FENÓMENO FÍSICO
   ↓
   Analizar parámetros físicos de la ventana:
   
   ┌─────────────────────────────────────────────────┐
   │ PRIORIDAD 1: MANIOBRA_BRUSCA                    │
   │ • |gy| > 15°/s  (velocidad angular alta)        │
   │ • |roll| < 10°  (ángulo aún bajo)               │
   │ → Volantazo sin inclinación desarrollada        │
   └─────────────────────────────────────────────────┘
   ↓ Si no cumple
   ┌─────────────────────────────────────────────────┐
   │ PRIORIDAD 2: INCLINACION_LATERAL_EXCESIVA       │
   │ • |roll| > 20°  (ángulo alto)                   │
   │ • ay < 0.10g    (aceleración baja)              │
   │ • |gy| < 3°/s   (velocidad angular baja)        │
   │ → Inclinación estática (pendiente/carga)        │
   └─────────────────────────────────────────────────┘
   ↓ Si no cumple
   ┌─────────────────────────────────────────────────┐
   │ PRIORIDAD 3: CURVA_VELOCIDAD_EXCESIVA           │
   │ • ay > 0.30g sostenida ≥0.3s                    │
   │ • |roll| < 20°                                  │
   │ • |gy| < 10°/s                                  │
   │ → Curva rápida con fuerza centrífuga alta       │
   └─────────────────────────────────────────────────┘
   ↓ Si no cumple
   ┌─────────────────────────────────────────────────┐
   │ FALLBACK: RIESGO_VUELCO (genérico)             │
   │ → SI bajo pero sin patrón físico específico     │
   └─────────────────────────────────────────────────┘

💾 RESULTADO FINAL
   {
     tipo: "MANIOBRA_BRUSCA" | "INCLINACION_..." | "CURVA_..." | "RIESGO_VUELCO",
     severidad: "LEVE" | "MODERADA" | "GRAVE",  ← DEL SI
     si: 0.28,
     valores: { gy_max: 22, roll_max: 8, ... },
     lat: 40.4168,
     lon: -3.7038
   }
```

---

## 🆚 COMPARACIÓN SISTEMAS

| Aspecto | Sistema Actual | Sistema Híbrido V2 | Diferencia Clave |
|---------|----------------|---------------------|------------------|
| **Filtro inicial** | SI < 0.50 ✅ | SI < 0.50 ✅ | **IGUAL** |
| **Severidad** | Por SI (0.20/0.35/0.50) | Por SI (0.20/0.35/0.50) | **IGUAL** |
| **Tipos de eventos** | 8 tipos mezclados | **4 tipos físicos** | **SIMPLIFICADO** |
| **Base clasificación** | Múltiples umbrales | **Fenómenos físicos** | **MÁS CLARO** |
| **Análisis** | Medición individual | **Ventana temporal** | **MÁS ROBUSTO** |
| **Explicabilidad** | "SI bajo" (vago) | **"Maniobra brusca"** | **DESCRIPTIVO** |

### ✅ VENTAJAS DEL SISTEMA HÍBRIDO

1. ✅ **Mantiene confiabilidad del SI** - No rompe lo que funciona
2. ✅ **Severidad consistente** - Siempre por SI (Mandamiento M3)
3. ✅ **Tipos más descriptivos** - En lugar de genérico "RIESGO_VUELCO", especifica SI fue volantazo, inclinación o curva rápida
4. ✅ **Backward compatible** - Puede coexistir con sistema actual
5. ✅ **Más información sin complejidad** - Añade contexto físico sin cambiar lógica

---

## 🎯 LOS 4 TIPOS DE EVENTOS

### 1️⃣ MANIOBRA_BRUSCA (Giro/Volantazo)

**Fenómeno físico:**  
Velocidad angular de roll (ω_roll) alta con ángulo de inclinación aún bajo. La carrocería no ha desarrollado mucha inclinación porque el evento es muy reciente.

**Condiciones de clasificación:**
```typescript
|gy| > 15°/s  AND  |roll| < 10°
```

**Interpretación:**
- Volantazo para esquivar obstáculo
- Corrección brusca de trayectoria
- Maniobra evasiva

**Ejemplo:**
```json
{
  "tipo": "MANIOBRA_BRUSCA",
  "severidad": "MODERADA",  ← del SI (0.28)
  "si": 0.28,
  "valores": {
    "gy_max": 22.0,  ← Velocidad angular alta
    "roll_max": 8.0   ← Ángulo aún bajo
  },
  "descripcion": "Maniobra brusca (giro/volantazo): ωroll=22.0°/s, roll=8.0°, SI=28.0%"
}
```

---

### 2️⃣ INCLINACION_LATERAL_EXCESIVA (Estático)

**Fenómeno físico:**  
Ángulo de roll grande sostenido con dinámica suave (poca aceleración lateral y poca velocidad angular). Indica inclinación estática o cuasiestática.

**Condiciones de clasificación:**
```typescript
|roll| > 20°  AND  ay < 0.10g  AND  |gy| < 3°/s
```

**Interpretación:**
- Pendiente lateral del terreno
- Distribución asimétrica de carga
- Apoyo prolongado en superficie inclinada
- **NO** es un evento dinámico de conducción

**Ejemplo:**
```json
{
  "tipo": "INCLINACION_LATERAL_EXCESIVA",
  "severidad": "GRAVE",  ← del SI (0.18)
  "subtipo": "ESTATICO",
  "si": 0.18,
  "valores": {
    "roll_max": 25.0,      ← Ángulo alto
    "ay_g_promedio": 0.08,  ← Aceleración baja
    "gy_max": 2.0          ← Velocidad angular baja
  },
  "descripcion": "Inclinación lateral excesiva (estático): roll=25.0°, ay=0.08g, SI=18.0%"
}
```

---

### 3️⃣ CURVA_VELOCIDAD_EXCESIVA (Dinámico)

**Fenómeno físico:**  
Aceleración lateral alta sostenida con ángulo de roll moderado y velocidad angular baja. El momento de vuelco por ay supera al de restitución antes de que el roll sea muy grande.

**Condiciones de clasificación:**
```typescript
ay > 0.30g  AND  duración ≥ 0.3s  AND  |roll| < 20°  AND  |gy| < 10°/s
```

**Interpretación:**
- Curva tomada a velocidad excesiva
- Radio de giro insuficiente para la velocidad
- Alta fuerza centrífuga

**Ejemplo:**
```json
{
  "tipo": "CURVA_VELOCIDAD_EXCESIVA",
  "severidad": "MODERADA",  ← del SI (0.32)
  "subtipo": "DINAMICO",
  "si": 0.32,
  "valores": {
    "ay_g_max": 0.38,        ← Aceleración lateral alta
    "roll_max": 15.0,        ← Ángulo moderado
    "gy_max": 8.0,           ← Velocidad angular moderada
    "duracion_sostenida": 0.8 ← Sostenido 800ms
  },
  "descripcion": "Curva a velocidad excesiva: ay=0.38g, roll=15.0°, duración=800ms, SI=32.0%"
}
```

---

### 4️⃣ RIESGO_VUELCO (Genérico - Fallback)

**Fenómeno físico:**  
SI < 0.50 pero no coincide con ningún patrón físico específico. Evento genérico de inestabilidad.

**Condiciones de clasificación:**
```typescript
SI < 0.50  AND  NO cumple condiciones de los otros 3 tipos
```

**Interpretación:**
- Combinación atípica de parámetros
- Evento complejo no clasificable
- Inestabilidad general

**Ejemplo:**
```json
{
  "tipo": "RIESGO_VUELCO",
  "severidad": "LEVE",  ← del SI (0.42)
  "si": 0.42,
  "valores": {
    "roll_max": 12.0,
    "gy_max": 8.0,
    "ay_g_max": 0.18
  },
  "descripcion": "Riesgo de vuelco (genérico): roll=12.0°, ωroll=8.0°/s, ay=0.18g, SI=42.0%"
}
```

---

## 🔧 IMPLEMENTACIÓN TÉCNICA

### Archivo Principal

**Ubicación:** `backend/src/services/eventDetectorV2.ts`  
**Líneas:** 585  
**Estado:** ✅ Implementado

### Funciones Clave

```typescript
// 1. Clasificar severidad por SI (Mandamiento M3.2)
function clasificarSeveridadPorSI(si: number): SeveridadV2 | null {
    if (si >= 0.50) return null;
    if (si < 0.20) return 'GRAVE';
    if (si < 0.35) return 'MODERADA';
    return 'LEVE';
}

// 2. Determinar tipo de evento por fenómeno físico
function determinarTipoEvento(ventana: MedicionEstabilidad[]): {
    tipo: TipoEventoV2;
    subtipo?: 'ESTATICO' | 'DINAMICO';
    valores: any;
}

// 3. Función principal
export async function detectarEventosSesionV2(sessionId: string): Promise<EventoDetectadoV2[]>
```

### Proceso de Detección

```typescript
for (ventana of ventanas) {
    // PASO 1: Filtro por SI
    const si_min = Math.min(...ventana.map(m => m.si));
    if (si_min >= 0.50) continue; // Sin evento
    
    // PASO 2: Severidad por SI
    const severidad = clasificarSeveridadPorSI(si_min);
    
    // PASO 3: Tipo por fenómeno físico
    const { tipo, subtipo, valores } = determinarTipoEvento(ventana);
    
    // PASO 4: Crear evento
    const evento = {
        tipo,
        severidad,  ← DEL SI
        subtipo,
        si: si_min, ← OBLIGATORIO (M3.6)
        valores,
        timestamp,
        sessionId
    };
    
    eventos.push(evento);
}
```

---

## 📋 MANDAMIENTOS M3 - CUMPLIMIENTO

| Mandamiento | Descripción | ✅ Cumplimiento |
|-------------|-------------|----------------|
| **M3.1** | Solo generar eventos si SI < 0.50 | ✅ Línea 326 |
| **M3.2** | Umbrales de severidad 0.20/0.35/0.50 | ✅ Función `clasificarSeveridadPorSI()` |
| **M3.3** | SI siempre en [0, 1] | ✅ Validado en parser |
| **M3.4** | Tipos de eventos definidos | ✅ 4 tipos bien definidos |
| **M3.5** | Eventos críticos (no aplica aquí) | ⚪ Severidad solo por SI |
| **M3.6** | Persistir SI obligatorio | ✅ Línea 526 `details.si` |
| **M3.7** | Coexistencia de eventos | ✅ Deduplicación por tipo |

---

## ⚠️ VERIFICACIONES CRÍTICAS PENDIENTES

### 1. Convención de Ejes

**❓ PREGUNTA CRÍTICA:** ¿`gy` o `gx` es el roll rate (ω_roll)?

El código asume que **`gy` es el roll rate**. 

**Verificación:**
```bash
npx ts-node scripts/analisis/validar-datos-eventos-v2.ts
```

El script calculará la correlación entre `gy` y `d(roll)/dt`.

- Si correlación > 0.8 → ✅ `gy` es correcto
- Si correlación < 0.3 → ⚠️ Usar `gx` en su lugar

**Si hay que cambiar a gx:**
```typescript
// En determinarTipoEvento(), cambiar todas las líneas:
const gy_max = Math.max(...ventana.map(m => Math.abs(m.gy)));
// Por:
const gy_max = Math.max(...ventana.map(m => Math.abs(m.gx)));
```

### 2. Frecuencia de Muestreo

**❓ PREGUNTA:** ¿Cuántas mediciones por segundo?

Actualmente: `VENTANA_TAMAÑO_MEDICIONES = 10` (asume 10 Hz)

**Verificación:**
El script calculará la frecuencia real.

**Ajustar en línea 28 de eventDetectorV2.ts:**
```typescript
VENTANA_TAMAÑO_MEDICIONES: 10, // ⚠️ Cambiar según frecuencia real
```

### 3. Rangos de Valores

Verificar que los datos alcanzan los umbrales definidos.

---

## 🚀 PASOS SIGUIENTES

### 1. Ejecutar Validación (15 min)

```bash
cd backend
npx ts-node ../scripts/analisis/validar-datos-eventos-v2.ts
```

**Verificará:**
- ✅ Convención de ejes (gy vs gx)
- ✅ Frecuencia de muestreo
- ✅ Rangos de valores
- ✅ Eventos esperados

### 2. Ajustar Configuración (5 min)

Según resultados del script:
- Corregir campo de roll rate si necesario (`gy` → `gx`)
- Ajustar `VENTANA_TAMAÑO_MEDICIONES`

### 3. Probar con Sesión Real (10 min)

```typescript
import { eventDetectorV2 } from './services/eventDetectorV2';

// Detectar eventos
const eventos = await eventDetectorV2.detectarEventosSesionV2('SESSION_ID');

console.log(`Eventos detectados: ${eventos.length}`);
console.log(`Tipos:`, eventos.reduce((acc, e) => {
    acc[e.tipo] = (acc[e.tipo] || 0) + 1;
    return acc;
}, {}));

// Guardar en BD
const guardados = await eventDetectorV2.guardarEventosV2(eventos);
console.log(`Guardados: ${guardados}`);
```

### 4. Comparar con Sistema Actual (opcional)

Ejecutar ambos detectores en paralelo y comparar resultados.

### 5. Desplegar en Producción

Usar feature flag para cambiar gradualmente:
```typescript
const USE_V2 = process.env.EVENT_DETECTOR_V2 === 'true';

const detectar = USE_V2 
    ? eventDetectorV2.detectarEventosSesionV2
    : eventDetector.detectarEventosSesion;
```

---

## 📊 EJEMPLO COMPLETO DE EVENTO

```json
{
  "id": "uuid-123",
  "session_id": "session-456",
  "timestamp": "2025-11-03T14:32:15.234Z",
  "type": "MANIOBRA_BRUSCA",
  "severity": "MODERADA",
  "lat": 40.4168,
  "lon": -3.7038,
  "speed": 75.5,
  "details": {
    "si": 0.28,
    "gy_max": 22.0,
    "roll_max": 8.0,
    "subtipo": null,
    "description": "Maniobra brusca (giro/volantazo): ωroll=22.0°/s, roll=8.0°, SI=28.0%"
  }
}
```

---

## 🎓 GLOSARIO

| Término | Definición |
|---------|------------|
| **SI** | Stability Index - Índice de estabilidad [0,1], viene del archivo |
| **gy (ω_roll)** | Velocidad angular de roll en °/s (roll rate) |
| **roll** | Ángulo de balanceo lateral en ° |
| **ay** | Aceleración lateral en m/s² |
| **ay_g** | Aceleración lateral en g (ay / 9.81) |
| **Ventana** | Conjunto de mediciones consecutivas (~1 segundo) |
| **Severidad** | LEVE/MODERADA/GRAVE según SI |
| **Tipo** | Clasificación del fenómeno físico |
| **Estático** | Evento sin dinámica (pendiente, carga) |
| **Dinámico** | Evento con movimiento (curva, maniobra) |

---

**FIN DEL DOCUMENTO**

**Estado:** ✅ Sistema implementado y listo para validación  
**Próximo paso:** Ejecutar script de validación






