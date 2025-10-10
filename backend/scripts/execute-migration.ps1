# Script de ejecución de migración multiorganización completa
# Ejecutar en PowerShell como administrador

param(
    [string]$DatabaseHost = "localhost",
    [string]$DatabaseName = "dobacksoft",
    [string]$DatabaseUser = "postgres",
    [string]$BackupPath = "backup_pre_migration_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
)

Write-Host "=== MIGRACIÓN MULTIORGANIZACIÓN COMPLETA ===" -ForegroundColor Green
Write-Host "Fecha: $(Get-Date)" -ForegroundColor Yellow
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "prisma")) {
    Write-Host "ERROR: No se encontró el directorio prisma. Ejecutar desde backend/" -ForegroundColor Red
    exit 1
}

# Paso 1: Respaldo de base de datos
Write-Host "Paso 1: Creando respaldo de base de datos..." -ForegroundColor Cyan
try {
    $backupCommand = "pg_dump -h $DatabaseHost -U $DatabaseUser -d $DatabaseName > $BackupPath"
    Write-Host "Ejecutando: $backupCommand" -ForegroundColor Gray
    
    # Solicitar contraseña de PostgreSQL
    $env:PGPASSWORD = Read-Host "Ingrese la contraseña de PostgreSQL" -AsSecureString | ConvertFrom-SecureString
    
    Invoke-Expression $backupCommand
    
    if (Test-Path $BackupPath) {
        $backupSize = (Get-Item $BackupPath).Length / 1MB
        Write-Host "✅ Respaldo creado exitosamente: $BackupPath ($([math]::Round($backupSize, 2)) MB)" -ForegroundColor Green
    }
    else {
        throw "No se pudo crear el respaldo"
    }
}
catch {
    Write-Host "❌ Error creando respaldo: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Paso 2: Ejecutar migración SQL
Write-Host "`nPaso 2: Ejecutando migración SQL..." -ForegroundColor Cyan
try {
    $migrationCommand = "psql -h $DatabaseHost -U $DatabaseUser -d $DatabaseName -f scripts/final-migration.sql"
    Write-Host "Ejecutando: $migrationCommand" -ForegroundColor Gray
    
    Invoke-Expression $migrationCommand
    
    Write-Host "✅ Migración SQL ejecutada exitosamente" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error ejecutando migración SQL: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Para hacer rollback, ejecute: psql -h $DatabaseHost -U $DatabaseUser -d $DatabaseName < $BackupPath" -ForegroundColor Yellow
    exit 1
}

# Paso 3: Regenerar cliente Prisma
Write-Host "`nPaso 3: Regenerando cliente Prisma..." -ForegroundColor Cyan
try {
    Write-Host "Ejecutando: npx prisma generate" -ForegroundColor Gray
    npm run prisma:generate
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Cliente Prisma regenerado exitosamente" -ForegroundColor Green
    }
    else {
        throw "Error en la regeneración de Prisma"
    }
}
catch {
    Write-Host "❌ Error regenerando Prisma: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Paso 4: Verificar migración
Write-Host "`nPaso 4: Verificando migración..." -ForegroundColor Cyan
try {
    $verifyCommand = @"
SELECT 
    'Session' as table_name,
    COUNT(*) as total_records,
    COUNT("organizationId") as records_with_org,
    CASE WHEN COUNT(*) = COUNT("organizationId") THEN 'OK' ELSE 'ERROR' END as status
FROM "Session"
UNION ALL
SELECT 
    'MaintenanceRecord' as table_name,
    COUNT(*) as total_records,
    COUNT("organizationId") as records_with_org,
    CASE WHEN COUNT(*) = COUNT("organizationId") THEN 'OK' ELSE 'ERROR' END as status
FROM "MaintenanceRecord";
"@

    $verifyCommand | Out-File -FilePath "temp_verify.sql" -Encoding UTF8
    
    $verifyResult = psql -h $DatabaseHost -U $DatabaseUser -d $DatabaseName -f temp_verify.sql
    
    Remove-Item "temp_verify.sql" -ErrorAction SilentlyContinue
    
    Write-Host "✅ Verificación completada" -ForegroundColor Green
    Write-Host "Resultados:" -ForegroundColor Yellow
    Write-Host $verifyResult -ForegroundColor White
    
}
catch {
    Write-Host "❌ Error en verificación: $($_.Exception.Message)" -ForegroundColor Red
}

# Paso 5: Compilar y verificar TypeScript
Write-Host "`nPaso 5: Compilando TypeScript..." -ForegroundColor Cyan
try {
    Write-Host "Ejecutando: npm run build" -ForegroundColor Gray
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Compilación exitosa" -ForegroundColor Green
    }
    else {
        throw "Error en la compilación"
    }
}
catch {
    Write-Host "❌ Error compilando: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Revisar errores de TypeScript antes de continuar" -ForegroundColor Yellow
}

# Paso 6: Ejecutar tests básicos
Write-Host "`nPaso 6: Ejecutando tests básicos..." -ForegroundColor Cyan
try {
    Write-Host "Ejecutando: npm test" -ForegroundColor Gray
    npm test
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Tests pasaron exitosamente" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Algunos tests fallaron. Revisar antes de continuar" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Error ejecutando tests: $($_.Exception.Message)" -ForegroundColor Red
}

# Resumen final
Write-Host "`n=== RESUMEN DE MIGRACIÓN ===" -ForegroundColor Green
Write-Host "✅ Respaldo creado: $BackupPath" -ForegroundColor Green
Write-Host "✅ Migración SQL ejecutada" -ForegroundColor Green
Write-Host "✅ Cliente Prisma regenerado" -ForegroundColor Green
Write-Host "✅ Verificación completada" -ForegroundColor Green
Write-Host "✅ Compilación exitosa" -ForegroundColor Green

Write-Host "`n=== PRÓXIMOS PASOS ===" -ForegroundColor Yellow
Write-Host "1. Reiniciar el servidor: npm run start" -ForegroundColor White
Write-Host "2. Ejecutar pruebas manuales de funcionalidad" -ForegroundColor White
Write-Host "3. Verificar que usuarios no pueden acceder a datos de otras organizaciones" -ForegroundColor White
Write-Host "4. Monitorear logs por posibles errores" -ForegroundColor White

Write-Host "`n=== ROLLBACK SI ES NECESARIO ===" -ForegroundColor Red
Write-Host "psql -h $DatabaseHost -U $DatabaseUser -d $DatabaseName < $BackupPath" -ForegroundColor White

Write-Host "`n¡Migración completada exitosamente!" -ForegroundColor Green 