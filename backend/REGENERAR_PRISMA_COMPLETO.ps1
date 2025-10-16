# REGENERACIÓN COMPLETA DE PRISMA CLIENT

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "REGENERACIÓN COMPLETA DE PRISMA" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Detener Node
Write-Host "1. Deteniendo Node..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3
Write-Host "   ✅ OK`n" -ForegroundColor Green

# 2. Limpiar cache completo
Write-Host "2. Limpiando cache de Prisma..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\@prisma -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force prisma\generated -ErrorAction SilentlyContinue
Write-Host "   ✅ OK`n" -ForegroundColor Green

# 3. Reinstalar @prisma/client
Write-Host "3. Reinstalando @prisma/client..." -ForegroundColor Yellow
npm uninstall @prisma/client
npm install @prisma/client@latest
Write-Host "`n   ✅ OK`n" -ForegroundColor Green

# 4. Regenerar Prisma Client
Write-Host "4. Regenerando Prisma Client..." -ForegroundColor Yellow
npx prisma generate --schema=./prisma/schema.prisma --skip-generate=false
Write-Host "`n   ✅ OK`n" -ForegroundColor Green

# 5. Verificar generación
Write-Host "5. Verificando generación..." -ForegroundColor Yellow
if (Test-Path "node_modules\@prisma\client") {
    Write-Host "   ✅ Prisma Client generado correctamente`n" -ForegroundColor Green
} else {
    Write-Host "   ❌ ERROR: Prisma Client no se generó`n" -ForegroundColor Red
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ REGENERACIÓN COMPLETA" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

