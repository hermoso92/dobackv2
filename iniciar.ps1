# Script único de inicio para DobackSoft V3
# Método oficial para iniciar todo el sistema

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DOBACKSOFT V3 - INICIO COMPLETO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Directorio raíz del proyecto
$projectRoot = $PSScriptRoot
$backendDir = Join-Path $projectRoot "backend"
$frontendDir = Join-Path $projectRoot "frontend"

# 🆕 LIMPIEZA DE PROCESOS ANTERIORES
Write-Host "[0] Limpiando procesos anteriores..." -ForegroundColor Yellow

# Limpiar procesos Node.js antiguos
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   Encontrados $($nodeProcesses.Count) procesos Node.js" -ForegroundColor Gray
    Write-Host "   Cerrando procesos anteriores..." -ForegroundColor Gray
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "   [OK] Procesos Node.js limpiados" -ForegroundColor Green
} else {
    Write-Host "   [OK] No hay procesos Node.js previos" -ForegroundColor Green
}

# Liberar puertos si están en uso
$backendPort = 9998
$frontendPort = 5174

$backendConn = Get-NetTCPConnection -LocalPort $backendPort -ErrorAction SilentlyContinue
if ($backendConn) {
    Write-Host "   Liberando puerto $backendPort..." -ForegroundColor Gray
    $backendPID = $backendConn.OwningProcess
    Stop-Process -Id $backendPID -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Write-Host "   [OK] Puerto $backendPort liberado" -ForegroundColor Green
}

$frontendConn = Get-NetTCPConnection -LocalPort $frontendPort -ErrorAction SilentlyContinue
if ($frontendConn) {
    Write-Host "   Liberando puerto $frontendPort..." -ForegroundColor Gray
    $frontendPID = $frontendConn.OwningProcess
    Stop-Process -Id $frontendPID -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Write-Host "   [OK] Puerto $frontendPort liberado" -ForegroundColor Green
}

Write-Host ""

# Verificar que los directorios existen
if (-not (Test-Path $backendDir)) {
    Write-Host "[ERROR] Directorio backend no encontrado: $backendDir" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $frontendDir)) {
    Write-Host "[ERROR] Directorio frontend no encontrado: $frontendDir" -ForegroundColor Red
    exit 1
}

Write-Host "[1] Verificando estructura del proyecto..." -ForegroundColor Yellow
Write-Host "   [OK] Backend: $backendDir" -ForegroundColor Green
Write-Host "   [OK] Frontend: $frontendDir" -ForegroundColor Green
Write-Host ""

# Verificar Node.js
Write-Host "[2] Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   [OK] Node.js $nodeVersion disponible" -ForegroundColor Green
}
catch {
    Write-Host "   [ERROR] Node.js no está instalado" -ForegroundColor Red
    Write-Host "   Instala Node.js desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Verificar npm
Write-Host "[3] Verificando npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "   [OK] npm $npmVersion disponible" -ForegroundColor Green
}
catch {
    Write-Host "   [ERROR] npm no está instalado" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Verificar puertos (ya deberían estar libres)
Write-Host "[4] Verificando puertos..." -ForegroundColor Yellow

$backendProcess = Get-NetTCPConnection -LocalPort $backendPort -ErrorAction SilentlyContinue
if ($backendProcess) {
    Write-Host "   [ERROR] Puerto $backendPort AÚN en uso después de limpieza" -ForegroundColor Red
    Write-Host "   PID: $($backendProcess.OwningProcess)" -ForegroundColor Gray
    Write-Host "   Intentando liberar nuevamente..." -ForegroundColor Yellow
    Stop-Process -Id $backendProcess.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}
else {
    Write-Host "   [OK] Puerto $backendPort disponible" -ForegroundColor Green
}

$frontendProcess = Get-NetTCPConnection -LocalPort $frontendPort -ErrorAction SilentlyContinue
if ($frontendProcess) {
    Write-Host "   [ERROR] Puerto $frontendPort AÚN en uso después de limpieza" -ForegroundColor Red
    Write-Host "   PID: $($frontendProcess.OwningProcess)" -ForegroundColor Gray
    Write-Host "   Intentando liberar nuevamente..." -ForegroundColor Yellow
    Stop-Process -Id $frontendProcess.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}
else {
    Write-Host "   [OK] Puerto $frontendPort disponible" -ForegroundColor Green
}
Write-Host ""

# Verificar .env en backend
Write-Host "[5] Verificando configuración del backend..." -ForegroundColor Yellow
$backendEnv = Join-Path $backendDir ".env"
if (-not (Test-Path $backendEnv)) {
    Write-Host "   [WARNING] Archivo .env no encontrado en backend" -ForegroundColor Yellow
    Write-Host "   Algunas variables de entorno pueden faltar" -ForegroundColor Gray
}
else {
    Write-Host "   [OK] Archivo .env encontrado" -ForegroundColor Green
    
    # Verificar variables críticas
    $envContent = Get-Content $backendEnv -Raw
    if ($envContent -notmatch "JWT_SECRET") {
        Write-Host "   [WARNING] JWT_SECRET no encontrado en .env" -ForegroundColor Yellow
    }
    if ($envContent -notmatch "JWT_REFRESH_SECRET") {
        Write-Host "   [WARNING] JWT_REFRESH_SECRET no encontrado en .env" -ForegroundColor Yellow
    }
    if ($envContent -notmatch "DATABASE_URL") {
        Write-Host "   [WARNING] DATABASE_URL no encontrado en .env" -ForegroundColor Yellow
    }
}
Write-Host ""

# Verificar node_modules
Write-Host "[6] Verificando dependencias..." -ForegroundColor Yellow
$backendNodeModules = Join-Path $backendDir "node_modules"
$frontendNodeModules = Join-Path $frontendDir "node_modules"

if (-not (Test-Path $backendNodeModules)) {
    Write-Host "   [WARNING] node_modules del backend no encontrado" -ForegroundColor Yellow
    Write-Host "   Instalando dependencias del backend..." -ForegroundColor Gray
    Set-Location $backendDir
    npm install
    Set-Location $projectRoot
}
else {
    Write-Host "   [OK] Dependencias del backend instaladas" -ForegroundColor Green
}

if (-not (Test-Path $frontendNodeModules)) {
    Write-Host "   [WARNING] node_modules del frontend no encontrado" -ForegroundColor Yellow
    Write-Host "   Instalando dependencias del frontend..." -ForegroundColor Gray
    Set-Location $frontendDir
    npm install --legacy-peer-deps
    Set-Location $projectRoot
}
else {
    Write-Host "   [OK] Dependencias del frontend instaladas" -ForegroundColor Green
}
Write-Host ""

# Preparar logs
Write-Host "[7] Preparando directorio de logs..." -ForegroundColor Yellow
$logsDir = Join-Path $projectRoot "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
}
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backendLogFile = Join-Path $logsDir "backend_$timestamp.log"
$frontendLogFile = Join-Path $logsDir "frontend_$timestamp.log"
Write-Host "   [OK] Directorio de logs preparado: $logsDir" -ForegroundColor Green
Write-Host ""

