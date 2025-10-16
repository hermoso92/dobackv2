# 🔍 SCRIPT DE VERIFICACIÓN DE SESIONES GENERADAS
# Compara lo que se generó vs el análisis real
# Versión: 1.0
# Fecha: 2025-10-11

param(
    [string]$Vehicle = "DOBACK024",
    [string]$Date = "2025-09-30"
)

Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  VERIFICACIÓN DE SESIONES GENERADAS            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Vehículo: $Vehicle" -ForegroundColor Yellow
Write-Host "Fecha: $Date`n" -ForegroundColor Yellow

# Configuración de BD
$env:PGPASSWORD = "cosigein"
$dbName = "dobacksoft"
$dbUser = "postgres"

Write-Host "🔍 Consultando sesiones en BD..." -ForegroundColor Yellow

# Query para obtener sesiones del día
$query = @"
SELECT 
    s.id,
    s."sessionNumber",
    s."startTime",
    s."endTime",
    v.identifier as vehicle,
    s.source,
    (SELECT COUNT(*) FROM "GpsMeasurement" WHERE "sessionId" = s.id) as gps_count,
    (SELECT COUNT(*) FROM "StabilityMeasurement" WHERE "sessionId" = s.id) as stability_count,
    (SELECT COUNT(*) FROM "RotativoMeasurement" WHERE "sessionId" = s.id) as rotativo_count
FROM "Session" s
JOIN "Vehicle" v ON v.id = s."vehicleId"
WHERE v.identifier = '$Vehicle'
AND s."startTime"::date = '$Date'::date
ORDER BY s."startTime" ASC;
"@

$tempQuery = "temp-query.sql"
$query | Out-File -FilePath $tempQuery -Encoding UTF8

