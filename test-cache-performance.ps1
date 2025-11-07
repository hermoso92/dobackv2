# 🚀 TEST DE RENDIMIENTO - CACHE vs NO CACHE
# Script para medir la mejora de rendimiento con Redis

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST DE RENDIMIENTO - REDIS CACHÉ" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuración
$backendUrl = "http://localhost:9998"
$endpoint = "/api/kpis/summary"
$authToken = $env:AUTH_TOKEN

if (-not $authToken) {
    Write-Host "⚠️  Variable AUTH_TOKEN no encontrada" -ForegroundColor Yellow
    Write-Host "   Ejecuta primero: `$env:AUTH_TOKEN = 'tu_token_aqui'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   O haz login:" -ForegroundColor Gray
    Write-Host "   curl -X POST http://localhost:9998/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@dobacksoft.com\",\"password\":\"Admin123!\"}'" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "[1] Verificando conectividad con backend..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$backendUrl/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Backend disponible (Status: $($health.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Backend no disponible" -ForegroundColor Red
    Write-Host "   Asegúrate de que el backend esté corriendo en puerto 9998" -ForegroundColor Gray
    exit 1
}
Write-Host ""

Write-Host "[2] Verificando Redis..." -ForegroundColor Yellow
try {
    $redisHealth = Invoke-WebRequest -Uri "$backendUrl/api/cache/ping" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    $redisResponse = $redisHealth.Content | ConvertFrom-Json
    if ($redisResponse.connected) {
        Write-Host "   ✅ Redis conectado" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Redis no conectado (test continuará sin caché)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  No se pudo verificar Redis" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "[3] Limpiando caché para test limpio..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "$backendUrl/api/cache/clear" `
        -Method DELETE `
        -Headers @{ "Authorization" = "Bearer $authToken" } `
        -UseBasicParsing `
        -TimeoutSec 5 `
        -ErrorAction SilentlyContinue | Out-Null
    Write-Host "   ✅ Caché limpiado" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  No se pudo limpiar caché (continuando)" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PRUEBA 1: Primera llamada (CACHE MISS)" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$startTime1 = Get-Date
try {
    $response1 = Invoke-WebRequest -Uri "$backendUrl$endpoint" `
        -Headers @{ "Authorization" = "Bearer $authToken" } `
        -UseBasicParsing `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    $endTime1 = Get-Date
    $duration1 = ($endTime1 - $startTime1).TotalMilliseconds
    
    $cacheHeader1 = $response1.Headers['X-Cache']
    
    Write-Host "✅ Respuesta recibida" -ForegroundColor Green
    Write-Host "   Status: $($response1.StatusCode)" -ForegroundColor Gray
    Write-Host "   Tamaño: $($response1.Content.Length) bytes" -ForegroundColor Gray
    Write-Host "   Cache: $cacheHeader1" -ForegroundColor $(if ($cacheHeader1 -eq 'MISS') { 'Yellow' } else { 'Green' })
    Write-Host "   ⏱️  Duración: $([math]::Round($duration1, 0)) ms" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Error en la primera llamada: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "Esperando 1 segundo..." -ForegroundColor Gray
Start-Sleep -Seconds 1
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PRUEBA 2: Segunda llamada (CACHE HIT)" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$startTime2 = Get-Date
try {
    $response2 = Invoke-WebRequest -Uri "$backendUrl$endpoint" `
        -Headers @{ "Authorization" = "Bearer $authToken" } `
        -UseBasicParsing `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    $endTime2 = Get-Date
    $duration2 = ($endTime2 - $startTime2).TotalMilliseconds
    
    $cacheHeader2 = $response2.Headers['X-Cache']
    
    Write-Host "✅ Respuesta recibida" -ForegroundColor Green
    Write-Host "   Status: $($response2.StatusCode)" -ForegroundColor Gray
    Write-Host "   Tamaño: $($response2.Content.Length) bytes" -ForegroundColor Gray
    Write-Host "   Cache: $cacheHeader2" -ForegroundColor $(if ($cacheHeader2 -eq 'HIT') { 'Green' } else { 'Yellow' })
    Write-Host "   ⏱️  Duración: $([math]::Round($duration2, 0)) ms" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Error en la segunda llamada: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  RESULTADOS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$improvement = [math]::Round((($duration1 - $duration2) / $duration1) * 100, 1)
$speedup = [math]::Round($duration1 / $duration2, 1)

Write-Host "Primera llamada (sin caché):  $([math]::Round($duration1, 0)) ms" -ForegroundColor White
Write-Host "Segunda llamada (con caché):  $([math]::Round($duration2, 0)) ms" -ForegroundColor White
Write-Host ""
Write-Host "Mejora de rendimiento:  $improvement%" -ForegroundColor Cyan
Write-Host "Aceleración:            ${speedup}x más rápido" -ForegroundColor Cyan
Write-Host ""

if ($improvement -gt 50) {
    Write-Host "🎉 ¡EXCELENTE! Mejora significativa con caché" -ForegroundColor Green
} elseif ($improvement -gt 20) {
    Write-Host "✅ Buena mejora con caché" -ForegroundColor Green
} else {
    Write-Host "⚠️  Mejora limitada - verificar configuración" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ESTADÍSTICAS DE REDIS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    $stats = Invoke-WebRequest -Uri "$backendUrl/api/cache/stats" `
        -Headers @{ "Authorization" = "Bearer $authToken" } `
        -UseBasicParsing `
        -TimeoutSec 5 `
        -ErrorAction Stop
    
    $statsData = $stats.Content | ConvertFrom-Json
    
    Write-Host "Conectado:     $($statsData.data.connected)" -ForegroundColor Gray
    Write-Host "Claves:        $($statsData.data.dbSize)" -ForegroundColor Gray
    Write-Host "Memoria:       $($statsData.data.usedMemory)" -ForegroundColor Gray
    Write-Host "Hit Rate:      $($statsData.data.hitRate)" -ForegroundColor Cyan
    
} catch {
    Write-Host "⚠️  No se pudieron obtener estadísticas de Redis" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PRÓXIMOS PASOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Ver claves en Redis Commander:" -ForegroundColor White
Write-Host "   http://localhost:8081" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Ver logs de caché:" -ForegroundColor White
Write-Host "   tail -f backend/logs/app.log | Select-String 'Cache'" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Aplicar caché a más endpoints:" -ForegroundColor White
Write-Host "   - /api/dashboard/stats" -ForegroundColor Gray
Write-Host "   - /api/vehicles" -ForegroundColor Gray
Write-Host "   - /api/dashboard/vehicles" -ForegroundColor Gray
Write-Host ""

Write-Host "¡Test completado! 🚀" -ForegroundColor Green
Write-Host ""

