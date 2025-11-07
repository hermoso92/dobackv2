# Test directo de cache Redis (sin autenticacion)

Write-Host ""
Write-Host "=== PRUEBA DIRECTA DE REDIS CACHE ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar que backend esta corriendo
Write-Host "[1] Verificando backend..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:9998/health" -TimeoutSec 5
    Write-Host "   OK - Backend activo" -ForegroundColor Green
} catch {
    Write-Host "   ERROR - Backend no disponible" -ForegroundColor Red
    Write-Host "   Inicia el backend con: .\iniciar.ps1" -ForegroundColor Gray
    exit 1
}
Write-Host ""

# 2. Verificar Redis
Write-Host "[2] Verificando Redis..." -ForegroundColor Yellow
try {
    $redis = Invoke-RestMethod -Uri "http://localhost:9998/api/cache/ping" -TimeoutSec 5
    if ($redis.connected) {
        Write-Host "   OK - Redis conectado" -ForegroundColor Green
    } else {
        Write-Host "   ERROR - Redis no conectado" -ForegroundColor Red
        Write-Host "   Inicia Redis con: docker-compose -f docker-compose.redis.yml up -d" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "   ERROR - Endpoint de cache no disponible" -ForegroundColor Red
    Write-Host "   Verifica que las rutas de cache esten agregadas" -ForegroundColor Gray
    exit 1
}
Write-Host ""

# 3. Prueba con endpoint publico (health)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST: Endpoint /health" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Primera llamada..." -ForegroundColor Gray
$start1 = Get-Date
$r1 = Invoke-WebRequest -Uri "http://localhost:9998/health" -UseBasicParsing
$end1 = Get-Date
$time1 = [math]::Round(($end1 - $start1).TotalMilliseconds, 0)

Write-Host "Segunda llamada..." -ForegroundColor Gray
$start2 = Get-Date
$r2 = Invoke-WebRequest -Uri "http://localhost:9998/health" -UseBasicParsing
$end2 = Get-Date
$time2 = [math]::Round(($end2 - $start2).TotalMilliseconds, 0)

Write-Host ""
Write-Host "Resultado:" -ForegroundColor White
Write-Host "  Primera:  $time1 ms" -ForegroundColor Cyan
Write-Host "  Segunda:  $time2 ms" -ForegroundColor Cyan
Write-Host ""

# 4. Estadisticas de Redis
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ESTADISTICAS DE REDIS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    $stats = Invoke-RestMethod -Uri "http://localhost:9998/api/cache/health"
    
    Write-Host "Estado:       Conectado" -ForegroundColor Green
    Write-Host "DBSize:       $($stats.redis.dbSize) claves" -ForegroundColor Gray
    Write-Host "Memoria:      $($stats.redis.usedMemory)" -ForegroundColor Gray
    Write-Host "Hit Rate:     $($stats.redis.hitRate)" -ForegroundColor Cyan
    
} catch {
    Write-Host "No se pudieron obtener estadisticas" -ForegroundColor Yellow
}
Write-Host ""

# 5. Verificar claves en Redis
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CLAVES EN REDIS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    $keys = docker exec dobacksoft-redis redis-cli KEYS '*'
    
    if ($keys) {
        Write-Host "Claves encontradas:" -ForegroundColor White
        $keys | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
    } else {
        Write-Host "No hay claves en cache todavia" -ForegroundColor Gray
    }
} catch {
    Write-Host "No se pudieron listar claves" -ForegroundColor Yellow
}
Write-Host ""

# 6. Info de Redis Commander
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  REDIS COMMANDER (UI)" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URL: http://localhost:8081" -ForegroundColor Cyan
Write-Host ""
Write-Host "Desde ahi puedes:" -ForegroundColor White
Write-Host "  - Ver todas las claves en tiempo real" -ForegroundColor Gray
Write-Host "  - Inspeccionar contenido JSON" -ForegroundColor Gray
Write-Host "  - Ver TTL restante" -ForegroundColor Gray
Write-Host "  - Eliminar claves manualmente" -ForegroundColor Gray
Write-Host ""

Write-Host "Test completado!" -ForegroundColor Green
Write-Host ""

