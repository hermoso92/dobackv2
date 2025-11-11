# 🔧 CAMBIOS NECESARIOS EN SCHEMA DE PRISMA

## 📋 **ANÁLISIS ACTUAL**

### ✅ **Lo que YA EXISTE:**

```prisma
model speed_violations {
  id            String   @id @default(dbgenerated("(gen_random_uuid())::text"))
  sessionId     String
  timestamp     DateTime @db.Timestamptz(6)
  lat           Float
  lon           Float
  speed         Float
  speedLimit    Float
  excess        Float
  violationType String
  roadType      String
  rotativoOn    Boolean
  inPark        Boolean
  createdAt     DateTime @default(now()) @db.Timestamptz(6)

  @@index([sessionId], map: "idx_speed_violations_session")
  @@index([sessionId, violationType], map: "idx_speed_violations_session_type")
  @@index([timestamp], map: "idx_speed_violations_timestamp")
  @@index([violationType], map: "idx_speed_violations_type")
}
```

**⚠️ PROBLEMA:** Esta tabla existe pero **NO tiene relaciones** con Session, Vehicle, ni Organization.

---

### ❌ **Lo que FALTA:**

1. **Tabla `daily_kpi`** → No existe
2. **Relaciones en `speed_violations`** → No tiene
3. **Relaciones inversas en `Session`, `Vehicle`, `Organization`** → No las incluyen

---

## 🛠️ **CAMBIOS A APLICAR**

### **1. CREAR MODELO `DailyKPI`**

Añadir DESPUÉS de la línea 567 (después de `model ParkKPI`):

```prisma
model DailyKPI {
  id                    String       @id @default(dbgenerated("gen_random_uuid()"))
  vehicleId             String
  organizationId        String
  date                  DateTime     @db.Date
  totalTimeInPark       Int          @default(0) // minutos
  totalTimeInWorkshop   Int          @default(0) // minutos
  totalTimeOperational  Int          @default(0) // minutos
  totalDistanceKm       Float        @default(0)
  totalEvents           Int          @default(0)
  clave0Minutes         Int          @default(0)
  clave1Minutes         Int          @default(0)
  clave2Minutes         Int          @default(0)
  clave3Minutes         Int          @default(0)
  clave4Minutes         Int          @default(0)
  clave5Minutes         Int          @default(0)
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt
  
  Vehicle               Vehicle      @relation(fields: [vehicleId], references: [id])
  Organization          Organization @relation(fields: [organizationId], references: [id])
  
  @@unique([vehicleId, date])
  @@index([vehicleId])
  @@index([organizationId])
  @@index([date])
  @@map("daily_kpi")
}
```

---

### **2. MODIFICAR `speed_violations` (línea 1084)**

**REEMPLAZAR:**

```prisma
model speed_violations {
  id            String   @id @default(dbgenerated("(gen_random_uuid())::text"))
  sessionId     String
  timestamp     DateTime @db.Timestamptz(6)
  lat           Float
  lon           Float
  speed         Float
  speedLimit    Float
  excess        Float
  violationType String
  roadType      String
  rotativoOn    Boolean
  inPark        Boolean
  createdAt     DateTime @default(now()) @db.Timestamptz(6)

  @@index([sessionId], map: "idx_speed_violations_session")
  @@index([sessionId, violationType], map: "idx_speed_violations_session_type")
  @@index([timestamp], map: "idx_speed_violations_timestamp")
  @@index([violationType], map: "idx_speed_violations_type")
}
```

**POR:**

```prisma
model speed_violations {
  id             String       @id @default(dbgenerated("(gen_random_uuid())::text"))
  sessionId      String
  vehicleId      String
  organizationId String
  timestamp      DateTime     @db.Timestamptz(6)
  lat            Float
  lon            Float
  speed          Float
  speedLimit     Float
  excess         Float
  violationType  String
  roadType       String
  rotativoOn     Boolean
  inPark         Boolean
  confidence     String?      // 'high', 'medium', 'low'
  source         String?      // 'tomtom', 'osm', 'cache', 'default'
  createdAt      DateTime     @default(now()) @db.Timestamptz(6)
  
  Session        Session      @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  Vehicle        Vehicle      @relation(fields: [vehicleId], references: [id])
  Organization   Organization @relation(fields: [organizationId], references: [id])

  @@index([sessionId], map: "idx_speed_violations_session")
  @@index([sessionId, violationType], map: "idx_speed_violations_session_type")
  @@index([timestamp], map: "idx_speed_violations_timestamp")
  @@index([violationType], map: "idx_speed_violations_type")
  @@index([vehicleId])
  @@index([organizationId])
}
```

