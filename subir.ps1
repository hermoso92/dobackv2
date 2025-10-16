# =====================================================
# Script de Subida a GitHub - DobackSoft V3
# =====================================================

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "    SUBIR CAMBIOS A GITHUB" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si hay cambios
Write-Host "Archivos modificados:" -ForegroundColor Yellow
Write-Host ""
git status --short

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Git no esta disponible" -ForegroundColor Red
    Write-Host "Instala Git desde: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Pedir mensaje del commit
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Escribe el mensaje del commit:" -ForegroundColor Green
Write-Host ""
Write-Host "  Ejemplos:" -ForegroundColor DarkGray
Write-Host "  - feat: Anadido modulo de reportes" -ForegroundColor DarkGray
Write-Host "  - fix: Corregido error en dashboard" -ForegroundColor DarkGray
Write-Host "  - Actualizacion de funcionalidades" -ForegroundColor DarkGray
Write-Host ""
$mensaje = Read-Host "Mensaje"

# Validar que no este vacio
if ([string]::IsNullOrWhiteSpace($mensaje)) {
    Write-Host ""
    Write-Host "[ERROR] El mensaje no puede estar vacio" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan

# Anadir archivos
Write-Host ""
Write-Host "Anadiendo archivos..." -ForegroundColor Yellow
git add .

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Error al anadir archivos" -ForegroundColor Red
    exit 1
}

# Crear commit
Write-Host "Creando commit..." -ForegroundColor Yellow
git commit -m $mensaje

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[AVISO] No hay cambios para commitear" -ForegroundColor Yellow
    exit 1
}

# Obtener rama actual
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Rama actual: $currentBranch" -ForegroundColor Cyan

# Subir a GitHub
Write-Host "Subiendo a GitHub..." -ForegroundColor Yellow
git push origin $currentBranch

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Error al hacer push a GitHub" -ForegroundColor Red
    Write-Host "Verifica tu conexion a internet y permisos" -ForegroundColor Yellow
    exit 1
}

# Exito
Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "    CAMBIOS SUBIDOS EXITOSAMENTE" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Commit: $mensaje" -ForegroundColor Cyan
Write-Host "Repo: https://github.com/hermoso92/dobackv2" -ForegroundColor Cyan
Write-Host ""
