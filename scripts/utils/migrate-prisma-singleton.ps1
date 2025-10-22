#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script para migrar todos los archivos a usar el singleton de PrismaClient
    
.DESCRIPTION
    Este script busca todos los archivos que estan creando instancias propias de PrismaClient
    y los migra a usar el singleton centralizado en backend/src/lib/prisma.ts
    
    Previene el error: "Too many database connections opened"
    
.NOTES
    Autor: DobackSoft AI Assistant
    Fecha: 2025-10-11
    Version: 1.0
#>

$ErrorActionPreference = "Stop"

Write-Host "===============================================================" -ForegroundColor Green
Write-Host "MIGRACION A SINGLETON DE PRISMACLIENT" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Green
Write-Host ""

# Directorio raiz del proyecto
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

# Directorio backend
$backendDir = Join-Path $projectRoot "backend\src"

# Archivo de reporte
$reportFile = Join-Path $projectRoot "temp\prisma-migration-report.txt"

# Crear directorio temp si no existe
$tempDir = Join-Path $projectRoot "temp"
if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
}

# Contadores
$totalFiles = 0
$migratedFiles = 0
$skippedFiles = 0
$errors = @()

Write-Host "Buscando archivos con 'new PrismaClient()'..." -ForegroundColor Yellow
Write-Host ""

# Buscar todos los archivos .ts que contienen 'new PrismaClient()'
$files = Get-ChildItem -Path $backendDir -Filter "*.ts" -Recurse | Where-Object {
    $content = Get-Content $_.FullName -Raw
    $content -match "new PrismaClient\(\)"
}

$totalFiles = $files.Count

Write-Host "Encontrados $totalFiles archivos a revisar" -ForegroundColor Yellow
Write-Host ""

foreach ($file in $files) {
    $relativePath = $file.FullName.Replace($projectRoot + "\", "")
    
    try {
        Write-Host "Procesando: $relativePath"
        
        $content = Get-Content $file.FullName -Raw
        $originalContent = $content
        
        # Patrones a buscar
        $patterns = @(
            @{
                Pattern     = "import\s*\{\s*PrismaClient\s*\}\s*from\s*['\`"]@prisma/client['\`"];"
                Replacement = ""
            },
            @{
                Pattern     = "const\s+prisma\s*=\s*new\s*PrismaClient\(\);"
                Replacement = ""
            },
            @{
                Pattern     = "const\s+prisma\s*=\s*new\s*PrismaClient\(\s*\{[^}]*\}\s*\);"
                Replacement = ""
            }
        )
        
        # Aplicar patrones
        foreach ($pattern in $patterns) {
            $content = $content -replace $pattern.Pattern, $pattern.Replacement
        }
        
        # Verificar si el archivo ya tiene la importacion del singleton
        if ($content -notmatch "from\s+['\`"].*lib/prisma['\`"]") {
            # Calcular la ruta relativa desde el archivo hasta lib/prisma.ts
            $fileDir = Split-Path $file.FullName
            $relativeToLib = ""
            $depth = 0
            
            while ($fileDir -ne $backendDir) {
                $fileDir = Split-Path $fileDir
                $depth++
            }
            
            # Construir la ruta relativa
            for ($i = 0; $i -lt $depth; $i++) {
                $relativeToLib += "../"
            }
            $relativeToLib += "lib/prisma"
            
            # Anadir la importacion del singleton despues de los imports existentes
            if ($content -match "(import\s+[^;]+;[\r\n]+)+") {
                $content = $content -replace "($matches[0])", "`$1import { prisma } from '$relativeToLib';`r`n"
            }
            else {
                # Si no hay imports, anadir al inicio
                $content = "import { prisma } from '$relativeToLib';`r`n`r`n" + $content
            }
        }
        
        # Verificar si hubo cambios
        if ($content -ne $originalContent) {
            # Guardar el archivo modificado
            Set-Content -Path $file.FullName -Value $content -NoNewline
            Write-Host "  Migrado exitosamente" -ForegroundColor Green
            $migratedFiles++
        }
        else {
            Write-Host "  Sin cambios necesarios" -ForegroundColor Yellow
            $skippedFiles++
        }
        
    }
    catch {
        Write-Host "  Error: $_" -ForegroundColor Red
        $errors += @{
            File  = $relativePath
            Error = $_.Exception.Message
        }
    }
    
    Write-Host ""
}

# Generar reporte
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Green
Write-Host "RESUMEN DE MIGRACION" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Total de archivos encontrados: $totalFiles"
Write-Host "Archivos migrados exitosamente: $migratedFiles" -ForegroundColor Green
Write-Host "Archivos sin cambios: $skippedFiles" -ForegroundColor Yellow
Write-Host "Errores: $($errors.Count)" -ForegroundColor Red
Write-Host ""

if ($errors.Count -gt 0) {
    Write-Host "Archivos con errores:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  - $($error.File): $($error.Error)"
    }
    Write-Host ""
}

# Guardar reporte en archivo
$report = @"
===============================================================
MIGRACION A SINGLETON DE PRISMACLIENT
===============================================================
Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Total de archivos encontrados: $totalFiles
Archivos migrados exitosamente: $migratedFiles
Archivos sin cambios: $skippedFiles
Errores: $($errors.Count)

"@

if ($errors.Count -gt 0) {
    $report += "`nArchivos con errores:`n"
    foreach ($error in $errors) {
        $report += "  - $($error.File): $($error.Error)`n"
    }
}

Set-Content -Path $reportFile -Value $report

Write-Host "Reporte guardado en: $reportFile" -ForegroundColor Green
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Green
Write-Host "MIGRACION COMPLETADA" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos pasos:"
Write-Host "  1. Revisar los archivos migrados"
Write-Host "  2. Ejecutar: npx prisma generate"
Write-Host "  3. Reiniciar el backend"
Write-Host ""
