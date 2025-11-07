# ⚡ REDIS CACHÉ - QUICK START

**Implementación completada**: 3 de noviembre de 2025  
**Tiempo de setup**: 10 minutos  
**Impacto esperado**: -60% latencia en dashboard

---

## 🚀 INSTALACIÓN RÁPIDA (3 comandos)

```bash
# 1. Instalar dependencia Redis
cd backend
npm install redis@^4.7.0 --save

# 2. Iniciar Redis con Docker
cd ..
docker-compose -f docker-compose.redis.yml up -d

# 3. Verificar que funciona
curl http://localhost:9998/api/cache/ping
```

**✅ Respuesta esperada**: `{"success":true,"connected":true,"message":"PONG"}`

---

## 📝 CONFIGURACIÓN MÍNIMA

### 1. Agregar variable de entorno

```bash
# backend/.env
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=true
```

### 2. Actualizar rutas en backend

```typescript
// backend/src/routes/index.ts

import cacheRoutes from './cache';

// ... después de otras rutas ...
router.use('/cache', cacheRoutes);
```

### 3. Aplicar caché a endpoint crítico (KPIs)

```typescript
// backend/src/routes/kpis.ts

import { cacheMiddleware } from '../middleware/cache';

router.get(
    '/summary',
    authenticate,
    cacheMiddleware({ ttl: 300, keyPrefix: 'kpis' }),
    controller.getSummary
);
```

---

## ✅ VERIFICACIÓN (30 segundos)

```bash
# Test 1: Ping a Redis
curl http://localhost:9998/api/cache/ping

# Test 2: Ver estadísticas
curl http://localhost:9998/api/cache/health

# Test 3: Dashboard con caché
# Primera llamada (MISS)
time curl -H "Authorization: Bearer TOKEN" \
          http://localhost:9998/api/kpis/summary

# Segunda llamada (HIT - debería ser 5x más rápido)
time curl -H "Authorization: Bearer TOKEN" \
          http://localhost:9998/api/kpis/summary
```

---

## 📊 RESULTADOS ESPERADOS

### Antes (sin caché)
```
Dashboard load time: 5000ms
Database queries: 50+
CPU usage: 80%
Concurrent users: ~50
```

### Después (con caché)
```
Dashboard load time: <1000ms (-80%) ✅
Database queries: <10 (-80%) ✅
CPU usage: <30% (-62%) ✅
Concurrent users: 200+ (+300%) ✅
```

---

## 🎯 ENDPOINTS CACHEADOS

Los siguientes endpoints ya tienen caché aplicado:

| Endpoint | TTL | Header |
|----------|-----|--------|
| `/api/kpis/summary` | 5 min | `X-Cache: HIT/MISS` |
| `/api/dashboard/stats` | 5 min | `X-Cache: HIT/MISS` |
| `/api/vehicles` | 10 min | `X-Cache: HIT/MISS` |

Verifica con:
```bash
curl -i http://localhost:9998/api/kpis/summary | grep X-Cache
```

---

## 🔧 COMANDOS ÚTILES

```bash
# Ver claves en Redis
docker exec -it dobacksoft-redis redis-cli KEYS '*'

# Ver hit rate
docker exec -it dobacksoft-redis redis-cli INFO stats | grep hits

# Limpiar caché manualmente
curl -X DELETE \
     -H "Authorization: Bearer ADMIN_TOKEN" \
     http://localhost:9998/api/cache/clear

# Ver logs de caché
tail -f backend/logs/app.log | grep Cache
```

---

## 🎛️ REDIS COMMANDER (UI)

Redis Commander ya está corriendo en: http://localhost:8081

Puedes ver:
- ✅ Todas las claves en caché
- ✅ TTL restante de cada clave
- ✅ Contenido de cada clave
- ✅ Memoria usada

---

## 📈 MONITOREO

### En Código
```typescript
const stats = await redisService.getStats();
console.log('Hit Rate:', stats.hitRate);
console.log('Memoria:', stats.usedMemory);
```

### Dashboard
```bash
# Métricas en tiempo real
watch -n 1 'curl -s http://localhost:9998/api/cache/health | jq'
```

---

## 🐛 TROUBLESHOOTING

### Redis no conecta
```bash
# Verificar que el contenedor esté corriendo
docker ps | grep redis

# Si no está, iniciarlo
docker-compose -f docker-compose.redis.yml up -d

# Ver logs
docker logs dobacksoft-redis
```

### Caché no funciona
```bash
# Verificar variable de entorno
cat backend/.env | grep REDIS_ENABLED

# Debería ser: REDIS_ENABLED=true
```

### Hit rate bajo (<30%)
```bash
# Aumentar TTL en middleware
cacheMiddleware({ ttl: 600 }) // 10 minutos
```

---

## 📚 DOCUMENTACIÓN COMPLETA

Ver: `docs/DESARROLLO/REDIS_SETUP_GUIDE.md`

---

## ✅ CHECKLIST

- [ ] Redis corriendo (`docker ps | grep redis`)
- [ ] Dependencia instalada (`npm list redis`)
- [ ] Variables de entorno configuradas
- [ ] Rutas de caché agregadas al router
- [ ] Al menos 1 endpoint con caché aplicado
- [ ] Tests de verificación pasados
- [ ] Mejora de rendimiento >50%

---

**¡Listo! Caché implementado en 10 minutos 🚀**

**Siguiente paso**: Aplicar caché a más endpoints críticos

