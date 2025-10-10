# Decodificador CAN - Organización CMadrid
# Script PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Decodificador CAN - Organización CMadrid" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
$decoderPath = "data\DECODIFICADOR CAN\decodificador_can_unificado.py"
$cmadridPath = "data\datosDoback\CMadrid"

if (-not (Test-Path $decoderPath)) {
    Write-Host "ERROR: No se encuentra el decodificador CAN" -ForegroundColor Red
    Write-Host "Asegúrate de ejecutar este script desde la carpeta backend" -ForegroundColor Red
    Read-Host "Presiona Enter para continuar"
    exit 1
}

if (-not (Test-Path $cmadridPath)) {
    Write-Host "ERROR: No se encuentra la carpeta de datos CMadrid" -ForegroundColor Red
    Read-Host "Presiona Enter para continuar"
    exit 1
}

Write-Host "Decodificador encontrado: $decoderPath" -ForegroundColor Green
Write-Host "Datos CMadrid encontrados: $cmadridPath" -ForegroundColor Green
Write-Host ""

# Cambiar al directorio del decodificador
Set-Location "data\DECODIFICADOR CAN"

# Ejecutar el decodificador
Write-Host "Ejecutando decodificador..." -ForegroundColor Yellow
try {
    python decodificador_can_unificado.py
    Write-Host "Proceso completado exitosamente" -ForegroundColor Green
}
catch {
    Write-Host "Error al ejecutar el decodificador: $_" -ForegroundColor Red
}

Write-Host ""
Read-Host "Presiona Enter para continuar" 