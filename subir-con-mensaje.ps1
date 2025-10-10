# =====================================================
# 💬 Script de Subida a GitHub con Mensaje Personalizado
# DobackSoft V3
# =====================================================

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  SUBIR CAMBIOS A GITHUB" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar si hay cambios
Write-Host "📊 Archivos modificados:" -ForegroundColor Yellow
Write-Host ""
git status --short

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Error: Git no está disponible" -ForegroundColor Red
    Write-Host "   Instala Git desde: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# 2. Pedir mensaje del commit
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Escribe el mensaje del commit:" -ForegroundColor Green
Write-Host ""
Write-Host "   Ejemplos:" -ForegroundColor DarkGray
Write-Host "   - feat: Añadido módulo de reportes" -ForegroundColor DarkGray
Write-Host "   - fix: Corregido error en dashboard" -ForegroundColor DarkGray
Write-Host "   - Actualización de funcionalidades" -ForegroundColor DarkGray
Write-Host ""
$mensaje = Read-Host "Mensaje"

# Validar que no esté vacío
if ([string]::IsNullOrWhiteSpace($mensaje)) {
    Write-Host ""
    Write-Host "❌ El mensaje no puede estar vacío" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan

# 3. Añadir archivos
Write-Host ""
Write-Host "📦 Añadiendo archivos..." -ForegroundColor Yellow
git add .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al añadir archivos" -ForegroundColor Red
    exit 1
}

# 4. Crear commit
Write-Host "💾 Creando commit..." -ForegroundColor Yellow
git commit -m "$mensaje"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "⚠️  No hay cambios para commitear" -ForegroundColor Yellow
    exit 1
}

# 5. Subir a GitHub
Write-Host "🚀 Subiendo a GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Error al hacer push a GitHub" -ForegroundColor Red
    Write-Host "   Verifica tu conexión a internet y permisos" -ForegroundColor Yellow
    exit 1
}

# 6. Éxito
Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  CAMBIOS SUBIDOS EXITOSAMENTE" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Commit: $mensaje" -ForegroundColor Cyan
Write-Host "Repo: https://github.com/hermoso92/dobackv2" -ForegroundColor Cyan
Write-Host ""

