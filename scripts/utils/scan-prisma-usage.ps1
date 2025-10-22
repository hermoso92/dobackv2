#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Escanea el código para detectar usos de prisma sin import del singleton y usos en cabecera.

.DESCRIPTION
  Revisa `backend/src/routes`, `backend/src/controllers` y `backend/src/services` buscando:
  - Archivos que contienen `prisma.` pero no importan desde `lib/prisma`, `config/prisma` o `utils/db`
  - Usos de `prisma.` en las primeras 30 líneas (posibles side-effects al cargar el módulo)

.USAGE
  powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\utils\scan-prisma-usage.ps1"
#>

$ErrorActionPreference = 'Stop'

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "ESCANEO DE USO DE PRISMA (imports y usos en cabecera)" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan

# Raíz del proyecto (scripts/utils -> ..\..)
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

# Directorios a revisar
$relativeTargets = @(
    'backend\src\routes',
    'backend\src\controllers',
    'backend\src\services'
)

$targets = $relativeTargets | ForEach-Object { Join-Path $projectRoot $_ }

if ($targets.Count -eq 0) {
    Write-Host "No se encontraron directorios a escanear" -ForegroundColor Yellow
    exit 0
}

$files = Get-ChildItem -Path $targets -Recurse -Filter *.ts -ErrorAction SilentlyContinue

$totalWithPrisma = 0
$missingImport = 0
$topLevelUse = 0
$dynamicImport = 0

foreach ($file in $files) {
    try {
        # Leer como texto completo para patrones globales
        $raw = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
        if (-not $raw) { continue }

        if ($raw -notmatch 'prisma\.') { continue }

        $totalWithPrisma++

        # ¿Tiene import válido del singleton?
        $hasImport = $false
        if ($raw -match 'import\s+\{\s*prisma\s*\}\s+from\s+') { $hasImport = $true }

        # ¿Usa importación dinámica?
        $hasDynamicImport = $false
        if ($raw -match 'await\s+import\s*\(\s*[''"]\.\./.*(prisma|database)') { 
            $hasDynamicImport = $true 
            $dynamicImport++
            Write-Host ("DYNAMIC_IMPORT " + $file.FullName) -ForegroundColor Magenta
        }

        # Calcular primera línea con 'prisma.'
        $lines = Get-Content -Path $file.FullName -ErrorAction SilentlyContinue
        $firstLine = 0
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match 'prisma\.') { $firstLine = $i + 1; break }
        }

        if (-not $hasImport -and -not $hasDynamicImport) {
            $missingImport++
            Write-Host "FALTA_IMPORT $($file.FullName)" -ForegroundColor Red
        }

        if ($firstLine -gt 0 -and $firstLine -le 30) {
            $topLevelUse++
            Write-Host "USO_EN_CABECERA (línea $firstLine) $($file.FullName)" -ForegroundColor Yellow
        }

    }
    catch {
        Write-Host "ERROR $($file.FullName) :: $($_.Exception.Message)" -ForegroundColor Magenta
        Write-Host ("Archivos con importación dinámica (await import): " + $dynamicImport) -ForegroundColor Magenta
    }
}

Write-Host ""
Write-Host ("Archivos con prisma.: " + $totalWithPrisma)
Write-Host ("Archivos sin import válido del singleton: " + $missingImport) -ForegroundColor Red
Write-Host ("Archivos con importación dinámica (await import): " + $dynamicImport) -ForegroundColor Magenta
Write-Host ("Archivos con uso en cabecera (<=30 líneas): " + $topLevelUse) -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ ESCANEO COMPLETADO" -ForegroundColor Green
<#
.SYNOPSIS
  Escanea el código para detectar usos de prisma sin import del singleton y usos en cabecera.

.DESCRIPTION
  Revisa `backend/src/routes`, `backend/src/controllers` y `backend/src/services` buscando:
  - Archivos que contienen `prisma.` pero no importan desde `lib/prisma`, `config/prisma` o `utils/db`
  - Usos de `prisma.` en las primeras 30 líneas (posibles side-effects al cargar el módulo)

.USAGE
  powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\utils\scan-prisma-usage.ps1"
#>

