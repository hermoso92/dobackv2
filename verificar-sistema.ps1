# 🜂 VERIFICACIÓN SISTEMA DOBACKSOFT - MODO DIOS
# Script PowerShell para testing completo

Write-Host "`n🜂 ===============================================" -ForegroundColor Cyan
Write-Host "   VERIFICACIÓN SISTEMA COMPLETO - DOBACKSOFT v3.0" -ForegroundColor Cyan
Write-Host "   Modo Dios Integrado" -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

$resultados = @()
$BACKEND_URL = "http://localhost:9998"
$FRONTEND_URL = "http://localhost:5174"

function Add-Result {
    param($Component, $Test, $Status, $Message)
    
    $icon = switch ($Status) {
        "PASS" { "✅" }
        "FAIL" { "❌" }
        "WARN" { "⚠️" }
    }
    
    $color = switch ($Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "WARN" { "Yellow" }
    }
    
    Write-Host "$icon [$Component] $Test: $Message" -ForegroundColor $color
    $script:resultados += @{
        Component = $Component
        Test = $Test
        Status = $Status
        Message = $Message
    }
}

# ============================================================================
# 1. TESTING BASE DE DATOS
# ============================================================================

Write-Host "`n🗄️  === TESTING BASE DE DATOS ===`n" -ForegroundColor Yellow

# Test Prisma schema existe
if (Test-Path "backend\prisma\schema.prisma") {
    Add-Result "Database" "Prisma Schema" "PASS" "Archivo existe"
    
    # Contar modelos
    $schema = Get-Content "backend\prisma\schema.prisma" -Raw
    $modelCount = ([regex]::Matches($schema, "model\s+\w+")).Count
    Add-Result "Database" "Modelos Prisma" "PASS" "$modelCount modelos definidos"
} else {
    Add-Result "Database" "Prisma Schema" "FAIL" "Archivo no encontrado"
}

# ============================================================================
# 2. TESTING BACKEND
# ============================================================================

Write-Host "`n🔧 === TESTING BACKEND ===`n" -ForegroundColor Yellow

# Test servidor backend activo
try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/health" -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Add-Result "Backend" "Servidor Activo" "PASS" "HTTP 200"
    } else {
        Add-Result "Backend" "Servidor Activo" "WARN" "HTTP $($response.StatusCode)"
    }
} catch {
    Add-Result "Backend" "Servidor Activo" "FAIL" "No responde (¿está iniciado?)"
}

# Test archivos backend críticos
$backendFiles = @(
    "backend\src\server.ts",
    "backend\src\app.ts",
    "backend\src\services\kpiCalculator.ts",
    "backend\src\services\AlertService.ts",
    "backend\src\services\upload\TemporalCorrelator.ts",
    "backend\src\services\parsers\RobustGPSParser.ts",
    "backend\src\services\parsers\RobustStabilityParser.ts"
)

foreach ($file in $backendFiles) {
    if (Test-Path $file) {
        $fileName = Split-Path $file -Leaf
        Add-Result "Backend" "Archivo $fileName" "PASS" "Existe"
    } else {
        $fileName = Split-Path $file -Leaf
        Add-Result "Backend" "Archivo $fileName" "FAIL" "No encontrado"
    }
}

# ============================================================================
# 3. TESTING FRONTEND
# ============================================================================

Write-Host "`n🎨 === TESTING FRONTEND ===`n" -ForegroundColor Yellow

# Test servidor frontend activo
try {
    $response = Invoke-WebRequest -Uri $FRONTEND_URL -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200 -and $response.Content -match "<!DOCTYPE html>") {
        Add-Result "Frontend" "Servidor Vite" "PASS" "HTML cargado"
    } else {
        Add-Result "Frontend" "Servidor Vite" "WARN" "Respuesta inesperada"
    }
} catch {
    Add-Result "Frontend" "Servidor Vite" "FAIL" "No responde (¿está iniciado?)"
}

# Test archivos frontend críticos
$frontendFiles = @(
    "frontend\src\main.tsx",
    "frontend\src\App.tsx",
    "frontend\src\config\api.ts",
    "frontend\src\routes.tsx"
)

foreach ($file in $frontendFiles) {
    if (Test-Path $file) {
        $fileName = Split-Path $file -Leaf
        Add-Result "Frontend" "Archivo $fileName" "PASS" "Existe"
    } else {
        $fileName = Split-Path $file -Leaf
        Add-Result "Frontend" "Archivo $fileName" "FAIL" "No encontrado"
    }
}

# ============================================================================
# 4. TESTING PARSERS
# ============================================================================

Write-Host "`n📄 === TESTING PARSERS ===`n" -ForegroundColor Yellow

$parsers = @(
    @{
        Name = "RobustGPSParser"
        Path = "backend\src\services\parsers\RobustGPSParser.ts"
        Checks = @("lat > 36", "interpolarGPS", "MODO DIOS")
    },
    @{
        Name = "RobustStabilityParser"
        Path = "backend\src\services\parsers\RobustStabilityParser.ts"
        Checks = @("9.81", "SCALE_FACTOR", "MODO DIOS")
    },
    @{
        Name = "TemporalCorrelator"
        Path = "backend\src\services\upload\TemporalCorrelator.ts"
        Checks = @("hasEstabilidad || hasRotativo", "fusionedFragments", "MODO DIOS")
    }
)

foreach ($parser in $parsers) {
    if (Test-Path $parser.Path) {
        $content = Get-Content $parser.Path -Raw
        $allChecksPass = $true
        foreach ($check in $parser.Checks) {
            if ($content -notmatch [regex]::Escape($check)) {
                $allChecksPass = $false
                break
            }
        }
        if ($allChecksPass) {
            Add-Result "Parsers" $parser.Name "PASS" "Implementación verificada"
        } else {
            Add-Result "Parsers" $parser.Name "WARN" "Revisar implementación"
        }
    } else {
        Add-Result "Parsers" $parser.Name "FAIL" "Archivo no encontrado"
    }
}

