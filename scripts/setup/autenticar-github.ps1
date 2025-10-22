# ================================================================
# SCRIPT: Autenticacion de GitHub CLI
# ================================================================
# 
# Este script te guia paso a paso para autenticarte en GitHub CLI
#
# ================================================================

$ErrorActionPreference = "Stop"

# Actualizar PATH para incluir GitHub CLI
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

# Colores
function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Err { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Inf { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn { param($msg) Write-Host "[AVISO] $msg" -ForegroundColor Yellow }
function Write-Step { param($msg) Write-Host "`n>>> $msg" -ForegroundColor Yellow }

Clear-Host

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "    AUTENTICACION GITHUB CLI - DobackSoft" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

Write-Step "Verificando GitHub CLI..."

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

Write-Step "Iniciando proceso de autenticacion..."

Write-Host "`nEl proceso es simple:" -ForegroundColor White
Write-Host "   1. Se abrira tu navegador automaticamente" -ForegroundColor Gray
Write-Host "   2. Se copiara un codigo al portapapeles" -ForegroundColor Gray
Write-Host "   3. Pega el codigo en GitHub" -ForegroundColor Gray
Write-Host "   4. Autoriza la aplicacion" -ForegroundColor Gray

Write-Warn "`nIMPORTANTE: Completa el proceso en menos de 10 minutos"

Write-Host "`nPresiona ENTER para continuar..." -ForegroundColor Cyan
$null = Read-Host

Write-Inf "Iniciando autenticacion..."

# Ejecutar autenticacion
try {
    gh auth login --hostname github.com --git-protocol https --web --scopes "repo,admin:org"
    
    Write-Success "`nAutenticacion completada!"
    
    # Verificar
    Write-Inf "Verificando autenticacion..."
    gh auth status
    
    Write-Success "`nTodo listo para crear los rulesets"
    Write-Inf "Ejecuta ahora: .\scripts\setup\setup-github-rulesets.ps1"
    
}
catch {
    Write-Err "`nError durante la autenticacion"
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Inf "`nIntenta de nuevo ejecutando: gh auth login"
    exit 1
}

Write-Host "`n============================================================" -ForegroundColor Cyan
