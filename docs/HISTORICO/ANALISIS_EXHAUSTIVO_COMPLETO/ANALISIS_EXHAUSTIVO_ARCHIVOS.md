# ANÁLISIS EXHAUSTIVO DE ARCHIVOS DOBACK

**Fecha de análisis:** 10/10/2025, 4:12:19

---

## 📊 RESUMEN EJECUTIVO

- **Vehículos analizados:** 3
- **Total de archivos procesados:** 86
- **Total de sesiones identificadas:** 31
- **Problemas críticos detectados:** 2
- **Hallazgos relevantes:** 1

## 🔍 HALLAZGOS GLOBALES

1. Se procesaron 86 archivos correspondientes a 31 sesiones de 3 vehículos.

## 🚨 PROBLEMAS CRÍTICOS

1. **Sesiones incompletas**: DOBACK028 tiene 36.36% de sesiones incompletas
   - Afectados: doback028
2. **Alta tasa de errores**: DOBACK028 tiene 3 archivos con errores
   - Afectados: doback028

## 🚗 ANÁLISIS POR VEHÍCULO

### DOBACK024

#### Estadísticas Generales

| Métrica | Valor |
|---------|-------|
| Total de archivos | 28 |
| Archivos válidos | 28 |
| Archivos con errores | 0 |
| Total de sesiones | 10 |
| Sesiones completas | 9 |
| % Sesiones completas | 90.00% |
| Líneas totales procesadas | 1.148.694 |
| Líneas válidas | 1.148.409 |
| % Líneas válidas | 99.98% |
| Duración total registrada | 174.57 horas |

#### ⚠️ Sesiones con Anomalías (8)

**01/10/2025 - Sesión 1**
- Duración muy larga: 13.78 horas

**02/10/2025 - Sesión 1**
- Duración muy larga: 19.53 horas

**03/10/2025 - Sesión 1**
- Duración muy larga: 13.04 horas

**04/10/2025 - Sesión 1**
- Duración muy larga: 14.02 horas

**05/10/2025 - Sesión 1**
- Duración muy larga: 16.36 horas

**07/10/2025 - Sesión 1**
- Duración muy larga: 17.56 horas

**08/10/2025 - Sesión 1**
- Duración muy larga: 12.89 horas

**09/10/2025 - Sesión 1**
- Sesión incompleta: faltan archivos de estabilidad, ROTATIVO

#### ⏱️ Gaps Temporales Detectados (9)

| Sesión Anterior | Sesión Posterior | Gap (minutos) | Gap (horas) |
|----------------|------------------|---------------|-------------|
| 30/09/2025 S1 | 01/10/2025 S1 | 1170.98 | 19.52 |
| 01/10/2025 S1 | 02/10/2025 S1 | 66.18 | 1.10 |
| 02/10/2025 S1 | 03/10/2025 S1 | 825.30 | 13.75 |
| 03/10/2025 S1 | 04/10/2025 S1 | 655.55 | 10.93 |
| 04/10/2025 S1 | 05/10/2025 S1 | 42.47 | 0.71 |
| 05/10/2025 S1 | 06/10/2025 S1 | 1004.32 | 16.74 |
| 06/10/2025 S1 | 07/10/2025 S1 | 720.57 | 12.01 |
| 07/10/2025 S1 | 08/10/2025 S1 | 467.32 | 7.79 |
| 08/10/2025 S1 | 09/10/2025 S1 | 414.63 | 6.91 |

#### 📡 Patrones del Dispositivo

**Frecuencia de Muestreo:**

| Tipo | Muestras/Hora | Total Muestras | Total Horas |
|------|---------------|----------------|-------------|
| GPS | 686.45 | 39.170 | 57.06 |
| ROTATIVO | 57.40 | 6745 | 117.51 |

**Pérdidas de Señal GPS (7 sesiones afectadas):**

