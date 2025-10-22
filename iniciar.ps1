# ============================================
# DOBACKSOFT - SCRIPT DE INICIO SIMPLIFICADO
# ============================================

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  INICIANDO DOBACKSOFT" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. DETENER PROCESOS ANTERIORES
Write-Host "`n[1/5] Deteniendo procesos anteriores..." -ForegroundColor Yellow

# Detener todos los procesos node
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Liberar puertos específicos
$ports = @(9998, 5174)
foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "✅ Procesos detenidos y puertos liberados" -ForegroundColor Green
Start-Sleep -Seconds 2

# 2. VERIFICAR ARCHIVOS
Write-Host "`n[2/5] Verificando archivos..." -ForegroundColor Yellow

if (-not (Test-Path "backend\src\index.ts")) {
    Write-Host "❌ ERROR: No existe backend\src\index.ts" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "frontend\package.json")) {
    Write-Host "❌ ERROR: No existe frontend\package.json" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Archivos verificados" -ForegroundColor Green

# 3. CREAR CARPETA DE LOGS
Write-Host "`n[3/5] Preparando logs..." -ForegroundColor Yellow

if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backendLog = "logs\backend_$timestamp.log"
$frontendLog = "logs\frontend_$timestamp.log"

Write-Host "✅ Logs preparados" -ForegroundColor Green

# 4. INICIAR BACKEND
Write-Host "`n[4/5] Iniciando BACKEND en puerto 9998..." -ForegroundColor Yellow

$backendScript = @"
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  BACKEND - Puerto 9998" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Set-Location "$PWD\backend"
`$env:NODE_ENV = "development"
`$env:PORT = "9998"
`$env:DATABASE_URL = "postgresql://postgres:cosigein@localhost:5432/dobacksoft"
`$env:JWT_SECRET = "DobackSoft-jwt-secret-key-cosigein"
`$env:JWT_EXPIRES_IN = "24h"
`$env:CORS_ORIGIN = "http://localhost:5174"
Write-Host "Iniciando con ts-node-dev..." -ForegroundColor Yellow
npx ts-node-dev --respawn --transpile-only src/index.ts 2>&1 | Tee-Object -FilePath "$PWD\$backendLog"
"@

# Guardar script temporal
$backendScript | Out-File -FilePath "temp_backend.ps1" -Encoding UTF8

# Iniciar en nueva ventana
Start-Process powershell -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", "$PWD\temp_backend.ps1"
)

Write-Host "⏳ Esperando 10 segundos para que backend se inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar backend
$backendOk = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9998/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend funcionando correctamente" -ForegroundColor Green
            $backendOk = $true
            break
        }
    }
    catch {
        Write-Host "⏳ Intento $i/10 - Backend aún iniciando..." -ForegroundColor Gray
        Start-Sleep -Seconds 3
    }
}

if (-not $backendOk) {
    Write-Host "❌ ERROR: Backend no responde" -ForegroundColor Red
    Write-Host "Revisa el log: $backendLog" -ForegroundColor Yellow
    Write-Host "O revisa la ventana de PowerShell del backend" -ForegroundColor Yellow
    exit 1
}

# 5. INICIAR FRONTEND
Write-Host "`n[5/5] Iniciando FRONTEND en puerto 5174..." -ForegroundColor Yellow

$frontendScript = @"
Write-Host "================================================" -ForegroundColor Magenta
Write-Host "  FRONTEND - Puerto 5174" -ForegroundColor Magenta
Write-Host "================================================" -ForegroundColor Magenta
Write-Host ""
Set-Location "$PWD\frontend"
`$env:NODE_ENV = "development"
`$env:VITE_API_URL = "http://localhost:9998"
`$env:VITE_PORT = "5174"
Write-Host "Iniciando Vite..." -ForegroundColor Yellow
npm run dev -- --port 5174 --host 2>&1 | Tee-Object -FilePath "$PWD\$frontendLog"
"@

# Guardar script temporal
$frontendScript | Out-File -FilePath "temp_frontend.ps1" -Encoding UTF8

# Iniciar en nueva ventana
Start-Process powershell -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", "$PWD\temp_frontend.ps1"
)

Write-Host "⏳ Esperando 10 segundos para que frontend se inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar frontend
$frontendOk = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5174" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        Write-Host "✅ Frontend funcionando correctamente" -ForegroundColor Green
        $frontendOk = $true
        break
    }
    catch {
        Write-Host "⏳ Intento $i/10 - Frontend aún iniciando..." -ForegroundColor Gray
        Start-Sleep -Seconds 3
    }
}

if (-not $frontendOk) {
    Write-Host "⚠️  ADVERTENCIA: Frontend no responde aún" -ForegroundColor Yellow
    Write-Host "Revisa el log: $frontendLog" -ForegroundColor Yellow
    Write-Host "O revisa la ventana de PowerShell del frontend" -ForegroundColor Yellow
    Write-Host "El sistema puede tardar un poco más en estar listo" -ForegroundColor Yellow
}

# 6. ABRIR NAVEGADOR
Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "  ✅ SISTEMA INICIADO" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

Write-Host "`n📊 SERVICIOS:" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:9998 ✅" -ForegroundColor Green
if ($frontendOk) {
    Write-Host "Frontend: http://localhost:5174 ✅" -ForegroundColor Green
}
else {
    Write-Host "Frontend: http://localhost:5174 ⏳ (aún iniciando)" -ForegroundColor Yellow
}

Write-Host "`n🔐 CREDENCIALES:" -ForegroundColor Yellow
Write-Host "MANAGER: test@bomberosmadrid.es / admin123" -ForegroundColor White
Write-Host "ADMIN:   antoniohermoso92@gmail.com / admin123" -ForegroundColor White

Write-Host "`n📝 LOGS:" -ForegroundColor Cyan
Write-Host "Backend:  $backendLog" -ForegroundColor Gray
Write-Host "Frontend: $frontendLog" -ForegroundColor Gray

Write-Host "`n🌐 Abriendo navegador..." -ForegroundColor Green
Start-Sleep -Seconds 2
Start-Process "http://localhost:5174"

Write-Host "`n✨ Sistema iniciado correctamente" -ForegroundColor Green
Write-Host "Las ventanas de backend y frontend están abiertas." -ForegroundColor White
Write-Host "NO las cierres o los servicios se detendrán." -ForegroundColor Yellow
Write-Host "`nPresiona ENTER para salir de este script..." -ForegroundColor Gray
Read-Host
