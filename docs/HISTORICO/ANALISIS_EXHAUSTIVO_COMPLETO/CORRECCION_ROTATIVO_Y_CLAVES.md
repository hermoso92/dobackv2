# ⚠️ CORRECCIÓN IMPORTANTE: ROTATIVO Y CLAVES

**Fecha:** 10 de octubre de 2025  
**Tipo:** Corrección crítica de información

---

## 🚨 CORRECCIÓN

### **❌ INFORMACIÓN ANTERIOR (INCORRECTA):**

Pensaba que el archivo ROTATIVO contenía las claves directamente:
```
Estado 0 = Taller
Estado 1 = Clave 2 (Emergencia)
Estado 2 = Clave 5
Estado 5 = Especial
```

### **✅ INFORMACIÓN CORRECTA:**

#### **1. ROTATIVO (Sirena) - 2 Estados Simples**

El archivo ROTATIVO solo indica si la sirena está encendida o apagada:

```
Estado 0 = Sirena APAGADA
Estado 1 = Sirena ENCENDIDA
```

**Formato del archivo:**
```
ROTATIVO;30/09/2025-09:33:37;DOBACK024;Sesión:1
Fecha-Hora;Estado
30/09/2025-09:33:37;0   ← Sirena apagada
30/09/2025-09:36:52;1   ← Sirena encendida
30/09/2025-12:41:52;0   ← Sirena apagada
```

#### **2. CLAVES (Categorización Operacional) - SE CALCULAN**

Las **claves NO están en un archivo** - se calculan mediante lógica basada en:
- Geocercas (parque, taller)
- Estado del rotativo (on/off)
- Movimiento del vehículo
- Tiempo parado

| Clave | Nombre | Condición | Detección |
|-------|--------|-----------|-----------|
| **0** | Taller | Dentro geocerca taller | `EN_GEOCERCA(taller)` |
| **1** | Operativo en parque | Dentro geocerca parque | `EN_GEOCERCA(parque) AND rotativo=0` |
| **2** | Salida en emergencia | Sale de parque con sirena | `SALE_GEOCERCA(parque) AND rotativo=1` |
| **3** | En incendio/emergencia | Parado >5 min en emergencia | `VELOCIDAD=0 >5min AND fuera_parque` |
| **5** | Regreso al parque | Vuelve sin sirena | `HACIA_GEOCERCA(parque) AND rotativo=0` |

---

## 🔧 LÓGICA DE CÁLCULO DE CLAVES

### **Clave 0: Taller**

```javascript
function esClave0(punto, geocercas) {
  return puntoEnGeocerca(punto, geocercas.taller);
}

// Duración: desde entrada a taller hasta salida
```

### **Clave 1: Operativo en Parque**

```javascript
function esClave1(punto, rotativo, geocercas) {
  return puntoEnGeocerca(punto, geocercas.parque) && 
         rotativo === 0;
}

// Duración: tiempo en parque sin sirena
```

### **Clave 2: Salida en Emergencia**

```javascript
function esClave2(punto, rotativo, geocercas, anterior) {
  return !puntoEnGeocerca(punto, geocercas.parque) &&
         puntoEnGeocerca(anterior, geocercas.parque) &&
         rotativo === 1;
}

// Duración: desde salida de parque hasta llegada al lugar
// Condición: Rotativo ENCENDIDO
```

### **Clave 3: En Incendio/Emergencia**

```javascript
function esClave3(velocidades, tiempo, geocercas) {
  const parado = velocidades.every(v => v < 5); // km/h
  const tiempoParado = tiempo > 5 * 60; // segundos
  const fueraParque = !puntoEnGeocerca(punto, geocercas.parque);
  
  return parado && tiempoParado && fueraParque;
}

// Duración: tiempo parado >5 min fuera del parque
// Rotativo: opcional (puede estar on u off)
```

### **Clave 5: Regreso al Parque**

```javascript
function esClave5(punto, destino, rotativo, geocercas) {
  const vaHaciaParque = calcularRumbo(punto, destino) === rumboParque;
  const fueraParque = !puntoEnGeocerca(punto, geocercas.parque);
  
  return fueraParque && 
         vaHaciaParque && 
         rotativo === 0;
}

// Duración: desde inicio retorno hasta entrada en parque
// Condición: Rotativo APAGADO
```

---

## 📊 EVENTOS DE ESTABILIDAD (Tabla Completa)

### **Detección Basada en Índice SI y Otras Variables**

