# 🎯 PLAN DE CORRECCIÓN TOTAL DEL SISTEMA DOBACKSOFT

## 🚨 PROBLEMAS DETECTADOS

### 1. **VALORES IMPOSIBLES EN KPIs**
```
Horas de Conducción: 00:00:08 (8 segundos) ❌
Velocidad Promedio: 155442 km/h ❌
Incidencias todas en "Leves" ❌
```

### 2. **FILTROS INCOHERENTES**
- Frontend envía filtros de parques/geocercas
- Backend NO puede usarlos sin geocercas configuradas
- Los filtros se ignoran parcialmente

### 3. **FALTA DE DATOS**
- Posiblemente NO hay suficientes datos de rotativo
- Posiblemente las sesiones están vacías
- No se han procesado archivos DOBACK

---

## ✅ PASOS PARA CORREGIR (EN ORDEN)

### PASO 1: VERIFICAR QUÉ HAY EN LA BASE DE DATOS

**1.1. Abrir el archivo HTML de diagnóstico:**
```bash
# Abrir en navegador:
diagnostico-dashboard.html
```

**1.2. Ejecutar las 5 verificaciones:**
1. ✅ Ver Filtros en LocalStorage
2. ✅ Consultar Endpoint KPIs (Sin Filtros)
3. ✅ Consultar Endpoint KPIs (Con Filtros)
4. ✅ Ver Vehículos Disponibles
5. ✅ Ver Sesiones

**1.3. Anotar:**
- ¿Cuántas sesiones hay?
- ¿Cuántos vehículos hay?
- ¿Los KPIs sin filtros dan valores correctos?
- ¿Los KPIs con filtros dan valores diferentes?

---

### PASO 2: VERIFICAR ARCHIVOS DOBACK PROCESADOS

**2.1. Revisar directorio de datos:**
```powershell
cd backend\data\datosDoback
ls
```

**2.2. Verificar si hay archivos por empresa:**
```powershell
ls CMadrid\can\
ls CMadrid\estabilidad\
ls CMadrid\gps\
ls CMadrid\rotativo\
```

**2.3. Si NO hay archivos:**
- Necesitas subir archivos mediante UI
- O copiar archivos al directorio correcto
- O ejecutar script de procesamiento

---

### PASO 3: PROCESAR ARCHIVOS SI ES NECESARIO

**3.1. Verificar script de procesamiento:**
```bash
node backend/src/scripts/process-files.js
```

O mediante UI:
1. Ir a "Subir Archivos"
2. Subir archivos DOBACK (CAN, GPS, ESTABILIDAD, ROTATIVO)
3. Esperar procesamiento automático

---

### PASO 4: CORREGIR BACKEND

**Correcciones ya aplicadas en `backend-final.js`:**

✅ **4.1. Filtro de vehículos corregido** (línea 828)
```javascript
const vehicleIds = req.query['vehicleIds[]'] || req.query.vehicleIds;
```

✅ **4.2. Campos GPS corregidos** (línea 864)
```javascript
select: { latitude: true, longitude: true, speed: true, timestamp: true }
```

✅ **4.3. Clasificación de incidencias mejorada** (líneas 934-945)
```javascript
if (eventType === 'rollover_risk') {
    criticalIncidents++;
} else if (eventType === 'dangerous_drift') {
    moderateIncidents++;
} else {
    lightIncidents++;
}
```

✅ **4.4. Logging exhaustivo agregado** (líneas 1053-1071)

⚠️ **4.5. PENDIENTE: Validar que haya datos suficientes**
```javascript
// Agregar después de línea 869
if (sessions.length === 0) {
    return res.json({
        success: true,
        data: {
            states: { /* vacío */ },
            activity: { km_total: 0, driving_hours: 0, /* etc */ },
            stability: { total_incidents: 0, /* etc */ }
        },
        message: 'No hay sesiones en el rango de fechas seleccionado'
    });
}
```

---

### PASO 5: CORREGIR FRONTEND

**Correcciones ya aplicadas:**

✅ **5.1. Velocidad promedio protegida** (`NewExecutiveKPIDashboard.tsx` línea 508)
```typescript
const avgSpeed = activity?.km_total && activity?.driving_hours && activity.driving_hours > 0.1
    ? Math.round(activity.km_total / activity.driving_hours)
    : 0;
```

✅ **5.2. Filtros sincronizados** (`FiltersContext.tsx` + `useGlobalFilters.ts`)

⚠️ **5.3. PENDIENTE: Agregar mensaje cuando no hay datos**
```typescript
if (!kpis || kpis.activity?.driving_hours === 0) {
    return (
        <div className="alert alert-warning">
            No hay datos para el período seleccionado. 
            Verifica que hayas procesado archivos DOBACK.
        </div>
    );
}
```

---

### PASO 6: VERIFICAR CÁLCULOS

