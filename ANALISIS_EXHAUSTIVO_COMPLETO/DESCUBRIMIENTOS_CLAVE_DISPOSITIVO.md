# 🔬 DESCUBRIMIENTOS CLAVE DEL DISPOSITIVO DOBACK

**Fecha:** 10 de octubre de 2025  
**Análisis basado en:** 86 archivos, 31 sesiones, 3 vehículos (DOBACK024, DOBACK027, DOBACK028)

---

## 📊 HALLAZGOS PRINCIPALES

### 1. **ESTRUCTURA DE SESIONES**

#### ✅ Descubrimiento:
- **83.87%** de las sesiones contienen los 3 tipos de archivos necesarios
- Los archivos **NO son continuos**: cada sesión representa un **evento de operación**
- Las sesiones están delimitadas por el **encendido/apagado del dispositivo**

#### 🔍 Implicaciones:
- Una "sesión" = un **turno de trabajo** o **salida de emergencia**
- Los gaps entre sesiones son **normales** (vehículo aparcado/apagado)
- **NO** deben sumarse sesiones del mismo día sin criterio

---

### 2. **COMPORTAMIENTO DEL ROTATIVO**

#### ✅ Descubrimiento:
- Muestreo cada **~15 segundos**
- Estados detectados: **0 (apagado)**, **1 (encendido)**, **2** y **5** (claves especiales)
- El rotativo puede cambiar **múltiples veces** durante una sesión

#### 📊 Estadísticas:
| Vehículo | Muestras/Hora | Total Muestras | Total Horas |
|----------|---------------|----------------|-------------|
| DOBACK024 | 57.40 | 6,745 | 117.51 |
| DOBACK027 | 46.87 | 2,006 | 42.80 |
| DOBACK028 | 45.86 | 5,315 | 115.90 |

#### 🔍 Implicaciones:
- Estado **1** = **conducción en emergencia** (tiempo facturable)
- Estado **0** = vehículo parado o regreso sin emergencia
- Estados **2** y **5** podrían ser **"clave 2"** y **"clave 5"** mencionados en requisitos

---

### 3. **PÉRDIDAS DE SEÑAL GPS**

#### ✅ Descubrimiento:
- **18 sesiones afectadas** con >10% de datos GPS perdidos
- Pérdidas especialmente graves en:
  - DOBACK027 (29/09/2025): **60.74%** sin GPS
  - DOBACK028 (03/10/2025): **66.88%** sin GPS

#### 🔍 Causas probables:
1. **Entornos urbanos densos** (túneles, edificios altos)
2. **Interferencias electromagnéticas**
3. **Arranque del dispositivo** (GPS tarda en fijar)

#### 🎯 Impacto en KPIs:
- Los KM recorridos pueden estar **subestimados**
- Necesario **interpolar posiciones** o usar **acelerómetro** como backup

---

### 4. **FRECUENCIA DE MUESTREO**

#### ✅ Descubrimiento:
| Tipo | Frecuencia Promedio |
|------|---------------------|
| **ESTABILIDAD (acelerómetro)** | **~10 Hz** (datos cada 0.1s) |
| **GPS** | **~700 muestras/hora** (~1 cada 5s) |
| **ROTATIVO** | **~50 muestras/hora** (1 cada 15s) |

#### 🔍 Implicaciones:
- **Estabilidad**: datos en **tiempo real** para detección de eventos críticos
- **GPS**: suficiente para trazado de ruta pero con latencia
- **Rotativo**: suficiente para cálculo de tiempos de emergencia

---

### 5. **DURACIONES ANÓMALAS**

#### ✅ Descubrimiento:
- **15 sesiones** con duración **>12 horas** (consideradas anómalas)
- La sesión más larga: **23.06 horas** (DOBACK028, 08/10/2025)

#### 🤔 Posibles explicaciones:
1. **Dispositivo dejado encendido** sin uso
2. **Turnos de guardia** de 24 horas
3. **Eventos especiales** (grandes incendios, operaciones prolongadas)
4. **Error de apagado** del sistema

#### 🎯 Impacto en KPIs:
- Estas sesiones **distorsionan promedios**
- Necesario **validar** antes de incluir en estadísticas
- Propuesta: **marcar como "guardia"** si rotativo apagado >80% del tiempo

---

### 6. **GAPS TEMPORALES**

#### ✅ Descubrimiento:
- **24 gaps significativos** detectados entre sesiones
- Gap promedio: **~14 horas** (normal para operación de bomberos)
- Gaps más largos: hasta **23.76 horas** (vehículo sin uso por más de un día)

#### 🔍 Implicaciones:
- Los gaps **NO son errores**, reflejan operación real
- Importante **NO interpolar** datos entre sesiones
- Cada sesión debe analizarse **independientemente**

---

### 7. **SOLAPAMIENTOS DETECTADOS**

#### ⚠️ Problema:
- **2 solapamientos** detectados en DOBACK028:
  - 30/09/2025: sesiones 1 y 2 solapan por **332 minutos**
  - 06/10/2025: sesiones 1 y 2 solapan por **705 minutos**

#### 🔍 Posibles causas:
1. **Múltiples archivos del mismo día** mal etiquetados
2. **Error en numeración de sesiones**
3. **Dispositivo no apagado correctamente** entre turnos

#### 🎯 Acción requerida:
- **Revisar** estos archivos manualmente
- Pueden ser **una sola sesión** dividida incorrectamente

---

### 8. **ARCHIVOS CON MÚLTIPLES SESIONES**

#### ✅ Descubrimiento:
- Los archivos de **ESTABILIDAD** pueden contener **MÚLTIPLES sesiones** en un mismo archivo
- Ejemplo: `ESTABILIDAD_DOBACK024_20251001.txt` contiene **7 sesiones**

