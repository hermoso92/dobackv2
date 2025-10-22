# ============================================================================
# SCRIPT DE EJECUCION - MIGRACIONES PARSER V2
# ============================================================================
# Este script ejecuta todas las migraciones SQL en el orden correcto
# con verificaciones entre cada paso.
#
# Uso:
#   .\ejecutar-migraciones-parser-v2.ps1
#   .\ejecutar-migraciones-parser-v2.ps1 -DryRun  (solo muestra comandos)
# ============================================================================

param(
    [switch]$DryRun = $false
)

# Colores para output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error-Custom { Write-Host $args -ForegroundColor Red }

# Configuracion
$DB_URL = "postgresql://postgres:cosigein@localhost:5432/dobacksoft"
$MIGRATIONS_DIR = "database/migrations"
$BACKUP_SCRIPT = "scripts/setup/backup-database.ps1"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  EJECUCION MIGRACIONES PARSER V2" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Warning "MODO DRY-RUN: Solo se mostraran los comandos sin ejecutarlos"
    Write-Host ""
}
else {
    # ✅ MEJORA: Backup automático antes de migraciones
    Write-Info "0. Creando backup de seguridad..."
    Write-Host ""
    
    if (Test-Path $BACKUP_SCRIPT) {
        $backupFile = & $BACKUP_SCRIPT
        if ($LASTEXITCODE -eq 0) {
            Write-Success "OK - Backup creado: $backupFile"
        }
        else {
            Write-Error-Custom "ERROR creando backup"
            Write-Warning "Continuar sin backup? (S/N)"
            $response = Read-Host
            if ($response -ne 'S') {
                Write-Info "Migracion cancelada por el usuario"
                exit 1
            }
        }
    }
    else {
        Write-Warning "Script de backup no encontrado: $BACKUP_SCRIPT"
        Write-Warning "Continuar sin backup? (S/N)"
        $response = Read-Host
        if ($response -ne 'S') {
            Write-Info "Migracion cancelada por el usuario"
            exit 1
        }
    }
    
    Write-Host ""
    Start-Sleep -Seconds 1
}

# ============================================================================
# 1. VERIFICAR CONEXION
# ============================================================================

Write-Info "1. Verificando conexion a base de datos..."
Write-Host ""

if (-not $DryRun) {
    $result = psql $DB_URL -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "ERROR: No se pudo conectar a la base de datos"
        Write-Error-Custom $result
        exit 1
    }
    Write-Success "OK - Conexion exitosa"
}
else {
    Write-Info "   [DRY-RUN] psql $DB_URL -c 'SELECT version();'"
}

Write-Host ""
Start-Sleep -Seconds 1

# ============================================================================
# 2. MIGRACION 01: POSTGIS INIT
# ============================================================================

Write-Info "2. Ejecutando 01_postgis_init.sql..."
Write-Host ""

if (-not $DryRun) {
    $result = psql $DB_URL -f "$MIGRATIONS_DIR/01_postgis_init.sql" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "ERROR ejecutando 01_postgis_init.sql"
        Write-Error-Custom $result
        exit 1
    }
    Write-Success "OK - Extensiones PostGIS instaladas"
}
else {
    Write-Info "   [DRY-RUN] psql $DB_URL -f $MIGRATIONS_DIR/01_postgis_init.sql"
}

Write-Host ""
Start-Sleep -Seconds 1

# ============================================================================
# 3. MIGRACION 00: PARSER VERSION
# ============================================================================

Write-Info "3. Ejecutando 00_add_parser_version.sql..."
Write-Host ""

if (-not $DryRun) {
    $result = psql $DB_URL -f "$MIGRATIONS_DIR/00_add_parser_version.sql" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "ERROR ejecutando 00_add_parser_version.sql"
        Write-Error-Custom $result
        exit 1
    }
    Write-Success "OK - Columna parser_version anadida"
    
    # Verificar
    Write-Info "   Verificando..."
    $count = psql $DB_URL -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='Session' AND column_name='parser_version';" 2>&1
    if ($count -match "1") {
        Write-Success "   PASS - Columna parser_version presente"
    }
    else {
        Write-Warning "   WARN - No se pudo verificar la columna"
    }
}
else {
    Write-Info "   [DRY-RUN] psql $DB_URL -f $MIGRATIONS_DIR/00_add_parser_version.sql"
}

Write-Host ""
Start-Sleep -Seconds 1

# ============================================================================
# 4. MIGRACION 02: GEO BACKFILL
# ============================================================================

Write-Info "4. Ejecutando 02_geo_backfill_and_sync.sql..."
Write-Host ""

