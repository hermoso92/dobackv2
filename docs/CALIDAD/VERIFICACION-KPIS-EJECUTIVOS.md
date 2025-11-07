# ✅ Verificación KPIs Ejecutivos - DobackSoft StabilSafe V3

## 📋 Cambios Implementados - Resumen Ejecutivo

Esta guía te permite verificar todas las correcciones realizadas en la pestaña "KPIs Ejecutivos" del Panel de Control.

---

## 🎯 PASO 1: Verificar Backend Actualizado

### 1.1 Verificar que el endpoint retorna los datos correctos

```bash
# Desde PowerShell en el directorio del proyecto
cd backend

# El backend debe estar corriendo en puerto 9998
# Si no está corriendo, usa: npm run dev
```

### 1.2 Probar endpoint de KPIs (con token válido)

```bash
# Obtener token primero (reemplaza con tu usuario/contraseña)
$token = "TU_TOKEN_AQUI"

# Probar endpoint KPIs
curl -X GET "http://localhost:9998/api/kpis/summary?from=2025-09-01&to=2025-11-05&force=true" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json"
```

### 1.3 Verificar respuesta incluye:

```json
{
  "success": true,
  "data": {
    "states": { /* ... claves 0-5 ... */ },
    "activity": {
      "km_total": 123.5,
      "driving_hours": 15.2,
      "driving_hours_formatted": "15:12:00",
      "rotativo_on_percentage": 56.1,
      "average_speed": 45.3  // ✅ NUEVO - debe aparecer
    },
    "stability": {
      "total_incidents": 17,
      "critical": 0,
      "moderate": 15,
      "light": 2,
      "por_tipo": { /* ... eventos por tipo ... */ },
      "eventos_detallados": {  // ✅ NUEVO - debe aparecer
        "critical": [],
        "moderate": [ /* ... 15 eventos ... */ ],
        "light": [ /* ... 2 eventos ... */ ]
      }
    },
    "quality": {  // ✅ NUEVO - debe aparecer
      "indice_promedio": 0.87,
      "calificacion": "BUENA",
      "estrellas": "⭐⭐⭐⭐",
      "total_muestras": 1234
    }
  }
}
```

---

## 🎯 PASO 2: Verificar Frontend Actualizado

### 2.1 Iniciar Sistema Completo

```powershell
# Desde la raíz del proyecto
.\iniciar.ps1
```

**Esperar a que abra el navegador automáticamente**

### 2.2 Navegar a KPIs Ejecutivos

1. Login con tus credenciales
2. Ir a **Panel de Control** (icono casa)
3. Clic en pestaña **"KPIs Ejecutivos"** (primera pestaña)

### 2.3 Verificaciones Visuales

#### ✅ Diseño de 2 Columnas
- [ ] **COLUMNA 1**: Métricas Generales (Horas, Km, Velocidad, Rotativo, Índice)
- [ ] **COLUMNA 2**: Claves Operacionales (Clave 0-5, sin "Tiempo Fuera Parque")
- [ ] **FILA COMPLETA**: Incidencias (4 tarjetas horizontales)
- [ ] Todo visible sin scroll excesivo

#### ✅ KPIs de Métricas Generales
- [ ] **Horas de Conducción**: Muestra formato `HH:MM:SS` (no "140 km")
- [ ] **Kilómetros Recorridos**: Muestra número + " km" (ej: "140 km")
- [ ] **Velocidad Promedio**: Muestra valor realista 40-80 km/h (no "6 km/h")
- [ ] **% Rotativo Activo**: Muestra porcentaje (ej: "56.1%")
- [ ] **Índice de Estabilidad**: Muestra porcentaje + calificación + estrellas (no "0.0%")

