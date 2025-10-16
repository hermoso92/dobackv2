# Test del Sistema de Upload
# Simple y directo

Write-Host "`n=== TEST SISTEMA UPLOAD ===" -ForegroundColor Cyan

# 1. Verificar backend
Write-Host "`n[1/4] Verificando backend..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:9998/health" -TimeoutSec 5
    Write-Host "[OK] Backend respondiendo" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Backend no responde. Ejecuta 'iniciar.ps1' primero" -ForegroundColor Red
    exit 1
}

# 2. Limpiar BD usando psql directamente
Write-Host "`n[2/4] Limpiando base de datos..." -ForegroundColor Yellow

# Leer DATABASE_URL del .env
$envContent = Get-Content ".env" -Raw
if ($envContent -match 'DATABASE_URL="postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/([^"]+)"') {
    $DB_USER = $matches[1]
    $DB_PASS = $matches[2]
    $DB_HOST = $matches[3]
    $DB_PORT = $matches[4]
    $DB_NAME = $matches[5]
    
    $env:PGPASSWORD = $DB_PASS
    
    # Limpiar en orden correcto
    $null = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c 'DELETE FROM "Measurement";' 2>&1
    $null = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c 'DELETE FROM "Session";' 2>&1
    
    # Verificar limpieza
    $countResult = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c 'SELECT COUNT(*) FROM "Session";' 2>&1
    
    # Convertir a string y verificar
    $countStr = $countResult | Out-String
    if ($countStr -and $countStr.Trim() -eq "0") {
        Write-Host "[OK] Base de datos limpia" -ForegroundColor Green
    }
    else {
        Write-Host "[WARNING] Estado de BD incierto, continuando..." -ForegroundColor Yellow
    }
}
else {
    Write-Host "[ERROR] No se pudo parsear DATABASE_URL del .env" -ForegroundColor Red
    exit 1
}

# 3. Procesar archivos
Write-Host "`n[3/4] Procesando archivos CMadrid..." -ForegroundColor Yellow
Write-Host "      (Esto puede tardar 2-3 minutos)..." -ForegroundColor Gray

try {
    $result = Invoke-RestMethod -Uri "http://localhost:9998/api/upload/process-all-cmadrid" `
        -Method POST `
        -ContentType "application/json" `
        -TimeoutSec 300
    
    Write-Host "[OK] Procesamiento completado" -ForegroundColor Green
    Write-Host "     Archivos: $($result.data.totalFiles)" -ForegroundColor Gray
    Write-Host "     Sesiones creadas: $($result.data.totalSaved)" -ForegroundColor Gray
    Write-Host "     Sesiones omitidas: $($result.data.totalSkipped)" -ForegroundColor Gray
}
catch {
    Write-Host "[ERROR] Fallo en procesamiento: $_" -ForegroundColor Red
    exit 1
}

# 4. Verificar resultado para DOBACK024 - 30/09/2025
Write-Host "`n[4/4] Verificando resultado..." -ForegroundColor Yellow

# Consultar BD directamente
$query = @"
SELECT 
  s."sessionNumber",
  TO_CHAR(s."startTime", 'HH24:MI:SS') as inicio,
  TO_CHAR(s."endTime", 'HH24:MI:SS') as fin,
  COUNT(m.id) as mediciones
FROM "Session" s
LEFT JOIN "Measurement" m ON m."sessionId" = s.id
INNER JOIN "Vehicle" v ON s."vehicleId" = v.id
WHERE v."vehicleIdentifier" = 'DOBACK024'
  AND DATE(s."startTime") = '2025-09-30'
GROUP BY s.id, s."sessionNumber", s."startTime", s."endTime"
ORDER BY s."sessionNumber";
"@

$sessions = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c $query 2>&1

Write-Host "`nDOBACK024 - 30/09/2025:"

if ($sessions -and $sessions -notlike "*ERROR*") {
    # Contar sesiones
    $lines = $sessions -split "`n" | Where-Object { $_.Trim() -ne "" }
    $count = $lines.Count
    
    Write-Host "  Sesiones encontradas: $count"
    Write-Host "  Sesiones esperadas: 2"
    Write-Host "`n  Detalle:"
    $lines | ForEach-Object { Write-Host "    $_" }
    
    if ($count -eq 2) {
        Write-Host "`n[EXITO] Sistema funciona correctamente!" -ForegroundColor Green
    }
    else {
        Write-Host "`n[FALLO] Se esperaban 2 sesiones, se encontraron $count" -ForegroundColor Red
    }
}
else {
    Write-Host "  [ERROR] No se pudieron obtener las sesiones" -ForegroundColor Red
    Write-Host "  Error: $sessions" -ForegroundColor Gray
    exit 1
}

Write-Host "`n=== FIN TEST ===`n" -ForegroundColor Cyan

# Simple y directo

Write-Host "`n=== TEST SISTEMA UPLOAD ===" -ForegroundColor Cyan

# 1. Verificar backend
Write-Host "`n[1/4] Verificando backend..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:9998/health" -TimeoutSec 5
    Write-Host "[OK] Backend respondiendo" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Backend no responde. Ejecuta 'iniciar.ps1' primero" -ForegroundColor Red
    exit 1
}

