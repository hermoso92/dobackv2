# 🛡️ GUARDRAILS SYSTEM - INDEX

**Sistema de protección de invariantes arquitectónicos para DobackSoft**

---

## 🚀 START HERE

### Para empezar AHORA (5 minutos)
👉 **[QUICK START](./QUICK-START.md)** - Guía rápida de inicio

### Documentación completa
📖 **[README](./README.md)** - Documentación completa del sistema

### Planificación
📅 **[Plan 30/60/90 Días](../../docs/CALIDAD/PLAN-GUARDRAILS-30-60-90.md)** - Roadmap detallado  
📊 **[Resumen Ejecutivo](../../docs/CALIDAD/GUARDRAILS-RESUMEN-EJECUTIVO.md)** - Visión general y estado

---

## 📁 ESTRUCTURA DEL SISTEMA

```
scripts/guardrails/
├── INDEX.md                           # 👈 ESTÁS AQUÍ
├── README.md                          # Documentación completa
├── QUICK-START.md                     # Guía rápida 5 min
├── .guardrailsignore                  # Archivos excluidos
├── run-guardrails.ts                  # 🎯 Script principal
│
├── fitness-functions/                 # 🧪 Tests ejecutables
│   ├── security.test.ts               #   🔒 Seguridad & Aislamiento
│   ├── architecture.test.ts           #   🏗️ Arquitectura & Modularidad
│   ├── performance.test.ts            #   ⚡ Performance & Tamaño
│   └── domain.test.ts                 #   🔄 Flujo & Reglas de Negocio
│
├── scanners/                          # 🔍 Detectores repo-wide
│   ├── scan-console-logs.ts           #   Console.log detector
│   ├── scan-hardcoded-urls.ts         #   Hardcoded URLs detector
│   ├── scan-organization-id.ts        #   OrganizationId filter detector
│   ├── scan-component-size.ts         #   Component size detector
│   └── scan-all.ts                    #   🎯 Orquestador maestro
│
├── auto-fix/                          # 🔧 Correctores automáticos
│   ├── fix-console-logs.ts            #   console.log → logger
│   ├── fix-hardcoded-urls.ts          #   URLs → config/api.ts
│   └── apply-fixes.ts                 #   🎯 Orquestador de fixes
│
├── ci/                                # 🔄 CI/CD & Hooks
│   ├── pre-commit.ts                  #   Pre-commit hook
│   └── install-hooks.ts               #   Instalador de hooks
│
└── reports/                           # 📊 Reportes generados
    └── .gitkeep
```

---

## 🎯 COMANDOS PRINCIPALES

### Uso básico

```bash
npm run guardrails              # Scan completo (default)
npm run guardrails:scan         # Solo scan
npm run guardrails:fix          # Aplicar auto-fixes
npm run guardrails:scan-and-fix # Ciclo completo: scan → fix → re-scan
```

### Scanners individuales

```bash
npm run guardrails:console-logs      # Detectar console.*
npm run guardrails:hardcoded-urls    # Detectar URLs hardcodeadas
npm run guardrails:organization-id   # Detectar queries sin organizationId
npm run guardrails:component-size    # Detectar componentes grandes
```

### Auto-fixes individuales

```bash
npm run guardrails:fix-console-logs  # Corregir console.*
npm run guardrails:fix-hardcoded-urls # Corregir URLs
```

### Setup

```bash
npm run guardrails:install-hook      # Instalar pre-commit hook
npm run guardrails:test              # Ejecutar fitness function tests
```

### Opciones

```bash
npm run guardrails:fix -- --dry-run  # Preview fixes sin aplicar
```

---

## 🔒 INVARIANTES PROTEGIDOS

### Seguridad & Aislamiento
- ✅ `organizationId` obligatorio en todas las queries
- ✅ JWT en cookies httpOnly
- ✅ CSRF protection activo
- ✅ No hardcoded secrets/API keys

### Arquitectura & Modularidad
- ✅ No `console.log` - usar `logger` centralizado
- ✅ No URLs hardcodeadas - usar `config/api.ts`
- ✅ Puertos fijos: **9998** (backend), **5174** (frontend)
- ✅ Módulos fijos del menú (no extensibles)

### Performance & Tamaño
- ✅ Componentes **<300 líneas**
- ✅ Páginas **<400 líneas**
- ✅ Bundle size **<300 KB**
- ✅ No queries N+1

### Dominio & Business Rules
- ✅ Roles: solo **ADMIN** y **MANAGER**
- ✅ Flujo: Subida → Procesamiento → Visualización → Exportación
- ✅ Comparadores: solo entre sesiones del mismo tipo
- ✅ Validaciones de datos:
  - Fechas >= 2025-09-01
  - GPS: España (36-44°N, -10 a 5°E)
  - Velocidad <= 200 km/h

