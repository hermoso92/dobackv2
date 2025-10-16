# Test de TomTom API usando curl (PowerShell)

Write-Host "`n🧪 TEST TOMTOM API - SNAP TO ROADS`n" -ForegroundColor Cyan
Write-Host ("="*80) -ForegroundColor Gray
Write-Host ""

# Cargar API key
$env:TOMTOM_API_KEY = "u8wN3BM4AMzDGGC76lLF14vHblDP37HG"

if (-not $env:TOMTOM_API_KEY -or $env:TOMTOM_API_KEY -eq "your-tomtom-api-key") {
    Write-Host "❌ TomTom API key no configurada" -ForegroundColor Red
    exit 1
}

Write-Host "🔑 API Key: $($env:TOMTOM_API_KEY.Substring(0, 15))..." -ForegroundColor White
Write-Host ""

# Punto de prueba (Madrid centro)
$lat = 40.4168
$lon = -3.7038

Write-Host "📍 Punto de prueba: Madrid Centro ($lat, $lon)" -ForegroundColor White
Write-Host ""

# Llamar a Snap to Roads API
$url = "https://api.tomtom.com/routing/1/snap-to-roads/sync/json?key=$env:TOMTOM_API_KEY"

$body = @{
    points = @(
        @{
            latitude = $lat
            longitude = $lon
        }
    )
} | ConvertTo-Json

Write-Host "🌐 Llamando a TomTom Snap to Roads..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" -TimeoutSec 10
    
    Write-Host "✅ Respuesta recibida`n" -ForegroundColor Green
    
    if ($response.snappedPoints -and $response.snappedPoints.Count -gt 0) {
        $point = $response.snappedPoints[0]
        
        Write-Host "📊 Datos del segmento:" -ForegroundColor Yellow
        Write-Host "   Latitud ajustada: $($point.latitude)"
        Write-Host "   Longitud ajustada: $($point.longitude)"
        
        if ($point.roadProperties) {
            $props = $point.roadProperties
            
            Write-Host "`n📊 Propiedades de la carretera:" -ForegroundColor Yellow
            
            if ($props.speedLimit) {
                Write-Host "   🚦 Límite de velocidad: $($props.speedLimit) km/h" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  Sin límite de velocidad" -ForegroundColor Yellow
            }
            
            if ($props.functionalRoadClass) {
                Write-Host "   🛣️  Tipo de vía: $($props.functionalRoadClass)"
            }
            
            Write-Host ""
            Write-Host "✅ TOMTOM API FUNCIONA CORRECTAMENTE" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Sin propiedades de carretera" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Sin puntos ajustados en respuesta" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host ("="*80) -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

