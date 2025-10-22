#!/usr/bin/env pwsh
$ErrorActionPreference = 'Stop'

Write-Host "AÑADIENDO IMPORTS FALTANTES DE PRISMA" -ForegroundColor Cyan

$files = @(
    'backend\src\services\DatabaseOptimizationService.ts',
    'backend\src\services\DatabaseService.ts',
    'backend\src\services\EventDetectorWithGPS.ts',
    'backend\src\services\GeofenceRuleEngine.ts',
    'backend\src\services\OrganizationService.ts',
    'backend\src\services\OverspeedProcessorService.ts',
    'backend\src\services\PostGISGeometryService.ts',
    'backend\src\services\RealTimeGeofenceService.ts',
    'backend\src\services\SessionService.ts',
    'backend\src\services\UserService.ts',
    'backend\src\services\UsuarioService.ts',
    'backend\src\services\VehicleService.ts'
)

$modified = 0

foreach ($file in $files) {
    $projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    $fullPath = Join-Path $projectRoot $file
    if (-not (Test-Path $fullPath)) {
        Write-Host "  Archivo no encontrado: $file" -ForegroundColor Yellow
        continue
    }
    
    $content = Get-Content $fullPath -Raw
    
    # Verificar si ya tiene el import
    if ($content -match "import.*prisma.*from.*lib/prisma") {
        Write-Host "  Ya tiene import: $file" -ForegroundColor Gray
        continue
    }
    
    # Verificar si usa prisma
    if ($content -notmatch "prisma\.") {
        Write-Host "  No usa prisma: $file" -ForegroundColor Gray
        continue
    }
    
    # Añadir import después de la primera línea de import
    if ($content -match "(?m)^import .* from '@prisma/client';") {
        $content = $content -replace "(?m)(^import .* from '@prisma/client';)", "`$1`nimport { prisma } from '../lib/prisma';"
        Set-Content -Path $fullPath -Value $content -NoNewline
        $modified++
        Write-Host "  Modificado: $file" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Archivos modificados: $modified" -ForegroundColor Green

$ErrorActionPreference = 'Stop'

Write-Host "AÑADIENDO IMPORTS FALTANTES DE PRISMA" -ForegroundColor Cyan

$files = @(
    'backend\src\services\DatabaseOptimizationService.ts',
    'backend\src\services\DatabaseService.ts',
    'backend\src\services\EventDetectorWithGPS.ts',
    'backend\src\services\GeofenceRuleEngine.ts',
    'backend\src\services\OrganizationService.ts',
    'backend\src\services\OverspeedProcessorService.ts',
    'backend\src\services\PostGISGeometryService.ts',
    'backend\src\services\RealTimeGeofenceService.ts',
    'backend\src\services\SessionService.ts',
    'backend\src\services\UserService.ts',
    'backend\src\services\UsuarioService.ts',
    'backend\src\services\VehicleService.ts'
)

$modified = 0

foreach ($file in $files) {
    $projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    $fullPath = Join-Path $projectRoot $file
    if (-not (Test-Path $fullPath)) {
        Write-Host "  Archivo no encontrado: $file" -ForegroundColor Yellow
        continue
    }
    
    $content = Get-Content $fullPath -Raw
    
    # Verificar si ya tiene el import
    if ($content -match "import.*prisma.*from.*lib/prisma") {
        Write-Host "  Ya tiene import: $file" -ForegroundColor Gray
        continue
    }
    
    # Verificar si usa prisma
    if ($content -notmatch "prisma\.") {
        Write-Host "  No usa prisma: $file" -ForegroundColor Gray
        continue
    }
    
    # Añadir import después de la primera línea de import
    if ($content -match "(?m)^import .* from '@prisma/client';") {
        $content = $content -replace "(?m)(^import .* from '@prisma/client';)", "`$1`nimport { prisma } from '../lib/prisma';"
        Set-Content -Path $fullPath -Value $content -NoNewline
        $modified++
        Write-Host "  Modificado: $file" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Archivos modificados: $modified" -ForegroundColor Green

$ErrorActionPreference = 'Stop'

Write-Host "AÑADIENDO IMPORTS FALTANTES DE PRISMA" -ForegroundColor Cyan

$files = @(
    'backend\src\services\DatabaseOptimizationService.ts',
    'backend\src\services\DatabaseService.ts',
    'backend\src\services\EventDetectorWithGPS.ts',
    'backend\src\services\GeofenceRuleEngine.ts',
    'backend\src\services\OrganizationService.ts',
    'backend\src\services\OverspeedProcessorService.ts',
    'backend\src\services\PostGISGeometryService.ts',
    'backend\src\services\RealTimeGeofenceService.ts',
    'backend\src\services\SessionService.ts',
    'backend\src\services\UserService.ts',
    'backend\src\services\UsuarioService.ts',
    'backend\src\services\VehicleService.ts'
)

$modified = 0

foreach ($file in $files) {
    $projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    $fullPath = Join-Path $projectRoot $file
    if (-not (Test-Path $fullPath)) {
        Write-Host "  Archivo no encontrado: $file" -ForegroundColor Yellow
        continue
    }
    
    $content = Get-Content $fullPath -Raw
    
    # Verificar si ya tiene el import
    if ($content -match "import.*prisma.*from.*lib/prisma") {
        Write-Host "  Ya tiene import: $file" -ForegroundColor Gray
        continue
    }
    
    # Verificar si usa prisma
    if ($content -notmatch "prisma\.") {
        Write-Host "  No usa prisma: $file" -ForegroundColor Gray
        continue
    }
    
    # Añadir import después de la primera línea de import
    if ($content -match "(?m)^import .* from '@prisma/client';") {
        $content = $content -replace "(?m)(^import .* from '@prisma/client';)", "`$1`nimport { prisma } from '../lib/prisma';"
        Set-Content -Path $fullPath -Value $content -NoNewline
        $modified++
        Write-Host "  Modificado: $file" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Archivos modificados: $modified" -ForegroundColor Green

$ErrorActionPreference = 'Stop'

Write-Host "AÑADIENDO IMPORTS FALTANTES DE PRISMA" -ForegroundColor Cyan

$files = @(
    'backend\src\services\DatabaseOptimizationService.ts',
    'backend\src\services\DatabaseService.ts',
    'backend\src\services\EventDetectorWithGPS.ts',
    'backend\src\services\GeofenceRuleEngine.ts',
    'backend\src\services\OrganizationService.ts',
    'backend\src\services\OverspeedProcessorService.ts',
    'backend\src\services\PostGISGeometryService.ts',
    'backend\src\services\RealTimeGeofenceService.ts',
    'backend\src\services\SessionService.ts',
    'backend\src\services\UserService.ts',
    'backend\src\services\UsuarioService.ts',
    'backend\src\services\VehicleService.ts'
)

$modified = 0

foreach ($file in $files) {
    $projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    $fullPath = Join-Path $projectRoot $file
    if (-not (Test-Path $fullPath)) {
        Write-Host "  Archivo no encontrado: $file" -ForegroundColor Yellow
        continue
    }
    
    $content = Get-Content $fullPath -Raw
    
    # Verificar si ya tiene el import
    if ($content -match "import.*prisma.*from.*lib/prisma") {
        Write-Host "  Ya tiene import: $file" -ForegroundColor Gray
        continue
    }
    
    # Verificar si usa prisma
    if ($content -notmatch "prisma\.") {
        Write-Host "  No usa prisma: $file" -ForegroundColor Gray
        continue
    }
    
    # Añadir import después de la primera línea de import
    if ($content -match "(?m)^import .* from '@prisma/client';") {
        $content = $content -replace "(?m)(^import .* from '@prisma/client';)", "`$1`nimport { prisma } from '../lib/prisma';"
        Set-Content -Path $fullPath -Value $content -NoNewline
        $modified++
        Write-Host "  Modificado: $file" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Archivos modificados: $modified" -ForegroundColor Green

$ErrorActionPreference = 'Stop'

Write-Host "AÑADIENDO IMPORTS FALTANTES DE PRISMA" -ForegroundColor Cyan

$files = @(
    'backend\src\services\DatabaseOptimizationService.ts',
    'backend\src\services\DatabaseService.ts',
    'backend\src\services\EventDetectorWithGPS.ts',
    'backend\src\services\GeofenceRuleEngine.ts',
    'backend\src\services\OrganizationService.ts',
    'backend\src\services\OverspeedProcessorService.ts',
    'backend\src\services\PostGISGeometryService.ts',
    'backend\src\services\RealTimeGeofenceService.ts',
    'backend\src\services\SessionService.ts',
    'backend\src\services\UserService.ts',
    'backend\src\services\UsuarioService.ts',
    'backend\src\services\VehicleService.ts'
)

$modified = 0

foreach ($file in $files) {
    $projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    $fullPath = Join-Path $projectRoot $file
    if (-not (Test-Path $fullPath)) {
        Write-Host "  Archivo no encontrado: $file" -ForegroundColor Yellow
        continue
    }
    
    $content = Get-Content $fullPath -Raw
    
    # Verificar si ya tiene el import
    if ($content -match "import.*prisma.*from.*lib/prisma") {
        Write-Host "  Ya tiene import: $file" -ForegroundColor Gray
        continue
    }
    
    # Verificar si usa prisma
    if ($content -notmatch "prisma\.") {
        Write-Host "  No usa prisma: $file" -ForegroundColor Gray
        continue
    }
    
    # Añadir import después de la primera línea de import
    if ($content -match "(?m)^import .* from '@prisma/client';") {
        $content = $content -replace "(?m)(^import .* from '@prisma/client';)", "`$1`nimport { prisma } from '../lib/prisma';"
        Set-Content -Path $fullPath -Value $content -NoNewline
        $modified++
        Write-Host "  Modificado: $file" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Archivos modificados: $modified" -ForegroundColor Green