| Archivo | Fecha | Sesión | % Sin GPS | Líneas Sin GPS | Líneas Con GPS |
|---------|-------|--------|-----------|----------------|----------------|
| GPS_DOBACK024_20250930.txt | 30/09/2025 | 1 | 21.02% | 269 | 1011 |
| GPS_DOBACK024_20251001.txt | 01/10/2025 | 1 | 19.91% | 320 | 1287 |
| GPS_DOBACK024_20251002.txt | 02/10/2025 | 1 | 48.75% | 372 | 391 |
| GPS_DOBACK024_20251004.txt | 04/10/2025 | 1 | 55.99% | 304 | 239 |
| GPS_DOBACK024_20251005.txt | 05/10/2025 | 1 | 15.83% | 427 | 2271 |
| GPS_DOBACK024_20251006.txt | 06/10/2025 | 1 | 11.71% | 229 | 1726 |
| GPS_DOBACK024_20251008.txt | 08/10/2025 | 1 | 21.11% | 1781 | 6657 |

**Reinicios del Dispositivo Detectados (7):**

| Fecha | Sesión Anterior | Sesión Siguiente | Gap (horas) | Tipo |
|-------|-----------------|------------------|-------------|------|
| 01/10/2025 | 1 | 1 | 19.52 | gap_largo |
| 03/10/2025 | 1 | 1 | 13.76 | gap_largo |
| 04/10/2025 | 1 | 1 | 10.93 | gap_largo |
| 06/10/2025 | 1 | 1 | 16.74 | gap_largo |
| 07/10/2025 | 1 | 1 | 12.01 | gap_largo |
| 08/10/2025 | 1 | 1 | 7.79 | gap_largo |
| 09/10/2025 | 1 | 1 | 6.91 | gap_largo |

#### 📅 Patrones Temporales

**Días con datos:** 10 días
- Primer día: 01/10/2025
- Último día: 30/09/2025

**Sesiones por día:**
| Fecha | Número de Sesiones |
|-------|--------------------|
| 01/10/2025 | 1 |
| 02/10/2025 | 1 |
| 03/10/2025 | 1 |
| 04/10/2025 | 1 |
| 05/10/2025 | 1 |
| 06/10/2025 | 1 |
| 07/10/2025 | 1 |
| 08/10/2025 | 1 |
| 09/10/2025 | 1 |
| 30/09/2025 | 1 |

---

### DOBACK027

#### Estadísticas Generales

| Métrica | Valor |
|---------|-------|
| Total de archivos | 30 |
| Archivos válidos | 29 |
| Archivos con errores | 1 |
| Total de sesiones | 10 |
| Sesiones completas | 10 |
| % Sesiones completas | 100.00% |
| Líneas totales procesadas | 347.584 |
| Líneas válidas | 345.831 |
| % Líneas válidas | 99.50% |
| Duración total registrada | 83.05 horas |

#### ⚠️ Sesiones con Anomalías (2)

**01/10/2025 - Sesión 1**
- Duración muy larga: 13.52 horas

**08/10/2025 - Sesión 1**
- ROTATIVO: Alto porcentaje de líneas inválidas: 10.53%

#### ⏱️ Gaps Temporales Detectados (9)

| Sesión Anterior | Sesión Posterior | Gap (minutos) | Gap (horas) |
|----------------|------------------|---------------|-------------|
| 29/09/2025 S1 | 30/09/2025 S1 | 813.68 | 13.56 |
| 30/09/2025 S1 | 01/10/2025 S1 | 1425.50 | 23.76 |
| 01/10/2025 S1 | 02/10/2025 S1 | 626.62 | 10.44 |
| 02/10/2025 S1 | 03/10/2025 S1 | 1388.97 | 23.15 |
| 03/10/2025 S1 | 04/10/2025 S1 | 1395.42 | 23.26 |
| 04/10/2025 S1 | 05/10/2025 S1 | 1148.13 | 19.14 |
| 05/10/2025 S1 | 06/10/2025 S1 | 1022.62 | 17.04 |
| 06/10/2025 S1 | 07/10/2025 S1 | 1252.80 | 20.88 |
| 07/10/2025 S1 | 08/10/2025 S1 | 466.72 | 7.78 |

#### 📡 Patrones del Dispositivo

**Frecuencia de Muestreo:**

| Tipo | Muestras/Hora | Total Muestras | Total Horas |
|------|---------------|----------------|-------------|
| GPS | 701.22 | 28.223 | 40.25 |
| ROTATIVO | 46.87 | 2006 | 42.80 |

**Pérdidas de Señal GPS (6 sesiones afectadas):**

