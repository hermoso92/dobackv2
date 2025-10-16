# 🔍 DEBUG: Selector de Sesiones - Duración No Aparece

## 🚨 **PROBLEMA REPORTADO**

**Usuario**: "en el selector de sesiones no aparece los minutos de la sesion"

### **Análisis de Logs**:

En los logs del usuario se puede ver:
```
✅ VehicleSessionSelector: sesiones mapeadas: (13) [{…}, {…}, {…}, ...]
```

Las sesiones se están mapeando correctamente, pero el usuario reporta que no aparecen los minutos en el selector.

---

## 🔍 **DEBUGGING AGREGADO**

### **1. Logging en Cálculo de Duración**:

**Archivo**: `frontend/src/components/selectors/VehicleSessionSelector.tsx`

```typescript
// Logging detallado del cálculo de duración
if (s.startTime && s.endTime) {
    const start = new Date(s.startTime);
    const end = new Date(s.endTime);
    durationMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    
    console.log('🕐 Calculando duración:', {
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        start: start.toISOString(),
        end: end.toISOString(),
        durationMinutes: durationMinutes
    });
} else if (s.duration) {
    durationMinutes = Math.floor(s.duration / 60);
    
    console.log('🕐 Duración desde campo duration:', {
        id: s.id,
        originalDuration: s.duration,
        durationMinutes: durationMinutes
    });
}
```

### **2. Logging en Renderizado**:

```typescript
{sessions.map((session) => {
    console.log('🔍 Renderizando sesión:', {
        id: session.id,
        start_date: session.start_date,
        duration: session.duration,
        formatted: `${new Date(session.start_date).toLocaleDateString('es-ES')} - ${session.duration}min`
    });
    
    return (
        <MenuItem key={session.id} value={session.id}>
            <Typography variant="body2">
                {new Date(session.start_date).toLocaleDateString('es-ES')} - {session.duration}min
            </Typography>
        </MenuItem>
    );
})}
```

---

## 🎯 **INFORMACIÓN ESPERADA EN LOGS**

### **Al Cargar Sesiones**:
```
🕐 Calculando duración: {
    id: "cfc4e54c-a8d5-4365-9aae-86eaed0087be",
    startTime: "2025-10-06T07:34:48.000Z",
    endTime: "2025-10-06T20:58:20.000Z",
    start: "2025-10-06T07:34:48.000Z",
    end: "2025-10-06T20:58:20.000Z",
    durationMinutes: 803
}
```

### **Al Renderizar Selector**:
```
🔍 Renderizando sesión: {
    id: "cfc4e54c-a8d5-4365-9aae-86eaed0087be",
    start_date: "2025-10-06T07:34:48.000Z",
    duration: 803,
    formatted: "6/10/2025 - 803min"
}
```

---

## 🔍 **POSIBLES CAUSAS**

### **1. Problema de Datos**:
- ❌ **startTime/endTime**: Puede que los campos no existan
- ❌ **Cálculo incorrecto**: La fórmula puede estar fallando
- ❌ **Formato de fecha**: Problema al parsear fechas

### **2. Problema de Renderizado**:
- ❌ **Estado no actualizado**: Las sesiones no se están guardando correctamente
- ❌ **Re-render**: El componente no se está re-renderizando
- ❌ **CSS**: El texto puede estar oculto por estilos

### **3. Problema de API**:
- ❌ **Datos faltantes**: La API no está devolviendo startTime/endTime
- ❌ **Formato incorrecto**: Los datos vienen en formato diferente

---

## 🚀 **ACCIÓN REQUERIDA**

### **Para el Usuario**:

1. **Refrescar el frontend** (Ctrl+Shift+R)
2. **Ir a Dashboard → Sesiones & Recorridos**
3. **Seleccionar un vehículo**
4. **Revisar la consola del navegador** para ver los logs

### **Logs a Buscar**:

```
🕐 Calculando duración: { ... }
🔍 Renderizando sesión: { ... }
```

### **Información Necesaria**:

- ✅ **¿Aparecen los logs de cálculo de duración?**
- ✅ **¿Cuál es el valor de `durationMinutes`?**
- ✅ **¿Aparecen los logs de renderizado?**
- ✅ **¿Cuál es el valor de `duration` en el renderizado?**
- ✅ **¿Se muestra el formato `{fecha} - {minutos}min` en el selector?**

---

## 📊 **RESULTADOS ESPERADOS**

### **Si los Logs Aparecen Correctamente**:
- ✅ **Duración calculada**: Ej: `durationMinutes: 803`
- ✅ **Duración renderizada**: Ej: `duration: 803`
- ✅ **Formato correcto**: Ej: `"6/10/2025 - 803min"`

### **Si los Logs No Aparecen**:
- ❌ **Problema de datos**: startTime/endTime no existen
- ❌ **Problema de API**: Datos no llegan correctamente
- ❌ **Problema de componente**: No se está ejecutando el código

### **Si los Logs Aparecen pero el Selector No Muestra**:
- ❌ **Problema de CSS**: Texto oculto
- ❌ **Problema de estado**: Componente no actualizado
- ❌ **Problema de re-render**: React no detecta cambios

---

## 📁 **ARCHIVOS MODIFICADOS**

1. ✅ **`frontend/src/components/selectors/VehicleSessionSelector.tsx`**:
   - Línea ~115: Logging detallado del cálculo de duración
   - Línea ~126: Logging del fallback duration
   - Línea ~211: Logging del renderizado de sesiones

2. ✅ **`DEBUG_SELECTOR_DURACION.md`**: Este documento

---

**Fecha**: 7 de Octubre de 2025  
**Versión**: 7.8 - Debug Selector Duración  
**Estado**: 🔍 **DEBUGGING AGREGADO - ESPERANDO LOGS**

🎯 **Se ha agregado logging detallado para identificar exactamente dónde está el problema con la duración en el selector de sesiones.**
