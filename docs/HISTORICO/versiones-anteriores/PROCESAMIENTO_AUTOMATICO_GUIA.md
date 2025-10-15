# 🚀 GUÍA DE PROCESAMIENTO AUTOMÁTICO DE TODOS LOS VEHÍCULOS

## 📋 Resumen

Se ha implementado un **sistema completo de procesamiento automático** que:
- ✅ Analiza toda la carpeta `backend\data\CMadrid`
- ✅ Identifica automáticamente todos los vehículos y fechas
- ✅ Procesa 21 conjuntos completos de archivos
- ✅ Filtra sesiones inválidas (<5 min, sin GPS)
- ✅ Detecta y guarda eventos automáticamente
- ✅ Genera lista de procesamiento en JSON

---

## 📊 ANÁLISIS COMPLETO DE CMADRID

### Estructura Encontrada:

**3 Vehículos**:
- **DOBACK024**: 7 fechas completas (2025-09-30 a 2025-10-06)
- **DOBACK027**: 7 fechas completas (2025-09-30 a 2025-10-06)
- **DOBACK028**: 7 fechas completas (2025-09-30 a 2025-10-06)

**Total**: **21 conjuntos completos** listos para procesar

### Conjuntos Completos (ESTABILIDAD + GPS + ROTATIVO):

1. DOBACK024 - 20250930
2. DOBACK024 - 20251001
3. DOBACK024 - 20251002
4. DOBACK024 - 20251003
5. DOBACK024 - 20251004
6. DOBACK024 - 20251005
7. DOBACK024 - 20251006
8. DOBACK027 - 20250930
9. DOBACK027 - 20251001
10. DOBACK027 - 20251002
11. DOBACK027 - 20251003
12. DOBACK027 - 20251004
13. DOBACK027 - 20251005
14. DOBACK027 - 20251006
15. DOBACK028 - 20250930
16. DOBACK028 - 20251001
17. DOBACK028 - 20251002
18. DOBACK028 - 20251003
19. DOBACK028 - 20251004
20. DOBACK028 - 20251005
21. DOBACK028 - 20251006

**⚠️ Conjuntos Incompletos (5)**: Se ignoran automáticamente

---

## 🔧 ARCHIVOS CREADOS

### 1. `auto-process-list.json`
- Lista completa de los 21 conjuntos con rutas absolutas
- Generado automáticamente por el análisis
- Usado por el endpoint de procesamiento automático

### 2. `procesar-todos-vehiculos.ps1`
- Script PowerShell para ejecutar todo el proceso
- Incluye confirmaciones y opciones
- Muestra progreso y resultados

### 3. Backend: Endpoint `/api/upload/process-all-cmadrid`
- Procesa todos los archivos de la lista
- Filtra sesiones inválidas
- Detecta y guarda eventos
- Devuelve resumen completo

---

## ✅ CÓMO USAR EL SISTEMA

### OPCIÓN 1: Usando el Script PowerShell (Recomendado)

```powershell
.\procesar-todos-vehiculos.ps1
```

**El script**:
1. Verifica que el backend esté corriendo
2. Genera la lista de archivos
3. Pregunta confirmación
4. Ofrece limpiar BD antes de procesar
5. Procesa todos los archivos automáticamente
6. Muestra resumen completo

### OPCIÓN 2: Usando el Endpoint Directamente

#### Paso 1: Generar lista
```bash
node analyze-cmadrid-complete.js
```

#### Paso 2: Limpiar BD (opcional)
```http
POST http://localhost:9998/api/clean-all-sessions
```

#### Paso 3: Procesar todo
```http
POST http://localhost:9998/api/upload/process-all-cmadrid
```

---

## 📊 RESULTADO ESPERADO

### Durante el Procesamiento:

```
🚀 Iniciando procesamiento automático de todos los archivos de CMadrid...
📋 Total conjuntos a procesar: 21

================================================================================
🔄 Procesando: DOBACK024 - 20250930
================================================================================
✅ ESTABILIDAD: 2 sesiones
✅ GPS: 1 sesiones  
✅ ROTATIVO: 2 sesiones
📊 Números de sesión: 1, 2
🔄 Creadas 2 sesiones unificadas

🔍 Guardando sesión unificada: DOBACK024 - Sesión 1 - 45,059 mediciones
✅ Sesión válida: 44,559s, 505 GPS, 44,559 estabilidad
💾 Guardando 44,559 mediciones de estabilidad...
🚨 Guardando 0 eventos de estabilidad...  (sin eventos porque si > 0.50)
✅ Sesión 1 guardada exitosamente

⏭️ Sesión 2 descartada (506 mediciones < 5 min)

✅ DOBACK024 20250930: 1 guardada, 1 descartada

... (repetir para los 21 conjuntos)

================================================================================
📊 RESUMEN FINAL:
   Total conjuntos procesados: 21
   Sesiones guardadas: ~60-80 (estimado)
   Sesiones descartadas: ~40-60 (sesiones cortas)
   Errores: 0
================================================================================
```

