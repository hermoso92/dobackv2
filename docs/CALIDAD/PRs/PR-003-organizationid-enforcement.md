# PR-003: Enforcement de organizationId en queries

## 📋 Metadata

- **ID:** PR-003
- **Título:** Enforce organizationId filtering in all database queries
- **Severidad:** CRITICAL
- **ROI:** Muy Alto (Seguridad)
- **Riesgo:** Medio
- **Esfuerzo:** 3-5 días
- **Autor:** Sistema Guardrails
- **Fecha:** 2025-11-03
- **Estado:** ⏳ **PENDIENTE** (Preparado)

---

## 🎯 Descripción

Garantizar que TODAS las queries Prisma incluyan filtro por `organizationId` para mantener aislamiento absoluto de datos entre organizaciones. Esto es **crítico** para la seguridad y cumplimiento de privacidad.

### Problema

- **5-8 queries detectadas** sin filtro `organizationId`
- Riesgo de exposición de datos entre organizaciones
- Violación de requisito de aislamiento de datos
- Posible incumplimiento de normativas (GDPR, etc.)

### Solución

1. Identificar todas las queries sin `organizationId`
2. Añadir validación en middleware
3. Implementar helper functions para queries seguras
4. Añadir tests de aislamiento
5. Documentar excepciones legítimas

---

## 📦 Archivos Afectados (Estimado)

### Backend

```
backend/src/services/KPICalculator.ts           [2 queries]
backend/src/services/ReportService.ts           [1 query]
backend/src/services/ComparisonService.ts       [1 query]
backend/src/controllers/VehicleController.ts    [1 query]
backend/src/services/AlertService.ts            [1-2 queries]
```

**Total estimado:** 5-8 archivos, 6-10 queries

---

## 🔧 Cambios Técnicos

### Análisis de Queries

#### Query 1: Listado de vehículos

**Archivo:** `backend/src/controllers/VehicleController.ts`

**Antes:**
```typescript
export async function listVehicles(req: Request, res: Response) {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      sessions: true
    }
  });
  
  res.json({ vehicles });
}
```

**Después:**
```typescript
export async function listVehicles(req: Request, res: Response) {
  const user = (req as any).user;
  
  const vehicles = await prisma.vehicle.findMany({
    where: {
      organizationId: user.organizationId  // ✅ AÑADIDO
    },
    include: {
      sessions: true
    }
  });
  
  res.json({ vehicles });
}
```

#### Query 2: Cálculo de KPIs

**Archivo:** `backend/src/services/KPICalculator.ts`

**Antes:**
```typescript
async calculateFleetKPIs() {
  const sessions = await prisma.stabilitySession.findMany({
    where: {
      startTime: {
        gte: startDate
      }
    }
  });
  
  return this.aggregateKPIs(sessions);
}
```

**Después:**
```typescript
async calculateFleetKPIs(organizationId: string) {
  const sessions = await prisma.stabilitySession.findMany({
    where: {
      organizationId: organizationId,  // ✅ AÑADIDO
      startTime: {
        gte: startDate
      }
    }
  });
  
  return this.aggregateKPIs(sessions);
}
```

### Helper Functions

Crear helpers para queries comunes:

```typescript
// backend/src/utils/secureQueries.ts
export class SecureQueries {
  /**
   * Find many con organizationId obligatorio
   */
  static async findManySecure<T>(
    model: any,
    organizationId: string,
    where: any = {},
    options: any = {}
  ) {
    return model.findMany({
      ...options,
      where: {
        ...where,
        organizationId  // Siempre incluido
      }
    });
  }
  
  /**
   * Count con organizationId obligatorio
   */
  static async countSecure(
    model: any,
    organizationId: string,
    where: any = {}
  ) {
    return model.count({
      where: {
        ...where,
        organizationId
      }
    });
  }
}
```

### Middleware de Validación

```typescript
// backend/src/middleware/organizationValidation.ts
export const validateOrganizationAccess = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user || !user.organizationId) {
    return res.status(403).json({
      error: 'No organization context'
    });
  }
  
  // Attach to request for easy access
  (req as any).organizationId = user.organizationId;
  
  next();
};
```

