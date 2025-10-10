# Script para limpiar caché de Vite y resolver problemas de optimización
Write-Host "🧹 Limpiando caché de Vite..." -ForegroundColor Yellow

# Eliminar directorio de caché de Vite
if (Test-Path "node_modules\.vite") {
    Remove-Item -Path "node_modules\.vite" -Recurse -Force
    Write-Host "✅ Caché de Vite eliminada" -ForegroundColor Green
}
else {
    Write-Host "ℹ️ No se encontró caché de Vite" -ForegroundColor Blue
}

# Eliminar dist si existe
if (Test-Path "dist") {
    Remove-Item -Path "dist" -Recurse -Force
    Write-Host "✅ Directorio dist eliminado" -ForegroundColor Green
}

Write-Host "🚀 Iniciando servidor de desarrollo..." -ForegroundColor Yellow
npm run dev