### Resumen en PowerShell:

```
✅ PROCESAMIENTO COMPLETADO
============================

📊 Resumen:
   Total conjuntos: 21
   Sesiones guardadas: 65
   Sesiones descartadas: 48
   Errores: 0

📋 Detalle por vehículo:
   ✅ DOBACK024 20250930: 1 guardadas, 1 descartadas
   ✅ DOBACK024 20251001: 3 guardadas, 4 descartadas
   ✅ DOBACK024 20251002: 1 guardadas, 5 descartadas
   ...

🎉 ¡Procesamiento completado! Ahora puedes ver las sesiones en el frontend.
```

---

## 🚨 CRITERIOS DE FILTRADO

### Sesiones que SE GUARDAN:
- ✅ Duración >= 5 minutos (>= 300 segundos)
- ✅ Puntos GPS >= 10
- ✅ Mediciones totales >= 300

### Sesiones que SE DESCARTAN:
- ❌ Sesiones de prueba (pocas mediciones)
- ❌ Sesiones sin GPS suficiente
- ❌ Sesiones muy cortas (<5 min)

**Resultado**: Solo sesiones válidas y útiles en la BD

---

## 📈 EVENTOS DETECTADOS

### Lógica de Detección:

**REGLA BASE**: Solo generar eventos si `si < 0.50` (50% de estabilidad)

Dentro de eventos (si < 0.50), clasificar:
- **Riesgo de Vuelco**: `si < 0.30` (30%) O `roll > 10°`
- **Vuelco Inminente**: `si < 0.10` (10%) Y (`roll > 15°` O `gx > 30°/s`)
- **Deriva Peligrosa**: `|gx| > 1000°/s`
- **Maniobra Brusca**: `|ay| > 300 mg`

### Nota sobre Datos Actuales:

**DOBACK028 - 2025-10-01**: **0 eventos detectados**
- Razón: Índice de estabilidad (si) siempre > 0.50 (rango 0.55-1.60)
- Esto es **NORMAL** → Conducción estable, sin eventos críticos
- El sistema funciona correctamente

**Para ver eventos**: Necesitas archivos con `si < 0.50` en algunas mediciones

---

## 🔍 VERIFICACIÓN POST-PROCESAMIENTO

### En el Frontend:

1. Ir a "Sesiones & Recorridos"
2. Deberías ver ~60-80 sesiones de 3 vehículos
3. Todas las sesiones tendrán >= 10 puntos GPS
4. Todas las sesiones tendrán >= 5 minutos de duración

### En el Mapa:

1. Seleccionar cualquier sesión
2. Ver ruta azul realista (callejeado 300m)
3. Si la sesión tiene eventos (si < 0.50), verás marcadores 🚨⚡💨
4. Click en eventos para ver detalles

### En la Base de Datos:

```sql
-- Verificar sesiones guardadas
SELECT COUNT(*) FROM "Session";
-- Esperado: ~60-80

-- Verificar eventos
SELECT COUNT(*) FROM stability_events;
-- Esperado: 0 si todos los vehículos son estables
-- Esperado: >0 si hay archivos con si < 0.50
```

---

## 🎯 VENTAJAS DEL PROCESAMIENTO AUTOMÁTICO

✅ **Procesamiento masivo**: 21 conjuntos en minutos  
✅ **Filtrado inteligente**: Solo sesiones válidas  
✅ **Detección automática**: Eventos calculados y guardados  
✅ **Correlación GPS**: Eventos con ubicación exacta  
✅ **Optimización**: Callejeado 300m para rutas realistas  
✅ **Resumen completo**: Logs y estadísticas detalladas  

---

## 📝 NOTAS IMPORTANTES

1. **Backend debe estar corriendo** antes de ejecutar el script
2. **Procesamiento puede tomar 5-10 minutos** para todos los archivos
3. **Opción de limpiar BD** antes de procesar (recomendado)
4. **Script es seguro**: Pide confirmación antes de procesar
5. **Logs completos** en la consola del backend

---

**Fecha de Implementación**: 7 de Octubre de 2025  
**Versión**: 5.0 - Procesamiento Automático  
**Estado**: ✅ Implementado y Documentado

