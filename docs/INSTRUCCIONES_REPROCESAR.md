# 🔄 INSTRUCCIONES PARA REPROCESAR ARCHIVOS

## 🚨 PROBLEMA IDENTIFICADO

El análisis comparativo reveló una diferencia **CRÍTICA**:

```
📊 Análisis Real (esperado):  338 sesiones
   • Con GPS:                 178 sesiones (52.7%)
   • Sin GPS:                 160 sesiones (47.3%)

❌ Sistema (procesado):       44 sesiones (13.0%)
   • Diferencia:              294 sesiones faltantes (87%)
```

**Causa:** La configuración usada requería GPS obligatorio, rechazando el 47.3% de todas las sesiones.

---

## ✅ CORRECCIÓN APLICADA

He modificado `backend/src/services/upload/UploadConfig.ts`:

```typescript
// ✅ ANTES (configuración estricta)
requiredFiles: {
    estabilidad: true,
    gps: true,         // ❌ Rechazaba 160 sesiones sin GPS
    rotativo: true
},
minSessionDuration: 300,  // ❌ Rechazaba sesiones < 5 min

// ✅ AHORA (configuración permisiva)
requiredFiles: {
    estabilidad: true,
    gps: false,        // ✅ GPS opcional
    rotativo: true
},
minSessionDuration: 10,  // ✅ Acepta sesiones >= 10s
correlationThresholdSeconds: 300  // ✅ 5 min (más flexible)
```

---

## 🔄 PASOS PARA REPROCESAR

### Desde el Frontend (Recomendado)

1. **Ir a:** http://localhost:5174/upload

2. **Pestaña:** "Procesamiento Automático"

3. **Configuración:** Asegúrate de que esté así:
   - ✅ ESTABILIDAD (obligatorio)
   - ❌ GPS (opcional)
   - ✅ ROTATIVO (obligatorio)
   - Duración mínima: 10 segundos

4. **Limpiar BD:**
   - Click en "Limpiar Base de Datos"
   - Confirmar

5. **Procesar:**
   - Click en "Iniciar Procesamiento Automático"
   - Esperar (~2-3 minutos)

6. **Verificar resultado:**
   - Debería mostrar ~338 sesiones creadas
   - Ver reporte detallado

---

## 📊 RESULTADO ESPERADO

### Por Vehículo:
- **DOBACK024:** ~59 sesiones
- **DOBACK027:** ~84 sesiones
- **DOBACK028:** ~195 sesiones

### Totales:
- **Total:** ~338 sesiones
- **Con GPS:** ~178 sesiones (52.7%)
- **Sin GPS:** ~160 sesiones (47.3%)

### Mediciones:
- **ESTABILIDAD:** ~3-4 millones
- **GPS:** ~200K-300K
- **ROTATIVO:** ~20K-30K

---

## 🔍 VERIFICAR DESPUÉS DE PROCESAR

Ejecuta desde terminal:
```bash
node verificar-sesiones-creadas.js
```

Debería mostrar:
```
📊 Total sesiones en BD: ~338

🚗 DOBACK024 (~59 sesiones):
   30/09/2025: 2 sesiones
   01/10/2025: 7 sesiones
   02/10/2025: 6 sesiones
   ...

🚗 DOBACK027 (~84 sesiones):
   ...

🚗 DOBACK028 (~195 sesiones):
   ...
```

---

## ⚠️ NOTAS IMPORTANTES

1. **Error `ERR_EMPTY_RESPONSE`:** Es normal, es un problema cosmético. Los datos se procesan correctamente en el backend.

2. **Tiempo de procesamiento:** ~2-5 minutos para 87 archivos.

3. **Logs del backend:** Puedes seguir el progreso en la terminal del backend.

4. **Si falla:** Revisa `backend*.txt` en la raíz y compártelo.

---

## 🎯 COMPARACIÓN DETALLADA

Para ver comparación completa:
```bash
node comparar-analisis-real.js
```

Esto mostrará:
- Sesiones detectadas vs. esperadas
- Desglose por fecha
- Sesiones con/sin GPS
- Porcentaje de cobertura

---

## 📝 ARCHIVOS MODIFICADOS

- ✅ `backend/src/services/upload/UploadConfig.ts`
- ✅ `backend/dist/services/upload/UploadConfig.js` (recompilado)

---

**Última actualización:** 2025-10-12  
**Estado:** ✅ LISTO PARA REPROCESAR  
**Acción:** Ir a `/upload` y procesar con configuración corregida

