#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Corrige archivos que usan importación dinámica de Prisma.

.DESCRIPTION
  Reemplaza `const { prisma } = await import('../config/prisma');` con imports estáticos.

.USAGE
  powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\utils\fix-dynamic-imports.ps1"
#>

$ErrorActionPreference = 'Stop'

Write-Host "CORRIGIENDO IMPORTACIONES DINAMICAS DE PRISMA" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

# Lista de archivos con importacion dinamica (del escaneo anterior, excluyendo devices.ts ya corregido)
$files = @(
    'backend\src\routes\generateEvents.ts',
    'backend\src\routes\hotspots.ts',
    'backend\src\routes\index.ts',
    'backend\src\routes\kpis-temp.ts',
    'backend\src\routes\kpis.ts',
    'backend\src\routes\speedAnalysis.ts',
    'backend\src\services\keyCalculator.ts',
    'backend\src\services\keyCalculatorBackup.ts',
    'backend\src\services\keyCalculatorFixed.ts',
    'backend\src\services\kpiCalculator.ts',
    'backend\src\services\speedAnalyzer.ts'
)

$modified = 0

foreach ($file in $files) {
    $fullPath = Join-Path $projectRoot $file
    if (-not (Test-Path $fullPath)) {
        Write-Host ("  Archivo no encontrado: " + $file) -ForegroundColor Yellow
        continue
    }

    $content = Get-Content $fullPath -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }

    $originalContent = $content

    # Patron 1: Buscar si ya tiene el import estatico
    $hasStaticImport = $content -match "import\s+\{\s*prisma\s*\}\s+from\s+"

    # Patron 2: Buscar importacion dinamica
    $hasDynamicImport = $content -match 'await\s+import\s*\(\s*[''"]\.\./'

    if ($hasDynamicImport) {
        if (-not $hasStaticImport) {
            # Anadir import estatico despues del ultimo import existente
            $importLine = "import { prisma } from '../lib/prisma';"
            $lastImportIndex = -1
            $lines = $content -split "`n"

            for ($i = $lines.Length - 1; $i -ge 0; $i--) {
                if ($lines[$i] -match '^import\s+') {
                    $lastImportIndex = $i
                    break
                }
            }

            if ($lastImportIndex -ne -1) {
                # Insertar despues del ultimo import
                $lines = $lines[0..$lastImportIndex] + $importLine + $lines[($lastImportIndex + 1)..($lines.Length - 1)]
                $content = $lines -join "`n"
            }
            else {
                # Insertar al principio si no hay imports
                $content = $importLine + "`n" + $content
            }
        }

        # Eliminar todas las lineas de importacion dinamica
        $content = $content -replace '(?m)^\s*const\s+\{\s*prisma\s*\}\s*=\s*await\s+import\s*\([^)]+\);\s*$', ''
        $content = $content -replace '(?m)^\s*const\s+prismaModule\s*=\s*await\s+import\s*\([^)]+\);\s*$', ''
        $content = $content -replace '(?m)^\s*const\s+prisma\s*=\s*prismaModule\.prisma\s*\|\|\s*prismaModule\.default;\s*$', ''

        if ($content -ne $originalContent) {
            Set-Content -Path $fullPath -Value $content -NoNewline
            $modified++
            Write-Host ("  Modificado: " + $file) -ForegroundColor Green
        }
    }
    else {
        Write-Host ("  Sin importacion dinamica: " + $file) -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host ("Archivos modificados: " + $modified)
Write-Host ""
Write-Host "CORRECCION COMPLETADA" -ForegroundColor Green

<#
.SYNOPSIS
  Corrige archivos que usan importación dinámica de Prisma.

.DESCRIPTION
  Reemplaza `const { prisma } = await import('../config/prisma');` con imports estáticos.

.USAGE
  powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\utils\fix-dynamic-imports.ps1"
#>

$ErrorActionPreference = 'Stop'

Write-Host "CORRIGIENDO IMPORTACIONES DINAMICAS DE PRISMA" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

# Lista de archivos con importacion dinamica (del escaneo anterior, excluyendo devices.ts ya corregido)
$files = @(
    'backend\src\routes\generateEvents.ts',
    'backend\src\routes\hotspots.ts',
    'backend\src\routes\index.ts',
    'backend\src\routes\kpis-temp.ts',
    'backend\src\routes\kpis.ts',
    'backend\src\routes\speedAnalysis.ts',
    'backend\src\services\keyCalculator.ts',
    'backend\src\services\keyCalculatorBackup.ts',
    'backend\src\services\keyCalculatorFixed.ts',
    'backend\src\services\kpiCalculator.ts',
    'backend\src\services\speedAnalyzer.ts'
)

$modified = 0

foreach ($file in $files) {
    $fullPath = Join-Path $projectRoot $file
    if (-not (Test-Path $fullPath)) {
        Write-Host ("  Archivo no encontrado: " + $file) -ForegroundColor Yellow
        continue
    }

    $content = Get-Content $fullPath -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }

    $originalContent = $content

    # Patron 1: Buscar si ya tiene el import estatico
    $hasStaticImport = $content -match "import\s+\{\s*prisma\s*\}\s+from\s+"

    # Patron 2: Buscar importacion dinamica
    $hasDynamicImport = $content -match 'await\s+import\s*\(\s*[''"]\.\./'

    if ($hasDynamicImport) {
        if (-not $hasStaticImport) {
            # Anadir import estatico despues del ultimo import existente
            $importLine = "import { prisma } from '../lib/prisma';"
            $lastImportIndex = -1
            $lines = $content -split "`n"

            for ($i = $lines.Length - 1; $i -ge 0; $i--) {
                if ($lines[$i] -match '^import\s+') {
                    $lastImportIndex = $i
                    break
                }
            }

            if ($lastImportIndex -ne -1) {
                # Insertar despues del ultimo import
                $lines = $lines[0..$lastImportIndex] + $importLine + $lines[($lastImportIndex + 1)..($lines.Length - 1)]
                $content = $lines -join "`n"
            }
            else {
                # Insertar al principio si no hay imports
                $content = $importLine + "`n" + $content
            }
        }

        # Eliminar todas las lineas de importacion dinamica
        $content = $content -replace '(?m)^\s*const\s+\{\s*prisma\s*\}\s*=\s*await\s+import\s*\([^)]+\);\s*$', ''
        $content = $content -replace '(?m)^\s*const\s+prismaModule\s*=\s*await\s+import\s*\([^)]+\);\s*$', ''
        $content = $content -replace '(?m)^\s*const\s+prisma\s*=\s*prismaModule\.prisma\s*\|\|\s*prismaModule\.default;\s*$', ''

        if ($content -ne $originalContent) {
            Set-Content -Path $fullPath -Value $content -NoNewline
            $modified++
            Write-Host ("  Modificado: " + $file) -ForegroundColor Green
        }
    }
    else {
        Write-Host ("  Sin importacion dinamica: " + $file) -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host ("Archivos modificados: " + $modified)
Write-Host ""
Write-Host "CORRECCION COMPLETADA" -ForegroundColor Green

<#
.SYNOPSIS
  Corrige archivos que usan importación dinámica de Prisma.

.DESCRIPTION
  Reemplaza `const { prisma } = await import('../config/prisma');` con imports estáticos.

.USAGE
  powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\utils\fix-dynamic-imports.ps1"
#>

$ErrorActionPreference = 'Stop'

Write-Host "CORRIGIENDO IMPORTACIONES DINAMICAS DE PRISMA" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

# Lista de archivos con importacion dinamica (del escaneo anterior, excluyendo devices.ts ya corregido)
$files = @(
    'backend\src\routes\generateEvents.ts',
    'backend\src\routes\hotspots.ts',
    'backend\src\routes\index.ts',
    'backend\src\routes\kpis-temp.ts',
    'backend\src\routes\kpis.ts',
    'backend\src\routes\speedAnalysis.ts',
    'backend\src\services\keyCalculator.ts',
    'backend\src\services\keyCalculatorBackup.ts',
    'backend\src\services\keyCalculatorFixed.ts',
    'backend\src\services\kpiCalculator.ts',
    'backend\src\services\speedAnalyzer.ts'
)

$modified = 0

foreach ($file in $files) {
    $fullPath = Join-Path $projectRoot $file
    if (-not (Test-Path $fullPath)) {
        Write-Host ("  Archivo no encontrado: " + $file) -ForegroundColor Yellow
        continue
    }

    $content = Get-Content $fullPath -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }

    $originalContent = $content

    # Patron 1: Buscar si ya tiene el import estatico
    $hasStaticImport = $content -match "import\s+\{\s*prisma\s*\}\s+from\s+"

    # Patron 2: Buscar importacion dinamica
    $hasDynamicImport = $content -match 'await\s+import\s*\(\s*[''"]\.\./'

    if ($hasDynamicImport) {
        if (-not $hasStaticImport) {
            # Anadir import estatico despues del ultimo import existente
            $importLine = "import { prisma } from '../lib/prisma';"
            $lastImportIndex = -1
            $lines = $content -split "`n"

            for ($i = $lines.Length - 1; $i -ge 0; $i--) {
                if ($lines[$i] -match '^import\s+') {
                    $lastImportIndex = $i
                    break
                }
            }

            if ($lastImportIndex -ne -1) {
                # Insertar despues del ultimo import
                $lines = $lines[0..$lastImportIndex] + $importLine + $lines[($lastImportIndex + 1)..($lines.Length - 1)]
                $content = $lines -join "`n"
            }
            else {
                # Insertar al principio si no hay imports
                $content = $importLine + "`n" + $content
            }
        }

        # Eliminar todas las lineas de importacion dinamica
        $content = $content -replace '(?m)^\s*const\s+\{\s*prisma\s*\}\s*=\s*await\s+import\s*\([^)]+\);\s*$', ''
        $content = $content -replace '(?m)^\s*const\s+prismaModule\s*=\s*await\s+import\s*\([^)]+\);\s*$', ''
        $content = $content -replace '(?m)^\s*const\s+prisma\s*=\s*prismaModule\.prisma\s*\|\|\s*prismaModule\.default;\s*$', ''

        if ($content -ne $originalContent) {
            Set-Content -Path $fullPath -Value $content -NoNewline
            $modified++
            Write-Host ("  Modificado: " + $file) -ForegroundColor Green
        }
    }
    else {
        Write-Host ("  Sin importacion dinamica: " + $file) -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host ("Archivos modificados: " + $modified)
Write-Host ""
Write-Host "CORRECCION COMPLETADA" -ForegroundColor Green

