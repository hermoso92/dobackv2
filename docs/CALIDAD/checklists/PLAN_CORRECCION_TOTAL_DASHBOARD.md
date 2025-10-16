# 🔧 PLAN DE CORRECCIÓN TOTAL - Dashboard DobackSoft

Basado en la auditoría exhaustiva con Playwright MCP, estos son TODOS los problemas detectados y el plan para corregirlos uno por uno hasta la perfección.

---

## 🐛 PROBLEMAS CONFIRMADOS

### 1. FILTROS TEMPORALES
**Estado Actual**: ❓ Incierto
- Playwright mostró que SÍ funcionan (datos cambiaban: 2193→3271→2898 km)
- Pero el usuario reporta que NO funcionan
- **Acción**: Verificar con prueba definitiva

### 2. SELECTOR DE VEHÍCULOS
**Estado Actual**: ❌ NO FUNCIONA
- Request se envía correctamente: `vehicleIds[]=xxx`
- Backend recibe el parámetro
- Pero los datos NO cambian
- **Acción**: Verificar por qué no filtra correctamente

### 3. TIEMPO EN TALLER NO ES 0
**Estado Actual**: ❌ INCORRECTO
- Muestra: 04:45:39
- Debería ser: 00:00:00 (no hay talleres configurados)
- **Acción**: Investigar de dónde viene ese tiempo

### 4. CÁLCULO DE KILÓMETROS  
**Estado Actual**: ❌ PROBABLEMENTE INCORRECTO
- Velocidad promedio: 26 km/h (muy bajo)
- Problema: Campos `lat/lon` no existen, son `latitude/longitude`
- **Acción**: Ya corregido, verificar si ahora funciona

### 5. % ROTATIVO
**Estado Actual**: ⚠️ CUESTIONABLE
- Muestra: 80%
- Problema: Solo cuenta Clave 2
- **Acción**: Revisar qué claves tienen rotativo encendido

---

## 📋 PLAN DE CORRECCIÓN PASO A PASO

### PASO 1: Revisar estructura completa del endpoint KPIs
- Verificar que no haya errores de sintaxis
- Confirmar que el try-catch no esté ocultando errores
- Asegurar que retorna datos, no objetos vacíos

### PASO 2: Verificar cálculo de estados (Clave 0-5)
- ¿Por qué Clave 0 (Taller) tiene 4+ horas si no hay talleres?
- Auditar la lógica de `RotativoMeasurement`
- Verificar que los datos de entrada son correctos

### PASO 3: Corregir filtro de vehículos
- Backend SÍ recibe `vehicleIds[]`
- Verificar que la query de Prisma filtra correctamente
- Confirmar que hay sesiones para ese vehículo

### PASO 4: Corregir cálculo de kilómetros
- Ya cambiado a `latitude/longitude`
- Agregar filtros de validación
- Verificar que hay datos GPS válidos

### PASO 5: Revisar % Rotativo
- Documentar qué claves tienen rotativo
- Ajustar cálculo según reglas reales
- Verificar denominador correcto

### PASO 6: Verificar que FiltersContext funciona correctamente
- Confirmar que `updateTrigger` se incrementa
- Confirmar que `useEffect` se dispara
- Confirmar que se hacen requests al backend

### PASO 7: Pruebas exhaustivas con Playwright
- Probar cada filtro temporal
- Probar cada vehículo
- Probar selector de parques
- Verificar que TODOS los KPIs cambien

### PASO 8: Validar TODOS los KPIs uno por uno
- Horas de Conducción
- Kilómetros
- Tiempo en Parque
- % Rotativo
- Tiempo Fuera Parque
- Tiempo en Taller
- Tiempo Clave 2, 3, 4, 5
- Total Incidencias y clasificación

---

## 🎯 OBJETIVO

**Conseguir que:**
1. ✅ Filtros temporales cambien TODOS los KPIs
2. ✅ Selector de vehículos cambie TODOS los KPIs
3. ✅ Selector de parques cambie TODOS los KPIs  
4. ✅ Tiempo en Taller sea 0 (no hay talleres configurados)
5. ✅ Kilómetros y velocidad sean coherentes
6. ✅ % Rotativo sea correcto según reglas reales
7. ✅ TODOS los valores sean matemáticamente correctos

---

## 🚀 EMPEZANDO CORRECCIONES

Iniciando revisión sistemática desde PASO 1...