| Evento | Variables | Condición | Criticidad |
|--------|-----------|-----------|------------|
| **Riesgo de vuelco** | `si` | `si < 30` | 🔴 Grave `<20` 🟠 Moderada `20-35` 🟡 Leve `35-50` 🟢 Normal `>50` |
| **Vuelco inminente** | `si`, `roll`, `gx` | `si < 10 AND (roll > 10 OR gx > 30)` | 🔴 Grave (fijo) |
| **Deriva lateral significativa** | `ay`, `yaw`, `gx` | `abs(yaw_rate - ay/v) > 0.15` | 🔴 `<20` 🟠 `20-35` 🟡 `35-50` 🟢 `>50` |
| **Deriva peligrosa** | `gx`, `yaw`, `ay` | `abs(gx) > 45 AND si > 70` | 🔴 si sostenido 🟠 si temporal |
| **Maniobra brusca** | `gx`, `ay`, `roll` | `d(gx)/dt > 100 OR ay > 3` | 🔴 `<20` 🟠 `20-35` 🟡 `35-50` 🟢 `>50` |
| **Curva estable** | `ay`, `roll`, `si` | `ay > 2 AND si > 60 AND roll < 8` | 🟢 Normal |
| **Cambio de carga** | `roll`, `ay`, `gx`, `si` | `Δroll > 10% AND Δsi > 10%` | 🟡 Leve 🟠 Moderada si afecta SI |
| **Zona inestable** | `gz`, `gx` | Variaciones rápidas en gz y picos en gx | 🟡 Leve |

---

## 🚦 LÍMITES DE VELOCIDAD PARA CAMIONES

| Tipo de Vía | Límite (km/h) |
|-------------|---------------|
| Autopistas/Autovías | 90 |
| Carreteras convencionales (arcén ≥1.50m o varios carriles) | 80 |
| Resto vías fuera poblado | 70 |
| Autopistas urbanas | 90 |
| Convencional con separación física | 80 |
| Convencional sin separación física | 80 |
| Vía sin pavimentar | 30 |

**Nota:** En emergencias (rotativo=1) pueden permitirse excesos de hasta +20 km/h

---

## 🔄 CÁLCULO DE TIEMPOS POR CLAVE

### **Algoritmo Completo:**

```javascript
function calcularTiemposPorClave(sesiones, geocercas) {
  const tiempos = {
    clave0: 0, // Taller
    clave1: 0, // Operativo en parque
    clave2: 0, // Salida emergencia
    clave3: 0, // En incendio
    clave5: 0  // Regreso
  };
  
  for (const sesion of sesiones) {
    const gps = sesion.gpsMeasurements;
    const rotativo = sesion.rotativoMeasurements;
    
    for (let i = 0; i < gps.length; i++) {
      const punto = gps[i];
      const rot = rotativo[i]?.state || '0';
      
      // Clave 0: Taller
      if (puntoEnGeocerca(punto, geocercas.taller)) {
        tiempos.clave0 += 5; // 5 segundos por muestra
        continue;
      }
      
      // Clave 1: Operativo en parque
      if (puntoEnGeocerca(punto, geocercas.parque) && rot === '0') {
        tiempos.clave1 += 5;
        continue;
      }
      
      // Clave 2: Salida en emergencia
      if (!puntoEnGeocerca(punto, geocercas.parque) && rot === '1') {
        // Verificar si está yendo hacia emergencia (no regresando)
        if (i > 0 && puntoEnGeocerca(gps[i-1], geocercas.parque)) {
          // Acaba de salir del parque
          tiempos.clave2 += 5;
        } else if (punto.speed > 10) {
          // Se mueve con sirena encendida
          tiempos.clave2 += 5;
        }
        continue;
      }
      
      // Clave 3: En incendio/emergencia (parado >5 min)
      if (!puntoEnGeocerca(punto, geocercas.parque) && 
          punto.speed < 5) {
        // Contar tiempo parado
        let tiempoParado = 5;
        for (let j = i + 1; j < gps.length && gps[j].speed < 5; j++) {
          tiempoParado += 5;
        }
        
        if (tiempoParado > 5 * 60) { // >5 minutos
          tiempos.clave3 += tiempoParado;
          i += Math.floor(tiempoParado / 5) - 1; // Saltar muestras ya contadas
        }
        continue;
      }
      
      // Clave 5: Regreso al parque
      if (!puntoEnGeocerca(punto, geocercas.parque) && rot === '0') {
        // Verificar si se dirige al parque
        const distanciaParque = calcularDistancia(punto, geocercas.parque.centro);
        
        if (i > 0) {
          const distanciaAnterior = calcularDistancia(gps[i-1], geocercas.parque.centro);
          
          // Si se acerca al parque (distancia disminuye)
          if (distanciaParque < distanciaAnterior) {
            tiempos.clave5 += 5;
          }
        }
      }
    }
  }
  
  return {
    clave0_segundos: tiempos.clave0,
    clave1_segundos: tiempos.clave1,
    clave2_segundos: tiempos.clave2,
    clave3_segundos: tiempos.clave3,
    clave5_segundos: tiempos.clave5
  };
}
```

