# Script para forzar reinicio del backend limpiando caché
Write-Host "🔄 Forzando reinicio del backend..." -ForegroundColor Cyan

# Detener todos los procesos node en puerto 9998
Write-Host "`n1. Deteniendo procesos en puerto 9998..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort 9998 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processes) {
    foreach ($pid in $processes) {
        Write-Host "   Deteniendo PID: $pid" -ForegroundColor Yellow
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

# Limpiar caché de ts-node-dev
Write-Host "`n2. Limpiando caché de ts-node-dev..." -ForegroundColor Yellow
if (Test-Path "backend/.ts-node") {
    Remove-Item -Path "backend/.ts-node" -Recurse -Force
    Write-Host "   ✅ Caché .ts-node eliminada" -ForegroundColor Green
}
if (Test-Path "backend/node_modules/.cache") {
    Remove-Item -Path "backend/node_modules/.cache" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ Caché node_modules eliminada" -ForegroundColor Green
}

# Limpiar dist si existe
Write-Host "`n3. Limpiando archivos compilados..." -ForegroundColor Yellow
if (Test-Path "backend/dist") {
    Remove-Item -Path "backend/dist" -Recurse -Force
    Write-Host "   ✅ Directorio dist eliminado" -ForegroundColor Green
}

Write-Host "`n4. Iniciando backend..." -ForegroundColor Cyan
Set-Location backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
Set-Location ..

Write-Host "`n⏳ Esperando 10 segundos a que el backend inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar que el backend está funcionando
Write-Host "`n5. Verificando backend..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:9998/api/auth/test-simple" -Method GET
    Write-Host "`n✅ BACKEND FUNCIONANDO!" -ForegroundColor Green
    Write-Host "Status: $($response.status)" -ForegroundColor White
    Write-Host "Message: $($response.message)" -ForegroundColor White
    if ($response.routes) {
        Write-Host "`nRutas disponibles:" -ForegroundColor Cyan
        $response.routes.PSObject.Properties | ForEach-Object {
            Write-Host "  - $($_.Value)" -ForegroundColor White
        }
    }
}
catch {
    Write-Host "`n⚠️  El backend aún está iniciando..." -ForegroundColor Yellow
    Write-Host "Espera 30 segundos y verifica manualmente:" -ForegroundColor White
    Write-Host "http://localhost:9998/api/auth/test-simple" -ForegroundColor White
}

Write-Host "`n6. Probando endpoint de registro..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

try {
    $body = @{
        username  = "testuser"
        email     = "test@test.com"
        password  = "password123"
        firstName = "Test"
        lastName  = "User"
        role      = "ADMIN"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:9998/api/auth/register" -Method POST -ContentType "application/json" -Body $body
    Write-Host "`n✅ ENDPOINT /register FUNCIONANDO!" -ForegroundColor Green
    Write-Host "Usuario creado: $($response.user.name)" -ForegroundColor White
}
catch {
    Write-Host "`n⚠️  Endpoint /register no responde aún" -ForegroundColor Yellow
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "`n💡 Verifica en la ventana del backend si hay errores de compilación" -ForegroundColor Yellow
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "✅ Proceso completado" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "`nPrueba crear un usuario desde: http://localhost:5174/login" -ForegroundColor Yellow
Write-Host "`nPresiona cualquier tecla para cerrar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