**✨ CAMBIOS:**
- ✅ Añadido `vehicleId` y `organizationId`
- ✅ Añadido `confidence` y `source` (campos que usa el servicio)
- ✅ Añadidas relaciones con `Session`, `Vehicle`, `Organization`
- ✅ Añadidos índices para `vehicleId` y `organizationId`
- ✅ `onDelete: Cascade` en Session para limpieza automática

---

### **3. ACTUALIZAR `model Organization` (línea 511)**

**BUSCAR** (alrededor de la línea 517):

```prisma
model Organization {
  id                    String                  @id @default(dbgenerated("gen_random_uuid()"))
  name                  String
  apiKey                String                  @unique
  createdAt             DateTime                @default(now())
  updatedAt             DateTime
  AdvancedVehicleKPI    AdvancedVehicleKPI[]
  DailyProcessingReport DailyProcessingReport[]
  Event                 Event[]
  FileState             FileState[]
  Geofence              Geofence[]
  GeofenceEvent         GeofenceEvent[]
  GeofenceRule          GeofenceRule[]
  GeofenceVehicleState  GeofenceVehicleState[]
  GestorDeEvento        GestorDeEvento[]
  OrganizationConfig    OrganizationConfig?
  Park                  Park[]
  ProcessingEvent       ProcessingEvent[]
  Report                Report[]
  Session               Session[]
  User                  User[]
  Vehicle               Vehicle[]
  Zone                  Zone[]
  MissingFileAlert      MissingFileAlert[]
  ScheduledReport       ScheduledReport[]
}
```

**AÑADIR** estas dos líneas después de `DailyProcessingReport`:

```prisma
  DailyKPI              DailyKPI[]
  SpeedViolation        speed_violations[]
```

**RESULTADO:**

```prisma
model Organization {
  id                    String                  @id @default(dbgenerated("gen_random_uuid()"))
  name                  String
  apiKey                String                  @unique
  createdAt             DateTime                @default(now())
  updatedAt             DateTime
  AdvancedVehicleKPI    AdvancedVehicleKPI[]
  DailyProcessingReport DailyProcessingReport[]
  DailyKPI              DailyKPI[]
  SpeedViolation        speed_violations[]
  Event                 Event[]
  FileState             FileState[]
  Geofence              Geofence[]
  GeofenceEvent         GeofenceEvent[]
  GeofenceRule          GeofenceRule[]
  GeofenceVehicleState  GeofenceVehicleState[]
  GestorDeEvento        GestorDeEvento[]
  OrganizationConfig    OrganizationConfig?
  Park                  Park[]
  ProcessingEvent       ProcessingEvent[]
  Report                Report[]
  Session               Session[]
  User                  User[]
  Vehicle               Vehicle[]
  Zone                  Zone[]
  MissingFileAlert      MissingFileAlert[]
  ScheduledReport       ScheduledReport[]
}
```

---

### **4. ACTUALIZAR `model Vehicle` (línea 882)**

**BUSCAR** (alrededor de la línea 897):

```prisma
model Vehicle {
  id                    String                  @id @default(dbgenerated("gen_random_uuid()"))
  name                  String
  model                 String
  licensePlate          String                  @unique
  brand                 String?
  organizationId        String
  createdAt             DateTime                @default(now())
  updatedAt             DateTime
  userId                String?
  identifier            String                  @unique
  type                  VehicleType
  status                VehicleStatus           @default(ACTIVE)
  parkId                String?
  active                Boolean                 @default(true)
  AdvancedVehicleKPI    AdvancedVehicleKPI[]
  ArchivoSubido         ArchivoSubido[]
  EjecucionEvento       EjecucionEvento[]
  EventVehicle          EventVehicle[]
  FileState             FileState[]
  GestorDeEventoVehicle GestorDeEventoVehicle[]
  InformeGenerado       InformeGenerado[]
  MaintenanceRecord     MaintenanceRecord[]
  ProcessingEvent       ProcessingEvent[]
  RealtimePosition      RealtimePosition[]
  Session               Session[]
  SugerenciaIA          SugerenciaIA[]
  ... (resto)
```

