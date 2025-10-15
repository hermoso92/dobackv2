# ⚙️ CONFIGURACIÓN CORRECTA - GPS OBLIGATORIO

## 🎯 OBJETIVO

Detectar las **178 sesiones válidas** del análisis real (las que tienen los 3 tipos de archivos: ESTABILIDAD + GPS + ROTATIVO).

---

## 📊 ESTADO ACTUAL

```
✅ Análisis Real:    178 sesiones (con 3 tipos)
❌ Sistema detectó:  44 sesiones
📉 Faltan:           134 sesiones (75%)
```

### Por Vehículo:
- **DOBACK024:** 23 esperadas → 0 detectadas (faltan 23)
- **DOBACK027:** 40 esperadas → 0 detectadas (faltan 40)
- **DOBACK028:** 115 esperadas → 0 detectadas (faltan 115)

---

## ⚙️ CONFIGURACIÓN CORRECTA PARA FRONTEND

Ve a http://localhost:5174/upload y configura así:

### 📋 Archivos Obligatorios:
```
✅ ESTABILIDAD (marcado)
✅ GPS (marcado)
✅ ROTATIVO (marcado)
```

### ⏱️ Duraciones:
```
Duración Mínima: 10 segundos
Duración Máxima: 0 (sin límite)
```
**Razón:** El análisis real tiene sesiones desde 1m 24s (84 segundos)

### 🔗 Correlación:
```
Umbral Correlación: 300 segundos
Gap Temporal: 300 segundos
```
**Razón:** El GPS puede tardar hasta 3-4 minutos en obtener señal

### 🚗 Vehículos:
```
Todos (dejar vacío o seleccionar DOBACK024, DOBACK027, DOBACK028)
```

### 📅 Fechas:
```
Todas (dejar vacío)
```

### ⚙️ Avanzado:
```
❌ Permitir sin GPS (desmarcar - queremos GPS obligatorio)
✅ Omitir duplicados (marcar)
```

---

## 🔄 PASOS PARA REPROCESAR

### 1. Configurar (EN EL FRONTEND)
- Ir a http://localhost:5174/upload
- Pestaña "Procesamiento Automático"
- Expandir "⚙️ Configuración de Procesamiento"
- **Aplicar configuración exacta de arriba** ☝️
- Click "💾 Guardar Configuración"

### 2. Verificar Configuración
En la sección "Configuración Actual" debe mostrar:
```
• Archivos obligatorios: ESTABILIDAD, GPS, ROTATIVO
• Duración: 10 seg - Sin límite
• Umbral correlación: 300 seg
• Gap temporal: 300 seg
```

### 3. Procesar
- Click "🚀 Iniciar Procesamiento Automático"
- Esperar 2-3 minutos

### 4. Verificar Resultado
Debería mostrar:
```
✅ ~178 Sesiones Guardadas
⚠️ ~160 Sesiones Descartadas (sin GPS)
```

---

## 📊 RESULTADO ESPERADO POR VEHÍCULO

### DOBACK024
```
30/09/2025: 1 sesión (de 2 totales, 1 sin GPS)
01/10/2025: 3 sesiones (de 7 totales, 4 sin GPS)
02/10/2025: 1 sesión (de 6 totales, 5 sin GPS)
03/10/2025: 3 sesiones (de 4 totales, 1 sin GPS)
...
Total: 23 sesiones con GPS
```

### DOBACK027
```
Total: 40 sesiones con GPS
```

### DOBACK028
```
Total: 115 sesiones con GPS
```

---

## ⚠️ IMPORTANTE

### La clave está en estos 3 ajustes:

1. **Duración mínima: 10s** (no 300s)
   - Permite sesiones cortas como 1m 24s
   
2. **Umbral correlación: 300s** (no 120s)
   - GPS tarda en arrancar, necesita tiempo
   
3. **BD limpia** ✅
   - Ya eliminamos duplicados

---

## 🔍 VERIFICAR DESPUÉS

Ejecuta desde terminal:
```bash
node verificar-sesiones-creadas.js
```

Debería mostrar:
```
📊 Total sesiones en BD: ~178

🚗 DOBACK024 (23 sesiones):
   30/09/2025: 1 sesión (09:33:37 - 10:38:25)
   01/10/2025: 3 sesiones
   ...
```

---

**IMPORTANTE:** La configuración debe hacerse en el **FRONTEND** (http://localhost:5174/upload), no en los archivos de código. El frontend guarda la configuración en localStorage y la envía al backend.

---

**BD limpia ✅ - Ahora ve al frontend y configura según las especificaciones de arriba.**

