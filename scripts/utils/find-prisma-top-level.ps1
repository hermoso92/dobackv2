#!/usr/bin/env pwsh
$ErrorActionPreference = 'Stop'

Write-Host "BUSQUEDA DE USOS TOP-LEVEL DE PRISMA" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$srcDir = Join-Path $projectRoot 'backend\src'

Write-Host ""
Write-Host "SERVICIOS/CONTROLADORES EXPORTADOS COMO INSTANCIAS:" -ForegroundColor Yellow

Get-ChildItem -Path $srcDir -Recurse -Filter *.ts -ErrorAction SilentlyContinue |
Where-Object { $_.FullName -notmatch '__tests__' } |
ForEach-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -match 'export const \w+ = new \w+(Service|Controller)\(') {
        Write-Host "  $($_.Name)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "ARCHIVOS EN ROUTES QUE IMPORTAN geofenceService:" -ForegroundColor Yellow

Get-ChildItem -Path (Join-Path $srcDir 'routes') -Filter *.ts -ErrorAction SilentlyContinue |
ForEach-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -match 'geofenceService') {
        Write-Host "  $($_.Name)" -ForegroundColor Red
        $imports = ($content -split "`n" | Where-Object { $_ -match 'geofence' } | Select-Object -First 3)
        $imports | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    }
}

Write-Host ""
Write-Host "ANALISIS COMPLETADO" -ForegroundColor Green
$ErrorActionPreference = 'Stop'

Write-Host "BUSQUEDA DE USOS TOP-LEVEL DE PRISMA" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$srcDir = Join-Path $projectRoot 'backend\src'

Write-Host ""
Write-Host "SERVICIOS/CONTROLADORES EXPORTADOS COMO INSTANCIAS:" -ForegroundColor Yellow

Get-ChildItem -Path $srcDir -Recurse -Filter *.ts -ErrorAction SilentlyContinue |
Where-Object { $_.FullName -notmatch '__tests__' } |
ForEach-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -match 'export const \w+ = new \w+(Service|Controller)\(') {
        Write-Host "  $($_.Name)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "ARCHIVOS EN ROUTES QUE IMPORTAN geofenceService:" -ForegroundColor Yellow

Get-ChildItem -Path (Join-Path $srcDir 'routes') -Filter *.ts -ErrorAction SilentlyContinue |
ForEach-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -match 'geofenceService') {
        Write-Host "  $($_.Name)" -ForegroundColor Red
        $imports = ($content -split "`n" | Where-Object { $_ -match 'geofence' } | Select-Object -First 3)
        $imports | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    }
}

Write-Host ""
Write-Host "ANALISIS COMPLETADO" -ForegroundColor Green
$ErrorActionPreference = 'Stop'

Write-Host "BUSQUEDA DE USOS TOP-LEVEL DE PRISMA" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$srcDir = Join-Path $projectRoot 'backend\src'

Write-Host ""
Write-Host "SERVICIOS/CONTROLADORES EXPORTADOS COMO INSTANCIAS:" -ForegroundColor Yellow

Get-ChildItem -Path $srcDir -Recurse -Filter *.ts -ErrorAction SilentlyContinue |
Where-Object { $_.FullName -notmatch '__tests__' } |
ForEach-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -match 'export const \w+ = new \w+(Service|Controller)\(') {
        Write-Host "  $($_.Name)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "ARCHIVOS EN ROUTES QUE IMPORTAN geofenceService:" -ForegroundColor Yellow

Get-ChildItem -Path (Join-Path $srcDir 'routes') -Filter *.ts -ErrorAction SilentlyContinue |
ForEach-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -match 'geofenceService') {
        Write-Host "  $($_.Name)" -ForegroundColor Red
        $imports = ($content -split "`n" | Where-Object { $_ -match 'geofence' } | Select-Object -First 3)
        $imports | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    }
}

Write-Host ""
Write-Host "ANALISIS COMPLETADO" -ForegroundColor Green
$ErrorActionPreference = 'Stop'

Write-Host "BUSQUEDA DE USOS TOP-LEVEL DE PRISMA" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$srcDir = Join-Path $projectRoot 'backend\src'

Write-Host ""
Write-Host "SERVICIOS/CONTROLADORES EXPORTADOS COMO INSTANCIAS:" -ForegroundColor Yellow

Get-ChildItem -Path $srcDir -Recurse -Filter *.ts -ErrorAction SilentlyContinue |
Where-Object { $_.FullName -notmatch '__tests__' } |
ForEach-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -match 'export const \w+ = new \w+(Service|Controller)\(') {
        Write-Host "  $($_.Name)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "ARCHIVOS EN ROUTES QUE IMPORTAN geofenceService:" -ForegroundColor Yellow

Get-ChildItem -Path (Join-Path $srcDir 'routes') -Filter *.ts -ErrorAction SilentlyContinue |
ForEach-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -match 'geofenceService') {
        Write-Host "  $($_.Name)" -ForegroundColor Red
        $imports = ($content -split "`n" | Where-Object { $_ -match 'geofence' } | Select-Object -First 3)
        $imports | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    }
}

Write-Host ""
Write-Host "ANALISIS COMPLETADO" -ForegroundColor Green
$ErrorActionPreference = 'Stop'

Write-Host "BUSQUEDA DE USOS TOP-LEVEL DE PRISMA" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$srcDir = Join-Path $projectRoot 'backend\src'

Write-Host ""
Write-Host "SERVICIOS/CONTROLADORES EXPORTADOS COMO INSTANCIAS:" -ForegroundColor Yellow

Get-ChildItem -Path $srcDir -Recurse -Filter *.ts -ErrorAction SilentlyContinue |
Where-Object { $_.FullName -notmatch '__tests__' } |
ForEach-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -match 'export const \w+ = new \w+(Service|Controller)\(') {
        Write-Host "  $($_.Name)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "ARCHIVOS EN ROUTES QUE IMPORTAN geofenceService:" -ForegroundColor Yellow

Get-ChildItem -Path (Join-Path $srcDir 'routes') -Filter *.ts -ErrorAction SilentlyContinue |
ForEach-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -match 'geofenceService') {
        Write-Host "  $($_.Name)" -ForegroundColor Red
        $imports = ($content -split "`n" | Where-Object { $_ -match 'geofence' } | Select-Object -First 3)
        $imports | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    }
}

Write-Host ""
Write-Host "ANALISIS COMPLETADO" -ForegroundColor Green
