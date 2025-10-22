# 📘 GUÍA COMPLETA DEL FUNCIONAMIENTO DE DOBACKSOFT

**Fecha:** 10 de octubre de 2025  
**Propósito:** Comprensión total del sistema para cálculo correcto de KPIs

---

## 🎯 OBJETIVO DEL SISTEMA

DobackSoft es un sistema de análisis de operaciones para **vehículos de bomberos** que permite:

1. **Rastrear emergencias completas** (salida + intervención + vuelta)
2. **Calcular KPIs operacionales** (tiempos, distancias, disponibilidad)
3. **Detectar puntos negros** (zonas con alta incidencia)
4. **Analizar conducción** (velocidades, eventos de riesgo)
5. **Optimizar operaciones** basado en datos reales

---

## 🏗️ ARQUITECTURA DE DATOS

### **Tipos de Archivos**

El dispositivo DOBACK genera 3 tipos de archivos por sesión:

#### 1️⃣ **ESTABILIDAD** (Acelerómetro + Giroscopio)
```
ESTABILIDAD;30/09/2025 09:33:44;DOBACK024;Sesión:1;
ax; ay; az; gx; gy; gz; roll; pitch; yaw; timeantwifi; usciclo1; usciclo2; usciclo3; usciclo4; usciclo5; si; accmag; microsds; k3
-58.19;  15.01; 1015.77; 347.81; 1515.76; -1139.25;  -3.87;  21.39;   0.00; ...
```

**Campos clave:**
- `ax, ay, az`: Aceleración en mg (mili-g)
- `gx, gy, gz`: Giroscopio en °/s
- `roll, pitch, yaw`: Orientación en grados
- `accmag`: Magnitud de aceleración (intensidad movimiento)
- `si`: **Índice de estabilidad** (0.88-0.90 = conducción estable)
- `usciclo1-5, k3`: Uso interno del dispositivo (ignorar)
- **Frecuencia**: ~10 Hz (10 muestras/segundo)

**Uso:** Detectar frenazos, aceleraciones bruscas, giros violentos, posibles vuelcos, calidad de conducción

#### 2️⃣ **GPS** (Posicionamiento)
```
GPS;30/09/2025-09:33:37;DOBACK024;Sesión:1
HoraRaspberry,Fecha,Hora(GPS),Latitud,Longitud,Altitud,HDOP,Fix,NumSats,Velocidad(km/h)
09:40:10,01/10/2025,07:40:10,40.5343190,-3.6179127,715.9,6.03,1,05,0.43
```

**Campos clave:**
- `Latitud, Longitud`: Coordenadas WGS84
- `Velocidad(km/h)`: Velocidad instantánea
- `Fix`: 1=GPS válido, 0=sin GPS
- `NumSats`: Número de satélites (mínimo 4 para precisión)
- **Frecuencia**: ~1 muestra cada 5 segundos

**Problemas detectados:**
- ⚠️ 18 sesiones con >10% de pérdidas GPS
- ⚠️ Pérdidas típicas al arrancar (primeros 1-3 minutos)
- ⚠️ Pérdidas en túneles, edificios altos, zonas urbanas densas

**Uso:** Calcular KM recorridos, detectar origen/destino, velocidades, geocercas

#### 3️⃣ **ROTATIVO** (Estado de sirena/rotativo)
```
ROTATIVO;30/09/2025-09:33:37;DOBACK024;Sesión:1
Fecha-Hora;Estado
30/09/2025-09:33:37;0
30/09/2025-09:37:17;1
```

**Estados:**
- `0`: Rotativo apagado (vehículo en reposo o vuelta sin emergencia)
- `1`: **Clave 2** - Emergencia activa
- `2`: **Clave 5** - Otro tipo de clave (urgente sin sirena, etc.)
- `5`: Estado especial (por determinar)
- **Frecuencia**: ~1 muestra cada 15 segundos

**Uso:** Determinar si es emergencia, calcular tiempo con rotativo encendido

---

## 🚨 LÓGICA DE EMERGENCIAS

### **Concepto Fundamental**

Una **EMERGENCIA COMPLETA** consta de:

```
1. SALIDA (desde parque de bomberos con rotativo encendido)
2. INTERVENCIÓN (en el lugar del incidente)
3. VUELTA (regreso al parque sin rotativo)
```

