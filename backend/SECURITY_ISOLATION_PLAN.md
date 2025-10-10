# Plan de Refuerzo Multi-Organización y Seguridad de Rutas

## Objetivo General
Garantizar que todo acceso a datos esté aislado por `organizationId` derivado del JWT y que las rutas sensibles respeten los roles ADMIN/MANAGER. Se eliminan fallbacks y accesos indirectos.

## Acciones Principales

### 1. Middlewares
- `requireOrganizationAccess`
  - Solo tomar `organizationId` desde `req.user.organizationId`.
  - Rechazar cualquier `organizationId` en params/body/query si difiere.
  - Permitir solo ADMIN global (futuro) para administrar sin restricción.
- `getOrganizationIdFromRequest`
  - Eliminar fallback `org-456`.
  - Lanzar error 401 si no hay JWT válido.
- `getUserIdFromRequest`
  - Mismo criterio: sin fallback.

### 2. Rutas y Controladores
- Revisión de endpoints con `organizationId` por query/body (`dashboard`, `telemetry`, `upload`, `reports`, etc.).
  - Sustituir lecturas por `req.user.organizationId`.
  - Remover validaciones redundantes basadas en query.
- `create-superadmin`
  - Limitar a ADMIN ya autenticado o eliminar ruta temporal.
- Aplicar `requireRole(['ADMIN'])` en endpoints de administración (`/api/reports`, `/api/gestor-eventos`, etc.).

### 3. Repositorios/Servicios
- Asegurar que cada consulta a Prisma filtra por `organizationId` del usuario.
- Refactorizar servicios que reciben `organizationId` como parámetro externo.
- Asegurar que seeds/tests usan IDs consistentes.

### 4. Tests
- Actualizar pruebas unitarias y E2E para generar tokens con `organizationId` real.
- Eliminar dependencias de `org-456` en fixtures.
- Añadir tests negativos: usuario de otra organización no accede.

### 5. Documentación
- Actualizar README/guías con nuevas reglas de autenticación.
- Explicar cómo generar tokens válidos en entornos de desarrollo.

### 6. Observabilidad
- Añadir logs estructurados cuando se bloquee acceso por organización.
- Opcional: emitir métricas para intentos fallidos.

## Entregables
1. Middlewares actualizados.
2. Controladores y servicios ajustados.
3. Ruta `/create-superadmin` protegida o retirada.
4. Suite de tests adaptada.
5. Documentación actualizada.
