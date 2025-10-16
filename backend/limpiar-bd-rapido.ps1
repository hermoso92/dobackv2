# Limpieza rapida sin confirmacion - para testing

Write-Host "[LIMPIANDO BD...]" -ForegroundColor Yellow

$env:PGPASSWORD = "cosigein"

# Limpiar en orden correcto
$null = & psql -U postgres -d dobacksoft -c 'DELETE FROM "StabilityEvent";' 2>&1
$null = & psql -U postgres -d dobacksoft -c 'DELETE FROM "GpsMeasurement";' 2>&1
$null = & psql -U postgres -d dobacksoft -c 'DELETE FROM "StabilityMeasurement";' 2>&1
$null = & psql -U postgres -d dobacksoft -c 'DELETE FROM "RotativoMeasurement";' 2>&1
$null = & psql -U postgres -d dobacksoft -c 'DELETE FROM "CanMeasurement";' 2>&1
$null = & psql -U postgres -d dobacksoft -c 'DELETE FROM "DataQualityMetrics";' 2>&1
$null = & psql -U postgres -d dobacksoft -c 'DELETE FROM "OperationalKey";' 2>&1
$null = & psql -U postgres -d dobacksoft -c 'DELETE FROM "Session";' 2>&1

# Verificar
$count = & psql -U postgres -d dobacksoft -t -c 'SELECT COUNT(*) FROM "Session";' 2>&1 | Out-String
$countNum = $count.Trim()

if ($countNum -eq "0") {
    Write-Host "[OK] BD limpia - 0 sesiones" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Sesiones restantes: $countNum" -ForegroundColor Yellow
}

