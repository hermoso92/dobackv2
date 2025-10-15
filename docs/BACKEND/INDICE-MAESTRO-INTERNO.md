# 📚 ÍNDICE MAESTRO - FUNCIONAMIENTO INTERNO DEL SISTEMA

> **Documentación completa del funcionamiento interno de DobackSoft StabilSafe V3**

---

## 📋 Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Sistema de KPIs](#sistema-de-kpis)
3. [Sistema de Eventos](#sistema-de-eventos)
4. [Sistema de Filtros](#sistema-de-filtros)
5. [Sistema de Upload](#sistema-de-upload)
6. [API Endpoints](#api-endpoints)
7. [Referencias Rápidas](#referencias-rápidas)

---

## 🏗️ Arquitectura General

### Documento Principal
📄 **[ARQUITECTURA-INTERNA.md](./ARQUITECTURA-INTERNA.md)**

### Contenido

#### 1. Estructura General
- Directorio backend
- Organización de capas
- Patrones de diseño

#### 2. Capas de la Aplicación
- **Capa de Entrada (Routes):** Definición de endpoints HTTP
- **Capa de Middleware:** Autenticación, logging, cache, validación
- **Capa de Controladores:** Orquestación de lógica de negocio
- **Capa de Servicios:** Servicios de cálculo, procesamiento, eventos
- **Capa de Datos (Repositories):** Acceso a datos con Prisma

#### 3. Flujo de Datos
```
Cliente → Router → Middleware → Controller → Service → Repository → BD
```

#### 4. Componentes Principales
- Sistema de Autenticación (JWT)
- Sistema de Filtrado por Organización
- Sistema de Cache
- Sistema de Logging
- Sistema de WebSocket

#### 5. Seguridad
- Autenticación JWT
- Filtrado de Organización
- Rate Limiting
- Validación de Entrada

---

## 📊 Sistema de KPIs

### Documento Principal
📄 **[SISTEMA-KPIS.md](./SISTEMA-KPIS.md)**

### Contenido

#### 1. Endpoints de KPIs
- `GET /api/kpis/summary` - Resumen completo de KPIs
- `GET /api/v1/kpis/summary` - Alias alternativo
- `GET /api/kpis/test` - Endpoint de prueba

#### 2. Cálculo de KPIs
```
┌─────────────────────────────────────┐
│     kpiCalculator.ts (Orquestador)  │
└─────────────────────────────────────┘
                  │
                  ├─→ calcularTiemposPorClave()     [keyCalculator.ts]
                  ├─→ calcularTiempoRotativo()      [kpiCalculator.ts]
                  ├─→ calcularKilometrosRecorridos() [kpiCalculator.ts]
                  ├─→ calcularVelocidadPromedio()   [kpiCalculator.ts]
                  └─→ calcularEventosEstabilidad()  [kpiCalculator.ts]
```

#### 3. KPIs Calculados

| KPI | Descripción | Fuente de Datos |
|-----|-------------|-----------------|
| **Estados Operacionales** | Tiempos por clave (0-5) | `operational_state_segments` |
| **Tiempo Rotativo** | Tiempo con rotativo ON | `rotativo_measurements` |
| **Kilómetros** | Distancia recorrida | `gps_measurements` (Haversine) |
| **Velocidad Promedio** | Velocidad media | `gps_measurements` |
| **Eventos Estabilidad** | Total/Críticos/Moderados/Leves | `stability_events` |

#### 4. Sistema de Cache
- TTL: 5 minutos
- Clave: `kpis:${orgId}:${from}:${to}:${vehicleIds}`
- Invalidación con `?force=true`

#### 5. Filtros Disponibles
- `from`, `to` (obligatorios)
- `vehicleIds[]` (opcional)
- `force` (opcional)

---

## 🚨 Sistema de Eventos

### Documento Principal
📄 **[GENERACION-EVENTOS.md](./GENERACION-EVENTOS.md)**

### Contenido

#### 1. Tipos de Eventos

| Tipo | Condición | Severidad |
|------|-----------|-----------|
| **RIESGO_VUELCO** | SI < 0.50 | Variable (SI) |
| **VUELCO_INMINENTE** | SI < 0.10 AND (roll > 10° OR gx > 30°/s) | 🔴 Crítica |
| **DERIVA_PELIGROSA** | abs(gx) > 45°/s AND SI < 0.50 | Variable |
| **DERIVA_LATERAL_SIGNIFICATIVA** | abs(gx) > 30°/s AND SI < 0.50 | Variable |
| **MANIOBRA_BRUSCA** | ay > 0.6g OR az > 1.5g | Variable |
| **CURVA_ESTABLE** | gx sostenido > 15°/s, SI estable | 🟢 Normal |
| **CAMBIO_CARGA** | Δgx > 15°/s en < 1s | Variable |
| **ZONA_INESTABLE** | Múltiples eventos en área | 🟠 Moderada |

#### 2. Índice de Estabilidad (SI)

**Rango:** [0, 1]

| Rango SI | Severidad | Color | Descripción |
|----------|-----------|-------|-------------|
| SI ≥ 0.50 | Normal | 🟢 | Sin evento |
| 0.35 ≤ SI < 0.50 | Leve | 🟡 | Evento menor |
| 0.20 ≤ SI < 0.35 | Moderada | 🟠 | Evento significativo |
| SI < 0.20 | Grave | 🔴 | Evento crítico |

#### 3. Detección de Eventos

**Servicio:** `eventDetector.ts`

**Flujo:**
```
Medición → Detectores → Clasificación (SI) → Correlación GPS → Persistencia
```

#### 4. Correlación GPS
- Ventana temporal: ±5 segundos
- Asociación de coordenadas (lat, lon)
- Análisis de puntos negros

#### 5. API de Eventos
- `GET /api/stability-events` - Obtener eventos con filtros
- `POST /api/generate-events` - Generar eventos para sesión
- `GET /api/events/hotspots` - Puntos negros

---

## 🔍 Sistema de Filtros

### Documento Principal
📄 **[SISTEMA-FILTROS.md](./SISTEMA-FILTROS.md)**

### Contenido

#### 1. Filtros de Organización
- Middleware `attachOrg`
- Filtro automático en todas las queries
- Validación de acceso a recursos

#### 2. Filtros de Fecha
- Formato: YYYY-MM-DD
- Validación de rango
- Rango inclusivo (to incluye todo el día)

#### 3. Filtros de Vehículos
- Parsing robusto de `vehicleIds[]`
- Validación de UUIDs
- Query con `vehicleId: { in: vehicleIds }`

#### 4. Filtros de Sesiones
- Organización (automático)
- Vehículos
- Fechas
- Estado (ACTIVE, COMPLETED, CANCELLED)
- Tipo (ROUTINE, EMERGENCY, TEST)

#### 5. Filtros de Eventos
- Severidad (GRAVE, MODERADA, LEVE)
- Tipo de evento
- Filtros geográficos (coordenadas, bounding box)

#### 6. Middleware de Validación
- Validación con Joi
- Schemas por endpoint
- Mensajes de error descriptivos

---

## 📤 Sistema de Upload

### Documento Principal
📄 **[SISTEMA-UPLOAD-INTERNO.md](../MODULOS/upload/SISTEMA-UPLOAD-INTERNO.md)**

### Contenido

#### 1. Flujo Completo
```
Upload → UnifiedFileProcessorV2 → SessionDetectorV2 → 
TemporalCorrelator → SessionValidator → Persistencia
```

#### 2. Componentes Principales

| Componente | Responsabilidad |
|------------|-----------------|
| **UnifiedFileProcessorV2** | Orquestador principal |
| **SessionDetectorV2** | Detectar sesiones (1-62 por archivo) |
| **TemporalCorrelator** | Correlacionar archivos por tiempo (±5 min) |
| **ForeignKeyValidator** | Validar usuario y organización |
| **SessionValidator** | Validar calidad de sesiones |

#### 3. Parsers Robustos
- **RobustGPSParser:** GPS con interpolación
- **RobustStabilityParser:** Estabilidad con validación SI
- **RobustRotativoParser:** Rotativo (estados 0, 1, 2)

#### 4. Detección Multi-Sesión
- Detectar inicio de sesión (línea con "Sesión:")
- Detectar fin de sesión (línea vacía)
- Soportar 1-62 sesiones por archivo

#### 5. Correlación Temporal
- GPS es "ancla" (obligatorio)
- Estabilidad y Rotativo opcionales
- Umbral: ±5 minutos

#### 6. Validación
- Duración mínima: 30 segundos
- GPS válido: >30% coordenadas válidas
- Advertencias si <50% GPS válido

#### 7. Persistencia
```
Session → GPS/Rotativo/Stability → 
Operational State Segments → Stability Events
```

---

## 🌐 API Endpoints

### Documento Principal
📄 **[ENDPOINTS-COMPLETOS.md](../API/ENDPOINTS-COMPLETOS.md)**

### Endpoints Principales

#### Autenticación
- `POST /api/auth/login` - Login con email/password
- `GET /api/auth/verify` - Verificar token JWT
- `POST /api/auth/logout` - Cerrar sesión

#### Dashboard
- `GET /api/dashboard/vehicles` - Estadísticas de vehículos
- `GET /api/dashboard/stats` - Estadísticas generales

#### KPIs
- `GET /api/kpis/summary` - Resumen de KPIs
- `GET /api/v1/kpis/summary` - Alias

#### Sesiones
- `GET /api/sessions` - Listar sesiones
- `GET /api/sessions/ranking` - Ranking de sesiones
- `GET /api/telemetry-v2/sessions` - Sesiones con telemetría

#### Eventos
- `GET /api/stability-events` - Eventos de estabilidad
- `POST /api/generate-events` - Generar eventos
- `GET /api/events/hotspots` - Puntos negros

#### Upload
- `POST /api/upload-unified/unified` - Subida unificada
- `POST /api/upload` - Upload legacy (deprecated)

#### Vehículos
- `GET /api/vehicles` - Listar vehículos
- `POST /api/vehicles` - Crear vehículo
- `GET /api/vehicles/:id` - Detalles de vehículo

#### Reportes
- `GET /api/reports` - Listar reportes
- `POST /api/reports` - Generar reporte
- `GET /api/reports/:id/pdf` - Descargar PDF

---

## 🔧 Referencias Rápidas

### Archivos Clave

#### Backend Core
```
backend/src/
├── routes/
│   ├── index.ts              # Router principal
│   ├── kpis.ts               # Rutas de KPIs
│   ├── upload.ts             # Rutas de upload
│   └── stability.ts          # Rutas de estabilidad
├── services/
│   ├── kpiCalculator.ts      # Cálculo de KPIs
│   ├── keyCalculator.ts      # Tiempos por clave
│   ├── eventDetector.ts      # Detección de eventos
│   └── upload/
│       ├── UnifiedFileProcessorV2.ts
│       ├── SessionDetectorV2.ts
│       └── TemporalCorrelator.ts
├── middleware/
│   ├── auth.ts               # Autenticación JWT
│   ├── attachOrg.ts          # Filtro de organización
│   └── validation.ts         # Validación de parámetros
└── config/
    ├── prisma.ts             # Cliente Prisma
    └── logger.ts             # Logger Winston
```

---

### Comandos Útiles

#### Desarrollo
```bash
# Iniciar sistema completo
.\iniciar.ps1

# Iniciar solo backend
cd backend
npm run dev

# Ver logs
tail -f backend/logs/combined.log

# Limpiar cache
# (incluir en código si es necesario)
```

#### Testing
```bash
# Tests unitarios
npm test

# Tests de integración
npm run test:integration

# Coverage
npm run test:coverage
```

#### Base de Datos
```bash
# Migraciones
npx prisma migrate dev

# Reset completo
npx prisma migrate reset

# Prisma Studio
npx prisma studio
```

---

### Variables de Entorno Clave

```env
# Base de Datos
DATABASE_URL=postgresql://user:pass@localhost:5432/dobacksoft

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Puertos
PORT=9998
FRONTEND_PORT=5174

# Cache
CACHE_TTL=300000  # 5 minutos en ms

# Upload
MAX_UPLOAD_SIZE=10485760  # 10MB
```

---

### Convenciones de Código

#### Logging
```typescript
import { createLogger } from '../utils/logger';
const logger = createLogger('ModuleName');

logger.info('Mensaje informativo', { contexto: 'valor' });
logger.error('Error detectado', { error, stack });
logger.warn('Advertencia', { detalles });
```

#### Respuestas API
```typescript
// Éxito
res.json({
    success: true,
    data: resultado
});

// Error
res.status(400).json({
    success: false,
    error: 'Mensaje de error'
});
```

#### Queries Prisma
```typescript
// ✅ SIEMPRE incluir organizationId
const data = await prisma.model.findMany({
    where: {
        organizationId: req.orgId,  // Obligatorio
        ...otherFilters
    }
});
```

---

## 📖 Documentación Adicional

### Módulos Funcionales
- [Dashboard](../MODULOS/dashboard/README.md)
- [Estabilidad](../MODULOS/estabilidad/README.md)
- [Telemetría](../MODULOS/telemetria/README.md)
- [IA](../MODULOS/ia/README.md)
- [Geofences](../MODULOS/geofences/README.md)
- [Operaciones](../MODULOS/operaciones/README.md)
- [Reportes](../MODULOS/reportes/README.md)
- [Administración](../MODULOS/administracion/README.md)
- [Upload](../MODULOS/upload/README.md)

### Documentación General
- [Flujo Completo del Sistema](../00-GENERAL/FLUJO_COMPLETO_SISTEMA.md)
- [Guía de Archivos y BD](../00-GENERAL/GUIA_ARCHIVOS_BD_DOBACKSOFT.md)
- [Protocolo del Sistema](../00-GENERAL/PROTOCOLOS_SISTEMA_UPLOAD.md)

### Desarrollo
- [Cronograma de Desarrollo](../DESARROLLO/CRONOGRAMA_DESARROLLO_DOBACKSOFT.md)
- [Guía de Git y GitHub](../00-GENERAL/GUIA_COMPLETA_GIT_GITHUB.md)

### Calidad
- [Auditoría Completa](../CALIDAD/AUDITORIA_COMPLETA_DASHBOARD_UPLOAD.md)
- [Mandamientos StabilSafe](../CALIDAD/MANDAMIENTOS_STABILSAFE.md)
- [Plan de Fixes](../CALIDAD/PLAN_FIXES_PRODUCCION.md)

---

## 🎯 Mapa Mental del Sistema

```
DobackSoft StabilSafe V3
│
├── ENTRADA
│   ├── Frontend (React + Tailwind)
│   ├── API REST (Express)
│   └── WebSocket (Alertas en tiempo real)
│
├── PROCESAMIENTO
│   ├── Upload de Archivos
│   │   ├── Detección de Sesiones
│   │   ├── Correlación Temporal
│   │   └── Validación y Persistencia
│   │
│   ├── Cálculo de KPIs
│   │   ├── Estados Operacionales
│   │   ├── Tiempo Rotativo
│   │   ├── Kilómetros (GPS)
│   │   ├── Velocidad Promedio
│   │   └── Eventos de Estabilidad
│   │
│   └── Generación de Eventos
│       ├── Detección por SI
│       ├── Correlación GPS
│       └── Clasificación de Severidad
│
├── ALMACENAMIENTO
│   ├── PostgreSQL (Datos estructurados)
│   ├── Cache en Memoria (KPIs, sesiones)
│   └── Sistema de Archivos (Uploads temporales)
│
└── SALIDA
    ├── Dashboard (Visualización)
    ├── Reportes PDF (Exportación)
    ├── Alertas (Notificaciones)
    └── API REST (Integración externa)
```

---

## 📞 Soporte y Contacto

### Errores Comunes

#### Error: "Organization ID not found"
- **Causa:** Token JWT expirado o inválido
- **Solución:** Relogin con `/api/auth/login`

#### Error: "Rango de fechas obligatorio"
- **Causa:** Falta `from` o `to` en query
- **Solución:** Incluir ambos parámetros: `?from=2025-10-01&to=2025-10-08`

#### Error: "Foreign keys inválidas"
- **Causa:** Usuario u organización no existen en BD
- **Solución:** Verificar con Prisma Studio

#### Error: "Sesión demasiado corta"
- **Causa:** Sesión < 30 segundos
- **Solución:** Datos inválidos, revisar archivos de origen

---

## 📝 Changelog

### Versión 3.0 (Octubre 2025)
- ✅ Sistema de KPIs completo y optimizado
- ✅ Generación de eventos con correlación GPS
- ✅ Upload unificado con detección multi-sesión
- ✅ Sistema de cache inteligente
- ✅ Documentación completa del funcionamiento interno

### Versión 2.0 (Septiembre 2025)
- Sistema de upload básico
- KPIs iniciales
- Dashboard funcional

### Versión 1.0 (Agosto 2025)
- Prototipo inicial
- Estructura base

---

## 🚀 Próximos Pasos

1. ✅ **Completado:** Documentación de funcionamiento interno
2. 🔄 **En progreso:** Optimizaciones de rendimiento
3. 📋 **Pendiente:** Tests de integración completos
4. 📋 **Pendiente:** Documentación de API externa
5. 📋 **Pendiente:** Guías de despliegue y producción

---

**Última actualización:** Octubre 2025  
**Versión:** DobackSoft StabilSafe V3  
**Autor:** Equipo DobackSoft  
**Licencia:** Propietaria

