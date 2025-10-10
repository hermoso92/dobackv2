# Script de inicio para DobackSoft V2
Write-Host "Iniciando DobackSoft V2..." -ForegroundColor Cyan

# Verificar requisitos
Write-Host "Verificando requisitos..." -ForegroundColor Yellow

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js $nodeVersion encontrado" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Node.js no encontrado. Por favor instálalo desde https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Verificar npm
try {
    $npmVersion = npm --version
    Write-Host "[OK] npm $npmVersion encontrado" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] npm no encontrado" -ForegroundColor Red
    exit 1
}

# Instalar dependencias
Write-Host "Instalando dependencias..." -ForegroundColor Yellow
Write-Host "Instalando dependencias de Node.js..." -ForegroundColor Gray
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Error instalando dependencias de Node.js" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Dependencias instaladas correctamente" -ForegroundColor Green

# Inicializar base de datos
Write-Host "Inicializando base de datos..." -ForegroundColor Yellow

# Generar cliente de Prisma
Write-Host "Generando cliente de Prisma..." -ForegroundColor Gray
npm run prisma:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Error generando cliente de Prisma" -ForegroundColor Red
    exit 1
}

# Ejecutar migraciones
Write-Host "Ejecutando migraciones..." -ForegroundColor Gray
npm run prisma:migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Error ejecutando migraciones" -ForegroundColor Red
    exit 1
}

# Inicializar datos de prueba
Write-Host "Inicializando datos de prueba..." -ForegroundColor Gray
npm run db:init
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Error inicializando datos de prueba" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Base de datos inicializada correctamente" -ForegroundColor Green

# Iniciar aplicación
Write-Host "Iniciando aplicación..." -ForegroundColor Yellow
Write-Host "Iniciando servidor..." -ForegroundColor Gray
npm run dev 