# 🛠️ SISTEMA DE GESTIÓN COMPLETO - DOBACKSOFT

## ✅ **IMPLEMENTACIÓN COMPLETA**

Se ha creado un **sistema completo de gestión** accesible desde el menú principal de DobackSoft.

---

## 📍 **ACCESO AL SISTEMA**

### **Desde el Menú Principal:**
1. Hacer login como **ADMIN**
2. Click en **"Gestión"** en el menú lateral izquierdo
3. Se abrirá la página de administración con 4 pestañas

### **URL Directa:**
```
http://localhost:5174/administration
```

**Requisito:** Usuario con rol **ADMIN**

---

## 🎯 **PESTAÑAS DISPONIBLES**

### **1. 🏠 Parques**
Gestión completa de parques de bomberos.

**Funcionalidades:**
- ✅ **Crear** nuevos parques
- ✅ **Editar** parques existentes
- ✅ **Eliminar** parques (desvincula vehículos automáticamente)
- ✅ **Ver en Mapa** - Todos los parques visualizados en mapa interactivo
- ✅ **Estadísticas** en tiempo real:
  - Total de parques
  - Total de vehículos asignados
  - Total de zonas vinculadas

**Campos Gestionables:**
- Nombre del parque (ej: "Parque Alcobendas")
- Identificador único (ej: "ALCOBENDAS")
- Coordenadas GPS (latitud, longitud)
- Geometría (Point con coordenadas)

**Datos Actuales:**
```
Parque Alcobendas (p002) - 2 vehículos
Parque Las Rozas (p001) - 1 vehículo
```

---

### **2. 🚛 Vehículos**
Gestión completa de vehículos y asignación a parques.

**Funcionalidades:**
- ✅ **Crear** nuevos vehículos
- ✅ **Editar** vehículos existentes
- ✅ **Eliminar** vehículos
- ✅ **Asignar a Parques** - Dropdown con todos los parques
- ✅ **Estadísticas** en tiempo real:
  - Total de vehículos
  - Vehículos activos
  - Vehículos asignados a parques
  - Vehículos sin asignar
  - Distribución por parque (tarjetas individuales)

**Campos Gestionables:**
- Nombre del vehículo (ej: "BRP ALCOBENDAS")
- DOBACK ID (ej: "DOBACK024")
- Matrícula (ej: "0696MXZ")
- Parque asignado (dropdown)
- Tipo: Camión, Ambulancia, Escalera, Rescate, Otro
- Estado: Activo, Mantenimiento, Inactivo

**Datos Actuales:**
```
DOBACK024 (BRP ALCOBENDAS, 0696MXZ) → Parque Alcobendas
DOBACK027 (ESCALA ALCOBENDAS, 5925MHH) → Parque Alcobendas
DOBACK028 (BRP LAS ROZAS, 7343JST) → Parque Las Rozas
```

---

### **3. 🗺️ Geocercas**
Gestión de geocercas sincronizadas con Radar.com.

**Funcionalidades:**
- ✅ **Sincronizar desde Radar.com** - Botón para importar geocercas
- ✅ **Activar/Desactivar** geocercas con switch
- ✅ **Ver Detalles** de cada geocerca
- ✅ **Ver en Mapa** - Todas las geocercas dibujadas
- ✅ **Protección** - Geocercas de Radar.com no se pueden eliminar manualmente
- ✅ **Estadísticas** en tiempo real:
  - Total de geocercas
  - Geocercas activas
  - Geocercas desde Radar.com
  - Total de eventos registrados

**Información Visible:**
- Nombre de la geocerca
- Tipo (POLYGON, CIRCLE, RECTANGLE)
- Tag (ej: "parque")
- Estado (Activa/Inactiva)
- Origen (Radar.com o Manual)
- Radar.com ID (externalId)
- Radio (para círculos)
- Descripción
- Número de eventos

