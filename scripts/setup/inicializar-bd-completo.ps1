# 🚀 SCRIPT COMPLETO DE INICIALIZACIÓN DOBACKSOFT
# Este script inicializa PostgreSQL con TODOS los datos reales para producción

Write-Host "=========================================" -ForegroundColor Blue
Write-Host "  🚀 INICIALIZACIÓN COMPLETA DOBACKSOFT" -ForegroundColor Blue
Write-Host "=========================================" -ForegroundColor Blue

# Cargar configuración
. .\config.env

Write-Host "`n📊 CONFIGURACIÓN:" -ForegroundColor Cyan
Write-Host "Database: $DB_NAME" -ForegroundColor White
Write-Host "Host: $DB_HOST:$DB_PORT" -ForegroundColor White

# Verificar si PostgreSQL está disponible
Write-Host "`n🔌 VERIFICANDO POSTGRESQL..." -ForegroundColor Cyan

try {
    $pgVersion = psql --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL disponible: $pgVersion" -ForegroundColor Green
    }
    else {
        Write-Host "❌ PostgreSQL no está instalado" -ForegroundColor Red
        Write-Host "Instala PostgreSQL desde: https://www.postgresql.org/download/" -ForegroundColor Yellow
        exit 1
    }
}
catch {
    Write-Host "❌ PostgreSQL no está disponible" -ForegroundColor Red
    exit 1
}

# Crear base de datos si no existe
Write-Host "`n🗄️ CREANDO BASE DE DATOS..." -ForegroundColor Cyan

$createDbSQL = @"
-- Crear base de datos si no existe
SELECT 'CREATE DATABASE $DB_NAME'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec
"@

try {
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c $createDbSQL
    Write-Host "✅ Base de datos '$DB_NAME' verificada/creada" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error creando base de datos" -ForegroundColor Red
    exit 1
}

# Ejecutar migraciones de Prisma
Write-Host "`n🔄 EJECUTANDO MIGRACIONES..." -ForegroundColor Cyan

try {
    npx prisma migrate deploy
    Write-Host "✅ Migraciones ejecutadas" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error en migraciones" -ForegroundColor Red
    Write-Host "Ejecuta manualmente: npx prisma migrate deploy" -ForegroundColor Yellow
}

# Generar cliente Prisma
Write-Host "`n🔧 GENERANDO CLIENTE PRISMA..." -ForegroundColor Cyan

try {
    npx prisma generate
    Write-Host "✅ Cliente Prisma generado" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error generando cliente Prisma" -ForegroundColor Red
}

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "  ✅ INICIALIZACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

Write-Host "`n🎯 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "1. Ejecutar script de datos completos" -ForegroundColor White
Write-Host "2. Conectar dashboard a datos reales" -ForegroundColor White
Write-Host "3. Eliminar datos hardcodeados" -ForegroundColor White

Write-Host "`nPresiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
