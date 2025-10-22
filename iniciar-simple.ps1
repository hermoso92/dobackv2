# DOBACKSOFT - Inicio Simple y Directo
# ======================================

Write-Host "`n========== INICIANDO DOBACKSOFT ==========`n" -ForegroundColor Cyan

# 1. Limpiar procesos anteriores
Write-Host "[1/4] Limpiando procesos..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Write-Host "OK`n" -ForegroundColor Green

# 2. Iniciar Backend
Write-Host "[2/4] Iniciando Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Cosigein SL\Desktop\DobackSoft\backend'; `$env:PORT='9998'; `$env:DATABASE_URL='postgresql://postgres:cosigein@localhost:5432/dobacksoft'; npx ts-node-dev --respawn --transpile-only src/index.ts"
Write-Host "Ventana de backend abierta`n" -ForegroundColor Green

# 3. Esperar e iniciar Frontend
Write-Host "[3/4] Esperando 15 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "[4/4] Iniciando Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Cosigein SL\Desktop\DobackSoft\frontend'; `$env:VITE_API_URL='http://localhost:9998'; npm run dev -- --port 5174"
Write-Host "Ventana de frontend abierta`n" -ForegroundColor Green

# 4. Esperar y abrir navegador
Start-Sleep -Seconds 15

Write-Host "`n========== SISTEMA INICIADO ==========`n" -ForegroundColor Green
Write-Host "Backend:  http://localhost:9998" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5174" -ForegroundColor Cyan
Write-Host "`nCredenciales:" -ForegroundColor Yellow
Write-Host "MANAGER: test@bomberosmadrid.es / admin123" -ForegroundColor White
Write-Host "ADMIN:   antoniohermoso92@gmail.com / admin123" -ForegroundColor White

Write-Host "`nAbriendo navegador..." -ForegroundColor Green
Start-Process "http://localhost:5174"

Write-Host "`nPresiona ENTER para salir..." -ForegroundColor Gray
Read-Host

