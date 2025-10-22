# Script de Ejecucion de Migraciones Completas Parser V2
# Ejecuta las 6 migraciones en orden estricto con verificacion

param(
    [string]$DatabaseUrl = ""
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  EJECUTANDO MIGRACIONES PARSER V2" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Obtener DATABASE_URL
if ([string]::IsNullOrEmpty($DatabaseUrl)) {
    if (Test-Path "config.env") {
        $envContent = Get-Content "config.env"
        $dbUrlLine = $envContent | Where-Object { $_ -match "^DATABASE_URL=" }
        if ($dbUrlLine) {
            $DatabaseUrl = $dbUrlLine -replace "^DATABASE_URL=", ""
        }
    }
}

if ([string]::IsNullOrEmpty($DatabaseUrl)) {
    Write-Host "ERROR: DATABASE_URL no encontrada" -ForegroundColor Red
    exit 1
}

# Limpiar URL
$cleanUrl = $DatabaseUrl -replace '\?.*$', ''

# Orden critico de migraciones
$migrations = @(
    @{File="database\migrations\01_postgis_init.sql"; Name="PostGIS + Extensiones"},
    @{File="database\migrations\00_add_parser_version.sql"; Name="Parser Version"},
    @{File="database\migrations\02_geo_backfill_and_sync.sql"; Name="GPS Geo + Park Geometry"},
    @{File="database\migrations\03_session_processing_columns.sql"; Name="Session Snake_case"},
    @{File="database\migrations\04_cleanup_invalid_parks.sql"; Name="Cleanup Parques Invalidos"},
    @{File="database\migrations\05_create_processing_logs.sql"; Name="Processing Logs Table"}
)

$totalMigrations = $migrations.Count
$currentMigration = 0

foreach ($migration in $migrations) {
    $currentMigration++
    
    Write-Host ""
    Write-Host "[$currentMigration/$totalMigrations] Ejecutando: $($migration.Name)" -ForegroundColor Yellow
    Write-Host "Archivo: $($migration.File)" -ForegroundColor Gray
    
    if (!(Test-Path $migration.File)) {
        Write-Host "ERROR: Archivo no encontrado: $($migration.File)" -ForegroundColor Red
        exit 1
    }
    
    $output = & psql $cleanUrl -f $migration.File 2>&1 | Out-String
    
    # Mostrar output
    $output -split "`n" | ForEach-Object {
        if ($_ -match "^ERROR:") {
            Write-Host $_ -ForegroundColor Red
        } elseif ($_ -match "^NOTICE:") {
            Write-Host $_ -ForegroundColor Yellow
        } elseif ($_ -match "^WARNING:") {
            Write-Host $_ -ForegroundColor Yellow
        } else {
            Write-Host $_ -ForegroundColor Gray
        }
    }
    
    # Solo fallar si hay ERROR: real en el output
    $hasRealError = ($output -split "`n") | Where-Object { $_ -match "^psql:.*ERROR:" }
    if ($hasRealError.Count -gt 0) {
        Write-Host ""
        Write-Host "================================================================" -ForegroundColor Red
        Write-Host "  ERROR EN MIGRACION: $($migration.Name)" -ForegroundColor Red
        Write-Host "================================================================" -ForegroundColor Red
        Write-Host "Errores SQL encontrados" -ForegroundColor Red
        Write-Host ""
        Write-Host "IMPORTANTE: Restaurar backup si es necesario:" -ForegroundColor Yellow
        Write-Host "  psql `$DATABASE_URL < database\backups\backup_pre_migraciones_*.sql" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "OK: $($migration.Name) ejecutada correctamente" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  MIGRACIONES COMPLETADAS EXITOSAMENTE" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Total migraciones ejecutadas: $totalMigrations" -ForegroundColor Green
Write-Host ""
Write-Host "Siguiente paso: Verificar con scripts/verificacion/verificar-post-deploy.ps1" -ForegroundColor Cyan