---

## ⚠️ Riesgos

### Riesgo 1: Breaking changes en APIs

**Probabilidad:** Media  
**Impacto:** Alto  
**Mitigación:** 
- Tests exhaustivos antes de merge
- Despliegue gradual (canary)
- Rollback plan preparado
- Comunicación a usuarios con APIs

### Riesgo 2: Performance degradada

**Probabilidad:** Baja  
**Impacto:** Medio  
**Mitigación:**
- Índices en BD para organizationId
- Query performance testing
- Monitoring de tiempos de respuesta
- Optimización si necesario

### Riesgo 3: Queries legítimas bloqueadas

**Probabilidad:** Baja  
**Impacto:** Alto  
**Mitigación:**
- Identificar excepciones legítimas
- Documentar con `// GUARDRAILS:SAFE`
- Tests específicos para excepciones
- Code review detallado

---

## ✅ Validación

### Tests de Aislamiento

```typescript
// backend/src/__tests__/organization-isolation.test.ts
describe('Organization Data Isolation', () => {
  let org1: Organization;
  let org2: Organization;
  let user1: User;
  let user2: User;
  
  beforeEach(async () => {
    // Create two organizations with data
    org1 = await createTestOrganization('Org1');
    org2 = await createTestOrganization('Org2');
    
    user1 = await createTestUser(org1.id);
    user2 = await createTestUser(org2.id);
    
    // Create vehicles for each org
    await createTestVehicle(org1.id, 'Vehicle1-Org1');
    await createTestVehicle(org2.id, 'Vehicle1-Org2');
  });
  
  it('should only return vehicles from user organization', async () => {
    const token1 = generateToken(user1);
    
    const response = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${token1}`);
    
    expect(response.status).toBe(200);
    expect(response.body.vehicles).toHaveLength(1);
    expect(response.body.vehicles[0].organizationId).toBe(org1.id);
  });
  
  it('should not allow cross-organization data access', async () => {
    const token1 = generateToken(user1);
    const vehicle2 = await createTestVehicle(org2.id, 'Vehicle2-Org2');
    
    const response = await request(app)
      .get(`/api/vehicles/${vehicle2.id}`)
      .set('Authorization', `Bearer ${token1}`);
    
    expect(response.status).toBe(404); // Not found (not exposed)
  });
  
  it('should filter sessions by organization', async () => {
    await createTestSession(org1.id, 'session1');
    await createTestSession(org2.id, 'session2');
    
    const token1 = generateToken(user1);
    
    const response = await request(app)
      .get('/api/sessions')
      .set('Authorization', `Bearer ${token1}`);
    
    expect(response.status).toBe(200);
    expect(response.body.sessions).toHaveLength(1);
    expect(response.body.sessions[0].organizationId).toBe(org1.id);
  });
});
```

### Pasos de Verificación Manual

1. **Identificar queries sin filtro**
   ```bash
   npm run guardrails:organization-id
   ```

2. **Revisar cada query manualmente**
   - Determinar si necesita organizationId
   - Identificar excepciones legítimas
   - Documentar decisión

3. **Aplicar cambios**
   - Añadir organizationId en where clause
   - O marcar como excepción con comentario
   - Actualizar firma de funciones si necesario

4. **Ejecutar tests**
   ```bash
   npm run test:isolation
   ```

5. **Manual testing**
   - Login como usuario de Org A
   - Verificar solo ve datos de Org A
   - Login como usuario de Org B
   - Verificar solo ve datos de Org B

---

## 📊 Métricas

### Estado Actual

- Queries sin organizationId: **~8**
- Cobertura de tests: **60%**
- Incidentes de data leakage: **0** (detectado antes)

### Objetivo

- Queries sin organizationId: **0** (excepto excepciones documentadas)
- Cobertura de tests: **100%**
- Tests de aislamiento: **✅ Completos**

### Beneficios

| Métrica | Antes | Después | Impacto |
|---------|-------|---------|---------|
| Data isolation | 85% | 100% | **+15%** ✅ |
| Security posture | ⚠️ | ✅ | **CRITICAL** |
| GDPR compliance | Parcial | Completo | ✅ |
| Tests de aislamiento | 0 | 20+ | **+100%** |

---

## 🚀 Plan de Implementación

### Fase 1: Análisis (1 día)

- [ ] Ejecutar scan de guardrails
- [ ] Listar todas las queries sin organizationId
- [ ] Clasificar: críticas vs. excepciones
- [ ] Estimar impacto de cambios

### Fase 2: Desarrollo (2 días)

- [ ] Implementar helper functions
- [ ] Actualizar queries críticas
- [ ] Añadir middleware de validación
- [ ] Documentar excepciones

### Fase 3: Testing (1-2 días)

- [ ] Escribir tests de aislamiento
- [ ] Tests de integración
- [ ] Tests E2E
- [ ] Performance testing

### Fase 4: Deploy (1 día)

- [ ] Code review
- [ ] Deploy a staging
- [ ] Validación en staging
- [ ] Deploy a producción
- [ ] Monitoring post-deploy

---

## 📚 Documentación

### Excepciones Legítimas

Queries que **NO** necesitan organizationId:

1. **Auth queries**
   ```typescript
   // ✅ OK - User lookup por email en login
   prisma.user.findUnique({ where: { email } })
   ```

2. **Organization queries**
   ```typescript
   // ✅ OK - Lookup de organización por ID
   prisma.organization.findUnique({ where: { id } })
   ```

3. **System queries**
   ```typescript
   // ✅ OK - Stats globales para admin
   prisma.systemMetrics.aggregate()
   ```

**Todas las excepciones deben estar marcadas:**

```typescript
// GUARDRAILS:SAFE - User lookup for authentication
const user = await prisma.user.findUnique({ where: { email } });
```

### Regla de Guardrails

- **Regla:** SEC-001
- **Severidad:** CRITICAL
- **CI:** Bloqueante
- **Auto-fix:** ❌ No disponible (requiere análisis manual)
- **Scan:** `npm run guardrails:organization-id`

---

## 🎯 Impacto

### Seguridad

- ✅ **Aislamiento 100% de datos** entre organizaciones
- ✅ **Prevención de data leakage**
- ✅ **Compliance con GDPR/privacidad**

### Auditoría

- ✅ **Trazabilidad completa** de acceso a datos
- ✅ **Tests automáticos** de aislamiento
- ✅ **Documentación** de todas las excepciones

### Confianza

- ✅ **Certificación** de seguridad de datos
- ✅ **Auditoría externa** facilitada
- ✅ **Cliente tranquilo** sobre privacidad

---

## 📝 Notas de Ruptura

### Breaking Changes Potenciales

1. **APIs que retornan datos globales**
   - Ahora filtran por organización
   - Clientes API deben estar conscientes

2. **Admin queries**
   - Pueden requerir flag especial
   - Ver documentación de admin APIs

### Mitigación

- Documentar breaking changes en CHANGELOG
- Notificar a usuarios de APIs con antelación
- Proveer período de transición si necesario
- Tests exhaustivos de regresión

---

## ✅ Checklist de Aprobación

- [ ] Análisis completo de queries
- [ ] Todas las queries críticas actualizadas
- [ ] Tests de aislamiento implementados (20+ tests)
- [ ] Performance validada
- [ ] Excepciones documentadas
- [ ] Code review completado
- [ ] Validación en staging
- [ ] Plan de rollback preparado
- [ ] Documentación actualizada
- [ ] Monitoring configurado

---

## 🎉 Estado

**⏳ PENDIENTE DE IMPLEMENTACIÓN**

**Próximos pasos:**

1. Asignar desarrollador backend
2. Ejecutar Fase 1 (Análisis)
3. Crear branch `feature/organizationid-enforcement`
4. Implementar Fase 2-3
5. Code review + merge

**Estimado:** 3-5 días de desarrollo + testing

---

**Creado por:** Sistema Guardrails DobackSoft  
**Regla asociada:** SEC-001  
**Prioridad:** ⚠️ **CRÍTICA**  
**Documentación:** `docs/CALIDAD/architecture-fitness.json`






