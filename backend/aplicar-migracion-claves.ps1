# 🔧 SCRIPT PARA APLICAR MIGRACIÓN DE CLAVES OPERACIONALES
# Ejecutar desde: backend/

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  APLICAR MIGRACIÓN DE CLAVES" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Detener procesos Node
Write-Host "1️⃣ Deteniendo procesos Node..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "   ✅ Procesos detenidos`n" -ForegroundColor Green

# 2. Limpiar Prisma Client corrupto
Write-Host "2️⃣ Limpiando Prisma Client corrupto..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Write-Host "   ✅ Cache limpiado`n" -ForegroundColor Green

# 3. Aplicar migración SQL directamente
Write-Host "3️⃣ Aplicando migración SQL a PostgreSQL..." -ForegroundColor Yellow
$env:PGPASSWORD="root"
$migrationFile = "prisma\migrations\20251010_add_operational_keys_and_quality_v2\migration.sql"

if (Test-Path $migrationFile) {
    Write-Host "   Ejecutando: $migrationFile" -ForegroundColor Gray
    
    # Ejecutar con psql (si está disponible)
    $psqlPath = Get-Command psql -ErrorAction SilentlyContinue
    
    if ($psqlPath) {
        psql -h localhost -U postgres -d dobacksoft -f $migrationFile 2>&1
        Write-Host "   ✅ Migración aplicada`n" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  psql no encontrado - aplicando con Prisma..." -ForegroundColor Yellow
        npx prisma migrate deploy
    }
} else {
    Write-Host "   ❌ Archivo de migración no encontrado`n" -ForegroundColor Red
    exit 1
}

# 4. Regenerar Prisma Client
Write-Host "4️⃣ Regenerando Prisma Client..." -ForegroundColor Yellow
npx prisma generate
Write-Host "   ✅ Prisma Client regenerado`n" -ForegroundColor Green

# 5. Verificar tablas
Write-Host "5️⃣ Verificando tablas..." -ForegroundColor Yellow
node verificar-tablas-bd.js

# 6. Reiniciar sistema
Write-Host "`n6️⃣ Reiniciando sistema..." -ForegroundColor Yellow
Write-Host "   Ejecuta: cd ..; .\iniciar.ps1`n" -ForegroundColor Cyan

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ PROCESO COMPLETADO" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