try {
    Write-Host "`n📊 SESIONES ENCONTRADAS EN BD:`n" -ForegroundColor Green
    
    $result = psql -U $dbUser -d $dbName -f $tempQuery -A -F "|" 2>&1
    
    if ($result) {
        # Parsear resultado
        $lines = $result -split "`n" | Where-Object { $_ -match "\|" }
        
        if ($lines.Count -gt 1) {
            # Header
            Write-Host $lines[0] -ForegroundColor Cyan
            Write-Host ("-" * 100) -ForegroundColor Gray
            
            $sessionCount = 0
            # Datos
            for ($i = 1; $i < $lines.Count; $i++) {
                $line = $lines[$i]
                if ($line -match "\|") {
                    Write-Host $line -ForegroundColor White
                    $sessionCount++
                }
            }
            
            Write-Host "`n✅ Total sesiones encontradas: $sessionCount`n" -ForegroundColor Green
            
            # Análisis de tipos
            Write-Host "📊 ANÁLISIS POR TIPO:`n" -ForegroundColor Yellow
            
            $tipoQuery = @"
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM "GpsMeasurement" WHERE "sessionId" = s.id) > 0 THEN 'GPS'
        WHEN (SELECT COUNT(*) FROM "StabilityMeasurement" WHERE "sessionId" = s.id) > 0 THEN 'ESTABILIDAD'
        WHEN (SELECT COUNT(*) FROM "RotativoMeasurement" WHERE "sessionId" = s.id) > 0 THEN 'ROTATIVO'
        ELSE 'VACIA'
    END as tipo,
    COUNT(*) as cantidad
FROM "Session" s
JOIN "Vehicle" v ON v.id = s."vehicleId"
WHERE v.identifier = '$Vehicle'
AND s."startTime"::date = '$Date'::date
GROUP BY tipo
ORDER BY cantidad DESC;
"@
            
            $tipoQuery | Out-File -FilePath $tempQuery -Encoding UTF8
            $tipoResult = psql -U $dbUser -d $dbName -f $tempQuery -A -F "|" 2>&1
            
            if ($tipoResult) {
                $tipoLines = $tipoResult -split "`n" | Where-Object { $_ -match "\|" }
                foreach ($tline in $tipoLines) {
                    if ($tline -notmatch "tipo\|cantidad") {
                        Write-Host "  $tline" -ForegroundColor White
                    }
                }
            }
            
        }
        else {
            Write-Host "⚠️  No se encontraron sesiones para este vehículo y fecha" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n📖 SEGÚN ANÁLISIS REAL (resumendoback/):`n" -ForegroundColor Cyan
    Write-Host "  DOBACK024 30/09/2025 DEBERÍA tener:" -ForegroundColor White
    Write-Host "    Sesión #1: 09:33-10:38 (ESTABILIDAD + GPS + ROTATIVO)" -ForegroundColor White
    Write-Host "    Sesión #2: 12:41-14:05 (ESTABILIDAD + ROTATIVO, sin GPS)`n" -ForegroundColor White
    
    Write-Host "💡 CONCLUSIÓN:" -ForegroundColor Yellow
    Write-Host "  Si ves MÁS de 2 sesiones correlacionadas:" -ForegroundColor White
    Write-Host "    → El sistema está creando sesiones separadas por tipo" -ForegroundColor White
    Write-Host "    → Necesita correlación temporal mejorada`n" -ForegroundColor White
    
}
catch {
    Write-Host "`n❌ Error ejecutando query: $_" -ForegroundColor Red
}
finally {
    if (Test-Path $tempQuery) {
        Remove-Item $tempQuery
    }
}

Write-Host "📚 Ver análisis completo en:" -ForegroundColor Cyan
Write-Host "  resumendoback/Analisis_Sesiones_CMadrid_real.md`n" -ForegroundColor Gray

# 🔍 SCRIPT DE VERIFICACIÓN DE SESIONES GENERADAS
# Compara lo que se generó vs el análisis real
# Versión: 1.0
# Fecha: 2025-10-11

param(
    [string]$Vehicle = "DOBACK024",
    [string]$Date = "2025-09-30"
)

Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  VERIFICACIÓN DE SESIONES GENERADAS            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Vehículo: $Vehicle" -ForegroundColor Yellow
Write-Host "Fecha: $Date`n" -ForegroundColor Yellow

# Configuración de BD
$env:PGPASSWORD = "cosigein"
$dbName = "dobacksoft"
$dbUser = "postgres"

Write-Host "🔍 Consultando sesiones en BD..." -ForegroundColor Yellow

# Query para obtener sesiones del día
$query = @"
SELECT 
    s.id,
    s."sessionNumber",
    s."startTime",
    s."endTime",
    v.identifier as vehicle,
    s.source,
    (SELECT COUNT(*) FROM "GpsMeasurement" WHERE "sessionId" = s.id) as gps_count,
    (SELECT COUNT(*) FROM "StabilityMeasurement" WHERE "sessionId" = s.id) as stability_count,
    (SELECT COUNT(*) FROM "RotativoMeasurement" WHERE "sessionId" = s.id) as rotativo_count
FROM "Session" s
JOIN "Vehicle" v ON v.id = s."vehicleId"
WHERE v.identifier = '$Vehicle'
AND s."startTime"::date = '$Date'::date
ORDER BY s."startTime" ASC;
"@

$tempQuery = "temp-query.sql"
$query | Out-File -FilePath $tempQuery -Encoding UTF8

try {
    Write-Host "`n📊 SESIONES ENCONTRADAS EN BD:`n" -ForegroundColor Green
    
    $result = psql -U $dbUser -d $dbName -f $tempQuery -A -F "|" 2>&1
    
    if ($result) {
        # Parsear resultado
        $lines = $result -split "`n" | Where-Object { $_ -match "\|" }
        
        if ($lines.Count -gt 1) {
            # Header
            Write-Host $lines[0] -ForegroundColor Cyan
            Write-Host ("-" * 100) -ForegroundColor Gray
            
            $sessionCount = 0
            # Datos
            for ($i = 1; $i < $lines.Count; $i++) {
                $line = $lines[$i]
                if ($line -match "\|") {
                    Write-Host $line -ForegroundColor White
                    $sessionCount++
                }
            }
            
            Write-Host "`n✅ Total sesiones encontradas: $sessionCount`n" -ForegroundColor Green
            
            # Análisis de tipos
            Write-Host "📊 ANÁLISIS POR TIPO:`n" -ForegroundColor Yellow
            
            $tipoQuery = @"
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM "GpsMeasurement" WHERE "sessionId" = s.id) > 0 THEN 'GPS'
        WHEN (SELECT COUNT(*) FROM "StabilityMeasurement" WHERE "sessionId" = s.id) > 0 THEN 'ESTABILIDAD'
        WHEN (SELECT COUNT(*) FROM "RotativoMeasurement" WHERE "sessionId" = s.id) > 0 THEN 'ROTATIVO'
        ELSE 'VACIA'
    END as tipo,
    COUNT(*) as cantidad
FROM "Session" s
JOIN "Vehicle" v ON v.id = s."vehicleId"
WHERE v.identifier = '$Vehicle'
AND s."startTime"::date = '$Date'::date
GROUP BY tipo
ORDER BY cantidad DESC;
"@
            
            $tipoQuery | Out-File -FilePath $tempQuery -Encoding UTF8
            $tipoResult = psql -U $dbUser -d $dbName -f $tempQuery -A -F "|" 2>&1
            
            if ($tipoResult) {
                $tipoLines = $tipoResult -split "`n" | Where-Object { $_ -match "\|" }
                foreach ($tline in $tipoLines) {
                    if ($tline -notmatch "tipo\|cantidad") {
                        Write-Host "  $tline" -ForegroundColor White
                    }
                }
            }
            
        }
        else {
            Write-Host "⚠️  No se encontraron sesiones para este vehículo y fecha" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n📖 SEGÚN ANÁLISIS REAL (resumendoback/):`n" -ForegroundColor Cyan
    Write-Host "  DOBACK024 30/09/2025 DEBERÍA tener:" -ForegroundColor White
    Write-Host "    Sesión #1: 09:33-10:38 (ESTABILIDAD + GPS + ROTATIVO)" -ForegroundColor White
    Write-Host "    Sesión #2: 12:41-14:05 (ESTABILIDAD + ROTATIVO, sin GPS)`n" -ForegroundColor White
    
    Write-Host "💡 CONCLUSIÓN:" -ForegroundColor Yellow
    Write-Host "  Si ves MÁS de 2 sesiones correlacionadas:" -ForegroundColor White
    Write-Host "    → El sistema está creando sesiones separadas por tipo" -ForegroundColor White
    Write-Host "    → Necesita correlación temporal mejorada`n" -ForegroundColor White
    
}
catch {
    Write-Host "`n❌ Error ejecutando query: $_" -ForegroundColor Red
}
finally {
    if (Test-Path $tempQuery) {
        Remove-Item $tempQuery
    }
}

Write-Host "📚 Ver análisis completo en:" -ForegroundColor Cyan
Write-Host "  resumendoback/Analisis_Sesiones_CMadrid_real.md`n" -ForegroundColor Gray

# 🔍 SCRIPT DE VERIFICACIÓN DE SESIONES GENERADAS
# Compara lo que se generó vs el análisis real
# Versión: 1.0
# Fecha: 2025-10-11

param(
    [string]$Vehicle = "DOBACK024",
    [string]$Date = "2025-09-30"
)

Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  VERIFICACIÓN DE SESIONES GENERADAS            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Vehículo: $Vehicle" -ForegroundColor Yellow
Write-Host "Fecha: $Date`n" -ForegroundColor Yellow

# Configuración de BD
$env:PGPASSWORD = "cosigein"
$dbName = "dobacksoft"
$dbUser = "postgres"

Write-Host "🔍 Consultando sesiones en BD..." -ForegroundColor Yellow

# Query para obtener sesiones del día
$query = @"
SELECT 
    s.id,
    s."sessionNumber",
    s."startTime",
    s."endTime",
    v.identifier as vehicle,
    s.source,
    (SELECT COUNT(*) FROM "GpsMeasurement" WHERE "sessionId" = s.id) as gps_count,
    (SELECT COUNT(*) FROM "StabilityMeasurement" WHERE "sessionId" = s.id) as stability_count,
    (SELECT COUNT(*) FROM "RotativoMeasurement" WHERE "sessionId" = s.id) as rotativo_count
FROM "Session" s
JOIN "Vehicle" v ON v.id = s."vehicleId"
WHERE v.identifier = '$Vehicle'
AND s."startTime"::date = '$Date'::date
ORDER BY s."startTime" ASC;
"@

$tempQuery = "temp-query.sql"
$query | Out-File -FilePath $tempQuery -Encoding UTF8

try {
    Write-Host "`n📊 SESIONES ENCONTRADAS EN BD:`n" -ForegroundColor Green
    
    $result = psql -U $dbUser -d $dbName -f $tempQuery -A -F "|" 2>&1
    
    if ($result) {
        # Parsear resultado
        $lines = $result -split "`n" | Where-Object { $_ -match "\|" }
        
        if ($lines.Count -gt 1) {
            # Header
            Write-Host $lines[0] -ForegroundColor Cyan
            Write-Host ("-" * 100) -ForegroundColor Gray
            
            $sessionCount = 0
            # Datos
            for ($i = 1; $i < $lines.Count; $i++) {
                $line = $lines[$i]
                if ($line -match "\|") {
                    Write-Host $line -ForegroundColor White
                    $sessionCount++
                }
            }
            
            Write-Host "`n✅ Total sesiones encontradas: $sessionCount`n" -ForegroundColor Green
            
            # Análisis de tipos
            Write-Host "📊 ANÁLISIS POR TIPO:`n" -ForegroundColor Yellow
            
            $tipoQuery = @"
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM "GpsMeasurement" WHERE "sessionId" = s.id) > 0 THEN 'GPS'
        WHEN (SELECT COUNT(*) FROM "StabilityMeasurement" WHERE "sessionId" = s.id) > 0 THEN 'ESTABILIDAD'
        WHEN (SELECT COUNT(*) FROM "RotativoMeasurement" WHERE "sessionId" = s.id) > 0 THEN 'ROTATIVO'
        ELSE 'VACIA'
    END as tipo,
    COUNT(*) as cantidad
FROM "Session" s
JOIN "Vehicle" v ON v.id = s."vehicleId"
WHERE v.identifier = '$Vehicle'
AND s."startTime"::date = '$Date'::date
GROUP BY tipo
ORDER BY cantidad DESC;
"@
            
            $tipoQuery | Out-File -FilePath $tempQuery -Encoding UTF8
            $tipoResult = psql -U $dbUser -d $dbName -f $tempQuery -A -F "|" 2>&1
            
            if ($tipoResult) {
                $tipoLines = $tipoResult -split "`n" | Where-Object { $_ -match "\|" }
                foreach ($tline in $tipoLines) {
                    if ($tline -notmatch "tipo\|cantidad") {
                        Write-Host "  $tline" -ForegroundColor White
                    }
                }
            }
            
        }
        else {
            Write-Host "⚠️  No se encontraron sesiones para este vehículo y fecha" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n📖 SEGÚN ANÁLISIS REAL (resumendoback/):`n" -ForegroundColor Cyan
    Write-Host "  DOBACK024 30/09/2025 DEBERÍA tener:" -ForegroundColor White
    Write-Host "    Sesión #1: 09:33-10:38 (ESTABILIDAD + GPS + ROTATIVO)" -ForegroundColor White
    Write-Host "    Sesión #2: 12:41-14:05 (ESTABILIDAD + ROTATIVO, sin GPS)`n" -ForegroundColor White
    
    Write-Host "💡 CONCLUSIÓN:" -ForegroundColor Yellow
    Write-Host "  Si ves MÁS de 2 sesiones correlacionadas:" -ForegroundColor White
    Write-Host "    → El sistema está creando sesiones separadas por tipo" -ForegroundColor White
    Write-Host "    → Necesita correlación temporal mejorada`n" -ForegroundColor White
    
}
catch {
    Write-Host "`n❌ Error ejecutando query: $_" -ForegroundColor Red
}
finally {
    if (Test-Path $tempQuery) {
        Remove-Item $tempQuery
    }
}

Write-Host "📚 Ver análisis completo en:" -ForegroundColor Cyan
Write-Host "  resumendoback/Analisis_Sesiones_CMadrid_real.md`n" -ForegroundColor Gray