# 2. Limpiar BD usando psql directamente
Write-Host "`n[2/4] Limpiando base de datos..." -ForegroundColor Yellow

# Leer DATABASE_URL del .env
$envContent = Get-Content ".env" -Raw
if ($envContent -match 'DATABASE_URL="postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/([^"]+)"') {
    $DB_USER = $matches[1]
    $DB_PASS = $matches[2]
    $DB_HOST = $matches[3]
    $DB_PORT = $matches[4]
    $DB_NAME = $matches[5]
    
    $env:PGPASSWORD = $DB_PASS
    
    # Limpiar en orden correcto
    $null = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c 'DELETE FROM "Measurement";' 2>&1
    $null = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c 'DELETE FROM "Session";' 2>&1
    
    # Verificar limpieza
    $countResult = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c 'SELECT COUNT(*) FROM "Session";' 2>&1
    
    # Convertir a string y verificar
    $countStr = $countResult | Out-String
    if ($countStr -and $countStr.Trim() -eq "0") {
        Write-Host "[OK] Base de datos limpia" -ForegroundColor Green
    }
    else {
        Write-Host "[WARNING] Estado de BD incierto, continuando..." -ForegroundColor Yellow
    }
}
else {
    Write-Host "[ERROR] No se pudo parsear DATABASE_URL del .env" -ForegroundColor Red
    exit 1
}

# 3. Procesar archivos
Write-Host "`n[3/4] Procesando archivos CMadrid..." -ForegroundColor Yellow
Write-Host "      (Esto puede tardar 2-3 minutos)..." -ForegroundColor Gray

try {
    $result = Invoke-RestMethod -Uri "http://localhost:9998/api/upload/process-all-cmadrid" `
        -Method POST `
        -ContentType "application/json" `
        -TimeoutSec 300
    
    Write-Host "[OK] Procesamiento completado" -ForegroundColor Green
    Write-Host "     Archivos: $($result.data.totalFiles)" -ForegroundColor Gray
    Write-Host "     Sesiones creadas: $($result.data.totalSaved)" -ForegroundColor Gray
    Write-Host "     Sesiones omitidas: $($result.data.totalSkipped)" -ForegroundColor Gray
}
catch {
    Write-Host "[ERROR] Fallo en procesamiento: $_" -ForegroundColor Red
    exit 1
}

# 4. Verificar resultado para DOBACK024 - 30/09/2025
Write-Host "`n[4/4] Verificando resultado..." -ForegroundColor Yellow

# Consultar BD directamente
$query = @"
SELECT 
  s."sessionNumber",
  TO_CHAR(s."startTime", 'HH24:MI:SS') as inicio,
  TO_CHAR(s."endTime", 'HH24:MI:SS') as fin,
  COUNT(m.id) as mediciones
FROM "Session" s
LEFT JOIN "Measurement" m ON m."sessionId" = s.id
INNER JOIN "Vehicle" v ON s."vehicleId" = v.id
WHERE v."vehicleIdentifier" = 'DOBACK024'
  AND DATE(s."startTime") = '2025-09-30'
GROUP BY s.id, s."sessionNumber", s."startTime", s."endTime"
ORDER BY s."sessionNumber";
"@

$sessions = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c $query 2>&1

Write-Host "`nDOBACK024 - 30/09/2025:"

if ($sessions -and $sessions -notlike "*ERROR*") {
    # Contar sesiones
    $lines = $sessions -split "`n" | Where-Object { $_.Trim() -ne "" }
    $count = $lines.Count
    
    Write-Host "  Sesiones encontradas: $count"
    Write-Host "  Sesiones esperadas: 2"
    Write-Host "`n  Detalle:"
    $lines | ForEach-Object { Write-Host "    $_" }
    
    if ($count -eq 2) {
        Write-Host "`n[EXITO] Sistema funciona correctamente!" -ForegroundColor Green
    }
    else {
        Write-Host "`n[FALLO] Se esperaban 2 sesiones, se encontraron $count" -ForegroundColor Red
    }
}
else {
    Write-Host "  [ERROR] No se pudieron obtener las sesiones" -ForegroundColor Red
    Write-Host "  Error: $sessions" -ForegroundColor Gray
    exit 1
}

Write-Host "`n=== FIN TEST ===`n" -ForegroundColor Cyan

