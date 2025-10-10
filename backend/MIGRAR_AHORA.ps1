# APLICAR MIGRACIÓN DE CLAVES OPERACIONALES

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "APLICAR MIGRACIÓN DE CLAVES" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Detener Node
Write-Host "1. Deteniendo Node..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force 2>$null
Start-Sleep -Seconds 2
Write-Host "   OK`n" -ForegroundColor Green

# 2. Limpiar cache
Write-Host "2. Limpiando cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Write-Host "   OK`n" -ForegroundColor Green

# 3. Aplicar migración
Write-Host "3. Aplicando migración..." -ForegroundColor Yellow
npx prisma migrate deploy
Write-Host "`n   OK`n" -ForegroundColor Green

# 4. Regenerar Prisma
Write-Host "4. Regenerando Prisma Client..." -ForegroundColor Yellow
npx prisma generate
Write-Host "`n   OK`n" -ForegroundColor Green

# 5. Reiniciar
Write-Host "5. Reiniciando sistema..." -ForegroundColor Yellow
cd ..
.\iniciar.ps1