| Archivo | Fecha | Sesión | % Sin GPS | Líneas Sin GPS | Líneas Con GPS |
|---------|-------|--------|-----------|----------------|----------------|
| GPS_DOBACK027_20250929.txt | 29/09/2025 | 1 | 60.74% | 5295 | 3423 |
| GPS_DOBACK027_20250930.txt | 30/09/2025 | 1 | 20.98% | 286 | 1077 |
| GPS_DOBACK027_20251001.txt | 01/10/2025 | 1 | 31.81% | 881 | 1889 |
| GPS_DOBACK027_20251004.txt | 04/10/2025 | 1 | 25.19% | 299 | 888 |
| GPS_DOBACK027_20251005.txt | 05/10/2025 | 1 | 18.38% | 347 | 1541 |
| GPS_DOBACK027_20251008.txt | 08/10/2025 | 1 | 16.73% | 422 | 2101 |

**Reinicios del Dispositivo Detectados (9):**

| Fecha | Sesión Anterior | Sesión Siguiente | Gap (horas) | Tipo |
|-------|-----------------|------------------|-------------|------|
| 30/09/2025 | 1 | 1 | 13.56 | gap_largo |
| 01/10/2025 | 1 | 1 | 23.76 | gap_largo |
| 02/10/2025 | 1 | 1 | 10.44 | gap_largo |
| 03/10/2025 | 1 | 1 | 23.15 | gap_largo |
| 04/10/2025 | 1 | 1 | 23.26 | gap_largo |
| 05/10/2025 | 1 | 1 | 19.14 | gap_largo |
| 06/10/2025 | 1 | 1 | 17.04 | gap_largo |
| 07/10/2025 | 1 | 1 | 20.88 | gap_largo |
| 08/10/2025 | 1 | 1 | 7.78 | gap_largo |

#### 📅 Patrones Temporales

**Días con datos:** 10 días
- Primer día: 01/10/2025
- Último día: 30/09/2025

**Sesiones por día:**
| Fecha | Número de Sesiones |
|-------|--------------------|
| 01/10/2025 | 1 |
| 02/10/2025 | 1 |
| 03/10/2025 | 1 |
| 04/10/2025 | 1 |
| 05/10/2025 | 1 |
| 06/10/2025 | 1 |
| 07/10/2025 | 1 |
| 08/10/2025 | 1 |
| 29/09/2025 | 1 |
| 30/09/2025 | 1 |

---

### DOBACK028

#### Estadísticas Generales

| Métrica | Valor |
|---------|-------|
| Total de archivos | 28 |
| Archivos válidos | 25 |
| Archivos con errores | 3 |
| Total de sesiones | 11 |
| Sesiones completas | 7 |
| % Sesiones completas | 63.64% |
| Líneas totales procesadas | 740.912 |
| Líneas válidas | 740.064 |
| % Líneas válidas | 99.89% |
| Duración total registrada | 189.98 horas |

#### ⚠️ Sesiones con Anomalías (8)

**30/09/2025 - Sesión 2**
- Sesión incompleta: faltan archivos de GPS, ROTATIVO

**01/10/2025 - Sesión 1**
- Duración muy larga: 21.91 horas

**03/10/2025 - Sesión 1**
- Duración muy larga: 12.03 horas

**05/10/2025 - Sesión 1**
- Duración muy larga: 18.55 horas
- ROTATIVO: Alto porcentaje de líneas inválidas: 10.07%

**06/10/2025 - Sesión 2**
- Sesión incompleta: faltan archivos de GPS, ROTATIVO

**08/10/2025 - Sesión 1**
- Duración muy larga: 23.06 horas

**30/09/2025 - Sesión 1**
- Sesión incompleta: faltan archivos de estabilidad

**06/10/2025 - Sesión 1**
- Sesión incompleta: faltan archivos de estabilidad
- ROTATIVO: Alto porcentaje de líneas inválidas: 16.92%

#### ⏱️ Gaps Temporales Detectados (6)

