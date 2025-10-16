# 🔍 SCRIPT DE VERIFICACIÓN SISTEMA DE UPLOAD
# Versión: 1.0
# Fecha: 2025-10-11
# Propósito: Verificar que todos los componentes del sistema de upload están operativos

param(
    [switch]$Verbose,
    [switch]$SkipTests
)

$ErrorActionPreference = "Continue"
$totalTests = 0
$passedTests = 0
$failedTests = 0

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Success,
        [string]$Message = ""
    )
    
    $script:totalTests++
    
    if ($Success) {
        $script:passedTests++
        Write-Host "✅ PASS: $TestName" -ForegroundColor Green
        if ($Message -and $Verbose) {
            Write-Host "   $Message" -ForegroundColor Gray
        }
    }
    else {
        $script:failedTests++
        Write-Host "❌ FAIL: $TestName" -ForegroundColor Red
        if ($Message) {
            Write-Host "   $Message" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  VERIFICACIÓN SISTEMA DE UPLOAD - DOBACKSOFT  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# ============================================================================
# 1. VERIFICAR ARCHIVOS CLAVE
# ============================================================================

Write-Host "`n📁 1. VERIFICANDO ARCHIVOS DEL SISTEMA..." -ForegroundColor Yellow

$requiredFiles = @(
    # Documentación
    @{ Path = "PROTOCOLOS_SISTEMA_UPLOAD.md"; Name = "Protocolos del Sistema" },
    @{ Path = "CHECKLIST_VERIFICACION_UPLOAD.md"; Name = "Checklist de Verificación" },
    @{ Path = "TROUBLESHOOTING_UPLOAD.md"; Name = "Guía de Troubleshooting" },
    
    # Frontend
    @{ Path = "frontend/src/pages/UploadPage.tsx"; Name = "Página de Upload" },
    @{ Path = "frontend/src/components/FileUploadManager.tsx"; Name = "Componente Upload Manager" },
    @{ Path = "frontend/src/utils/uploadValidator.ts"; Name = "Validador Frontend" },
    
    # Backend - Rutas
    @{ Path = "backend/src/routes/upload-unified.ts"; Name = "Ruta Upload Unificada" },
    
    # Backend - Servicios
    @{ Path = "backend/src/services/UnifiedFileProcessor.ts"; Name = "Procesador Unificado" },
    @{ Path = "backend/src/validators/uploadValidator.ts"; Name = "Validador Backend" },
    
    # Backend - Parsers
    @{ Path = "backend/src/services/parsers/MultiSessionDetector.ts"; Name = "Detector de Sesiones" },
    @{ Path = "backend/src/services/parsers/RobustGPSParser.ts"; Name = "Parser GPS" },
    @{ Path = "backend/src/services/parsers/RobustStabilityParser.ts"; Name = "Parser Estabilidad" },
    @{ Path = "backend/src/services/parsers/RobustRotativoParser.ts"; Name = "Parser Rotativo" },
    
    # Tests
    @{ Path = "backend/src/validators/__tests__/uploadValidator.test.ts"; Name = "Tests del Validador" }
)

foreach ($file in $requiredFiles) {
    $exists = Test-Path $file.Path
    Write-TestResult -TestName $file.Name -Success $exists -Message $file.Path
}

# ============================================================================
# 2. VERIFICAR BACKEND CORRIENDO
# ============================================================================

Write-Host "`n🔧 2. VERIFICANDO BACKEND..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:9998/api/health" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    $backendRunning = $response.StatusCode -eq 200
    Write-TestResult -TestName "Backend respondiendo" -Success $backendRunning -Message "Puerto 9998"
}
catch {
    Write-TestResult -TestName "Backend respondiendo" -Success $false -Message "Error: $_"
}

# ============================================================================
# 3. VERIFICAR FRONTEND CORRIENDO
# ============================================================================

Write-Host "`n🎨 3. VERIFICANDO FRONTEND..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5174" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    $frontendRunning = $response.StatusCode -eq 200
    Write-TestResult -TestName "Frontend respondiendo" -Success $frontendRunning -Message "Puerto 5174"
}
catch {
    Write-TestResult -TestName "Frontend respondiendo" -Success $false -Message "Error: $_"
}

# ============================================================================
# 4. VERIFICAR ESTRUCTURA DE DIRECTORIOS
# ============================================================================

Write-Host "`n📂 4. VERIFICANDO ESTRUCTURA DE DIRECTORIOS..." -ForegroundColor Yellow

