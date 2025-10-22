<#
.SYNOPSIS
    Instala las dependencias necesarias para el sistema de auditoría
    
.DESCRIPTION
    Instala Playwright y sus dependencias para automatización UI
    
.EXAMPLE
    .\scripts\testing\install-dependencies.ps1
#>

param(
    [switch]$SkipNodeCheck
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  INSTALACIÓN DE DEPENDENCIAS" -ForegroundColor Cyan
Write-Host "  Sistema de Auditoría StabilSafe V3" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Verificar Node.js
if (-not $SkipNodeCheck) {
    Write-Host "🔍 Verificando Node.js..." -ForegroundColor Yellow
    
    try {
        $nodeVersion = node --version
        Write-Host "   ✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ Node.js no encontrado" -ForegroundColor Red
        Write-Host "`n   Por favor, instala Node.js desde: https://nodejs.org/" -ForegroundColor Yellow
        Write-Host "   Se recomienda la versión LTS (18.x o superior)`n" -ForegroundColor Cyan
        exit 1
    }
    
    try {
        $npmVersion = npm --version
        Write-Host "   ✅ npm instalado: $npmVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ npm no encontrado" -ForegroundColor Red
        exit 1
    }
}

# Verificar si estamos en el directorio correcto
$rootPath = Join-Path $PSScriptRoot ".." ".."
if (-not (Test-Path (Join-Path $rootPath "package.json"))) {
    Write-Host "`n⚠️  No se encontró package.json en la raíz del proyecto" -ForegroundColor Yellow
    Write-Host "   Creando configuración de Node.js..." -ForegroundColor Cyan
    
    # Crear package.json mínimo si no existe
    $packageJson = @{
        name            = "stabilsafe-audit"
        version         = "1.0.0"
        description     = "Sistema de auditoría para Dashboard StabilSafe V3"
        scripts         = @{
            "audit-ui"           = "node scripts/testing/audit-ui-playwright.js"
            "install-playwright" = "npm install playwright && npx playwright install chromium"
        }
        devDependencies = @{
            playwright = "^1.40.0"
        }
    } | ConvertTo-Json -Depth 10
    
    Set-Content -Path (Join-Path $rootPath "package.json") -Value $packageJson
    Write-Host "   ✅ package.json creado" -ForegroundColor Green
}

# Instalar Playwright
Write-Host "`n📦 Instalando Playwright..." -ForegroundColor Yellow

Push-Location $rootPath

try {
    Write-Host "   Ejecutando: npm install playwright" -ForegroundColor Cyan
    npm install playwright
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Playwright instalado correctamente" -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ Error instalando Playwright" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    # Instalar navegadores de Playwright
    Write-Host "`n🌐 Instalando navegadores de Playwright..." -ForegroundColor Yellow
    Write-Host "   Ejecutando: npx playwright install chromium" -ForegroundColor Cyan
    npx playwright install chromium
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Navegadores instalados correctamente" -ForegroundColor Green
    }
    else {
        Write-Host "   ⚠️  Advertencia: Error instalando navegadores" -ForegroundColor Yellow
        Write-Host "   Puedes intentar manualmente: npx playwright install chromium" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "   ❌ Error durante la instalación: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
finally {
    Pop-Location
}

# Verificar instalación
Write-Host "`n✅ INSTALACIÓN COMPLETADA`n" -ForegroundColor Green

Write-Host "📋 Comandos disponibles:" -ForegroundColor Cyan
Write-Host "   • Auditoría automatizada backend:" -ForegroundColor White
Write-Host "     .\scripts\testing\audit-dashboard.ps1" -ForegroundColor Gray
Write-Host "`n   • Auditoría automatizada UI:" -ForegroundColor White
Write-Host "     node scripts\testing\audit-ui-playwright.js" -ForegroundColor Gray
Write-Host "`n   • Checklist manual UI:" -ForegroundColor White
Write-Host "     .\scripts\testing\dashboard-ui-checklist.md" -ForegroundColor Gray

Write-Host "`n🎯 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Asegúrate de que backend y frontend estén corriendo" -ForegroundColor White
Write-Host "      .\iniciar.ps1" -ForegroundColor Gray
Write-Host "`n   2. Ejecuta la auditoría automatizada" -ForegroundColor White
Write-Host "      .\scripts\testing\audit-dashboard.ps1" -ForegroundColor Gray
Write-Host "`n   3. Revisa los resultados en:" -ForegroundColor White
Write-Host "      scripts\testing\results\[timestamp]\" -ForegroundColor Gray

Write-Host "`n========================================`n" -ForegroundColor Cyan


.SYNOPSIS
Instala las dependencias necesarias para el sistema de auditoría
    
.DESCRIPTION
Instala Playwright y sus dependencias para automatización UI
    
.EXAMPLE
.\scripts\testing\install-dependencies.ps1
#>

param(
    [switch]$SkipNodeCheck
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  INSTALACIÓN DE DEPENDENCIAS" -ForegroundColor Cyan
Write-Host "  Sistema de Auditoría StabilSafe V3" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Verificar Node.js
if (-not $SkipNodeCheck) {
    Write-Host "🔍 Verificando Node.js..." -ForegroundColor Yellow
    
    try {
        $nodeVersion = node --version
        Write-Host "   ✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ Node.js no encontrado" -ForegroundColor Red
        Write-Host "`n   Por favor, instala Node.js desde: https://nodejs.org/" -ForegroundColor Yellow
        Write-Host "   Se recomienda la versión LTS (18.x o superior)`n" -ForegroundColor Cyan
        exit 1
    }
    
    try {
        $npmVersion = npm --version
        Write-Host "   ✅ npm instalado: $npmVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ npm no encontrado" -ForegroundColor Red
        exit 1
    }
}

# Verificar si estamos en el directorio correcto
$rootPath = Join-Path $PSScriptRoot ".." ".."
if (-not (Test-Path (Join-Path $rootPath "package.json"))) {
    Write-Host "`n⚠️  No se encontró package.json en la raíz del proyecto" -ForegroundColor Yellow
    Write-Host "   Creando configuración de Node.js..." -ForegroundColor Cyan
    
    # Crear package.json mínimo si no existe
    $packageJson = @{
        name            = "stabilsafe-audit"
        version         = "1.0.0"
        description     = "Sistema de auditoría para Dashboard StabilSafe V3"
        scripts         = @{
            "audit-ui"           = "node scripts/testing/audit-ui-playwright.js"
            "install-playwright" = "npm install playwright && npx playwright install chromium"
        }
        devDependencies = @{
            playwright = "^1.40.0"
        }
    } | ConvertTo-Json -Depth 10
    
    Set-Content -Path (Join-Path $rootPath "package.json") -Value $packageJson
    Write-Host "   ✅ package.json creado" -ForegroundColor Green
}

# Instalar Playwright
Write-Host "`n📦 Instalando Playwright..." -ForegroundColor Yellow

Push-Location $rootPath

try {
    Write-Host "   Ejecutando: npm install playwright" -ForegroundColor Cyan
    npm install playwright
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Playwright instalado correctamente" -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ Error instalando Playwright" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    # Instalar navegadores de Playwright
    Write-Host "`n🌐 Instalando navegadores de Playwright..." -ForegroundColor Yellow
    Write-Host "   Ejecutando: npx playwright install chromium" -ForegroundColor Cyan
    npx playwright install chromium
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Navegadores instalados correctamente" -ForegroundColor Green
    }
    else {
        Write-Host "   ⚠️  Advertencia: Error instalando navegadores" -ForegroundColor Yellow
        Write-Host "   Puedes intentar manualmente: npx playwright install chromium" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "   ❌ Error durante la instalación: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
finally {
    Pop-Location
}

# Verificar instalación
Write-Host "`n✅ INSTALACIÓN COMPLETADA`n" -ForegroundColor Green

Write-Host "📋 Comandos disponibles:" -ForegroundColor Cyan
Write-Host "   • Auditoría automatizada backend:" -ForegroundColor White
Write-Host "     .\scripts\testing\audit-dashboard.ps1" -ForegroundColor Gray
Write-Host "`n   • Auditoría automatizada UI:" -ForegroundColor White
Write-Host "     node scripts\testing\audit-ui-playwright.js" -ForegroundColor Gray
Write-Host "`n   • Checklist manual UI:" -ForegroundColor White
Write-Host "     .\scripts\testing\dashboard-ui-checklist.md" -ForegroundColor Gray

Write-Host "`n🎯 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Asegúrate de que backend y frontend estén corriendo" -ForegroundColor White
Write-Host "      .\iniciar.ps1" -ForegroundColor Gray
Write-Host "`n   2. Ejecuta la auditoría automatizada" -ForegroundColor White
Write-Host "      .\scripts\testing\audit-dashboard.ps1" -ForegroundColor Gray
Write-Host "`n   3. Revisa los resultados en:" -ForegroundColor White
Write-Host "      scripts\testing\results\[timestamp]\" -ForegroundColor Gray

Write-Host "`n========================================`n" -ForegroundColor Cyan

<#
.SYNOPSIS
    Instala las dependencias necesarias para el sistema de auditoría
    
.DESCRIPTION
    Instala Playwright y sus dependencias para automatización UI
    
.EXAMPLE
    .\scripts\testing\install-dependencies.ps1
#>

param(
    [switch]$SkipNodeCheck
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  INSTALACIÓN DE DEPENDENCIAS" -ForegroundColor Cyan
Write-Host "  Sistema de Auditoría StabilSafe V3" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Verificar Node.js
if (-not $SkipNodeCheck) {
    Write-Host "🔍 Verificando Node.js..." -ForegroundColor Yellow
    
    try {
        $nodeVersion = node --version
        Write-Host "   ✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ Node.js no encontrado" -ForegroundColor Red
        Write-Host "`n   Por favor, instala Node.js desde: https://nodejs.org/" -ForegroundColor Yellow
        Write-Host "   Se recomienda la versión LTS (18.x o superior)`n" -ForegroundColor Cyan
        exit 1
    }
    
    try {
        $npmVersion = npm --version
        Write-Host "   ✅ npm instalado: $npmVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ npm no encontrado" -ForegroundColor Red
        exit 1
    }
}

# Verificar si estamos en el directorio correcto
$rootPath = Join-Path $PSScriptRoot ".." ".."
if (-not (Test-Path (Join-Path $rootPath "package.json"))) {
    Write-Host "`n⚠️  No se encontró package.json en la raíz del proyecto" -ForegroundColor Yellow
    Write-Host "   Creando configuración de Node.js..." -ForegroundColor Cyan
    
    # Crear package.json mínimo si no existe
    $packageJson = @{
        name            = "stabilsafe-audit"
        version         = "1.0.0"
        description     = "Sistema de auditoría para Dashboard StabilSafe V3"
        scripts         = @{
            "audit-ui"           = "node scripts/testing/audit-ui-playwright.js"
            "install-playwright" = "npm install playwright && npx playwright install chromium"
        }
        devDependencies = @{
            playwright = "^1.40.0"
        }
    } | ConvertTo-Json -Depth 10
    
    Set-Content -Path (Join-Path $rootPath "package.json") -Value $packageJson
    Write-Host "   ✅ package.json creado" -ForegroundColor Green
}

# Instalar Playwright
Write-Host "`n📦 Instalando Playwright..." -ForegroundColor Yellow

Push-Location $rootPath

try {
    Write-Host "   Ejecutando: npm install playwright" -ForegroundColor Cyan
    npm install playwright
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Playwright instalado correctamente" -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ Error instalando Playwright" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    # Instalar navegadores de Playwright
    Write-Host "`n🌐 Instalando navegadores de Playwright..." -ForegroundColor Yellow
    Write-Host "   Ejecutando: npx playwright install chromium" -ForegroundColor Cyan
    npx playwright install chromium
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Navegadores instalados correctamente" -ForegroundColor Green
    }
    else {
        Write-Host "   ⚠️  Advertencia: Error instalando navegadores" -ForegroundColor Yellow
        Write-Host "   Puedes intentar manualmente: npx playwright install chromium" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "   ❌ Error durante la instalación: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
finally {
    Pop-Location
}

# Verificar instalación
Write-Host "`n✅ INSTALACIÓN COMPLETADA`n" -ForegroundColor Green

Write-Host "📋 Comandos disponibles:" -ForegroundColor Cyan
Write-Host "   • Auditoría automatizada backend:" -ForegroundColor White
Write-Host "     .\scripts\testing\audit-dashboard.ps1" -ForegroundColor Gray
Write-Host "`n   • Auditoría automatizada UI:" -ForegroundColor White
Write-Host "     node scripts\testing\audit-ui-playwright.js" -ForegroundColor Gray
Write-Host "`n   • Checklist manual UI:" -ForegroundColor White
Write-Host "     .\scripts\testing\dashboard-ui-checklist.md" -ForegroundColor Gray

Write-Host "`n🎯 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Asegúrate de que backend y frontend estén corriendo" -ForegroundColor White
Write-Host "      .\iniciar.ps1" -ForegroundColor Gray
Write-Host "`n   2. Ejecuta la auditoría automatizada" -ForegroundColor White
Write-Host "      .\scripts\testing\audit-dashboard.ps1" -ForegroundColor Gray
Write-Host "`n   3. Revisa los resultados en:" -ForegroundColor White
Write-Host "      scripts\testing\results\[timestamp]\" -ForegroundColor Gray

Write-Host "`n========================================`n" -ForegroundColor Cyan

.SYNOPSIS
Instala las dependencias necesarias para el sistema de auditoría
    
.DESCRIPTION
Instala Playwright y sus dependencias para automatización UI
    
.EXAMPLE
.\scripts\testing\install-dependencies.ps1
#>

param(
    [switch]$SkipNodeCheck
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  INSTALACIÓN DE DEPENDENCIAS" -ForegroundColor Cyan
Write-Host "  Sistema de Auditoría StabilSafe V3" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Verificar Node.js
if (-not $SkipNodeCheck) {
    Write-Host "🔍 Verificando Node.js..." -ForegroundColor Yellow
    
    try {
        $nodeVersion = node --version
        Write-Host "   ✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ Node.js no encontrado" -ForegroundColor Red
        Write-Host "`n   Por favor, instala Node.js desde: https://nodejs.org/" -ForegroundColor Yellow
        Write-Host "   Se recomienda la versión LTS (18.x o superior)`n" -ForegroundColor Cyan
        exit 1
    }
    
    try {
        $npmVersion = npm --version
        Write-Host "   ✅ npm instalado: $npmVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ npm no encontrado" -ForegroundColor Red
        exit 1
    }
}

# Verificar si estamos en el directorio correcto
$rootPath = Join-Path $PSScriptRoot ".." ".."
if (-not (Test-Path (Join-Path $rootPath "package.json"))) {
    Write-Host "`n⚠️  No se encontró package.json en la raíz del proyecto" -ForegroundColor Yellow
    Write-Host "   Creando configuración de Node.js..." -ForegroundColor Cyan
    
    # Crear package.json mínimo si no existe
    $packageJson = @{
        name            = "stabilsafe-audit"
        version         = "1.0.0"
        description     = "Sistema de auditoría para Dashboard StabilSafe V3"
        scripts         = @{
            "audit-ui"           = "node scripts/testing/audit-ui-playwright.js"
            "install-playwright" = "npm install playwright && npx playwright install chromium"
        }
        devDependencies = @{
            playwright = "^1.40.0"
        }
    } | ConvertTo-Json -Depth 10
    
    Set-Content -Path (Join-Path $rootPath "package.json") -Value $packageJson
    Write-Host "   ✅ package.json creado" -ForegroundColor Green
}

# Instalar Playwright
Write-Host "`n📦 Instalando Playwright..." -ForegroundColor Yellow

Push-Location $rootPath

try {
    Write-Host "   Ejecutando: npm install playwright" -ForegroundColor Cyan
    npm install playwright
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Playwright instalado correctamente" -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ Error instalando Playwright" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    # Instalar navegadores de Playwright
    Write-Host "`n🌐 Instalando navegadores de Playwright..." -ForegroundColor Yellow
    Write-Host "   Ejecutando: npx playwright install chromium" -ForegroundColor Cyan
    npx playwright install chromium
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Navegadores instalados correctamente" -ForegroundColor Green
    }
    else {
        Write-Host "   ⚠️  Advertencia: Error instalando navegadores" -ForegroundColor Yellow
        Write-Host "   Puedes intentar manualmente: npx playwright install chromium" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "   ❌ Error durante la instalación: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
finally {
    Pop-Location
}

# Verificar instalación
Write-Host "`n✅ INSTALACIÓN COMPLETADA`n" -ForegroundColor Green

Write-Host "📋 Comandos disponibles:" -ForegroundColor Cyan
Write-Host "   • Auditoría automatizada backend:" -ForegroundColor White
Write-Host "     .\scripts\testing\audit-dashboard.ps1" -ForegroundColor Gray
Write-Host "`n   • Auditoría automatizada UI:" -ForegroundColor White
Write-Host "     node scripts\testing\audit-ui-playwright.js" -ForegroundColor Gray
Write-Host "`n   • Checklist manual UI:" -ForegroundColor White
Write-Host "     .\scripts\testing\dashboard-ui-checklist.md" -ForegroundColor Gray

Write-Host "`n🎯 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Asegúrate de que backend y frontend estén corriendo" -ForegroundColor White
Write-Host "      .\iniciar.ps1" -ForegroundColor Gray
Write-Host "`n   2. Ejecuta la auditoría automatizada" -ForegroundColor White
Write-Host "      .\scripts\testing\audit-dashboard.ps1" -ForegroundColor Gray
Write-Host "`n   3. Revisa los resultados en:" -ForegroundColor White
Write-Host "      scripts\testing\results\[timestamp]\" -ForegroundColor Gray

Write-Host "`n========================================`n" -ForegroundColor Cyan