| Sesión Anterior | Sesión Posterior | Gap (minutos) | Gap (horas) |
|----------------|------------------|---------------|-------------|
| 01/10/2025 S1 | 02/10/2025 S1 | 566.15 | 9.44 |
| 02/10/2025 S1 | 03/10/2025 S1 | 1150.90 | 19.18 |
| 03/10/2025 S1 | 04/10/2025 S1 | 743.97 | 12.40 |
| 04/10/2025 S1 | 05/10/2025 S1 | 806.00 | 13.43 |
| 05/10/2025 S1 | 06/10/2025 S1 | 408.50 | 6.81 |
| 07/10/2025 S1 | 08/10/2025 S1 | 426.32 | 7.11 |

#### 🔄 Solapamientos Detectados (2)

| Sesión 1 | Sesión 2 | Solapamiento (minutos) |
|----------|----------|------------------------|
| 30/09/2025 S1 | 30/09/2025 S2 | 332.32 |
| 06/10/2025 S1 | 06/10/2025 S2 | 705.45 |

#### 📡 Patrones del Dispositivo

**Frecuencia de Muestreo:**

| Tipo | Muestras/Hora | Total Muestras | Total Horas |
|------|---------------|----------------|-------------|
| GPS | 534.14 | 39.569 | 74.08 |
| ROTATIVO | 45.86 | 5315 | 115.90 |

**Pérdidas de Señal GPS (5 sesiones afectadas):**

| Archivo | Fecha | Sesión | % Sin GPS | Líneas Sin GPS | Líneas Con GPS |
|---------|-------|--------|-----------|----------------|----------------|
| GPS_DOBACK028_20251003.txt | 03/10/2025 | 1 | 66.88% | 1704 | 844 |
| GPS_DOBACK028_20251004.txt | 04/10/2025 | 1 | 20.44% | 497 | 1934 |
| GPS_DOBACK028_20251005.txt | 05/10/2025 | 1 | 19.34% | 945 | 3940 |
| GPS_DOBACK028_20251007.txt | 07/10/2025 | 1 | 10.47% | 890 | 7612 |
| GPS_DOBACK028_20251008.txt | 08/10/2025 | 1 | 15.43% | 557 | 3054 |

**Reinicios del Dispositivo Detectados (6):**

| Fecha | Sesión Anterior | Sesión Siguiente | Gap (horas) | Tipo |
|-------|-----------------|------------------|-------------|------|
| 02/10/2025 | 1 | 1 | 9.44 | gap_largo |
| 03/10/2025 | 1 | 1 | 19.18 | gap_largo |
| 04/10/2025 | 1 | 1 | 12.40 | gap_largo |
| 05/10/2025 | 1 | 1 | 13.43 | gap_largo |
| 06/10/2025 | 1 | 1 | 6.81 | gap_largo |
| 08/10/2025 | 1 | 1 | 7.11 | gap_largo |

#### 📅 Patrones Temporales

**Días con datos:** 9 días
- Primer día: 01/10/2025
- Último día: 30/09/2025

**Sesiones por día:**
| Fecha | Número de Sesiones |
|-------|--------------------|
| 01/10/2025 | 1 |
| 02/10/2025 | 1 |
| 03/10/2025 | 1 |
| 04/10/2025 | 1 |
| 05/10/2025 | 1 |
| 06/10/2025 | 2 |
| 07/10/2025 | 1 |
| 08/10/2025 | 1 |
| 30/09/2025 | 2 |

---

## 📋 CONCLUSIONES Y RECOMENDACIONES

### Conclusiones:

1. **Integridad de Datos**: 83.87% de las sesiones contienen los 3 tipos de archivos (ESTABILIDAD, GPS, ROTATIVO).
2. **Anomalías Detectadas**: Se identificaron 18 sesiones con anomalías en total.
3. **Continuidad Temporal**: Se detectaron 24 gaps temporales significativos entre sesiones.

### Recomendaciones:

1. **Mejorar captura de datos**: Menos del 90% de las sesiones están completas. Revisar el proceso de grabación.
2. **Revisar continuidad**: Hay muchos gaps temporales. Verificar si el dispositivo se apaga/reinicia con frecuencia.
3. **Verificar sincronización**: Revisar desfases temporales entre archivos de la misma sesión.
4. **Monitorizar pérdidas GPS**: Algunas sesiones muestran alto porcentaje de datos sin GPS.

---

_Reporte generado automáticamente por el sistema de análisis DobackSoft_
