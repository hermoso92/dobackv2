# Verificar Node.js
$nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeInstalled) {
    Write-Host "❌ Node.js no está instalado" -ForegroundColor Red
    exit 1
}

# Verificar npm
$npmInstalled = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmInstalled) {
    Write-Host "❌ npm no está instalado" -ForegroundColor Red
    exit 1
}

# Verificar backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9998/api/v1/health" -Method GET -UseBasicParsing
    Write-Host "✅ Backend está respondiendo" -ForegroundColor Green
}
catch {
    Write-Host "❌ Backend no está respondiendo" -ForegroundColor Red
    exit 1
}

# Instalar dependencias
$nodeModulesExists = Test-Path "node_modules"
if (-not $nodeModulesExists) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

# Ejecutar diagnóstico
Write-Host "🔍 Ejecutando diagnóstico..." -ForegroundColor Cyan
node scripts/repair-login.js

# Reiniciar servidor
Write-Host "🔄 Reiniciando servidor..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run dev" 