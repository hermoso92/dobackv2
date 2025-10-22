# ============================================================
# Script para Eliminar Geocercas Inválidas
# ============================================================
# Descripción: Ejecuta el SQL de limpieza de parques inválidos
# Fecha: 2025-10-22
# ============================================================

param(
    [Parameter(Mandatory = $false)]
    [string]$DatabaseUrl,
    
    [Parameter(Mandatory = $false)]
    [string]$OrganizationId = $null,
    
    [Parameter(Mandatory = $false)]
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

# Colores
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }

Write-Info "═══════════════════════════════════════════════════════════"
Write-Info "  LIMPIEZA DE GEOCERCAS INVÁLIDAS"
Write-Info "═══════════════════════════════════════════════════════════"
Write-Host ""

# 1. Verificar que exista el archivo SQL
$sqlFile = "database\eliminar-parques-invalidos.sql"
if (!(Test-Path $sqlFile)) {
    Write-Error "❌ ERROR: No se encuentra el archivo SQL: $sqlFile"
    exit 1
}

Write-Info "✓ Archivo SQL encontrado: $sqlFile"
Write-Host ""

# 2. Obtener DATABASE_URL si no se proporcionó
if ([string]::IsNullOrEmpty($DatabaseUrl)) {
    $envFile = "config.env"
    if (Test-Path $envFile) {
        Write-Info "Leyendo DATABASE_URL desde $envFile..."
        $env = Get-Content $envFile | Where-Object { $_ -match "^DATABASE_URL=" }
        if ($env) {
            $DatabaseUrl = $env -replace "^DATABASE_URL=", ""
            Write-Success "✓ DATABASE_URL obtenida"
        }
        else {
            Write-Error "❌ ERROR: DATABASE_URL no encontrada en $envFile"
            exit 1
        }
    }
    else {
        Write-Error "❌ ERROR: Archivo $envFile no encontrado"
        exit 1
    }
}

# 3. Verificar psql
Write-Info "Verificando psql..."
try {
    $psqlVersion = psql --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "psql no encontrado"
    }
    Write-Success "✓ psql instalado: $psqlVersion"
}
catch {
    Write-Error "❌ ERROR: psql no está instalado o no está en el PATH"
    Write-Warning "Instala PostgreSQL desde: https://www.postgresql.org/download/"
    exit 1
}
Write-Host ""

# 4. Dry Run?
if ($DryRun) {
    Write-Warning "╔════════════════════════════════════════════╗"
    Write-Warning "║  MODO DRY-RUN: No se ejecutarán cambios  ║"
    Write-Warning "╚════════════════════════════════════════════╝"
    Write-Host ""
    
    Write-Info "Se eliminarían los siguientes parques inválidos:"
    Write-Host "  - Parque Central (sin coordenadas)"
    Write-Host "  - Parque Chamberí (inválido)"
    Write-Host "  - Parque Vallecas (inválido)"
    Write-Host "  - Parque Carabanchel (inválido)"
    Write-Host ""
    Write-Info "Se mantendrían los parques válidos:"
    Write-Host "  - Rozas (válido)"
    Write-Host "  - Alcobendas (válido)"
    Write-Host ""
    Write-Warning "Para ejecutar los cambios, vuelve a correr el script sin -DryRun"
    exit 0
}

# 5. Confirmación
Write-Warning "╔═══════════════════════════════════════════════════╗"
Write-Warning "║  ⚠️  ATENCIÓN: Esta operación eliminará datos  ⚠️ ║"
Write-Warning "╚═══════════════════════════════════════════════════╝"
Write-Host ""
Write-Info "Parques que se eliminarán:"
Write-Host "  - Parque Central"
Write-Host "  - Parque Chamberí"
Write-Host "  - Parque Vallecas"
Write-Host "  - Parque Carabanchel"
Write-Host ""

if (!$OrganizationId) {
    Write-Warning "Modo: SINGLE-TENANT (se eliminarán por nombre únicamente)"
}
else {
    Write-Info "Modo: MULTI-TENANT (Organization ID: $OrganizationId)"
}
Write-Host ""

$confirmation = Read-Host "¿Continuar? (escriba 'SI' para confirmar)"
if ($confirmation -ne "SI") {
    Write-Warning "Operación cancelada por el usuario"
    exit 0
}
Write-Host ""

# 6. Ejecutar SQL
Write-Info "Ejecutando SQL..."
Write-Host ""

try {
    if ($OrganizationId) {
        # Multi-tenant: Set organization context
        $setOrgCommand = "SET app.org_id = '$OrganizationId';"
        $combinedSQL = $setOrgCommand + "`n" + (Get-Content $sqlFile -Raw)
        $combinedSQL | psql $DatabaseUrl 2>&1 | ForEach-Object { Write-Host $_ }
    }
    else {
        # Single-tenant
        psql $DatabaseUrl -f $sqlFile 2>&1 | ForEach-Object { Write-Host $_ }
    }
    
    if ($LASTEXITCODE -ne 0) {
        throw "Error ejecutando SQL"
    }
    
    Write-Host ""
    Write-Success "═══════════════════════════════════════════════════════════"
    Write-Success "  ✓ GEOCERCAS INVÁLIDAS ELIMINADAS CORRECTAMENTE"
    Write-Success "═══════════════════════════════════════════════════════════"
    Write-Host ""
    Write-Info "Solo quedan los parques válidos:"
    Write-Host "  - Rozas"
    Write-Host "  - Alcobendas"
    Write-Host ""
    
}
catch {
    Write-Error ""
    Write-Error "═══════════════════════════════════════════════════════════"
    Write-Error "  ❌ ERROR EJECUTANDO SQL"
    Write-Error "═══════════════════════════════════════════════════════════"
    Write-Error "Error: $_"
    Write-Host ""
    Write-Warning "Si el error persiste:"
    Write-Host "  1. Verifica que DATABASE_URL sea correcta"
    Write-Host "  2. Verifica que tienes permisos en la BD"
    Write-Host "  3. Verifica que las tablas existan"
    exit 1
}

Write-Info "Script completado exitosamente"

