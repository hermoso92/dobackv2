# Test simple de cache
Write-Host ""
Write-Host "=== PRUEBA DE CACHE REDIS ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Redis
Write-Host "[1] Verificando Redis..." -ForegroundColor Yellow
try {
    $redis = Invoke-RestMethod -Uri "http://localhost:9998/api/cache/ping" -TimeoutSec 5
    if ($redis.connected) {
        Write-Host "   OK - Redis conectado" -ForegroundColor Green
    } else {
        Write-Host "   ERROR - Redis no conectado" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ERROR - No se pudo verificar Redis" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. Hacer login
Write-Host "[2] Haciendo login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin@dobacksoft.com"
        password = "Admin123!"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod `
        -Uri "http://localhost:9998/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -TimeoutSec 10
    
    $token = $loginResponse.token
    
    if ($token) {
        Write-Host "   OK - Login exitoso" -ForegroundColor Green
        Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    } else {
        Write-Host "   ERROR - No se obtuvo token" -ForegroundColor Red
        Write-Host "   Respuesta: $loginResponse" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "   ERROR - Login fallido: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 3. Test de rendimiento
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PRUEBA 1: Sin cache (primera llamada)" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $token"
}

$start1 = Get-Date
try {
    $response1 = Invoke-WebRequest `
        -Uri "http://localhost:9998/api/kpis/summary" `
        -Headers $headers `
        -UseBasicParsing `
        -TimeoutSec 30
    
    $end1 = Get-Date
    $time1 = [math]::Round(($end1 - $start1).TotalMilliseconds, 0)
    $cache1 = $response1.Headers['X-Cache']
    
    Write-Host "Status:   $($response1.StatusCode)" -ForegroundColor Gray
    Write-Host "Tamano:   $($response1.Content.Length) bytes" -ForegroundColor Gray
    Write-Host "Cache:    $cache1" -ForegroundColor Yellow
    Write-Host "Tiempo:   $time1 ms" -ForegroundColor Cyan
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "Esperando 1 segundo..." -ForegroundColor Gray
Start-Sleep -Seconds 1
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PRUEBA 2: Con cache (segunda llamada)" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$start2 = Get-Date
try {
    $response2 = Invoke-WebRequest `
        -Uri "http://localhost:9998/api/kpis/summary" `
        -Headers $headers `
        -UseBasicParsing `
        -TimeoutSec 30
    
    $end2 = Get-Date
    $time2 = [math]::Round(($end2 - $start2).TotalMilliseconds, 0)
    $cache2 = $response2.Headers['X-Cache']
    
    Write-Host "Status:   $($response2.StatusCode)" -ForegroundColor Gray
    Write-Host "Tamano:   $($response2.Content.Length) bytes" -ForegroundColor Gray
    Write-Host "Cache:    $cache2" -ForegroundColor Green
    Write-Host "Tiempo:   $time2 ms" -ForegroundColor Cyan
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  RESULTADOS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

if ($time1 -gt 0) {
    $mejora = [math]::Round((($time1 - $time2) / $time1) * 100, 1)
    $speedup = [math]::Round($time1 / $time2, 1)
    
    Write-Host "Sin cache:  $time1 ms" -ForegroundColor White
    Write-Host "Con cache:  $time2 ms" -ForegroundColor White
    Write-Host ""
    Write-Host "Mejora:     $mejora%" -ForegroundColor Cyan
    Write-Host "Speedup:    ${speedup}x mas rapido" -ForegroundColor Cyan
    Write-Host ""
    
    if ($mejora -gt 50) {
        Write-Host "EXCELENTE! Mejora significativa" -ForegroundColor Green
    } elseif ($mejora -gt 20) {
        Write-Host "BUENO - Mejora notable" -ForegroundColor Green
    } else {
        Write-Host "LIMITADO - Verificar configuracion" -ForegroundColor Yellow
    }
}
Write-Host ""

# 4. Estadísticas de Redis
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ESTADISTICAS DE REDIS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    $stats = Invoke-RestMethod `
        -Uri "http://localhost:9998/api/cache/stats" `
        -Headers $headers `
        -TimeoutSec 5
    
    Write-Host "Conectado:    $($stats.data.connected)" -ForegroundColor Gray
    Write-Host "Claves:       $($stats.data.dbSize)" -ForegroundColor Gray
    Write-Host "Memoria:      $($stats.data.usedMemory)" -ForegroundColor Gray
    Write-Host "Hit Rate:     $($stats.data.hitRate)" -ForegroundColor Cyan
    
} catch {
    Write-Host "No se pudieron obtener estadisticas" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Redis Commander: http://localhost:8081" -ForegroundColor Cyan
Write-Host ""

