# 🏢 Configuración de Organización Única

## ✅ **CAMBIOS REALIZADOS**

### Problema Identificado
La aplicación solo trabaja con **una organización (Bomberos Madrid)**, pero en varios lugares del código se usaba `'default-org'` como fallback cuando el `user.organizationId` no estaba disponible. Esto causaba problemas cuando:
- El usuario no tenía `organizationId` asignado
- El `localStorage` tenía datos viejos
- Los componentes se montaban antes de que el usuario estuviera completamente cargado

### Solución Implementada

#### 1. Archivo de Configuración Centralizada
**Archivo creado:** `frontend/src/config/organization.ts`

```typescript
// ID de la organización principal: Bomberos Madrid
export const DEFAULT_ORGANIZATION_ID = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26';

/**
 * Obtiene el organizationId a usar en las peticiones
 * Prioriza el organizationId del usuario, si no está disponible usa el default
 */
export function getOrganizationId(userOrganizationId?: string | null): string {
    return userOrganizationId || DEFAULT_ORGANIZATION_ID;
}
```

**Ventajas:**
- ✅ Configuración centralizada (un solo lugar para cambiar)
- ✅ Siempre devuelve un `organizationId` válido
- ✅ Prioriza el del usuario, pero nunca falla
- ✅ Fácil de mantener y actualizar

#### 2. Componentes Actualizados

Se actualizaron los siguientes archivos para usar `getOrganizationId()`:

**frontend/src/components/kpi/NewExecutiveKPIDashboard.tsx**
- ✅ `DeviceMonitoringPanel`: `user?.organizationId || 'default-org'` → `getOrganizationId(user?.organizationId)`
- ✅ `BlackSpotsTab`: `user?.organizationId || 'default-org'` → `getOrganizationId(user?.organizationId)`
- ✅ `SpeedAnalysisTab`: `user?.organizationId || 'default-org'` → `getOrganizationId(user?.organizationId)`
- ✅ `OperationalKeysTab`: `user?.organizationId || 'default-org'` → `getOrganizationId(user?.organizationId)`

**frontend/src/components/sessions/SessionsAndRoutesView.tsx**
- ✅ Ranking de sesiones: `organizationId: 'default-org'` → `organizationId: getOrganizationId(user?.organizationId)`

---

## 📊 **CÓMO FUNCIONA AHORA**

### Flujo de Datos

```
┌─────────────────────────────────────────────┐
│  Usuario hace LOGIN                         │
│  Backend devuelve:                          │
│    - access_token                           │
│    - refresh_token                          │
│    - user {                                 │
│        organizationId: 'a5dfb0b4-c608...'   │
│      }                                      │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  AuthContext guarda en localStorage         │
│    auth_user: {                             │
│      id: '...',                             │
│      email: '...',                          │
│      organizationId: 'a5dfb0b4-c608...'     │
│    }                                        │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  Componentes usan:                          │
│    const { user } = useAuth();              │
│                                             │
│  Y pasan a props:                           │
│    organizationId={                         │
│      getOrganizationId(user?.organizationId)│
│    }                                        │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  getOrganizationId() decide:                │
│                                             │
│  1. Si user?.organizationId existe          │
│     → Usa el del usuario ✅                 │
│                                             │
│  2. Si user?.organizationId es null/undefined│
│     → Usa DEFAULT_ORGANIZATION_ID ✅        │
│       ('a5dfb0b4-c608-4a9e-b47b...')        │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  Peticiones al backend SIEMPRE tienen       │
│  un organizationId válido:                  │
│    /api/hotspots/critical-points?           │
│      organizationId=a5dfb0b4-c608...        │
│                                             │
│  Backend devuelve datos correctos ✅        │
└─────────────────────────────────────────────┘
```

---

## 🔧 **CONFIGURACIÓN PARA OTRA ORGANIZACIÓN**

Si en el futuro necesitas cambiar a otra organización, solo hay que modificar **UN archivo**:

### Opción 1: Cambiar la organización por defecto
**Archivo:** `frontend/src/config/organization.ts`

```typescript
// Cambiar este ID por el de la nueva organización
export const DEFAULT_ORGANIZATION_ID = 'nuevo-id-de-organizacion';
```

### Opción 2: Multi-organización (futuro)
Si en el futuro quieres soportar múltiples organizaciones:

1. **Backend**: El usuario ya tiene `organizationId` asignado ✅
2. **Frontend**: Los componentes ya usan `user.organizationId` primero ✅
3. **Solo necesitas**: Añadir un selector de organización en la UI (si es ADMIN global)

---

## 🎯 **VERIFICACIÓN**

### Cómo verificar que funciona correctamente:

#### 1. Abrir DevTools (F12) → Console
```javascript
// Ver el usuario actual en localStorage
JSON.parse(localStorage.getItem('auth_user'))

// Debería mostrar:
{
  id: "7a1a31a2-8d10-4470-8fd1-495e50f52a33",
  email: "antoniohermoso92@gmail.com",
  organizationId: "a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26",
  ...
}
```

#### 2. Verificar peticiones en Network Tab
- Abrir DevTools → Network
- Navegar a "Puntos Negros" o cualquier pestaña
- Buscar petición a `/api/hotspots/critical-points`
- Ver Query String Parameters:
  ```
  organizationId: a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26 ✅
  ```

#### 3. Verificar datos en componentes
Deberías ver:
- **50 clusters** en Puntos Negros
- **468 eventos** de estabilidad
- Datos de velocidad y claves operacionales

---

## 📝 **RESUMEN**

### Antes:
- ❌ Múltiples lugares con `'default-org'` hardcodeado
- ❌ Si `user.organizationId` era `null` → backend devolvía 0 datos
- ❌ Difícil de mantener (había que cambiar en muchos lugares)

### Ahora:
- ✅ Configuración centralizada en `config/organization.ts`
- ✅ Función `getOrganizationId()` garantiza ID válido siempre
- ✅ Usa el ID del usuario cuando está disponible
- ✅ Fallback inteligente al ID de Bomberos Madrid
- ✅ Fácil de mantener (un solo lugar para cambiar)

---

**Estado:** 🟢 100% Funcional
**Beneficio:** Sistema robusto que siempre tiene organizationId válido
**Futuro:** Compatible con multi-organización sin cambios mayores

