# 📊 CAMPOS DE ESTABILIDAD - DETALLE COMPLETO

**Actualizado:** 10 de octubre de 2025

---

## 📋 ESTRUCTURA DEL ARCHIVO ESTABILIDAD

```
ESTABILIDAD;30/09/2025 09:33:44;DOBACK024;Sesión:1;
ax; ay; az; gx; gy; gz; roll; pitch; yaw; timeantwifi; usciclo1; usciclo2; usciclo3; usciclo4; usciclo5; si; accmag; microsds; k3
-58.19;  15.01; 1015.77; 347.81; 1515.76; -1139.25;  -3.87;  21.39;   0.00; 127120.00; 29443.00; 10499.00; 20000.00; 20000.00; 20000.00;   0.90; 1017.55;   0.00;   0.85;
```

---

## 🎯 CAMPOS RELEVANTES PARA ANÁLISIS

### **1. Acelerómetro (Aceleración Lineal)**

| Campo | Unidad | Rango Típico | Uso |
|-------|--------|--------------|-----|
| **`ax`** | mg | -1000 a +1000 | Aceleración lateral |
| **`ay`** | mg | -1000 a +1000 | **Aceleración longitudinal** (frenazos/aceleraciones) |
| **`az`** | mg | 800 a 1200 | Aceleración vertical (gravedad + movimiento) |

**Detección de Eventos:**
```javascript
// Frenazo brusco
if (ay < -300) {
  evento = 'FRENAZO_BRUSCO';
  severidad = ay < -500 ? 'ALTA' : 'MEDIA';
}

// Aceleración brusca
if (ay > 300) {
  evento = 'ACELERACION_BRUSCA';
  severidad = ay > 500 ? 'ALTA' : 'MEDIA';
}

// Movimiento lateral (curvas)
if (Math.abs(ax) > 300) {
  evento = 'FUERZA_LATERAL';
}
```

### **2. Giroscopio (Velocidad Angular)**

| Campo | Unidad | Rango Típico | Uso |
|-------|--------|--------------|-----|
| **`gx`** | °/s | -200 a +200 | Rotación sobre eje X (balanceo) |
| **`gy`** | °/s | -200 a +200 | Rotación sobre eje Y (cabeceo) |
| **`gz`** | °/s | -200 a +200 | **Rotación sobre eje Z (giro)** |

**Detección de Eventos:**
```javascript
// Giro brusco
if (Math.abs(gz) > 100) {
  evento = 'GIRO_BRUSCO';
  severidad = Math.abs(gz) > 200 ? 'ALTA' : 'MEDIA';
}
```

### **3. Orientación (Ángulos de Euler)**

| Campo | Unidad | Rango Típico | Uso |
|-------|--------|--------------|-----|
| **`roll`** | grados | -30 a +30 | **Inclinación lateral** (peligro vuelco) |
| **`pitch`** | grados | -30 a +30 | **Inclinación frontal** (subida/bajada) |
| **`yaw`** | grados | 0 a 360 | Orientación (norte magnético) |

**Detección de Eventos:**
```javascript
// Peligro de vuelco
if (Math.abs(roll) > 30 || Math.abs(pitch) > 30) {
  evento = 'ALERTA_VUELCO';
  severidad = 'CRITICA';
}

// Pendiente pronunciada
if (Math.abs(pitch) > 15) {
  evento = 'PENDIENTE_PRONUNCIADA';
}
```

### **4. Magnitud de Aceleración**

| Campo | Unidad | Rango Típico | Uso |
|-------|--------|--------------|-----|
| **`accmag`** | mg | 800 a 1500 | **Intensidad total del movimiento** |

**Cálculo:**
```javascript
accmag = Math.sqrt(ax² + ay² + az²);
```

**Uso:**
```javascript
// Detectar movimiento general
if (accmag > 1200) {
  movimiento = 'INTENSO';
} else if (accmag > 1000) {
  movimiento = 'MODERADO';
} else {
  movimiento = 'SUAVE';
}
```

### **5. Índice de Estabilidad**

| Campo | Unidad | Rango Típico | Uso |
|-------|--------|--------------|-----|
| **`si`** | adimensional | 0.88 a 0.90 | **Calidad de conducción** |

**Interpretación:**
```javascript
if (si >= 0.90) {
  conduccion = 'EXCELENTE';
} else if (si >= 0.88) {
  conduccion = 'BUENA';
} else if (si >= 0.85) {
  conduccion = 'ACEPTABLE';
} else {
  conduccion = 'DEFICIENTE';
}
```

