# Script simplificado para iniciar solo el frontend
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "= Script simplificado para iniciar solo el frontend =" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# Detener procesos node existentes
Write-Host "Deteniendo procesos 'node' existentes..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "Deteniendo proceso node PID: $($_.Id)" -ForegroundColor Yellow
        Stop-Process -Id $_.Id -Force
    }
}
catch {
    Write-Host "No se encontraron procesos 'node' activos." -ForegroundColor Gray
}

# Limpiar cachés
Write-Host "Limpiando caché de Vite..." -ForegroundColor Yellow
if (Test-Path -Path "node_modules\.vite") {
    Remove-Item -Path "node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue
}

# Instalar dependencias críticas
Write-Host "Instalando dependencias críticas..." -ForegroundColor Cyan
npm install vite @vitejs/plugin-react --no-save --no-audit --no-fund --force

# Iniciar frontend
Write-Host "Iniciando frontend..." -ForegroundColor Green
npm run dev

Write-Host "Frontend iniciado. Presiona Ctrl+C para detener." -ForegroundColor Cyan 