$ErrorActionPreference = 'Stop'

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "ESCANEO DE USO DE PRISMA (imports y usos en cabecera)" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan

# Raíz del proyecto (scripts/utils -> ..\..)
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

# Directorios a revisar
$relativeTargets = @(
    'backend\src\routes',
    'backend\src\controllers',
    'backend\src\services'
)

$targets = $relativeTargets | ForEach-Object { Join-Path $projectRoot $_ }

if ($targets.Count -eq 0) {
    Write-Host "No se encontraron directorios a escanear" -ForegroundColor Yellow
    exit 0
}

$files = Get-ChildItem -Path $targets -Recurse -Filter *.ts -ErrorAction SilentlyContinue

$totalWithPrisma = 0
$missingImport = 0
$topLevelUse = 0

foreach ($file in $files) {
    try {
        # Leer como texto completo para patrones globales
        $raw = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
        if (-not $raw) { continue }

        if ($raw -notmatch 'prisma\.') { continue }

        $totalWithPrisma++

        # ¿Tiene import válido del singleton? (detección simple para evitar problemas de regex escapada)
        $hasImport = $false
        if ( ($raw -match 'lib/prisma') -or ($raw -match 'config/prisma') -or ($raw -match 'utils/db') ) {
            $hasImport = $true
        }

        # Calcular primera línea con 'prisma.'
        $lines = Get-Content -Path $file.FullName -ErrorAction SilentlyContinue
        $firstLine = 0
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match 'prisma\.') { $firstLine = $i + 1; break }
        }

        if (-not $hasImport) {
            $missingImport++
            Write-Host ("FALTA_IMPORT " + $file.FullName) -ForegroundColor Red
        }

        if ($firstLine -gt 0 -and $firstLine -le 30) {
            $topLevelUse++
            Write-Host ("USO_EN_CABECERA " + $firstLine + " " + $file.FullName) -ForegroundColor Yellow
        }

    }
    catch {
        Write-Host ("ERROR " + $file.FullName + " :: " + $_.Exception.Message) -ForegroundColor Magenta
    }
}

Write-Host "" 
Write-Host ("Archivos con prisma.: " + $totalWithPrisma)
Write-Host ("Archivos sin import válido del singleton: " + $missingImport) -ForegroundColor Red
Write-Host ("Archivos con uso en cabecera (<=30 líneas): " + $topLevelUse) -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ ESCANEO COMPLETADO" -ForegroundColor Green


<#
.SYNOPSIS
  Escanea el código para detectar usos de prisma sin import del singleton y usos en cabecera.

.DESCRIPTION
  Revisa `backend/src/routes`, `backend/src/controllers` y `backend/src/services` buscando:
  - Archivos que contienen `prisma.` pero no importan desde `lib/prisma`, `config/prisma` o `utils/db`
  - Usos de `prisma.` en las primeras 30 líneas (posibles side-effects al cargar el módulo)

.USAGE
  powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\utils\scan-prisma-usage.ps1"
#>

$ErrorActionPreference = 'Stop'

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "ESCANEO DE USO DE PRISMA (imports y usos en cabecera)" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan

# Raíz del proyecto (scripts/utils -> ..\..)
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

# Directorios a revisar
$relativeTargets = @(
    'backend\src\routes',
    'backend\src\controllers',
    'backend\src\services'
)

$targets = $relativeTargets | ForEach-Object { Join-Path $projectRoot $_ }

if ($targets.Count -eq 0) {
    Write-Host "No se encontraron directorios a escanear" -ForegroundColor Yellow
    exit 0
}

$files = Get-ChildItem -Path $targets -Recurse -Filter *.ts -ErrorAction SilentlyContinue

$totalWithPrisma = 0
$missingImport = 0
$topLevelUse = 0

