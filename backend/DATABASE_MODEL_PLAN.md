# Plan de Reconstrucción del Schema Prisma

## Objetivo
Alinear el schema de Prisma con las funcionalidades F1–F6 de DobackSoft, asegurando coherencia con el código TypeScript existente y los requisitos de negocio (multi-organización, reportes PDF, autoEvaluate, auditoría, etc.).

## Dominios Principales y Modelos

### 1. Núcleo Organizacional
- `Organization`
- `OrganizationSettings`
- `User`
- `UserConfig`
- `AuditLog` (auditorías F3)

### 2. Gestión de Flota y Sesiones
- `Vehicle`
- `VehicleConfiguration`
- `Session`
- `SessionUploadLog`

### 3. Mediciones y Telemetría
- `StabilityMeasurement`
- `CanMeasurement`
- `GpsMeasurement`
- `RotativoMeasurement`
- `StabilityEvent` (eventos derivados de mediciones con metadata)

### 4. Geocercas y Parques
- `Park`
- `Zone`
- `ZoneAudit`

### 5. KPIs y Analítica
- `VehicleKPI`
- `ParkKPI`

### 6. Gestor de Eventos (F2/F3)
- `GestorDeEvento`
- `EventCondition`
- `GestorDeEventoVehicle`
- `EjecucionEvento`
- `AccionDisparada`
- `EventTrigger` (registro de coincidencias autoEvaluate)

### 7. Reportes (F1)
- `Report` (metadatos, expiración, sha256, tamaño)
- `InformeGenerado` (histórico de PDFs generados)
- `ArchivoSubido` (tracking de uploads y errores)

### 8. Notificaciones y Otros
- `Notification`
- `NotificationPreference`

## Ajustes Clave de Diseño
- Convenciones camelCase coherentes (`organizationId`, `createdAt`, etc.).
- Uso de enums alineados con `src/types/enums.ts`.
- Relaciones con eliminación en cascada donde aplica y restricciones para multi-organización.
- Índices necesarios para consultas frecuentes (por sesión, vehículo, timestamps).
- Campos `expiresAt`, `sha256`, `sizeBytes` en `Report` para F1.
- Campo `matchCount` y auditoría en `EjecucionEvento` para F3.

## Migraciones
1. **Base**: organizaciones, usuarios, vehículos, sesiones.
2. **Telemetría**: mediciones CAN/GPS/estabilidad/rotativo.
3. **Eventos**: gestor, condiciones, ejecuciones, triggers.
4. **Reportes**: Report/InformeGenerado/ArchivoSubido.
5. **Geocercas y KPIs**: Park/Zone/VehicleKPI/ParkKPI.
6. **Notificaciones y auditoría**.

> Nota: evaluar consolidar en migración única si se reescribe todo desde cero, o dividir para facilidad de mantenimiento.

## Seed Inicial
- Crear organización demo (“Bomberos Madrid”).
- Usuario ADMIN con hash seguro (bcrypt).
- Parques y zonas base con geometría JSON.
- Vehículos asociados a parques.
- Eventos predefinidos con autoEvaluate donde corresponda.
- Reporte de ejemplo para validar metadatos.

## Pasos Operativos
1. Reescribir `prisma/schema.prisma` según los modelos anteriores.
2. Generar migración (`npx prisma migrate dev --name init_full_schema`).
3. Actualizar `prisma/seed.ts` con datos compatibles.
4. Ejecutar `npx prisma migrate reset --force --skip-generate` y validar.
5. Regenerar el cliente (`npx prisma generate`).
6. Ajustar código TypeScript a los nuevos tipos (imports desde `@prisma/client`).
7. Actualizar documentación y scripts relacionados.

## Validación
- Ejecutar lint (`npm run lint`) y type-check (`npx tsc --noEmit`).
- Correr tests unitarios y e2e relevantes.
- Validar flujo completo de subida→análisis→reporte→exportación.