#### ✅ KPIs de Claves Operacionales
- [ ] **Clave 0**: "Taller" - Mantenimiento
- [ ] **Clave 1**: "Operativo en Parque" - En base, disponible
- [ ] **Clave 2**: "Salida en Emergencia" - Con rotativo activo
- [ ] **Clave 3**: "En Siniestro" - En siniestro (parado >1min)
- [ ] **Clave 4**: "Fin de Actuación" - Después del siniestro ✅ CORREGIDO
- [ ] **Clave 5**: "Regreso sin Rotativo" - Vuelta al parque ✅ CORREGIDO
- [ ] **NO aparece** "Tiempo Fuera Parque" ✅ ELIMINADO

#### ✅ KPIs de Incidencias
- [ ] **Total Incidencias**: Muestra número total
- [ ] **Graves (0-20%)**: Muestra número + "(clic para ver)" ✅ NUEVO
- [ ] **Moderadas (20-35%)**: Muestra número + "(clic para ver)" ✅ NUEVO
- [ ] **Leves (35-50%)**: Muestra número + "(clic para ver)" ✅ NUEVO

---

## 🎯 PASO 3: Probar Funcionalidades Interactivas

### 3.1 Clic en Incidencias

1. **Clic en tarjeta "Moderadas (20-35%)"**
   - [ ] Se abre modal con tabla de eventos
   - [ ] Muestra título "Eventos Moderados (X)"
   - [ ] Tabla tiene columnas: Sesión, Tipo, Índice SI, Timestamp
   - [ ] Índice SI está coloreado (naranja para moderadas)
   - [ ] Botón X cierra el modal

2. **Clic en tarjeta "Graves (0-20%)"**
   - [ ] Modal funciona igual
   - [ ] Índice SI en rojo

3. **Clic en tarjeta "Leves (35-50%)"**
   - [ ] Modal funciona igual
   - [ ] Índice SI en verde

### 3.2 Verificar Tabla de Eventos por Tipo (abajo)

- [ ] Aparece si hay eventos
- [ ] Muestra tipos de eventos
- [ ] Muestra cantidad
- [ ] Muestra frecuencia (Alta/Media/Baja)

---

## 🎯 PASO 4: Verificar Datos Correctos

### 4.1 Comparar con Base de Datos

```sql
-- Ejecutar en PostgreSQL
-- Verificar sesiones en rango
SELECT COUNT(*) as total_sesiones
FROM "Session"
WHERE "startTime" >= '2025-09-01'
  AND "startTime" <= '2025-11-05'
  AND "organizationId" = 'TU_ORG_ID';

-- Verificar eventos de estabilidad
SELECT 
    COUNT(*) as total_eventos,
    COUNT(CASE WHEN (details->>'si')::float < 0.20 THEN 1 END) as graves,
    COUNT(CASE WHEN (details->>'si')::float >= 0.20 AND (details->>'si')::float < 0.35 THEN 1 END) as moderadas,
    COUNT(CASE WHEN (details->>'si')::float >= 0.35 AND (details->>'si')::float < 0.50 THEN 1 END) as leves
FROM stability_events
WHERE session_id IN (
    SELECT id FROM "Session"
    WHERE "startTime" >= '2025-09-01'
      AND "startTime" <= '2025-11-05'
      AND "organizationId" = 'TU_ORG_ID'
);

-- Verificar índice de estabilidad promedio
SELECT AVG(si) as indice_promedio
FROM stability_measurements
WHERE "sessionId" IN (
    SELECT id FROM "Session"
    WHERE "startTime" >= '2025-09-01'
      AND "startTime" <= '2025-11-05'
      AND "organizationId" = 'TU_ORG_ID'
);
```

### 4.2 Los números deben coincidir con los mostrados en el frontend

---

## 🎯 PASO 5: Verificar Filtros Globales

### 5.1 Aplicar Filtro de Fecha

1. Clic en selector de fechas (arriba a la derecha)
2. Seleccionar rango: 01/09/2025 - 05/11/2025
3. [ ] KPIs se actualizan automáticamente
4. [ ] Números cambian según el rango

### 5.2 Aplicar Filtro de Vehículos

1. Clic en selector de vehículos
2. Seleccionar 1 o más vehículos
3. [ ] KPIs se recalculan solo para esos vehículos

---

