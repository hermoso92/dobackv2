# 🛡️ GUARDRAILS CHEATSHEET

**Referencia rápida de comandos y patrones**

---

## 🚀 COMANDOS ESENCIALES

### Scan & Fix

```bash
# Scan completo
npm run guardrails

# Solo scan
npm run guardrails:scan

# Preview fixes (sin aplicar)
npm run guardrails:fix --dry-run

# Aplicar fixes
npm run guardrails:fix

# Ciclo completo: scan → fix → re-scan
npm run guardrails:scan-and-fix
```

### Scanners individuales

```bash
npm run guardrails:console-logs      # console.log violations
npm run guardrails:hardcoded-urls    # Hardcoded URLs
npm run guardrails:organization-id   # Missing organizationId
npm run guardrails:component-size    # Oversized components
```

### Setup & Testing

```bash
npm run guardrails:install-hook      # Instalar pre-commit hook
npm run guardrails:test              # Ejecutar fitness tests
```

---

## ✅ PATRONES CORRECTOS

### Logging

```typescript
// ❌ MAL
console.log('Usuario creado:', user);
console.error('Error:', error);

// ✅ BIEN
import { logger } from '@/utils/logger';
logger.info('Usuario creado', { userId: user.id });
logger.error('Error al crear usuario', { error: error.message });
```

### API Configuration

```typescript
// ❌ MAL
const url = 'http://localhost:9998/api/vehicles';
fetch(url);

// ✅ BIEN
import { API_CONFIG } from '@/config/api';
const url = `${API_CONFIG.BASE_URL}/api/vehicles`;
fetch(url);
```

### OrganizationId Filtering

```typescript
// ❌ MAL
const vehicles = await prisma.vehicle.findMany();

// ✅ BIEN
const vehicles = await prisma.vehicle.findMany({
  where: { organizationId: user.organizationId }
});
```

### Component Size

```typescript
// ❌ MAL: Componente de 450 líneas

// ✅ BIEN: Dividir en sub-componentes
// Dashboard.tsx (100 líneas)
//   ├── DashboardKPIs.tsx (80 líneas)
//   ├── DashboardAlerts.tsx (70 líneas)
//   └── DashboardCharts.tsx (90 líneas)
```

---

## 🚫 EXCEPCIONES

### Permitir violación específica

```typescript
// Agregar al final de la línea
console.log('Esto es necesario'); // GUARDRAILS:SAFE
```

### Excluir archivo completo

Agregar a `.guardrailsignore`:

```
# Mi script específico
backend/src/scripts/mi-script.ts
```

### Bypass pre-commit (emergencias)

```bash
git commit --no-verify
```

---

## 📊 NIVELES DE SEVERIDAD

| Nivel | Icon | Descripción | Acción CI |
|-------|------|-------------|-----------|
| **CRITICAL** | 🔴 | Violación grave (seguridad) | ❌ Bloquea build |
| **HIGH** | 🟠 | Violación importante (arquitectura) | ⚠️ Warning + requiere aprobación |
| **MEDIUM** | 🟡 | Violación menor (performance) | ⚠️ Warning |
| **LOW** | 🟢 | Mejora sugerida | ℹ️ Info |

---

## 🔒 INVARIANTES CRÍTICOS

### Seguridad
- ✅ `organizationId` en todas las queries
- ✅ JWT en cookies httpOnly
- ✅ No hardcoded secrets

### Arquitectura
- ✅ No `console.log` → usar `logger`
- ✅ No URLs hardcodeadas → usar `config/api.ts`
- ✅ Puertos: 9998 (backend), 5174 (frontend)

### Performance
- ✅ Componentes <300 líneas
- ✅ Bundle size <300 KB

### Dominio
- ✅ Roles: solo ADMIN/MANAGER
- ✅ Fechas >= 2025-09-01
- ✅ GPS: España (36-44°N, -10 a 5°E)
- ✅ Velocidad <= 200 km/h

---

## 📁 ESTRUCTURA

```
scripts/guardrails/
├── run-guardrails.ts           # Script principal
├── fitness-functions/          # Tests
├── scanners/                   # Detectores
├── auto-fix/                   # Correctores
├── ci/                         # Hooks & CI
└── reports/                    # Reportes
```

---

## 🔄 WORKFLOW

### Primera vez
```bash
npm run guardrails:scan         # 1. Scan
npm run guardrails:fix --dry-run # 2. Preview
npm run guardrails:fix           # 3. Apply
npm run guardrails:install-hook  # 4. Install hook
git commit -m "fix: guardrails"  # 5. Commit
```

### Diario
```bash
git commit  # Hook automático
# Si falla → npm run guardrails:fix → retry
```

---

## 📊 REPORTES

Ubicación: `scripts/guardrails/reports/`

```
summary.json                      # Resumen general
console-logs-violations.json      # Console.log
hardcoded-urls-violations.json    # URLs
organizationid-violations.json    # OrganizationId
component-size-violations.json    # Component size
*-fixes.json                      # Fixes aplicados
```

---

## 🆘 TROUBLESHOOTING

### Dependencias faltantes
```bash
npm install glob ts-node typescript
```

### Hook no funciona
```bash
npm run guardrails:install-hook
chmod +x .git/hooks/pre-commit  # Linux/Mac
```

### Falsos positivos
```typescript
// Opción 1: Inline
console.log('...'); // GUARDRAILS:SAFE

// Opción 2: Archivo completo en .guardrailsignore
```

---

## 🎯 QUICK LINKS

- 📖 [README completo](./README.md)
- 🚀 [Quick Start](./QUICK-START.md)
- 📑 [INDEX](./INDEX.md)
- 📊 [Resumen Ejecutivo](../../docs/CALIDAD/GUARDRAILS-RESUMEN-EJECUTIVO.md)
- 📅 [Plan 30/60/90](../../docs/CALIDAD/PLAN-GUARDRAILS-30-60-90.md)

---

## 💡 TIPS

### Para desarrolladores
1. Ejecuta `npm run guardrails:scan` antes de crear PR
2. Usa `--dry-run` para preview antes de aplicar
3. Instala el pre-commit hook (te ahorra tiempo)

### Para reviewers
1. Los guardrails ya validaron las reglas críticas
2. Enfócate en lógica de negocio y UX
3. Si el CI pasa, la arquitectura está protegida

### Para arquitectos
1. Revisa reportes semanalmente
2. Ajusta reglas según feedback real
3. Documenta nuevas excepciones

---

**🛡️ Guardrails System - DobackSoft**

*Todo lo que necesitas, en una página*

