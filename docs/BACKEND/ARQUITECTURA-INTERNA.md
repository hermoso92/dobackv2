# 🏗️ ARQUITECTURA INTERNA DEL BACKEND

## 📋 Índice

1. [Estructura General](#estructura-general)
2. [Capas de la Aplicación](#capas-de-la-aplicación)
3. [Flujo de Datos](#flujo-de-datos)
4. [Componentes Principales](#componentes-principales)
5. [Patrones de Diseño](#patrones-de-diseño)
6. [Seguridad y Autenticación](#seguridad-y-autenticación)

---

## 🎯 Estructura General

### Directorio Backend

```
backend/src/
├── adapters/          # Adaptadores externos (Radar, APIs)
├── config/            # Configuración (DB, email, logger, etc.)
├── controllers/       # Controladores (lógica de negocio)
├── middleware/        # Middleware (auth, logging, cache, etc.)
├── routes/            # Definición de rutas API
├── services/          # Servicios de negocio
├── repositories/      # Acceso a datos
├── utils/             # Utilidades generales
├── types/             # Definiciones TypeScript
├── validators/        # Validadores de datos
└── websocket/         # WebSocket para tiempo real
```

---

## 🔄 Capas de la Aplicación

### 1️⃣ **Capa de Entrada (Routes)**

**Ubicación:** `backend/src/routes/`

**Responsabilidades:**
- Definir endpoints HTTP
- Aplicar middleware de autenticación
- Validar parámetros de entrada
- Delegar a controladores

**Ejemplo:**
```typescript
// routes/kpis.ts
router.get('/summary', authenticate, attachOrg, async (req, res) => {
    // Validación
    // Llamada a controlador/servicio
    // Respuesta
});
```

---

### 2️⃣ **Capa de Middleware**

**Ubicación:** `backend/src/middleware/`

**Tipos de Middleware:**

| Middleware | Función |
|------------|---------|
| `auth.ts` | Autenticación JWT |
| `attachOrg.ts` | Inyecta `organizationId` |
| `cache.ts` | Caché de respuestas |
| `logging.ts` | Logging de requests |
| `rateLimit.ts` | Rate limiting |
| `errorHandler.ts` | Manejo de errores |
| `validation.ts` | Validación de schemas |

---

### 3️⃣ **Capa de Controladores**

**Ubicación:** `backend/src/controllers/`

**Responsabilidades:**
- Orquestar llamadas a servicios
- Transformar datos para respuesta
- Manejo de errores específicos

**Principales Controladores:**

```
controllers/
├── DashboardController.ts      # Panel principal
├── KPIController.ts            # KPIs operativos
├── StabilityController.ts      # Análisis de estabilidad
├── TelemetryController.ts      # Datos CAN/GPS
├── UploadController.ts         # Subida de archivos
├── VehicleController.ts        # Gestión de vehículos
└── ReportsController.ts        # Generación de reportes
```

---

### 4️⃣ **Capa de Servicios**

**Ubicación:** `backend/src/services/`

**Tipos de Servicios:**

#### **A. Servicios de Cálculo**
- `kpiCalculator.ts` - Cálculo de KPIs
- `keyCalculator.ts` - Tiempos por clave operacional
- `speedAnalyzer.ts` - Análisis de velocidad

#### **B. Servicios de Procesamiento**
- `UnifiedFileProcessorV2.ts` - Procesamiento unificado de archivos
- `SessionService.ts` - Gestión de sesiones
- `StabilityProcessor.ts` - Procesamiento de estabilidad

#### **C. Servicios de Eventos**
- `eventDetector.ts` - Detección de eventos de estabilidad
- `EventDetectorWithGPS.ts` - Eventos con correlación GPS
- `AlertService.ts` - Sistema de alertas

#### **D. Servicios de Cache**
- `KPICacheService.ts` - Cache de KPIs
- `CacheService.ts` - Cache genérico
- `AICacheService.ts` - Cache de IA

#### **E. Servicios Externos**
- `tomtomService.ts` - Integración TomTom
- `radarService.ts` - Integración Radar
- `NotificationService.ts` - Notificaciones push

---

### 5️⃣ **Capa de Datos (Repositories)**

**Ubicación:** `backend/src/repositories/`

**Repositorios Principales:**
```typescript
- SessionRepository.ts          # CRUD de sesiones
- VehicleRepository.ts          # CRUD de vehículos
- StabilitySessionRepository.ts # Datos de estabilidad
- StabilityMeasurementRepository.ts # Mediciones
```

**Patrón Repository:**
```typescript
class SessionRepository {
    async findByOrganization(orgId: string) {
        return prisma.session.findMany({
            where: { organizationId: orgId }
        });
    }
}
```

---

## 🔄 Flujo de Datos

### Flujo Típico de Request

```
1. Cliente HTTP
   ↓
2. Express Router (routes/index.ts)
   ↓
3. Middleware Chain
   - logging.ts        → Log del request
   - auth.ts           → Valida JWT
   - attachOrg.ts      → Inyecta organizationId
   - validation.ts     → Valida parámetros
   ↓
4. Route Handler (routes/kpis.ts)
   ↓
5. Controller (controllers/KPIController.ts)
   ↓
6. Service (services/kpiCalculator.ts)
   ↓
7. Repository / Prisma
   ↓
8. Base de Datos (PostgreSQL)
   ↓
9. Respuesta JSON
   ↓
10. Cliente HTTP
```

### Ejemplo Concreto: Cálculo de KPIs

```
GET /api/kpis/summary?from=2025-10-01&to=2025-10-08

1. routes/kpis.ts → authenticate → attachOrg
2. Extrae filtros: { organizationId, from, to, vehicleIds }
3. Verifica cache: kpiCacheService.get(cacheKey)
4. Si no existe en cache:
   a. Obtiene sesiones filtradas de DB
   b. Llama a kpiCalculator.calcularKPIs(sessionIds)
   c. kpiCalculator usa:
      - calcularTiemposPorClave()    → Estados operacionales
      - calcularTiempoRotativo()     → Tiempo con rotativo
      - calcularKilometrosRecorridos() → GPS distance
      - calcularEventosEstabilidad() → Eventos detectados
   d. Guarda en cache: kpiCacheService.set(cacheKey, result)
5. Retorna respuesta JSON
```

---

## 🧩 Componentes Principales

### 1. Sistema de Autenticación

**Flujo JWT:**
```
Login (POST /api/auth/login)
  ↓
Valida credenciales (bcrypt)
  ↓
Genera JWT (jwt.sign)
  ↓
Almacena en httpOnly cookie
  ↓
Middleware authenticate valida token en cada request
```

**Código:**
```typescript
// middleware/auth.ts
export const authenticate = async (req, res, next) => {
    const token = req.cookies.auth_token;
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
};
```

---

### 2. Sistema de Filtrado por Organización

**Middleware `attachOrg`:**
```typescript
// middleware/attachOrg.ts
export const attachOrg = (req, res, next) => {
    const orgId = req.user?.organizationId;
    req.orgId = orgId;
    next();
};
```

**Uso en Queries:**
```typescript
const sessions = await prisma.session.findMany({
    where: {
        organizationId: req.orgId,  // ✅ Filtro automático
        ...otherFilters
    }
});
```

---

### 3. Sistema de Cache

**Estrategia de Cache:**

```typescript
// services/KPICacheService.ts
class KPICacheService {
    private cache = new Map();
    private ttl = 5 * 60 * 1000; // 5 minutos

    get(key: string) {
        const cached = this.cache.get(key);
        if (cached && Date.now() < cached.expiry) {
            return cached.data;
        }
        return null;
    }

    set(key: string, data: any) {
        this.cache.set(key, {
            data,
            expiry: Date.now() + this.ttl
        });
    }
}
```

**Clave de Cache:**
```
kpis:${organizationId}:${from}:${to}:${vehicleIds.join(',')}
```

---

### 4. Sistema de Logging

**Logger Centralizado:**
```typescript
// utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

export { logger };
```

**Uso:**
```typescript
logger.info('KPIs calculados', { sessionCount: 63, duration: 2000 });
logger.error('Error en cálculo', { error, sessionId });
```

---

### 5. Sistema de WebSocket

**Alertas en Tiempo Real:**
```typescript
// websocket/alertWebSocket.ts
export function setupAlertWebSocket(server) {
    const wss = new WebSocketServer({ server, path: '/ws/alerts' });

    wss.on('connection', (ws, req) => {
        const orgId = extractOrgFromToken(req);
        ws.orgId = orgId;

        ws.on('message', (message) => {
            // Handle messages
        });
    });

    // Broadcast alert
    function broadcastAlert(alert, orgId) {
        wss.clients.forEach(client => {
            if (client.orgId === orgId) {
                client.send(JSON.stringify(alert));
            }
        });
    }
}
```

---

## 🎨 Patrones de Diseño

### 1. Repository Pattern

```typescript
// repositories/SessionRepository.ts
export class SessionRepository {
    async findById(id: string) {
        return prisma.session.findUnique({ where: { id } });
    }

    async findByOrganization(orgId: string, filters?) {
        return prisma.session.findMany({
            where: { organizationId: orgId, ...filters }
        });
    }

    async create(data: SessionCreateInput) {
        return prisma.session.create({ data });
    }
}
```

---

### 2. Service Layer Pattern

```typescript
// services/KPICalculationService.ts
export class KPICalculationService {
    constructor(
        private sessionRepo: SessionRepository,
        private cacheService: CacheService
    ) {}

    async calculateKPIs(filters: KPIFilters) {
        // Cache lookup
        const cached = this.cacheService.get(cacheKey);
        if (cached) return cached;

        // Business logic
        const sessions = await this.sessionRepo.findByOrganization(
            filters.organizationId,
            { startTime: { gte: filters.from, lte: filters.to } }
        );

        const kpis = await this.performCalculations(sessions);

        // Cache result
        this.cacheService.set(cacheKey, kpis);

        return kpis;
    }
}
```

---

### 3. Middleware Chain Pattern

```typescript
// Composición de middleware
router.get('/kpis/summary',
    authenticate,          // 1. Autenticación
    attachOrg,            // 2. Organización
    validateQuery,        // 3. Validación
    cacheMiddleware,      // 4. Cache
    kpiController.getSummary  // 5. Handler
);
```

---

### 4. Factory Pattern

```typescript
// utils/logger.ts
export function createLogger(module: string) {
    return winston.createLogger({
        defaultMeta: { service: module },
        // ... config
    });
}

// Uso
const logger = createLogger('KPIService');
```

---

## 🔐 Seguridad y Autenticación

### 1. Autenticación JWT

**Generación de Token:**
```typescript
const token = jwt.sign(
    {
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
    },
    JWT_SECRET,
    { expiresIn: '24h' }
);
```

**Almacenamiento:**
```typescript
res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
});
```

---

### 2. Filtrado de Organización

**Todos los queries incluyen:**
```typescript
where: {
    organizationId: req.user.organizationId,
    // ... otros filtros
}
```

**Validación:**
```typescript
// middleware/organizationMiddleware.ts
if (resourceOrgId !== req.user.organizationId) {
    return res.status(403).json({ error: 'Acceso denegado' });
}
```

---

### 3. Rate Limiting

```typescript
// middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por ventana
    message: 'Demasiadas peticiones'
});

// Uso
router.use('/api/', apiLimiter);
```

---

### 4. Validación de Entrada

```typescript
// middleware/validation.ts
import Joi from 'joi';

export function validateQuery(schema: Joi.Schema) {
    return (req, res, next) => {
        const { error } = schema.validate(req.query);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        next();
    };
}

// Uso
const kpiQuerySchema = Joi.object({
    from: Joi.date().required(),
    to: Joi.date().required(),
    vehicleIds: Joi.array().items(Joi.string().uuid())
});

router.get('/kpis', validateQuery(kpiQuerySchema), handler);
```

---

## 📊 Manejo de Errores

### Error Handler Global

```typescript
// middleware/errorHandler.ts
export function errorHandler(err, req, res, next) {
    logger.error('Error en request', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        user: req.user?.id
    });

    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ error: 'No autorizado' });
    }

    res.status(500).json({ error: 'Error interno del servidor' });
}

// Uso en app.ts
app.use(errorHandler);
```

---

## 📈 Métricas y Monitoreo

### Performance Logging

```typescript
// middleware/metrics.ts
export function metricsMiddleware(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('Request completado', {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration,
            user: req.user?.id
        });

        // Métricas a Prometheus/Datadog
        metrics.recordRequest(req.path, duration, res.statusCode);
    });

    next();
}
```

---

## 🔧 Configuración

### Variables de Entorno

```typescript
// config/env.ts
export const config = {
    port: process.env.PORT || 9998,
    database: {
        url: process.env.DATABASE_URL
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: '24h'
    },
    cache: {
        ttl: parseInt(process.env.CACHE_TTL || '300')
    },
    upload: {
        maxSize: parseInt(process.env.MAX_UPLOAD_SIZE || '10485760')
    }
};
```

---

## 🚀 Optimizaciones

### 1. Queries Optimizadas

```typescript
// ✅ Bueno: select específico
const sessions = await prisma.session.findMany({
    where: { organizationId },
    select: { id: true, startTime: true, endTime: true }
});

// ❌ Malo: traer todo
const sessions = await prisma.session.findMany({
    where: { organizationId }
});
```

### 2. Paginación

```typescript
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 20;
const skip = (page - 1) * limit;

const [data, total] = await Promise.all([
    prisma.session.findMany({ skip, take: limit }),
    prisma.session.count()
]);

res.json({
    data,
    pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
    }
});
```

### 3. Batch Processing

```typescript
// Procesar en lotes
const BATCH_SIZE = 100;
for (let i = 0; i < sessions.length; i += BATCH_SIZE) {
    const batch = sessions.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(session => processSession(session)));
}
```

---

## 📚 Referencias

- [Documentación de Endpoints](../API/ENDPOINTS-COMPLETOS.md)
- [Sistema de KPIs](./SISTEMA-KPIS.md)
- [Sistema de Eventos](./GENERACION-EVENTOS.md)
- [Sistema de Upload](../MODULOS/upload/SISTEMA-UPLOAD-COMPLETO.md)

---

**Última actualización:** Octubre 2025  
**Versión:** DobackSoft StabilSafe V3