### **Clasificación de Sesiones**

| Tipo | Origen | Destino | Rotativo | Interpretación |
|------|--------|---------|----------|----------------|
| **SALIDA_EMERGENCIA** | Parque | Otro lugar | ENCENDIDO | Salida a emergencia |
| **VUELTA_EMERGENCIA** | Otro lugar | Parque | APAGADO | Regreso de emergencia |
| **RECORRIDO_COMPLETO** | Parque | Parque | Variable | Salida + vuelta en 1 sesión |
| **TRASLADO** | Otro | Otro | Cualquiera | Traslado entre puntos |
| **PRUEBA** | Parque | Parque | APAGADO | Prueba o mantenimiento |

### **Correlación Ida/Vuelta**

Para calcular el **TIEMPO TOTAL DE EMERGENCIA**:

```javascript
// Buscar SALIDA_EMERGENCIA
const salida = sesiones.find(s => 
  s.tipo === 'SALIDA_EMERGENCIA' &&
  s.fecha === fecha_actual
);

// Buscar VUELTA_EMERGENCIA dentro de las próximas N sesiones
const vuelta = sesiones.find(s => 
  s.tipo === 'VUELTA_EMERGENCIA' &&
  (s.timestamp_inicio - salida.timestamp_fin) < 30_MINUTOS
);

if (salida && vuelta) {
  const emergencia = {
    tiempo_total: vuelta.timestamp_fin - salida.timestamp_inicio,
    tiempo_rotativo: salida.tiempoRotativoEncendido,
    km_recorridos: salida.kmRecorridos + vuelta.kmRecorridos,
    lugar_emergencia: salida.destino
  };
}
```

### **Detección de Parques de Bomberos**

**Método 1: Heurística (implementado)**
```javascript
// Si inicio y fin de sesión están a <100m, probablemente es el parque
if (distancia(inicio, fin) < 100m) {
  parque = promedio(inicio, fin);
}
```

**Método 2: Integración Radar.com** (recomendado)
```javascript
// Definir geocercas de parques conocidos
const parques = [
  { nombre: 'Parque Central', lat: 40.xxx, lon: -3.xxx, radio: 100 },
  { nombre: 'Parque Norte', lat: 40.yyy, lon: -3.yyy, radio: 100 }
];

// Detectar entrada/salida
if (puntoEstaEnGeocerca(posicion, parque)) {
  // ...
}
```

---

## 📊 CÁLCULO DE KPIS

### **KPI 1: Tiempo de Emergencia**

**Definición:** Tiempo total desde salida del parque hasta regreso

**Cálculo:**
```
Tiempo Emergencia = (Timestamp Vuelta Fin) - (Timestamp Salida Inicio)
```

**Componentes:**
- Tiempo con rotativo encendido (solo ida)
- Tiempo de intervención (rotativo apagado en destino)
- Tiempo de vuelta (sin rotativo)

**Código:**
```javascript
function calcularTiempoEmergencia(salida, vuelta) {
  const total = (vuelta.timestamp_fin - salida.timestamp_inicio) / 60000; // minutos
  const rotativo = salida.tiempoRotativoEncendido; // minutos
  const intervencion = total - rotativo - vuelta.duracion;
  
  return { total, rotativo, intervencion, vuelta: vuelta.duracion };
}
```

### **KPI 2: Kilómetros Recorridos**

**Definición:** Distancia total recorrida por el vehículo

**Cálculo:**
```javascript
function calcularKmRecorridos(datosGPS) {
  let km = 0;
  const gpsValidos = datosGPS.filter(d => d.fix === 1 && d.numSats >= 4);
  
  for (let i = 1; i < gpsValidos.length; i++) {
    const dist = haversine(
      gpsValidos[i-1].lat, gpsValidos[i-1].lon,
      gpsValidos[i].lat, gpsValidos[i].lon
    );
    
    // Filtrar saltos imposibles (>100m en 5s = >72 km/h)
    if (dist < 100) {
      km += dist / 1000;
    }
  }
  
  return km;
}
```

**Compensación de pérdidas GPS:**
```javascript
// Si hay gap GPS >30 segundos, estimar con velocidad previa
if (gap > 30000) {
  const velocidadPromedio = velocidadUltimos3Puntos();
  const distanciaEstimada = velocidadPromedio * (gap / 3600000); // km
  km += distanciaEstimada;
}
```