#### 📋 Estructura:
```
ESTABILIDAD;01/10/2025 09:36:54;DOBACK024;Sesión:1;
[datos...]
ESTABILIDAD;01/10/2025 11:06:18;DOBACK024;Sesión:2;
[datos...]
ESTABILIDAD;01/10/2025 14:22:23;DOBACK024;Sesión:3;
[datos...]
```

#### 🔍 Implicaciones:
- Cada **cambio de cabecera** = nueva sesión
- **NO** usar nombre de archivo para identificar sesiones
- Parsear archivo **línea por línea** buscando cabeceras

---

### 9. **CAMPOS DE ESTABILIDAD**

#### ✅ Descubrimiento:
Los archivos de estabilidad contienen **19 campos**:

| Campo | Descripción | Uso en KPIs |
|-------|-------------|-------------|
| `ax, ay, az` | Aceleración (mg) | Detección frenazos/aceleraciones |
| `gx, gy, gz` | Giroscopio (°/s) | Detección giros bruscos |
| `roll, pitch, yaw` | Orientación (°) | Detección vuelcos |
| `usciclo1-5` | Uso interno dispositivo | ❌ No relevante |
| `accmag` | Magnitud aceleración | Intensidad movimiento |
| `k3` | Uso interno dispositivo | ❌ No relevante |
| `si` | **Índice de estabilidad** | ✅ Indicador calidad conducción |

#### 🎯 Campos clave para eventos:
- **Frenazos**: `ay` < -300 mg
- **Aceleraciones**: `ay` > 300 mg  
- **Giros bruscos**: `|gz|` > 100°/s
- **Posible vuelco**: `|roll|` > 30° o `|pitch|` > 30°

---

### 10. **SINCRONIZACIÓN ENTRE ARCHIVOS**

#### ✅ Descubrimiento:
- Los archivos de la **misma sesión** tienen **desfases temporales** de hasta **60 segundos**
- Esto es **normal** (arranque secuencial de subsistemas)

#### 📊 Desfases típicos:
- ESTABILIDAD suele iniciar **primero**
- GPS inicia **~5-10 segundos después** (esperando fix)
- ROTATIVO inicia **al mismo tiempo que GPS**

#### 🔍 Implicaciones:
- **NO** rechazar sesiones por pequeños desfases
- Usar timestamp **más temprano** como inicio de sesión
- Usar timestamp **más tardío** como fin de sesión

---

## 🎯 CONCLUSIONES PARA CÁLCULO DE KPIs

### ✅ **KPIs Confiables:**

1. **Tiempo con rotativo encendido (Clave 2/5)**
   - Fuente: archivo ROTATIVO, contar registros con estado = 1, 2 o 5
   - Precisión: ±15 segundos (frecuencia de muestreo)

2. **Número de incidencias**
   - Fuente: archivo ESTABILIDAD, detectar picos en acelerómetro/giroscopio
   - Confiable: datos en tiempo real a 10 Hz

3. **Horas de conducción**
   - Fuente: duración de sesiones con rotativo encendido >10%
   - Filtrar sesiones anómalas >12h

### ⚠️ **KPIs que requieren validación:**

4. **Kilómetros recorridos**
   - Problema: pérdidas GPS en 18 sesiones
   - Solución: usar acelerómetro para interpolar cuando GPS no disponible

5. **Velocidad promedio**
   - Problema: datos GPS incompletos
   - Solución: solo calcular en tramos con GPS válido

6. **Eventos GPS (entrada/salida zonas)**
   - Problema: pérdidas GPS pueden causar falsos positivos/negativos
   - Solución: requiere filtrado agresivo y validación manual

---

## 🔧 RECOMENDACIONES TÉCNICAS

### Para el dispositivo:
1. ✅ **Mejorar antena GPS** - reducir pérdidas en entornos urbanos
2. ✅ **Buffer de datos** - almacenar localmente durante pérdidas GPS
3. ✅ **Timestamp único** - sincronizar arranque de todos los subsistemas
4. ✅ **Detección automática de sesiones** - evitar sesiones >12h sin justificar

### Para el procesamiento:
1. ✅ **Validar sesiones largas** - marcar como "guardia" si rotativo apagado
2. ✅ **Interpolar GPS** - usar acelerómetro cuando GPS no disponible
3. ✅ **Correlacionar por timestamp** - no por nombre de archivo
4. ✅ **Filtrar solapamientos** - unificar sesiones solapadas

### Para los KPIs:
1. ✅ **Tiempo rotativo = SUM(registros con estado 1,2,5) × 15 segundos**
2. ✅ **KM recorridos = integración GPS + compensación por pérdidas**
3. ✅ **Incidencias = eventos detectados en estabilidad con severidad**
4. ✅ **Disponibilidad = (sesiones completas / total sesiones) × 100%**

---

## 📂 ARCHIVOS GENERADOS

1. **`ANALISIS_EXHAUSTIVO_ARCHIVOS.md`** - Reporte completo en formato legible
2. **`analisis-exhaustivo-datos.json`** - Datos estructurados para procesamiento
3. **`DESCUBRIMIENTOS_CLAVE_DISPOSITIVO.md`** - Este documento

---

## 🚀 PRÓXIMOS PASOS

1. ✅ **Implementar parser definitivo** basado en estos descubrimientos
2. ✅ **Crear algoritmo de cálculo de KPIs** con validaciones
3. ✅ **Implementar detección de eventos** (frenazos, giros, etc.)
4. ✅ **Validar con datos reales** y ajustar umbrales
5. ✅ **Documentar formato final** para procesamiento automatizado

---

**Análisis completado exitosamente.**  
_Sistema DobackSoft - Análisis Exhaustivo v1.0_