**6.1. Fórmulas correctas:**

```javascript
// Tiempo Fuera de Parque (Horas de Conducción)
timeOutsideStation = sum(claves 2, 3, 4, 5)

// Tiempo en Parque
timeInStation = clave 1

// Tiempo en Taller
timeInWorkshop = clave 0

// % Rotativo
rotativo_percentage = (rotativoOnSeconds / timeOutsideStation) * 100

// Velocidad Promedio
avgSpeed = totalKm / (timeOutsideStation / 3600)  // Debe ser razonable (<200 km/h)

// Kilómetros
totalKm = sum(haversine(GPSi, GPSi+1)) donde distancia < 5km
```

**6.2. Validaciones necesarias:**
```javascript
// En backend
if (timeOutsideStation < 60) {
    console.warn('⚠️  Tiempo fuera de parque muy bajo:', timeOutsideStation, 'segundos');
}

if (totalKm / (timeOutsideStation / 3600) > 200) {
    console.warn('⚠️  Velocidad promedio imposible:', totalKm / (timeOutsideStation / 3600), 'km/h');
}
```

---

### PASO 7: CREAR GEOCERCAS (OPCIONAL PERO RECOMENDADO)

**7.1. Definir parques de bomberos:**
1. Ir a frontend → Sección "Geofences"
2. Crear geocerca tipo "PARK" para cada parque
3. Definir coordenadas del polígono

**7.2. Script SQL alternativo:**
```sql
INSERT INTO "Geofence" (id, name, type, coordinates, "organizationId", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'Parque Central Madrid',
    'PARK',
    '{"type":"Polygon","coordinates":[[[40.4168,-3.7038],[40.4178,-3.7038],[40.4178,-3.7028],[40.4168,-3.7028],[40.4168,-3.7038]]]}',
    'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26',
    NOW(),
    NOW()
);
```

---

## 🔍 DIAGNÓSTICO RÁPIDO

### Si "Horas de Conducción" = 00:00:08:
1. ✅ Verificar que hay sesiones en la BD
2. ✅ Verificar que las sesiones tienen RotativoMeasurement
3. ✅ Verificar que hay mediciones en claves 2, 3, 4, 5
4. ✅ Revisar logs del backend:
   ```
   📊 ESTADÍSTICAS COMPLETAS: {
     "statesDuration": {
       "0": X,
       "1": Y,
       "2": Z  ← ¿Es > 0?
     }
   }
   ```

### Si "Velocidad Promedio" = 155000 km/h:
1. ✅ Verificar que driving_hours > 0.1 (protección en frontend)
2. ✅ Verificar que totalKm es razonable (<1000 km por sesión)
3. ✅ Revisar cálculo Haversine (debe filtrar distancias imposibles >5km)

### Si "Todas las incidencias son Leves":
1. ✅ Verificar que los tipos de eventos son correctos:
   - `rollover_risk` → Graves
   - `dangerous_drift` → Moderadas
   - Otros → Leves
2. ✅ Ejecutar query SQL:
   ```sql
   SELECT type, COUNT(*) FROM stability_events GROUP BY type;
   ```

---

## 📋 CHECKLIST FINAL

Antes de decir que está "LISTO":

- [ ] Backend responde a `/api/kpis/summary` sin error
- [ ] KPIs muestran valores RAZONABLES:
  - [ ] Horas de Conducción > 1 hora (no 8 segundos)
  - [ ] Velocidad Promedio < 150 km/h (no 155,000)
  - [ ] Incidencias distribuidas (no todas leves)
  - [ ] Kilómetros > 10 km
- [ ] Filtros funcionan:
  - [ ] Cambiar fecha → KPIs cambian
  - [ ] Seleccionar vehículo → KPIs cambian
  - [ ] Sin vehículo seleccionado → Muestra todos
- [ ] Logs del backend son informativos:
  - [ ] Muestra sesiones encontradas
  - [ ] Muestra estados por clave
  - [ ] Muestra kilómetros calculados
- [ ] Frontend renderiza correctamente:
  - [ ] Formatos de tiempo correctos (HH:MM:SS)
  - [ ] Iconos apropiados
  - [ ] Colores según severidad

---

## 🚀 EJECUTAR AHORA

```powershell
# 1. Abrir diagnóstico HTML
start diagnostico-dashboard.html

# 2. Reiniciar sistema
.\iniciar.ps1

# 3. Verificar logs del backend (ventana separada)
# Buscar: "📊 ESTADÍSTICAS COMPLETAS"

# 4. Abrir frontend y revisar KPIs
# http://localhost:5174
```

---

**Una vez tengas los resultados del diagnóstico HTML, dime:**
1. ¿Cuántas sesiones hay?
2. ¿Qué valores muestran los KPIs sin filtros?
3. ¿Qué muestra el log "📊 ESTADÍSTICAS COMPLETAS" en el backend?


