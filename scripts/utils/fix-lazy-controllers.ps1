#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Convierte instanciaciones top-level de controladores a lazy factories.

.DESCRIPTION
  Busca patrones como `const xxxController = new XxxController();`
  y los reemplaza por lazy factories para evitar side-effects en carga de módulos.

.USAGE
  powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\utils\fix-lazy-controllers.ps1"
#>

$ErrorActionPreference = 'Stop'

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "CONVERSIÓN A LAZY LOADING DE CONTROLADORES" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$routesDir = Join-Path $projectRoot 'backend\src\routes'

$files = Get-ChildItem -Path $routesDir -Filter *.ts -ErrorAction SilentlyContinue

$totalFiles = 0
$modifiedFiles = 0

foreach ($file in $files) {
  try {
    $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }

    # Buscar patrón: const xxxController = new XxxController(...);
    $pattern = '(?m)^const\s+(\w+Controller)\s*=\s*new\s+(\w+Controller)\s*\([^\)]*\)\s*;'
        
    if ($content -match $pattern) {
      $totalFiles++
            
      # Extraer nombre del controlador
      $controllerVarName = $matches[1]
      $controllerClassName = $matches[2]
            
      # Reemplazar con lazy factory
      $lazyFactory = "// Lazy factory para evitar instanciación en carga de módulo`nconst get" + 
      ($controllerVarName.Substring(0, 1).ToUpper() + $controllerVarName.Substring(1)) + 
      " = () => new $controllerClassName();"
            
      $newContent = $content -replace $pattern, $lazyFactory
            
      # Reemplazar todas las referencias al controlador
      $newContent = $newContent -replace "\b$controllerVarName\.", "get$($controllerVarName.Substring(0,1).ToUpper() + $controllerVarName.Substring(1))()."
            
      # Guardar cambios
      Set-Content -Path $file.FullName -Value $newContent -NoNewline
            
      $modifiedFiles++
      Write-Host "✅ MODIFICADO: $($file.Name) - $controllerVarName -> lazy factory" -ForegroundColor Green
    }
        
  }
  catch {
    Write-Host "❌ ERROR: $($file.FullName) :: $($_.Exception.Message)" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "Archivos procesados: $totalFiles" -ForegroundColor Cyan
Write-Host "Archivos modificados: $modifiedFiles" -ForegroundColor Green
Write-Host ""
Write-Host "✅ CONVERSIÓN COMPLETADA" -ForegroundColor Green

#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Convierte instanciaciones top-level de controladores a lazy factories.

.DESCRIPTION
  Busca patrones como `const xxxController = new XxxController();`
  y los reemplaza por lazy factories para evitar side-effects en carga de módulos.

.USAGE
  powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\utils\fix-lazy-controllers.ps1"
#>

$ErrorActionPreference = 'Stop'

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "CONVERSIÓN A LAZY LOADING DE CONTROLADORES" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$routesDir = Join-Path $projectRoot 'backend\src\routes'

$files = Get-ChildItem -Path $routesDir -Filter *.ts -ErrorAction SilentlyContinue

$totalFiles = 0
$modifiedFiles = 0

foreach ($file in $files) {
  try {
    $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }

    # Buscar patrón: const xxxController = new XxxController(...);
    $pattern = '(?m)^const\s+(\w+Controller)\s*=\s*new\s+(\w+Controller)\s*\([^\)]*\)\s*;'
        
    if ($content -match $pattern) {
      $totalFiles++
            
      # Extraer nombre del controlador
      $controllerVarName = $matches[1]
      $controllerClassName = $matches[2]
            
      # Reemplazar con lazy factory
      $lazyFactory = "// Lazy factory para evitar instanciación en carga de módulo`nconst get" + 
      ($controllerVarName.Substring(0, 1).ToUpper() + $controllerVarName.Substring(1)) + 
      " = () => new $controllerClassName();"
            
      $newContent = $content -replace $pattern, $lazyFactory
            
      # Reemplazar todas las referencias al controlador
      $newContent = $newContent -replace "\b$controllerVarName\.", "get$($controllerVarName.Substring(0,1).ToUpper() + $controllerVarName.Substring(1))()."
            
      # Guardar cambios
      Set-Content -Path $file.FullName -Value $newContent -NoNewline
            
      $modifiedFiles++
      Write-Host "✅ MODIFICADO: $($file.Name) - $controllerVarName -> lazy factory" -ForegroundColor Green
    }
        
  }
  catch {
    Write-Host "❌ ERROR: $($file.FullName) :: $($_.Exception.Message)" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "Archivos procesados: $totalFiles" -ForegroundColor Cyan
Write-Host "Archivos modificados: $modifiedFiles" -ForegroundColor Green
Write-Host ""
Write-Host "✅ CONVERSIÓN COMPLETADA" -ForegroundColor Green

#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Convierte instanciaciones top-level de controladores a lazy factories.

.DESCRIPTION
  Busca patrones como `const xxxController = new XxxController();`
  y los reemplaza por lazy factories para evitar side-effects en carga de módulos.

.USAGE
  powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\utils\fix-lazy-controllers.ps1"
#>

$ErrorActionPreference = 'Stop'

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "CONVERSIÓN A LAZY LOADING DE CONTROLADORES" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$routesDir = Join-Path $projectRoot 'backend\src\routes'

$files = Get-ChildItem -Path $routesDir -Filter *.ts -ErrorAction SilentlyContinue

$totalFiles = 0
$modifiedFiles = 0

foreach ($file in $files) {
  try {
    $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }

    # Buscar patrón: const xxxController = new XxxController(...);
    $pattern = '(?m)^const\s+(\w+Controller)\s*=\s*new\s+(\w+Controller)\s*\([^\)]*\)\s*;'
        
    if ($content -match $pattern) {
      $totalFiles++
            
      # Extraer nombre del controlador
      $controllerVarName = $matches[1]
      $controllerClassName = $matches[2]
            
      # Reemplazar con lazy factory
      $lazyFactory = "// Lazy factory para evitar instanciación en carga de módulo`nconst get" + 
      ($controllerVarName.Substring(0, 1).ToUpper() + $controllerVarName.Substring(1)) + 
      " = () => new $controllerClassName();"
            
      $newContent = $content -replace $pattern, $lazyFactory
            
      # Reemplazar todas las referencias al controlador
      $newContent = $newContent -replace "\b$controllerVarName\.", "get$($controllerVarName.Substring(0,1).ToUpper() + $controllerVarName.Substring(1))()."
            
      # Guardar cambios
      Set-Content -Path $file.FullName -Value $newContent -NoNewline
            
      $modifiedFiles++
      Write-Host "✅ MODIFICADO: $($file.Name) - $controllerVarName -> lazy factory" -ForegroundColor Green
    }
        
  }
  catch {
    Write-Host "❌ ERROR: $($file.FullName) :: $($_.Exception.Message)" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "Archivos procesados: $totalFiles" -ForegroundColor Cyan
Write-Host "Archivos modificados: $modifiedFiles" -ForegroundColor Green
Write-Host ""
Write-Host "✅ CONVERSIÓN COMPLETADA" -ForegroundColor Green

#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Convierte instanciaciones top-level de controladores a lazy factories.

.DESCRIPTION
  Busca patrones como `const xxxController = new XxxController();`
  y los reemplaza por lazy factories para evitar side-effects en carga de módulos.

.USAGE
  powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\utils\fix-lazy-controllers.ps1"
#>

$ErrorActionPreference = 'Stop'

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "CONVERSIÓN A LAZY LOADING DE CONTROLADORES" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$routesDir = Join-Path $projectRoot 'backend\src\routes'

$files = Get-ChildItem -Path $routesDir -Filter *.ts -ErrorAction SilentlyContinue

$totalFiles = 0
$modifiedFiles = 0

foreach ($file in $files) {
  try {
    $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }

    # Buscar patrón: const xxxController = new XxxController(...);
    $pattern = '(?m)^const\s+(\w+Controller)\s*=\s*new\s+(\w+Controller)\s*\([^\)]*\)\s*;'
        
    if ($content -match $pattern) {
      $totalFiles++
            
      # Extraer nombre del controlador
      $controllerVarName = $matches[1]
      $controllerClassName = $matches[2]
            
      # Reemplazar con lazy factory
      $lazyFactory = "// Lazy factory para evitar instanciación en carga de módulo`nconst get" + 
      ($controllerVarName.Substring(0, 1).ToUpper() + $controllerVarName.Substring(1)) + 
      " = () => new $controllerClassName();"
            
      $newContent = $content -replace $pattern, $lazyFactory
            
      # Reemplazar todas las referencias al controlador
      $newContent = $newContent -replace "\b$controllerVarName\.", "get$($controllerVarName.Substring(0,1).ToUpper() + $controllerVarName.Substring(1))()."
            
      # Guardar cambios
      Set-Content -Path $file.FullName -Value $newContent -NoNewline
            
      $modifiedFiles++
      Write-Host "✅ MODIFICADO: $($file.Name) - $controllerVarName -> lazy factory" -ForegroundColor Green
    }
        
  }
  catch {
    Write-Host "❌ ERROR: $($file.FullName) :: $($_.Exception.Message)" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "Archivos procesados: $totalFiles" -ForegroundColor Cyan
Write-Host "Archivos modificados: $modifiedFiles" -ForegroundColor Green
Write-Host ""
Write-Host "✅ CONVERSIÓN COMPLETADA" -ForegroundColor Green

#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Convierte instanciaciones top-level de controladores a lazy factories.

.DESCRIPTION
  Busca patrones como `const xxxController = new XxxController();`
  y los reemplaza por lazy factories para evitar side-effects en carga de módulos.

.USAGE
  powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\utils\fix-lazy-controllers.ps1"
#>

$ErrorActionPreference = 'Stop'

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "CONVERSIÓN A LAZY LOADING DE CONTROLADORES" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$routesDir = Join-Path $projectRoot 'backend\src\routes'

$files = Get-ChildItem -Path $routesDir -Filter *.ts -ErrorAction SilentlyContinue

$totalFiles = 0
$modifiedFiles = 0

foreach ($file in $files) {
  try {
    $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }

    # Buscar patrón: const xxxController = new XxxController(...);
    $pattern = '(?m)^const\s+(\w+Controller)\s*=\s*new\s+(\w+Controller)\s*\([^\)]*\)\s*;'
        
    if ($content -match $pattern) {
      $totalFiles++
            
      # Extraer nombre del controlador
      $controllerVarName = $matches[1]
      $controllerClassName = $matches[2]
            
      # Reemplazar con lazy factory
      $lazyFactory = "// Lazy factory para evitar instanciación en carga de módulo`nconst get" + 
      ($controllerVarName.Substring(0, 1).ToUpper() + $controllerVarName.Substring(1)) + 
      " = () => new $controllerClassName();"
            
      $newContent = $content -replace $pattern, $lazyFactory
            
      # Reemplazar todas las referencias al controlador
      $newContent = $newContent -replace "\b$controllerVarName\.", "get$($controllerVarName.Substring(0,1).ToUpper() + $controllerVarName.Substring(1))()."
            
      # Guardar cambios
      Set-Content -Path $file.FullName -Value $newContent -NoNewline
            
      $modifiedFiles++
      Write-Host "✅ MODIFICADO: $($file.Name) - $controllerVarName -> lazy factory" -ForegroundColor Green
    }
        
  }
  catch {
    Write-Host "❌ ERROR: $($file.FullName) :: $($_.Exception.Message)" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "Archivos procesados: $totalFiles" -ForegroundColor Cyan
Write-Host "Archivos modificados: $modifiedFiles" -ForegroundColor Green
Write-Host ""
Write-Host "✅ CONVERSIÓN COMPLETADA" -ForegroundColor Green

