# 🔐 Configuración de GitHub Rulesets - DobackSoft

## ⚡ Inicio Rápido (3 Pasos)

### 1️⃣ **Autenticar con GitHub**

Abre **PowerShell** (no desde Cursor) en el directorio del proyecto y ejecuta:

```powershell
cd "C:\Users\Cosigein SL\Desktop\DobackSoft"
.\scripts\setup\autenticar-github.ps1
```

**¿Qué hace este script?**
- ✅ Verifica que GitHub CLI esté instalado
- ✅ Te guía paso a paso en la autenticación
- ✅ Abre el navegador automáticamente
- ✅ Verifica que todo esté correcto

---

### 2️⃣ **Crear los Rulesets**

Una vez autenticado, en la **misma terminal**, ejecuta:

```powershell
.\scripts\setup\setup-github-rulesets.ps1
```

**¿Qué hace este script?**
- ✅ Crea ruleset `doback-main` (protección de producción)
- ✅ Crea ruleset `doback-dev` (protección de desarrollo)
- ✅ Verifica que ambos estén activos
- ✅ Muestra resumen final

---

### 3️⃣ **Verificar**

```powershell
gh api /repos/StabilSafe/DobackSoft/rulesets
```

Deberías ver ambos rulesets activos.

---

## 🎯 Rulesets Creados

| Ruleset | Ramas Protegidas | Reglas Principales |
|---------|------------------|-------------------|
| **doback-main** | `main`, `release/**` | • PR obligatorio (1 aprobación)<br>• CI completo (build/lint/test)<br>• Commits firmados<br>• Historial lineal<br>• No force push |
| **doback-dev** | `dev`, `feature/**` | • No force push<br>• No eliminar ramas<br>• Historial lineal<br>• CI básico (build/lint) |

---

## 🐛 Troubleshooting

### ❌ Error: "You are not logged into any GitHub hosts"

**Solución:**
```powershell
.\scripts\setup\autenticar-github.ps1
```

---

### ❌ Error: "Resource not accessible by integration"

**Causa:** No tienes permisos de administrador en el repositorio.

**Solución:** Contacta al propietario de `StabilSafe/DobackSoft` para obtener permisos.

---

### ❌ Error: "This 'device_code' has expired"

**Causa:** El código de autenticación expiró (tiempo límite: 15 minutos).

**Solución:** Vuelve a ejecutar el script de autenticación:
```powershell
.\scripts\setup\autenticar-github.ps1
```

---

### ❌ Error: "Must have admin rights to Repository"

**Causa:** Tu cuenta no tiene permisos de administrador.

**Opciones:**
1. Pedir permisos de admin al propietario del repo
2. Pedir que alguien con permisos ejecute el script
3. Crear los rulesets manualmente desde el panel web

---

## 🌐 Alternativa: Crear Rulesets Manualmente

Si prefieres usar la interfaz web de GitHub:

1. Ve a: https://github.com/StabilSafe/DobackSoft/settings/rules
2. Click en **New ruleset** → **New branch ruleset**
3. Configura según las especificaciones de `docs/INFRAESTRUCTURA/github-rulesets.md`

---

## 📚 Documentación Completa

Ver: `docs/INFRAESTRUCTURA/github-rulesets.md`

---

## ✅ Verificación Final

Una vez completados todos los pasos, verifica:

```powershell
# Ver rulesets activos
gh api /repos/StabilSafe/DobackSoft/rulesets --jq '.[] | {name, enforcement, id}'

# Ver detalles de doback-main
gh api /repos/StabilSafe/DobackSoft/rulesets | ConvertFrom-Json | Where-Object { $_.name -eq "doback-main" } | Format-List

# Ver detalles de doback-dev
gh api /repos/StabilSafe/DobackSoft/rulesets | ConvertFrom-Json | Where-Object { $_.name -eq "doback-dev" } | Format-List
```

**Salida esperada:**
```
name        : doback-main
enforcement : active
id          : [número]

name        : doback-dev
enforcement : active
id          : [número]
```

---

## 🎉 ¡Listo!

Tus ramas ahora están protegidas:

- ✅ `main` y `release/**` requieren PR con aprobación
- ✅ `dev` y `feature/**` están protegidas contra cambios destructivos
- ✅ Todo el código pasa por CI antes de merge
- ✅ Historial limpio y trazable

---

**📝 Fecha:** 2025-10-22  
**👤 Proyecto:** DobackSoft (StabilSafe)

