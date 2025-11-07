# 🛡️ Sistema de Guardrails DobackSoft

## Misión

Proteger los invariantes críticos de DobackSoft/StabilSafe V2 mediante **fitness functions ejecutables** que detectan y previenen violaciones arquitectónicas, de seguridad, performance y dominio.

## Arquitectura del Sistema

```
scripts/guardrails/
├── fitness-functions/          # Tests ejecutables por categoría
│   ├── security.test.ts        # Seguridad & aislamiento
│   ├── architecture.test.ts    # Arquitectura & modularidad
│   ├── performance.test.ts     # Performance & tamaño
│   ├── domain.test.ts          # Flujo & reglas de negocio
│   └── organization.test.ts    # Estructura de carpetas
│
├── scanners/                   # Detectores repo-wide
│   ├── scan-console-logs.ts    # Detecta console.log
│   ├── scan-hardcoded-urls.ts  # Detecta URLs hardcodeadas
│   ├── scan-organization-id.ts # Verifica filtros organizationId
│   ├── scan-component-size.ts  # Verifica tamaño componentes
│   └── scan-all.ts             # Ejecuta todos los scanners
│
├── auto-fix/                   # Correcciones automáticas
│   ├── fix-console-logs.ts     # console.log → logger
│   ├── fix-hardcoded-urls.ts   # URLs → config/api.ts
│   ├── fix-imports.ts          # Optimiza tree-shaking
│   └── apply-fixes.ts          # Orquestador de fixes
│
├── ci/                         # Configuración CI/CD
│   ├── github-actions.yml      # Workflow GitHub Actions
│   └── pre-commit.ts           # Hook pre-commit
│
├── reports/                    # Reportes generados
│   └── .gitkeep
│
├── run-guardrails.ts           # Script principal
└── README.md                   # Este archivo
```

## Invariantes Críticos

### 🔒 Seguridad & Aislamiento
- ✅ `organizationId` obligatorio en todas las queries
- ✅ JWT en cookies httpOnly
- ✅ CSRF protection activo
- ✅ S3 presigned URLs con SSE-KMS

### 🏗️ Arquitectura & Modularidad
- ✅ Módulos fijos del menú (no extensibles)
- ✅ Backend puerto **9998** fijo
- ✅ Frontend puerto **5174** fijo
- ✅ API config centralizada (`config/api.ts`)
- ✅ Logger centralizado (no `console.log`)

### ⚡ Performance & Tamaño
- ✅ Componentes **<300 líneas**
- ✅ Bundle size **<300 KB**
- ✅ Tree-shaking optimizado

### 🔄 Flujo & Dominio
- ✅ Subida → Procesamiento → Visualización → Comparación → Exportación
- ✅ Roles: solo **ADMIN/MANAGER**
- ✅ Comparadores solo entre sesiones del mismo tipo
- ✅ PDF 1-clic desde módulos clave

### 📁 Organización
- ✅ Docs en `docs/` (no .md en raíz excepto README)
- ✅ Scripts en `scripts/`
- ✅ Temporales en `temp/`

## Uso

### Ejecutar todos los guardrails

```powershell
# Desde la raíz del proyecto
npm run guardrails

# O directamente
npx ts-node scripts/guardrails/run-guardrails.ts
```

### Ejecutar categoría específica

```powershell
# Solo seguridad
npm run guardrails:security

# Solo arquitectura
npm run guardrails:architecture

# Solo performance
npm run guardrails:performance
```

### Ejecutar scanner específico

```powershell
# Detectar console.log
npx ts-node scripts/guardrails/scanners/scan-console-logs.ts

# Detectar URLs hardcodeadas
npx ts-node scripts/guardrails/scanners/scan-hardcoded-urls.ts
```

### Auto-fix

```powershell
# Aplicar todos los fixes seguros
npm run guardrails:fix

# Fix específico
npx ts-node scripts/guardrails/auto-fix/fix-console-logs.ts
```

## Reportes

Los reportes se generan automáticamente en `scripts/guardrails/reports/`:

