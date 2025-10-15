# Script de Verificación de Configuración - Dashboard StabilSafe V3
# Verifica que todo esté listo para las pruebas de aceptación

Write-Host "================================================" -ForegroundColor Cyan
Write-Host " Verificación de Configuración - Dashboard V3" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$errores = 0
$advertencias = 0

# 1. Verificar archivos .env
Write-Host "1. Verificando archivos de configuración..." -ForegroundColor Yellow

if (Test-Path ".env") {
    Write-Host "   ✅ .env encontrado en raíz" -ForegroundColor Green
    
    # Verificar claves importantes
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "REACT_APP_TOMTOM_API_KEY") {
        Write-Host "   ✅ REACT_APP_TOMTOM_API_KEY configurado" -ForegroundColor Green
    }
    else {
        Write-Host "   ⚠️  REACT_APP_TOMTOM_API_KEY no encontrado" -ForegroundColor Yellow
        $advertencias++
    }
}
else {
    Write-Host "   ❌ .env NO encontrado - Copiar desde env.example" -ForegroundColor Red
    $errores++
}

if (Test-Path "frontend\.env") {
    Write-Host "   ✅ frontend\.env encontrado" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️  frontend\.env NO encontrado (opcional)" -ForegroundColor Yellow
    $advertencias++
}

# 2. Verificar archivos clave modificados
Write-Host ""
Write-Host "2. Verificando archivos modificados..." -ForegroundColor Yellow

$archivosModificados = @(
    "backend\src\routes\hotspots.ts",
    "backend\src\routes\speedAnalysis.ts",
    "backend\src\routes\diagnostics.ts",
    "frontend\src\config\api.ts",
    "frontend\src\components\DiagnosticPanel.tsx",
    "frontend\src\components\kpi\NewExecutiveKPIDashboard.tsx"
)

foreach ($archivo in $archivosModificados) {
    if (Test-Path $archivo) {
        Write-Host "   ✅ $archivo" -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ $archivo NO encontrado" -ForegroundColor Red
        $errores++
    }
}

# 3. Verificar script de auditoría
Write-Host ""
Write-Host "3. Verificando script de auditoría SQL..." -ForegroundColor Yellow

if (Test-Path "backend\scripts\audit_dashboard_data.sql") {
    Write-Host "   ✅ Script de auditoría encontrado" -ForegroundColor Green
    Write-Host "   📌 Ejecutar: psql -U dobacksoft -d dobacksoft -f backend\scripts\audit_dashboard_data.sql" -ForegroundColor Cyan
}
else {
    Write-Host "   ❌ Script de auditoría NO encontrado" -ForegroundColor Red
    $errores++
}

# 4. Verificar servicios (puertos)
Write-Host ""
Write-Host "4. Verificando puertos de servicios..." -ForegroundColor Yellow

$portBackend = 9998
$portFrontend = 5174

$backendEnUso = Get-NetTCPConnection -LocalPort $portBackend -ErrorAction SilentlyContinue
$frontendEnUso = Get-NetTCPConnection -LocalPort $portFrontend -ErrorAction SilentlyContinue

if ($backendEnUso) {
    Write-Host "   ✅ Backend ejecutándose en puerto $portBackend" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️  Backend NO detectado en puerto $portBackend" -ForegroundColor Yellow
    Write-Host "   📌 Ejecutar: .\iniciardev.ps1" -ForegroundColor Cyan
    $advertencias++
}

if ($frontendEnUso) {
    Write-Host "   ✅ Frontend ejecutándose en puerto $portFrontend" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️  Frontend NO detectado en puerto $frontFrontend" -ForegroundColor Yellow
    Write-Host "   📌 Ejecutar: .\iniciardev.ps1" -ForegroundColor Cyan
    $advertencias++
}

# 5. Verificar documentación
Write-Host ""
Write-Host "5. Verificando documentación de implementación..." -ForegroundColor Yellow

$documentos = @(
    "IMPLEMENTATION_SUMMARY.md",
    "FINAL_IMPLEMENTATION_REPORT.md"
)

foreach ($doc in $documentos) {
    if (Test-Path $doc) {
        Write-Host "   ✅ $doc" -ForegroundColor Green
    }
    else {
        Write-Host "   ⚠️  $doc NO encontrado" -ForegroundColor Yellow
        $advertencias++
    }
}

# 6. Resumen
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " Resumen de Verificación" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

if ($errores -eq 0 -and $advertencias -eq 0) {
    Write-Host ""
    Write-Host "✅ ¡TODO LISTO PARA PRUEBAS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos pasos:" -ForegroundColor Cyan
    Write-Host "1. Si servicios no están corriendo: .\iniciardev.ps1" -ForegroundColor White
    Write-Host "2. Abrir navegador: http://localhost:5174" -ForegroundColor White
    Write-Host "3. Ejecutar pruebas según: GUIA_PRUEBAS_ACEPTACION.md" -ForegroundColor White
}
elseif ($errores -eq 0) {
    Write-Host ""
    Write-Host "⚠️  CONFIGURACIÓN CASI LISTA ($advertencias advertencia(s))" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Puedes proceder con las pruebas, pero revisa las advertencias." -ForegroundColor Yellow
}
else {
    Write-Host ""
    Write-Host "❌ HAY ERRORES QUE CORREGIR ($errores error(es), $advertencias advertencia(s))" -ForegroundColor Red
    Write-Host ""
    Write-Host "Corrige los errores antes de continuar." -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan

