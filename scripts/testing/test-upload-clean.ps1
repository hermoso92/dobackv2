#!/usr/bin/env pwsh
# Script para limpiar BD y subir archivos de prueba

Write-Host "🧹 LIMPIEZA Y SUBIDA DE ARCHIVOS DE PRUEBA" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que el backend esté funcionando
Write-Host "🔍 Verificando backend..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:9998/health" -Method Get -ErrorAction Stop
    Write-Host "✅ Backend funcionando correctamente" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error: Backend no está funcionando" -ForegroundColor Red
    Write-Host "   Por favor, inicia el backend primero con: node backend-final.js" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🧹 Paso 1: Limpiando base de datos..." -ForegroundColor Yellow

try {
    $cleanResult = Invoke-RestMethod -Uri "http://localhost:9998/api/clean-all-sessions" -Method Post -ErrorAction Stop
    
    if ($cleanResult.success) {
        Write-Host "✅ Base de datos limpiada:" -ForegroundColor Green
        Write-Host "   - Sesiones eliminadas: $($cleanResult.data.deletedSessions)" -ForegroundColor Gray
        Write-Host "   - Mediciones GPS eliminadas: $($cleanResult.data.deletedGps)" -ForegroundColor Gray
        Write-Host "   - Mediciones estabilidad eliminadas: $($cleanResult.data.deletedStability)" -ForegroundColor Gray
        Write-Host "   - Mediciones rotativo eliminadas: $($cleanResult.data.deletedRotativo)" -ForegroundColor Gray
        Write-Host "   - Mediciones CAN eliminadas: $($cleanResult.data.deletedCan)" -ForegroundColor Gray
    }
    else {
        Write-Host "❌ Error limpiando base de datos: $($cleanResult.error)" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Error al conectar con el endpoint de limpieza" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📁 Paso 2: Verificando archivos en 'backend\data\CMadrid\Nueva carpeta'..." -ForegroundColor Yellow

$dataDir = "backend\data\CMadrid\Nueva carpeta"
if (Test-Path $dataDir) {
    $files = Get-ChildItem -Path $dataDir -Filter "*.txt"
    Write-Host "✅ Encontrados $($files.Count) archivos:" -ForegroundColor Green
    foreach ($file in $files) {
        Write-Host "   - $($file.Name)" -ForegroundColor Gray
    }
}
else {
    Write-Host "❌ No se encontró el directorio: $dataDir" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📤 Paso 3: Preparando archivos para subida..." -ForegroundColor Yellow

# Crear FormData para subida múltiple
$files = Get-ChildItem -Path $dataDir -Filter "*.txt"
$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"

$bodyLines = @()

foreach ($file in $files) {
    $bodyLines += "--$boundary"
    $bodyLines += "Content-Disposition: form-data; name=`"files`"; filename=`"$($file.Name)`""
    $bodyLines += "Content-Type: text/plain"
    $bodyLines += ""
    $bodyLines += [System.IO.File]::ReadAllText($file.FullName)
}

$bodyLines += "--$boundary--"
$body = $bodyLines -join $LF

Write-Host "✅ Archivos preparados para subida" -ForegroundColor Green

Write-Host ""
Write-Host "📤 Paso 4: Subiendo archivos al backend..." -ForegroundColor Yellow

try {
    $headers = @{
        "Content-Type" = "multipart/form-data; boundary=$boundary"
    }
    
    $uploadResult = Invoke-RestMethod -Uri "http://localhost:9998/api/upload/multiple" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -TimeoutSec 120 `
        -ErrorAction Stop
    
    if ($uploadResult.success) {
        Write-Host "✅ Archivos subidos y procesados correctamente:" -ForegroundColor Green
        Write-Host "   - Sesiones creadas: $($uploadResult.sessionsCreated)" -ForegroundColor Gray
        Write-Host "   - Total de mediciones: $($uploadResult.totalMeasurements)" -ForegroundColor Gray
    }
    else {
        Write-Host "❌ Error en la subida: $($uploadResult.message)" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Error al subir archivos" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ PROCESO COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Recarga la página del frontend (F5)" -ForegroundColor Gray
Write-Host "   2. Selecciona el vehículo DOBACK024" -ForegroundColor Gray
Write-Host "   3. Selecciona una sesión" -ForegroundColor Gray
Write-Host "   4. El mapa debería mostrar la ruta con datos GPS reales" -ForegroundColor Gray
Write-Host ""