---

## 🎯 DETECCIÓN DE EVENTOS CORRECTA

### **Umbrales Basados en Índice SI:**

```javascript
function detectarEventos(measurement) {
  const eventos = [];
  const { si, roll, pitch, gx, gy, gz, ay, ax } = measurement;
  
  // 1. Riesgo de vuelco (si < 30)
  if (si < 30) {
    const severidad = si < 20 ? 'GRAVE' :
                      si < 35 ? 'MODERADA' :
                      si < 50 ? 'LEVE' : 'NORMAL';
    eventos.push({
      tipo: 'RIESGO_VUELCO',
      severidad,
      si
    });
  }
  
  // 2. Vuelco inminente
  if (si < 10 && (Math.abs(roll) > 10 || Math.abs(gx) > 30)) {
    eventos.push({
      tipo: 'VUELCO_INMINENTE',
      severidad: 'GRAVE',
      si,
      roll,
      gx
    });
  }
  
  // 3. Deriva peligrosa
  if (Math.abs(gx) > 45 && si > 70) {
    eventos.push({
      tipo: 'DERIVA_PELIGROSA',
      severidad: 'GRAVE',
      gx
    });
  }
  
  // 4. Maniobra brusca (ay > 3 m/s² = 300 mg)
  if (Math.abs(ay) > 300) {
    const severidad = si < 20 ? 'GRAVE' :
                      si < 35 ? 'MODERADA' :
                      si < 50 ? 'LEVE' : 'NORMAL';
    eventos.push({
      tipo: 'MANIOBRA_BRUSCA',
      severidad,
      ay,
      si
    });
  }
  
  // 5. Curva estable (referencia positiva)
  if (ay > 200 && si > 60 && Math.abs(roll) < 8) {
    eventos.push({
      tipo: 'CURVA_ESTABLE',
      severidad: 'NORMAL',
      calidad: 'EXCELENTE'
    });
  }
  
  return eventos;
}
```

---

## 🚦 LÍMITES DE VELOCIDAD PARA CAMIONES BOMBEROS

### **Tabla de Límites:**

```javascript
const LIMITES_VELOCIDAD_CAMIONES = {
  AUTOPISTA_AUTOVIA: 90,
  CARRETERA_ARCEN_PAVIMENTADO: 80,  // arcén ≥1.50m
  RESTO_VIAS_FUERA_POBLADO: 70,
  AUTOPISTA_URBANA: 90,
  CONVENCIONAL_SEPARACION_FISICA: 80,
  CONVENCIONAL_SIN_SEPARACION: 80,
  VIA_SIN_PAVIMENTAR: 30
};

// En emergencia (rotativo=1): permitir +20 km/h
function getLimiteVelocidad(tipoVia, rotativo) {
  const limiteBase = LIMITES_VELOCIDAD_CAMIONES[tipoVia];
  const tolerancia = rotativo === 1 ? 20 : 0;
  return limiteBase + tolerancia;
}
```

### **Detección de Excesos:**

```javascript
function detectarExcesoVelocidad(velocidad, tipoVia, rotativo) {
  const limite = getLimiteVelocidad(tipoVia, rotativo);
  const exceso = velocidad - limite;
  
  if (exceso > 0) {
    return {
      exceso,
      severidad: exceso > 30 ? 'GRAVE' :
                 exceso > 15 ? 'MODERADA' : 'LEVE',
      justificado: rotativo === 1 && exceso <= 20
    };
  }
  
  return null;
}
```

---

## 📐 FÓRMULAS CORREGIDAS

### **Tiempo con Rotativo Encendido:**

```javascript
// CORRECTO:
const muestrasON = rotativo.filter(r => r.state === '1').length;
const tiempoMinutos = (muestrasON * 15) / 60;
```

### **Tiempo por Clave:**

```javascript
// Se calcula mediante lógica de geocercas + rotativo + movimiento
const tiemposPorClave = calcularTiemposPorClave(sesiones, geocercas);

// Resultado:
{
  clave0: 45,   // minutos en taller
  clave1: 120,  // minutos operativo en parque
  clave2: 12,   // minutos salida emergencia
  clave3: 35,   // minutos en incendio
  clave5: 10    // minutos regreso
}
```

---

## 🔄 ARCHIVOS A ACTUALIZAR

