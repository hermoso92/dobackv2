# 🚀 GUÍA DE SETUP - REDIS CACHÉ

**Fecha**: 3 de noviembre de 2025  
**Objetivo**: Implementar caché con Redis para reducir latencia en 60%  
**Tiempo Estimado**: 30 minutos

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Paso 1: Instalar Dependencias (5 min)

```bash
cd backend
npm install redis@^4.7.0 --save
```

### Paso 2: Iniciar Redis con Docker (5 min)

```bash
# Desde la raíz del proyecto
docker-compose -f docker-compose.redis.yml up -d

# Verificar que esté corriendo
docker ps | grep redis

# Ver logs
docker logs dobacksoft-redis

# Probar conexión
docker exec -it dobacksoft-redis redis-cli ping
# Respuesta esperada: PONG
```

**Redis Commander (UI opcional)**:
- URL: http://localhost:8081
- Permite ver claves en tiempo real

### Paso 3: Configurar Variables de Entorno (2 min)

```bash
# backend/.env
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=true
```

### Paso 4: Actualizar backend/src/routes/index.ts (3 min)

Agregar rutas de caché:

```typescript
// backend/src/routes/index.ts

import cacheRoutes from './cache';

// ... otras importaciones ...

// Agregar después de otras rutas
router.use('/cache', cacheRoutes);

export default router;
```

### Paso 5: Aplicar Caché a Endpoints Críticos (10 min)

#### Opción A: Middleware (Recomendado)

```typescript
// backend/src/routes/kpis.ts

import { cacheMiddleware } from '../middleware/cache';

// Aplicar caché a endpoint de resumen
router.get(
    '/summary',
    authenticate,
    cacheMiddleware({ ttl: 300, keyPrefix: 'kpis' }), // 5 minutos
    kpiController.getSummary
);
```

#### Opción B: Manual en Servicio

```typescript
// backend/src/services/DashboardService.ts

import { redisService } from './RedisService';

async getDashboardData(filters: any) {
    const cacheKey = `dashboard:${filters.organizationId}:${JSON.stringify(filters)}`;
    
    // 1. Intentar desde caché
    const cached = await redisService.get(cacheKey);
    if (cached) return cached;
    
    // 2. Calcular si no está en caché
    const data = await this.calculateDashboardData(filters);
    
    // 3. Guardar en caché (5 minutos)
    await redisService.set(cacheKey, data, { ttl: 300 });
    
    return data;
}
```

### Paso 6: Invalidar Caché en Modificaciones (5 min)

```typescript
// backend/src/routes/sessions.ts

import { invalidateCachePattern } from '../middleware/cache';

// Invalidar caché de KPIs al crear nueva sesión
router.post(
    '/sessions',
    authenticate,
    invalidateCachePattern('kpis:*'), // Limpiar caché de KPIs
    sessionsController.create
);
```

---

## 🧪 VERIFICACIÓN

### Test 1: Verificar Conexión

```bash
curl http://localhost:9998/api/cache/ping

# Respuesta esperada:
{
  "success": true,
  "connected": true,
  "message": "PONG"
}
```

### Test 2: Ver Estadísticas

```bash
curl http://localhost:9998/api/cache/health

# Respuesta esperada:
{
  "success": true,
  "redis": {
    "connected": true,
    "dbSize": 0,
    "usedMemory": "1.2M",
    "hitRate": "N/A"
  }
}
```

### Test 3: Verificar Caché en Dashboard

```bash
# Primera llamada (cache MISS)
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:9998/api/kpis/summary \
     -i | grep X-Cache
# Esperado: X-Cache: MISS

# Segunda llamada (cache HIT)
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:9998/api/kpis/summary \
     -i | grep X-Cache
# Esperado: X-Cache: HIT
```

### Test 4: Medir Mejora de Rendimiento

```bash
# Sin caché (primera llamada)
time curl -H "Authorization: Bearer TOKEN" \
          http://localhost:9998/api/kpis/summary

# Con caché (segunda llamada)
time curl -H "Authorization: Bearer TOKEN" \
          http://localhost:9998/api/kpis/summary

# Debería ser 60-80% más rápido
```

---

## 📊 ENDPOINTS DE CACHÉ DISPONIBLES

### Health Check
```
GET /api/cache/health
```

### Estadísticas Detalladas (requiere auth)
```
GET /api/cache/stats
```

### Limpiar Toda la Caché (solo ADMIN)
```
DELETE /api/cache/clear
```

### Limpiar por Patrón (solo ADMIN)
```
DELETE /api/cache/pattern/kpis:*
```

### Ping
```
GET /api/cache/ping
```

---

## 🎯 ENDPOINTS RECOMENDADOS PARA CACHEAR

