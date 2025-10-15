# 🔧 SCRIPT DE ACTUALIZACIÓN MASIVA - SINGLETON PRISMA
# Actualiza todos los archivos del backend para usar el singleton Prisma
# Versión: 1.0
# Fecha: 2025-10-11

$ErrorActionPreference = "Continue"
$archivosActualizados = 0
$archivosConProblemas = 0

Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ACTUALIZACIÓN MASIVA - SINGLETON PRISMA      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "⚠️  ADVERTENCIA: Este script modificará múltiples archivos" -ForegroundColor Yellow
Write-Host "    Asegúrate de tener backup antes de continuar`n" -ForegroundColor Yellow

$confirmacion = Read-Host "¿Deseas continuar? (s/N)"
if ($confirmacion -ne "s" -and $confirmacion -ne "S") {
    Write-Host "`n❌ Operación cancelada" -ForegroundColor Red
    exit 1
}

Write-Host "`n🔍 Buscando archivos con 'new PrismaClient()'..." -ForegroundColor Yellow

# Buscar todos los archivos .ts en backend/src
$archivos = Get-ChildItem -Path "backend/src" -Filter "*.ts" -Recurse -File

foreach ($archivo in $archivos) {
    try {
        $contenido = Get-Content $archivo.FullName -Raw -Encoding UTF8
        
        # Verificar si contiene "new PrismaClient"
        if ($contenido -match "new PrismaClient\(\)") {
            Write-Host "`n📝 Procesando: $($archivo.FullName)" -ForegroundColor Cyan
            
            $modificado = $false
            
            # Patrón 1: const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient();
            if ($contenido -match "const \{ PrismaClient \} = require\('@prisma/client'\);\s*const prisma = new PrismaClient\(\);") {
                $contenido = $contenido -replace "const \{ PrismaClient \} = require\('@prisma/client'\);\s*const prisma = new PrismaClient\(\);", ""
                $modificado = $true
                Write-Host "  ✓ Removido: const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient();" -ForegroundColor Green
            }
            
            # Patrón 2: const { PrismaClient } = await import('@prisma/client'); const prisma = new PrismaClient();
            if ($contenido -match "const \{ PrismaClient \} = await import\('@prisma/client'\);\s*const prisma = new PrismaClient\(\);") {
                $contenido = $contenido -replace "const \{ PrismaClient \} = await import\('@prisma/client'\);\s*const prisma = new PrismaClient\(\);", ""
                $modificado = $true
                Write-Host "  ✓ Removido: const { PrismaClient } = await import('@prisma/client'); const prisma = new PrismaClient();" -ForegroundColor Green
            }
            
            # Patrón 3: import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient();
            if ($contenido -match "import \{ PrismaClient \} from '@prisma/client';\s*const prisma = new PrismaClient\(\);") {
                $contenido = $contenido -replace "import \{ PrismaClient \} from '@prisma/client';", "import { prisma } from '../lib/prisma';"
                $contenido = $contenido -replace "\s*const prisma = new PrismaClient\(\);", ""
                $modificado = $true
                Write-Host "  ✓ Reemplazado import de PrismaClient por singleton" -ForegroundColor Green
            }
            
            # Agregar import si no existe
            if ($contenido -notmatch "import.*prisma.*from.*lib/prisma" -and $modificado) {
                # Buscar otros imports
                if ($contenido -match "import.*from") {
                    $contenido = $contenido -replace "(import.*from ['\"].*['\"];)", "`$1`nimport { prisma } from '../lib/prisma';"
                    Write-Host "  ✓ Agregado import del singleton" -ForegroundColor Green
                }
            }
            
            if ($modificado) {
                Set-Content -Path $archivo.FullName -Value $contenido -Encoding UTF8
                $archivosActualizados++
                Write-Host "  ✅ Archivo actualizado correctamente" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️ No se pudo actualizar automáticamente" -ForegroundColor Yellow
                $archivosConProblemas++
            }
        }
    } catch {
        Write-Host "  ❌ Error procesando archivo: $_" -ForegroundColor Red
        $archivosConProblemas++
    }
}

Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              RESUMEN DE ACTUALIZACIÓN          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Archivos actualizados:    $archivosActualizados" -ForegroundColor Green
Write-Host "Archivos con problemas:   $archivosConProblemas" -ForegroundColor $(if ($archivosConProblemas -eq 0) { "Green" } else { "Yellow" })

if ($archivosActualizados -gt 0) {
    Write-Host "`n⚠️  IMPORTANTE:" -ForegroundColor Yellow
    Write-Host "   1. Revisar cambios con git diff" -ForegroundColor Yellow
    Write-Host "   2. Reiniciar backend (npm run dev)" -ForegroundColor Yellow
    Write-Host "   3. Ejecutar tests (npm test)" -ForegroundColor Yellow
}

if ($archivosConProblemas -gt 0) {
    Write-Host "`n⚠️  Revisar manualmente los archivos con problemas" -ForegroundColor Yellow
}

Write-Host ""

