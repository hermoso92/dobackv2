# ============================================
# SCRIPT DE VERIFICACION BACKEND
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICACION DE BACKEND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar si el backend esta corriendo
Write-Host "1. Verificando si el backend esta corriendo..." -ForegroundColor Yellow
$backendRunning = Test-NetConnection -ComputerName localhost -Port 9998 -InformationLevel Quiet -WarningAction SilentlyContinue

if ($backendRunning) {
    Write-Host "   OK - Backend esta corriendo en puerto 9998" -ForegroundColor Green
}
else {
    Write-Host "   ADVERTENCIA - Backend NO esta corriendo" -ForegroundColor Yellow
    Write-Host "   Por favor, inicia el backend manualmente:" -ForegroundColor Cyan
    Write-Host "   cd backend" -ForegroundColor Gray
    Write-Host "   npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Esperando 30 segundos para que inicies el backend..." -ForegroundColor Yellow
    Write-Host "   (Presiona Ctrl+C si ya esta corriendo)" -ForegroundColor Gray
    Start-Sleep -Seconds 30
}

# 2. Verificar health endpoint basico
Write-Host ""
Write-Host "2. Verificando health endpoint basico..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:9998/api/health" -Method Get -TimeoutSec 10
    if ($response.status -eq "ok") {
        Write-Host "   OK - Backend responde correctamente" -ForegroundColor Green
        Write-Host "   Status: $($response.status)" -ForegroundColor Cyan
        Write-Host "   Timestamp: $($response.ts)" -ForegroundColor Cyan
    }
    else {
        Write-Host "   ADVERTENCIA - Backend responde pero con status: $($response.status)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "   ERROR - Error al conectar con el backend: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Asegurate de que el backend este corriendo en puerto 9998" -ForegroundColor Yellow
    exit 1
}

# 3. Verificar health endpoint de geoprocesamiento
Write-Host ""
Write-Host "3. Verificando health endpoint de geoprocesamiento..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:9998/api/geoprocessing/health" -Method Get -TimeoutSec 10
    if ($response.status -eq "healthy") {
        Write-Host "   OK - Geoprocesamiento esta saludable" -ForegroundColor Green
        Write-Host "   Status: $($response.status)" -ForegroundColor Cyan
        Write-Host "   OSRM: $($response.services.osrm)" -ForegroundColor Cyan
        Write-Host "   PostGIS: $($response.services.postgis)" -ForegroundColor Cyan
    }
    elseif ($response.status -eq "degraded") {
        Write-Host "   ADVERTENCIA - Geoprocesamiento esta degradado" -ForegroundColor Yellow
        Write-Host "   Status: $($response.status)" -ForegroundColor Cyan
        Write-Host "   OSRM: $($response.services.osrm)" -ForegroundColor Cyan
        Write-Host "   PostGIS: $($response.services.postgis)" -ForegroundColor Cyan
        if ($response.services.osrm -ne "healthy") {
            Write-Host "   OSRM no esta saludable - verifica que el contenedor este corriendo" -ForegroundColor Red
        }
        if ($response.services.postgis -ne "healthy") {
            Write-Host "   PostGIS no esta saludable - verifica la conexion a la base de datos" -ForegroundColor Red
        }
    }
    else {
        Write-Host "   ERROR - Geoprocesamiento no esta saludable" -ForegroundColor Red
        Write-Host "   Status: $($response.status)" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "   ERROR - Error al conectar con el endpoint de geoprocesamiento: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 4. Resumen final
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMEN DE VERIFICACION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "OK - Backend esta funcionando correctamente" -ForegroundColor Green
Write-Host ""
Write-Host "Puedes continuar con los siguientes pasos:" -ForegroundColor Yellow
Write-Host "   1. Activar integracion en UploadPostProcessor" -ForegroundColor Cyan
Write-Host "   2. Ejecutar tests end-to-end" -ForegroundColor Cyan
Write-Host "   3. Subir archivo de prueba" -ForegroundColor Cyan

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