**Uso en KPIs:**
- Calificar calidad de conducción por sesión
- Identificar conductores con mejor/peor índice
- Tendencias de mejora/deterioro en el tiempo

---

## ❌ CAMPOS NO RELEVANTES (Uso Interno)

### **Campos a Ignorar en el Análisis**

| Campo | Descripción | Acción |
|-------|-------------|--------|
| `usciclo1` | Uso interno dispositivo | ❌ Ignorar |
| `usciclo2` | Uso interno dispositivo | ❌ Ignorar |
| `usciclo3` | Uso interno dispositivo | ❌ Ignorar |
| `usciclo4` | Uso interno dispositivo | ❌ Ignorar |
| `usciclo5` | Uso interno dispositivo | ❌ Ignorar |
| `k3` | Uso interno dispositivo | ❌ Ignorar |
| `timeantwifi` | Timestamp interno | ⚠️ No usar para análisis |
| `microsds` | Timestamp interno | ⚠️ No usar para análisis |

**Nota:** Estos campos son útiles para debugging del dispositivo pero NO deben usarse para cálculo de KPIs o detección de eventos.

---

## 📐 FÓRMULAS ÚTILES

### **Magnitud de Aceleración Total**
```javascript
accmag = Math.sqrt(ax² + ay² + az²);
```

### **Ángulo de Inclinación Total**
```javascript
inclinacion_total = Math.sqrt(roll² + pitch²);
```

### **Velocidad Angular Total**
```javascript
velocidad_angular = Math.sqrt(gx² + gy² + gz²);
```

### **Detección de Movimiento**
```javascript
// El vehículo está en movimiento si:
en_movimiento = (accmag > 1050) || (Math.abs(gz) > 10);
```

---

## 🎯 UMBRALES RECOMENDADOS

### **Para Detección de Eventos**

| Evento | Campo | Umbral | Severidad |
|--------|-------|--------|-----------|
| Frenazo Leve | `ay` | < -150 | BAJA |
| Frenazo Moderado | `ay` | < -300 | MEDIA |
| Frenazo Severo | `ay` | < -500 | ALTA |
| Aceleración Leve | `ay` | > 150 | BAJA |
| Aceleración Moderada | `ay` | > 300 | MEDIA |
| Aceleración Severa | `ay` | > 500 | ALTA |
| Giro Leve | `|gz|` | > 50 | BAJA |
| Giro Moderado | `|gz|` | > 100 | MEDIA |
| Giro Brusco | `|gz|` | > 200 | ALTA |
| Inclinación Peligrosa | `|roll|` o `|pitch|` | > 20 | MEDIA |
| Peligro Vuelco | `|roll|` o `|pitch|` | > 30 | CRITICA |

### **Para Clasificación de Conducción**

| Índice Estabilidad | Calificación | Acción |
|-------------------|--------------|--------|
| `si >= 0.90` | ⭐⭐⭐ Excelente | Sin acción |
| `0.88 <= si < 0.90` | ⭐⭐ Buena | Monitorizar |
| `0.85 <= si < 0.88` | ⭐ Aceptable | Revisar eventos |
| `si < 0.85` | ⚠️ Deficiente | **Alerta conductor** |

---

## 📊 EJEMPLO DE ANÁLISIS COMPLETO

### **Muestra Real de Datos:**
```
ax=-58.19; ay=15.01; az=1015.77; gx=347.81; gy=1515.76; gz=-1139.25; 
roll=-3.87; pitch=21.39; yaw=0.00; si=0.90; accmag=1017.55;
```

### **Análisis:**
```javascript
{
  aceleracion_lateral: -58.19,      // Leve movimiento lateral (OK)
  aceleracion_longitudinal: 15.01,  // Sin aceleración significativa (OK)
  aceleracion_vertical: 1015.77,    // Gravedad + movimiento normal (OK)
  
  giro_x: 347.81,                    // Rotación moderada (ALERTA)
  giro_y: 1515.76,                   // Rotación alta (ALERTA)
  giro_z: -1139.25,                  // ⚠️ GIRO MUY BRUSCO (EVENTO)
  
  inclinacion_lateral: -3.87,       // Inclinación leve (OK)
  inclinacion_frontal: 21.39,       // Subida/pendiente (OK)
  orientacion: 0.00,                 // Norte
  
  indice_estabilidad: 0.90,          // ⭐⭐⭐ Excelente conducción
  magnitud_aceleracion: 1017.55,    // Movimiento moderado
  
  EVENTOS_DETECTADOS: [
    {
      tipo: 'GIRO_BRUSCO',
      campo: 'gz',
      valor: -1139.25,
      severidad: 'ALTA',
      mensaje: 'Giro muy brusco detectado'
    }
  ],
  
  EVALUACION_CONDUCCION: 'EXCELENTE (si=0.90)',
  REQUIERE_ATENCION: true  // Por el giro brusco
}
```

