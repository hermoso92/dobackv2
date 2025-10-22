#!/usr/bin/env pwsh
$ErrorActionPreference = 'Stop'

Write-Host "CONVIRTIENDO TODOS LOS CONTROLADORES A LAZY LOADING" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$routesDir = Join-Path $projectRoot 'backend\src\routes'

$files = Get-ChildItem -Path $routesDir -Filter *.ts -ErrorAction SilentlyContinue
$modified = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    
    $originalContent = $content
    
    # Patrón 1: const xxxController = new XxxController(...);
    # Patrón 2: const controller = new XxxController(...);
    $pattern = '(?m)^const\s+(controller|\w+Controller)\s*=\s*new\s+(\w+Controller)\s*\([^\)]*\)\s*;'
    
    if ($content -match $pattern) {
        $controllerVarName = $matches[1]
        $controllerClassName = $matches[2]
        
        # Reemplazar con lazy factory
        if ($controllerVarName -eq 'controller') {
            $getterName = "get" + $controllerClassName
        }
        else {
            $getterName = "get" + $controllerVarName.Substring(0, 1).ToUpper() + $controllerVarName.Substring(1)
        }
        $lazyFactory = "// Lazy factory para evitar instanciación en carga de módulo`nconst $getterName = () => new $controllerClassName();"
        
        $content = $content -replace $pattern, $lazyFactory
        
        # Reemplazar todas las referencias directas al controlador
        # xxxController.method -> getXxxController().method
        $content = $content -replace "\b$controllerVarName\.(\w+)", "$getterName().$1"
        
        # Reemplazar en callbacks: (req, res) => xxxController.method(req, res)
        # Ya debería estar cubierto por el replace anterior
        
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $modified++
        Write-Host "  Modificado: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Archivos modificados: $modified" -ForegroundColor Green
Write-Host ""
Write-Host "CONVERSION COMPLETADA" -ForegroundColor Green

$ErrorActionPreference = 'Stop'

Write-Host "CONVIRTIENDO TODOS LOS CONTROLADORES A LAZY LOADING" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$routesDir = Join-Path $projectRoot 'backend\src\routes'

$files = Get-ChildItem -Path $routesDir -Filter *.ts -ErrorAction SilentlyContinue
$modified = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    
    $originalContent = $content
    
    # Patrón 1: const xxxController = new XxxController(...);
    # Patrón 2: const controller = new XxxController(...);
    $pattern = '(?m)^const\s+(controller|\w+Controller)\s*=\s*new\s+(\w+Controller)\s*\([^\)]*\)\s*;'
    
    if ($content -match $pattern) {
        $controllerVarName = $matches[1]
        $controllerClassName = $matches[2]
        
        # Reemplazar con lazy factory
        if ($controllerVarName -eq 'controller') {
            $getterName = "get" + $controllerClassName
        }
        else {
            $getterName = "get" + $controllerVarName.Substring(0, 1).ToUpper() + $controllerVarName.Substring(1)
        }
        $lazyFactory = "// Lazy factory para evitar instanciación en carga de módulo`nconst $getterName = () => new $controllerClassName();"
        
        $content = $content -replace $pattern, $lazyFactory
        
        # Reemplazar todas las referencias directas al controlador
        # xxxController.method -> getXxxController().method
        $content = $content -replace "\b$controllerVarName\.(\w+)", "$getterName().$1"
        
        # Reemplazar en callbacks: (req, res) => xxxController.method(req, res)
        # Ya debería estar cubierto por el replace anterior
        
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $modified++
        Write-Host "  Modificado: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Archivos modificados: $modified" -ForegroundColor Green
Write-Host ""
Write-Host "CONVERSION COMPLETADA" -ForegroundColor Green

$ErrorActionPreference = 'Stop'

Write-Host "CONVIRTIENDO TODOS LOS CONTROLADORES A LAZY LOADING" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$routesDir = Join-Path $projectRoot 'backend\src\routes'

$files = Get-ChildItem -Path $routesDir -Filter *.ts -ErrorAction SilentlyContinue
$modified = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    
    $originalContent = $content
    
    # Patrón 1: const xxxController = new XxxController(...);
    # Patrón 2: const controller = new XxxController(...);
    $pattern = '(?m)^const\s+(controller|\w+Controller)\s*=\s*new\s+(\w+Controller)\s*\([^\)]*\)\s*;'
    
    if ($content -match $pattern) {
        $controllerVarName = $matches[1]
        $controllerClassName = $matches[2]
        
        # Reemplazar con lazy factory
        if ($controllerVarName -eq 'controller') {
            $getterName = "get" + $controllerClassName
        }
        else {
            $getterName = "get" + $controllerVarName.Substring(0, 1).ToUpper() + $controllerVarName.Substring(1)
        }
        $lazyFactory = "// Lazy factory para evitar instanciación en carga de módulo`nconst $getterName = () => new $controllerClassName();"
        
        $content = $content -replace $pattern, $lazyFactory
        
        # Reemplazar todas las referencias directas al controlador
        # xxxController.method -> getXxxController().method
        $content = $content -replace "\b$controllerVarName\.(\w+)", "$getterName().$1"
        
        # Reemplazar en callbacks: (req, res) => xxxController.method(req, res)
        # Ya debería estar cubierto por el replace anterior
        
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $modified++
        Write-Host "  Modificado: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Archivos modificados: $modified" -ForegroundColor Green
Write-Host ""
Write-Host "CONVERSION COMPLETADA" -ForegroundColor Green

$ErrorActionPreference = 'Stop'

Write-Host "CONVIRTIENDO TODOS LOS CONTROLADORES A LAZY LOADING" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$routesDir = Join-Path $projectRoot 'backend\src\routes'

$files = Get-ChildItem -Path $routesDir -Filter *.ts -ErrorAction SilentlyContinue
$modified = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    
    $originalContent = $content
    
    # Patrón 1: const xxxController = new XxxController(...);
    # Patrón 2: const controller = new XxxController(...);
    $pattern = '(?m)^const\s+(controller|\w+Controller)\s*=\s*new\s+(\w+Controller)\s*\([^\)]*\)\s*;'
    
    if ($content -match $pattern) {
        $controllerVarName = $matches[1]
        $controllerClassName = $matches[2]
        
        # Reemplazar con lazy factory
        if ($controllerVarName -eq 'controller') {
            $getterName = "get" + $controllerClassName
        }
        else {
            $getterName = "get" + $controllerVarName.Substring(0, 1).ToUpper() + $controllerVarName.Substring(1)
        }
        $lazyFactory = "// Lazy factory para evitar instanciación en carga de módulo`nconst $getterName = () => new $controllerClassName();"
        
        $content = $content -replace $pattern, $lazyFactory
        
        # Reemplazar todas las referencias directas al controlador
        # xxxController.method -> getXxxController().method
        $content = $content -replace "\b$controllerVarName\.(\w+)", "$getterName().$1"
        
        # Reemplazar en callbacks: (req, res) => xxxController.method(req, res)
        # Ya debería estar cubierto por el replace anterior
        
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $modified++
        Write-Host "  Modificado: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Archivos modificados: $modified" -ForegroundColor Green
Write-Host ""
Write-Host "CONVERSION COMPLETADA" -ForegroundColor Green

$ErrorActionPreference = 'Stop'

Write-Host "CONVIRTIENDO TODOS LOS CONTROLADORES A LAZY LOADING" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$routesDir = Join-Path $projectRoot 'backend\src\routes'

$files = Get-ChildItem -Path $routesDir -Filter *.ts -ErrorAction SilentlyContinue
$modified = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    
    $originalContent = $content
    
    # Patrón 1: const xxxController = new XxxController(...);
    # Patrón 2: const controller = new XxxController(...);
    $pattern = '(?m)^const\s+(controller|\w+Controller)\s*=\s*new\s+(\w+Controller)\s*\([^\)]*\)\s*;'
    
    if ($content -match $pattern) {
        $controllerVarName = $matches[1]
        $controllerClassName = $matches[2]
        
        # Reemplazar con lazy factory
        if ($controllerVarName -eq 'controller') {
            $getterName = "get" + $controllerClassName
        }
        else {
            $getterName = "get" + $controllerVarName.Substring(0, 1).ToUpper() + $controllerVarName.Substring(1)
        }
        $lazyFactory = "// Lazy factory para evitar instanciación en carga de módulo`nconst $getterName = () => new $controllerClassName();"
        
        $content = $content -replace $pattern, $lazyFactory
        
        # Reemplazar todas las referencias directas al controlador
        # xxxController.method -> getXxxController().method
        $content = $content -replace "\b$controllerVarName\.(\w+)", "$getterName().$1"
        
        # Reemplazar en callbacks: (req, res) => xxxController.method(req, res)
        # Ya debería estar cubierto por el replace anterior
        
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $modified++
        Write-Host "  Modificado: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Archivos modificados: $modified" -ForegroundColor Green
Write-Host ""
Write-Host "CONVERSION COMPLETADA" -ForegroundColor Green

