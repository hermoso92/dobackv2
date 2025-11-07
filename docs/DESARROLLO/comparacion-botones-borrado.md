# 🗑️ Comparación de Botones de Borrado en Upload

## 📋 **RESUMEN**

Existen **2 botones** para eliminar datos en la página `/upload`:

---

## 1️⃣ **"Borrar Todos los Datos"** (Botón Principal - Header)

### 📍 **Ubicación**
- **Posición**: Top-right del componente `FileUploadManager`
- **Visibilidad**: Siempre visible en ambas pestañas

### 🔐 **Permisos**
- **Roles permitidos**: ✅ ADMIN y MANAGER
- **Endpoint**: `POST /api/admin/delete-all-data`

### ⚙️ **Comportamiento**
- **Scope**: Solo la organización del usuario autenticado
- **Confirmación**: ✅ Modal con advertencia detallada
- **Requiere confirmación explícita**: `confirmacion: "ELIMINAR_TODO"`
- **Seguridad**: ✅ Usa transacción Prisma (`$transaction`)
- **Invalidación de caché**: ✅ Automática

### 🗂️ **Datos Eliminados** (8 tablas)
1. ✅ `operational_state_segments` (segmentos operacionales)
2. ✅ `operationalKey` (tabla vieja, por compatibilidad)
3. ✅ `stability_events` (eventos de estabilidad)
4. ✅ `gpsMeasurement` (mediciones GPS)
5. ✅ `canMeasurement` (mediciones CAN)
6. ✅ `rotativoMeasurement` (mediciones Rotativo)
7. ✅ `stabilityMeasurement` (mediciones Estabilidad)
8. ✅ `session` (sesiones - tabla padre)

### 🎨 **Visual**
- **Color**: Rojo (`error`)
- **Variant**: `outlined`
- **Ícono**: `DeleteIcon`
- **Modal**: Rojo con ícono de advertencia

---

## 2️⃣ **"Limpiar Base de Datos"** (Botón Secundario - Procesamiento)

### 📍 **Ubicación**
- **Posición**: Dentro de la pestaña "Procesamiento Automático"
- **Sección**: "Controles de Procesamiento"

### 🔐 **Permisos**
- **Roles permitidos**: ✅ ADMIN y MANAGER
- **Endpoint**: `POST /api/clean-all-sessions`

### ⚙️ **Comportamiento**
- **Scope**: Solo la organización del usuario autenticado
- **Confirmación**: ✅ Modal con advertencia (añadido ahora)
- **Seguridad**: ✅ Usa transacción Prisma (`$transaction`)
- **Invalidación de caché**: ✅ Automática

### 🗂️ **Datos Eliminados** (9 tablas)
1. ✅ `operational_state_segments` (segmentos operacionales)
2. ✅ `operationalKey` (tabla vieja)
3. ✅ `stability_events` (eventos de estabilidad)
4. ✅ `gpsMeasurement` (mediciones GPS)
5. ✅ `canMeasurement` (mediciones CAN)
6. ✅ `rotativoMeasurement` (mediciones Rotativo)
7. ✅ `stabilityMeasurement` (mediciones Estabilidad)
8. ✅ `dataQualityMetrics` (métricas de calidad)
9. ✅ `session` (sesiones - tabla padre)

### 🎨 **Visual**
- **Color**: Naranja (`warning`)
- **Variant**: `outlined`
- **Ícono**: `DeleteIcon`
- **Modal**: Naranja con mensaje informativo

---

## 🆚 **DIFERENCIAS CLAVE**

| Característica | Botón 1: "Borrar Todos los Datos" | Botón 2: "Limpiar Base de Datos" |
|----------------|-----------------------------------|----------------------------------|
| **Ubicación** | Header (siempre visible) | Pestaña "Procesamiento Automático" |
| **Color** | ❌ Rojo (error) | ⚠️ Naranja (warning) |
| **Propósito** | Eliminación total permanente | Limpieza para re-procesamiento |
| **Tablas eliminadas** | 8 tablas | 9 tablas (incluye `dataQualityMetrics`) |
| **Confirmación** | ✅ Modal rojo + string "ELIMINAR_TODO" | ✅ Modal naranja |
| **Uso recomendado** | Resetear toda la organización | Limpiar antes de re-subir archivos |

---

## 🔧 **CORRECCIONES IMPLEMENTADAS**

### ✅ **Backend**

#### 1. `backend/src/routes/admin.ts`
- ✅ Permitir rol **MANAGER** además de ADMIN
- ✅ Mensaje de error actualizado

#### 2. `backend/src/routes/index.ts` (endpoint `/api/clean-all-sessions`)
- ✅ **CRÍTICO**: Filtrar por `organizationId` (antes borraba TODAS las organizaciones!)
- ✅ Añadido verificación de rol (ADMIN o MANAGER)
- ✅ Usar transacción Prisma para seguridad
- ✅ Invalidar caché de KPIs
- ✅ Eliminar también `dataQualityMetrics`

### ✅ **Frontend**

#### `frontend/src/components/FileUploadManager.tsx`
- ✅ Añadido modal de confirmación para "Limpiar Base de Datos"
- ✅ Estados de carga (`isCleaningDB`)
- ✅ Mensaje de éxito/error con `alert()`
- ✅ Limpiar estados locales tras limpieza exitosa

---

## 🚨 **IMPORTANTE**

### ⚠️ **Antes de la corrección** (PELIGRO)
El botón "Limpiar Base de Datos" **eliminaba datos de TODAS las organizaciones** sin confirmación.

### ✅ **Después de la corrección** (SEGURO)
Ambos botones ahora:
1. ✅ Solo afectan a la organización del usuario autenticado
2. ✅ Requieren confirmación con modal
3. ✅ Requieren rol ADMIN o MANAGER
4. ✅ Usan transacciones para seguridad
5. ✅ Invalidan caché automáticamente

---

## 📖 **RECOMENDACIONES DE USO**

### 🔴 **Usar "Borrar Todos los Datos"** cuando:
- Quieres resetear completamente la organización
- Vas a cambiar de conjunto de datos
- Necesitas empezar desde cero

### 🟠 **Usar "Limpiar Base de Datos"** cuando:
- Vas a re-procesar los mismos archivos con nueva configuración
- Quieres probar diferentes umbrales de detección
- Necesitas regenerar eventos con parámetros diferentes

---

## 📅 **Historial de Cambios**

| Fecha | Cambio | Archivos |
|-------|--------|----------|
| 2025-11-05 | ✅ Permitir MANAGER en ambos botones | `admin.ts`, `index.ts` |
| 2025-11-05 | ✅ Filtrar por organizationId en `/clean-all-sessions` | `index.ts` |
| 2025-11-05 | ✅ Añadir modal de confirmación a "Limpiar BD" | `FileUploadManager.tsx` |
| 2025-11-05 | ✅ Usar transacciones en ambos endpoints | `admin.ts`, `index.ts` |

---

**Documentación actualizada: 05/11/2025**