$requiredDirs = @(
    @{ Path = "backend/src/routes"; Name = "Directorio de Rutas" },
    @{ Path = "backend/src/services"; Name = "Directorio de Servicios" },
    @{ Path = "backend/src/services/parsers"; Name = "Directorio de Parsers" },
    @{ Path = "backend/src/validators"; Name = "Directorio de Validadores" },
    @{ Path = "backend/src/validators/__tests__"; Name = "Directorio de Tests" },
    @{ Path = "frontend/src/pages"; Name = "Directorio de Páginas" },
    @{ Path = "frontend/src/components"; Name = "Directorio de Componentes" },
    @{ Path = "frontend/src/utils"; Name = "Directorio de Utilidades" },
    @{ Path = "uploads"; Name = "Directorio de Uploads" },
    @{ Path = "logs"; Name = "Directorio de Logs" }
)

foreach ($dir in $requiredDirs) {
    $exists = Test-Path $dir.Path -PathType Container
    Write-TestResult -TestName $dir.Name -Success $exists -Message $dir.Path
}

# ============================================================================
# 5. VERIFICAR DEPENDENCIAS
# ============================================================================

Write-Host "`n📦 5. VERIFICANDO DEPENDENCIAS..." -ForegroundColor Yellow

# Verificar Node.js
try {
    $nodeVersion = node --version 2>$null
    $nodeInstalled = $LASTEXITCODE -eq 0
    Write-TestResult -TestName "Node.js instalado" -Success $nodeInstalled -Message $nodeVersion
}
catch {
    Write-TestResult -TestName "Node.js instalado" -Success $false -Message "Node.js no encontrado"
}

# Verificar npm
try {
    $npmVersion = npm --version 2>$null
    $npmInstalled = $LASTEXITCODE -eq 0
    Write-TestResult -TestName "npm instalado" -Success $npmInstalled -Message $npmVersion
}
catch {
    Write-TestResult -TestName "npm instalado" -Success $false -Message "npm no encontrado"
}

# Verificar dependencias backend
$backendNodeModules = Test-Path "backend/node_modules"
Write-TestResult -TestName "Dependencias Backend" -Success $backendNodeModules -Message "backend/node_modules"

# Verificar dependencias frontend
$frontendNodeModules = Test-Path "frontend/node_modules"
Write-TestResult -TestName "Dependencias Frontend" -Success $frontendNodeModules -Message "frontend/node_modules"

# ============================================================================
# 6. VERIFICAR CONFIGURACIÓN
# ============================================================================

Write-Host "`n⚙️ 6. VERIFICANDO CONFIGURACIÓN..." -ForegroundColor Yellow

# Verificar .env
$envExists = Test-Path "backend/.env"
Write-TestResult -TestName "Archivo .env existe" -Success $envExists -Message "backend/.env"

if ($envExists) {
    $envContent = Get-Content "backend/.env" -Raw
    
    $hasDbUrl = $envContent -match "DATABASE_URL="
    Write-TestResult -TestName "DATABASE_URL configurada" -Success $hasDbUrl
    
    $hasJwtSecret = $envContent -match "JWT_SECRET="
    Write-TestResult -TestName "JWT_SECRET configurada" -Success $hasJwtSecret
    
    $hasPort = $envContent -match "PORT="
    Write-TestResult -TestName "PORT configurado" -Success $hasPort
}

# Verificar Prisma
$prismaSchema = Test-Path "backend/prisma/schema.prisma"
Write-TestResult -TestName "Schema Prisma existe" -Success $prismaSchema -Message "backend/prisma/schema.prisma"

# ============================================================================
# 7. VERIFICAR LOGS
# ============================================================================

Write-Host "`n📋 7. VERIFICANDO LOGS..." -ForegroundColor Yellow

$logFiles = @(
    @{ Path = "logs/backend.log"; Name = "Log Backend" },
    @{ Path = "logs/error.log"; Name = "Log de Errores" }
)

foreach ($log in $logFiles) {
    $exists = Test-Path $log.Path
    if ($exists) {
        $size = (Get-Item $log.Path).Length
        $sizeKB = [math]::Round($size / 1KB, 2)
        Write-TestResult -TestName $log.Name -Success $true -Message "$sizeKB KB"
        
        # Verificar errores recientes (últimas 24 horas)
        if ($Verbose) {
            $recent = Get-Content $log.Path -Tail 100 | Select-String -Pattern "ERROR|CRITICAL" | Select-Object -Last 5
            if ($recent) {
                Write-Host "   Errores recientes encontrados:" -ForegroundColor Yellow
                $recent | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
            }
        }
    }
    else {
        Write-TestResult -TestName $log.Name -Success $false -Message "No existe"
    }
}

