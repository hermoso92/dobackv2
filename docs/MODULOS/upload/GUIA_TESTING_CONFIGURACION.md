# 🧪 GUÍA DE TESTING - SISTEMA DE CONFIGURACIÓN

**Versión:** V3 Final  
**Fecha:** 2025-10-12

---

## 🎯 OBJETIVO

Verificar que **todas las configuraciones** se aplican correctamente.

---

## ✅ TEST 1: GPS OBLIGATORIO

### **Configuración:**
```
1. http://localhost:5174/upload
2. Click "⚙️ Configuración"
3. GPS: [ON] ✅
4. ESTABILIDAD: [ON]
5. ROTATIVO: [ON]
6. Click "Guardar Configuración" ✅
```

### **Procesamiento:**
```
7. Click "Limpiar BD"
8. Click "Iniciar Procesamiento"
```

### **Resultado Esperado:**
```
✅ SOLO sesiones con GPS se crean
⚠️ Sesiones sin GPS muestran:
   "Falta GPS (requerido por configuración)"
```

### **Verificación:**
```
- Buscar en el reporte: "GPS: [sin datos GPS]"
- Si aparece en "✅ Sesiones Creadas" → ❌ BUG
- Si aparece solo en "⚠️ Sesiones NO procesadas" → ✅ OK
```

---

## ✅ TEST 2: DURACIÓN MÍNIMA 5 MIN

### **Configuración:**
```
1. GPS: [OFF]
2. Duración Mínima: 300
3. Guardar ✅
```

### **Procesamiento:**
```
4. Limpiar BD
5. Procesar
```

### **Resultado Esperado:**
```
✅ SOLO sesiones ≥ 5 minutos
⚠️ Sesiones < 5 min muestran:
   "Duración < 300s (180s)"
```

### **Verificación:**
```
- Buscar sesiones creadas con duración < 00:05:00
- Si hay alguna → ❌ BUG
- Si todas ≥ 00:05:00 → ✅ OK
```

---

## ✅ TEST 3: SOLO DOBACK024

### **Configuración:**
```
1. Vehículos: Seleccionar "DOBACK024" ✅
2. Guardar ✅
```

### **Procesamiento:**
```
3. Limpiar BD
4. Procesar
```

### **Resultado Esperado:**
```
✅ Solo aparece "🚗 DOBACK024" en el reporte
⚠️ DOBACK023, 027, 028 NO aparecen
```

### **Verificación Backend:**
```
Buscar en logs:
"Filtrado por vehículos: 21 → 7 grupos"
```

---

## ✅ TEST 4: SOLO 08/10/2025

### **Configuración:**
```
1. Fechas: Agregar "2025-10-08" manualmente ✅
2. Guardar ✅
```

### **Procesamiento:**
```
3. Limpiar BD
4. Procesar
```

### **Resultado Esperado:**
```
✅ Solo aparece "📅 08/10/2025" en el reporte
⚠️ Otras fechas NO aparecen
```

### **Verificación Backend:**
```
Buscar en logs:
"Filtrado por fechas: 7 → 1 grupos"
```

---

## ✅ TEST 5: ÚLTIMO MES

### **Configuración:**
```
1. Fechas: Click "Último Mes" ✅
2. Verificar que aparecen 30 chips (o "30 fechas seleccionadas")
3. Guardar ✅
```

### **Procesamiento:**
```
4. Limpiar BD
5. Procesar
```

### **Resultado Esperado:**
```
✅ Solo fechas de los últimos 30 días
⚠️ Fechas antiguas (ej: 26/09) pueden estar fuera del rango
```

---

## ✅ TEST 6: PERFIL TESTING (TODO EN UNO)

### **Configuración:**
```
1. Perfil: Seleccionar "🧪 Testing" ✅
2. Verificar:
   • GPS: ON
   • Duración Mínima: 300
   • Vehículos: DOBACK024
   • Fechas: 2025-10-08
3. Guardar ✅
```

