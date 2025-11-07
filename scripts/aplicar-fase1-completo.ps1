# ============================================================================
# SCRIPT: Aplicar FASE 1 - ChatGPT Critical Fixes
# ============================================================================
# Aplica automáticamente todos los cambios de FASE 1
# Incluye: backup, migraciones SQL, verificación
# ============================================================================

Write-Host ""
Write-Host "🚀 APLICANDO FASE 1 - ChatGPT Critical Fixes" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Variables
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = "backup-antes-fase1-$timestamp.sql"
$dbUser = "dobacksoft"
$dbName = "dobacksoft"

# ============================================================================
# PASO 1: VERIFICACIÓN PREVIA
# ============================================================================

Write-Host "📋 PASO 1: Verificación previa..." -ForegroundColor Yellow

# Verificar que estamos en la rama correcta
$currentBranch = git branch --show-current
if ($currentBranch -ne "feature/chatgpt-critical-fixes") {
    Write-Host "❌ ERROR: Debes estar en la rama 'feature/chatgpt-critical-fixes'" -ForegroundColor Red
    Write-Host "   Rama actual: $currentBranch" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ Rama correcta: $currentBranch" -ForegroundColor Green

# Verificar que PostgreSQL está corriendo
$pgProcess = Get-Process -Name postgres -ErrorAction SilentlyContinue
if (-not $pgProcess) {
    Write-Host "❌ ERROR: PostgreSQL no está corriendo" -ForegroundColor Red
    Write-Host "   Inicia PostgreSQL primero" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ PostgreSQL corriendo" -ForegroundColor Green

# Verificar archivos de migración existen
$migration001 = Test-Path "database/migrations/001-chatgpt-critical-constraints.sql"
$migration002 = Test-Path "database/migrations/002-chatgpt-critical-indexes.sql"

if (-not $migration001 -or -not $migration002) {
    Write-Host "❌ ERROR: Archivos de migración no encontrados" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ Archivos de migración encontrados" -ForegroundColor Green

Write-Host ""

# ============================================================================
# PASO 2: BACKUP
# ============================================================================

Write-Host "💾 PASO 2: Creando backup..." -ForegroundColor Yellow

try {
    pg_dump -U $dbUser $dbName > $backupFile
    
    if (Test-Path $backupFile) {
        $backupSize = (Get-Item $backupFile).Length / 1MB
        Write-Host "   ✓ Backup creado: $backupFile ($([math]::Round($backupSize, 2)) MB)" -ForegroundColor Green
    } else {
        Write-Host "❌ ERROR: No se pudo crear el backup" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ ERROR creando backup: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# PASO 3: MIGRACIÓN 001 - Constraints
# ============================================================================

Write-Host "🔧 PASO 3: Aplicando constraints..." -ForegroundColor Yellow
Write-Host "   (Esto puede tardar 2-5 minutos)" -ForegroundColor Gray

try {
    $output001 = psql -U $dbUser -d $dbName -f database/migrations/001-chatgpt-critical-constraints.sql 2>&1
    
    # Buscar errores
    if ($output001 -match "ERROR") {
        Write-Host "❌ ERROR en migración 001:" -ForegroundColor Red
        Write-Host $output001 -ForegroundColor Red
        Write-Host ""
        Write-Host "⚠️  Restaurando backup..." -ForegroundColor Yellow
        psql -U $dbUser -d $dbName < $backupFile
        exit 1
    }
    
    # Contar registros limpiados
    $updatesCount = ($output001 | Select-String "UPDATE" | Measure-Object).Count
    $deletesCount = ($output001 | Select-String "DELETE" | Measure-Object).Count
    
    Write-Host "   ✓ Constraints aplicados" -ForegroundColor Green
    Write-Host "   → Registros actualizados: $updatesCount" -ForegroundColor Gray
    Write-Host "   → Registros eliminados: $deletesCount" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ ERROR aplicando constraints: $_" -ForegroundColor Red
    Write-Host "⚠️  Restaurando backup..." -ForegroundColor Yellow
    psql -U $dbUser -d $dbName < $backupFile
    exit 1
}

Write-Host ""

# ============================================================================
# PASO 4: MIGRACIÓN 002 - Índices
# ============================================================================

Write-Host "📊 PASO 4: Creando índices..." -ForegroundColor Yellow
Write-Host "   (Esto puede tardar 5-10 minutos)" -ForegroundColor Gray

try {
    $output002 = psql -U $dbUser -d $dbName -f database/migrations/002-chatgpt-critical-indexes.sql 2>&1
    
    # Buscar errores
    if ($output002 -match "ERROR") {
        Write-Host "❌ ERROR en migración 002:" -ForegroundColor Red
        Write-Host $output002 -ForegroundColor Red
        Write-Host ""
        Write-Host "⚠️  Restaurando backup..." -ForegroundColor Yellow
        psql -U $dbUser -d $dbName < $backupFile
        exit 1
    }
    
    # Contar índices creados
    $indexesCount = ($output002 | Select-String "CREATE INDEX" | Measure-Object).Count
    
    Write-Host "   ✓ Índices creados: $indexesCount" -ForegroundColor Green
    
} catch {
    Write-Host "❌ ERROR creando índices: $_" -ForegroundColor Red
    Write-Host "⚠️  Restaurando backup..." -ForegroundColor Yellow
    psql -U $dbUser -d $dbName < $backupFile
    exit 1
}

Write-Host ""

# ============================================================================
# PASO 5: REINICIAR SISTEMA
# ============================================================================

Write-Host "🔄 PASO 5: Reiniciando sistema..." -ForegroundColor Yellow

# Matar procesos existentes
Write-Host "   → Deteniendo procesos..." -ForegroundColor Gray
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Iniciar sistema
Write-Host "   → Iniciando backend y frontend..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Cosigein SL\Desktop\DobackSoft'; .\iniciar.ps1"

# Esperar a que arranque
Write-Host "   → Esperando 30 segundos a que arranque..." -ForegroundColor Gray
Start-Sleep -Seconds 30

# Verificar que backend responde
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9998/api/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✓ Backend respondiendo" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend no responde aún (puede necesitar más tiempo)" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# PASO 6: VERIFICACIÓN AUTOMATIZADA
# ============================================================================

Write-Host "🧪 PASO 6: Ejecutando tests de verificación..." -ForegroundColor Yellow

try {
    Set-Location backend
    $testOutput = npx ts-node ../scripts/testing/verify-fase1-chatgpt.ts 2>&1
    Set-Location ..
    
    Write-Host $testOutput
    
    # Verificar si pasaron todos los tests
    if ($testOutput -match "5/5 tests pasados") {
        Write-Host ""
        Write-Host "🎉 ¡TODOS LOS TESTS PASARON! FASE 1 COMPLETADA ✅" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "⚠️  Algunos tests fallaron. Revisar detalles arriba." -ForegroundColor Yellow
        Write-Host ""
    }
    
} catch {
    Write-Host "⚠️  No se pudieron ejecutar tests automáticos: $_" -ForegroundColor Yellow
    Write-Host "   Ejecutar manualmente: npx ts-node scripts/testing/verify-fase1-chatgpt.ts" -ForegroundColor Gray
}

# ============================================================================
# RESUMEN FINAL
# ============================================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📊 RESUMEN DE APLICACIÓN" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Backup creado: $backupFile" -ForegroundColor Green
Write-Host "✅ Constraints aplicados (8)" -ForegroundColor Green
Write-Host "✅ Índices creados (11)" -ForegroundColor Green
Write-Host "✅ Sistema reiniciado" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "1. Ejecutar tests manuales (ver temp/APLICAR-FASE1-AHORA.md)" -ForegroundColor Gray
Write-Host "2. Verificar logs del backend" -ForegroundColor Gray
Write-Host "3. Probar frontend manualmente" -ForegroundColor Gray
Write-Host "4. Si todo OK → commit y push" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

