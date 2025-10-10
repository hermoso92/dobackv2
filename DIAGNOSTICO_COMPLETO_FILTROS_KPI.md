# 🔍 DIAGNÓSTICO COMPLETO - BUG DE FILTROS EN KPIs

## 📊 Resumen Ejecutivo

**Problema**: Los KPIs del dashboard NO se actualizan cuando el usuario cambia los filtros (ANA, ESTE MES, TODO) o selecciona diferentes vehículos/parques.

**Estado**: 🔴 BUG CRÍTICO CONFIRMADO

---

## 🧪 Pruebas Realizadas con Playwright

### Resultado de las Pruebas
```
✅ updateFilters() SE EJECUTA correctamente
✅ Los valores de fechas SÍ CAMBIAN en el estado
   - Antes: dateStart: "2025-10-01"
   - Después: dateStart: "2025-09-08"
❌ NO se hace NINGÚN REQUEST NUEVO al backend
❌ Los KPIs NO cambian en la UI
❌ filterVersion NO se incrementa
```

### Valores Mostrados (ESTÁTICOS)
```javascript
{
  km: "26",                    // ❌ Incorrecto (debería ser 2898)
  horas: "10:21:18",           // ❌ Incorrecto  
  incidencias: "70",           // ❌ Incorrecto
  rotativo: "00%"              // ❌ Incorrecto (debería ser 86%)
}
```

### Console.logs Capturados del Backend
```javascript
// El backend SÍ retorna datos correctos:
"km_total": 2898
"rotativo_on_percentage": 86
"total_incidents": 726
"driving_hours_formatted": "112:29:05"
```

---

## 🐛 Causa Raíz Identificada

### Problema #1: Propagación de Estado entre Hooks
El hook `useGlobalFilters` incrementa `filterVersion`, PERO el hook `useKPIs` NO ve el cambio porque:

1. `useState` es asíncrono
2. `setFilterVersion(prev => prev + 1)` se ejecuta
3. Pero cuando `useKPIs` lee `filterVersion`, todavía es el valor anterior
4. El `useEffect` en `useKPIs` NO se dispara porque la dependencia no cambió

### Problema #2: Referencia de Objetos
Aunque `filters` cambia internamente, React puede no detectar el cambio si la referencia del objeto es la misma.

---

## ✅ Solución Propuesta

La solución más efectiva es usar **useReducer con dispatch** en lugar de `useState` para los filtros, o implementar un **contexto global** para garantizar la propagación correcta.

### Opción 1: Usar Context API (RECOMENDADA)
Crear `FiltersContext` que maneje el estado de filtros globalmente y garantice que todos los componentes vean los cambios.

### Opción 2: Forzar Re-render con Key
Agregar una prop `key={filterVersion}` a los componentes que necesitan actualizarse.

### Opción 3: Usar EventEmitter
Emitir un evento cuando cambian los filtros y suscribirse a ese evento en useKPIs.

---

## 📝 Archivos que Necesitan Corrección

### Frontend
1. `frontend/src/hooks/useGlobalFilters.ts`
2. `frontend/src/hooks/useKPIs.ts`
3. `frontend/src/contexts/FiltersContext.tsx` (CREAR)

### Backend  
1. `backend-final.js` - Endpoint `/api/kpis/summary` (YA CORREGIDO)
   - ✅ Ahora lee filtros correctamente
   - ✅ Consulta base de datos
   - ✅ Retorna datos dinámicos

---

## 🎯 Recomendación Inmediata

Implementar FiltersContext para manejar el estado de filtros de forma centralizada y garantizar que todos los hooks vean los cambios en tiempo real.


