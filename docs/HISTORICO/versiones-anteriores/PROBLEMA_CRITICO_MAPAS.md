# 🚨 PROBLEMA CRÍTICO: Mapas devuelven 0 datos

**Fecha**: 2025-10-10 11:20  
**Estado**: Diagnosticado, solución pendiente

---

## 📊 **SÍNTOMAS CONFIRMADOS** (del usuario)

```
[INFO] Puntos negros cargados: 0 clusters
[INFO] Datos de velocidad cargados: 0 violaciones
```

**Afecta a**:
- ✅ Pestaña "Estados y Tiempos": **FUNCIONA** (KPIs cargan correctamente)
- ❌ Pestaña "Puntos Negros": **0 clusters**
- ❌ Pestaña "Velocidad": **0 violaciones**
- ❌ Filtros: **NO cambian los datos**
- ❌ Ranking: **NO aparece**

---

## 🔍 **DIAGNÓSTICO**

### **Causa raíz: Eventos sin coordenadas GPS**

Los 1,303 eventos en la tabla `StabilityEvent` tienen:
```sql
lat = 0
lon = 0
```

**Por qué**: Cuando ejecuté `backend/procesar-y-guardar-eventos.js`, la función `eventDetector.detectarEventosSesion()` NO correlacionó los eventos con los puntos GPS, por lo que guardó `lat=0` y `lon=0`.

**Impacto**:
- Los endpoints `/api/hotspots/critical-points` filtran eventos donde `lat != 0 AND lon != 0`
- Resultado: **0 eventos** → **0 clusters** → **mapa vacío**
- Lo mismo para `/api/speed/violations`

---

## ✅ **SOLUCIÓN**

### **Paso 1: Verificar el problema**

Abre **PowerShell** y ejecuta:

```powershell
cd C:\Users\Cosigein SL\Desktop\DobackSoft\backend
npx prisma studio
```

1. Abre la tabla `StabilityEvent`
2. Mira las columnas `lat` y `lon`
3. Si todas son `0` → **problema confirmado**

---

### **Paso 2: Borrar eventos incorrectos**

En **PowerShell**:

```powershell
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.stabilityEvent.deleteMany({}).then(r => { console.log('Borrados:', r.count); p.\$disconnect(); });"
```

Esto borrará todos los eventos actuales (que están mal).

---

### **Paso 3: Re-procesar eventos CON coordenadas GPS**

**IMPORTANTE**: Antes de re-procesar, necesito asegurar que `eventDetector.ts` correlaciona correctamente con GPS.

#### **Archivo**: `backend/src/services/eventDetector.ts`

**Verifica que la función `detectarEventosSesion` tenga este código**:

```typescript
// DESPUÉS de detectar el evento, CORRELACIONAR CON GPS:

// Buscar GPS más cercano al timestamp del evento
const gpsCorrelacionado = await prisma.gpsMeasurement.findFirst({
    where: {
        sessionId,
        timestamp: {
            gte: new Date(punto.timestamp.getTime() - 10000), // -10s
            lte: new Date(punto.timestamp.getTime() + 10000)  // +10s
        }
    },
    orderBy: {
        timestamp: 'asc'
    }
});

// Añadir coordenadas al evento:
evento.lat = gpsCorrelacionado?.latitude || 0;
evento.lon = gpsCorrelacionado?.longitude || 0;
```

Si NO tiene este código, el problema persiste.

---

### **Paso 4: Ejecutar re-procesamiento**

Después de verificar el código arriba:

```powershell
node backend/procesar-y-guardar-eventos.js
```

Esto debería:
- Leer las 241 sesiones
- Para cada sesión, detectar eventos
- Correlacionar cada evento con GPS
- Guardar eventos CON `lat` y `lon` correctos

---

### **Paso 5: Verificar que funcionó**

1. **En Prisma Studio**: Refresca `StabilityEvent` → Verifica que `lat` y `lon` ya NO son 0

2. **En el navegador**: 
   - Actualiza (Ctrl + F5)
   - Ve a "Puntos Negros"
   - Debería aparecer el mapa con clusters rojos/amarillos/verdes

3. **Verifica filtros**:
   - Selecciona 1 vehículo
   - Los datos deben cambiar
   - Los clusters deben ser menos

---

## 🔧 **SI EL PROBLEMA PERSISTE**

### **Opción A: eventDetector NO correlaciona con GPS**

Si después del Paso 4, los eventos siguen con `lat=0`, significa que `eventDetector.detectarEventosSesion()` NO está correlacionando.

**Solución**: Necesito revisar y corregir `backend/src/services/eventDetector.ts`.

### **Opción B: No hay datos GPS en la BD**

Ejecuta:

```powershell
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.gpsMeasurement.count().then(c => { console.log('GPS points:', c); p.gpsMeasurement.count({ where: { speed: { gt: 0 } } }).then(s => { console.log('GPS con velocidad:', s); p.\$disconnect(); }); });"
```

Si devuelve `GPS points: 0` → **No hay datos GPS en la BD**. En ese caso, el problema es que los archivos GPS nunca se procesaron.

---

## 📋 **PRÓXIMO PASO**

**Ejecuta el Paso 1** (Prisma Studio) y dime:
1. ¿Cuántos eventos hay en total?
2. ¿Los campos `lat` y `lon` son todos 0?
3. Si abres la tabla `GpsMeasurement`, ¿hay registros?

Con esa info, sabré exactamente qué corregir.

---

**ÚLTIMA ACTUALIZACIÓN**: 2025-10-10 11:20  
**BLOQUEADOR ACTUAL**: Eventos sin coordenadas GPS  
**ACCIÓN REQUERIDA**: Usuario ejecuta Prisma Studio (Paso 1)

