# Script para reiniciar el backend después de cambios en el schema de Prisma
# Este script detiene el backend, regenera el cliente de Prisma y lo reinicia

Write-Host "🔄 Reiniciando backend después de cambios en Prisma..." -ForegroundColor Cyan

# 1. Detener procesos de Node.js del backend en puerto 9998
Write-Host "`n1️⃣ Deteniendo backend (puerto 9998)..." -ForegroundColor Yellow
$process = Get-NetTCPConnection -LocalPort 9998 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($process) {
    Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ Backend detenido" -ForegroundColor Green
    Start-Sleep -Seconds 2
}
else {
    Write-Host "   ⚠️ Backend no estaba ejecutándose" -ForegroundColor Yellow
}

# 2. Regenerar cliente de Prisma
Write-Host "`n2️⃣ Regenerando cliente de Prisma..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\..\backend"
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Cliente de Prisma regenerado" -ForegroundColor Green
}
else {
    Write-Host "   ❌ Error regenerando Prisma" -ForegroundColor Red
    exit 1
}

# 3. Reiniciar backend
Write-Host "`n3️⃣ Reiniciando backend..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\.."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev" -WindowStyle Normal

Write-Host "`n✅ Proceso completado" -ForegroundColor Green
Write-Host "   - Cliente de Prisma actualizado con lat/lon opcionales" -ForegroundColor Cyan
Write-Host "   - Backend reiniciado en puerto 9998" -ForegroundColor Cyan
Write-Host "`n⚠️ Espera 10-15 segundos a que el backend inicie completamente" -ForegroundColor Yellow

