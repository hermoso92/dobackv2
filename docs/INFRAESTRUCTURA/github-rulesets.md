# 🛡️ GitHub Rulesets - Protección de Ramas

## ✅ Estado Actual

**Fecha de configuración:** 2025-10-22  
**Repositorio:** `hermoso92/dobackv2`  
**Estado:** 🟢 Activo y funcionando

Los rulesets están configurados y protegiendo las ramas de producción y desarrollo.

## 📋 Descripción General

DobackSoft utiliza **GitHub Rulesets** para proteger las ramas críticas del proyecto y garantizar la calidad del código mediante reglas automáticas de protección.

## 🎯 Rulesets Configurados

### 1️⃣ **doback-main** (Producción)

**Ramas protegidas:**
- `main`
- `release/**`

**Reglas aplicadas:**
- ✅ **No crear/actualizar/eliminar** directamente
- ✅ **No force push**
- ✅ **Historial lineal** obligatorio
- ✅ **Commits firmados** requeridos
- ✅ **Pull Request requerido** con 1 aprobación mínima
- ✅ **CI obligatorio:** build, lint, test
- ✅ **Code scanning** habilitado
- ✅ **Copilot code review** habilitado

**Solo admins pueden saltarse estas reglas.**

---

### 2️⃣ **doback-dev** (Desarrollo)

**Ramas protegidas:**
- `dev`
- `feature/**`

**Reglas aplicadas:**
- ✅ **No eliminar ramas**
- ✅ **No force push**
- ✅ **Historial lineal** obligatorio
- ✅ **CI básico:** build, lint

**Permite desarrollo flexible pero evita errores destructivos.**

---

## 🚀 Instalación y Configuración

### Paso 1: Instalar GitHub CLI

```powershell
# Con winget (recomendado)
winget install --id GitHub.cli

# O con Chocolatey
choco install gh
```

### Paso 2: Autenticarse

```powershell
gh auth login
```

Selecciona:
- GitHub.com
- HTTPS
- Login with a web browser

### Paso 3: Ejecutar Script de Configuración

```powershell
.\scripts\setup\setup-github-rulesets.ps1
```

El script automáticamente:
1. ✅ Verifica que `gh` esté instalado
2. ✅ Verifica autenticación con GitHub
3. ✅ Crea ruleset `doback-main`
4. ✅ Crea ruleset `doback-dev`
5. ✅ Verifica que ambos estén activos

---

## 🔍 Verificación Manual

### Ver todos los rulesets

```powershell
gh api /repos/StabilSafe/DobackSoft/rulesets | ConvertFrom-Json | Format-List
```

### Ver detalles de un ruleset específico

```powershell
# Ver doback-main
gh api /repos/StabilSafe/DobackSoft/rulesets | ConvertFrom-Json | Where-Object { $_.name -eq "doback-main" } | Format-List

# Ver doback-dev
gh api /repos/StabilSafe/DobackSoft/rulesets | ConvertFrom-Json | Where-Object { $_.name -eq "doback-dev" } | Format-List
```

### Panel web de GitHub

```
https://github.com/StabilSafe/DobackSoft/settings/rules
```

---

## 📖 Comandos Útiles

### Listar rulesets activos

```powershell
gh api /repos/StabilSafe/DobackSoft/rulesets --jq '.[] | {name, enforcement, id}'
```

### Desactivar un ruleset (temporal)

```powershell
gh api --method PUT /repos/StabilSafe/DobackSoft/rulesets/[ID] -f enforcement='disabled'
```

### Eliminar un ruleset

```powershell
gh api --method DELETE /repos/StabilSafe/DobackSoft/rulesets/[ID]
```

---

## 🔄 Flujo de Trabajo Recomendado

### Para desarrollo de features:

```bash
# 1. Crear rama desde dev
git checkout dev
git pull origin dev
git checkout -b feature/nueva-funcionalidad

# 2. Desarrollar y commitear
git add .
git commit -m "feat: nueva funcionalidad"

# 3. Push a feature branch
git push origin feature/nueva-funcionalidad

# 4. Abrir PR hacia dev
gh pr create --base dev --title "feat: nueva funcionalidad"
```

### Para releases:

```bash
# 1. Crear rama release desde dev
git checkout dev
git pull origin dev
git checkout -b release/v1.2.0

# 2. Preparar release (cambiar versiones, changelog)
git add .
git commit -m "chore: prepare release v1.2.0"

# 3. Push a release branch
git push origin release/v1.2.0

# 4. Abrir PR hacia main
gh pr create --base main --title "release: v1.2.0"
```

---

## ⚠️ Casos Especiales

### Saltarse reglas (solo admins)

Los administradores del repositorio pueden hacer bypass de las reglas cuando sea absolutamente necesario:

```powershell
# Hacer push directo a main (desaconsejado)
git push origin main

# GitHub permitirá el push pero quedará registrado en audit log
```

**⚠️ Usar solo en emergencias críticas.**

---

## 🐛 Troubleshooting

### Error: "gh: command not found"

```powershell
# Reinstalar GitHub CLI
winget install --id GitHub.cli

# Cerrar y reabrir PowerShell
```

### Error: "Resource not accessible by integration"

```powershell
# Reautenticarse con permisos correctos
gh auth logout
gh auth login --scopes "repo,admin:org"
```

### Error: "Must have admin rights to Repository"

El usuario autenticado necesita permisos de administrador en el repositorio `StabilSafe/DobackSoft`.

Contactar con el propietario del repositorio para obtener permisos.

---

## 📚 Referencias

- [GitHub Rulesets Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [GitHub CLI Manual](https://cli.github.com/manual/)
- [Branch Protection Best Practices](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

---

## 🔐 Seguridad

Los rulesets garantizan:

1. ✅ **Integridad del código:** Todo cambio pasa por revisión
2. ✅ **Calidad asegurada:** CI/CD obligatorio antes de merge
3. ✅ **Historial limpio:** No force push, historial lineal
4. ✅ **Trazabilidad:** Commits firmados, auditoría completa
5. ✅ **Prevención de errores:** No eliminación accidental de ramas

---

**📝 Última actualización:** 2025-10-22  
**👤 Mantenedor:** Equipo StabilSafe