### Alta Prioridad (Implementar YA)

| Endpoint | TTL | Razón |
|----------|-----|-------|
| `/api/kpis/summary` | 5 min | Dashboard principal, se pide constantemente |
| `/api/dashboard/stats` | 5 min | Estadísticas generales |
| `/api/vehicles` | 10 min | Lista de vehículos cambia poco |
| `/api/dashboard/vehicles` | 10 min | Vehículos con estado |

### Media Prioridad (Implementar después)

| Endpoint | TTL | Razón |
|----------|-----|-------|
| `/api/stability/sessions` | 30 min | Sesiones históricas |
| `/api/telemetry/sessions` | 30 min | Sesiones de telemetría |
| `/api/geofences` | 1 hora | Geocercas cambian raramente |
| `/api/parks` | 1 hora | Parques cambian raramente |

### Baja Prioridad (Opcional)

| Endpoint | TTL | Razón |
|----------|-----|-------|
| `/api/reports/list` | 15 min | Lista de reportes generados |
| `/api/events/summary` | 10 min | Resumen de eventos |

---

## ⚙️ CONFIGURACIÓN AVANZADA

### Ajustar TTL por Endpoint

```typescript
// TTL corto para datos en tiempo real
cacheMiddleware({ ttl: 60 }) // 1 minuto

// TTL largo para datos estáticos
cacheMiddleware({ ttl: 3600 }) // 1 hora
```

### Variar Caché por Headers

```typescript
cacheMiddleware({
    ttl: 300,
    varyBy: ['X-Organization-ID', 'X-User-Role']
})
```

### Deshabilitar Caché en Desarrollo

```env
# backend/.env.development
REDIS_ENABLED=false
```

---

## 🐛 TROUBLESHOOTING

### Problema: "Cannot connect to Redis"

```bash
# Verificar que Redis esté corriendo
docker ps | grep redis

# Si no está corriendo, iniciarlo
docker-compose -f docker-compose.redis.yml up -d

# Ver logs de error
docker logs dobacksoft-redis
```

### Problema: "Redis no disponible, saltando caché"

Esto es normal y esperado. El sistema funciona sin Redis, solo sin caché.

Para habilitar:
```env
REDIS_ENABLED=true
```

### Problema: Caché no se invalida

```bash
# Limpiar manualmente
curl -X DELETE \
     -H "Authorization: Bearer ADMIN_TOKEN" \
     http://localhost:9998/api/cache/clear
```

### Problema: Hit rate muy bajo (<30%)

Posibles causas:
1. TTL muy corto → Aumentar TTL
2. Queries con parámetros únicos → Normalizar queries
3. Caché se invalida demasiado → Revisar lógica de invalidación

---

## 📈 MONITOREO

### Logs de Caché

```bash
# Ver logs en tiempo real
tail -f backend/logs/app.log | grep Cache

# Buscar cache hits
grep "Cache HIT" backend/logs/app.log | wc -l

# Buscar cache misses
grep "Cache MISS" backend/logs/app.log | wc -l
```

### Redis Commander (UI)

Abrir http://localhost:8081 para ver:
- Claves en caché
- TTL de cada clave
- Memoria usada
- Hit rate

### Métricas en Código

```typescript
// Obtener estadísticas
const stats = await redisService.getStats();

console.log('Hit Rate:', stats.hitRate);
console.log('Memoria usada:', stats.usedMemory);
console.log('Claves en caché:', stats.dbSize);
```

---

## ✅ CHECKLIST FINAL

- [ ] Redis corriendo en Docker
- [ ] Dependencia `redis` instalada
- [ ] Variables de entorno configuradas
- [ ] `RedisService` importado en backend
- [ ] Middleware de caché aplicado a endpoints críticos
- [ ] Invalidación de caché en POST/PUT/DELETE
- [ ] Tests de verificación pasados
- [ ] Rendimiento mejorado >50%
- [ ] Logs monitoreados
- [ ] Documentación actualizada

---

## 🎯 MÉTRICAS DE ÉXITO

| Métrica | Antes | Meta | Medición |
|---------|-------|------|----------|
| Latencia `/api/kpis/summary` | 5000ms | <1000ms | `time curl ...` |
| Hit Rate | 0% | >80% | Redis Commander |
| Carga en BD | 100% | <40% | `pg_stat_statements` |
| Usuarios concurrentes | ~50 | 200+ | Load testing |

---

## 📚 RECURSOS

- **Redis Docs**: https://redis.io/docs/
- **Redis Node Client**: https://github.com/redis/node-redis
- **Redis Commander**: https://github.com/joeferner/redis-commander

---

**¡Caché implementado! 🚀**

Siguiente paso: Medir mejoras y optimizar TTLs