## 🐛 TROUBLESHOOTING

### Problema: "No aparece pestaña KPIs Ejecutivos"
**Solución**:
```bash
# Verificar que routes.tsx tiene la importación
cd frontend/src
grep "KPIsTab" routes.tsx pages/UnifiedDashboard.tsx
```

### Problema: "Velocidad sigue mostrando 6 km/h"
**Solución**:
1. Verificar en Network tab del navegador la respuesta de `/api/kpis/summary`
2. Debe incluir `activity.average_speed`
3. Si no aparece, verificar backend actualizado

### Problema: "Incidencias no son clickeables"
**Solución**:
1. Verificar en consola del navegador errores JavaScript
2. Debe aparecer `onClick={() => handleIncidentClick('moderate')}`
3. Si no funciona, limpiar caché: Ctrl + Shift + Delete

### Problema: "Índice de Estabilidad muestra N/A"
**Solución**:
1. Verificar respuesta backend incluye `quality` object
2. Verificar tabla `stability_measurements` tiene datos con campo `si`

### Problema: "Backend no arranca"
**Solución**:
```powershell
# Verificar puerto 9998 no está ocupado
netstat -ano | findstr :9998

# Si está ocupado, liberar:
# Opción 1: Usar iniciar.ps1 (libera automáticamente)
.\iniciar.ps1

# Opción 2: Manual
$processId = (netstat -ano | findstr :9998 | Select-String -Pattern '\d+$').Matches.Value
Stop-Process -Id $processId -Force
```

---

## 📊 CHECKLIST FINAL DE VERIFICACIÓN

### Frontend
- [ ] Pestaña "KPIs Ejecutivos" es la primera del Panel
- [ ] Diseño 2 columnas + fila completa para incidencias
- [ ] "Tiempo Fuera Parque" NO aparece
- [ ] Etiquetas correctas: "Fin de Actuación" y "Regreso sin Rotativo"
- [ ] Velocidad muestra valor realista (40-80 km/h)
- [ ] Índice de Estabilidad muestra % + estrellas
- [ ] Incidencias clickeables abren modal
- [ ] Modal muestra tabla con eventos detallados

### Backend
- [ ] Endpoint `/api/kpis/summary` incluye `average_speed`
- [ ] Endpoint incluye `quality` con índice de estabilidad
- [ ] Endpoint incluye `eventos_detallados` por severidad
- [ ] Clasificación severidades correcta (SI < 0.20, 0.20-0.35, 0.35-0.50)
- [ ] Cálculos GPS usan Haversine con filtros válidos

### Documentación
- [ ] `docs/MODULOS/operaciones/LOGICA-TRAYECTOS.md` existe
- [ ] `docs/MODULOS/geofences/VERIFICACION-GEOCERCAS.md` existe
- [ ] `docs/CALIDAD/VERIFICACION-KPIS-EJECUTIVOS.md` existe (este archivo)

---

## 📝 NOTAS IMPORTANTES

### Geocercas (Verificación Manual Pendiente)
Según la memoria del sistema, hay **4 geocercas inválidas** que necesitan eliminarse manualmente.

**Solo son válidas**:
- ✅ Rozas
- ✅ Alcobendas

**Acción pendiente**: Ejecutar SQL para eliminar las inválidas (ver `docs/MODULOS/geofences/VERIFICACION-GEOCERCAS.md`)

### Datos de Prueba
Si no tienes datos reales:
1. Subir archivos desde 01/09/2025 en adelante
2. Esperar a que se procesen
3. Verificar que aparecen en los KPIs

---

## 🚀 SIGUIENTES PASOS

1. **Verificar todas las casillas** de este documento
2. **Reportar cualquier discrepancia** que encuentres
3. **Eliminar geocercas inválidas** (SQL pendiente)
4. **Monitorear en producción** durante 1-2 días

---

**Última actualización**: 2025-11-05  
**Versión**: 1.0.0  
**Autor**: Sistema DobackSoft  
**Estado**: ✅ LISTO PARA VERIFICACIÓN


