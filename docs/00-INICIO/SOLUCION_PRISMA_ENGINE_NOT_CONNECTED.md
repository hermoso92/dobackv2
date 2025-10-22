# 🔧 Solución Definitiva: "Engine is not yet connected"

## 📋 Problema

Error recurrente en Prisma:
```
Invalid `prisma.user.findUnique()` invocation
Engine is not yet connected.
Response from the Engine was empty.
```

Este error aparece al iniciar el backend y al hacer las primeras peticiones HTTP, causando que:
- Login falle con 500
- Middleware de autenticación falle
- Cualquier operación de base de datos falle

## 🔍 Causa Raíz

Prisma utiliza **lazy loading** para el engine de base de datos:
1. Cuando se importa `prisma`, **NO** se conecta automáticamente
2. La primera llamada a Prisma intenta iniciar el engine
3. Si las rutas se cargan **ANTES** de que el engine esté listo, fallan todas las operaciones

**Flujo problemático:**
```
1. backend/src/app.ts se carga
2. import routes from './routes'; → Carga TODAS las rutas
3. Las rutas importan prisma pero NO conectan
4. server.ts ejecuta prisma.$connect() → DEMASIADO TARDE
5. Primera petición HTTP → Engine no conectado → ERROR
```

## ✅ Solución Implementada (Multi-Capa)

### 1. **Inicialización en `lib/prisma.ts` (SIN conexión automática)**

```typescript
// backend/src/lib/prisma.ts

// ✅ Solo crear instancia, NO conectar automáticamente
const _prismaClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    errorFormat: 'pretty',
});

logger.info('Prisma Client inicializado (esperando conexión desde server.ts)');
```

**Ventaja**: Evita múltiples intentos de conexión simultáneos que causan race conditions.

### 2. **Conexión Síncrona en `server.ts` ANTES de aceptar peticiones**

```typescript
// backend/src/server.ts

async function startServer() {
    try {
        logger.info('🔌 Conectando Prisma Client...');
        
        // ✅ CRÍTICO: Esperar a que Prisma se conecte ANTES de aceptar peticiones
        await prisma.$connect();
        
        logger.info('✅ Prisma Client conectado y listo para recibir peticiones');

        // SOLO AHORA iniciar servidor HTTP
        server.listen(PORT, () => {
            logger.info(`🚀 Servidor iniciado en 0.0.0.0:${PORT}`);
        });
    } catch (error: any) {
        logger.error('❌ Error crítico iniciando servidor:', error);
        process.exit(1);
    }
}

startServer();
```

**Ventaja**: **Garantiza** que Prisma esté conectado antes de que lleguen peticiones HTTP.

### 3. **Wrapper `withPrismaReconnect` para Reconexiones Automáticas**

```typescript
// backend/src/lib/prisma.ts

export async function withPrismaReconnect<T>(
    operation: () => Promise<T>,
    retries: number = 3
): Promise<T> {
    // ✅ CRÍTICO: Forzar conexión ANTES del primer intento
    try {
        await _prismaClient.$connect();
    } catch (preConnectError) {
        logger.warn('Preconexión falló, continuando con intentos normales');
    }

    // Intentar la operación con reintentos automáticos
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            const isConnectionError = error.message && (
                error.message.includes('not yet connected') ||
                error.message.includes('Engine is not yet connected')
            );

            if (isConnectionError && attempt < retries) {
                logger.warn(`Prisma desconectado, reconectando (${attempt + 1}/${retries})...`);
                await _prismaClient.$disconnect().catch(() => {});
                await _prismaClient.$connect();
                continue;
            }
            break;
        }
    }
    throw lastError;
}
```

**Ventaja**: Maneja desconexiones inesperadas durante el runtime.

### 4. **Uso de `withPrismaReconnect` en Middleware Críticos**

#### `backend/src/middleware/auth.ts`

```typescript
import { prisma, withPrismaReconnect } from '../lib/prisma';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const decoded = verifyToken(token) as TokenPayload;

        // ✅ WRAPPED con withPrismaReconnect
        const user = await withPrismaReconnect(() => prisma.user.findUnique({
            where: { id: decoded.id },
            include: { organization: true }
        }));

        if (!user) {
            return res.status(401).json({ error: 'Usuario no válido' });
        }

        // ...
    } catch (error) {
        // ...
    }
};
```

