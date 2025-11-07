# 🚀 GUARDRAILS QUICK START

**5 minutos para proteger DobackSoft permanentemente**

---

## 📋 PREREQUISITOS

```bash
# Verificar que estás en la raíz del proyecto
cd /ruta/a/DobackSoft

# Instalar dependencias (si no está hecho)
npm install
```

---

## 🎯 3 PASOS PARA EMPEZAR

### 1️⃣ SCAN INICIAL (2 minutos)

```bash
npm run guardrails:scan
```

**Qué hace:**
- Escanea todo el codebase
- Detecta violaciones de seguridad, arquitectura, performance
- Genera reporte en `scripts/guardrails/reports/`

**Salida esperada:**
```
🛡️  DOBACKSOFT GUARDRAILS - FULL SCAN
================================================

1️⃣  Scanning console.* calls...
   ❌ Found 114 violations

2️⃣  Scanning hardcoded URLs...
   ❌ Found X violations

3️⃣  Scanning organizationId filters...
   ✅ Found 0 violations

4️⃣  Scanning component sizes...
   ⚠️ Found X oversized components

================================================
📊 SUMMARY

🔴 CRITICAL: 2 scanner(s) with violations
   - Console Logs: 114 violations
   - OrganizationId Filters: 0 violations

Total violations: XXX
Status: ❌ FAILED
```

### 2️⃣ AUTO-FIX (3 minutos)

```bash
# Primero: Preview (ver qué se va a cambiar)
npm run guardrails:fix --dry-run

# Luego: Aplicar cambios
npm run guardrails:fix
```

**Qué hace:**
- Reemplaza `console.log` → `logger`
- Reemplaza URLs hardcodeadas → `API_CONFIG`
- Añade imports necesarios
- Genera reporte de cambios aplicados

**Salida esperada:**
```
🛡️  DOBACKSOFT AUTO-FIX ENGINE
================================================

1️⃣  Fixing console.* calls...
  ✅ Fixed backend/src/controllers/VehicleController.ts: 3 changes
  ✅ Fixed frontend/src/pages/Dashboard.tsx: 2 changes
  ...

   ✅ 45 files, 114 changes

2️⃣  Fixing hardcoded URLs...
  ✅ Fixed frontend/src/services/api.ts: 5 changes
  ...

   ✅ 12 files, 18 changes

================================================
📊 SUMMARY

✅ Console Logs: 45 files, 114 changes
✅ Hardcoded URLs: 12 files, 18 changes

Total: 57 files modified, 132 changes applied

✅ All fixes applied successfully!

💡 Next steps:
   1. Review changes with git diff
   2. Run tests to verify
   3. Commit changes
```

### 3️⃣ INSTALAR PRE-COMMIT HOOK (30 segundos)

```bash
npm run guardrails:install-hook
```

**Qué hace:**
- Instala hook en `.git/hooks/pre-commit`
- Ejecuta guardrails antes de cada commit
- Bloquea commit si hay violaciones críticas

**Salida esperada:**
```
🔧 Installing guardrails pre-commit hook...

✅ Pre-commit hook installed successfully!
   Location: .git/hooks/pre-commit

💡 The hook will run automatically on every commit
   To bypass (not recommended): git commit --no-verify
```

---

## ✅ VERIFICACIÓN

```bash
# Re-scan para verificar que se corrigieron las violaciones
npm run guardrails:scan
```

**Resultado esperado:**
```
✅ No console.* violations found!
✅ No hardcoded URLs found!
✅ All queries have proper organizationId filtering!
⚠️ Found X oversized components (no bloqueante)

Total violations: X (solo MEDIUM/LOW)
Status: ✅ PASSED
```

---

## 🔄 WORKFLOW DIARIO

### Antes de commitear

