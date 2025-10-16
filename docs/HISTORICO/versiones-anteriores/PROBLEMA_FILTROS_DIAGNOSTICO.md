# 🔍 DIAGNÓSTICO: FILTROS NO CAMBIAN LOS DATOS

## 🚨 **PROBLEMA REPORTADO**

Usuario dice: "los datos no cambian cuando selecciono un vehiculo o varios"

---

## 📋 **VERIFICACIÓN DEL CÓDIGO**

### ✅ **Frontend - kpiService.ts (Líneas 163-166)**
```typescript
if (filters.vehicleIds && filters.vehicleIds.length > 0) {
    filters.vehicleIds.forEach(id => {
        params.append('vehicleIds[]', id);
    });
}
```
**Estado**: ✅ Correcto - Construye `vehicleIds[]=xxx&vehicleIds[]=yyy`

### ✅ **Backend - kpis.ts (Líneas 42-46)**
```typescript
const vehicleIds = req.query['vehicleIds[]']
    ? (Array.isArray(req.query['vehicleIds[]'])
        ? req.query['vehicleIds[]']
        : [req.query['vehicleIds[]']]) as string[]
    : undefined;
```
**Estado**: ✅ Correcto - Parsea `vehicleIds[]`

### ✅ **Backend - kpiCalculator.ts (Líneas 353-355)**
```typescript
if (filters.vehicleIds && filters.vehicleIds.length > 0) {
    sessionFilter.vehicleId = { in: filters.vehicleIds };
}
```
**Estado**: ✅ Correcto - Aplica filtro a Prisma

---

## ⚠️ **POSIBLES CAUSAS**

### 1. **Caché del navegador**
El navegador puede estar mostrando datos en caché y no haciendo requests reales.

**Verificar**: Abrir DevTools (F12) → Network → Ver si cada cambio de filtro genera un nuevo request

### 2. **Frontend usa datos mock**
Algún componente puede tener fallback a datos mock si la API falla.

**Verificar**: Los logs del frontend dicen "KPIs cargados exitosamente" pero pueden ser datos en caché.

### 3. **Todos los vehículos tienen los mismos datos**
Si las 3 unidades (DOBACK024, DOBACK027, DOBACK028) tienen exactamente las mismas sesiones/eventos, los valores no cambiarán.

**Verificar**: Consultar BD para ver distribución de sesiones por vehículo.

### 4. **Filtros no se pasan desde el Dashboard**
El componente `NewExecutiveKPIDashboard` puede no estar pasando los filtros correctamente a `useKPIs`.

**Verificar**: Código del dashboard donde se usa `useKPIs`.

---

## 🧪 **VERIFICACIÓN MANUAL**

### Paso 1: Verificar distribución de datos por vehículo en BD
```sql
SELECT 
    v.name as vehiculo,
    COUNT(s.id) as sesiones,
    COUNT(se.id) as eventos
FROM "Vehicle" v
LEFT JOIN "Session" s ON s."vehicleId" = v.id
LEFT JOIN "stability_events" se ON se.session_id = s.id
WHERE v."organizationId" = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26'
GROUP BY v.id, v.name
ORDER BY sesiones DESC;
```

**Resultado esperado**: Cada vehículo debe tener diferentes números de sesiones/eventos.

### Paso 2: Verificar logs del backend
Abrir la ventana del backend (PowerShell) y buscar:
```
📊 FILTROS RECIBIDOS EN /api/kpis/summary
```

**Debe mostrar**:
- Sin filtro: `vehicleIdsLength: 0`
- Con 1 vehículo: `vehicleIdsLength: 1`
- Con 2 vehículos: `vehicleIdsLength: 2`

### Paso 3: Verificar Network tab del navegador
1. Abrir DevTools (F12)
2. Ir a pestaña Network
3. Filtrar por "summary"
4. Cambiar filtros de vehículos
5. Ver si se genera un nuevo request con diferentes `vehicleIds[]`

---

## 🔧 **ACCIONES INMEDIATAS**

Voy a crear un script para verificar la distribución de datos por vehículo en BD.

