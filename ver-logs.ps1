# Script para ver logs del sistema en tiempo real

param(
    [string]$Servicio = "ambos"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  VISOR DE LOGS - DOBACKSOFT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

if (-not (Test-Path "logs")) {
    Write-Host "❌ No existe la carpeta logs" -ForegroundColor Red
    exit 1
}

$backendLogs = Get-ChildItem logs -Filter "backend_*.log" | Sort-Object LastWriteTime -Descending
$frontendLogs = Get-ChildItem logs -Filter "frontend_*.log" | Sort-Object LastWriteTime -Descending

if ($Servicio -eq "backend" -or $Servicio -eq "ambos") {
    if ($backendLogs.Count -gt 0) {
        $latestBackend = $backendLogs[0]
        Write-Host "📊 BACKEND LOG (últimas 30 líneas):" -ForegroundColor Yellow
        Write-Host "Archivo: $($latestBackend.Name)" -ForegroundColor Gray
        Write-Host "----------------------------------------" -ForegroundColor Gray
        Get-Content $latestBackend.FullName | Select-Object -Last 30
        Write-Host "`n" -ForegroundColor Gray
    }
    else {
        Write-Host "⚠️ No hay logs de backend" -ForegroundColor Yellow
    }
}

if ($Servicio -eq "frontend" -or $Servicio -eq "ambos") {
    if ($frontendLogs.Count -gt 0) {
        $latestFrontend = $frontendLogs[0]
        Write-Host "📊 FRONTEND LOG (últimas 30 líneas):" -ForegroundColor Magenta
        Write-Host "Archivo: $($latestFrontend.Name)" -ForegroundColor Gray
        Write-Host "----------------------------------------" -ForegroundColor Gray
        Get-Content $latestFrontend.FullName | Select-Object -Last 30
        Write-Host "`n" -ForegroundColor Gray
    }
    else {
        Write-Host "⚠️ No hay logs de frontend" -ForegroundColor Yellow
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "USO:" -ForegroundColor Yellow
Write-Host "  .\ver-logs.ps1           # Ver ambos logs" -ForegroundColor White
Write-Host "  .\ver-logs.ps1 backend   # Solo backend" -ForegroundColor White
Write-Host "  .\ver-logs.ps1 frontend  # Solo frontend" -ForegroundColor White
Write-Host "`nPara seguir en tiempo real:" -ForegroundColor Yellow
Write-Host "  Get-Content logs\backend_*.log -Wait -Tail 50" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan
