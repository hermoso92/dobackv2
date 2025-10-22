# ============================================
# TEST END-TO-END GEOPROCESAMIENTO
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST END-TO-END GEOPROCESAMIENTO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar que OSRM esta corriendo
Write-Host "1. Verificando OSRM..." -ForegroundColor Yellow
$osrmRunning = Test-NetConnection -ComputerName localhost -Port 5000 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($osrmRunning) {
    Write-Host "   OK - OSRM esta corriendo" -ForegroundColor Green
}
else {
    Write-Host "   ERROR - OSRM NO esta corriendo" -ForegroundColor Red
    Write-Host "   Ejecuta: docker-compose -f docker-compose.osrm.yml up -d" -ForegroundColor Yellow
    exit 1
}

# 2. Verificar que el backend esta corriendo
Write-Host ""
Write-Host "2. Verificando backend..." -ForegroundColor Yellow
$backendRunning = Test-NetConnection -ComputerName localhost -Port 9998 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($backendRunning) {
    Write-Host "   OK - Backend esta corriendo" -ForegroundColor Green
}
else {
    Write-Host "   ERROR - Backend NO esta corriendo" -ForegroundColor Red
    Write-Host "   Ejecuta: cd backend && npm run dev" -ForegroundColor Yellow
    exit 1
}

# 3. Verificar health endpoint de geoprocesamiento
Write-Host ""
Write-Host "3. Verificando health endpoint de geoprocesamiento..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:9998/api/geoprocessing/health" -Method Get -TimeoutSec 10
    if ($response.status -eq "healthy") {
        Write-Host "   OK - Geoprocesamiento esta saludable" -ForegroundColor Green
        Write-Host "   OSRM: $($response.services.osrm)" -ForegroundColor Cyan
        Write-Host "   PostGIS: $($response.services.postgis)" -ForegroundColor Cyan
    }
    else {
        Write-Host "   ERROR - Geoprocesamiento NO esta saludable" -ForegroundColor Red
        Write-Host "   Status: $($response.status)" -ForegroundColor Cyan
        exit 1
    }
}
catch {
    Write-Host "   ERROR - Error al conectar con el endpoint: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 4. Test de geoprocesamiento con sesion real
Write-Host ""
Write-Host "4. Test de geoprocesamiento con sesion real..." -ForegroundColor Yellow
Write-Host "   Ejecutando script de test de geoprocesamiento..." -ForegroundColor Cyan
Write-Host ""

cd backend
npx ts-node src/scripts/test-geoprocessing.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "   OK - Test de geoprocesamiento completado exitosamente" -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "   ERROR - Test de geoprocesamiento fallo" -ForegroundColor Red
    exit 1
}

cd ..

# 5. Resumen final
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMEN DE TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "OK - Todos los tests pasaron exitosamente" -ForegroundColor Green
Write-Host ""
Write-Host "El sistema esta listo para procesar sesiones:" -ForegroundColor Yellow
Write-Host "   1. OSRM funcionando" -ForegroundColor Cyan
Write-Host "   2. Backend funcionando" -ForegroundColor Cyan
Write-Host "   3. Geoprocesamiento integrado" -ForegroundColor Cyan
Write-Host "   4. Health endpoints saludables" -ForegroundColor Cyan
Write-Host ""

Write-Host "Puedes subir archivos y el geoprocesamiento se ejecutara automaticamente" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

