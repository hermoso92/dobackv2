# Script MEJORADO para iniciar DobackSoft
# Este script inicia el sistema completo con todas las funcionalidades
# VERSIÓN MEJORADA - Resuelve problemas de puertos y reinicio

Write-Host "=========================================" -ForegroundColor Green
Write-Host "  DOBACK SOFT - SISTEMA COMPLETO V2.0" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Obtener el directorio del script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Directorio de trabajo: $scriptPath" -ForegroundColor Yellow

# Función para liberar puertos de forma más robusta
function Stop-PortProcesses {
    param([int[]]$Ports)
    
    foreach ($port in $Ports) {
        Write-Host "Liberando puerto $port..." -ForegroundColor Yellow
        
        # Método 1: Usar netstat + taskkill
        $connections = netstat -ano | findstr ":$port"
        if ($connections) {
            $processIds = $connections | ForEach-Object { 
                $parts = $_ -split '\s+'
                if ($parts.Length -gt 4) { $parts[-1] }
            } | Where-Object { $_ -ne "0" -and $_ -match '^\d+$' } | Select-Object -Unique
            
            foreach ($processId in $processIds) {
                try {
                    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    if ($process) {
                        Write-Host "Deteniendo proceso $($process.ProcessName) (PID: $processId) en puerto $port" -ForegroundColor Cyan
                        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                    }
                }
                catch {
                    Write-Host "No se pudo detener proceso $processId" -ForegroundColor Yellow
                }
            }
        }
        
        # Método 2: Usar Get-NetTCPConnection (más moderno)
        try {
            $tcpConnections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            foreach ($conn in $tcpConnections) {
                if ($conn.OwningProcess -ne 0) {
                    try {
                        $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
                        if ($process) {
                            Write-Host "Deteniendo proceso $($process.ProcessName) (PID: $($conn.OwningProcess)) en puerto $port" -ForegroundColor Cyan
                            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
                        }
                    }
                    catch {
                        Write-Host "No se pudo detener proceso $($conn.OwningProcess)" -ForegroundColor Yellow
                    }
                }
            }
        }
        catch {
            # Ignorar errores si no hay conexiones
        }
        
        Write-Host "Puerto $port liberado" -ForegroundColor Green
    }
}

# Detener procesos existentes de forma más completa
Write-Host "`nDeteniendo procesos existentes..." -ForegroundColor Yellow

# Detener procesos Node.js específicos
Get-Process node -ErrorAction SilentlyContinue | Where-Object { 
    $_.MainWindowTitle -like "*backend*" -or 
    $_.MainWindowTitle -like "*frontend*" -or 
    $_.CommandLine -like "*backend-final.js*" -or
    $_.CommandLine -like "*vite*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

# Detener procesos Vite
Get-Process vite -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Liberar puertos de forma robusta
Write-Host "Liberando puertos 9998 y 5174..." -ForegroundColor Yellow
Stop-PortProcesses -Ports @(9998, 5174)

# Esperar un poco más para asegurar liberación completa
Write-Host "Esperando liberación completa de puertos..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verificar que los puertos estén realmente libres
$ports = @(9998, 5174)
foreach ($port in $ports) {
    $stillInUse = $false
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connections) {
            $stillInUse = $true
            Write-Host "⚠️  Puerto $port aún en uso, intentando liberar nuevamente..." -ForegroundColor Yellow
            Stop-PortProcesses -Ports @($port)
            Start-Sleep -Seconds 2
        }
    }
    catch {
        # Puerto libre
    }
    
    if (-not $stillInUse) {
        Write-Host "✅ Puerto $port liberado correctamente" -ForegroundColor Green
    }
}

# Verificar archivos necesarios
Write-Host "`nVerificando archivos necesarios..." -ForegroundColor Yellow
if (-not (Test-Path "backend\src\index.ts")) {
    Write-Host "ERROR: No se encontró backend\src\index.ts" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "frontend\package.json")) {
    Write-Host "ERROR: No se encontró frontend\package.json" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Archivos verificados correctamente" -ForegroundColor Green

# Función para verificar si un servicio está funcionando
function Test-ServiceRunning {
    param([string]$Url, [int]$TimeoutSeconds = 30)
    
    $endTime = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $endTime) {
        try {
            $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                return $true
            }
        }
        catch {
            # Continuar intentando
        }
        Start-Sleep -Seconds 2
    }
    return $false
}

# Iniciar Backend con configuración mejorada
Write-Host "`nIniciando Backend en puerto 9998..." -ForegroundColor Green

# Configurar variables de entorno para el backend
$backendCommand = @"
Set-Location '$scriptPath\backend'
`$env:NODE_ENV = 'development'
`$env:PORT = '9998'
`$env:DATABASE_URL = 'postgresql://postgres:cosigein@localhost:5432/dobacksoft'
`$env:JWT_SECRET = 'DobackSoft-jwt-secret-key-cosigein'
`$env:JWT_EXPIRES_IN = '24h'
`$env:CORS_ORIGIN = 'http://localhost:5174'
Write-Host 'Backend iniciando en puerto 9998 (TypeScript con ts-node-dev)...' -ForegroundColor Cyan
npx ts-node-dev --respawn --transpile-only src/index.ts
"@

$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand -PassThru

# Esperar a que el backend se inicie con verificación mejorada
Write-Host "Esperando que el backend se inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verificar que el backend esté funcionando con múltiples métodos
$backendRunning = $false
$maxAttempts = 15