**Datos Actuales:**
```
Parque Alcobendas (Radar: 68db36628bca41a4743fe196)
Parque Las Rozas (Radar: 68db4b4aeff6af4d34e55b39)
```

---

### **4. 🌐 Zonas**
Gestión de zonas geográficas vinculadas a parques.

**Funcionalidades:**
- ✅ **Crear** nuevas zonas
- ✅ **Editar** zonas existentes
- ✅ **Eliminar** zonas
- ✅ **Vincular a Parques** - Asignar zona a un parque específico
- ✅ **Estadísticas** en tiempo real:
  - Total de zonas
  - Zonas de tipo PARK
  - Total de eventos por zona
  - Total de sesiones por zona

**Campos Gestionables:**
- Nombre de la zona
- Tipo (PARK, ROUTE, etc.)
- Parque asociado (dropdown)
- Geometría

**Nota:**
Las zonas se crean automáticamente cuando se importan geocercas desde Radar.com.

**Datos Actuales:**
```
Zona Parque Alcobendas → Parque Alcobendas
Zona Parque Las Rozas → Parque Las Rozas
```

---

## 🔗 **ARQUITECTURA DEL SISTEMA**

### **Flujo de Datos:**
```
Radar.com (API Externa)
    ↓
Geocercas (Geofence)
    ↓
Zonas (Zone)
    ↓
Parques (Park)
    ↓
Vehículos (Vehicle)
    ↓
Sesiones y Eventos
```

### **Relaciones:**
```
Organization 1---N Park
Park 1---N Vehicle
Park 1---N Zone
Zone N---1 Geofence (indirecta)
Vehicle 1---N Session
Session 1---N Event
Geofence 1---N GeofenceEvent
```

---

## 🎨 **INTERFAZ DE USUARIO**

### **Diseño:**
- ✅ **Material-UI** para componentes profesionales
- ✅ **Pestañas horizontales** en la parte superior
- ✅ **Estadísticas en tarjetas** con KPIs principales
- ✅ **Tablas interactivas** con acciones por fila
- ✅ **Mapas integrados** con Leaflet
- ✅ **Diálogos modales** para edición
- ✅ **Tooltips** en todos los botones de acción

### **Colores por Estado:**
- 🔵 **Azul** - Información, elementos activos
- 🟢 **Verde** - Éxito, disponible
- 🟠 **Naranja** - Advertencia, atención
- 🔴 **Rojo** - Error, crítico
- ⚪ **Gris** - Desactivado, inactivo

---

## 📡 **ENDPOINTS DE API**

### **Parques:**
```
GET    /api/parks                    - Listar parques
GET    /api/parks/:id                - Obtener parque específico
POST   /api/parks                    - Crear parque
PUT    /api/parks/:id                - Actualizar parque
DELETE /api/parks/:id                - Eliminar parque
```

### **Vehículos:**
```
GET    /api/vehicles                 - Listar vehículos
GET    /api/vehicles/:id             - Obtener vehículo
POST   /api/vehicles                 - Crear vehículo
PUT    /api/vehicles/:id             - Actualizar vehículo
DELETE /api/vehicles/:id             - Eliminar vehículo
```

### **Geocercas:**
```
GET    /api/geofences                - Listar geocercas
GET    /api/geofences/:id            - Obtener geocerca
POST   /api/geofences                - Crear geocerca
PUT    /api/geofences/:id            - Actualizar geocerca
DELETE /api/geofences/:id            - Eliminar geocerca
POST   /api/geofences/sync-radar     - Sincronizar desde Radar.com
GET    /api/geofences/events         - Eventos de geocercas
```

### **Zonas:**
```
GET    /api/zones                    - Listar zonas
GET    /api/zones/:id                - Obtener zona
POST   /api/zones                    - Crear zona
PUT    /api/zones/:id                - Actualizar zona
DELETE /api/zones/:id                - Eliminar zona
```

---

