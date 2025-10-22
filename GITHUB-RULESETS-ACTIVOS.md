# GitHub Rulesets Activos - DobackSoft

## Estado Actual

**Repositorio:** `hermoso92/dobackv2`  
**Fecha de creación:** 2025-10-22  
**Estado:** ✅ Configurado y activo

---

## 1️⃣ Ruleset: doback-main

**ID:** 9080997  
**Estado:** 🟢 Active  
**Objetivo:** Protección estricta de ramas de producción

### Ramas Protegidas
- `main`
- `release/**`

### Reglas Aplicadas

| Regla | Descripción | Estado |
|-------|-------------|--------|
| **deletion** | Prevenir eliminación de rama | ✅ Activa |
| **non_fast_forward** | Prevenir force push | ✅ Activa |
| **required_linear_history** | Historial lineal obligatorio | ✅ Activa |
| **pull_request** | PR requerido con 1 aprobación | ✅ Activa |
| **required_status_checks** | CI obligatorio (build, lint, test) | ✅ Activa |

### Parámetros del Pull Request
- ✅ Requiere 1 aprobación mínima
- ✅ Dismiss stale reviews on push
- ✅ Require review thread resolution
- ❌ No require code owner review
- ❌ No require last push approval

### Parámetros de Status Checks
- ✅ Strict mode enabled
- ✅ Required checks: `build`, `lint`, `test`

---

## 2️⃣ Ruleset: doback-dev

**ID:** 9080999  
**Estado:** 🟢 Active  
**Objetivo:** Protección básica de ramas de desarrollo

### Ramas Protegidas
- `dev`
- `feature/**`

### Reglas Aplicadas

| Regla | Descripción | Estado |
|-------|-------------|--------|
| **deletion** | Prevenir eliminación de rama | ✅ Activa |
| **non_fast_forward** | Prevenir force push | ✅ Activa |
| **required_linear_history** | Historial lineal obligatorio | ✅ Activa |

---

## 🔒 Protecciones Efectivas

### En rama `main` y `release/**`:

❌ **NO PUEDES:**
- Hacer push directo (debes crear PR)
- Hacer force push
- Eliminar la rama
- Mergear sin aprobación
- Mergear sin pasar CI

✅ **DEBES:**
- Crear Pull Request
- Obtener 1 aprobación
- Pasar checks de CI (build, lint, test)
- Resolver todas las conversaciones del PR

---

### En rama `dev` y `feature/**`:

❌ **NO PUEDES:**
- Hacer force push
- Eliminar la rama
- Crear merge commits desordenados

✅ **PUEDES:**
- Hacer push directo (sin PR)
- Mergear sin aprobaciones
- Trabajar libremente en desarrollo

---

## 🧪 Comandos de Verificación

### Ver todos los rulesets
```powershell
gh api /repos/hermoso92/dobackv2/rulesets | ConvertFrom-Json | Format-List
```

### Ver detalles de doback-main
```powershell
gh api /repos/hermoso92/dobackv2/rulesets/9080997
```

### Ver detalles de doback-dev
```powershell
gh api /repos/hermoso92/dobackv2/rulesets/9080999
```

### Panel web
```
https://github.com/hermoso92/dobackv2/settings/rules
```

---

## 🔧 Modificar Rulesets

### Cambiar enforcement status (activar/desactivar)
```powershell
# Desactivar doback-main temporalmente
gh api --method PUT /repos/hermoso92/dobackv2/rulesets/9080997 -f enforcement='disabled'

# Reactivar
gh api --method PUT /repos/hermoso92/dobackv2/rulesets/9080997 -f enforcement='active'
```

### Eliminar un ruleset
```powershell
gh api --method DELETE /repos/hermoso92/dobackv2/rulesets/9080997
```

### Recrear rulesets
```powershell
.\scripts\setup\setup-github-rulesets.ps1
```

---

## 📊 Flujo de Trabajo Recomendado

### Para Features
```bash
# 1. Crear rama desde dev
git checkout dev
git pull origin dev
git checkout -b feature/nueva-funcionalidad

# 2. Desarrollar y commitear
git add .
git commit -m "feat: nueva funcionalidad"

# 3. Push a feature branch (permitido)
git push origin feature/nueva-funcionalidad

# 4. Abrir PR hacia dev (opcional pero recomendado)
gh pr create --base dev --title "feat: nueva funcionalidad"
```

### Para Releases
```bash
# 1. Crear rama release desde dev
git checkout dev
git pull origin dev
git checkout -b release/v1.2.0

# 2. Preparar release
git add .
git commit -m "chore: prepare release v1.2.0"

# 3. Push a release branch
git push origin release/v1.2.0

# 4. Abrir PR hacia main (OBLIGATORIO)
gh pr create --base main --title "release: v1.2.0"

# 5. Esperar aprobación + CI
# 6. Mergear cuando todo esté verde
```

### Para Hotfixes
```bash
# 1. Crear rama desde main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# 2. Hacer fix
git add .
git commit -m "fix: critical bug"

# 3. Push
git push origin hotfix/critical-bug

# 4. Abrir PR hacia main (OBLIGATORIO)
gh pr create --base main --title "hotfix: critical bug"

# 5. Necesita aprobación + CI antes de merge
```

---

## ⚠️ Bypass de Reglas

Los administradores del repositorio pueden hacer bypass de las reglas cuando sea absolutamente necesario, pero:

- ⚠️ Quedará registrado en audit log
- ⚠️ Solo usar en emergencias
- ⚠️ Se recomienda documentar el motivo

---

## 📚 Referencias

- [GitHub Rulesets Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [GitHub CLI Manual](https://cli.github.com/manual/)
- Scripts locales: `scripts/setup/`
- Documentación: `docs/INFRAESTRUCTURA/github-rulesets.md`

---

**Última actualización:** 2025-10-22  
**Configurado por:** Cursor AI + GitHub CLI  
**Mantenedor:** hermoso92

