# Script para generar eventos de estabilidad para todas las sesiones
# Usa el endpoint /api/generate-events

Write-Host "=== Generador de Eventos de Estabilidad ===" -ForegroundColor Cyan
Write-Host ""

# URL del backend
$baseUrl = "http://localhost:9998"

# Primero necesitas obtener el token de autenticación
Write-Host "INSTRUCCIONES:" -ForegroundColor Yellow
Write-Host "1. Abre las DevTools del navegador (F12)"
Write-Host "2. Ve a la pestaña 'Application' > 'Cookies'"
Write-Host "3. Copia el valor del cookie 'token'"
Write-Host "4. Pégalo aquí cuando se solicite"
Write-Host ""

# Solicitar token
$token = Read-Host "Pega tu token de autenticación"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "❌ Token no proporcionado. Abortando." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔄 Iniciando generación de eventos..." -ForegroundColor Green
Write-Host ""

try {
    # Preparar headers
    $headers = @{
        "Content-Type" = "application/json"
        "Cookie"       = "token=$token"
    }

    # Preparar body
    $body = @{
        regenerate = $false
    } | ConvertTo-Json

    # Hacer request
    $response = Invoke-RestMethod -Uri "$baseUrl/api/generate-events" -Method Post -Headers $headers -Body $body -ContentType "application/json"

    # Mostrar resultados
    Write-Host "✅ Generación completada:" -ForegroundColor Green
    Write-Host ""
    Write-Host "  📊 Sesiones procesadas: $($response.sesionesProcesadas)" -ForegroundColor Cyan
    Write-Host "  🎯 Eventos generados: $($response.totalEventosGenerados)" -ForegroundColor Cyan
    Write-Host "  💾 Total en BD: $($response.totalEventosBD)" -ForegroundColor Cyan
    Write-Host ""
    
    if ($response.resultados) {
        $procesadas = ($response.resultados | Where-Object { $_.status -eq 'processed' }).Count
        $saltadas = ($response.resultados | Where-Object { $_.status -eq 'skipped' }).Count
        $errores = ($response.resultados | Where-Object { $_.status -eq 'error' }).Count

        Write-Host "  Detalle:" -ForegroundColor Yellow
        Write-Host "    - Procesadas: $procesadas" -ForegroundColor White
        Write-Host "    - Saltadas (ya tenían eventos): $saltadas" -ForegroundColor Gray
        Write-Host "    - Errores: $errores" -ForegroundColor $(if ($errores -gt 0) { "Red" } else { "White" })
        Write-Host ""
    }

    Write-Host "🎉 ¡Listo! Ahora deberías ver puntos negros en el mapa." -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Recarga la página del dashboard para ver los cambios." -ForegroundColor Yellow

}
catch {
    Write-Host "❌ Error durante la generación:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Detalles técnicos:" -ForegroundColor Gray
    Write-Host $_ -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "Presiona Enter para salir..."
Read-Host

