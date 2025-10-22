# Script para procesar automaticamente todos los archivos de CMadrid

Write-Host "PROCESAMIENTO AUTOMATICO DE ARCHIVOS CMADRID" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que el backend este funcionando
Write-Host "Verificando backend..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:9998/health" -Method Get -ErrorAction Stop
    Write-Host "Backend funcionando correctamente" -ForegroundColor Green
}
catch {
    Write-Host "Error: Backend no esta funcionando" -ForegroundColor Red
    Write-Host "   Por favor, inicia el backend primero con: iniciar.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Iniciando procesamiento automatico de archivos CMadrid..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   Este proceso puede tardar varios minutos..." -ForegroundColor Gray
Write-Host "   Se procesaran archivos de:" -ForegroundColor Gray
Write-Host "   - ESTABILIDAD" -ForegroundColor Gray
Write-Host "   - GPS" -ForegroundColor Gray
Write-Host "   - ROTATIVO" -ForegroundColor Gray
Write-Host ""

try {
    # Llamar al endpoint de procesamiento automatico
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    # Usar el token de autenticacion si esta disponible
    $token = $env:DOBACK_TOKEN
    if ($token) {
        $headers["Authorization"] = "Bearer $token"
    }
    
    $result = Invoke-RestMethod -Uri "http://localhost:9998/api/upload/process-all-cmadrid" `
        -Method Post `
        -Headers $headers `
        -TimeoutSec 600 `
        -ErrorAction Stop
    
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "PROCESAMIENTO COMPLETADO EXITOSAMENTE" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    
    if ($result.success) {
        Write-Host "Resumen del procesamiento:" -ForegroundColor Cyan
        Write-Host "   - Sesiones creadas: $($result.data.totalSessions)" -ForegroundColor Gray
        Write-Host "   - Vehiculos procesados: $($result.data.vehiclesProcessed)" -ForegroundColor Gray
        Write-Host "   - Archivos procesados: $($result.data.filesProcessed)" -ForegroundColor Gray
        Write-Host "   - Errores: $($result.data.errors)" -ForegroundColor Gray
        Write-Host ""
        
        if ($result.data.vehicleResults) {
            Write-Host "Detalle por vehiculo:" -ForegroundColor Cyan
            foreach ($vehicle in $result.data.vehicleResults) {
                Write-Host "   - $($vehicle.vehicle): $($vehicle.sessions) sesiones" -ForegroundColor Gray
            }
        }
    }
    else {
        Write-Host "Procesamiento completado con advertencias:" -ForegroundColor Yellow
        Write-Host "   $($result.message)" -ForegroundColor Gray
    }
}
catch {
    Write-Host ""
    Write-Host "Error al procesar archivos:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Detalles del error:" -ForegroundColor Yellow
    Write-Host $_.Exception.ToString() -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Recarga la pagina del frontend (F5)" -ForegroundColor Gray
Write-Host "   2. Los datos deberian aparecer en el dashboard" -ForegroundColor Gray
Write-Host "   3. Selecciona un vehiculo y una sesion" -ForegroundColor Gray
Write-Host "   4. Verifica que los KPIs y graficas se muestren correctamente" -ForegroundColor Gray
Write-Host ""


Write-Host "PROCESAMIENTO AUTOMATICO DE ARCHIVOS CMADRID" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que el backend este funcionando
Write-Host "Verificando backend..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:9998/health" -Method Get -ErrorAction Stop
    Write-Host "Backend funcionando correctamente" -ForegroundColor Green
}
catch {
    Write-Host "Error: Backend no esta funcionando" -ForegroundColor Red
    Write-Host "   Por favor, inicia el backend primero con: iniciar.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Iniciando procesamiento automatico de archivos CMadrid..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   Este proceso puede tardar varios minutos..." -ForegroundColor Gray
Write-Host "   Se procesaran archivos de:" -ForegroundColor Gray
Write-Host "   - ESTABILIDAD" -ForegroundColor Gray
Write-Host "   - GPS" -ForegroundColor Gray
Write-Host "   - ROTATIVO" -ForegroundColor Gray
Write-Host ""

try {
    # Hacer login primero para obtener el token
    Write-Host "Obteniendo token de autenticacion..." -ForegroundColor Yellow
    
    $loginBody = @{
        email    = "antoniohermoso92@gmail.com"
        password = "password123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:9998/api/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    $token = $loginResponse.token
    Write-Host "Token obtenido exitosamente" -ForegroundColor Green
    Write-Host ""
    
    # Llamar al endpoint de procesamiento automatico
    $headers = @{
        "Content-Type"  = "application/json"
        "Authorization" = "Bearer $token"
    }
    
    $result = Invoke-RestMethod -Uri "http://localhost:9998/api/upload/process-all-cmadrid" `
        -Method Post `
        -Headers $headers `
        -TimeoutSec 600 `
        -ErrorAction Stop
    
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "PROCESAMIENTO COMPLETADO EXITOSAMENTE" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    
    if ($result.success) {
        Write-Host "Resumen del procesamiento:" -ForegroundColor Cyan
        Write-Host "   - Sesiones creadas: $($result.data.totalSessions)" -ForegroundColor Gray
        Write-Host "   - Vehiculos procesados: $($result.data.vehiclesProcessed)" -ForegroundColor Gray
        Write-Host "   - Archivos procesados: $($result.data.filesProcessed)" -ForegroundColor Gray
        Write-Host "   - Errores: $($result.data.errors)" -ForegroundColor Gray
        Write-Host ""
        
        if ($result.data.vehicleResults) {
            Write-Host "Detalle por vehiculo:" -ForegroundColor Cyan
            foreach ($vehicle in $result.data.vehicleResults) {
                Write-Host "   - $($vehicle.vehicle): $($vehicle.sessions) sesiones" -ForegroundColor Gray
            }
        }
    }
    else {
        Write-Host "Procesamiento completado con advertencias:" -ForegroundColor Yellow
        Write-Host "   $($result.message)" -ForegroundColor Gray
    }
}
catch {
    Write-Host ""
    Write-Host "Error al procesar archivos:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Detalles del error:" -ForegroundColor Yellow
    Write-Host $_.Exception.ToString() -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Recarga la pagina del frontend (F5)" -ForegroundColor Gray
Write-Host "   2. Los datos deberian aparecer en el dashboard" -ForegroundColor Gray
Write-Host "   3. Selecciona un vehiculo y una sesion" -ForegroundColor Gray
Write-Host "   4. Verifica que los KPIs y graficas se muestren correctamente" -ForegroundColor Gray
Write-Host ""

