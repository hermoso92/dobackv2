# 📊 REPORTE: SESIONES ESPERADAS (GPS + >= 5 MIN)

**Configuración:** GPS obligatorio + Duración >= 5 minutos (300s)

---

## 📈 RESUMEN EJECUTIVO

```
✅ Análisis Real (GPS + >= 5 min):  85 sesiones
❌ Sistema detectó (última vez):    44 sesiones
📉 Faltan:                          41 sesiones (48%)
```

**Distribución por vehículo:**
- DOBACK024: 22 esperadas → ? detectadas
- DOBACK027: 23 esperadas → ? detectadas
- DOBACK028: 40 esperadas → ? detectadas

---

## 🚗 DOBACK024 (22 sesiones esperadas)

### 30/09/2025 (1 sesión)
1. ✅ 09:33:37 → 10:38:25 (1h 4m 48s)

### 01/10/2025 (3 sesiones)
1. ✅ 09:36:47 → 10:04:33 (27m 46s)
2. ❌ 11:06:11 → 11:07:35 (1m 24s) **< 5 min - NO DEBERÍA INCLUIRSE**
3. ✅ 14:22:16 → 14:49:47 (27m 31s)

**Corrección:** Solo 2 sesiones >= 5 min (no 3)

### 02/10/2025 (1 sesión)
1. ✅ 00:29:57 → 01:34:01 (1h 4m 4s)

### 03/10/2025 (3 sesiones)
1. ✅ 09:46:49 → 10:35:10 (48m 21s)
2. ✅ 20:10:57 → 21:04:00 (53m 3s)
3. ✅ 21:06:09 → 22:09:30 (1h 3m 21s)

### 04/10/2025 (1 sesión)
1. ✅ 09:44:53 → 10:04:03 (19m 10s)

### 05/10/2025 (3 sesiones)
1. ✅ 00:28:33 → 00:57:54 (29m 21s)
2. ✅ 09:10:21 → 09:18:55 (8m 34s)
3. ✅ 09:43:20 → 10:02:36 (19m 16s)

### 06/10/2025 (1 sesión)
1. ✅ 09:34:43 → 10:51:27 (1h 16m 44s)

### 07/10/2025 (3 sesiones)
1. ✅ 03:22:45 → 04:40:32 (1h 17m 47s)
2. ✅ 04:50:48 → 06:42:06 (1h 51m 18s)
3. ✅ 07:26:08 → 08:43:30 (1h 17m 22s)

### 08/10/2025 (7 sesiones)
1. ✅ 04:43:29 → 05:41:33 (58m 4s)
2. ✅ 05:49:45 → 06:26:19 (36m 34s)
3. ✅ 11:13:27 → 11:24:31 (11m 4s)
4. ✅ 13:06:11 → 13:15:32 (9m 21s)
5. ✅ 16:39:48 → 17:36:56 (57m 8s)
6. ✅ 21:30:57 → 21:40:38 (9m 41s)
7. ✅ 23:14:50 → 23:29:03 (14m 13s)

**Total DOBACK024:** 21-22 sesiones (algunas < 5 min en el análisis)

---

## 🚗 DOBACK027 (23 sesiones esperadas)

Análisis similar muestra 23 sesiones con GPS >= 5 min distribuidas en:
- 29/09: 2 sesiones
- 30/09: 1 sesión
- 01/10: 4 sesiones
- 02/10: 3 sesiones
- 03/10: 2 sesiones
- 04/10: 4 sesiones
- 05/10: 2 sesiones
- 06/10: 1 sesión
- 07/10: 2 sesiones (>= 5 min)
- 08/10: 2 sesiones

---

## 🚗 DOBACK028 (40 sesiones esperadas)

Análisis muestra ~40 sesiones con GPS >= 5 min

---

## 🔍 ANÁLISIS DE LA DISCREPANCIA

### ¿Por qué el sistema detectó solo 44 de 85?

**Posibles causas:**

1. **Umbral de correlación 120s muy estricto**
   - Análisis real usa 120s: `|Inicio|≤120s`
   - Pero en la práctica, GPS puede tardar más
   - Logs muestran: `"Diferencia ESTABILIDAD-GPS excede 120s: 224s"`

2. **Duración cerca de 5 minutos**
   - Sesión de 4m 59s rechazada pero análisis dice "~ 5 min"
   - Problema de redondeo en cálculos

3. **Problema en detección de sesiones GPS**
   - DOBACK028 08/10/2025: 7 sesiones GPS vs 2 detectadas
   - GPS fragmentado no se correlaciona correctamente

4. **Diferentes archivos procesados**
   - El sistema procesó `backend/data/CMadrid/`
   - El análisis podría ser de otra fuente

---

## 💡 SIGUIENTE PASO

Necesito verificar si las **44 sesiones detectadas** son un subconjunto correcto de las 85 esperadas, o si son diferentes.

Para eso, **reprocesa desde el frontend** y luego ejecuta:

```bash
node comparar-con-mismo-filtro.js
```

Esto mostrará exactamente cuáles de las 85 sesiones esperadas se detectaron y cuáles faltan.

---

**¿Quieres que reprocese ahora via HTTP para comparar, o prefieres hacerlo desde el frontend?**

