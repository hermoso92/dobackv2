# POST-PROCESAMIENTO DE SESIONES
# Script para ejecutar funcionalidades deshabilitadas durante el procesamiento automático

param(
    [Parameter(Mandatory = $true)]
    [string]$VehicleId,
    
    [Parameter(Mandatory = $true)]
    [string]$StartDate,
    
    [Parameter(Mandatory = $true)]
    [string]$EndDate
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  POST-PROCESAMIENTO DE SESIONES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Vehículo: $VehicleId" -ForegroundColor Yellow
Write-Host "Fecha inicio: $StartDate" -ForegroundColor Yellow
Write-Host "Fecha fin: $EndDate" -ForegroundColor Yellow
Write-Host ""
Write-Host "Este script ejecutará:" -ForegroundColor Green
Write-Host "  ✅ Violaciones de velocidad (con muestreo optimizado)" -ForegroundColor White
Write-Host "  ✅ Cálculo de KPIs diarios" -ForegroundColor White
Write-Host "  ✅ Eventos de geocercas" -ForegroundColor White
Write-Host ""
Write-Host "⚙️  Configuración:" -ForegroundColor Cyan
Write-Host "  - Procesamiento en lotes: 5 sesiones en paralelo" -ForegroundColor White
Write-Host "  - Muestreo GPS para velocidad: 1 punto cada 10" -ForegroundColor White
Write-Host ""

# Confirmación
$confirm = Read-Host "¿Desea continuar? (S/N)"
if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host ""
    Write-Host "❌ Cancelado por el usuario" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🚀 Iniciando post-procesamiento..." -ForegroundColor Green
Write-Host ""

# Cambiar al directorio raíz del proyecto
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent $scriptPath
Set-Location $rootPath

# Ejecutar el script de TypeScript
npx ts-node backend/src/scripts/postProcessSessions.ts $VehicleId $StartDate $EndDate

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ POST-PROCESAMIENTO COMPLETADO" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
}
else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ❌ ERROR EN POST-PROCESAMIENTO" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    exit 1
}

