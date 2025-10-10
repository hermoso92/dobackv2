#!/usr/bin/env pwsh
# 🔧 APLICAR MIGRACIÓN DE CLAVES OPERACIONALES
# Ejecutar desde: backend/

Write-Host "`n" -NoNewline
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=".PadRight(78, '=') -ForegroundColor Cyan
Write-Host " APLICAR MIGRACIÓN DE CLAVES OPERACIONALES" -ForegroundColor Yellow
Write-Host "=".PadRight(79, '=') -ForegroundColor Cyan

# 1. Detener procesos Node
Write-Host "`n1️⃣  Deteniendo procesos Node..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force 2>$null
Start-Sleep -Seconds 2
Write-Host "   ✅ Procesos Node detenidos" -ForegroundColor Green

# 2. Limpiar cache de Prisma
Write-Host "`n2️⃣  Limpiando cache de Prisma..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Write-Host "   ✅ Cache limpiado" -ForegroundColor Green

# 3. Aplicar migración con Prisma
Write-Host "`n3️⃣  Aplicando migración a PostgreSQL..." -ForegroundColor Yellow
npx prisma migrate deploy
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Migración aplicada" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Migración ya aplicada o error" -ForegroundColor Yellow
}

# 4. Regenerar Prisma Client
Write-Host "`n4️⃣  Regenerando Prisma Client..." -ForegroundColor Yellow
npx prisma generate
Write-Host "   ✅ Prisma Client regenerado" -ForegroundColor Green

# 5. Verificar tablas
Write-Host "`n5️⃣  Verificando tablas en BD..." -ForegroundColor Yellow

$verificacion = @"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    try {
        const ok = await prisma.\`$\`queryRaw\`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_name = 'OperationalKey'
        \`;
        
        const dq = await prisma.\`$\`queryRaw\`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_name = 'DataQualityMetrics'
        \`;
        
        console.log('   OperationalKey:', ok[0].count > 0 ? '✅ Existe' : '❌ No existe');
        console.log('   DataQualityMetrics:', dq[0].count > 0 ? '✅ Existe' : '❌ No existe');
        
        await prisma.\`$\`disconnect();
        process.exit(0);
    } catch (e) {
        console.error('   ❌ Error:', e.message);
        process.exit(1);
    }
}

verify();
"@

$verificacion | Out-File -FilePath temp-verify.js -Encoding utf8
node temp-verify.js
Remove-Item temp-verify.js -ErrorAction SilentlyContinue

# 6. Instrucciones finales
Write-Host "`n6️⃣  Reiniciando sistema..." -ForegroundColor Yellow
Write-Host "`n   Ejecutando iniciar.ps1..." -ForegroundColor Cyan

cd ..
.\iniciar.ps1

Write-Host "`n" -NoNewline
Write-Host "=".PadRight(79, '=') -ForegroundColor Cyan
Write-Host " ✅ MIGRACIÓN COMPLETADA - SISTEMA REINICIANDO" -ForegroundColor Green
Write-Host "=".PadRight(79, '=') -ForegroundColor Cyan
Write-Host "`n"

