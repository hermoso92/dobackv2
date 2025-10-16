# Script para regenerar eventos de estabilidad con todos los campos
# Llama al endpoint del backend para regenerar eventos

param(
    [switch]$Force
)

Write-Host "Regenerando eventos de estabilidad..." -ForegroundColor Cyan
Write-Host ""

# Verificar que el backend este corriendo
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9998/health" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "Backend detectado en puerto 9998" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: El backend no esta ejecutandose en el puerto 9998" -ForegroundColor Red
    Write-Host "Por favor, inicia el backend primero con: .\iniciar.ps1" -ForegroundColor Yellow
    Write-Host "Detalle: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

Write-Host "ATENCION:" -ForegroundColor Yellow
Write-Host "Este script eliminara TODOS los eventos existentes" -ForegroundColor Yellow
Write-Host "y los regenerara con los campos completos:" -ForegroundColor Yellow
Write-Host "  - speed (velocidad del evento)" -ForegroundColor Cyan
Write-Host "  - rotativoState (estado del rotativo)" -ForegroundColor Cyan
Write-Host "  - keyType (tipo de clave operacional)" -ForegroundColor Cyan
Write-Host "  - interpolatedGPS (si el GPS fue interpolado)" -ForegroundColor Cyan
Write-Host ""

if (-not $Force) {
    $confirmation = Read-Host "Deseas continuar? (S/N)"
    if ($confirmation -ne "S" -and $confirmation -ne "s") {
        Write-Host "Operacion cancelada" -ForegroundColor Red
        exit 0
    }
}
else {
    Write-Host "Modo Force activado - Ejecutando sin confirmacion..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Llamando al endpoint de regeneracion..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://localhost:9998/api/upload/regenerate-all-events" -Method POST -ContentType "application/json" -TimeoutSec 1800

    if ($response.success) {
        Write-Host ""
        Write-Host "Regeneracion completada exitosamente" -ForegroundColor Green
        Write-Host ""
        Write-Host "Resultados:" -ForegroundColor Cyan
        Write-Host "  - Sesiones procesadas: $($response.data.totalSessions)" -ForegroundColor White
        Write-Host "  - Eventos generados: $($response.data.eventsGenerated)" -ForegroundColor White
        Write-Host "  - Segmentos generados: $($response.data.segmentsGenerated)" -ForegroundColor White
        
        $duration = [Math]::Round($response.data.duration / 1000, 2)
        Write-Host "  - Duracion: $duration segundos" -ForegroundColor White
        
        $errorCount = 0
        if ($response.data.errors) {
            $errorCount = $response.data.errors.Count
        }
        
        if ($errorCount -gt 0) {
            Write-Host ""
            Write-Host "Errores encontrados: $errorCount" -ForegroundColor Yellow
            foreach ($error in $response.data.errors) {
                Write-Host "  - $error" -ForegroundColor Yellow
            }
        }
    }
    else {
        Write-Host ""
        Write-Host "Error en la regeneracion" -ForegroundColor Red
        Write-Host "$($response.error)" -ForegroundColor Red
    }
}
catch {
    Write-Host ""
    Write-Host "Error llamando al endpoint:" -ForegroundColor Red
    Write-Host "$($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Proceso completado" -ForegroundColor Green
