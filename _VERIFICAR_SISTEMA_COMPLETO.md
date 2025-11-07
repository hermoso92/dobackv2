# 🧪 Verificación Sistema Completo - DobackSoft + Google Maps

## ✅ RESULTADOS ACTUALES

### 🗺️ Google Maps Platform: **4/5 APIs Funcionando**
- ✅ **Geocoding API** - Funcionando perfectamente
- ✅ **Routes API** - Funcionando perfectamente  
- ⚠️ **Roads API** - Opcional (requiere habilitar manualmente)
- ✅ **Elevation API** - Funcionando perfectamente
- ✅ **Places API** - Funcionando perfectamente

### 🔧 DobackSoft System: **Backend conectado**
- ✅ **Backend** - Conectado en puerto 9998
- ❌ **Authentication** - Requiere verificación
- ⏳ **Dashboard, Stability, Events** - Esperando autenticación

---

## 🔧 PASO 1: Verificar Base de Datos

Ejecuta en PowerShell:

```powershell
# Conectar a PostgreSQL
psql -U postgres -d dobacksoft
```

### Verificar usuario admin:

```sql
-- Ver usuarios existentes
SELECT id, email, role, "organizationId" 
FROM "User" 
WHERE role = 'ADMIN';

-- Si NO HAY usuarios, crear uno:
INSERT INTO "User" (id, email, password_hash, name, role, "organizationId", "isActive", "createdAt", "updatedAt")
VALUES (
    'admin-001',
    'admin@dobacksoft.com',
    '$2b$10$YourHashedPasswordHere', -- Este es un hash de bcrypt
    'Admin DobackSoft',
    'ADMIN',
    'org-001',
    true,
    NOW(),
    NOW()
);

-- Verificar organizaciones
SELECT id, name FROM "Organization";

-- Si NO HAY organizaciones, crear una:
INSERT INTO "Organization" (id, name, "createdAt", "updatedAt")
VALUES ('org-001', 'DobackSoft', NOW(), NOW());
```

### Salir de PostgreSQL:

```sql
\q
```

---

## 🔧 PASO 2: Crear Usuario Admin (Script Rápido)

Ejecuta este comando:

```powershell
node scripts/testing/create-admin-user.js
```

Si no existe el script, créalo:

```javascript
// scripts/testing/create-admin-user.js
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        // Verificar si existe organización
        let org = await prisma.organization.findFirst();
        
        if (!org) {
            org = await prisma.organization.create({
                data: {
                    id: 'org-001',
                    name: 'DobackSoft'
                }
            });
            console.log('✅ Organización creada:', org.name);
        }
        
        // Verificar si existe admin
        const existingAdmin = await prisma.user.findFirst({
            where: { email: 'admin@dobacksoft.com' }
        });
        
        if (existingAdmin) {
            console.log('✅ Usuario admin ya existe:', existingAdmin.email);
            return;
        }
        
        // Crear admin
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const admin = await prisma.user.create({
            data: {
                id: 'admin-001',
                email: 'admin@dobacksoft.com',
                password_hash: hashedPassword,
                name: 'Admin DobackSoft',
                role: 'ADMIN',
                organizationId: org.id,
                isActive: true
            }
        });
        
        console.log('✅ Usuario admin creado');
        console.log('   Email:', admin.email);
        console.log('   Password:', password);
        console.log('   Rol:', admin.role);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
```

---

## 🧪 PASO 3: Ejecutar Test Completo

Una vez que tengas el usuario admin creado:

```powershell
node scripts/testing/test-sistema-completo.js
```

**Resultado esperado:**
```
🗺️  Google Maps:
   ✅ Geocoding
   ✅ Routes
   ⚠️  Roads (opcional)
   ✅ Elevation
   ✅ Places

🔧 DobackSoft:
   ✅ Backend
   ✅ Authentication
   ✅ Dashboard
   ✅ Stability
   ✅ Events

🎉 ¡SISTEMA FUNCIONAL!
Google Maps: 4/5
DobackSoft: 5/5
```

---

## 🌐 PASO 4: Verificar en Navegador

### 1. Abrir DobackSoft

```
http://localhost:5174
```

### 2. Login

- **Email:** `admin@dobacksoft.com`
- **Password:** `admin123`

### 3. Verificar Módulos

**Dashboard:**
- KPIs deben mostrarse
- Vehículos deben cargarse
- Si hay datos, verás métricas

**Estabilidad:**
- Sesiones de estabilidad
- Eventos con geocoding
- Mapas con rutas

**Telemetría:**
- Datos CAN/GPS
- Snap-to-road (si Roads API habilitada)
- Mapas interactivos

---

## 🧪 PASO 5: Probar Google Maps en Consola

Abre DevTools (F12) en el navegador y ejecuta:

```javascript
// Importar servicios
import { googleMaps } from './src/services/googleMaps/googleMapsService';

// Test Geocoding
const address = await googleMaps.geocoding.getStreetName(40.4168, -3.7038);
console.log('✅ Dirección:', address);

// Test Routes
const route = await googleMaps.routes.computeRoute({
    origin: { lat: 40.4168, lng: -3.7038 },
    destination: { lat: 40.4200, lng: -3.7000 },
});
console.log('✅ Distancia:', route.distanceMeters / 1000, 'km');
console.log('✅ Duración:', route.durationSeconds / 60, 'minutos');

// Test Elevation
const elevation = await googleMaps.elevation.getSingleElevation(40.4168, -3.7038);
console.log('✅ Elevación:', elevation, 'metros');

// Test Places
const parkings = await googleMaps.places.findNearbyParkings(
    { lat: 40.4168, lng: -3.7038 },
    1000
);
console.log('✅ Parkings encontrados:', parkings.length);
```

