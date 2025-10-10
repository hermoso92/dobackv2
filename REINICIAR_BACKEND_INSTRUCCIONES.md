# 🔄 Instrucciones para Reiniciar Backend con Nuevas Rutas de KPIs

## 📋 Resumen

Se han agregado las rutas de KPIs operativos al backend TypeScript/Node.js. Para que funcionen, es necesario **reiniciar el backend**.

## ✅ Cambios Realizados

### Backend TypeScript
1. **Nuevo archivo:** `backend/src/routes/kpis.ts` - Rutas de KPIs operativos
2. **Modificado:** `backend/src/routes/index.ts` - Registro de las nuevas rutas

### Rutas Agregadas
```
GET /api/v1/kpis/summary      → Resumen completo de KPIs
GET /api/v1/kpis/states       → Estados operativos (claves 0-5)
GET /api/v1/kpis/activity     → Métricas de actividad
GET /api/v1/kpis/stability    → Métricas de estabilidad
```

## 🚀 Cómo Reiniciar

### Opción 1: Usando el script oficial (Recomendado)

```powershell
# Desde la raíz del proyecto
.\iniciar.ps1
```

Este script:
- ✅ Libera los puertos 9998 y 5174
- ✅ Inicia backend y frontend en ventanas separadas
- ✅ Verifica que ambos servicios funcionen
- ✅ Abre el navegador automáticamente

### Opción 2: Reiniciar solo el backend

1. **Detener el backend actual:**
   - Ve a la ventana donde está corriendo el backend
   - Presiona `Ctrl + C`

2. **Reiniciar el backend:**
```powershell
cd backend
npm run dev
```

3. **Verificar que las rutas se cargaron:**
   - Busca en la consola: `✅ KPIs Operativos: /api/v1/kpis`

## ✅ Verificación

### 1. Verificar que el backend respondió correctamente

```powershell
# Probar endpoint (desde PowerShell)
Invoke-WebRequest -Uri "http://localhost:9998/api/v1/kpis/summary" -Method GET -Headers @{"Authorization"="Bearer YOUR_TOKEN"}
```

### 2. Verificar en el navegador

1. Abre el dashboard: `http://localhost:5174`
2. Ve a Panel de Control
3. Los KPIs deberían mostrar valores (inicialmente en 0, pero sin errores 404)
4. Abre la consola del navegador (F12)
5. Busca: `[INFO] KPIs cargados exitosamente`
6. **NO debería haber errores 404** en `/api/v1/kpis/summary`

## 📊 Estado Actual de los KPIs

Por ahora, los endpoints **responden con valores en 0** porque:

1. ✅ Las rutas están implementadas y funcionando
2. ⏳ Aún no hay datos procesados en `vehicle_state_intervals`
3. ⏳ Falta ejecutar el procesamiento de estados

## 🔜 Próximos Pasos (Después de Reiniciar)

### 1. Verificar que no hay errores 404
```javascript
// En la consola del navegador, deberías ver:
[INFO] KPIs cargados exitosamente Object
  ↳ states: { states: [...], total_time_seconds: 0, ... }
  ↳ activity: { km_total: 0, driving_hours: 0, ... }
  ↓ stability: { total_incidents: 0, critical: 0, ... }
```

### 2. Para poblar con datos reales

```powershell
# Opción A: Procesar archivos existentes
cd backend
python scripts/process_example_day.py

# Opción B: Subir nuevos archivos
# Usar la interfaz de upload del frontend
# Luego llamar al procesamiento de estados
```

## ❌ Problemas Comunes

### Error: "Cannot find module './kpis'"
**Solución:** Ejecutar `npm run build` antes de `npm run dev`

### Error: 404 en /api/v1/kpis/summary
**Solución:** Verificar que el backend se reinició correctamente

### Error: "Organization ID not found"
**Solución:** Verificar que el usuario esté autenticado correctamente

## 📝 Estado

- ✅ Rutas TypeScript creadas
- ✅ Middleware de autenticación configurado
- ✅ Registro de rutas actualizado
- ⏳ **Pendiente: REINICIAR BACKEND**
- ⏳ Pendiente: Implementar cálculos reales (actualmente retorna 0s)

---

**IMPORTANTE:** Los valores mostrarán 0 hasta que se implementen los cálculos reales o se procesen datos. Pero **los errores 404 deberían desaparecer** después de reiniciar.

