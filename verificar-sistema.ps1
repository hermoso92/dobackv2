# DOBACKSOFT - Verificacion Exhaustiva del Sistema
# ===================================================

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "  VERIFICACION DEL SISTEMA" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$passed = 0
$failed = 0
$total = 0

function Test-Check {
    param([string]$Name, [scriptblock]$Test)
    
    $total++
    Write-Host "`n[$total] $Name..." -ForegroundColor Yellow -NoNewline
    
    try {
        $result = & $Test
        if ($result) {
            Write-Host " OK" -ForegroundColor Green
            $script:passed++
            return $true
        }
        else {
            Write-Host " FAIL" -ForegroundColor Red
            $script:failed++
            return $false
        }
    }
    catch {
        Write-Host " ERROR" -ForegroundColor Red
        Write-Host "  $_" -ForegroundColor Gray
        $script:failed++
        return $false
    }
}

Write-Host "`n[1] Verificando estructura de archivos..." -ForegroundColor Cyan

Test-Check "Backend index.ts existe" {
    Test-Path "backend\src\index.ts"
}

Test-Check "Frontend App.tsx existe" {
    Test-Path "frontend\src\App.tsx"
}

Test-Check "Prisma schema existe" {
    Test-Path "backend\prisma\schema.prisma"
}

Test-Check "Carpeta logs existe" {
    Test-Path "logs"
}

Write-Host "`n[2] Verificando servicios..." -ForegroundColor Cyan

