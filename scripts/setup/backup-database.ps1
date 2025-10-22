# ============================================================================
# SCRIPT DE BACKUP AUTOMÁTICO - DOBACKSOFT
# ============================================================================
# Crea un backup completo de la base de datos PostgreSQL antes de migraciones
#
# Uso:
#   .\scripts\setup\backup-database.ps1
#   .\scripts\setup\backup-database.ps1 -BackupDir "C:\backups\custom"
# ============================================================================

param(
    [string]$BackupDir = "database\backups",
    [string]$DBName = "dobacksoft",
    [string]$DBUser = "postgres",
    [string]$DBHost = "localhost",
    [string]$DBPort = "5432"
)

# Colores
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error-Custom { Write-Host $args -ForegroundColor Red }

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  BACKUP AUTOMATICO DE BASE DE DATOS" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Crear directorio de backups si no existe
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Info "Directorio de backups creado: $BackupDir"
}

# 2. Generar nombre de archivo con timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "$BackupDir\backup_$DBName`_$timestamp.sql"
$backupFileCompressed = "$backupFile.gz"

Write-Info "Iniciando backup de base de datos..."
Write-Info "  Base de datos: $DBName"
Write-Info "  Archivo: $backupFile"
Write-Host ""

# 3. Ejecutar pg_dump
Write-Info "Ejecutando pg_dump..."
$env:PGPASSWORD = "cosigein"

try {
    $dumpArgs = @(
        "-h", $DBHost,
        "-p", $DBPort,
        "-U", $DBUser,
        "-F", "p",  # Plain text format
        "-f", $backupFile,
        $DBName
    )
    
    & pg_dump @dumpArgs 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "ERROR: pg_dump fallo con codigo $LASTEXITCODE"
        exit 1
    }
    
    Write-Success "OK - Backup SQL creado exitosamente"
    
}
catch {
    Write-Error-Custom "ERROR ejecutando pg_dump: $_"
    exit 1
}

# 4. Comprimir backup (opcional, si existe gzip)
Write-Info "Comprimiendo backup..."
try {
    if (Get-Command gzip -ErrorAction SilentlyContinue) {
        gzip -f $backupFile
        Write-Success "OK - Backup comprimido: $backupFileCompressed"
        $finalFile = $backupFileCompressed
    }
    else {
        Write-Warning "gzip no disponible, backup sin comprimir"
        $finalFile = $backupFile
    }
}
catch {
    Write-Warning "No se pudo comprimir backup: $_"
    $finalFile = $backupFile
}

# 5. Verificar tamaño del backup
$fileInfo = Get-Item $finalFile
$sizeMB = [math]::Round($fileInfo.Length / 1MB, 2)

Write-Host ""
Write-Success "================================================================"
Write-Success "  BACKUP COMPLETADO EXITOSAMENTE"
Write-Success "================================================================"
Write-Host ""
Write-Success "Archivo: $finalFile"
Write-Success "Tamaño: $sizeMB MB"
Write-Success "Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""

# 6. Limpiar backups antiguos (mantener últimos 10)
Write-Info "Limpiando backups antiguos..."
$backups = Get-ChildItem -Path $BackupDir -Filter "backup_$DBName*.sql*" | 
Sort-Object LastWriteTime -Descending

if ($backups.Count -gt 10) {
    $toDelete = $backups | Select-Object -Skip 10
    $toDelete | Remove-Item -Force
    Write-Success "Eliminados $($toDelete.Count) backups antiguos (manteniendo ultimos 10)"
}
else {
    Write-Info "Backups totales: $($backups.Count) (maximo: 10)"
}

Write-Host ""
Write-Info "INSTRUCCIONES DE RESTAURACION:"
Write-Host ""
Write-Info "  Para restaurar este backup, ejecuta:"
Write-Host ""
if ($finalFile.EndsWith('.gz')) {
    Write-Info "    gunzip $finalFile"
    Write-Info "    psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -f $backupFile"
}
else {
    Write-Info "    psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -f $finalFile"
}
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Retornar ruta del backup para scripts que lo invoquen
Write-Output $finalFile