### **KPI 3: Horas de Conducción**

**Definición:** Tiempo que el vehículo estuvo en movimiento

**Cálculo:**
```javascript
function calcularHorasConduccion(sesiones) {
  let horas = 0;
  
  sesiones.forEach(sesion => {
    // Solo contar si hay movimiento (velocidad > 5 km/h en >10% del tiempo)
    const tiempoMovimiento = sesion.datosGPS.filter(d => d.velocidad > 5).length * 5 / 3600; // horas
    
    if (tiempoMovimiento > sesion.duracion * 0.1) {
      horas += sesion.duracion / 60; // convertir minutos a horas
    }
  });
  
  return horas;
}
```

### **KPI 4: Número de Incidencias**

**Definición:** Eventos de conducción detectados por el acelerómetro

**Umbrales:**
```javascript
const UMBRALES = {
  FRENAZO_BRUSCO: { ay: -300 },       // mg
  ACELERACION_BRUSCA: { ay: 300 },    // mg
  GIRO_BRUSCO: { gz: 100 },           // °/s
  VUELCO_PELIGRO: { roll: 30, pitch: 30 } // grados
};
```

**Severidad:**
```javascript
function calcularSeveridad(evento) {
  if (evento.tipo === 'VUELCO_PELIGRO') return 'CRITICA';
  if (Math.abs(evento.valor) > evento.umbral * 2) return 'ALTA';
  return 'MEDIA';
}
```

### **KPI 5: Velocidad Promedio**

**Cálculo:**
```javascript
function calcularVelocidadPromedio(datosGPS) {
  const velocidades = datosGPS
    .filter(d => d.fix === 1 && d.velocidad > 0)
    .map(d => d.velocidad);
  
  return velocidades.reduce((a, b) => a + b, 0) / velocidades.length;
}
```

### **KPI 6: Tiempo con Rotativo Encendido (Clave 2)**

**Cálculo:**
```javascript
function calcularTiempoRotativo(datosRotativo) {
  const muestrasEncendidas = datosRotativo.filter(r => 
    r.estado === '1' || r.estado === '2'
  ).length;
  
  // Cada muestra = 15 segundos
  return (muestrasEncendidas * 15) / 60; // minutos
}
```

### **KPI 7: Disponibilidad**

**Definición:** % de tiempo que el vehículo está operativo

**Cálculo:**
```javascript
function calcularDisponibilidad(sesiones) {
  const sesionesValidas = sesiones.filter(s => 
    s.completa && 
    s.datosGPS.length > 0 && 
    s.datosRotativo.length > 0
  );
  
  return (sesionesValidas.length / sesiones.length) * 100;
}
```

---

## 🗺️ PUNTOS NEGROS

### **Definición**

Zonas geográficas con **alta concentración de eventos de conducción** (frenazos, giros bruscos, etc.)

### **Detección**

```javascript
function detectarPuntosNegros(eventos, radioMetros = 50) {
  const grupos = [];
  
  eventos.forEach(evento => {
    // Buscar grupo cercano
    const grupoExistente = grupos.find(g => 
      distancia(evento.lat, evento.lon, g.lat, g.lon) < radioMetros
    );
    
    if (grupoExistente) {
      grupoExistente.eventos.push(evento);
      grupoExistente.count++;
      // Recalcular centro
      grupoExistente.lat = avg(grupoExistente.eventos.map(e => e.lat));
      grupoExistente.lon = avg(grupoExistente.eventos.map(e => e.lon));
    } else {
      grupos.push({
        lat: evento.lat,
        lon: evento.lon,
        count: 1,
        eventos: [evento]
      });
    }
  });
  
  // Ordenar por cantidad
  return grupos.sort((a, b) => b.count - a.count);
}
```

### **Uso con TomTom**

```javascript
async function enriquecerPuntoNegro(punto) {
  const response = await tomtom.reverseGeocode(punto.lat, punto.lon);
  
  return {
    ...punto,
    direccion: response.address.freeformAddress,
    tipoVia: response.address.streetType,
    limiteVelocidad: response.speedLimit,
    municipio: response.address.municipality
  };
}
```

