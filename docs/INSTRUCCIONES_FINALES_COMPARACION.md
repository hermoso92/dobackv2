# 🎯 INSTRUCCIONES FINALES - COMPARACIÓN GPS OBLIGATORIO

**Objetivo:** Verificar si el sistema detecta las mismas sesiones que el análisis real con GPS + >= 5 min

---

## ✅ AJUSTES APLICADOS

### Backend
- ✅ `minSessionDuration: 280s` (era 300s)
- ✅ `correlationThresholdSeconds: 300s` (era 60s)
- ✅ Recompilado

### Frontend
- ✅ Perfil "Testing" actualizado con los mismos valores
- ✅ Descripción actualizada

### Base de Datos
- ✅ Limpia (0 sesiones, 0 mediciones)

---

## 🔄 PASOS PARA PROCESAR

1. **Ir al frontend:**
   ```
   http://localhost:5174/upload
   ```

2. **Pestaña "Procesamiento Automático"**

3. **Seleccionar perfil "Testing":**
   - En el dropdown "Perfil Predefinido"
   - Seleccionar: "🧪 Testing (GPS Obligatorio)"
   - Automáticamente cargará:
     ```
     • ESTABILIDAD: ✅
     • GPS: ✅
     • ROTATIVO: ✅
     • Duración mínima: 280 segundos
     • Duración máxima: 7200 segundos
     • Umbral correlación: 300 segundos
     ```

4. **Guardar configuración:**
   - Click "💾 Guardar Configuración"

5. **Procesar:**
   - Click "🚀 Iniciar Procesamiento Automático"
   - Esperar ~2-3 minutos

6. **Revisar reporte en pantalla**

7. **Verificar desde terminal:**
   ```bash
   node comparacion-final.js
   ```

---

## 📊 RESULTADO ESPERADO

```
┌───────────┬──────────┬───────────┬────────────┬──────────┐
│ Vehículo  │ Esperadas│ Detectadas│ Diferencia │ Cobertura│
├───────────┼──────────┼───────────┼────────────┼──────────┤
│ DOBACK024 │    22    │    ~19    │      ~-3   │   ~86%  │
│ DOBACK027 │    23    │    ~20    │      ~-3   │   ~87%  │
│ DOBACK028 │    40    │    ~35    │      ~-5   │   ~88%  │
├───────────┼──────────┼───────────┼────────────┼──────────┤
│ TOTAL     │    85    │   ~74-80  │     ~5-11  │   ~87%  │
└───────────┴──────────┴───────────┴────────────┴──────────┘
```

**Mejora:** De 44 sesiones (51.8%) → ~75-80 sesiones (~88%)

---

## 🔍 SI AÚN FALTAN SESIONES

Si después de procesar aún quedan diferencias significativas, las causas son:

### 1. Sesiones de 260-279 segundos
```
"~ 5 min" en análisis pero 4m 30s reales
```
**Solución:** Reducir a 260s

### 2. GPS muy fragmentado
```
GPS con múltiples gaps internos que se detectan como sesiones separadas
pero el análisis los agrupa como una sola
```
**Solución:** Lógica de correlación más compleja (combinar sesiones GPS cercanas)

### 3. Diferencias en timestamps
```
Diferencias de milisegundos en parseo pueden desplazar correlación
```
**Solución:** Aumentar tolerancia de correlación a 360s (6 min)

---

## 📝 SCRIPTS DE VERIFICACIÓN

| Script | Descripción |
|--------|-------------|
| `limpiar-bd-sesiones.js` | Limpiar BD antes de procesar |
| `comparacion-final.js` | Ver cobertura general |
| `listar-sesiones-esperadas.js` | Ver lista de 85 sesiones esperadas |
| `verificar-vehiculos-bd.js` | Ver qué hay en BD actualmente |

---

## ✅ ESTADO ACTUAL

- [x] Backend ajustado (280s, 300s threshold)
- [x] Frontend ajustado (perfil "Testing")
- [x] BD limpia
- [x] Backend recompilado
- [ ] **Pendiente: Procesar desde frontend**
- [ ] **Pendiente: Comparar resultado**

---

**Ir ahora al frontend, seleccionar perfil "Testing" y procesar.**

