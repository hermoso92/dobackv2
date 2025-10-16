# ✅ CORRECCIÓN: Timeout Aumentado

## 🚨 PROBLEMA DETECTADO

```
Error: timeout of 30000ms exceeded
```

**Causa**: El backend tarda **>30 segundos** en calcular KPIs porque procesa 241 sesiones y llama a `eventDetector.detectarEventosMasivo()` que tarda ~1-2 minutos.

---

## ✅ SOLUCIÓN APLICADA

### 1. **Frontend Timeout Aumentado**
**Archivo**: `frontend/src/config/constants.ts`

```typescript
export const API_CONFIG = {
    TIMEOUTS: {
        REQUEST: 180000,    // ✅ 3 minutos (era 30 segundos)
        AUTH: 10000,       // Sin cambios
        UPLOAD: 60000,     // Sin cambios
        LONG_POLLING: 90000 // Sin cambios
    }
};
```

### 2. **Backend Timeout Aumentado**
**Archivo**: `backend/src/config/env.ts`

```typescript
SERVER_TIMEOUT: z.string().transform(Number).default('180000'), // ✅ 3 minutos
```

---

## 📊 COMPARACIÓN

| Componente | Antes | Después |
|---|---|---|
| Frontend REQUEST | 30 segundos | 3 minutos |
| Backend SERVER | 30 segundos | 3 minutos |
| **Resultado** | ❌ Timeout al cargar KPIs | ✅ Debe funcionar |

---

## 🧪 VERIFICACIÓN PENDIENTE

1. Abrir navegador en `http://localhost:5174`
2. Login con `test@bomberosmadrid.es` / `admin123`
3. Ir a "Panel de Control" → "Estados y Tiempos"
4. Verificar que:
   - ✅ Los datos se cargan (sin timeout)
   - ✅ Se muestran los estados (Clave 0-5)
   - ✅ Se muestran eventos
   - ✅ Se muestra el índice de estabilidad

---

## ⚠️ NOTA IMPORTANTE

Este es un **fix temporal**. La solución **definitiva** debería incluir:

1. **Caché de eventos**: Guardar `eventDetector` results en BD
2. **Procesamiento background**: Calcular KPIs en background y servir desde caché
3. **Optimización de queries**: Reducir consultas a Prisma

---

## 🎯 ESTADO ACTUAL

- ✅ Backend TypeScript iniciado con `iniciar.ps1`
- ✅ Frontend iniciado con `iniciar.ps1`
- ✅ Timeout aumentado a 3 minutos
- ⏳ Esperando verificación del usuario

**Próximo paso**: Usuario verifica que el dashboard carga datos correctamente.