### **Procesamiento:**
```
4. Limpiar BD
5. Procesar
```

### **Resultado Esperado:**
```
✅ Solo DOBACK024
✅ Solo 08/10/2025
✅ Solo con GPS
✅ Solo ≥ 5 min

Total esperado: 0-2 sesiones (muy filtrado)
```

---

## ✅ TEST 7: PERFIL PERMISIVO (ACEPTA TODO)

### **Configuración:**
```
1. Perfil: Seleccionar "🔓 Permisivo" ✅
2. Verificar:
   • GPS: OFF
   • ESTABILIDAD: OFF
   • ROTATIVO: OFF
   • Duración Mínima: 0
   • Omitir duplicados: OFF
3. Guardar ✅
```

### **Procesamiento:**
```
4. Limpiar BD
5. Procesar
```

### **Resultado Esperado:**
```
✅ MUCHAS sesiones creadas (>100)
⚠️ Pocas sesiones omitidas

Razones de omisión:
• Solo "Duración inválida (≤ 0s)"
• Sin "Falta GPS", "Falta ROTATIVO", etc.
```

---

## ✅ TEST 8: CAMBIO EN TIEMPO REAL

### **Secuencia:**
```
1. Config inicial: GPS ON, Duración 300
2. Guardar ✅
3. Procesar
4. Ver reporte: Pocas sesiones creadas

5. Cambiar config: GPS OFF, Duración 60
6. Guardar ✅
7. Limpiar BD
8. Procesar
9. Ver reporte: MUCHAS sesiones creadas
```

### **Resultado Esperado:**
```
Primera vez: ~6 sesiones
Segunda vez: ~84 sesiones

La configuración cambia el resultado ✅
```

---

## 🚨 PROBLEMAS CONOCIDOS

### **1. Sesión ya existía**
```
Causa: Procesamiento múltiple sin limpiar BD
Solución: Click "Limpiar BD" antes de cada test
```

### **2. ERR_EMPTY_RESPONSE (ocasional)**
```
Causa: JSON grande con muchos archivos
Solución: Ya simplificado (212 KB → 1-5 KB esperado)
Status: EN REVISIÓN
```

---

## 📋 CHECKLIST DE VALIDACIÓN

Después de cada test, verificar:

- [ ] El reporte se muestra sin crashes
- [ ] Las sesiones creadas cumplen las reglas de config
- [ ] Las sesiones omitidas tienen razones claras
- [ ] Los logs del backend muestran "Filtrado por..."
- [ ] La config guardada persiste al recargar la página

---

## 🎯 RESULTADO FINAL ESPERADO

Después de todos los tests:

✅ **GPS obligatorio funciona**  
✅ **Duración mínima funciona**  
✅ **Filtro de vehículos funciona**  
✅ **Filtro de fechas funciona**  
✅ **Perfiles predefinidos funcionan**  
✅ **Botones rápidos (Hoy, Último Mes) funcionan**  
✅ **Persistencia en localStorage funciona**  

**Sistema robusto y configurable.** 🎉

---

## 🐛 SI ENCUENTRAS UN BUG

**Reporta:**
1. Configuración usada (screenshot o JSON)
2. Sesión que no se comportó como esperado
3. Log del backend (líneas relevantes)
4. Screenshot del reporte

**Ejemplo:**
```
Config: GPS ON, Duración 300
Bug: Sesión 7 DOBACK024 05/10 se creó sin GPS
Log: "✅ Sesión 7 guardada"
Reporte: "GPS: [sin datos GPS]" en "✅ Sesiones Creadas"

Esperado: Debería estar en "⚠️ Sesiones NO procesadas"
```

---

## 💡 TIPS

1. **Siempre limpiar BD** antes de cada test para resultados limpios
2. **Usar perfiles** para configuraciones rápidas
3. **Verificar logs del backend** para confirmar filtros
4. **Recargar página** para verificar persistencia
5. **Usar "Último Mes"** para tests realistas

**¡Feliz testing!** 🧪