**AÑADIR** estas dos líneas después de `AdvancedVehicleKPI`:

```prisma
  DailyKPI              DailyKPI[]
  SpeedViolation        speed_violations[]
```

---

### **5. ACTUALIZAR `model Session` (línea 662)**

**BUSCAR** (alrededor de la línea 684):

```prisma
model Session {
  id                         String                       @id @default(dbgenerated("gen_random_uuid()"))
  vehicleId                  String
  userId                     String
  endTime                    DateTime?
  startTime                  DateTime
  createdAt                  DateTime                     @default(now())
  sequence                   Int
  sessionNumber              Int
  status                     SessionStatus                @default(ACTIVE)
  updatedAt                  DateTime
  type                       SessionType                  @default(ROUTINE)
  weatherConditions          Json?
  organizationId             String
  parkId                     String?
  zoneId                     String?
  source                     String
  matcheddistance            Float?
  matchedduration            Float?
  matchedgeometry            String?
  matchedconfidence          Float?
  processingversion          String?                      @default("1.0") @db.VarChar(20)
  ArchivoSubido              ArchivoSubido[]
  CanMeasurement             CanMeasurement[]
  DataQualityMetrics         DataQualityMetrics?
  EjecucionEvento            EjecucionEvento[]
  GpsMeasurement             GpsMeasurement[]
  InformeGenerado            InformeGenerado[]
  OperationalKey             OperationalKey[]
  RotativoMeasurement        RotativoMeasurement[]
  ... (resto)
```

**AÑADIR** esta línea después de `RotativoMeasurement`:

```prisma
  SpeedViolation             speed_violations[]
```

---

## 🚀 **PROCESO DE APLICACIÓN**

### **PASO 1: Aplicar cambios al schema**

```bash
# Editar: backend/prisma/schema.prisma
# Aplicar los 5 cambios descritos arriba
```

### **PASO 2: Crear migración**

```bash
cd backend
npx prisma migrate dev --name add_daily_kpi_and_update_speed_violations
```

Esto creará:
- ✅ Tabla `daily_kpi` nueva
- ✅ Columnas `vehicleId`, `organizationId`, `confidence`, `source` en `speed_violations`
- ✅ Foreign keys correspondientes
- ✅ Índices nuevos

### **PASO 3: Regenerar cliente Prisma**

```bash
# DETENER BACKEND PRIMERO (Ctrl+C)
cd backend
npx prisma generate
```

### **PASO 4: Reiniciar backend**

```bash
# Desde la raíz del proyecto
.\iniciar.ps1
```

---

## ⚠️ **NOTAS IMPORTANTES**

### **Migración de datos existentes en `speed_violations`**

Si ya hay datos en `speed_violations`, la migración requerirá:

1. **Valores por defecto temporales** para `vehicleId` y `organizationId`
2. **O eliminar datos antiguos** si no son críticos

**Opción recomendada:** Eliminar datos antiguos

```sql
-- Ejecutar ANTES de la migración si hay datos antiguos
TRUNCATE TABLE speed_violations;
```

### **Verificación post-migración**

```bash
# Verificar que las tablas existen
npx prisma db pull
npx prisma generate

# Verificar datos
npx ts-node backend/src/scripts/verificarResultadosSimple.ts
```

---

## ✅ **CHECKLIST**

- [ ] Aplicar cambio 1: Crear `DailyKPI`
- [ ] Aplicar cambio 2: Modificar `speed_violations`
- [ ] Aplicar cambio 3: Actualizar `Organization`
- [ ] Aplicar cambio 4: Actualizar `Vehicle`
- [ ] Aplicar cambio 5: Actualizar `Session`
- [ ] Ejecutar `npx prisma migrate dev`
- [ ] Detener backend
- [ ] Ejecutar `npx prisma generate`
- [ ] Reiniciar backend
- [ ] Verificar con script de verificación
- [ ] Re-ejecutar post-procesamiento

---

## 📊 **RESULTADO ESPERADO**

Después de estos cambios:

```
✅ Tabla daily_kpi creada con relaciones
✅ Tabla speed_violations actualizada con relaciones
✅ Cliente Prisma sincronizado
✅ 0 errores de TypeScript
✅ Post-procesamiento funcionará correctamente
```

---

**Fecha:** 03/11/2025
**Autor:** Cursor AI Assistant











