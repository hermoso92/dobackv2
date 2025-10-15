# 🔍 SISTEMA DE FILTROS - DOCUMENTACIÓN COMPLETA

## 📋 Índice

1. [Visión General](#visión-general)
2. [Filtros de Organización](#filtros-de-organización)
3. [Filtros de Fecha](#filtros-de-fecha)
4. [Filtros de Vehículos](#filtros-de-vehículos)
5. [Filtros de Sesiones](#filtros-de-sesiones)
6. [Filtros de Eventos](#filtros-de-eventos)
7. [Middleware de Filtros](#middleware-de-filtros)
8. [Ejemplos de Uso](#ejemplos-de-uso)

---

## 🎯 Visión General

El sistema de filtros de DobackSoft garantiza que:
1. **Seguridad:** Cada organización solo ve sus propios datos
2. **Flexibilidad:** Filtros combinables (fecha + vehículo + tipo)
3. **Rendimiento:** Queries optimizadas con índices
4. **Validación:** Parámetros validados antes de consultar BD

### Arquitectura de Filtros

```
┌────────────────────────────────┐
│   HTTP Request con Query Params│
│   ?from=2025-10-01&vehicleIds[]=uuid │
└────────────────────────────────┘
                │
                ↓
┌────────────────────────────────┐
│   Middleware Chain              │
│   1. authenticate → orgId       │
│   2. attachOrg → req.orgId      │
│   3. validation → params válidos│
└────────────────────────────────┘
                │
                ↓
┌────────────────────────────────┐
│   Route Handler                 │
│   Extrae y procesa filtros      │
└────────────────────────────────┘
                │
                ↓
┌────────────────────────────────┐
│   Prisma Query con WHERE        │
│   where: { organizationId, ... }│
└────────────────────────────────┘
                │
                ↓
┌────────────────────────────────┐
│   PostgreSQL con índices        │
└────────────────────────────────┘
```

---

## 🏢 Filtros de Organización

### Middleware `attachOrg`

**Ubicación:** `backend/src/middleware/attachOrg.ts`

**Función:** Inyecta `organizationId` desde el token JWT en todos los requests.

**Código:**
```typescript
export const attachOrg = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user || !user.organizationId) {
        return res.status(401).json({ 
            error: 'Organization ID not found' 
        });
    }

    (req as any).orgId = user.organizationId;
    next();
};
```

**Uso en Rutas:**
```typescript
router.get('/vehicles', authenticate, attachOrg, async (req, res) => {
    const orgId = (req as any).orgId;
    
    const vehicles = await prisma.vehicle.findMany({
        where: { organizationId: orgId }  // ✅ Filtro automático
    });
    
    res.json({ success: true, data: vehicles });
});
```

---

### Filtro Automático en Todas las Queries

**Patrón Obligatorio:**
```typescript
// ✅ CORRECTO - Siempre filtrar por organización
const sessions = await prisma.session.findMany({
    where: {
        organizationId: req.orgId,  // ✅ Obligatorio
        ...otherFilters
    }
});

// ❌ INCORRECTO - NUNCA omitir organizationId
const sessions = await prisma.session.findMany({
    where: {
        vehicleId: vehicleId  // ⚠️ Expone datos entre organizaciones
    }
});
```

---

### Validación de Acceso a Recursos

```typescript
// Verificar que el recurso pertenece a la organización
const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId }
});

if (vehicle.organizationId !== req.orgId) {
    return res.status(403).json({ 
        error: 'Acceso denegado' 
    });
}
```

---

## 📅 Filtros de Fecha

### Formato y Validación

**Formato Esperado:** `YYYY-MM-DD`

**Extracción:**
```typescript
const from = req.query.from as string;
const to = req.query.to as string;

// Validación
if (!from || !to) {
    return res.status(400).json({
        error: 'Rango de fechas obligatorio: from y to (YYYY-MM-DD)'
    });
}
```

---

### Conversión a Date Objects

```typescript
// Convertir a Date
const dateFrom = new Date(from);
const dateTo = new Date(to);

// Validar fechas válidas
if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
    return res.status(400).json({
        error: 'Formato de fecha inválido. Use YYYY-MM-DD'
    });
}

// Validar rango lógico
if (dateFrom > dateTo) {
    return res.status(400).json({
        error: 'La fecha de inicio debe ser anterior a la fecha de fin'
    });
}
```

---

### Rango Inclusivo

**Problema:** `to` debe incluir todo el día.

**Solución:**
```typescript
// Hacer 'to' inclusivo (hasta 23:59:59)
const dateToInclusive = new Date(dateTo);
dateToInclusive.setDate(dateToInclusive.getDate() + 1); // Añadir 1 día

// Query con rango [from, to)
const sessions = await prisma.session.findMany({
    where: {
        organizationId: orgId,
        startTime: {
            gte: dateFrom,        // >= from (00:00:00)
            lt: dateToInclusive   // < to+1 (00:00:00)
        }
    }
});
```

**Ejemplo:**
```
from = "2025-10-01"  →  2025-10-01T00:00:00.000Z
to = "2025-10-08"    →  2025-10-08T23:59:59.999Z (inclusivo)
                     →  2025-10-09T00:00:00.000Z (exclusivo en query)
```

---

### Filtros de Fecha en SQL Raw

```sql
-- ✅ Correcto con casting
WHERE "startTime" >= ${dateFrom}::timestamp
  AND "startTime" < ${dateTo}::timestamp

-- ❌ Incorrecto sin casting
WHERE "startTime" >= ${dateFrom}
  AND "startTime" < ${dateTo}
```

---

## 🚗 Filtros de Vehículos

### Parsing de VehicleIds

**Problema:** Express puede parsear de múltiples formas:
- `?vehicleIds[]=uuid1&vehicleIds[]=uuid2`
- `?vehicleIds=uuid1,uuid2`
- `?vehicles=uuid1`

**Solución Robusta:**
```typescript
let vehicleIds: string[] | undefined;

const vehicleIdsRaw = 
    req.query['vehicleIds[]'] || 
    req.query.vehicleIds || 
    req.query.vehicles;

if (vehicleIdsRaw) {
    if (Array.isArray(vehicleIdsRaw)) {
        // Array de strings
        vehicleIds = vehicleIdsRaw as string[];
    } else {
        // String (puede estar separado por comas)
        const vehicleIdsStr = vehicleIdsRaw as string;
        vehicleIds = vehicleIdsStr.includes(',')
            ? vehicleIdsStr.split(',').map(id => id.trim())
            : [vehicleIdsStr];
    }
}
```

---

### Validación de UUIDs

```typescript
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

if (vehicleIds) {
    const invalidIds = vehicleIds.filter(id => !UUID_REGEX.test(id));
    
    if (invalidIds.length > 0) {
        return res.status(400).json({
            error: 'IDs de vehículo inválidos',
            invalidIds
        });
    }
}
```

---

### Query con Filtro de Vehículos

```typescript
const whereClause: any = {
    organizationId: orgId  // ✅ Siempre presente
};

if (vehicleIds && vehicleIds.length > 0) {
    whereClause.vehicleId = { in: vehicleIds };
}

const sessions = await prisma.session.findMany({
    where: whereClause
});
```

---

## 📊 Filtros de Sesiones

### Filtros Disponibles

| Filtro | Tipo | Query Param | Descripción |
|--------|------|-------------|-------------|
| **Organización** | UUID | Automático (JWT) | Siempre presente |
| **Vehículos** | UUID[] | `vehicleIds[]` | Lista de vehículos |
| **Fechas** | Date | `from`, `to` | Rango de fechas |
| **Estado** | Enum | `status` | ACTIVE, COMPLETED, CANCELLED |
| **Tipo** | Enum | `type` | ROUTINE, EMERGENCY, TEST |
| **Número de Sesión** | number | `sessionNumber` | Número específico |

---

### Construcción de Filtros

```typescript
interface SessionFilters {
    organizationId: string;
    vehicleId?: { in: string[] };
    startTime?: { gte: Date; lt: Date };
    status?: SessionStatus;
    type?: SessionType;
    sessionNumber?: number;
}

const whereClause: SessionFilters = {
    organizationId: req.orgId  // ✅ Obligatorio
};

// Filtro de vehículos
if (vehicleIds?.length > 0) {
    whereClause.vehicleId = { in: vehicleIds };
}

// Filtro de fechas
if (from && to) {
    whereClause.startTime = {
        gte: new Date(from),
        lt: new Date(to)
    };
}

// Filtro de estado
if (status) {
    whereClause.status = status as SessionStatus;
}

// Filtro de tipo
if (type) {
    whereClause.type = type as SessionType;
}

// Ejecutar query
const sessions = await prisma.session.findMany({
    where: whereClause,
    orderBy: { startTime: 'desc' }
});
```

---

### Filtros con Relaciones

```typescript
// Incluir datos relacionados
const sessions = await prisma.session.findMany({
    where: whereClause,
    include: {
        vehicle: {
            select: {
                name: true,
                licensePlate: true
            }
        },
        user: {
            select: {
                name: true,
                email: true
            }
        }
    }
});
```

---

## 🚨 Filtros de Eventos

### Filtros de Severity

**Enums:**
```typescript
type Severity = 'GRAVE' | 'MODERADA' | 'LEVE' | 'NORMAL';
```

**Query:**
```typescript
const severity = req.query.severity as Severity;

const whereClause: any = {
    organizationId: req.orgId
};

if (severity) {
    whereClause.severity = severity;
}

const events = await prisma.stabilityEvent.findMany({
    where: whereClause
});
```

---

### Filtros de Tipo de Evento

**Tipos Disponibles:**
```typescript
type EventType = 
    | 'RIESGO_VUELCO'
    | 'VUELCO_INMINENTE'
    | 'DERIVA_PELIGROSA'
    | 'MANIOBRA_BRUSCA'
    | 'CURVA_ESTABLE'
    | 'CAMBIO_CARGA'
    | 'ZONA_INESTABLE';
```

**Query:**
```typescript
const type = req.query.type as EventType;

if (type) {
    whereClause.type = type;
}

// O múltiples tipos
const types = req.query.types as EventType[];

if (types?.length > 0) {
    whereClause.type = { in: types };
}
```

---

### Filtros Geográficos

**Por Coordenadas:**
```typescript
const lat = parseFloat(req.query.lat as string);
const lon = parseFloat(req.query.lon as string);
const radius = parseFloat(req.query.radius as string) || 1000; // metros

// Query con PostGIS (si disponible)
const events = await prisma.$queryRaw`
    SELECT * FROM stability_events
    WHERE organization_id = ${orgId}
    AND ST_Distance(
        ST_MakePoint(longitude, latitude)::geography,
        ST_MakePoint(${lon}, ${lat})::geography
    ) < ${radius}
`;
```

**Por Bounding Box:**
```typescript
const latMin = parseFloat(req.query.latMin as string);
const latMax = parseFloat(req.query.latMax as string);
const lonMin = parseFloat(req.query.lonMin as string);
const lonMax = parseFloat(req.query.lonMax as string);

const events = await prisma.stabilityEvent.findMany({
    where: {
        organizationId: orgId,
        latitude: { gte: latMin, lte: latMax },
        longitude: { gte: lonMin, lte: lonMax }
    }
});
```

---

## 🔧 Middleware de Filtros

### Middleware de Validación

**Ubicación:** `backend/src/middleware/validation.ts`

```typescript
import Joi from 'joi';

export function validateQuery(schema: Joi.Schema) {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(d => ({
                field: d.path.join('.'),
                message: d.message
            }));

            return res.status(400).json({
                success: false,
                errors
            });
        }

        req.query = value; // Usar valores validados
        next();
    };
}
```

---

### Schema de Validación - KPIs

```typescript
import Joi from 'joi';

export const kpiQuerySchema = Joi.object({
    from: Joi.date().iso().required()
        .messages({
            'date.base': 'from debe ser una fecha válida',
            'any.required': 'from es obligatorio'
        }),
    
    to: Joi.date().iso().min(Joi.ref('from')).required()
        .messages({
            'date.min': 'to debe ser posterior a from'
        }),
    
    vehicleIds: Joi.array().items(
        Joi.string().uuid()
    ).optional(),
    
    force: Joi.boolean().optional()
});
```

**Uso:**
```typescript
router.get('/kpis/summary',
    authenticate,
    attachOrg,
    validateQuery(kpiQuerySchema),  // ✅ Validación automática
    kpiController.getSummary
);
```

---

### Middleware de Filtros Comunes

```typescript
// middleware/filters.ts
export const parseDateFilters = (req: Request, res: Response, next: NextFunction) => {
    const from = req.query.from as string;
    const to = req.query.to as string;

    if (from && to) {
        (req as any).dateFilters = {
            from: new Date(from),
            to: new Date(to)
        };
    }

    next();
};

export const parseVehicleFilters = (req: Request, res: Response, next: NextFunction) => {
    // Lógica de parsing de vehicleIds
    // ...
    next();
};
```

**Uso:**
```typescript
router.get('/sessions',
    authenticate,
    attachOrg,
    parseDateFilters,
    parseVehicleFilters,
    sessionController.getSessions
);
```

---

## 📝 Ejemplos de Uso

### Ejemplo 1: KPIs con Filtros Múltiples

**Request:**
```http
GET /api/kpis/summary?from=2025-10-01&to=2025-10-08&vehicleIds[]=uuid1&vehicleIds[]=uuid2
```

**Handler:**
```typescript
router.get('/kpis/summary', authenticate, attachOrg, async (req, res) => {
    const orgId = req.orgId;
    const from = req.query.from as string;
    const to = req.query.to as string;
    const vehicleIdsRaw = req.query['vehicleIds[]'];

    // Parse vehicleIds
    const vehicleIds = Array.isArray(vehicleIdsRaw) 
        ? vehicleIdsRaw as string[]
        : undefined;

    // Construir filtros de sesiones
    const sessionFilters: any = {
        organizationId: orgId,
        startTime: {
            gte: new Date(from),
            lt: new Date(to)
        }
    };

    if (vehicleIds?.length > 0) {
        sessionFilters.vehicleId = { in: vehicleIds };
    }

    // Obtener sesiones
    const sessions = await prisma.session.findMany({
        where: sessionFilters,
        select: { id: true }
    });

    // Calcular KPIs
    const sessionIds = sessions.map(s => s.id);
    const kpis = await calcularKPIs(sessionIds);

    res.json({ success: true, data: kpis });
});
```

---

### Ejemplo 2: Eventos con Múltiples Filtros

**Request:**
```http
GET /api/stability-events?sessionId=uuid&severity=GRAVE&type=RIESGO_VUELCO
```

**Handler:**
```typescript
router.get('/stability-events', authenticate, attachOrg, async (req, res) => {
    const whereClause: any = {
        organizationId: req.orgId
    };

    // Filtro por sesión
    if (req.query.sessionId) {
        whereClause.sessionId = req.query.sessionId;
    }

    // Filtro por severidad
    if (req.query.severity) {
        whereClause.severity = req.query.severity;
    }

    // Filtro por tipo
    if (req.query.type) {
        whereClause.type = req.query.type;
    }

    // Filtro por fechas
    if (req.query.from && req.query.to) {
        whereClause.timestamp = {
            gte: new Date(req.query.from as string),
            lt: new Date(req.query.to as string)
        };
    }

    const events = await prisma.stabilityEvent.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: 100
    });

    res.json({
        success: true,
        data: events,
        count: events.length
    });
});
```

---

### Ejemplo 3: Sesiones con Paginación

**Request:**
```http
GET /api/sessions?page=2&limit=20&status=COMPLETED
```

**Handler:**
```typescript
router.get('/sessions', authenticate, attachOrg, async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const whereClause: any = {
        organizationId: req.orgId
    };

    if (req.query.status) {
        whereClause.status = req.query.status;
    }

    if (req.query.vehicleIds) {
        whereClause.vehicleId = { in: req.query.vehicleIds };
    }

    const [sessions, total] = await Promise.all([
        prisma.session.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { startTime: 'desc' }
        }),
        prisma.session.count({ where: whereClause })
    ]);

    res.json({
        success: true,
        data: sessions,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});
```

---

## 🔐 Seguridad de Filtros

### Validación de Permisos

```typescript
// Verificar que el usuario tiene acceso al recurso
const session = await prisma.session.findUnique({
    where: { id: sessionId }
});

if (!session || session.organizationId !== req.orgId) {
    return res.status(403).json({
        error: 'Acceso denegado'
    });
}
```

---

### Prevención de SQL Injection

```typescript
// ✅ Usar Prisma (protección automática)
const sessions = await prisma.session.findMany({
    where: { organizationId: orgId }
});

// ✅ Usar $queryRaw con parámetros
const result = await prisma.$queryRaw`
    SELECT * FROM sessions
    WHERE organization_id = ${orgId}
`;

// ❌ NUNCA concatenar strings
const result = await prisma.$queryRaw(
    `SELECT * FROM sessions WHERE organization_id = '${orgId}'`
);
```

---

## 📚 Referencias

- [Arquitectura Interna](./ARQUITECTURA-INTERNA.md)
- [Sistema de KPIs](./SISTEMA-KPIS.md)
- [Sistema de Eventos](./GENERACION-EVENTOS.md)

---

**Última actualización:** Octubre 2025  
**Versión:** DobackSoft StabilSafe V3