- `violations-{timestamp}.json` - Violaciones detectadas
- `fixes-{timestamp}.json` - Correcciones aplicadas
- `summary-{timestamp}.md` - Resumen ejecutivo

## Integración CI/CD

### GitHub Actions

El workflow se ejecuta automáticamente en:
- ✅ Push a `main` o `develop`
- ✅ Pull Requests
- ✅ Pre-commit (local)

Si detecta violaciones **críticas**, el build falla.

### Pre-commit Hook

```powershell
# Instalar hook
npm run guardrails:install-hook
```

El hook ejecuta guardrails antes de cada commit y bloquea si hay violaciones críticas.

## Plan de Implementación

### 📅 Días 1-30: Fundamentos
- ✅ Setup sistema de guardrails
- ✅ Scanners básicos (console.log, URLs, organizationId)
- ✅ CI/CD bloqueante
- 🔲 Corrección violaciones existentes (69 console.log backend + 45 frontend)

### 📅 Días 31-60: Expansión
- 🔲 Fitness functions avanzadas (performance, bundle size)
- 🔲 Auto-fix engine completo
- 🔲 Métricas de calidad continuas

### 📅 Días 61-90: Optimización
- 🔲 Dashboard de métricas de calidad
- 🔲 Reportes automáticos semanales
- 🔲 Integración con SonarQube/CodeClimate

## Niveles de Severidad

| Nivel | Descripción | Acción CI |
|-------|-------------|-----------|
| 🔴 **CRITICAL** | Violación grave (seguridad, aislamiento) | ❌ Bloquea build |
| 🟠 **HIGH** | Violación importante (arquitectura) | ⚠️ Warning + requiere aprobación |
| 🟡 **MEDIUM** | Violación menor (performance) | ⚠️ Warning |
| 🟢 **LOW** | Mejora sugerida (organización) | ℹ️ Info |

## Ejemplos de Violaciones

### ❌ CRITICAL: Sin filtro organizationId

```typescript
// ❌ VIOLACIÓN
const vehicles = await prisma.vehicle.findMany();

// ✅ CORRECTO
const vehicles = await prisma.vehicle.findMany({
  where: { organizationId: user.organizationId }
});
```

### ❌ HIGH: console.log en lugar de logger

```typescript
// ❌ VIOLACIÓN
console.log('Usuario creado:', user);

// ✅ CORRECTO
import { logger } from '@/utils/logger';
logger.info('Usuario creado', { userId: user.id });
```

### ❌ HIGH: URL hardcodeada

```typescript
// ❌ VIOLACIÓN
const response = await fetch('http://localhost:9998/api/vehicles');

// ✅ CORRECTO
import { API_CONFIG } from '@/config/api';
const response = await fetch(`${API_CONFIG.BASE_URL}/api/vehicles`);
```

### ❌ MEDIUM: Componente demasiado grande

```typescript
// ❌ VIOLACIÓN: Dashboard.tsx - 450 líneas

// ✅ CORRECTO: Dividir en componentes
// Dashboard.tsx (100 líneas)
//   ├── DashboardKPIs.tsx (80 líneas)
//   ├── DashboardAlerts.tsx (70 líneas)
//   └── DashboardCharts.tsx (90 líneas)
```

## Mantenimiento

### Actualizar reglas

Editar archivos en `fitness-functions/` según necesidad.

### Deshabilitar regla temporalmente

```typescript
// En el test específico
test.skip('nombre del test', () => { ... });
```

### Excluir archivo específico

Agregar a `.guardrailsignore`:

```
# Archivos temporales
scripts/temp/**
*.backup.ts

# Migraciones legacy
backend/migrations/legacy/**
```

## Soporte

Para dudas o mejoras, consultar:
- 📖 Documentación: `docs/CALIDAD/guardrails.md`
- 🐛 Issues: GitHub Issues con tag `guardrails`

---

**ESTAS REGLAS SON OBLIGATORIAS Y NO NEGOCIABLES**
**CUALQUIER VIOLACIÓN REQUIERE CORRECCIÓN INMEDIATA**