---

## 📊 PASO 6: Verificar Flujo Completo con Datos Reales

### 1. Subir Archivo

```powershell
# Si tienes archivos CSV de ejemplo
# Subir vía interfaz web en http://localhost:5174/upload
```

### 2. Verificar Procesamiento

```sql
-- En PostgreSQL
psql -U postgres -d dobacksoft

-- Ver sesiones procesadas
SELECT id, vehicle_name, start_time, end_time 
FROM "StabilitySession" 
ORDER BY start_time DESC 
LIMIT 5;

-- Ver eventos de estabilidad
SELECT id, tipo_evento, severidad, lat_inicio, lon_inicio 
FROM "StabilityEvent" 
ORDER BY timestamp_inicio DESC 
LIMIT 5;

-- Ver datos GPS
SELECT vehicle_id, latitude, longitude, speed_kmh, timestamp 
FROM "GPSData" 
ORDER BY timestamp DESC 
LIMIT 5;
```

### 3. Verificar KPIs en Dashboard

Los KPIs deberían mostrar:
- ✅ Disponibilidad (%)
- ✅ Tiempo en ruta (horas)
- ✅ Tiempo con rotativo (horas)
- ✅ Incidencias críticas (#)
- ✅ Kilómetros totales (km)
- ✅ Costes (€)

### 4. Verificar Geocoding de Eventos

En la interfaz de Estabilidad:
- ✅ Eventos deben mostrar dirección (no solo coordenadas)
- ✅ Ejemplo: "Evento en Calle Gran Vía 1, Madrid"

---

## ⚠️ OPCIONAL: Habilitar Roads API

Si quieres usar **snap-to-road** y **límites de velocidad**:

### 1. Ir a Google Cloud Console

```
https://console.cloud.google.com/apis/library
```

### 2. Buscar "Roads API"

- Escribir en barra de búsqueda: "Roads API"
- Clic en resultado

### 3. Habilitar

- Clic en botón **"ENABLE"**
- Esperar confirmación

### 4. Verificar

```powershell
node scripts/testing/test-google-maps.js
```

Deberías ver: **✅ 5/5 tests pasaron**

---

## 🎯 CHECKLIST DE VERIFICACIÓN COMPLETA

### Google Maps Platform
- [x] ✅ Geocoding API funcionando
- [x] ✅ Routes API funcionando
- [x] ✅ Elevation API funcionando
- [x] ✅ Places API funcionando
- [ ] ⚠️ Roads API (opcional)

### Backend
- [x] ✅ Backend corriendo en puerto 9998
- [ ] ⏳ Usuario admin creado
- [ ] ⏳ Organización creada
- [ ] ⏳ Login funcionando

### Frontend
- [ ] ⏳ Frontend corriendo en puerto 5174
- [ ] ⏳ Login exitoso
- [ ] ⏳ Dashboard cargando
- [ ] ⏳ KPIs mostrándose

### Módulos
- [ ] ⏳ Dashboard funcionando
- [ ] ⏳ Estabilidad con eventos
- [ ] ⏳ Telemetría con mapas
- [ ] ⏳ Geocoding de eventos activo

### Datos
- [ ] ⏳ Vehículos en base de datos
- [ ] ⏳ Sesiones procesadas
- [ ] ⏳ Eventos de estabilidad
- [ ] ⏳ Datos GPS disponibles

---

## 📚 Scripts de Verificación Disponibles

```powershell
# Test completo del sistema
node scripts/testing/test-sistema-completo.js

# Test solo Google Maps
node scripts/testing/test-google-maps.js

# Crear usuario admin
node scripts/testing/create-admin-user.js

# Verificar base de datos
psql -U postgres -d dobacksoft
```

---

## 🆘 Solución de Problemas

### ❌ "Backend no disponible"
```powershell
# Verificar que esté corriendo
curl http://localhost:9998/health

# Si no responde, reiniciar
.\iniciar.ps1
```

### ❌ "Login falló"
```powershell
# Crear usuario admin
node scripts/testing/create-admin-user.js

# O manualmente en PostgreSQL
psql -U postgres -d dobacksoft
-- Ver comandos SQL arriba
```

### ❌ "Sin datos en dashboard"
```sql
-- Verificar que haya datos
SELECT COUNT(*) FROM "Vehicle";
SELECT COUNT(*) FROM "StabilitySession";
SELECT COUNT(*) FROM "StabilityEvent";
SELECT COUNT(*) FROM "GPSData";

-- Si no hay datos, subir archivos vía web
```

### ❌ "Eventos sin dirección"
- Verificar que `REACT_APP_GOOGLE_MAPS_API_KEY` esté en `config.env`
- Reiniciar frontend: `.\iniciar.ps1`
- Verificar en consola del navegador (F12) si hay errores

---

## 🎉 SIGUIENTE PASO

Una vez que todos los checks estén ✅:

1. **Crear usuario admin** (si no existe)
2. **Ejecutar test completo** 
3. **Abrir en navegador** y hacer login
4. **Verificar cada módulo**
5. **Subir datos** si no hay
6. **Probar Google Maps** en consola

---

## 📞 Comandos Útiles

```powershell
# Reiniciar sistema completo
.\iniciar.ps1

# Ver logs backend
cd backend
npm run dev

# Ver logs frontend  
cd frontend
npm run dev

# Test rápido
node scripts/testing/test-sistema-completo.js

# Acceder a PostgreSQL
psql -U postgres -d dobacksoft
```

---

**🎯 Objetivo:** Ver todos los ✅ en el test completo y poder navegar por DobackSoft con datos reales mostrando direcciones geocodificadas con Google Maps.