**Ventaja**: Maneja reconexiones automáticas en operaciones críticas.

### 5. **Eliminación de Imports Dinámicos**

**ANTES (❌ INCORRECTO):**
```typescript
// backend/src/routes/processing-reports.ts
const { prisma } = await import('../lib/prisma'); // ❌ CAUSA PROBLEMAS
```

**DESPUÉS (✅ CORRECTO):**
```typescript
// backend/src/routes/processing-reports.ts
import { prisma } from '../lib/prisma'; // ✅ Import estático
```

**Razón**: Los imports dinámicos crean nuevas instancias de Prisma que no están conectadas.

## 📊 Verificación

### Logs Correctos (✅):
```
info: [PrismaClient] Prisma Client inicializado (esperando conexión desde server.ts)
info: 🔌 Conectando Prisma Client...
info: ✅ Prisma Client conectado y listo para recibir peticiones
info: 🚀 Servidor iniciado en 0.0.0.0:9998
info: Usuario autenticado correctamente
```

### Logs de Error (❌):
```
prisma:error Invalid `prisma.user.findUnique()` invocation
Engine is not yet connected.
```

## 🔧 Checklist de Implementación

Para **cualquier nueva ruta o servicio** que use Prisma:

- [ ] ✅ Import **estático** de prisma: `import { prisma } from '../lib/prisma';`
- [ ] ✅ **NUNCA** usar `await import()` dinámico para Prisma
- [ ] ✅ Envolver operaciones críticas con `withPrismaReconnect(() => prisma.xxx)`
- [ ] ✅ No crear nuevas instancias de `PrismaClient` (usar singleton)
- [ ] ✅ No llamar a `prisma.$connect()` manualmente (ya se hace automáticamente)

## 🚀 Archivos Modificados

### Core Prisma:
- ✅ `backend/src/lib/prisma.ts` → Solo inicialización, NO conexión automática
- ✅ `backend/src/server.ts` → **Conexión síncrona ANTES de aceptar peticiones**
- ✅ `backend/src/middleware/auth.ts` → Uso de `withPrismaReconnect`

### Rutas Corregidas:
- ✅ `backend/src/routes/processing-reports.ts` → Eliminado import dinámico
- ✅ `backend/src/routes/index.ts` → Añadida ruta `/processing-reports`
- ✅ `backend/src/routes/upload.ts` → Necesita wrapping con `withPrismaReconnect`

## 📝 Notas Importantes

1. **No reiniciar Prisma manualmente**: El singleton maneja la conexión automáticamente
2. **Usar `withPrismaReconnect` en operaciones críticas**: Login, auth, operaciones sensibles
3. **Evitar imports dinámicos**: Siempre usar imports estáticos de Prisma
4. **Monitorear logs**: Verificar que `✅ Prisma Client conectado automáticamente` aparezca

## 🎯 Estado Actual

✅ **`lib/prisma.ts` → Solo crea instancia, NO conecta**
✅ **`server.ts` → Conexión síncrona ANTES de `server.listen()`**
✅ **`withPrismaReconnect` → Implementado en auth middleware**
✅ **Imports dinámicos eliminados de `processing-reports.ts`**
⚠️ **`upload.ts` → Necesita wrapping con `withPrismaReconnect`**

## 🔧 Próximos Pasos

1. **Envolver `prisma` en `upload.ts`** con `withPrismaReconnect`
2. **Verificar logs** → Debe aparecer `✅ Prisma Client conectado y listo`
3. **Monitorear peticiones** → NO debería aparecer `Engine is not yet connected`

---

**Fecha**: 20 de octubre de 2025 - 12:45
**Estado**: ✅ Solución multi-capa implementada (conexión síncrona en `server.ts`)
**Causa raíz**: Prisma se conectaba en background, pero el servidor aceptaba peticiones antes de que el engine estuviera listo
**Solución definitiva**: `await prisma.$connect()` en `server.ts` ANTES de `server.listen()`

