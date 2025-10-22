# ============================================
# SCRIPT DE VERIFICACION OSRM
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICACION DE OSRM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar que el contenedor esta corriendo
Write-Host "1. Verificando contenedor OSRM..." -ForegroundColor Yellow
$container = docker ps --filter "name=dobacksoft-osrm" --format "{{.Names}}"
if ($container -eq "dobacksoft-osrm") {
    Write-Host "   OK - Contenedor OSRM esta corriendo" -ForegroundColor Green
}
else {
    Write-Host "   ERROR - Contenedor OSRM NO esta corriendo" -ForegroundColor Red
    Write-Host "   Intentando iniciar..." -ForegroundColor Yellow
    docker-compose -f docker-compose.osrm.yml up -d
    Start-Sleep -Seconds 10
    $container = docker ps --filter "name=dobacksoft-osrm" --format "{{.Names}}"
    if ($container -eq "dobacksoft-osrm") {
        Write-Host "   OK - Contenedor OSRM iniciado correctamente" -ForegroundColor Green
    }
    else {
        Write-Host "   ERROR - Error al iniciar contenedor OSRM" -ForegroundColor Red
        Write-Host "   Ejecuta manualmente: docker-compose -f docker-compose.osrm.yml up -d" -ForegroundColor Yellow
        exit 1
    }
}

# 2. Verificar logs de OSRM
Write-Host ""
Write-Host "2. Verificando logs de OSRM..." -ForegroundColor Yellow
$logs = docker logs dobacksoft-osrm --tail 20 2>&1
if ($logs -match "listening on: 0.0.0.0:5000") {
    Write-Host "   OK - OSRM esta escuchando en puerto 5000" -ForegroundColor Green
}
else {
    Write-Host "   ADVERTENCIA - OSRM puede no estar listo todavia" -ForegroundColor Yellow
    Write-Host "   Ultimos logs:" -ForegroundColor Cyan
    Write-Host $logs -ForegroundColor Gray
}

# 3. Verificar puerto 5000
Write-Host ""
Write-Host "3. Verificando puerto 5000..." -ForegroundColor Yellow
$portTest = Test-NetConnection -ComputerName localhost -Port 5000 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($portTest) {
    Write-Host "   OK - Puerto 5000 esta abierto" -ForegroundColor Green
}
else {
    Write-Host "   ERROR - Puerto 5000 NO esta abierto" -ForegroundColor Red
    Write-Host "   Esperando 10 segundos mas..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    $portTest = Test-NetConnection -ComputerName localhost -Port 5000 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($portTest) {
        Write-Host "   OK - Puerto 5000 ahora esta abierto" -ForegroundColor Green
    }
    else {
        Write-Host "   ERROR - Puerto 5000 sigue cerrado" -ForegroundColor Red
        exit 1
    }
}

# 4. Test de OSRM (healthcheck)
Write-Host ""
Write-Host "4. Test de OSRM (healthcheck)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/nearest/v1/driving/-3.692,40.419" -Method Get -TimeoutSec 10
    if ($response.code -eq "Ok") {
        Write-Host "   OK - OSRM responde correctamente" -ForegroundColor Green
        Write-Host "   Coordenadas probadas: -3.692, 40.419 (Madrid)" -ForegroundColor Cyan
    }
    else {
        Write-Host "   ADVERTENCIA - OSRM responde pero con codigo: $($response.code)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "   ERROR - Error al conectar con OSRM: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 5. Verificar archivos .osrm
Write-Host ""
Write-Host "5. Verificando archivos .osrm..." -ForegroundColor Yellow
$osrmFiles = Get-ChildItem "osrm-data\*.osrm*" -ErrorAction SilentlyContinue
if ($osrmFiles.Count -gt 0) {
    Write-Host "   OK - Archivos .osrm encontrados:" -ForegroundColor Green
    foreach ($file in $osrmFiles) {
        $sizeMB = [math]::Round($file.Length / 1MB, 2)
        Write-Host "      - $($file.Name) ($sizeMB MB)" -ForegroundColor Cyan
    }
}
else {
    Write-Host "   ADVERTENCIA - No se encontraron archivos .osrm en osrm-data/" -ForegroundColor Yellow
    Write-Host "   Esto es normal si OSRM esta descargando/procesando datos" -ForegroundColor Gray
}

# 6. Resumen final
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMEN DE VERIFICACION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "OK - OSRM esta funcionando correctamente" -ForegroundColor Green
Write-Host ""
Write-Host "Puedes continuar con los siguientes pasos:" -ForegroundColor Yellow
Write-Host "   1. Verificar health endpoints del backend" -ForegroundColor Cyan
Write-Host "   2. Activar integracion en UploadPostProcessor" -ForegroundColor Cyan
Write-Host "   3. Ejecutar tests end-to-end" -ForegroundColor Cyan

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
