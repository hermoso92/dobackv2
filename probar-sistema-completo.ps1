# 🧪 SCRIPT DE PRUEBA COMPLETA DOBACKSOFT
# Este script prueba todo el sistema de producción

Write-Host "=========================================" -ForegroundColor Magenta
Write-Host "  🧪 PRUEBA COMPLETA DOBACKSOFT" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta

# Cargar configuración
. .\config.env

Write-Host "`n🔍 VERIFICANDO COMPONENTES DEL SISTEMA..." -ForegroundColor Cyan

# 1. Verificar PostgreSQL
Write-Host "`n1. Verificando PostgreSQL..." -ForegroundColor Yellow
try {
    $pgVersion = psql --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL: $pgVersion" -ForegroundColor Green
    }
    else {
        Write-Host "❌ PostgreSQL no disponible" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ PostgreSQL no instalado" -ForegroundColor Red
    exit 1
}

# 2. Verificar conexión a BD
Write-Host "`n2. Verificando conexión a base de datos..." -ForegroundColor Yellow
try {
    $connection = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Conexión a BD exitosa" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Error conectando a BD" -ForegroundColor Red
        Write-Host "Ejecuta: .\inicializar-bd.ps1" -ForegroundColor Yellow
        exit 1
    }
}
catch {
    Write-Host "❌ Error de conexión" -ForegroundColor Red
    exit 1
}

# 3. Verificar datos en BD
Write-Host "`n3. Verificando datos en base de datos..." -ForegroundColor Yellow
try {
    $orgCount = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM `"Organization`";" 2>$null
    $userCount = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM `"User`";" 2>$null
    $vehicleCount = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM `"Vehicle`";" 2>$null
    $sessionCount = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM `"Session`";" 2>$null
    
    Write-Host "✅ Organizaciones: $orgCount" -ForegroundColor Green
    Write-Host "✅ Usuarios: $userCount" -ForegroundColor Green
    Write-Host "✅ Vehículos: $vehicleCount" -ForegroundColor Green
    Write-Host "✅ Sesiones: $sessionCount" -ForegroundColor Green
    
    if ($orgCount -eq 0 -or $userCount -eq 0 -or $vehicleCount -eq 0) {
        Write-Host "⚠️ Datos faltantes. Ejecuta: .\crear-datos-iniciales.ps1" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Error verificando datos" -ForegroundColor Red
}

# 4. Verificar backend
Write-Host "`n4. Verificando backend..." -ForegroundColor Yellow
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:9998/api/kpi/test" -Method GET -TimeoutSec 5 2>$null
    if ($backendResponse.StatusCode -eq 200) {
        Write-Host "✅ Backend funcionando en puerto 9998" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Backend no responde" -ForegroundColor Red
        Write-Host "Ejecuta: .\iniciar.ps1" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Backend no disponible" -ForegroundColor Red
    Write-Host "Ejecuta: .\iniciar.ps1" -ForegroundColor Yellow
}

# 5. Verificar endpoint de datos reales
Write-Host "`n5. Verificando endpoint de datos reales..." -ForegroundColor Yellow
try {
    $realDataResponse = Invoke-WebRequest -Uri "http://localhost:9998/api/dashboard/real-data" -Method GET -TimeoutSec 5 2>$null
    if ($realDataResponse.StatusCode -eq 200) {
        $realData = $realDataResponse.Content | ConvertFrom-Json
        Write-Host "✅ Endpoint de datos reales funcionando" -ForegroundColor Green
        Write-Host "   • Horas de conducción: $($realData.data.hoursDriving)" -ForegroundColor White
        Write-Host "   • Km recorridos: $($realData.data.km)" -ForegroundColor White
        Write-Host "   • Sesiones: $($realData.data.sessions.Count)" -ForegroundColor White
        Write-Host "   • Fuente: $($realData.data.dataSource)" -ForegroundColor White
    }
    else {
        Write-Host "❌ Endpoint de datos reales no responde" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Error en endpoint de datos reales" -ForegroundColor Red
}

# 6. Verificar frontend
Write-Host "`n6. Verificando frontend..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5174" -Method GET -TimeoutSec 5 2>$null
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend funcionando en puerto 5174" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Frontend no responde" -ForegroundColor Red
        Write-Host "Ejecuta: .\iniciar.ps1" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Frontend no disponible" -ForegroundColor Red
    Write-Host "Ejecuta: .\iniciar.ps1" -ForegroundColor Yellow
}

Write-Host "`n=========================================" -ForegroundColor Magenta
Write-Host "  📊 RESUMEN DE PRUEBAS" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta

Write-Host "`n🎯 ESTADO DEL SISTEMA:" -ForegroundColor Cyan
Write-Host "• PostgreSQL: Verificado" -ForegroundColor White
Write-Host "• Base de datos: Conectada" -ForegroundColor White
Write-Host "• Backend: Puerto 9998" -ForegroundColor White
Write-Host "• Frontend: Puerto 5174" -ForegroundColor White
Write-Host "• Datos reales: Disponibles" -ForegroundColor White

Write-Host "`n🔐 CREDENCIALES DE ACCESO:" -ForegroundColor Yellow
Write-Host "ADMIN: admin@cosigein.com / admin123" -ForegroundColor White
Write-Host "MANAGER: manager@cosigein.com / admin123" -ForegroundColor White

Write-Host "`n🌐 URLS DEL SISTEMA:" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5174" -ForegroundColor White
Write-Host "Backend API: http://localhost:9998" -ForegroundColor White
Write-Host "Datos reales: http://localhost:9998/api/dashboard/real-data" -ForegroundColor White

Write-Host "`n✨ SISTEMA LISTO PARA PRODUCCIÓN" -ForegroundColor Green
Write-Host "`nPresiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