for ($i = 0; $i -lt $maxAttempts; $i++) {
    # Método 1: Verificar puerto
    $portCheck = $false
    try {
        $connections = Get-NetTCPConnection -LocalPort 9998 -ErrorAction SilentlyContinue
        if ($connections) {
            $portCheck = $true
        }
    }
    catch {
        # Puerto no disponible
    }
    
    # Método 2: Verificar HTTP response
    $httpCheck = Test-ServiceRunning -Url "http://localhost:9998/health" -TimeoutSeconds 3
    
    if ($portCheck -and $httpCheck) {
        $backendRunning = $true
        Write-Host "✅ Backend funcionando correctamente en puerto 9998" -ForegroundColor Green
        break
    }
    elseif ($portCheck) {
        Write-Host "⚠️  Backend en puerto 9998 pero sin respuesta HTTP (intento $($i+1)/$maxAttempts)" -ForegroundColor Yellow
    }
    else {
        Write-Host "⏳ Esperando backend... (intento $($i+1)/$maxAttempts)" -ForegroundColor Yellow
    }
    
    Start-Sleep -Seconds 2
}

if (-not $backendRunning) {
    Write-Host "❌ ERROR: Backend no se inició correctamente después de $maxAttempts intentos" -ForegroundColor Red
    Write-Host "Verifica la consola del backend para errores" -ForegroundColor Yellow
    exit 1
}

# Iniciar Frontend con configuración mejorada
Write-Host "`nIniciando Frontend en puerto 5174..." -ForegroundColor Green

# Configurar variables de entorno para el frontend
$frontendCommand = @"
Set-Location '$scriptPath\frontend'
`$env:NODE_ENV = 'development'
`$env:VITE_API_URL = 'http://localhost:9998'
`$env:VITE_WS_URL = 'ws://localhost:9998/ws'
`$env:VITE_PORT = '5174'
Write-Host 'Frontend iniciando en puerto 5174...' -ForegroundColor Cyan
npm run dev -- --port 5174 --host 0.0.0.0
"@

$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand -PassThru

# Esperar a que el frontend se inicie con verificación mejorada
Write-Host "Esperando que el frontend se inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Verificar que el frontend esté funcionando con múltiples métodos
$frontendRunning = $false
$maxAttempts = 15

for ($i = 0; $i -lt $maxAttempts; $i++) {
    # Método 1: Verificar puerto
    $portCheck = $false
    try {
        $connections = Get-NetTCPConnection -LocalPort 5174 -ErrorAction SilentlyContinue
        if ($connections) {
            $portCheck = $true
        }
    }
    catch {
        # Puerto no disponible
    }
    
    # Método 2: Verificar HTTP response
    $httpCheck = Test-ServiceRunning -Url "http://localhost:5174" -TimeoutSeconds 3
    
    if ($portCheck -and $httpCheck) {
        $frontendRunning = $true
        Write-Host "✅ Frontend funcionando correctamente en puerto 5174" -ForegroundColor Green
        break
    }
    elseif ($portCheck) {
        Write-Host "⚠️  Frontend en puerto 5174 pero sin respuesta HTTP (intento $($i+1)/$maxAttempts)" -ForegroundColor Yellow
    }
    else {
        Write-Host "⏳ Esperando frontend... (intento $($i+1)/$maxAttempts)" -ForegroundColor Yellow
    }
    
    Start-Sleep -Seconds 2
}

if (-not $frontendRunning) {
    Write-Host "❌ ERROR: Frontend no se inició correctamente después de $maxAttempts intentos" -ForegroundColor Red
    Write-Host "Verifica la consola del frontend para errores" -ForegroundColor Yellow
    Write-Host "El backend sigue funcionando en http://localhost:9998" -ForegroundColor Cyan
    exit 1
}

# Abrir navegador automáticamente
Write-Host "`n🌐 Abriendo navegador..." -ForegroundColor Green
Start-Process "http://localhost:5174"

# Mostrar información final mejorada
Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "  🎉 DOBACK SOFT - SISTEMA LISTO" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

Write-Host "`n📊 SERVICIOS ACTIVOS:" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:9998" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5174" -ForegroundColor Green
Write-Host "API Docs: http://localhost:9998/api-docs" -ForegroundColor Blue

Write-Host "`n🔐 CREDENCIALES DE ACCESO:" -ForegroundColor Yellow
Write-Host "TEST:     test@bomberosmadrid.es / admin123" -ForegroundColor White
Write-Host "ANTONIO:  antoniohermoso92@gmail.com / admin123" -ForegroundColor White

Write-Host "`n✨ FUNCIONALIDADES INCLUIDAS:" -ForegroundColor Green
Write-Host "• Dashboard KPI Ejecutivo (objetivo principal)" -ForegroundColor White
Write-Host "• Sesiones completas (ESTABILIDAD + GPS + CAN + ROTATIVO)" -ForegroundColor White
Write-Host "• Subida múltiple de archivos (Estabilidad, GPS, Rotativo, CAN)" -ForegroundColor White
Write-Host "• Análisis automático de archivos CMadrid" -ForegroundColor White
Write-Host "• Comparador de sesiones avanzado" -ForegroundColor White
Write-Host "• Reportes PDF profesionales" -ForegroundColor White
Write-Host "• Inteligencia Artificial explicable" -ForegroundColor White
Write-Host "• Sistema de roles ADMIN/MANAGER" -ForegroundColor White
Write-Host "• Scroll habilitado en todas las páginas" -ForegroundColor White
Write-Host "• Modo TV Wall automático" -ForegroundColor White

Write-Host "`n🛠️ COMANDOS ÚTILES:" -ForegroundColor Cyan
Write-Host "• Para reiniciar: Ejecuta este script nuevamente" -ForegroundColor White
Write-Host "• Para detener: Cierra las ventanas de PowerShell" -ForegroundColor White
Write-Host "• Para logs: Revisa las consolas de backend/frontend" -ForegroundColor White

Write-Host "`n🎯 ¡Sistema iniciado correctamente! Todo listo para usar." -ForegroundColor Green
Write-Host "`nPresiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")