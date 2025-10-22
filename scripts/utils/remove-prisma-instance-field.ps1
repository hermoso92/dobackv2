#!/usr/bin/env pwsh
$ErrorActionPreference = 'Stop'

Write-Host "ELIMINANDO FIELD 'prisma' DE CLASES" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$srcDir = Join-Path $projectRoot 'backend\src'

$files = Get-ChildItem -Path $srcDir -Recurse -Filter *.ts -ErrorAction SilentlyContinue |
Where-Object { $_.FullName -notmatch '__tests__' }

$modified = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    
    $originalContent = $content
    
    # Eliminar "private prisma;" o "private prisma: any;"
    $content = $content -replace '(?m)^\s*private\s+prisma\s*;\s*$\r?\n?', ''
    $content = $content -replace '(?m)^\s*private\s+prisma\s*:\s*\w+\s*;\s*$\r?\n?', ''
    
    # Eliminar "this.prisma = prisma;" en constructores
    $content = $content -replace '(?m)^\s*this\.prisma\s*=\s*prisma;\s*(//.*)?$\r?\n?', ''
    
    # Reemplazar "this.prisma." por "prisma."
    $content = $content -replace '\bthis\.prisma\.', 'prisma.'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $modified++
        Write-Host "  Modificado: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Archivos modificados: $modified" -ForegroundColor Green

#!/usr/bin/env pwsh
$ErrorActionPreference = 'Stop'

Write-Host "ELIMINANDO FIELD 'prisma' DE CLASES" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$srcDir = Join-Path $projectRoot 'backend\src'

$files = Get-ChildItem -Path $srcDir -Recurse -Filter *.ts -ErrorAction SilentlyContinue |
Where-Object { $_.FullName -notmatch '__tests__' }

$modified = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    
    $originalContent = $content
    
    # Eliminar "private prisma;" o "private prisma: any;"
    $content = $content -replace '(?m)^\s*private\s+prisma\s*;\s*$\r?\n?', ''
    $content = $content -replace '(?m)^\s*private\s+prisma\s*:\s*\w+\s*;\s*$\r?\n?', ''
    
    # Eliminar "this.prisma = prisma;" en constructores
    $content = $content -replace '(?m)^\s*this\.prisma\s*=\s*prisma;\s*(//.*)?$\r?\n?', ''
    
    # Reemplazar "this.prisma." por "prisma."
    $content = $content -replace '\bthis\.prisma\.', 'prisma.'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $modified++
        Write-Host "  Modificado: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Archivos modificados: $modified" -ForegroundColor Green

#!/usr/bin/env pwsh
$ErrorActionPreference = 'Stop'

Write-Host "ELIMINANDO FIELD 'prisma' DE CLASES" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$srcDir = Join-Path $projectRoot 'backend\src'

$files = Get-ChildItem -Path $srcDir -Recurse -Filter *.ts -ErrorAction SilentlyContinue |
Where-Object { $_.FullName -notmatch '__tests__' }

$modified = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    
    $originalContent = $content
    
    # Eliminar "private prisma;" o "private prisma: any;"
    $content = $content -replace '(?m)^\s*private\s+prisma\s*;\s*$\r?\n?', ''
    $content = $content -replace '(?m)^\s*private\s+prisma\s*:\s*\w+\s*;\s*$\r?\n?', ''
    
    # Eliminar "this.prisma = prisma;" en constructores
    $content = $content -replace '(?m)^\s*this\.prisma\s*=\s*prisma;\s*(//.*)?$\r?\n?', ''
    
    # Reemplazar "this.prisma." por "prisma."
    $content = $content -replace '\bthis\.prisma\.', 'prisma.'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $modified++
        Write-Host "  Modificado: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Archivos modificados: $modified" -ForegroundColor Green

#!/usr/bin/env pwsh
$ErrorActionPreference = 'Stop'

Write-Host "ELIMINANDO FIELD 'prisma' DE CLASES" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$srcDir = Join-Path $projectRoot 'backend\src'

$files = Get-ChildItem -Path $srcDir -Recurse -Filter *.ts -ErrorAction SilentlyContinue |
Where-Object { $_.FullName -notmatch '__tests__' }

$modified = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    
    $originalContent = $content
    
    # Eliminar "private prisma;" o "private prisma: any;"
    $content = $content -replace '(?m)^\s*private\s+prisma\s*;\s*$\r?\n?', ''
    $content = $content -replace '(?m)^\s*private\s+prisma\s*:\s*\w+\s*;\s*$\r?\n?', ''
    
    # Eliminar "this.prisma = prisma;" en constructores
    $content = $content -replace '(?m)^\s*this\.prisma\s*=\s*prisma;\s*(//.*)?$\r?\n?', ''
    
    # Reemplazar "this.prisma." por "prisma."
    $content = $content -replace '\bthis\.prisma\.', 'prisma.'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $modified++
        Write-Host "  Modificado: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Archivos modificados: $modified" -ForegroundColor Green

#!/usr/bin/env pwsh
$ErrorActionPreference = 'Stop'

Write-Host "ELIMINANDO FIELD 'prisma' DE CLASES" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$srcDir = Join-Path $projectRoot 'backend\src'

$files = Get-ChildItem -Path $srcDir -Recurse -Filter *.ts -ErrorAction SilentlyContinue |
Where-Object { $_.FullName -notmatch '__tests__' }

$modified = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    
    $originalContent = $content
    
    # Eliminar "private prisma;" o "private prisma: any;"
    $content = $content -replace '(?m)^\s*private\s+prisma\s*;\s*$\r?\n?', ''
    $content = $content -replace '(?m)^\s*private\s+prisma\s*:\s*\w+\s*;\s*$\r?\n?', ''
    
    # Eliminar "this.prisma = prisma;" en constructores
    $content = $content -replace '(?m)^\s*this\.prisma\s*=\s*prisma;\s*(//.*)?$\r?\n?', ''
    
    # Reemplazar "this.prisma." por "prisma."
    $content = $content -replace '\bthis\.prisma\.', 'prisma.'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $modified++
        Write-Host "  Modificado: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Archivos modificados: $modified" -ForegroundColor Green

