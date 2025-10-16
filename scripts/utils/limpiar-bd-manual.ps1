# 🧹 LIMPIEZA MANUAL DE BASE DE DATOS
# Usar si el botón "Limpiar BD" en frontend no funciona
# Versión: 1.0
# Fecha: 2025-10-11

Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   LIMPIEZA MANUAL DE BASE DE DATOS             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "⚠️  ADVERTENCIA: Esta operación eliminará TODAS las sesiones" -ForegroundColor Yellow
Write-Host "    Esta acción es IRREVERSIBLE`n" -ForegroundColor Yellow

$confirmacion = Read-Host "¿Estás seguro de continuar? (escribe 'SI' para confirmar)"

if ($confirmacion -ne "SI") {
    Write-Host "`n❌ Operación cancelada`n" -ForegroundColor Red
    exit 1
}

Write-Host "`n🔍 Conectando a PostgreSQL..." -ForegroundColor Yellow

# Ejecutar script SQL de limpieza
$sqlScript = @"
-- Limpiar todas las sesiones y datos relacionados
DELETE FROM "StabilityEvent";
DELETE FROM "GpsMeasurement";
DELETE FROM "StabilityMeasurement";
DELETE FROM "RotativoMeasurement";
DELETE FROM "CanMeasurement";
DELETE FROM "DataQualityMetrics";
DELETE FROM "OperationalKey";
DELETE FROM "Session";

-- Verificar que está vacío
SELECT 'Sesiones restantes: ' || COUNT(*)::text as resultado FROM "Session";
"@

# Guardar script temporal
$tempFile = "temp-clean.sql"
$sqlScript | Out-File -FilePath $tempFile -Encoding UTF8

try {
    # Ejecutar con psql
    Write-Host "🗑️  Ejecutando limpieza..." -ForegroundColor Yellow
    
    # Configuración de la base de datos
    $env:PGPASSWORD = "cosigein"
    $resultado = psql -U postgres -d dobacksoft -f $tempFile 2>&1
    
    Write-Host "`n✅ Limpieza ejecutada" -ForegroundColor Green
    Write-Host "$resultado" -ForegroundColor Gray
    
    Write-Host "`n📊 Verificación final:" -ForegroundColor Yellow
    $env:PGPASSWORD = "cosigein"
    $verificacion = psql -U postgres -d dobacksoft -c "SELECT COUNT(*) as sesiones FROM \"Session\";" -t 2>&1
    
    if ($verificacion -match "0") {
        Write-Host "✅ Base de datos limpiada correctamente (0 sesiones)" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Aún hay sesiones en la BD: $verificacion" -ForegroundColor Yellow
    }
    
}
catch {
    Write-Host "`n❌ Error ejecutando limpieza: $_" -ForegroundColor Red
    Write-Host "`n💡 Ejecuta manualmente en pgAdmin o DBeaver:" -ForegroundColor Yellow
    Write-Host $sqlScript -ForegroundColor Gray
}
finally {
    # Limpiar archivo temporal
    if (Test-Path $tempFile) {
        Remove-Item $tempFile
    }
}

Write-Host "`n📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Reiniciar backend: cd backend; npm run dev" -ForegroundColor White
Write-Host "  2. Ir a http://localhost:5174/upload" -ForegroundColor White
Write-Host "  3. Click 'Iniciar Procesamiento Automático'" -ForegroundColor White
Write-Host "  4. Ver modal con resultado`n" -ForegroundColor White