---

## 🚦 ANÁLISIS DE VELOCIDADES

### **Comparación con Límites**

```javascript
async function analizarVelocidades(datosGPS) {
  const excesos = [];
  
  for (const punto of datosGPS) {
    if (!punto.valida || punto.velocidad === 0) continue;
    
    // Obtener límite de TomTom
    const limite = await tomtom.getSpeedLimit(punto.lat, punto.lon);
    
    if (punto.velocidad > limite) {
      excesos.push({
        lat: punto.lat,
        lon: punto.lon,
        velocidad: punto.velocidad,
        limite,
        exceso: punto.velocidad - limite,
        porcentaje: ((punto.velocidad - limite) / limite) * 100
      });
    }
  }
  
  return excesos;
}
```

### **Excepciones en Emergencias**

```javascript
// En emergencias, permitir excesos de hasta 20 km/h
function esExcesoJustificado(exceso, esEmergencia) {
  if (esEmergencia && exceso.exceso <= 20) {
    return true; // Permitido en emergencias
  }
  return false;
}
```

---

## 🔗 INTEGRACIÓN CON APIS EXTERNAS

### **1. Radar.com - Geocercas**

**Uso:** Definir y monitorizar parques de bomberos

```javascript
// Definir geocerca
const geocerca = {
  nombre: 'Parque Central Bomberos',
  tipo: 'CIRCLE',
  centro: { lat: 40.4168, lon: -3.7038 },
  radio: 100 // metros
};

// Detectar entrada/salida
function verificarGeocerca(posicion, geocerca) {
  const distancia = haversine(
    posicion.lat, posicion.lon,
    geocerca.centro.lat, geocerca.centro.lon
  );
  
  return distancia <= geocerca.radio;
}

// Eventos automáticos
if (verificarGeocerca(posicionActual, parque) && !dentroPreviamente) {
  emit('ENTRADA_PARQUE', { vehiculo, timestamp });
}
if (!verificarGeocerca(posicionActual, parque) && dentroPreviamente) {
  emit('SALIDA_PARQUE', { vehiculo, timestamp });
}
```

**Beneficios:**
- ✅ Detección automática de salidas/vueltas
- ✅ Clasificación precisa de sesiones
- ✅ Alertas si vehículo se desvía de zona asignada

### **2. TomTom - Límites y Rutas**

**Uso 1: Obtener límites de velocidad**
```javascript
async function getLimiteVelocidad(lat, lon) {
  const response = await fetch(`https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${lat},${lon}&key=${API_KEY}`);
  const data = await response.json();
  return data.flowSegmentData.currentSpeed;
}
```

**Uso 2: Direcciones de puntos negros**
```javascript
async function getDireccion(lat, lon) {
  const response = await fetch(`https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${API_KEY}`);
  const data = await response.json();
  return data.addresses[0].address.freeformAddress;
}
```

**Uso 3: Optimizar rutas**
```javascript
async function calcularRutaOptima(origen, destino) {
  const response = await fetch(`https://api.tomtom.com/routing/1/calculateRoute/${origen.lat},${origen.lon}:${destino.lat},${destino.lon}/json?key=${API_KEY}&traffic=true&vehicleCommercial=true`);
  const data = await response.json();
  
  return {
    distancia: data.routes[0].summary.lengthInMeters / 1000,
    tiempoEstimado: data.routes[0].summary.travelTimeInSeconds / 60,
    rutaOptimizada: data.routes[0].legs[0].points
  };
}
```

---

## 📈 DASHBOARD Y VISUALIZACIÓN

### **Componentes Principales**

1. **Panel KPIs en Tiempo Real**
   - Emergencias activas
   - Vehículos disponibles
   - Tiempo promedio respuesta
   - KM recorridos hoy

2. **Mapa Interactivo**
   - Posición actual de vehículos
   - Geocercas de parques
   - Puntos negros marcados
   - Rutas de emergencias

3. **TV Wall Mode**
   - KPIs grandes y visibles
   - Colores por severidad
   - Rotación automática de datos
   - Sin menús ni controles

4. **Reportes**
   - Exportación PDF con métricas
   - Gráficas de tendencias
   - Comparativas entre vehículos
   - Análisis IA de patrones

---

## 🎓 CASOS DE USO REALES

### **Caso 1: Emergencia Típica**

```
09:36:47 - Salida del Parque Central
         - Rotativo ENCENDIDO (Clave 2)
         - GPS: 40.5343, -3.6179
         
