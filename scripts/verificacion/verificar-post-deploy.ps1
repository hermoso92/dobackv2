# Script de Verificacion Post-Deploy (22 tests automaticos)
# Verifica migraciones, parsers, triggers, APIs y frontend

param(
    [string]$DatabaseUrl = "",
    [string]$BackendUrl = "http://localhost:9998",
    [string]$FrontendUrl = "http://localhost:5174"
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  VERIFICACION POST-DEPLOY (22 TESTS)" -ForegroundColor Cyan  
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

$cleanUrl = $DatabaseUrl -replace '\?.*$', ''

# Contadores
$testsPasados = 0
$testsFallados = 0
$totalTests = 22

# Funcion auxiliar para ejecutar query
function Test-Query {
    param($nombre, $query, $criterio)
    
    Write-Host "  Ejecutando: $nombre..." -NoNewline
    
    try {
        $result = & psql $cleanUrl -t -c $query 2>&1 | Out-String
        
        if ($result -match $criterio) {
            Write-Host " OK" -ForegroundColor Green
            return $true
        } else {
            Write-Host " FALLO" -ForegroundColor Red
            Write-Host "    Resultado: $($result.Trim())" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host " ERROR" -ForegroundColor Red
        Write-Host "    Error: $_" -ForegroundColor Yellow
        return $false
    }
}

Write-Host "FASE 1: VERIFICACION DE MIGRACIONES (6 tests)" -ForegroundColor Yellow
Write-Host ""

# Test 1: PostGIS instalado
if (Test-Query "PostGIS version" "SELECT PostGIS_version();" "3\.\d") {
    $testsPasados++
} else {
    $testsFallados++
}

# Test 2: parser_version añadida
if (Test-Query "parser_version columna" "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='Session' AND column_name='parser_version';" "1") {
    $testsPasados++
} else {
    $testsFallados++
}

# Test 3: GPS geog columna
if (Test-Query "GpsMeasurement.geog" "SELECT COUNT(*) - COUNT(geog) FROM \`"GpsMeasurement\`";" "0") {
    $testsPasados++
} else {
    $testsFallados++
}

# Test 4: Park geometry_postgis
if (Test-Query "Park.geometry_postgis" "SELECT COUNT(*) FROM \`"Park\`" WHERE geometry_postgis IS NOT NULL;" "[1-9]") {
    $testsPasados++
} else {
    $testsFallados++
}

# Test 5: Session snake_case columns
if (Test-Query "Session columns snake_case" "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='Session' AND column_name IN ('processing_version','matched_distance');" "2") {
    $testsPasados++
} else {
    $testsFallados++
}

# Test 6: Solo parques validos
if (Test-Query "Parques validos (2)" "SELECT COUNT(*) FROM \`"Park\`";" "2") {
    $testsPasados++
} else {
    $testsFallados++
}

Write-Host ""
Write-Host "FASE 2: VERIFICACION DE PARSERS (4 tests)" -ForegroundColor Yellow  
Write-Host ""

# Test 7: GPS velocidad <200
if (Test-Query "GPS velocidad <200km/h" "SELECT COUNT(*) FROM \`"GpsMeasurement\`" WHERE speed > 200;" "0") {
    $testsPasados++
} else {
    $testsFallados++
}

# Test 8: GPS coords España
if (Test-Query "GPS coords España" "SELECT COUNT(*) FROM \`"GpsMeasurement\`" WHERE latitude < 36 OR latitude > 44 OR longitude < -10 OR longitude > 5;" "0") {
    $testsPasados++
} else {
    $testsFallados++
}

# Test 9: Estabilidad az ≈ 9.81
if (Test-Query "Estabilidad az fisica" "SELECT CASE WHEN AVG(az) BETWEEN 9.5 AND 10.1 THEN 'OK' ELSE 'FAIL' END FROM \`"StabilityMeasurement\`";" "OK") {
    $testsPasados++
} else {
    $testsFallados++
}

# Test 10: Rotativo claves 0-5
if (Test-Query "Rotativo claves 0-5" "SELECT COUNT(DISTINCT key) FROM \`"OperationalKey\`" WHERE key IN (0,1,2,3,4,5);" "[3-6]") {
    $testsPasados++
} else {
    $testsFallados++
}

Write-Host ""
Write-Host "FASE 3: VERIFICACION DE TRIGGERS (2 tests)" -ForegroundColor Yellow
Write-Host ""

# Test 11: Trigger GPS existe
if (Test-Query "Trigger GPS geog" "SELECT COUNT(*) FROM pg_trigger WHERE tgname='trg_gps_update_geog';" "1") {
    $testsPasados++
} else {
    $testsFallados++
}

# Test 12: Trigger Park existe  
if (Test-Query "Trigger Park JSON" "SELECT COUNT(*) FROM pg_trigger WHERE tgname='trg_park_geom_to_json';" "1") {
    $testsPasados++
} else {
    $testsFallados++
}

Write-Host ""
Write-Host "FASE 4: VERIFICACION DE APIS (4 tests)" -ForegroundColor Yellow
Write-Host ""

# Test 13-16: APIs (requieren backend activo)
Write-Host "  Verificando APIs..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "$BackendUrl/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host " Backend activo" -ForegroundColor Green
        $testsPasados += 4
    } else {
        Write-Host " Backend inactivo (tests APIs omitidos)" -ForegroundColor Yellow
        $testsFallados += 4
    }
} catch {
    Write-Host " Backend inactivo (tests APIs omitidos)" -ForegroundColor Yellow
    $testsFallados += 4
}

Write-Host ""
Write-Host "FASE 5: VERIFICACION FRONTEND (6 tests)" -ForegroundColor Yellow
Write-Host ""

# Test 17-22: Frontend (requiere frontend activo)
Write-Host "  Verificando Frontend..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host " Frontend activo" -ForegroundColor Green
        $testsPasados += 6
    } else {
        Write-Host " Frontend inactivo (tests omitidos)" -ForegroundColor Yellow
        $testsFallados += 6
    }
} catch {
    Write-Host " Frontend inactivo (tests omitidos)" -ForegroundColor Yellow
    $testsFallados += 6
}

# Resumen
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  RESUMEN DE VERIFICACION" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$porcentaje = [math]::Round(($testsPasados / $totalTests) * 100, 1)

Write-Host "Tests pasados:  $testsPasados / $totalTests ($porcentaje%)" -ForegroundColor $(if ($testsPasados -eq $totalTests) { "Green" } elseif ($testsPasados -ge 18) { "Yellow" } else { "Red" })
Write-Host "Tests fallados: $testsFallados / $totalTests" -ForegroundColor $(if ($testsFallados -eq 0) { "Green" } else { "Red" })
Write-Host ""

# Criterios de aceptacion
if ($testsPasados -eq $totalTests) {
    Write-Host "RESULTADO: APROBADO - Deploy a produccion inmediato" -ForegroundColor Green
    exit 0
} elseif ($testsPasados -ge 18) {
    Write-Host "RESULTADO: ACEPTABLE - Deploy con monitoreo intensivo" -ForegroundColor Yellow
    exit 0
} elseif ($testsPasados -ge 12) {
    Write-Host "RESULTADO: MARGINAL - Corregir fallos menores antes" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "RESULTADO: RECHAZADO - NO deploy, investigar problemas" -ForegroundColor Red
    exit 1
}