---

## 📊 ESTADO ACTUAL

### Violaciones detectadas (baseline)
- 🔴 **69** console.log en backend
- 🔴 **45** console.log en frontend
- ⚠️ URLs hardcodeadas (por medir)
- ⚠️ Queries sin organizationId (por medir)

### Próximos pasos
1. ✅ Ejecutar scan inicial: `npm run guardrails:scan`
2. ✅ Aplicar auto-fixes: `npm run guardrails:fix`
3. ✅ Instalar pre-commit hook: `npm run guardrails:install-hook`
4. ⏳ Activar CI bloqueante en GitHub
5. ⏳ Capacitar equipo

---

## 📚 DOCUMENTACIÓN RELACIONADA

### En este directorio
- 📖 [README.md](./README.md) - Documentación completa
- 🚀 [QUICK-START.md](./QUICK-START.md) - Guía rápida 5 min
- 🚫 [.guardrailsignore](./.guardrailsignore) - Archivos excluidos

### En docs/CALIDAD/
- 📊 [GUARDRAILS-RESUMEN-EJECUTIVO.md](../../docs/CALIDAD/GUARDRAILS-RESUMEN-EJECUTIVO.md)
- 📅 [PLAN-GUARDRAILS-30-60-90.md](../../docs/CALIDAD/PLAN-GUARDRAILS-30-60-90.md)

### En raíz del proyecto
- 🧪 [jest.config.guardrails.js](../../jest.config.guardrails.js)
- 📦 [package.json](../../package.json) - Scripts npm
- 🔄 [.github/workflows/guardrails.yml](../../.github/workflows/guardrails.yml)

### Reglas del proyecto
- 📐 [Reglas Cursor DobackSoft](.cursor/rules) - Reglas completas
- 📖 [README.md](../../README.md) - Proyecto principal

---

## 🎯 WORKFLOW TÍPICO

### Primera vez
```bash
# 1. Scan inicial
npm run guardrails:scan

# 2. Ver qué se va a corregir
npm run guardrails:fix --dry-run

# 3. Aplicar correcciones
npm run guardrails:fix

# 4. Instalar hook
npm run guardrails:install-hook

# 5. Commit
git add .
git commit -m "fix: Apply guardrails auto-fixes"
```

### Uso diario
```bash
# El pre-commit hook se ejecuta automáticamente
git commit -m "feat: Nueva funcionalidad"

# Si hay violaciones, el commit se bloquea
# Corregir y retry
npm run guardrails:fix
git commit -m "feat: Nueva funcionalidad"
```

### En CI (automático)
- Push → GitHub Actions ejecuta guardrails
- Si hay violaciones críticas → ❌ Build falla
- Pull Request → Comenta resultados automáticamente

---

## 🆘 TROUBLESHOOTING

### Error: "glob not found"
```bash
npm install glob
```

### Error: "ts-node not found"
```bash
npm install -g ts-node typescript
```

### Falsos positivos
Agregar `// GUARDRAILS:SAFE` al final de la línea o archivo a `.guardrailsignore`

### Más ayuda
Ver [README.md](./README.md) sección "Mantenimiento" y "Troubleshooting"

---

## 🏆 MÉTRICAS DE ÉXITO

### Objetivo Día 30
- ✅ 0 violaciones críticas
- ✅ CI bloqueante activo
- ✅ 100% devs con pre-commit hook

### Objetivo Día 90
- ✅ Dashboard de calidad
- ✅ < 5 violaciones totales
- ✅ Tendencia descendente sostenida

---

## 📞 SOPORTE

- 🐛 **Issues:** GitHub Issues con tag `guardrails`
- 💬 **Slack:** #dobacksoft-quality
- 📧 **Email:** arquitecto-guardrails@dobacksoft.com

---

## 🎊 QUICK LINKS

### Ejecutar ahora
- [▶️ Scan completo](#) → `npm run guardrails:scan`
- [🔧 Auto-fix](#) → `npm run guardrails:fix`
- [🪝 Instalar hook](#) → `npm run guardrails:install-hook`

### Leer más
- [📖 README completo](./README.md)
- [🚀 Quick Start](./QUICK-START.md)
- [📊 Resumen Ejecutivo](../../docs/CALIDAD/GUARDRAILS-RESUMEN-EJECUTIVO.md)
- [📅 Plan 30/60/90](../../docs/CALIDAD/PLAN-GUARDRAILS-30-60-90.md)

---

**🛡️ Guardrails System v1.0 - DobackSoft StabilSafe V2**

*Protegiendo los invariantes críticos desde el día 1*