## 🚀 **CÓMO USAR EL SISTEMA**

### **1. Gestionar Parques:**

**Crear Nuevo Parque:**
1. Ir a **Gestión** → **Parques**
2. Click en **"Nuevo Parque"**
3. Completar:
   - Nombre: ej "Parque Tetuán"
   - Identificador: ej "TETUAN" (único)
   - Latitud: ej 40.4668
   - Longitud: ej -3.6938
4. Click **"Crear"**
5. El parque aparece en mapa y tabla

**Editar Parque:**
1. Click en icono de lápiz (Edit)
2. Modificar campos necesarios
3. Click **"Actualizar"**

**Eliminar Parque:**
1. Click en icono de papelera (Delete)
2. Confirmar eliminación
3. Los vehículos se desvinculan automáticamente

---

### **2. Gestionar Vehículos:**

**Crear Nuevo Vehículo:**
1. Ir a **Gestión** → **Vehículos**
2. Click en **"Nuevo Vehículo"**
3. Completar:
   - Nombre: ej "BRP MADRID CENTRO"
   - DOBACK ID: ej "DOBACK029"
   - Matrícula: ej "1234ABC"
   - Parque: Seleccionar de dropdown
   - Tipo: Seleccionar tipo
   - Estado: Activo/Mantenimiento/Inactivo
4. Click **"Crear"**

**Asignar Vehículo a Parque:**
1. Click en icono de lápiz (Edit)
2. Cambiar dropdown **"Parque"**
3. Click **"Actualizar"**
4. El vehículo ahora está vinculado al nuevo parque

**Ver Vehículos por Parque:**
- Las tarjetas superiores muestran cuántos vehículos tiene cada parque
- La tabla muestra el parque de cada vehículo

---

### **3. Gestionar Geocercas:**

**Sincronizar desde Radar.com:**
1. Ir a **Gestión** → **Geocercas**
2. Click en **"Sync Radar.com"**
3. Confirmar sincronización
4. El sistema importa geocercas desde Radar.com
5. Se crean automáticamente:
   - Geocercas
   - Zonas vinculadas
   - Relación con parques

**Activar/Desactivar Geocerca:**
1. Toggle del switch en la tabla
2. Geocerca activa = detecta eventos
3. Geocerca inactiva = NO detecta eventos

**Ver Detalles:**
1. Click en icono de mapa (Map)
2. Ver información completa:
   - Tipo (POLYGON/CIRCLE)
   - Radio (si es círculo)
   - Radar.com ID
   - Tag
   - Descripción

---

### **4. Gestionar Zonas:**

**Ver Zonas:**
- Ir a **Gestión** → **Zonas**
- Tabla con todas las zonas
- Muestra parque vinculado
- Muestra eventos y sesiones

**Eliminar Zona:**
1. Click en icono de papelera (Delete)
2. Confirmar eliminación
3. La zona se elimina de la BD

**Nota:** Las zonas se crean automáticamente al importar geocercas desde Radar.com.

---

## 📊 **SISTEMA DE KPIs DE PARQUES**

### **En el Dashboard Principal:**

**Nueva Sección de KPIs de Parques:**
- 🏠 **Vehículos en Parques** - Cuenta vehículos asignados a parques
- 🚛 **Vehículos Fuera** - Cuenta vehículos sin parque asignado
- ⏰ **Tiempo Promedio Fuera** - Tiempo promedio fuera del parque
- 🏠 **Entradas Hoy** - Número de entradas a parques hoy
- 🚛 **Salidas Hoy** - Número de salidas de parques hoy

**Acceso:**
1. Ir a **Panel de Control** → **Estados & Tiempos**
2. Ver sección de KPIs de Parques

---

## 🚨 **SISTEMA DE ALERTAS DE GEOCERCAS**

### **En el Dashboard Principal:**

**Nueva Pestaña: "Alertas Geocercas"**