Test-Check "Backend responde (9998)" {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9998/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

Test-Check "Frontend responde (5174)" {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5174" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

Test-Check "Base de datos accesible" {
    try {
        $env:PGPASSWORD = 'cosigein'
        $null = psql -U postgres -h localhost -d dobacksoft -c "SELECT 1;" 2>&1
        return $LASTEXITCODE -eq 0
    }
    catch {
        return $false
    }
}

Write-Host "`n[3] Verificando base de datos..." -ForegroundColor Cyan

Test-Check "Tabla User existe" {
    try {
        $env:PGPASSWORD = 'cosigein'
        $null = psql -U postgres -h localhost -d dobacksoft -c "SELECT COUNT(*) FROM \`"User\`";" 2>&1
        return $LASTEXITCODE -eq 0
    }
    catch {
        return $false
    }
}

Test-Check "Tabla MissingFileAlert existe" {
    try {
        $env:PGPASSWORD = 'cosigein'
        $null = psql -U postgres -h localhost -d dobacksoft -c "SELECT COUNT(*) FROM \`"MissingFileAlert\`";" 2>&1
        return $LASTEXITCODE -eq 0
    }
    catch {
        return $false
    }
}

Test-Check "Tabla ScheduledReport existe" {
    try {
        $env:PGPASSWORD = 'cosigein'
        $null = psql -U postgres -h localhost -d dobacksoft -c "SELECT COUNT(*) FROM \`"ScheduledReport\`";" 2>&1
        return $LASTEXITCODE -eq 0
    }
    catch {
        return $false
    }
}

Write-Host "`n[4] Verificando usuarios y roles..." -ForegroundColor Cyan

Test-Check "Usuario test es MANAGER" {
    try {
        $env:PGPASSWORD = 'cosigein'
        $result = psql -U postgres -h localhost -d dobacksoft -t -c "SELECT role FROM \`"User\`" WHERE email = 'test@bomberosmadrid.es';" 2>&1
        return $result -match 'MANAGER'
    }
    catch {
        return $false
    }
}

Test-Check "Usuario antonio es ADMIN" {
    try {
        $env:PGPASSWORD = 'cosigein'
        $result = psql -U postgres -h localhost -d dobacksoft -t -c "SELECT role FROM \`"User\`" WHERE email = 'antoniohermoso92@gmail.com';" 2>&1
        return $result -match 'ADMIN'
    }
    catch {
        return $false
    }
}

Write-Host "`n[5] Verificando logs..." -ForegroundColor Cyan

Test-Check "Logs de backend guardandose" {
    $backendLogs = Get-ChildItem logs -Filter "backend_*.log" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($backendLogs) {
        $age = (Get-Date) - $backendLogs.LastWriteTime
        return $age.TotalMinutes -lt 60
    }
    return $false
}

Test-Check "Logs de frontend guardandose" {
    $frontendLogs = Get-ChildItem logs -Filter "frontend_*.log" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($frontendLogs) {
        $age = (Get-Date) - $frontendLogs.LastWriteTime
        return $age.TotalMinutes -lt 60
    }
    return $false
}

Write-Host "`n[6] Verificando archivos implementados..." -ForegroundColor Cyan

Test-Check "AlertService implementado" {
    Test-Path "backend\src\services\AlertService.ts"
}

Test-Check "ScheduledReportService implementado" {
    Test-Path "backend\src\services\ScheduledReportService.ts"
}

Test-Check "AlertSystemManager implementado" {
    Test-Path "frontend\src\components\alerts\AlertSystemManager.tsx"
}

Test-Check "ManagerAdministration implementado" {
    Test-Path "frontend\src\pages\ManagerAdministration.tsx"
}

Test-Check "usePermissions hook implementado" {
    Test-Path "frontend\src\hooks\usePermissions.ts"
}

Test-Check "Authorization middleware implementado" {
    Test-Path "backend\src\middleware\authorization.ts"
}

Test-Check "SystemStatus endpoint implementado" {
    Test-Path "backend\src\routes\systemStatus.ts"
}

Test-Check "SystemStatusPage implementado" {
    Test-Path "frontend\src\pages\SystemStatusPage.tsx"
}

Write-Host "`n[7] Verificando dependencias..." -ForegroundColor Cyan

Test-Check "node_modules backend" {
    Test-Path "backend\node_modules"
}

Test-Check "node_modules frontend" {
    Test-Path "frontend\node_modules"
}

Test-Check "Prisma Client generado" {
    Test-Path "backend\node_modules\.prisma\client"
}

Write-Host "`n[8] Verificando scripts y docs..." -ForegroundColor Cyan

Test-Check "Script monitorear-logs.ps1" {
    Test-Path "monitorear-logs.ps1"
}

Test-Check "Script ver-logs.ps1" {
    Test-Path "ver-logs.ps1"
}

Test-Check "Checklist completo" {
    Test-Path "CHECKLIST-VERIFICACION-COMPLETA.md"
}

Test-Check "Documentacion testing" {
    Test-Path "docs\TESTING\GUIA-VERIFICACION-COMPLETA.md"
}

Test-Check "Credenciales guardadas" {
    Test-Path "CREDENCIALES-SISTEMA.txt"
}

# RESUMEN FINAL
Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "  RESUMEN DE VERIFICACION" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$successRate = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 1) } else { 0 }

Write-Host "`nTests totales:  $total" -ForegroundColor White
Write-Host "Pasados:        $passed" -ForegroundColor Green
Write-Host "Fallidos:       $failed" -ForegroundColor Red
Write-Host "Tasa exito:     $successRate%" -ForegroundColor $(if ($successRate -ge 90) { "Green" } elseif ($successRate -ge 70) { "Yellow" } else { "Red" })

# Generar reporte simple
$reportPath = "logs\verification-report-$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').txt"
$report = @"
REPORTE DE VERIFICACION - DOBACKSOFT
Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

Tests totales: $total
Pasados: $passed
Fallidos: $failed
Tasa de exito: $successRate%

Estado: $(if ($failed -eq 0) { "SISTEMA VERIFICADO CORRECTAMENTE" } else { "SE ENCONTRARON $failed PROBLEMAS" })
"@

$report | Out-File -FilePath $reportPath -Encoding UTF8

Write-Host "`nReporte guardado: $reportPath" -ForegroundColor Cyan

if ($failed -gt 0) {
    Write-Host "`nADVERTENCIA: Se encontraron $failed problemas" -ForegroundColor Yellow
    Write-Host "Revisa el reporte para mas detalles" -ForegroundColor Gray
    exit 1
}
else {
    Write-Host "`nSISTEMA VERIFICADO CORRECTAMENTE" -ForegroundColor Green
    exit 0
}
