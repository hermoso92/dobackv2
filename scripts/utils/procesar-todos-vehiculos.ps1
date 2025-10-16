# Script para procesar automáticamente todos los vehículos de CMadrid

$backendUrl = "http://localhost:9998"

Write-Host "🚀 PROCESAMIENTO AUTOMÁTICO DE TODOS LOS VEHÍCULOS" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Verificar que el backend esté corriendo
Write-Host "🔍 Verificando backend..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-WebRequest -Uri "$backendUrl/health" -Method GET -UseBasicParsing -TimeoutSec 5
    if ($healthCheck.StatusCode -eq 200) {
        Write-Host "✅ Backend corriendo correctamente" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Error: Backend no está corriendo en $backendUrl" -ForegroundColor Red
    Write-Host "   Inicia el backend con: node backend-final.js" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Paso 2: Generar lista de archivos
Write-Host "📋 Generando lista de archivos a procesar..." -ForegroundColor Yellow
try {
    node analyze-cmadrid-complete.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error generando lista de archivos" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Lista de archivos generada" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error ejecutando análisis: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 3: Preguntar confirmación
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   Se procesarán 21 conjuntos de archivos (3 vehículos, múltiples fechas)"
Write-Host "   Esto puede tomar varios minutos"
Write-Host ""
$confirm = Read-Host "¿Deseas continuar? (S/N)"

if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "❌ Procesamiento cancelado" -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# Paso 4: Limpiar base de datos (opcional)
Write-Host "🧹 ¿Deseas limpiar la base de datos antes de procesar? (S/N)" -ForegroundColor Yellow
$cleanDb = Read-Host

if ($cleanDb -eq "S" -or $cleanDb -eq "s") {
    Write-Host "🧹 Limpiando base de datos..." -ForegroundColor Yellow
    try {
        $cleanResponse = Invoke-WebRequest -Uri "$backendUrl/api/clean-all-sessions" -Method POST -UseBasicParsing
        if ($cleanResponse.StatusCode -eq 200) {
            $cleanData = $cleanResponse.Content | ConvertFrom-Json
            Write-Host "✅ Base de datos limpiada:" -ForegroundColor Green
            Write-Host "   - GPS: $($cleanData.data.deletedGps)"
            Write-Host "   - Estabilidad: $($cleanData.data.deletedStability)"
            Write-Host "   - Rotativo: $($cleanData.data.deletedRotativo)"
            Write-Host "   - Sesiones: $($cleanData.data.deletedSessions)"
        }
    }
    catch {
        Write-Host "❌ Error limpiando BD: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

# Paso 5: Procesar todos los archivos
Write-Host "🚀 Iniciando procesamiento automático..." -ForegroundColor Cyan
Write-Host "   (Esto puede tomar varios minutos, por favor espera)" -ForegroundColor Yellow
Write-Host ""

try {
    $processResponse = Invoke-WebRequest -Uri "$backendUrl/api/upload/process-all-cmadrid" -Method POST -UseBasicParsing -TimeoutSec 300
    
    if ($processResponse.StatusCode -eq 200) {
        $processData = $processResponse.Content | ConvertFrom-Json
        
        Write-Host ""
        Write-Host "✅ PROCESAMIENTO COMPLETADO" -ForegroundColor Green
        Write-Host "============================" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Resumen:" -ForegroundColor Cyan
        Write-Host "   Total conjuntos: $($processData.data.totalSets)"
        Write-Host "   Sesiones guardadas: $($processData.data.totalSaved)" -ForegroundColor Green
        Write-Host "   Sesiones descartadas: $($processData.data.totalSkipped)" -ForegroundColor Yellow
        Write-Host "   Errores: $($processData.data.totalErrors)" -ForegroundColor $(if ($processData.data.totalErrors -gt 0) { "Red" } else { "Green" })
        Write-Host ""
        
        # Mostrar detalles por vehículo
        Write-Host "📋 Detalle por vehículo:" -ForegroundColor Cyan
        $processData.data.results | ForEach-Object {
            if ($_.error) {
                Write-Host "   ❌ $($_.vehicle) $($_.date): ERROR - $($_.error)" -ForegroundColor Red
            }
            else {
                Write-Host "   ✅ $($_.vehicle) $($_.date): $($_.savedSessions) guardadas, $($_.skippedSessions) descartadas" -ForegroundColor $(if ($_.savedSessions -gt 0) { "Green" } else { "Yellow" })
            }
        }
        
        Write-Host ""
        Write-Host "🎉 ¡Procesamiento completado! Ahora puedes ver las sesiones en el frontend." -ForegroundColor Green
        
    }
    else {
        Write-Host "❌ Error: Código de estado $($processResponse.StatusCode)" -ForegroundColor Red
    }
    
}
catch {
    Write-Host "❌ Error durante el procesamiento: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Verifica los logs del backend para más detalles" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ Script completado" -ForegroundColor Green