# ============================================================================
# 8. VERIFICAR BASE DE DATOS (si es posible)
# ============================================================================

Write-Host "`n💾 8. VERIFICANDO BASE DE DATOS..." -ForegroundColor Yellow

if ($backendRunning) {
    try {
        # Intentar hacer request a un endpoint que use BD
        $response = Invoke-WebRequest -Uri "http://localhost:9998/api/vehicles" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        $dbConnected = $response.StatusCode -eq 200 -or $response.StatusCode -eq 401 # 401 = sin auth pero BD responde
        Write-TestResult -TestName "Conexión a Base de Datos" -Success $dbConnected
    }
    catch {
        Write-TestResult -TestName "Conexión a Base de Datos" -Success $false -Message "No se puede verificar"
    }
}
else {
    Write-Host "   ⚠️  Backend no está corriendo, saltando verificación de BD" -ForegroundColor Yellow
}

# ============================================================================
# 9. EJECUTAR TESTS (si no se salta)
# ============================================================================

if (-not $SkipTests) {
    Write-Host "`n🧪 9. EJECUTANDO TESTS..." -ForegroundColor Yellow
    
    # Cambiar al directorio backend
    Push-Location backend
    
    try {
        # Ejecutar tests del validador
        Write-Host "   Ejecutando tests del validador..." -ForegroundColor Gray
        $testOutput = npm test -- uploadValidator.test.ts 2>&1
        $testsPassed = $LASTEXITCODE -eq 0
        
        Write-TestResult -TestName "Tests del Validador" -Success $testsPassed
        
        if ($Verbose -and -not $testsPassed) {
            Write-Host "   Output de tests:" -ForegroundColor Yellow
            $testOutput | Select-Object -Last 20 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
        }
    }
    catch {
        Write-TestResult -TestName "Tests del Validador" -Success $false -Message "Error ejecutando tests"
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Host "`n🧪 9. TESTS SALTADOS (usar -SkipTests:$false para ejecutar)" -ForegroundColor Yellow
}

# ============================================================================
# 10. VERIFICAR INTEGRIDAD DE PROTOCOLOS
# ============================================================================

Write-Host "`n📜 10. VERIFICANDO INTEGRIDAD DE PROTOCOLOS..." -ForegroundColor Yellow

if (Test-Path "PROTOCOLOS_SISTEMA_UPLOAD.md") {
    $protocolContent = Get-Content "PROTOCOLOS_SISTEMA_UPLOAD.md" -Raw
    
    $hasFlujo = $protocolContent -match "FLUJO DE PROCESAMIENTO"
    Write-TestResult -TestName "Documentación de Flujo" -Success $hasFlujo
    
    $hasReglas = $protocolContent -match "REGLAS INMUTABLES"
    Write-TestResult -TestName "Reglas Inmutables Documentadas" -Success $hasReglas
    
    $hasValidacion = $protocolContent -match "Validación de Entrada"
    Write-TestResult -TestName "Validaciones Documentadas" -Success $hasValidacion
    
    $hasErrores = $protocolContent -match "MANEJO DE ERRORES"
    Write-TestResult -TestName "Manejo de Errores Documentado" -Success $hasErrores
}

# ============================================================================
# RESUMEN FINAL
# ============================================================================

Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              RESUMEN DE VERIFICACIÓN           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Total de tests:    $totalTests" -ForegroundColor White
Write-Host "Tests pasados:     $passedTests" -ForegroundColor Green
Write-Host "Tests fallidos:    $failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })

$successRate = [math]::Round(($passedTests / $totalTests) * 100, 1)
Write-Host "Tasa de éxito:     $successRate%" -ForegroundColor $(if ($successRate -ge 90) { "Green" } elseif ($successRate -ge 70) { "Yellow" } else { "Red" })

Write-Host ""

if ($failedTests -eq 0) {
    Write-Host "✅ SISTEMA DE UPLOAD: TODOS LOS TESTS PASADOS" -ForegroundColor Green
    exit 0
}
elseif ($successRate -ge 80) {
    Write-Host "⚠️  SISTEMA DE UPLOAD: FUNCIONAL CON ADVERTENCIAS" -ForegroundColor Yellow
    Write-Host "   Revisar tests fallidos y corregir" -ForegroundColor Yellow
    exit 1
}
else {
    Write-Host "❌ SISTEMA DE UPLOAD: PROBLEMAS CRÍTICOS DETECTADOS" -ForegroundColor Red
    Write-Host "   Revisar documentación de troubleshooting" -ForegroundColor Red
    Write-Host "   Archivo: TROUBLESHOOTING_UPLOAD.md" -ForegroundColor Yellow
    exit 2
}