foreach ($file in $files) {
    try {
        # Leer como texto completo para patrones globales
        $raw = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
        if (-not $raw) { continue }

        if ($raw -notmatch 'prisma\.') { continue }

        $totalWithPrisma++

        # ¿Tiene import válido del singleton? (detección simple para evitar problemas de regex escapada)
        $hasImport = $false
        if ( ($raw -match 'lib/prisma') -or ($raw -match 'config/prisma') -or ($raw -match 'utils/db') ) {
            $hasImport = $true
        }

        # Calcular primera línea con 'prisma.'
        $lines = Get-Content -Path $file.FullName -ErrorAction SilentlyContinue
        $firstLine = 0
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match 'prisma\.') { $firstLine = $i + 1; break }
        }

        if (-not $hasImport) {
            $missingImport++
            Write-Host ("FALTA_IMPORT " + $file.FullName) -ForegroundColor Red
        }

        if ($firstLine -gt 0 -and $firstLine -le 30) {
            $topLevelUse++
            Write-Host ("USO_EN_CABECERA " + $firstLine + " " + $file.FullName) -ForegroundColor Yellow
        }

    }
    catch {
        Write-Host ("ERROR " + $file.FullName + " :: " + $_.Exception.Message) -ForegroundColor Magenta
    }
}

Write-Host "" 
Write-Host ("Archivos con prisma.: " + $totalWithPrisma)
Write-Host ("Archivos sin import válido del singleton: " + $missingImport) -ForegroundColor Red
Write-Host ("Archivos con uso en cabecera (<=30 líneas): " + $topLevelUse) -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ ESCANEO COMPLETADO" -ForegroundColor Green


<#
.SYNOPSIS
  Escanea el código para detectar usos de prisma sin import del singleton y usos en cabecera.

.DESCRIPTION
  Revisa `backend/src/routes`, `backend/src/controllers` y `backend/src/services` buscando:
  - Archivos que contienen `prisma.` pero no importan desde `lib/prisma`, `config/prisma` o `utils/db`
  - Usos de `prisma.` en las primeras 30 líneas (posibles side-effects al cargar el módulo)

.USAGE
  powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\utils\scan-prisma-usage.ps1"
#>

$ErrorActionPreference = 'Stop'

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "ESCANEO DE USO DE PRISMA (imports y usos en cabecera)" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan

# Raíz del proyecto (scripts/utils -> ..\..)
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

# Directorios a revisar
$relativeTargets = @(
    'backend\src\routes',
    'backend\src\controllers',
    'backend\src\services'
)

$targets = $relativeTargets | ForEach-Object { Join-Path $projectRoot $_ }

if ($targets.Count -eq 0) {
    Write-Host "No se encontraron directorios a escanear" -ForegroundColor Yellow
    exit 0
}

$files = Get-ChildItem -Path $targets -Recurse -Filter *.ts -ErrorAction SilentlyContinue

$totalWithPrisma = 0
$missingImport = 0
$topLevelUse = 0

foreach ($file in $files) {
    try {
        # Leer como texto completo para patrones globales
        $raw = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
        if (-not $raw) { continue }

        if ($raw -notmatch 'prisma\.') { continue }

        $totalWithPrisma++

        # ¿Tiene import válido del singleton? (detección simple para evitar problemas de regex escapada)
        $hasImport = $false
        if ( ($raw -match 'lib/prisma') -or ($raw -match 'config/prisma') -or ($raw -match 'utils/db') ) {
            $hasImport = $true
        }

        # Calcular primera línea con 'prisma.'
        $lines = Get-Content -Path $file.FullName -ErrorAction SilentlyContinue
        $firstLine = 0
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match 'prisma\.') { $firstLine = $i + 1; break }
        }

        if (-not $hasImport) {
            $missingImport++
            Write-Host ("FALTA_IMPORT " + $file.FullName) -ForegroundColor Red
        }

        if ($firstLine -gt 0 -and $firstLine -le 30) {
            $topLevelUse++
            Write-Host ("USO_EN_CABECERA " + $firstLine + " " + $file.FullName) -ForegroundColor Yellow
        }

    }
    catch {
        Write-Host ("ERROR " + $file.FullName + " :: " + $_.Exception.Message) -ForegroundColor Magenta
    }
}

Write-Host "" 
Write-Host ("Archivos con prisma.: " + $totalWithPrisma)
Write-Host ("Archivos sin import válido del singleton: " + $missingImport) -ForegroundColor Red
Write-Host ("Archivos con uso en cabecera (<=30 líneas): " + $topLevelUse) -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ ESCANEO COMPLETADO" -ForegroundColor Green



