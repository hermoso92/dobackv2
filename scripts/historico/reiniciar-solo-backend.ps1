# Script para reiniciar SOLO el backend sin tocar el frontend
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  REINICIANDO SOLO BACKEND - DOBACK SOFT" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Liberar puerto 9998
Write-Host "`nLiberando puerto 9998..." -ForegroundColor Yellow
$port9998 = Get-NetTCPConnection -LocalPort 9998 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($port9998) {
    foreach ($pid in $port9998) {
        Write-Host "Deteniendo proceso PID: $pid" -ForegroundColor Yellow
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Puerto 9998 liberado" -ForegroundColor Green
}
else {
    Write-Host "Puerto 9998 ya estaba libre" -ForegroundColor Green
}

Start-Sleep -Seconds 2

# Iniciar backend
Write-Host "`nIniciando Backend en puerto 9998..." -ForegroundColor Cyan
Set-Location backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
Set-Location ..

Write-Host "`nEsperando a que el backend esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verificar que el backend está funcionando
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9998/api/auth/test-simple" -UseBasicParsing -ErrorAction Stop
    Write-Host "`n✅ Backend funcionando correctamente!" -ForegroundColor Green
    Write-Host "Puerto: 9998" -ForegroundColor White
}
catch {
    Write-Host "`n⚠️  Advertencia: El backend puede tardar unos segundos más en iniciar" -ForegroundColor Yellow
    Write-Host "Verifica manualmente: http://localhost:9998/api/auth/test-simple" -ForegroundColor White
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "✅ Backend reiniciado" -ForegroundColor Green
Write-Host "Frontend sigue corriendo en: http://localhost:5174" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "`n💡 Ahora puedes crear usuarios desde: http://localhost:5174/login" -ForegroundColor Yellow
Write-Host "`nPresiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