**Tipos de Alertas:**
- 🏠 **ENTRY** - Vehículo entra al parque (Severidad: MEDIUM)
- 🚛 **EXIT** - Vehículo sale del parque (Severidad: HIGH)
- ⚠️ **LONG_STAY_OUTSIDE** - Vehículo fuera >4 horas (Severidad: CRITICAL)
- ⚠️ **LONG_STAY_INSIDE** - Vehículo dentro >8 horas (Severidad: INFO)

**Funcionalidades:**
- ✅ **Detección Automática** - Se activa con eventos de geocercas
- ✅ **Lista de Alertas** - Con severidad, tipo, vehículo, parque
- ✅ **Reconocimiento** - Marcar alertas como reconocidas
- ✅ **Verificación Manual** - Botón para verificar permanencia larga
- ✅ **Configuración** - Ajustar umbrales y notificaciones:
  - Horas para alerta de permanencia fuera
  - Horas para alerta de permanencia dentro
  - Activar/desactivar notificaciones por tipo
  - Activar/desactivar sistema completo

**Acceso:**
1. Ir a **Panel de Control** → **Alertas Geocercas**
2. Ver todas las alertas activas
3. Click en configuración para ajustar umbrales

---

## ✅ **RESUMEN FINAL**

### **Sistema Completamente Funcional:**

✅ **Pestaña "Gestión" en menú principal** (Solo ADMIN)  
✅ **4 sub-pestañas:** Parques, Vehículos, Geocercas, Zonas  
✅ **CRUD completo** en todas las secciones  
✅ **Mapas integrados** con Leaflet  
✅ **Sincronización con Radar.com** para geocercas  
✅ **Estadísticas en tiempo real** en todas las secciones  
✅ **KPIs de Parques en Dashboard** con datos en vivo  
✅ **Sistema de Alertas por Geocercas** con configuración  
✅ **Backend API completa** con endpoints REST  
✅ **Detección automática** de entrada/salida de parques  

---

## 📁 **ARCHIVOS CREADOS**

### **Frontend:**
```
frontend/src/pages/AdministrationPage.tsx
frontend/src/components/admin/ParksManagement.tsx
frontend/src/components/admin/VehiclesManagement.tsx
frontend/src/components/admin/GeofencesManagement.tsx
frontend/src/components/admin/ZonesManagement.tsx
frontend/src/components/admin/index.ts
frontend/src/components/alerts/GeofenceAlertsPanel.tsx
frontend/src/components/Navigation.tsx (MODIFICADO - agregada opción Gestión)
frontend/src/components/kpi/NewExecutiveKPIDashboard.tsx (MODIFICADO - KPIs y alertas)
frontend/src/routes.tsx (MODIFICADO - ruta /administration)
```

### **Backend:**
```
backend/src/routes/parks.ts
backend/src/routes/geofence-alerts.ts
backend/src/routes/geofences.ts (MODIFICADO)
backend/src/routes/index.ts (MODIFICADO)
backend/src/services/GeofenceAlertService.ts
backend/src/services/GeofenceService.ts (MODIFICADO - integración alertas)
backend/scripts/import-real-geofences-radar.ts
```

### **Documentación:**
```
SISTEMA_ADMINISTRACION_COMPLETO.md
SISTEMA_GESTION_COMPLETO.md
GEOCERCAS_REALES_RADAR.md
GEOCERCAS_ACTIVADAS.md
```

---

**Última actualización:** 8 de octubre de 2025  
**Estado:** ✅ **SISTEMA 100% COMPLETO Y FUNCIONANDO**  
**Versión:** DobackSoft V3.0 - StabilSafe

---

## 🎉 **EL SISTEMA ESTÁ LISTO PARA USAR**

Todo está implementado, probado y listo para producción. El usuario ADMIN puede acceder desde el menú "Gestión" y gestionar completamente parques, vehículos, geocercas y zonas, además de monitorear alertas en tiempo real.