### **1. Documentación:**
- [x] `CORRECCION_ROTATIVO_Y_CLAVES.md` (este archivo) ✅
- [ ] `GUIA_COMPLETA_FUNCIONAMIENTO_APLICACION.md` - Actualizar sección de rotativo
- [ ] `DESCUBRIMIENTOS_CLAVE_DISPOSITIVO.md` - Actualizar tabla de estados
- [ ] `CAMPOS_ESTABILIDAD_DETALLADOS.md` - Actualizar tabla de eventos

### **2. Servicios Backend:**
- [ ] `backend/src/services/kpiCalculator.ts` - Actualizar cálculo de tiempos por clave
- [ ] `backend/src/services/emergencyDetector.ts` - Implementar clasificación con claves
- [ ] `backend/src/services/eventDetector.ts` - **CREAR** - Detectar eventos según tabla

### **3. Procesador:**
- [ ] `backend/process-multi-session-correct.js` - Comentarios actualizados

### **4. Frontend:**
- [ ] Dashboard - Actualizar nombres de estados
- [ ] KPIs - Mostrar claves correctamente

---

## ✅ RESUMEN DE CAMBIOS NECESARIOS

### **Conceptos Corregidos:**

| Concepto | ❌ Antes | ✅ Ahora |
|----------|----------|----------|
| Estados del ROTATIVO | 4 estados (0,1,2,5) | **2 estados (0,1)** |
| Significado | Claves directas | **Sirena on/off** |
| Claves | Datos en archivo | **Se calculan por lógica** |
| Detección eventos | Umbrales simples | **Basados en SI + condiciones** |
| Límites velocidad | Genéricos | **Específicos camiones** |

### **Nueva Lógica Implementar:**

1. **Servicio de Claves** (`backend/src/services/keyCalculator.ts`)
   - Calcular tiempos por clave usando geocercas
   - Detectar transiciones entre claves
   - Generar timeline de operación

2. **Servicio de Eventos** (`backend/src/services/eventDetector.ts`)
   - Implementar tabla completa de eventos
   - Usar índice SI para criticidad
   - Detectar curvas estables (eventos positivos)

3. **Servicio de Velocidades** (`backend/src/services/speedAnalyzer.ts`)
   - Usar límites de camiones
   - Considerar emergencias (+20 km/h permitido)
   - Clasificar excesos por severidad

---

## 🎯 IMPACTO EN KPIS

### **KPIs Afectados:**

| KPI | Cambio Necesario |
|-----|------------------|
| Tiempo rotativo ON | ✅ YA CORRECTO (solo cuenta estado=1) |
| Tiempo por clave | ❌ CREAR NUEVO (requiere geocercas) |
| Número de incidencias | ⚠️ ACTUALIZAR (usar tabla de eventos) |
| Velocidades | ⚠️ ACTUALIZAR (límites camiones) |
| Índice estabilidad | ✅ YA CORRECTO |
| KM recorridos | ✅ YA CORRECTO |

---

## 📋 PRÓXIMA IMPLEMENTACIÓN

### **Paso 1: Crear Servicio de Claves**

```typescript
// backend/src/services/keyCalculator.ts

interface TiemposPorClave {
  clave0_segundos: number;
  clave1_segundos: number;
  clave2_segundos: number;
  clave3_segundos: number;
  clave5_segundos: number;
}

async function calcularTiemposPorClave(
  sessionIds: string[],
  geocercas: Geocercas
): Promise<TiemposPorClave> {
  // Implementar lógica completa
}
```

### **Paso 2: Crear Servicio de Eventos**

```typescript
// backend/src/services/eventDetector.ts

function detectarEventosCompletos(measurement: StabilityMeasurement) {
  // Implementar tabla completa de eventos
  // Usar índice SI para criticidad
}
```

### **Paso 3: Actualizar Dashboard**

```typescript
// Estados mostrados:
const estados = [
  { key: 0, name: 'Taller', time: tiempos.clave0 },
  { key: 1, name: 'Operativo en Parque', time: tiempos.clave1 },
  { key: 2, name: 'Salida en Emergencia', time: tiempos.clave2 },
  { key: 3, name: 'En Incendio/Emergencia', time: tiempos.clave3 },
  { key: 5, name: 'Regreso al Parque', time: tiempos.clave5 }
];
```

---

## ✅ CONCLUSIÓN

**Información crítica corregida:**
- ✅ Rotativo = solo ON/OFF (no claves)
- ✅ Claves = se calculan por lógica
- ✅ Eventos = basados en índice SI + condiciones
- ✅ Límites = específicos para camiones

**Próximo paso:**
Implementar los 3 servicios nuevos (keyCalculator, eventDetector, speedAnalyzer)

---

_Corrección aplicada: 10 de octubre de 2025_