---

## 🔧 IMPLEMENTACIÓN EN CÓDIGO

### **Parser Optimizado:**
```javascript
function parseEstabilidadLine(line) {
  const parts = line.split(';').map(p => p.trim());
  if (parts.length < 19) return null;
  
  return {
    // Campos relevantes
    ax: parseFloat(parts[0]),
    ay: parseFloat(parts[1]),
    az: parseFloat(parts[2]),
    gx: parseFloat(parts[3]),
    gy: parseFloat(parts[4]),
    gz: parseFloat(parts[5]),
    roll: parseFloat(parts[6]),
    pitch: parseFloat(parts[7]),
    yaw: parseFloat(parts[8]),
    si: parseFloat(parts[15]),
    accmag: parseFloat(parts[16]),
    
    // Ignorar: usciclo1-5 (parts[10-14]), k3 (parts[18])
  };
}
```

### **Detector de Eventos:**
```javascript
function detectarEventos(datos) {
  const eventos = [];
  
  // Frenazos
  if (datos.ay < -300) {
    eventos.push({
      tipo: 'FRENAZO_BRUSCO',
      severidad: datos.ay < -500 ? 'ALTA' : 'MEDIA',
      valor: datos.ay
    });
  }
  
  // Aceleraciones
  if (datos.ay > 300) {
    eventos.push({
      tipo: 'ACELERACION_BRUSCA',
      severidad: datos.ay > 500 ? 'ALTA' : 'MEDIA',
      valor: datos.ay
    });
  }
  
  // Giros
  if (Math.abs(datos.gz) > 100) {
    eventos.push({
      tipo: 'GIRO_BRUSCO',
      severidad: Math.abs(datos.gz) > 200 ? 'ALTA' : 'MEDIA',
      valor: datos.gz
    });
  }
  
  // Vuelco
  if (Math.abs(datos.roll) > 30 || Math.abs(datos.pitch) > 30) {
    eventos.push({
      tipo: 'ALERTA_VUELCO',
      severidad: 'CRITICA',
      roll: datos.roll,
      pitch: datos.pitch
    });
  }
  
  return eventos;
}
```

### **Evaluador de Calidad por Sesión:**
```javascript
function evaluarCalidadSesion(sesion) {
  const promedio_si = sesion.datos.reduce((sum, d) => sum + d.si, 0) / sesion.datos.length;
  
  let calificacion, estrellas;
  if (promedio_si >= 0.90) {
    calificacion = 'EXCELENTE';
    estrellas = '⭐⭐⭐';
  } else if (promedio_si >= 0.88) {
    calificacion = 'BUENA';
    estrellas = '⭐⭐';
  } else if (promedio_si >= 0.85) {
    calificacion = 'ACEPTABLE';
    estrellas = '⭐';
  } else {
    calificacion = 'DEFICIENTE';
    estrellas = '⚠️';
  }
  
  return {
    vehiculo: sesion.vehiculo,
    fecha: sesion.fecha,
    indice_promedio: promedio_si,
    calificacion,
    estrellas,
    requiere_atencion: promedio_si < 0.88
  };
}
```

---

## ✅ RESUMEN PARA DESARROLLADORES

### **Campos a Usar:**
✅ `ax, ay, az` - Acelerómetro  
✅ `gx, gy, gz` - Giroscopio  
✅ `roll, pitch, yaw` - Orientación  
✅ `si` - Índice de estabilidad  
✅ `accmag` - Magnitud aceleración  

### **Campos a Ignorar:**
❌ `usciclo1, usciclo2, usciclo3, usciclo4, usciclo5`  
❌ `k3`  
⚠️ `timeantwifi, microsds` (usar timestamp de cabecera)

### **KPIs Derivados:**
📊 Número de incidencias por tipo  
📊 Severidad promedio de eventos  
📊 Calidad de conducción por vehículo (índice si)  
📊 Comparativa entre vehículos  
📊 Zonas con más eventos (puntos negros)

---

_Documento actualizado con información validada del cliente_

