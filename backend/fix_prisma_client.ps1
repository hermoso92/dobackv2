# Script para solucionar el problema del cliente de Prisma
Write-Host "Solucionando problema del cliente de Prisma..." -ForegroundColor Yellow

# 1. Intentar detener procesos de Node.js
Write-Host "1. Deteniendo procesos de Node.js..." -ForegroundColor Cyan
try {
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "   Procesos de Node.js detenidos" -ForegroundColor Green
}
catch {
    Write-Host "   No se pudieron detener todos los procesos de Node.js" -ForegroundColor Yellow
}

# 2. Esperar un momento
Write-Host "2. Esperando 3 segundos..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# 3. Eliminar la carpeta .prisma si existe
Write-Host "3. Limpiando cliente de Prisma anterior..." -ForegroundColor Cyan
try {
    if (Test-Path "node_modules\.prisma") {
        Remove-Item -Recurse -Force "node_modules\.prisma" -ErrorAction SilentlyContinue
        Write-Host "   Carpeta .prisma eliminada" -ForegroundColor Green
    }
    else {
        Write-Host "   No se encontro carpeta .prisma" -ForegroundColor Blue
    }
}
catch {
    Write-Host "   No se pudo eliminar la carpeta .prisma completamente" -ForegroundColor Yellow
}

# 4. Generar el cliente de Prisma
Write-Host "4. Generando nuevo cliente de Prisma..." -ForegroundColor Cyan
try {
    npx prisma generate
    Write-Host "   Cliente de Prisma generado exitosamente" -ForegroundColor Green
}
catch {
    Write-Host "   Error generando cliente de Prisma" -ForegroundColor Red
    Write-Host "   Intentando alternativa..." -ForegroundColor Yellow
    
    # Intentar con npm
    try {
        npm run prisma:generate
        Write-Host "   Cliente de Prisma generado con npm" -ForegroundColor Green
    }
    catch {
        Write-Host "   Error con npm tambien" -ForegroundColor Red
    }
}

# 5. Verificar que el cliente se generó
Write-Host "5. Verificando generacion del cliente..." -ForegroundColor Cyan
if (Test-Path "node_modules\.prisma\client\index.d.ts") {
    Write-Host "   Cliente de Prisma generado correctamente" -ForegroundColor Green
}
else {
    Write-Host "   Cliente de Prisma no se genero" -ForegroundColor Red
}

Write-Host "Proceso completado" -ForegroundColor Green
Write-Host "Si el problema persiste, reinicia el servidor manualmente" -ForegroundColor Yellow 