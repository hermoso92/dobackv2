# Script de Backup Pre-Migraciones
# Crea backup completo de la BD antes de ejecutar migraciones

param(
    [string]$DatabaseUrl = ""
)

$ErrorActionPreference = "Stop"

Write-Host "Iniciando backup pre-migraciones..." -ForegroundColor Cyan

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

# Crear directorio de backups
$backupDir = "database\backups"
if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

# Generar nombre con timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "$backupDir\backup_pre_migraciones_$timestamp.sql"

Write-Host "Creando backup en: $backupFile" -ForegroundColor Yellow

# Limpiar DATABASE_URL (pg_dump no soporta algunos parametros)
$cleanUrl = $DatabaseUrl -replace '\?.*$', ''

# Ejecutar pg_dump
try {
    pg_dump $cleanUrl -f $backupFile 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump fallo"
    }
    
    # Verificar que el archivo se creo
    if (Test-Path $backupFile) {
        $size = (Get-Item $backupFile).Length / 1MB
        Write-Host "Backup creado exitosamente: $([math]::Round($size, 2)) MB" -ForegroundColor Green
        Write-Host "Ubicacion: $backupFile" -ForegroundColor Green
    }
    else {
        throw "Archivo de backup no se creo"
    }
    
}
catch {
    Write-Host "ERROR creando backup: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Backup completado correctamente" -ForegroundColor Green