if (-not $DryRun) {
    $result = psql $DB_URL -f "$MIGRATIONS_DIR/02_geo_backfill_and_sync.sql" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "ERROR ejecutando 02_geo_backfill_and_sync.sql"
        Write-Error-Custom $result
        exit 1
    }
    Write-Success "OK - GPS geography y Parks geometry configurados"
    
    # Verificar
    Write-Info "   Verificando GPS geography..."
    $missing_geog = psql $DB_URL -t -c "SELECT COUNT(*) FROM ""GpsMeasurement"" WHERE geog IS NULL LIMIT 1;" 2>&1
    Write-Info "   GPS sin geog: $missing_geog"
}
else {
    Write-Info "   [DRY-RUN] psql $DB_URL -f $MIGRATIONS_DIR/02_geo_backfill_and_sync.sql"
}

Write-Host ""
Start-Sleep -Seconds 1

# ============================================================================
# 5. MIGRACION 03: SESSION COLUMNS
# ============================================================================

Write-Info "5. Ejecutando 03_session_processing_columns.sql..."
Write-Host ""

if (-not $DryRun) {
    $result = psql $DB_URL -f "$MIGRATIONS_DIR/03_session_processing_columns.sql" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "ERROR ejecutando 03_session_processing_columns.sql"
        Write-Error-Custom $result
        exit 1
    }
    Write-Success "OK - Columnas de sesion normalizadas (snake_case)"
    
    # Verificar
    Write-Info "   Verificando columnas snake_case..."
    $columns = psql $DB_URL -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='Session' AND column_name IN ('processing_version','matched_distance','matched_duration','matched_geometry','matched_confidence');" 2>&1
    if ($columns -match "5") {
        Write-Success "   PASS - 5 columnas snake_case presentes"
    }
    else {
        Write-Warning "   WARN - Se encontraron $columns columnas (esperadas: 5)"
    }
}
else {
    Write-Info "   [DRY-RUN] psql $DB_URL -f $MIGRATIONS_DIR/03_session_processing_columns.sql"
}

Write-Host ""
Start-Sleep -Seconds 1

# ============================================================================
# 6. MIGRACION 04: CLEANUP PARKS (TENANT-AWARE)
# ============================================================================

Write-Info "6. Ejecutando 04_cleanup_invalid_parks.sql..."
Write-Host ""

# Preguntar por organizacion si no es dry-run
$org_id = $null
if (-not $DryRun) {
    Write-Warning "   Esta migracion elimina parques invalidos"
    Write-Info "   Deseas especificar un organization_id? (deja vacio para single-tenant)"
    $org_id = Read-Host "   Organization ID (Enter para omitir)"
}

if (-not $DryRun) {
    if ($org_id) {
        Write-Info "   Configurando app.org_id = $org_id"
        $set_org = "SET app.org_id = '$org_id';"
        $result = psql $DB_URL -c $set_org 2>&1
    }
    
    $result = psql $DB_URL -f "$MIGRATIONS_DIR/04_cleanup_invalid_parks.sql" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "ERROR ejecutando 04_cleanup_invalid_parks.sql"
        Write-Error-Custom $result
        exit 1
    }
    Write-Success "OK - Parques invalidos eliminados"
}
else {
    Write-Info "   [DRY-RUN] psql $DB_URL -f $MIGRATIONS_DIR/04_cleanup_invalid_parks.sql"
}

Write-Host ""
Start-Sleep -Seconds 1

# ============================================================================
# 7. RESUMEN FINAL
# ============================================================================

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  MIGRACIONES COMPLETADAS EXITOSAMENTE" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

if (-not $DryRun) {
    Write-Success "Resumen de migraciones ejecutadas:"
    Write-Host ""
    Write-Success "   [OK] 01_postgis_init.sql               - Extensiones PostGIS"
    Write-Success "   [OK] 00_add_parser_version.sql         - Parser version tracking"
    Write-Success "   [OK] 02_geo_backfill_and_sync.sql      - GPS + Parks geometry"
    Write-Success "   [OK] 03_session_processing_columns.sql - Snake_case normalizado"
    Write-Success "   [OK] 04_cleanup_invalid_parks.sql      - Limpieza parques"
    Write-Host ""
    
    Write-Info "Proximos pasos:"
    Write-Host ""
    Write-Info "   1. Ejecutar dry-run del script de reprocesamiento:"
    Write-Info "      node scripts/setup/reprocess-parser-v2.js --dry-run"
    Write-Host ""
    Write-Info "   2. Reprocesar sesiones v1 -> v2:"
    Write-Info "      node scripts/setup/reprocess-parser-v2.js"
    Write-Host ""
    Write-Info "   3. Verificar fisica corregida:"
    Write-Info "      node scripts/analisis/verify-scale-fix.js"
    Write-Host ""
}
else {
    Write-Warning "Esto fue una simulacion (DRY-RUN)"
    Write-Info "   Ejecuta sin -DryRun para aplicar cambios reales:"
    Write-Info "   .\ejecutar-migraciones-parser-v2.ps1"
    Write-Host ""
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
