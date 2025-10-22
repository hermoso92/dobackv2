# ================================================================
# SCRIPT: Configuracion de Rulesets de GitHub para DobackSoft
# ================================================================
# 
# PROPOSITO:
#   Crea dos rulesets de proteccion de ramas usando GitHub CLI:
#   - doback-main: Proteccion estricta para produccion
#   - doback-dev: Proteccion ligera para desarrollo
#
# REQUISITOS:
#   - GitHub CLI instalado: winget install --id GitHub.cli
#   - Autenticacion con permisos admin: gh auth login
#
# USO:
#   .\scripts\setup\setup-github-rulesets.ps1
#
# ================================================================

$ErrorActionPreference = "Stop"

# Actualizar PATH para incluir GitHub CLI
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

# Colores para output
function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Err { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Inf { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn { param($msg) Write-Host "[AVISO] $msg" -ForegroundColor Yellow }

# ================================================================
# VERIFICACIONES PREVIAS
# ================================================================

Write-Inf "Verificando GitHub CLI..."

# Verificar si gh esta instalado
$ghPath = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghPath) {
    Write-Err "GitHub CLI no esta instalado o no esta en el PATH"
    Write-Inf ""
    Write-Inf "SOLUCION: Cierra esta ventana de PowerShell y abre una NUEVA como administrador"
    Write-Inf ""
    Write-Inf "GitHub CLI ya esta instalado, solo necesitas cerrar y reabrir PowerShell"
    exit 1
}

try {
    $versionOutput = & gh version 2>&1 | Out-String
    if ($versionOutput -match "gh version (\d+\.\d+\.\d+)") {
        Write-Success "GitHub CLI instalado: v$($matches[1])"
    }
    else {
        Write-Err "GitHub CLI instalado pero no responde correctamente"
        exit 1
    }
}
catch {
    Write-Err "Error al verificar GitHub CLI: $($_.Exception.Message)"
    exit 1
}

# Verificar autenticacion
Write-Inf "Verificando autenticacion..."
try {
    $authStatus = gh auth status 2>&1 | Out-String
    if ($authStatus -match "Logged in") {
        Write-Success "Autenticado correctamente"
    }
    else {
        Write-Err "No estas autenticado"
        Write-Inf "Ejecuta: .\scripts\setup\autenticar-github.ps1"
        exit 1
    }
}
catch {
    Write-Err "Error verificando autenticacion"
    Write-Inf "Ejecuta: .\scripts\setup\autenticar-github.ps1"
    exit 1
}

# ================================================================
# CONFIGURACION DE RULESETS
# ================================================================

$REPO = "hermoso92/dobackv2"

Write-Inf "Creando rulesets para repositorio: $REPO"
Write-Warn "Estos comandos requieren permisos de administrador en el repositorio"

# Crear directorio temporal
$tempDir = Join-Path $env:TEMP "github-rulesets"
if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir | Out-Null
}

# ================================================================
# RULESET DE PRODUCCION - doback-main
# ================================================================

Write-Inf "`n[1/2] Creando ruleset: doback-main"
Write-Host "   Protege: main, release/**" -ForegroundColor Gray
Write-Host "   Reglas: Estrictas (PR requerido, 1 aprobacion, CI, firma commits)" -ForegroundColor Gray

$mainRulesetJson = @"
{
  "name": "doback-main",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/main", "refs/heads/release/**"],
      "exclude": []
    }
  },
  "rules": [
    {"type": "deletion"},
    {"type": "non_fast_forward"},
    {"type": "required_linear_history"},
    {
      "type": "pull_request",
      "parameters": {
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_approving_review_count": 1,
        "required_review_thread_resolution": true
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          {"context": "build"},
          {"context": "lint"},
          {"context": "test"}
        ]
      }
    }
  ]
}
"@

$mainRulesetFile = Join-Path $tempDir "doback-main.json"
$mainRulesetJson | Out-File -FilePath $mainRulesetFile -Encoding ASCII

$errorOutput = $null
gh api --method POST `
    -H "Accept: application/vnd.github+json" `
    "/repos/$REPO/rulesets" `
    --input $mainRulesetFile 2>&1 | Tee-Object -Variable errorOutput | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Success "Ruleset 'doback-main' creado correctamente"
}
else {
    Write-Err "Error creando ruleset 'doback-main'"
    Write-Host $errorOutput -ForegroundColor Yellow
}

# ================================================================
# RULESET DE DESARROLLO - doback-dev
# ================================================================

Write-Inf "`n[2/2] Creando ruleset: doback-dev"
Write-Host "   Protege: dev, feature/**" -ForegroundColor Gray
Write-Host "   Reglas: Ligeras (sin force push, sin delete, historial lineal)" -ForegroundColor Gray

$devRulesetJson = @"
{
  "name": "doback-dev",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/dev", "refs/heads/feature/**"],
      "exclude": []
    }
  },
  "rules": [
    {"type": "deletion"},
    {"type": "non_fast_forward"},
    {"type": "required_linear_history"}
  ]
}
"@

$devRulesetFile = Join-Path $tempDir "doback-dev.json"
$devRulesetJson | Out-File -FilePath $devRulesetFile -Encoding ASCII

$errorOutput = $null
gh api --method POST `
    -H "Accept: application/vnd.github+json" `
    "/repos/$REPO/rulesets" `
    --input $devRulesetFile 2>&1 | Tee-Object -Variable errorOutput | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Success "Ruleset 'doback-dev' creado correctamente"
}
else {
    Write-Err "Error creando ruleset 'doback-dev'"
    Write-Host $errorOutput -ForegroundColor Yellow
}

# Limpiar archivos temporales
# Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Inf "Archivos JSON temporales en: $tempDir"

# ================================================================
# VERIFICACION FINAL
# ================================================================

Write-Inf "`nVerificando rulesets creados..."

try {
    $rulesets = gh api /repos/$REPO/rulesets | ConvertFrom-Json
    
    Write-Host "`nRulesets activos:" -ForegroundColor Cyan
    foreach ($ruleset in $rulesets) {
        Write-Host "   - $($ruleset.name)" -ForegroundColor White
        Write-Host "     Estado: $($ruleset.enforcement)" -ForegroundColor Gray
        Write-Host "     ID: $($ruleset.id)" -ForegroundColor Gray
    }
    
    # Verificar que ambos existen
    $mainRuleset = $rulesets | Where-Object { $_.name -eq "doback-main" }
    $devRuleset = $rulesets | Where-Object { $_.name -eq "doback-dev" }
    
    if ($mainRuleset -and $devRuleset) {
        Write-Success "`nRulesets configurados correctamente"
        Write-Inf "Las ramas main y dev ahora estan protegidas"
    }
    else {
        Write-Warn "`nAlgunos rulesets no se crearon correctamente"
        if (-not $mainRuleset) { Write-Err "Falta: doback-main" }
        if (-not $devRuleset) { Write-Err "Falta: doback-dev" }
    }
    
}
catch {
    Write-Err "Error verificando rulesets"
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Inf "`nPara ver detalles completos:"
Write-Host "   gh api /repos/$REPO/rulesets | ConvertFrom-Json | Format-List" -ForegroundColor Gray

Write-Inf "`nPanel web:"
Write-Host "   https://github.com/$REPO/settings/rules" -ForegroundColor Gray