```bash
# El pre-commit hook se ejecuta automáticamente
git add .
git commit -m "feat: Nueva funcionalidad"

# Si hay violaciones:
🪝 Running pre-commit guardrails...
❌ Found 2 critical violations in staged files
💡 Fix violations before committing:
   npm run guardrails:fix

# Corregir y retry
npm run guardrails:fix
git add .
git commit -m "feat: Nueva funcionalidad"
```

### Bypass (solo emergencias)

```bash
# NO recomendado, pero disponible
git commit --no-verify
```

### Scan manual

```bash
# Ejecutar cuando quieras
npm run guardrails:scan
```

---

## 🛠️ COMANDOS ÚTILES

### Scanners individuales

```bash
npm run guardrails:console-logs      # Solo console.log
npm run guardrails:hardcoded-urls    # Solo URLs
npm run guardrails:organization-id   # Solo organizationId
npm run guardrails:component-size    # Solo tamaño componentes
```

### Fixes individuales

```bash
npm run guardrails:fix-console-logs      # Solo fix console.log
npm run guardrails:fix-hardcoded-urls    # Solo fix URLs
```

### Ciclo completo

```bash
# Scan → Fix → Re-scan (todo en uno)
npm run guardrails:scan-and-fix
```

### Tests de fitness functions

```bash
npm run guardrails:test
```

---

## 📊 REPORTES

Los reportes se guardan en `scripts/guardrails/reports/`:

```
scripts/guardrails/reports/
├── summary.json                       # Resumen general
├── console-logs-violations.json       # Violaciones console.log
├── hardcoded-urls-violations.json     # Violaciones URLs
├── organizationid-violations.json     # Violaciones organizationId
├── component-size-violations.json     # Componentes grandes
├── console-logs-fixes.json            # Fixes aplicados (console.log)
└── hardcoded-urls-fixes.json          # Fixes aplicados (URLs)
```

---

## 🐛 TROUBLESHOOTING

### Error: "glob not found"

```bash
npm install glob
```

### Error: "ts-node not found"

```bash
npm install -g ts-node typescript
# O local:
npm install ts-node typescript
```

### Pre-commit hook no se ejecuta

```bash
# Reinstalar
npm run guardrails:install-hook

# Verificar permisos (Linux/Mac)
chmod +x .git/hooks/pre-commit
```

### Falsos positivos

Agregar `// GUARDRAILS:SAFE` al final de la línea:

```typescript
console.log('Esto es necesario'); // GUARDRAILS:SAFE
```

O agregar archivo a `.guardrailsignore`:

```
# Mi archivo específico
backend/src/scripts/mi-script-especial.ts
```

---

## 📚 MÁS INFORMACIÓN

- 📖 **Documentación completa:** `scripts/guardrails/README.md`
- 📅 **Plan 30/60/90:** `docs/CALIDAD/PLAN-GUARDRAILS-30-60-90.md`
- 📊 **Resumen ejecutivo:** `docs/CALIDAD/GUARDRAILS-RESUMEN-EJECUTIVO.md`

---

## 🎯 PRÓXIMOS PASOS

Después del quick start:

1. **Revisar cambios aplicados**
   ```bash
   git diff
   ```

2. **Corregir `logger.ts` manualmente**
   - Editar `backend/src/utils/logger.ts`
   - Eliminar función `loggerApp` (líneas 227-242)
   - O agregar `// GUARDRAILS:SAFE`

3. **Commit cambios**
   ```bash
   git add .
   git commit -m "fix: Apply guardrails auto-fixes + remove console.log violations"
   ```

4. **Push y validar CI**
   ```bash
   git push
   # Verificar que el workflow de GitHub Actions pasa
   ```

5. **Activar CI bloqueante** (settings de GitHub)
   - Branch protection rules
   - Require status checks: `guardrails-scan`

---

## ✨ ¡LISTO!

Ahora tienes:
- ✅ Codebase escaneado
- ✅ Violaciones corregidas automáticamente
- ✅ Pre-commit hook instalado
- ✅ CI bloqueante configurado

**DobackSoft está protegido. 🛡️**

Para cualquier duda: `scripts/guardrails/README.md`