09:45:32 - Llegada al destino (4.2 km)
         - Rotativo APAGADO
         - Eventos: 2 frenazos bruscos, 1 giro brusco
         
10:15:20 - Fin intervención
         - Vehículo parado
         
10:23:45 - Regreso al parque (4.3 km)
         - Rotativo APAGADO
         - Velocidad promedio: 42 km/h
         
10:35:12 - Llegada al parque

RESULTADO:
- Tiempo total emergencia: 58 minutos 25 segundos
- Tiempo rotativo: 8 minutos 45 segundos
- KM recorridos: 8.5 km
- Incidencias: 3 (severidad media)
```

### **Caso 2: Múltiples Emergencias (día completo)**

```
Sesión 1: 09:36 - 10:35 | Emergencia | 8.5 km | Clave 2
Sesión 2: 11:06 - 11:32 | Prueba    | 2.1 km | Sin rotativo
Sesión 3: 14:22 - 15:48 | Emergencia | 12.3 km | Clave 2
Sesión 4: 16:18 - 16:45 | Traslado  | 3.2 km | Sin rotativo
Sesión 5: 17:14 - 18:20 | Emergencia | 15.7 km | Clave 2

KPIs DEL DÍA:
- Total emergencias: 3
- KM totales: 41.8 km
- Tiempo rotativo: 47 minutos
- Horas de conducción: 4.2 horas
- Incidencias: 12 (8 medias, 3 altas, 1 crítica)
- Disponibilidad: 100%
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### **Fase 1: Parseo de Datos**
- [ ] Leer archivos ESTABILIDAD (detectar cabeceras múltiples)
- [ ] Leer archivos GPS (validar fix y satélites)
- [ ] Leer archivos ROTATIVO
- [ ] Correlacionar por timestamp
- [ ] Manejar pérdidas GPS

### **Fase 2: Detección de Emergencias**
- [ ] Detectar parques de bomberos (heurística)
- [ ] Clasificar sesiones (salida/vuelta/completo)
- [ ] Correlacionar ida + vuelta
- [ ] Calcular tiempos totales

### **Fase 3: Cálculo de KPIs**
- [ ] Tiempo emergencia
- [ ] KM recorridos (con compensación GPS)
- [ ] Horas conducción
- [ ] Incidencias (con severidad)
- [ ] Velocidades
- [ ] Disponibilidad

### **Fase 4: Puntos Negros**
- [ ] Detectar eventos con ubicación
- [ ] Agrupar por proximidad
- [ ] Clasificar por severidad
- [ ] Enriquecer con TomTom

### **Fase 5: Integración APIs**
- [ ] Radar.com - Geocercas parques
- [ ] TomTom - Límites velocidad
- [ ] TomTom - Direcciones
- [ ] TomTom - Rutas optimizadas

### **Fase 6: Dashboard**
- [ ] Panel KPIs en tiempo real
- [ ] Mapa con vehículos
- [ ] TV Wall mode
- [ ] Exportación PDF

---

## 🚀 PRÓXIMOS PASOS

1. ✅ **Completar análisis de datos existentes**
   - Parsear correctamente todos los archivos
   - Generar KPIs reales con datos actuales
   - Validar cálculos

2. ✅ **Implementar detección de emergencias**
   - Correlacionar salidas/vueltas
   - Calcular tiempos totales
   - Clasificar sesiones

3. ✅ **Integrar APIs externas**
   - Configurar Radar.com
   - Configurar TomTom
   - Probar con datos reales

4. ✅ **Optimizar dashboard**
   - Implementar TV Wall mode
   - Mejorar visualización de KPIs
   - Añadir exportación PDF

5. ✅ **Validar con cliente**
   - Revisar KPIs calculados
   - Ajustar umbrales
   - Refinar lógica de emergencias

---

**Este documento es la base completa para el desarrollo de DobackSoft.**  
**Todo el sistema debe construirse siguiendo esta lógica operacional.**

_Documento generado por análisis exhaustivo de 86 archivos, 31 sesiones, 3 vehículos._

