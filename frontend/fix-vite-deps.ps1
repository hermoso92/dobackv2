# Script para resolver problemas de dependencias de Vite
Write-Host "🔧 Resolviendo problemas de dependencias de Vite..." -ForegroundColor Yellow

# 1. Limpiar caché de Vite
Write-Host "📁 Limpiando caché de Vite..." -ForegroundColor Blue
if (Test-Path "node_modules\.vite") {
    Remove-Item -Path "node_modules\.vite" -Recurse -Force
    Write-Host "✅ Caché de Vite eliminada" -ForegroundColor Green
}

# 2. Limpiar dist
Write-Host "📁 Limpiando directorio dist..." -ForegroundColor Blue
if (Test-Path "dist") {
    Remove-Item -Path "dist" -Recurse -Force
    Write-Host "✅ Directorio dist eliminado" -ForegroundColor Green
}

# 3. Limpiar package-lock.json
Write-Host "📁 Limpiando package-lock.json..." -ForegroundColor Blue
if (Test-Path "package-lock.json") {
    Remove-Item -Path "package-lock.json" -Force
    Write-Host "✅ package-lock.json eliminado" -ForegroundColor Green
}

# 4. Reinstalar dependencias
Write-Host "📦 Reinstalando dependencias..." -ForegroundColor Blue
npm install

# 5. Iniciar servidor
Write-Host "🚀 Iniciando servidor de desarrollo..." -ForegroundColor Yellow
npm run dev
