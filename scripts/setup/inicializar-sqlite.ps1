# 🚀 SCRIPT DE INICIALIZACIÓN SQLITE DOBACKSOFT
# Este script inicializa SQLite con datos reales para desarrollo

Write-Host "=========================================" -ForegroundColor Blue
Write-Host "  🚀 INICIALIZACIÓN SQLITE DOBACKSOFT" -ForegroundColor Blue
Write-Host "=========================================" -ForegroundColor Blue

# Cargar configuración
. .\config.env

Write-Host "`n📊 CONFIGURACIÓN:" -ForegroundColor Cyan
Write-Host "Database: SQLite (./data/DobackSoft.db)" -ForegroundColor White
Write-Host "URL: $DATABASE_URL" -ForegroundColor White

# Verificar si el directorio data existe
Write-Host "`n📁 VERIFICANDO DIRECTORIO DE DATOS..." -ForegroundColor Cyan

if (!(Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" -Force
    Write-Host "✅ Directorio 'data' creado" -ForegroundColor Green
} else {
    Write-Host "✅ Directorio 'data' existe" -ForegroundColor Green
}

# Verificar si el archivo de base de datos existe
if (Test-Path "data/DobackSoft.db") {
    Write-Host "✅ Base de datos SQLite existe" -ForegroundColor Green
} else {
    Write-Host "⚠️ Base de datos SQLite no existe, se creará" -ForegroundColor Yellow
}

# Ejecutar migraciones de Prisma
Write-Host "`n🔄 EJECUTANDO MIGRACIONES..." -ForegroundColor Cyan

try {
    npx prisma migrate deploy
    Write-Host "✅ Migraciones ejecutadas" -ForegroundColor Green
} catch {
    Write-Host "❌ Error en migraciones" -ForegroundColor Red
    Write-Host "Ejecuta manualmente: npx prisma migrate deploy" -ForegroundColor Yellow
}

# Generar cliente Prisma
Write-Host "`n🔧 GENERANDO CLIENTE PRISMA..." -ForegroundColor Cyan

try {
    npx prisma generate
    Write-Host "✅ Cliente Prisma generado" -ForegroundColor Green
} catch {
    Write-Host "❌ Error generando cliente Prisma" -ForegroundColor Red
}

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "  ✅ INICIALIZACIÓN SQLITE COMPLETADA" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

Write-Host "`n🎯 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "1. Ejecutar script de datos SQLite" -ForegroundColor White
Write-Host "2. Iniciar sistema completo" -ForegroundColor White
Write-Host "3. Probar dashboard con datos reales" -ForegroundColor White

Write-Host "`nPresiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
