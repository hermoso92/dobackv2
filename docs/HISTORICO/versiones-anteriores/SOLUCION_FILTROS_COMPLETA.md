# 🔧 SOLUCIÓN: FILTROS NO CAMBIAN LOS DATOS

## 🚨 **PROBLEMA CONFIRMADO**

Según los logs del frontend que compartiste:
```javascript
// Request 1:
vehicles: '7b5627df-ae7f-41e4-aea3-078663c7115f' (1 vehículo)

// Request 2:
vehicles: '7b5627df...,14b9febb...' (2 vehículos)

// Request 3:
vehicles: '14b9febb...,2c11e67b...,7b5627df...' (3 vehículos)
```

Pero los **datos no cambian** en el dashboard.

---

## 🔍 **ANÁLISIS DEL CÓDIGO**

He revisado TODO el flujo:

### 1. ✅ **Frontend construye parámetros correctamente** (`kpiService.ts`)
```typescript
if (filters.vehicleIds && filters.vehicleIds.length > 0) {
    filters.vehicleIds.forEach(id => {
        params.append('vehicleIds[]', id);
    });
}
```

### 2. ✅ **Backend parsea parámetros correctamente** (`routes/kpis.ts`)
```typescript
const vehicleIds = req.query['vehicleIds[]']
    ? (Array.isArray(req.query['vehicleIds[]'])
        ? req.query['vehicleIds[]']
        : [req.query['vehicleIds[]']]) as string[]
    : undefined;
```

### 3. ✅ **kpiCalculator filtra sesiones correctamente**
```typescript
if (filters.vehicleIds && filters.vehicleIds.length > 0) {
    sessionFilter.vehicleId = { in: filters.vehicleIds };
}

const sessions = await prisma.session.findMany({
    where: sessionFilter
});
```

**Conclusión**: El código está bien implementado.

---

## 🚨 **CAUSA RAÍZ DEL PROBLEMA**

Hay **2 posibles causas**:

### Causa 1: **Todos los vehículos tienen los mismos datos**

Si las **241 sesiones** están distribuidas equitativamente entre los 3 vehículos (~80 sesiones cada uno), y si cada vehículo tiene ~435 eventos, los números aparecerán casi iguales.

### Causa 2: **Los logs son de requests DIFERENTES pero el frontend muestra datos de un estado previo**

El frontend puede estar:
- Mostrando datos en caché mientras espera la respuesta
- Haciendo múltiples requests simultáneos
- No actualizando el estado correctamente

---

## ✅ **SOLUCIÓN**

### PASO 1: Verificar distribución de datos en BD

Ejecuta este comando en una terminal NUEVA:

```sql
SELECT 
    v.name as vehiculo,
    COUNT(DISTINCT s.id) as sesiones,
    COUNT(se.id) as eventos
FROM "Vehicle" v
LEFT JOIN "Session" s ON s."vehicleId" = v.id
LEFT JOIN "stability_events" se ON se.session_id = s.id
WHERE v."organizationId" = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26'
GROUP BY v.id, v.name
ORDER BY sesiones DESC;
```

**Si devuelve algo como**:
```
DOBACK024: 80 sesiones, 435 eventos
DOBACK027: 80 sesiones, 434 eventos
DOBACK028: 81 sesiones, 434 eventos
```

→ **ESTE ES EL PROBLEMA**: Los datos son muy similares, los filtros SÍ funcionan pero no se nota.

**Si devuelve algo como**:
```
DOBACK024: 241 sesiones, 1303 eventos
DOBACK027: 0 sesiones, 0 eventos
DOBACK028: 0 sesiones, 0 eventos
```

→ Todas las sesiones están asignadas al mismo vehículo, los filtros no cambiarán nada.

---

### PASO 2: Verificar en el navegador

1. Abrir DevTools (F12)
2. Ir a pestaña **Console**
3. Buscar este log:
   ```
   [INFO] KPIs cargados exitosamente
   ```
4. Expandir el objeto y verificar:
   - `stability.total_incidents`
   - `metadata.sesiones_analizadas`

5. Cambiar filtro de vehículos
6. Esperar **5-10 segundos**
7. Verificar si los números cambiaron

---

### PASO 3: Añadir logging visual en el dashboard

Voy a modificar el dashboard para mostrar **qué filtros están activos** visualmente.

---

## 💡 **MUY PROBABLE**

Basándome en los logs que compartiste, veo que el frontend hace MÚLTIPLES requests:

```
Request configurada con token: requestCount: 21
Request configurada con token: requestCount: 27
Request configurada con token: requestCount: 31
```

Esto significa que **SÍ** se están haciendo requests diferentes. El problema más probable es:

**Las sesiones están distribuidas equitativamente entre los 3 vehículos**, por lo que:
- 3 vehículos = 1,303 eventos total
- 1 vehículo = ~434 eventos
- 2 vehículos = ~868 eventos

Pero si solo ves "1,303 eventos" en todos los casos, entonces **los filtros NO se están aplicando** o **hay un problema de estado en el frontend**.

---

## 🎯 **ACCIÓN INMEDIATA**

Por favor, comparte:

1. **Screenshot del dashboard** mostrando:
   - Los filtros seleccionados (qué vehículos)
   - Los números mostrados (eventos, sesiones, km)

2. **Logs de la consola del navegador** cuando:
   - Seleccionas 1 vehículo
   - Seleccionas 2 vehículos
   - Seleccionas 3 vehículos

3. **Network tab** mostrando:
   - URL completa del request a `/api/kpis/summary`
   - Si tiene `vehicleIds[]` en la query string

Con esto podré identificar exactamente dónde está el problema.