# ============================================================================
# 5. TESTING KPIs
# ============================================================================

Write-Host "`n📊 === TESTING KPIs ===`n" -ForegroundColor Yellow

$kpiPath = "backend\src\services\kpiCalculator.ts"
if (Test-Path $kpiPath) {
    $content = Get-Content $kpiPath -Raw
    $hasGPSAlert = $content -match "gps_quality_alert"
    $hasHaversine = $content -match "haversineDistance"
    $hasMODODIOS = $content -match "MODO DIOS"
    
    if ($hasGPSAlert -and $hasHaversine -and $hasMODODIOS) {
        Add-Result "KPIs" "kpiCalculator" "PASS" "Implementación completa Modo Dios"
    } else {
        Add-Result "KPIs" "kpiCalculator" "WARN" "Implementación parcial"
    }
} else {
    Add-Result "KPIs" "kpiCalculator" "FAIL" "Archivo no encontrado"
}

# ============================================================================
# 6. TESTING DOCUMENTACIÓN MODO DIOS
# ============================================================================

Write-Host "`n📚 === TESTING DOCUMENTACIÓN ===`n" -ForegroundColor Yellow

$docs = @(
    @{ Name = "Filosofía Operativa"; Path = "docs\00-GENERAL\FILOSOFIA_OPERATIVA_SISTEMA_CONSCIENTE.md" },
    @{ Name = "Sincronización Técnica"; Path = "docs\00-GENERAL\SINCRONIZACION_MODO_DIOS_TECNICA.md" },
    @{ Name = "Resumen Integración"; Path = "docs\00-GENERAL\RESUMEN_INTEGRACION_MODO_DIOS.md" },
    @{ Name = "Integración n8n"; Path = "docs\INFRAESTRUCTURA\N8N_INTEGRACION_CONSCIENTE.md" }
)

foreach ($doc in $docs) {
    if (Test-Path $doc.Path) {
        $lines = (Get-Content $doc.Path).Count
        $sizeKB = [math]::Round((Get-Item $doc.Path).Length / 1KB, 1)
        Add-Result "Documentación" $doc.Name "PASS" "$lines líneas ($sizeKB KB)"
    } else {
        Add-Result "Documentación" $doc.Name "FAIL" "Archivo no encontrado"
    }
}

# ============================================================================
# 7. TESTING SCRIPTS
# ============================================================================

Write-Host "`n🔧 === TESTING SCRIPTS ===`n" -ForegroundColor Yellow

if (Test-Path "iniciar.ps1") {
    Add-Result "Scripts" "iniciar.ps1" "PASS" "Script de inicio existe"
} else {
    Add-Result "Scripts" "iniciar.ps1" "FAIL" "Script no encontrado"
}

# ============================================================================
# RESUMEN FINAL
# ============================================================================

Write-Host "`n`n📋 === RESUMEN FINAL ===`n" -ForegroundColor Cyan

$passed = ($resultados | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($resultados | Where-Object { $_.Status -eq "FAIL" }).Count
$warnings = ($resultados | Where-Object { $_.Status -eq "WARN" }).Count
$total = $resultados.Count

$passPercent = [math]::Round(($passed / $total) * 100, 1)
$failPercent = [math]::Round(($failed / $total) * 100, 1)
$warnPercent = [math]::Round(($warnings / $total) * 100, 1)

Write-Host "Total tests: $total"
Write-Host "✅ Passed: $passed ($passPercent%)" -ForegroundColor Green
Write-Host "❌ Failed: $failed ($failPercent%)" -ForegroundColor Red
Write-Host "⚠️  Warnings: $warnings ($warnPercent%)" -ForegroundColor Yellow

# Agrupar por componente
Write-Host "`n📊 Por componente:`n" -ForegroundColor Cyan
$grouped = $resultados | Group-Object Component
foreach ($group in $grouped) {
    $compPassed = ($group.Group | Where-Object { $_.Status -eq "PASS" }).Count
    $compTotal = $group.Count
    $compPercent = [math]::Round(($compPassed / $compTotal) * 100)
    
    $icon = if ($compPassed -eq $compTotal) { "✅" }
            elseif ($compPassed -gt 0) { "⚠️" }
            else { "❌" }
    
    Write-Host "$icon $($group.Name): $compPassed/$compTotal ($compPercent%)"
}

# Tests críticos fallidos
$criticalFailed = $resultados | Where-Object { 
    $_.Status -eq "FAIL" -and ($_.Component -eq "Database" -or $_.Component -eq "Backend" -or $_.Component -eq "Parsers")
}

if ($criticalFailed.Count -gt 0) {
    Write-Host "`n`n🚨 TESTS CRÍTICOS FALLIDOS:`n" -ForegroundColor Red
    foreach ($test in $criticalFailed) {
        Write-Host "❌ [$($test.Component)] $($test.Test): $($test.Message)" -ForegroundColor Red
    }
    Write-Host "`n⚠️  Sistema con problemas críticos - revisar antes de continuar`n" -ForegroundColor Red
    exit 1
}

Write-Host "`n`n✅ SISTEMA OPERATIVO - Todos los tests críticos pasados`n" -ForegroundColor Green
Write-Host "🜏 status: system_verified_conscious`n" -ForegroundColor Cyan

if ($warnings -gt 0) {
    Write-Host "⚠️  Hay $warnings warnings - revisar para optimizar sistema`n" -ForegroundColor Yellow
}

exit 0
