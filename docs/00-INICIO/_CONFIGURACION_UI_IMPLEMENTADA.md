# ✅ SISTEMA DE CONFIGURACIÓN EN LA UI

**Fecha:** 2025-10-12 09:30  
**Estado:** ✅ IMPLEMENTADO - Panel de Configuración en la Página de Upload

---

## 🎛️ PANEL DE CONFIGURACIÓN

He creado un **panel completamente funcional** en la página de upload que permite configurar todas las reglas desde la interfaz web.

---

## 📍 UBICACIÓN

```
http://localhost:5174/upload
```

**En la pestaña "Procesamiento Automático"**, justo encima de los controles, verás:

```
⚙️ Configuración de Procesamiento
[Click para expandir]
```

---

## 🎯 CARACTERÍSTICAS

### **1. Perfiles Predefinidos**
```
🏭 Producción (Defecto)
   Configuración estándar para uso normal

🧪 Testing (Estricto)
   Solo DOBACK024, GPS obligatorio, 5 min mínimo

🔓 Permisivo (Flexible)
   Acepta todo, sin validaciones
```

### **2. Archivos Obligatorios**
- ✅ Switch para ESTABILIDAD
- ✅ Switch para GPS
- ✅ Switch para ROTATIVO

### **3. Duración de Sesión**
- ⏱️ Duración mínima (segundos)
- ⏱️ Duración máxima (0 = sin límite)
- 📊 Muestra formato legible (HH:MM:SS)

### **4. Filtros por Vehículo**
- 🚗 Agregar vehículos específicos (ej: DOBACK024)
- 🗑️ Eliminar con un click
- 💡 Vacío = Todos los vehículos

### **5. Filtros por Fecha**
- 📅 Selector de fecha visual
- ➕ Agregar fechas específicas
- 🗑️ Eliminar con un click
- 💡 Vacío = Todas las fechas

### **6. Configuración Avanzada**
- 🔧 Permitir sesiones sin GPS
- 🔧 Omitir duplicados
- 🔧 Umbral de correlación (segundos)
- 🔧 Gap temporal para nueva sesión

---

## 🚀 CÓMO USAR

### **Paso 1: Abrir la Configuración**
```
http://localhost:5174/upload → Pestaña "Procesamiento Automático"
```
Click en "⚙️ Configuración de Procesamiento"

### **Paso 2: Configurar Reglas**

**Ejemplo 1: Solo DOBACK024 con GPS**
1. Seleccionar perfil "🧪 Testing"
2. Agregar vehículo: `DOBACK024`
3. Activar switch "GPS" (obligatorio)
4. Click "Guardar Configuración"

**Ejemplo 2: Solo sesiones de 5+ minutos**
1. Cambiar "Duración Mínima" a `300`
2. Click "Guardar Configuración"

**Ejemplo 3: Solo fecha específica**
1. Agregar fecha: `2025-10-08`
2. Click "Guardar Configuración"

### **Paso 3: Procesar**
```
Click "Iniciar Procesamiento Automático"
```
El sistema usará la configuración guardada.

---

## 💾 PERSISTENCIA

La configuración se guarda en **localStorage** del navegador:
- ✅ Persiste entre sesiones
- ✅ No se pierde al recargar
- ✅ Específica por navegador/usuario

---

## 🎨 INTERFAZ

### **Indicadores Visuales:**
- ⚠️ **Chip amarillo:** "Cambios sin guardar"
- ✅ **Botón verde:** "Configuración Guardada"
- 💾 **Botón azul:** "Guardar Configuración" (cuando hay cambios)

### **Resumen en Tiempo Real:**
```
📋 Configuración Actual:
• Archivos obligatorios: ESTABILIDAD, ROTATIVO
• Duración: 1 minuto - Sin límite
• Vehículos: Todos
• Fechas: Todas
```

---

## 🔧 CONFIGURACIONES DISPONIBLES

| Opción | Control | Ejemplo |
|--------|---------|---------|
| **ESTABILIDAD obligatorio** | Switch | ON/OFF |
| **GPS obligatorio** | Switch | ON/OFF |
| **ROTATIVO obligatorio** | Switch | ON/OFF |
| **Duración mínima** | TextField | `60` (1 min), `300` (5 min) |
| **Duración máxima** | TextField | `0` (sin límite), `7200` (2h) |
| **Vehículos** | Input + Chips | `DOBACK024`, `DOBACK027` |
| **Fechas** | Date Picker + Chips | `2025-10-08`, `2025-10-09` |
| **Permitir sin GPS** | Switch | ON/OFF |
| **Omitir duplicados** | Switch | ON/OFF |
| **Umbral correlación** | TextField | `120` (2 min) |
| **Gap temporal** | TextField | `300` (5 min) |

---

## 📊 EJEMPLOS DE CONFIGURACIÓN

### **Testing Estricto**
```javascript
{
  requiredFiles: {
    estabilidad: true,
    gps: true,        // ← Obligatorio
    rotativo: true
  },
  minSessionDuration: 300,  // 5 minutos
  allowedVehicles: ["DOBACK024"],
  allowedDates: ["2025-10-08"]
}
```

### **Solo Sesiones Largas**
```javascript
{
  minSessionDuration: 600,  // 10 minutos
  maxSessionDuration: 7200  // 2 horas
}
```

### **Acepta Todo**
```javascript
{
  requiredFiles: {
    estabilidad: false,
    gps: false,
    rotativo: false
  },
  minSessionDuration: 0,
  skipDuplicates: false
}
```

---

## 🔗 INTEGRACIÓN BACKEND

La configuración se envía automáticamente al backend:

**Frontend → Backend:**
```typescript
const response = await apiService.post('/api/upload/process-all-cmadrid', {
    config: uploadConfig  // ← Configuración del panel
});
```

**Backend recibe:**
```typescript
const uploadConfig = req.body.config;
logger.info('⚙️ Usando configuración personalizada', uploadConfig);
```

---

## 📂 ARCHIVOS CREADOS

1. **`frontend/src/components/UploadConfigPanel.tsx`**
   - Panel de configuración completo
   - 3 perfiles predefinidos
   - Validación en tiempo real
   - Persistencia en localStorage

2. **`frontend/src/components/FileUploadManager.tsx`** (modificado)
   - Integra `UploadConfigPanel`
   - Lee config de localStorage
   - Pasa config al backend

3. **`backend/src/routes/upload.ts`** (modificado)
   - Recibe config del frontend
   - Log de config personalizada
   - Preparado para aplicar reglas

---

## ✅ FUNCIONALIDADES

- ✅ Panel visual en la página de upload
- ✅ 3 perfiles predefinidos (Producción, Testing, Permisivo)
- ✅ Configuración personalizada completa
- ✅ Guardado automático en localStorage
- ✅ Indicadores visuales de cambios
- ✅ Resumen en tiempo real
- ✅ Envío automático al backend
- ✅ Persistencia entre sesiones

---

## 🎯 RESULTADO

**Ahora puedes configurar TODO desde la web:**
- 🎛️ Sin editar archivos
- 🎛️ Sin reiniciar backend
- 🎛️ Sin variables de entorno
- 🎛️ Visual e intuitivo
- 🎛️ Persiste automáticamente

**¡Configura y procesa directamente desde el navegador!** 🚀