# Iniciar Backend
Write-Host "[8] Iniciando Backend..." -ForegroundColor Yellow
Write-Host "   Puerto: $backendPort" -ForegroundColor Gray
Write-Host "   Directorio: $backendDir" -ForegroundColor Gray

$backendScript = Join-Path $env:TEMP "dobacksoft_backend_$timestamp.ps1"
@"
Set-Location '$backendDir'
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  DOBACKSOFT BACKEND - LOGS' -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Puerto: http://localhost:$backendPort' -ForegroundColor Yellow
Write-Host 'Log guardado en: $backendLogFile' -ForegroundColor Gray
Write-Host ''
Write-Host 'Presiona Ctrl+C para detener' -ForegroundColor Gray
Write-Host ''
npm run dev 2>&1 | Tee-Object -FilePath '$backendLogFile'
"@ | Out-File -FilePath $backendScript -Encoding UTF8

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-File", $backendScript
)

Start-Sleep -Seconds 3
Write-Host "   [OK] Backend iniciado en nueva ventana" -ForegroundColor Green
Write-Host ""

# Iniciar Frontend
Write-Host "[9] Iniciando Frontend..." -ForegroundColor Yellow
Write-Host "   Puerto: $frontendPort" -ForegroundColor Gray
Write-Host "   Directorio: $frontendDir" -ForegroundColor Gray

$frontendScript = Join-Path $env:TEMP "dobacksoft_frontend_$timestamp.ps1"
@"
Set-Location '$frontendDir'
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  DOBACKSOFT FRONTEND - LOGS' -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Puerto: http://localhost:$frontendPort' -ForegroundColor Yellow
Write-Host 'Log guardado en: $frontendLogFile' -ForegroundColor Gray
Write-Host ''
Write-Host 'Presiona Ctrl+C para detener' -ForegroundColor Gray
Write-Host ''
npm run dev 2>&1 | Tee-Object -FilePath '$frontendLogFile'
"@ | Out-File -FilePath $frontendScript -Encoding UTF8

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-File", $frontendScript
)

Start-Sleep -Seconds 3
Write-Host "   [OK] Frontend iniciado en nueva ventana" -ForegroundColor Green
Write-Host ""

# Esperar y verificar
Write-Host "[10] Esperando a que los servicios inicien..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host "[11] Verificando conectividad..." -ForegroundColor Yellow
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:$backendPort/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop 2>&1
    Write-Host "   [OK] Backend respondiendo (Status: $($backendResponse.StatusCode))" -ForegroundColor Green
}
catch {
    Write-Host "   [WARNING] Backend aún iniciando..." -ForegroundColor Yellow
}

try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:$frontendPort" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop 2>&1
    Write-Host "   [OK] Frontend respondiendo (Status: $($frontendResponse.StatusCode))" -ForegroundColor Green
}
catch {
    Write-Host "   [WARNING] Frontend aún iniciando..." -ForegroundColor Yellow
}
Write-Host ""

# Abrir navegador
Write-Host "[12] Abriendo navegador..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process "http://localhost:$frontendPort"
Write-Host "   [OK] Navegador abierto" -ForegroundColor Green
Write-Host ""

# Resumen
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SISTEMA INICIADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "URLs disponibles:" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:$frontendPort" -ForegroundColor White
Write-Host "  Backend API: http://localhost:$backendPort" -ForegroundColor White
Write-Host ""
Write-Host "Ventanas PowerShell abiertas:" -ForegroundColor Yellow
Write-Host "  - Backend (logs en tiempo real)" -ForegroundColor White
Write-Host "  - Frontend (logs en tiempo real)" -ForegroundColor White
Write-Host ""
Write-Host "Logs guardados en:" -ForegroundColor Yellow
Write-Host "  Backend: $backendLogFile" -ForegroundColor Gray
Write-Host "  Frontend: $frontendLogFile" -ForegroundColor Gray
Write-Host ""
Write-Host "COMANDOS UTILES:" -ForegroundColor Yellow
Write-Host "  Detener servicios: Cerrar las ventanas PowerShell" -ForegroundColor Gray
Write-Host "  Ver logs: Abrir archivos en logs/" -ForegroundColor Gray
Write-Host ""
Write-Host "Listo para usar!" -ForegroundColor Green
Write-Host ""
