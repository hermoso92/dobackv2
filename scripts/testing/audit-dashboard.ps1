<#
.SYNOPSIS
    Auditoría automatizada del Dashboard StabilSafe V3 - Versión Corregida
    
.PARAMETER LogLevel
    Nivel de log: DEBUG, INFO, WARNING, ERROR (por defecto: INFO)
    
.EXAMPLE
    .\audit-dashboard-v2.ps1
#>

param(
    [string]$LogLevel = "INFO"
)

$ErrorActionPreference = "Stop"

# Importar funciones auxiliares
$helpersPath = Join-Path $PSScriptRoot "test-helpers.ps1"
if (-not (Test-Path $helpersPath)) {
    Write-Error "No se encontró test-helpers.ps1"
    exit 1
}

. $helpersPath

Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "  AUDITORIA DASHBOARD STABILSAFE V3"  -ForegroundColor Cyan
Write-Host "========================================`n"  -ForegroundColor Cyan

# Configuración
$config = @{
    BackendUrl    = "http://localhost:9998"
    FrontendUrl   = "http://localhost:5174"
    AuthEndpoint  = "/api/auth/login"
    AdminEmail    = "test@bomberosmadrid.es"
    AdminPassword = "admin123"
    DateFrom      = "2025-09-29"
    DateTo        = "2025-10-08"
}

# Crear directorio de salida
$outputDir = New-OutputDirectory -BasePath "scripts/testing/results"
$logFile = Join-Path $outputDir "audit-debug.log"

# Inicializar logging
Initialize-Logging -LogFilePath $logFile -Level $LogLevel

Write-Log "=== AUDITORIA INICIADA ===" -Level "INFO"

# Inicializar resultados
$results = Initialize-TestResults

# =============================================================================
# FASE 1: VERIFICACIÓN DE SERVICIOS
# =============================================================================

Write-Host "`nFASE 1: Verificacion de Servicios" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Test Backend
Write-Host "`nVerificando Backend..." -ForegroundColor Yellow
$backendHealth = Test-ServiceAvailability -Url "$($config.BackendUrl)/health" -ServiceName "Backend"

$results.Services["Backend"] = @{
    Status    = if ($backendHealth.Available) { "running" } else { "down" }
    Port      = 9998
    Available = $backendHealth.Available
    Error     = $backendHealth.Error
}

if ($backendHealth.Available) {
    Write-Host "  OK Backend disponible" -ForegroundColor Green
}
else {
    Write-Host "  ERROR Backend NO disponible" -ForegroundColor Red
    Export-TestResultsToJson -Results $results -OutputPath (Join-Path $outputDir "audit-data.json")
    Export-TestResultsToMarkdown -Results $results -OutputPath (Join-Path $outputDir "audit-report.md")
    Write-Host "`nAUDITORIA ABORTADA: Backend no disponible`n" -ForegroundColor Red
    exit 1
}

# Test Frontend
Write-Host "`nVerificando Frontend..." -ForegroundColor Yellow
$frontendHealth = Test-ServiceAvailability -Url $config.FrontendUrl -ServiceName "Frontend"

$results.Services["Frontend"] = @{
    Status    = if ($frontendHealth.Available) { "running" } else { "down" }
    Port      = 5174
    Available = $frontendHealth.Available
    Error     = $frontendHealth.Error
}

if ($frontendHealth.Available) {
    Write-Host "  OK Frontend disponible" -ForegroundColor Green
}
else {
    Write-Host "  WARNING Frontend NO disponible" -ForegroundColor Yellow
}

# =============================================================================
# FASE 2: AUTENTICACIÓN
# =============================================================================

Write-Host "`nFASE 2: Autenticacion" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nProbando login como ADMIN..." -ForegroundColor Yellow
$adminAuth = Get-AuthToken -BaseUrl $config.BackendUrl -AuthEndpoint $config.AuthEndpoint -Email $config.AdminEmail -Password $config.AdminPassword

if ($adminAuth.Success) {
    Write-Host "  OK Login ADMIN exitoso" -ForegroundColor Green
    $results.Summary.Passed++
}
else {
    Write-Host "  ERROR Login ADMIN fallido" -ForegroundColor Red
    $results.Summary.Failed++
}

$results.Summary.TotalTests++

$authToken = $adminAuth.Token
$organizationId = $adminAuth.OrganizationId

if (-not $authToken) {
    Write-Host "`nERROR: No se pudo obtener token de autenticacion`n" -ForegroundColor Red
    Export-TestResultsToJson -Results $results -OutputPath (Join-Path $outputDir "audit-data.json")
    Export-TestResultsToMarkdown -Results $results -OutputPath (Join-Path $outputDir "audit-report.md")
    exit 1
}

Write-Log "Organization ID: $organizationId" -Level "INFO"

# =============================================================================
# FASE 3: PRUEBAS DE ENDPOINTS
# =============================================================================

Write-Host "`nFASE 3: Pruebas de Endpoints Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $authToken"
    "Content-Type"  = "application/json"
}

# Test 1: GET /api/summary
Write-Host "`nTest: GET /api/summary" -ForegroundColor Yellow
$summaryUrl = "{0}/api/summary?from={1}&to={2}&force=true" -f $config.BackendUrl, $config.DateFrom, $config.DateTo
$summaryResponse = Invoke-ApiRequest -Url $summaryUrl -Method "GET" -Headers $headers -TimeoutSeconds 30

$summaryPass = $summaryResponse.Success -and ($summaryResponse.StatusCode -eq 200 -or $summaryResponse.StatusCode -eq 304) -and ($summaryResponse.DurationMs -lt 3000)

Write-Host "  Status: $($summaryResponse.StatusCode) | Tiempo: $($summaryResponse.DurationMs)ms" -ForegroundColor $(if ($summaryPass) { "Green" } else { "Red" })

if ($summaryPass) {
    Write-Host "  OK PASS" -ForegroundColor Green
}
else {
    Write-Host "  FAIL" -ForegroundColor Red
}

Add-TestResult -Results $results -Category "Endpoint" -TestData @{
    Url        = "/api/summary"
    Method     = "GET"
    StatusCode = $summaryResponse.StatusCode
    DurationMs = $summaryResponse.DurationMs
    Pass       = $summaryPass
    Error      = $summaryResponse.Error
}

# Test 2: GET /api/devices/status
Write-Host "`nTest: GET /api/devices/status" -ForegroundColor Yellow
$dateToday = Get-Date -Format 'yyyy-MM-dd'
$devicesUrl = "{0}/api/devices/status?organizationId={1}&date={2}" -f $config.BackendUrl, $organizationId, $dateToday
$devicesResponse = Invoke-ApiRequest -Url $devicesUrl -Method "GET" -Headers $headers -TimeoutSeconds 10

$devicesPass = $devicesResponse.Success -and ($devicesResponse.StatusCode -eq 200 -or $devicesResponse.StatusCode -eq 304) -and ($devicesResponse.DurationMs -lt 1000)

Write-Host "  Status: $($devicesResponse.StatusCode) | Tiempo: $($devicesResponse.DurationMs)ms" -ForegroundColor $(if ($devicesPass) { "Green" } else { "Yellow" })

if ($devicesPass) {
    Write-Host "  OK PASS" -ForegroundColor Green
}
else {
    Write-Host "  WARNING" -ForegroundColor Yellow
}

Add-TestResult -Results $results -Category "Endpoint" -TestData @{
    Url        = "/api/devices/status"
    Method     = "GET"
    StatusCode = $devicesResponse.StatusCode
    DurationMs = $devicesResponse.DurationMs
    Pass       = $devicesPass
    Error      = $devicesResponse.Error
}

# Test 3: GET /api/sessions
Write-Host "`nTest: GET /api/sessions" -ForegroundColor Yellow
$sessionsUrl = "{0}/api/sessions?organizationId={1}&page=1&limit=10" -f $config.BackendUrl, $organizationId
$sessionsResponse = Invoke-ApiRequest -Url $sessionsUrl -Method "GET" -Headers $headers -TimeoutSeconds 10

$sessionsPass = $sessionsResponse.Success -and ($sessionsResponse.StatusCode -eq 200)

Write-Host "  Status: $($sessionsResponse.StatusCode) | Tiempo: $($sessionsResponse.DurationMs)ms" -ForegroundColor $(if ($sessionsPass) { "Green" } else { "Yellow" })

if ($sessionsPass) {
    Write-Host "  OK PASS" -ForegroundColor Green
}
else {
    Write-Host "  WARNING" -ForegroundColor Yellow
}

Add-TestResult -Results $results -Category "Endpoint" -TestData @{
    Url        = "/api/sessions"
    Method     = "GET"
    StatusCode = $sessionsResponse.StatusCode
    DurationMs = $sessionsResponse.DurationMs
    Pass       = $sessionsPass
    Error      = $sessionsResponse.Error
}

# Test 4: GET /api/events
Write-Host "`nTest: GET /api/events" -ForegroundColor Yellow
$eventsUrl = "{0}/api/events?organizationId={1}&page=1&limit=50" -f $config.BackendUrl, $organizationId
$eventsResponse = Invoke-ApiRequest -Url $eventsUrl -Method "GET" -Headers $headers -TimeoutSeconds 10

$eventsPass = $eventsResponse.Success -and ($eventsResponse.StatusCode -eq 200)

Write-Host "  Status: $($eventsResponse.StatusCode) | Tiempo: $($eventsResponse.DurationMs)ms" -ForegroundColor $(if ($eventsPass) { "Green" } else { "Yellow" })

if ($eventsPass) {
    Write-Host "  OK PASS" -ForegroundColor Green
    
    if ($eventsResponse.Content) {
        try {
            $eventsData = $eventsResponse.Content | ConvertFrom-Json
            if ($eventsData.events -and $eventsData.events.Count -gt 0) {
                Write-Host "  Eventos encontrados: $($eventsData.events.Count)" -ForegroundColor Green
            }
        }
        catch {
            Write-Log "Error parseando respuesta de eventos" -Level "WARNING"
        }
    }
}
else {
    Write-Host "  WARNING" -ForegroundColor Yellow
}

Add-TestResult -Results $results -Category "Endpoint" -TestData @{
    Url        = "/api/events"
    Method     = "GET"
    StatusCode = $eventsResponse.StatusCode
    DurationMs = $eventsResponse.DurationMs
    Pass       = $eventsPass
    Error      = $eventsResponse.Error
}

# =============================================================================
# FASE 4: MÉTRICAS DE RENDIMIENTO
# =============================================================================

Write-Host "`nFASE 4: Metricas de Rendimiento" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$endpointTimes = $results.Endpoints | ForEach-Object { $_.DurationMs }
$avgTime = if ($endpointTimes.Count -gt 0) { ($endpointTimes | Measure-Object -Average).Average } else { 0 }

$summaryTimes = $results.Endpoints | Where-Object { $_.Url -like "*summary*" } | ForEach-Object { $_.DurationMs }
$avgSummaryTime = if ($summaryTimes.Count -gt 0) { ($summaryTimes | Measure-Object -Average).Average } else { 0 }

$results.Performance = @{
    avg_summary_time_ms      = [math]::Round($avgSummaryTime, 2)
    avg_other_endpoints_ms   = [math]::Round($avgTime, 2)
    frontend_initial_load_ms = "N/A"
}

Write-Host "`nResumen de Rendimiento:" -ForegroundColor Yellow
Write-Host "  Tiempo promedio /summary: $($results.Performance.avg_summary_time_ms)ms (threshold: menos de 3000ms)" -ForegroundColor Cyan
Write-Host "  Tiempo promedio otros endpoints: $($results.Performance.avg_other_endpoints_ms)ms (threshold: menos de 1000ms)" -ForegroundColor Cyan

# =============================================================================
# FASE 5: VALIDACIÓN DE UI
# =============================================================================

Write-Host "`nFASE 5: Validacion de UI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n  La validacion de UI requiere revision manual" -ForegroundColor Cyan
Write-Host "  Consulta el checklist en: scripts/testing/dashboard-ui-checklist.md" -ForegroundColor Cyan
Write-Host "`n  Para automatizacion completa, ejecutar:" -ForegroundColor Yellow
Write-Host "  node scripts/testing/audit-ui-playwright.js" -ForegroundColor Gray

$results.UIChecks = @{
    no_scroll_main_container = "MANUAL_CHECK_REQUIRED"
    tabs_load_successfully   = "MANUAL_CHECK_REQUIRED"
    filters_responsive       = "MANUAL_CHECK_REQUIRED"
    pdf_exports_work         = "MANUAL_CHECK_REQUIRED"
    note                     = "Ejecutar checklist manual o script Playwright para validacion completa"
}

# =============================================================================
# FASE 6: GENERACIÓN DE REPORTES
# =============================================================================

Write-Host "`nFASE 6: Generacion de Reportes" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$jsonPath = Join-Path $outputDir "audit-data.json"
$mdPath = Join-Path $outputDir "audit-report.md"

Export-TestResultsToJson -Results $results -OutputPath $jsonPath
Export-TestResultsToMarkdown -Results $results -OutputPath $mdPath

Write-Host "`nReportes generados:" -ForegroundColor Green
Write-Host "  JSON:     $jsonPath" -ForegroundColor Cyan
Write-Host "  Markdown: $mdPath" -ForegroundColor Cyan
Write-Host "  Log:      $logFile" -ForegroundColor Cyan

# =============================================================================
# RESUMEN FINAL
# =============================================================================

Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "  RESUMEN DE AUDITORIA"  -ForegroundColor Cyan
Write-Host "========================================`n"  -ForegroundColor Cyan

Write-Host "Resultados:" -ForegroundColor Yellow
Write-Host "  Total de pruebas: $($results.Summary.TotalTests)" -ForegroundColor White
Write-Host "  Exitosas:         $($results.Summary.Passed)" -ForegroundColor Green
Write-Host "  Fallidas:         $($results.Summary.Failed)" -ForegroundColor Red
Write-Host "  Advertencias:     $($results.Summary.Warnings)" -ForegroundColor Yellow

$successRate = if ($results.Summary.TotalTests -gt 0) { 
    [math]::Round(($results.Summary.Passed / $results.Summary.TotalTests) * 100, 2) 
}
else { 
    0 
}

Write-Host "`nTasa de exito: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })

if ($results.Summary.Failed -eq 0) {
    Write-Host "`nAUDITORIA COMPLETADA EXITOSAMENTE`n" -ForegroundColor Green
}
elseif ($results.Summary.Failed -le 2) {
    Write-Host "`nAUDITORIA COMPLETADA CON ADVERTENCIAS`n" -ForegroundColor Yellow
}
else {
    Write-Host "`nAUDITORIA COMPLETADA CON ERRORES CRITICOS`n" -ForegroundColor Red
}

Write-Log "=== AUDITORIA FINALIZADA ===" -Level "INFO"

exit $(if ($results.Summary.Failed -eq 0) { 0 } else { 1 })

.SYNOPSIS
Auditoría automatizada del Dashboard StabilSafe V3 - Versión Corregida
    
.PARAMETER LogLevel
Nivel de log: DEBUG, INFO, WARNING, ERROR (por defecto: INFO)
    
.EXAMPLE
.\audit-dashboard-v2.ps1
#>

param(
    [string]$LogLevel = "INFO"
)

$ErrorActionPreference = "Stop"

# Importar funciones auxiliares
$helpersPath = Join-Path $PSScriptRoot "test-helpers.ps1"
if (-not (Test-Path $helpersPath)) {
    Write-Error "No se encontró test-helpers.ps1"
    exit 1
}

. $helpersPath

Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "  AUDITORIA DASHBOARD STABILSAFE V3"  -ForegroundColor Cyan
Write-Host "========================================`n"  -ForegroundColor Cyan

# Configuración
$config = @{
    BackendUrl    = "http://localhost:9998"
    FrontendUrl   = "http://localhost:5174"
    AuthEndpoint  = "/api/auth/login"
    AdminEmail    = "test@bomberosmadrid.es"
    AdminPassword = "admin123"
    DateFrom      = "2025-09-29"
    DateTo        = "2025-10-08"
}

# Crear directorio de salida
$outputDir = New-OutputDirectory -BasePath "scripts/testing/results"
$logFile = Join-Path $outputDir "audit-debug.log"

# Inicializar logging
Initialize-Logging -LogFilePath $logFile -Level $LogLevel

Write-Log "=== AUDITORIA INICIADA ===" -Level "INFO"

# Inicializar resultados
$results = Initialize-TestResults

# =============================================================================
# FASE 1: VERIFICACIÓN DE SERVICIOS
# =============================================================================

Write-Host "`nFASE 1: Verificacion de Servicios" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Test Backend
Write-Host "`nVerificando Backend..." -ForegroundColor Yellow
$backendHealth = Test-ServiceAvailability -Url "$($config.BackendUrl)/health" -ServiceName "Backend"

$results.Services["Backend"] = @{
    Status    = if ($backendHealth.Available) { "running" } else { "down" }
    Port      = 9998
    Available = $backendHealth.Available
    Error     = $backendHealth.Error
}

if ($backendHealth.Available) {
    Write-Host "  OK Backend disponible" -ForegroundColor Green
}
else {
    Write-Host "  ERROR Backend NO disponible" -ForegroundColor Red
    Export-TestResultsToJson -Results $results -OutputPath (Join-Path $outputDir "audit-data.json")
    Export-TestResultsToMarkdown -Results $results -OutputPath (Join-Path $outputDir "audit-report.md")
    Write-Host "`nAUDITORIA ABORTADA: Backend no disponible`n" -ForegroundColor Red
    exit 1
}

# Test Frontend
Write-Host "`nVerificando Frontend..." -ForegroundColor Yellow
$frontendHealth = Test-ServiceAvailability -Url $config.FrontendUrl -ServiceName "Frontend"

$results.Services["Frontend"] = @{
    Status    = if ($frontendHealth.Available) { "running" } else { "down" }
    Port      = 5174
    Available = $frontendHealth.Available
    Error     = $frontendHealth.Error
}

if ($frontendHealth.Available) {
    Write-Host "  OK Frontend disponible" -ForegroundColor Green
}
else {
    Write-Host "  WARNING Frontend NO disponible" -ForegroundColor Yellow
}

# =============================================================================
# FASE 2: AUTENTICACIÓN
# =============================================================================

Write-Host "`nFASE 2: Autenticacion" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nProbando login como ADMIN..." -ForegroundColor Yellow
$adminAuth = Get-AuthToken -BaseUrl $config.BackendUrl -AuthEndpoint $config.AuthEndpoint -Email $config.AdminEmail -Password $config.AdminPassword

if ($adminAuth.Success) {
    Write-Host "  OK Login ADMIN exitoso" -ForegroundColor Green
    $results.Summary.Passed++
}
else {
    Write-Host "  ERROR Login ADMIN fallido" -ForegroundColor Red
    $results.Summary.Failed++
}

$results.Summary.TotalTests++

$authToken = $adminAuth.Token
$organizationId = $adminAuth.OrganizationId

if (-not $authToken) {
    Write-Host "`nERROR: No se pudo obtener token de autenticacion`n" -ForegroundColor Red
    Export-TestResultsToJson -Results $results -OutputPath (Join-Path $outputDir "audit-data.json")
    Export-TestResultsToMarkdown -Results $results -OutputPath (Join-Path $outputDir "audit-report.md")
    exit 1
}

Write-Log "Organization ID: $organizationId" -Level "INFO"

# =============================================================================
# FASE 3: PRUEBAS DE ENDPOINTS
# =============================================================================

Write-Host "`nFASE 3: Pruebas de Endpoints Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $authToken"
    "Content-Type"  = "application/json"
}

# Test 1: GET /api/summary
Write-Host "`nTest: GET /api/summary" -ForegroundColor Yellow
$summaryUrl = "{0}/api/summary?from={1}&to={2}&force=true" -f $config.BackendUrl, $config.DateFrom, $config.DateTo
$summaryResponse = Invoke-ApiRequest -Url $summaryUrl -Method "GET" -Headers $headers -TimeoutSeconds 30

$summaryPass = $summaryResponse.Success -and ($summaryResponse.StatusCode -eq 200 -or $summaryResponse.StatusCode -eq 304) -and ($summaryResponse.DurationMs -lt 3000)

Write-Host "  Status: $($summaryResponse.StatusCode) | Tiempo: $($summaryResponse.DurationMs)ms" -ForegroundColor $(if ($summaryPass) { "Green" } else { "Red" })

if ($summaryPass) {
    Write-Host "  OK PASS" -ForegroundColor Green
}
else {
    Write-Host "  FAIL" -ForegroundColor Red
}

Add-TestResult -Results $results -Category "Endpoint" -TestData @{
    Url        = "/api/summary"
    Method     = "GET"
    StatusCode = $summaryResponse.StatusCode
    DurationMs = $summaryResponse.DurationMs
    Pass       = $summaryPass
    Error      = $summaryResponse.Error
}

# Test 2: GET /api/devices/status
Write-Host "`nTest: GET /api/devices/status" -ForegroundColor Yellow
$dateToday = Get-Date -Format 'yyyy-MM-dd'
$devicesUrl = "{0}/api/devices/status?organizationId={1}&date={2}" -f $config.BackendUrl, $organizationId, $dateToday
$devicesResponse = Invoke-ApiRequest -Url $devicesUrl -Method "GET" -Headers $headers -TimeoutSeconds 10

$devicesPass = $devicesResponse.Success -and ($devicesResponse.StatusCode -eq 200 -or $devicesResponse.StatusCode -eq 304) -and ($devicesResponse.DurationMs -lt 1000)

Write-Host "  Status: $($devicesResponse.StatusCode) | Tiempo: $($devicesResponse.DurationMs)ms" -ForegroundColor $(if ($devicesPass) { "Green" } else { "Yellow" })

if ($devicesPass) {
    Write-Host "  OK PASS" -ForegroundColor Green
}
else {
    Write-Host "  WARNING" -ForegroundColor Yellow
}

Add-TestResult -Results $results -Category "Endpoint" -TestData @{
    Url        = "/api/devices/status"
    Method     = "GET"
    StatusCode = $devicesResponse.StatusCode
    DurationMs = $devicesResponse.DurationMs
    Pass       = $devicesPass
    Error      = $devicesResponse.Error
}

# Test 3: GET /api/sessions
Write-Host "`nTest: GET /api/sessions" -ForegroundColor Yellow
$sessionsUrl = "{0}/api/sessions?organizationId={1}&page=1&limit=10" -f $config.BackendUrl, $organizationId
$sessionsResponse = Invoke-ApiRequest -Url $sessionsUrl -Method "GET" -Headers $headers -TimeoutSeconds 10

$sessionsPass = $sessionsResponse.Success -and ($sessionsResponse.StatusCode -eq 200)

Write-Host "  Status: $($sessionsResponse.StatusCode) | Tiempo: $($sessionsResponse.DurationMs)ms" -ForegroundColor $(if ($sessionsPass) { "Green" } else { "Yellow" })

if ($sessionsPass) {
    Write-Host "  OK PASS" -ForegroundColor Green
}
else {
    Write-Host "  WARNING" -ForegroundColor Yellow
}

Add-TestResult -Results $results -Category "Endpoint" -TestData @{
    Url        = "/api/sessions"
    Method     = "GET"
    StatusCode = $sessionsResponse.StatusCode
    DurationMs = $sessionsResponse.DurationMs
    Pass       = $sessionsPass
    Error      = $sessionsResponse.Error
}

# Test 4: GET /api/events
Write-Host "`nTest: GET /api/events" -ForegroundColor Yellow
$eventsUrl = "{0}/api/events?organizationId={1}&page=1&limit=50" -f $config.BackendUrl, $organizationId
$eventsResponse = Invoke-ApiRequest -Url $eventsUrl -Method "GET" -Headers $headers -TimeoutSeconds 10

$eventsPass = $eventsResponse.Success -and ($eventsResponse.StatusCode -eq 200)

Write-Host "  Status: $($eventsResponse.StatusCode) | Tiempo: $($eventsResponse.DurationMs)ms" -ForegroundColor $(if ($eventsPass) { "Green" } else { "Yellow" })

if ($eventsPass) {
    Write-Host "  OK PASS" -ForegroundColor Green
    
    if ($eventsResponse.Content) {
        try {
            $eventsData = $eventsResponse.Content | ConvertFrom-Json
            if ($eventsData.events -and $eventsData.events.Count -gt 0) {
                Write-Host "  Eventos encontrados: $($eventsData.events.Count)" -ForegroundColor Green
            }
        }
        catch {
            Write-Log "Error parseando respuesta de eventos" -Level "WARNING"
        }
    }
}
else {
    Write-Host "  WARNING" -ForegroundColor Yellow
}

Add-TestResult -Results $results -Category "Endpoint" -TestData @{
    Url        = "/api/events"
    Method     = "GET"
    StatusCode = $eventsResponse.StatusCode
    DurationMs = $eventsResponse.DurationMs
    Pass       = $eventsPass
    Error      = $eventsResponse.Error
}

# =============================================================================
# FASE 4: MÉTRICAS DE RENDIMIENTO
# =============================================================================

Write-Host "`nFASE 4: Metricas de Rendimiento" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$endpointTimes = $results.Endpoints | ForEach-Object { $_.DurationMs }
$avgTime = if ($endpointTimes.Count -gt 0) { ($endpointTimes | Measure-Object -Average).Average } else { 0 }

$summaryTimes = $results.Endpoints | Where-Object { $_.Url -like "*summary*" } | ForEach-Object { $_.DurationMs }
$avgSummaryTime = if ($summaryTimes.Count -gt 0) { ($summaryTimes | Measure-Object -Average).Average } else { 0 }

$results.Performance = @{
    avg_summary_time_ms      = [math]::Round($avgSummaryTime, 2)
    avg_other_endpoints_ms   = [math]::Round($avgTime, 2)
    frontend_initial_load_ms = "N/A"
}

Write-Host "`nResumen de Rendimiento:" -ForegroundColor Yellow
Write-Host "  Tiempo promedio /summary: $($results.Performance.avg_summary_time_ms)ms (threshold: menos de 3000ms)" -ForegroundColor Cyan
Write-Host "  Tiempo promedio otros endpoints: $($results.Performance.avg_other_endpoints_ms)ms (threshold: menos de 1000ms)" -ForegroundColor Cyan

# =============================================================================
# FASE 5: VALIDACIÓN DE UI
# =============================================================================

Write-Host "`nFASE 5: Validacion de UI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n  La validacion de UI requiere revision manual" -ForegroundColor Cyan
Write-Host "  Consulta el checklist en: scripts/testing/dashboard-ui-checklist.md" -ForegroundColor Cyan
Write-Host "`n  Para automatizacion completa, ejecutar:" -ForegroundColor Yellow
Write-Host "  node scripts/testing/audit-ui-playwright.js" -ForegroundColor Gray

$results.UIChecks = @{
    no_scroll_main_container = "MANUAL_CHECK_REQUIRED"
    tabs_load_successfully   = "MANUAL_CHECK_REQUIRED"
    filters_responsive       = "MANUAL_CHECK_REQUIRED"
    pdf_exports_work         = "MANUAL_CHECK_REQUIRED"
    note                     = "Ejecutar checklist manual o script Playwright para validacion completa"
}

# =============================================================================
# FASE 6: GENERACIÓN DE REPORTES
# =============================================================================

Write-Host "`nFASE 6: Generacion de Reportes" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$jsonPath = Join-Path $outputDir "audit-data.json"
$mdPath = Join-Path $outputDir "audit-report.md"

Export-TestResultsToJson -Results $results -OutputPath $jsonPath
Export-TestResultsToMarkdown -Results $results -OutputPath $mdPath

Write-Host "`nReportes generados:" -ForegroundColor Green
Write-Host "  JSON:     $jsonPath" -ForegroundColor Cyan
Write-Host "  Markdown: $mdPath" -ForegroundColor Cyan
Write-Host "  Log:      $logFile" -ForegroundColor Cyan

# =============================================================================
# RESUMEN FINAL
# =============================================================================

Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "  RESUMEN DE AUDITORIA"  -ForegroundColor Cyan
Write-Host "========================================`n"  -ForegroundColor Cyan

Write-Host "Resultados:" -ForegroundColor Yellow
Write-Host "  Total de pruebas: $($results.Summary.TotalTests)" -ForegroundColor White
Write-Host "  Exitosas:         $($results.Summary.Passed)" -ForegroundColor Green
Write-Host "  Fallidas:         $($results.Summary.Failed)" -ForegroundColor Red
Write-Host "  Advertencias:     $($results.Summary.Warnings)" -ForegroundColor Yellow

$successRate = if ($results.Summary.TotalTests -gt 0) { 
    [math]::Round(($results.Summary.Passed / $results.Summary.TotalTests) * 100, 2) 
}
else { 
    0 
}

Write-Host "`nTasa de exito: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })

if ($results.Summary.Failed -eq 0) {
    Write-Host "`nAUDITORIA COMPLETADA EXITOSAMENTE`n" -ForegroundColor Green
}
elseif ($results.Summary.Failed -le 2) {
    Write-Host "`nAUDITORIA COMPLETADA CON ADVERTENCIAS`n" -ForegroundColor Yellow
}
else {
    Write-Host "`nAUDITORIA COMPLETADA CON ERRORES CRITICOS`n" -ForegroundColor Red
}

Write-Log "=== AUDITORIA FINALIZADA ===" -Level "INFO"

exit $(if ($results.Summary.Failed -eq 0) { 0 } else { 1 })

.SYNOPSIS
Auditoría automatizada del Dashboard StabilSafe V3 - Versión Corregida
    
.PARAMETER LogLevel
Nivel de log: DEBUG, INFO, WARNING, ERROR (por defecto: INFO)
    
.EXAMPLE
.\audit-dashboard-v2.ps1
#>

param(
    [string]$LogLevel = "INFO"
)

$ErrorActionPreference = "Stop"

# Importar funciones auxiliares
$helpersPath = Join-Path $PSScriptRoot "test-helpers.ps1"
if (-not (Test-Path $helpersPath)) {
    Write-Error "No se encontró test-helpers.ps1"
    exit 1
}

. $helpersPath

Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "  AUDITORIA DASHBOARD STABILSAFE V3"  -ForegroundColor Cyan
Write-Host "========================================`n"  -ForegroundColor Cyan

# Configuración
$config = @{
    BackendUrl    = "http://localhost:9998"
    FrontendUrl   = "http://localhost:5174"
    AuthEndpoint  = "/api/auth/login"
    AdminEmail    = "test@bomberosmadrid.es"
    AdminPassword = "admin123"
    DateFrom      = "2025-09-29"
    DateTo        = "2025-10-08"
}

# Crear directorio de salida
$outputDir = New-OutputDirectory -BasePath "scripts/testing/results"
$logFile = Join-Path $outputDir "audit-debug.log"

# Inicializar logging
Initialize-Logging -LogFilePath $logFile -Level $LogLevel

Write-Log "=== AUDITORIA INICIADA ===" -Level "INFO"

# Inicializar resultados
$results = Initialize-TestResults

# =============================================================================
# FASE 1: VERIFICACIÓN DE SERVICIOS
# =============================================================================

Write-Host "`nFASE 1: Verificacion de Servicios" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Test Backend
Write-Host "`nVerificando Backend..." -ForegroundColor Yellow
$backendHealth = Test-ServiceAvailability -Url "$($config.BackendUrl)/health" -ServiceName "Backend"

$results.Services["Backend"] = @{
    Status    = if ($backendHealth.Available) { "running" } else { "down" }
    Port      = 9998
    Available = $backendHealth.Available
    Error     = $backendHealth.Error
}

if ($backendHealth.Available) {
    Write-Host "  OK Backend disponible" -ForegroundColor Green
}
else {
    Write-Host "  ERROR Backend NO disponible" -ForegroundColor Red
    Export-TestResultsToJson -Results $results -OutputPath (Join-Path $outputDir "audit-data.json")
    Export-TestResultsToMarkdown -Results $results -OutputPath (Join-Path $outputDir "audit-report.md")
    Write-Host "`nAUDITORIA ABORTADA: Backend no disponible`n" -ForegroundColor Red
    exit 1
}

# Test Frontend
Write-Host "`nVerificando Frontend..." -ForegroundColor Yellow
$frontendHealth = Test-ServiceAvailability -Url $config.FrontendUrl -ServiceName "Frontend"

$results.Services["Frontend"] = @{
    Status    = if ($frontendHealth.Available) { "running" } else { "down" }
    Port      = 5174
    Available = $frontendHealth.Available
    Error     = $frontendHealth.Error
}

if ($frontendHealth.Available) {
    Write-Host "  OK Frontend disponible" -ForegroundColor Green
}
else {
    Write-Host "  WARNING Frontend NO disponible" -ForegroundColor Yellow
}

# =============================================================================
# FASE 2: AUTENTICACIÓN
# =============================================================================

Write-Host "`nFASE 2: Autenticacion" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nProbando login como ADMIN..." -ForegroundColor Yellow
$adminAuth = Get-AuthToken -BaseUrl $config.BackendUrl -AuthEndpoint $config.AuthEndpoint -Email $config.AdminEmail -Password $config.AdminPassword

if ($adminAuth.Success) {
    Write-Host "  OK Login ADMIN exitoso" -ForegroundColor Green
    $results.Summary.Passed++
}
else {
    Write-Host "  ERROR Login ADMIN fallido" -ForegroundColor Red
    $results.Summary.Failed++
}

$results.Summary.TotalTests++

$authToken = $adminAuth.Token
$organizationId = $adminAuth.OrganizationId

if (-not $authToken) {
    Write-Host "`nERROR: No se pudo obtener token de autenticacion`n" -ForegroundColor Red
    Export-TestResultsToJson -Results $results -OutputPath (Join-Path $outputDir "audit-data.json")
    Export-TestResultsToMarkdown -Results $results -OutputPath (Join-Path $outputDir "audit-report.md")
    exit 1
}

Write-Log "Organization ID: $organizationId" -Level "INFO"

# =============================================================================
# FASE 3: PRUEBAS DE ENDPOINTS
# =============================================================================

Write-Host "`nFASE 3: Pruebas de Endpoints Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $authToken"
    "Content-Type"  = "application/json"
}

# Test 1: GET /api/summary
Write-Host "`nTest: GET /api/summary" -ForegroundColor Yellow
$summaryUrl = "{0}/api/summary?from={1}&to={2}&force=true" -f $config.BackendUrl, $config.DateFrom, $config.DateTo
$summaryResponse = Invoke-ApiRequest -Url $summaryUrl -Method "GET" -Headers $headers -TimeoutSeconds 30

$summaryPass = $summaryResponse.Success -and ($summaryResponse.StatusCode -eq 200 -or $summaryResponse.StatusCode -eq 304) -and ($summaryResponse.DurationMs -lt 3000)

Write-Host "  Status: $($summaryResponse.StatusCode) | Tiempo: $($summaryResponse.DurationMs)ms" -ForegroundColor $(if ($summaryPass) { "Green" } else { "Red" })

if ($summaryPass) {
    Write-Host "  OK PASS" -ForegroundColor Green
}
else {
    Write-Host "  FAIL" -ForegroundColor Red
}

Add-TestResult -Results $results -Category "Endpoint" -TestData @{
    Url        = "/api/summary"
    Method     = "GET"
    StatusCode = $summaryResponse.StatusCode
    DurationMs = $summaryResponse.DurationMs
    Pass       = $summaryPass
    Error      = $summaryResponse.Error
}

# Test 2: GET /api/devices/status
Write-Host "`nTest: GET /api/devices/status" -ForegroundColor Yellow
$dateToday = Get-Date -Format 'yyyy-MM-dd'
$devicesUrl = "{0}/api/devices/status?organizationId={1}&date={2}" -f $config.BackendUrl, $organizationId, $dateToday
$devicesResponse = Invoke-ApiRequest -Url $devicesUrl -Method "GET" -Headers $headers -TimeoutSeconds 10

$devicesPass = $devicesResponse.Success -and ($devicesResponse.StatusCode -eq 200 -or $devicesResponse.StatusCode -eq 304) -and ($devicesResponse.DurationMs -lt 1000)

Write-Host "  Status: $($devicesResponse.StatusCode) | Tiempo: $($devicesResponse.DurationMs)ms" -ForegroundColor $(if ($devicesPass) { "Green" } else { "Yellow" })

if ($devicesPass) {
    Write-Host "  OK PASS" -ForegroundColor Green
}
else {
    Write-Host "  WARNING" -ForegroundColor Yellow
}

Add-TestResult -Results $results -Category "Endpoint" -TestData @{
    Url        = "/api/devices/status"
    Method     = "GET"
    StatusCode = $devicesResponse.StatusCode
    DurationMs = $devicesResponse.DurationMs
    Pass       = $devicesPass
    Error      = $devicesResponse.Error
}

# Test 3: GET /api/sessions
Write-Host "`nTest: GET /api/sessions" -ForegroundColor Yellow
$sessionsUrl = "{0}/api/sessions?organizationId={1}&page=1&limit=10" -f $config.BackendUrl, $organizationId
$sessionsResponse = Invoke-ApiRequest -Url $sessionsUrl -Method "GET" -Headers $headers -TimeoutSeconds 10

$sessionsPass = $sessionsResponse.Success -and ($sessionsResponse.StatusCode -eq 200)

Write-Host "  Status: $($sessionsResponse.StatusCode) | Tiempo: $($sessionsResponse.DurationMs)ms" -ForegroundColor $(if ($sessionsPass) { "Green" } else { "Yellow" })

if ($sessionsPass) {
    Write-Host "  OK PASS" -ForegroundColor Green
}
else {
    Write-Host "  WARNING" -ForegroundColor Yellow
}

Add-TestResult -Results $results -Category "Endpoint" -TestData @{
    Url        = "/api/sessions"
    Method     = "GET"
    StatusCode = $sessionsResponse.StatusCode
    DurationMs = $sessionsResponse.DurationMs
    Pass       = $sessionsPass
    Error      = $sessionsResponse.Error
}

# Test 4: GET /api/events
Write-Host "`nTest: GET /api/events" -ForegroundColor Yellow
$eventsUrl = "{0}/api/events?organizationId={1}&page=1&limit=50" -f $config.BackendUrl, $organizationId
$eventsResponse = Invoke-ApiRequest -Url $eventsUrl -Method "GET" -Headers $headers -TimeoutSeconds 10

$eventsPass = $eventsResponse.Success -and ($eventsResponse.StatusCode -eq 200)

Write-Host "  Status: $($eventsResponse.StatusCode) | Tiempo: $($eventsResponse.DurationMs)ms" -ForegroundColor $(if ($eventsPass) { "Green" } else { "Yellow" })

if ($eventsPass) {
    Write-Host "  OK PASS" -ForegroundColor Green
    
    if ($eventsResponse.Content) {
        try {
            $eventsData = $eventsResponse.Content | ConvertFrom-Json
            if ($eventsData.events -and $eventsData.events.Count -gt 0) {
                Write-Host "  Eventos encontrados: $($eventsData.events.Count)" -ForegroundColor Green
            }
        }
        catch {
            Write-Log "Error parseando respuesta de eventos" -Level "WARNING"
        }
    }
}
else {
    Write-Host "  WARNING" -ForegroundColor Yellow
}

Add-TestResult -Results $results -Category "Endpoint" -TestData @{
    Url        = "/api/events"
    Method     = "GET"
    StatusCode = $eventsResponse.StatusCode
    DurationMs = $eventsResponse.DurationMs
    Pass       = $eventsPass
    Error      = $eventsResponse.Error
}

# =============================================================================
# FASE 4: MÉTRICAS DE RENDIMIENTO
# =============================================================================

Write-Host "`nFASE 4: Metricas de Rendimiento" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$endpointTimes = $results.Endpoints | ForEach-Object { $_.DurationMs }
$avgTime = if ($endpointTimes.Count -gt 0) { ($endpointTimes | Measure-Object -Average).Average } else { 0 }

$summaryTimes = $results.Endpoints | Where-Object { $_.Url -like "*summary*" } | ForEach-Object { $_.DurationMs }
$avgSummaryTime = if ($summaryTimes.Count -gt 0) { ($summaryTimes | Measure-Object -Average).Average } else { 0 }

$results.Performance = @{
    avg_summary_time_ms      = [math]::Round($avgSummaryTime, 2)
    avg_other_endpoints_ms   = [math]::Round($avgTime, 2)
    frontend_initial_load_ms = "N/A"
}

Write-Host "`nResumen de Rendimiento:" -ForegroundColor Yellow
Write-Host "  Tiempo promedio /summary: $($results.Performance.avg_summary_time_ms)ms (threshold: menos de 3000ms)" -ForegroundColor Cyan
Write-Host "  Tiempo promedio otros endpoints: $($results.Performance.avg_other_endpoints_ms)ms (threshold: menos de 1000ms)" -ForegroundColor Cyan

# =============================================================================
# FASE 5: VALIDACIÓN DE UI
# =============================================================================

Write-Host "`nFASE 5: Validacion de UI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n  La validacion de UI requiere revision manual" -ForegroundColor Cyan
Write-Host "  Consulta el checklist en: scripts/testing/dashboard-ui-checklist.md" -ForegroundColor Cyan
Write-Host "`n  Para automatizacion completa, ejecutar:" -ForegroundColor Yellow
Write-Host "  node scripts/testing/audit-ui-playwright.js" -ForegroundColor Gray

$results.UIChecks = @{
    no_scroll_main_container = "MANUAL_CHECK_REQUIRED"
    tabs_load_successfully   = "MANUAL_CHECK_REQUIRED"
    filters_responsive       = "MANUAL_CHECK_REQUIRED"
    pdf_exports_work         = "MANUAL_CHECK_REQUIRED"
    note                     = "Ejecutar checklist manual o script Playwright para validacion completa"
}

# =============================================================================
# FASE 6: GENERACIÓN DE REPORTES
# =============================================================================

Write-Host "`nFASE 6: Generacion de Reportes" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$jsonPath = Join-Path $outputDir "audit-data.json"
$mdPath = Join-Path $outputDir "audit-report.md"

Export-TestResultsToJson -Results $results -OutputPath $jsonPath
Export-TestResultsToMarkdown -Results $results -OutputPath $mdPath

Write-Host "`nReportes generados:" -ForegroundColor Green
Write-Host "  JSON:     $jsonPath" -ForegroundColor Cyan
Write-Host "  Markdown: $mdPath" -ForegroundColor Cyan
Write-Host "  Log:      $logFile" -ForegroundColor Cyan

# =============================================================================
# RESUMEN FINAL
# =============================================================================

Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "  RESUMEN DE AUDITORIA"  -ForegroundColor Cyan
Write-Host "========================================`n"  -ForegroundColor Cyan

Write-Host "Resultados:" -ForegroundColor Yellow
Write-Host "  Total de pruebas: $($results.Summary.TotalTests)" -ForegroundColor White
Write-Host "  Exitosas:         $($results.Summary.Passed)" -ForegroundColor Green
Write-Host "  Fallidas:         $($results.Summary.Failed)" -ForegroundColor Red
Write-Host "  Advertencias:     $($results.Summary.Warnings)" -ForegroundColor Yellow

$successRate = if ($results.Summary.TotalTests -gt 0) { 
    [math]::Round(($results.Summary.Passed / $results.Summary.TotalTests) * 100, 2) 
}
else { 
    0 
}

Write-Host "`nTasa de exito: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })

if ($results.Summary.Failed -eq 0) {
    Write-Host "`nAUDITORIA COMPLETADA EXITOSAMENTE`n" -ForegroundColor Green
}
elseif ($results.Summary.Failed -le 2) {
    Write-Host "`nAUDITORIA COMPLETADA CON ADVERTENCIAS`n" -ForegroundColor Yellow
}
else {
    Write-Host "`nAUDITORIA COMPLETADA CON ERRORES CRITICOS`n" -ForegroundColor Red
}

Write-Log "=== AUDITORIA FINALIZADA ===" -Level "INFO"

exit $(if ($results.Summary.Failed -eq 0) { 0 } else { 1 })

.SYNOPSIS
Auditoría automatizada del Dashboard StabilSafe V3 - Versión Corregida
    
.PARAMETER LogLevel
Nivel de log: DEBUG, INFO, WARNING, ERROR (por defecto: INFO)
    
.EXAMPLE
.\audit-dashboard-v2.ps1
#>

param(
    [string]$LogLevel = "INFO"
)

$ErrorActionPreference = "Stop"

# Importar funciones auxiliares
$helpersPath = Join-Path $PSScriptRoot "test-helpers.ps1"
if (-not (Test-Path $helpersPath)) {
    Write-Error "No se encontró test-helpers.ps1"
    exit 1
}

. $helpersPath

Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "  AUDITORIA DASHBOARD STABILSAFE V3"  -ForegroundColor Cyan
Write-Host "========================================`n"  -ForegroundColor Cyan

# Configuración
$config = @{
    BackendUrl    = "http://localhost:9998"
    FrontendUrl   = "http://localhost:5174"
    AuthEndpoint  = "/api/auth/login"
    AdminEmail    = "test@bomberosmadrid.es"
    AdminPassword = "admin123"
    DateFrom      = "2025-09-29"
    DateTo        = "2025-10-08"
}

# Crear directorio de salida
$outputDir = New-OutputDirectory -BasePath "scripts/testing/results"
$logFile = Join-Path $outputDir "audit-debug.log"

# Inicializar logging
Initialize-Logging -LogFilePath $logFile -Level $LogLevel

Write-Log "=== AUDITORIA INICIADA ===" -Level "INFO"

# Inicializar resultados
$results = Initialize-TestResults

# =============================================================================
# FASE 1: VERIFICACIÓN DE SERVICIOS
# =============================================================================

Write-Host "`nFASE 1: Verificacion de Servicios" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Test Backend
Write-Host "`nVerificando Backend..." -ForegroundColor Yellow
$backendHealth = Test-ServiceAvailability -Url "$($config.BackendUrl)/health" -ServiceName "Backend"

$results.Services["Backend"] = @{
    Status    = if ($backendHealth.Available) { "running" } else { "down" }
    Port      = 9998
    Available = $backendHealth.Available
    Error     = $backendHealth.Error
}

if ($backendHealth.Available) {
    Write-Host "  OK Backend disponible" -ForegroundColor Green
}
else {
    Write-Host "  ERROR Backend NO disponible" -ForegroundColor Red
    Export-TestResultsToJson -Results $results -OutputPath (Join-Path $outputDir "audit-data.json")
    Export-TestResultsToMarkdown -Results $results -OutputPath (Join-Path $outputDir "audit-report.md")
    Write-Host "`nAUDITORIA ABORTADA: Backend no disponible`n" -ForegroundColor Red
    exit 1
}

# Test Frontend
Write-Host "`nVerificando Frontend..." -ForegroundColor Yellow
$frontendHealth = Test-ServiceAvailability -Url $config.FrontendUrl -ServiceName "Frontend"

$results.Services["Frontend"] = @{
    Status    = if ($frontendHealth.Available) { "running" } else { "down" }
    Port      = 5174
    Available = $frontendHealth.Available
    Error     = $frontendHealth.Error
}

if ($frontendHealth.Available) {
    Write-Host "  OK Frontend disponible" -ForegroundColor Green
}
else {
    Write-Host "  WARNING Frontend NO disponible" -ForegroundColor Yellow
}

# =============================================================================
# FASE 2: AUTENTICACIÓN
# =============================================================================

Write-Host "`nFASE 2: Autenticacion" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nProbando login como ADMIN..." -ForegroundColor Yellow
$adminAuth = Get-AuthToken -BaseUrl $config.BackendUrl -AuthEndpoint $config.AuthEndpoint -Email $config.AdminEmail -Password $config.AdminPassword

if ($adminAuth.Success) {
    Write-Host "  OK Login ADMIN exitoso" -ForegroundColor Green
    $results.Summary.Passed++
}
else {
    Write-Host "  ERROR Login ADMIN fallido" -ForegroundColor Red
    $results.Summary.Failed++
}

$results.Summary.TotalTests++

$authToken = $adminAuth.Token
$organizationId = $adminAuth.OrganizationId

if (-not $authToken) {
    Write-Host "`nERROR: No se pudo obtener token de autenticacion`n" -ForegroundColor Red
    Export-TestResultsToJson -Results $results -OutputPath (Join-Path $outputDir "audit-data.json")
    Export-TestResultsToMarkdown -Results $results -OutputPath (Join-Path $outputDir "audit-report.md")
    exit 1
}

Write-Log "Organization ID: $organizationId" -Level "INFO"

# =============================================================================
# FASE 3: PRUEBAS DE ENDPOINTS
# =============================================================================

Write-Host "`nFASE 3: Pruebas de Endpoints Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $authToken"
    "Content-Type"  = "application/json"
}

# Test 1: GET /api/summary
Write-Host "`nTest: GET /api/summary" -ForegroundColor Yellow
$summaryUrl = "{0}/api/summary?from={1}&to={2}&force=true" -f $config.BackendUrl, $config.DateFrom, $config.DateTo
$summaryResponse = Invoke-ApiRequest -Url $summaryUrl -Method "GET" -Headers $headers -TimeoutSeconds 30

$summaryPass = $summaryResponse.Success -and ($summaryResponse.StatusCode -eq 200 -or $summaryResponse.StatusCode -eq 304) -and ($summaryResponse.DurationMs -lt 3000)

Write-Host "  Status: $($summaryResponse.StatusCode) | Tiempo: $($summaryResponse.DurationMs)ms" -ForegroundColor $(if ($summaryPass) { "Green" } else { "Red" })

if ($summaryPass) {
    Write-Host "  OK PASS" -ForegroundColor Green
}
else {
    Write-Host "  FAIL" -ForegroundColor Red
}

Add-TestResult -Results $results -Category "Endpoint" -TestData @{
    Url        = "/api/summary"
    Method     = "GET"
    StatusCode = $summaryResponse.StatusCode
    DurationMs = $summaryResponse.DurationMs
    Pass       = $summaryPass
    Error      = $summaryResponse.Error
}

# Test 2: GET /api/devices/status
Write-Host "`nTest: GET /api/devices/status" -ForegroundColor Yellow
$dateToday = Get-Date -Format 'yyyy-MM-dd'
$devicesUrl = "{0}/api/devices/status?organizationId={1}&date={2}" -f $config.BackendUrl, $organizationId, $dateToday
$devicesResponse = Invoke-ApiRequest -Url $devicesUrl -Method "GET" -Headers $headers -TimeoutSeconds 10

$devicesPass = $devicesResponse.Success -and ($devicesResponse.StatusCode -eq 200 -or $devicesResponse.StatusCode -eq 304) -and ($devicesResponse.DurationMs -lt 1000)

Write-Host "  Status: $($devicesResponse.StatusCode) | Tiempo: $($devicesResponse.DurationMs)ms" -ForegroundColor $(if ($devicesPass) { "Green" } else { "Yellow" })

if ($devicesPass) {
    Write-Host "  OK PASS" -ForegroundColor Green
}
else {
    Write-Host "  WARNING" -ForegroundColor Yellow
}

Add-TestResult -Results $results -Category "Endpoint" -TestData @{
    Url        = "/api/devices/status"
    Method     = "GET"
    StatusCode = $devicesResponse.StatusCode
    DurationMs = $devicesResponse.DurationMs
    Pass       = $devicesPass
    Error      = $devicesResponse.Error
}

# Test 3: GET /api/sessions
Write-Host "`nTest: GET /api/sessions" -ForegroundColor Yellow
$sessionsUrl = "{0}/api/sessions?organizationId={1}&page=1&limit=10" -f $config.BackendUrl, $organizationId
$sessionsResponse = Invoke-ApiRequest -Url $sessionsUrl -Method "GET" -Headers $headers -TimeoutSeconds 10

$sessionsPass = $sessionsResponse.Success -and ($sessionsResponse.StatusCode -eq 200)

Write-Host "  Status: $($sessionsResponse.StatusCode) | Tiempo: $($sessionsResponse.DurationMs)ms" -ForegroundColor $(if ($sessionsPass) { "Green" } else { "Yellow" })

if ($sessionsPass) {
    Write-Host "  OK PASS" -ForegroundColor Green
}
else {
    Write-Host "  WARNING" -ForegroundColor Yellow
}

Add-TestResult -Results $results -Category "Endpoint" -TestData @{
    Url        = "/api/sessions"
    Method     = "GET"
    StatusCode = $sessionsResponse.StatusCode
    DurationMs = $sessionsResponse.DurationMs
    Pass       = $sessionsPass
    Error      = $sessionsResponse.Error
}

# Test 4: GET /api/events
Write-Host "`nTest: GET /api/events" -ForegroundColor Yellow
$eventsUrl = "{0}/api/events?organizationId={1}&page=1&limit=50" -f $config.BackendUrl, $organizationId
$eventsResponse = Invoke-ApiRequest -Url $eventsUrl -Method "GET" -Headers $headers -TimeoutSeconds 10

$eventsPass = $eventsResponse.Success -and ($eventsResponse.StatusCode -eq 200)

Write-Host "  Status: $($eventsResponse.StatusCode) | Tiempo: $($eventsResponse.DurationMs)ms" -ForegroundColor $(if ($eventsPass) { "Green" } else { "Yellow" })

if ($eventsPass) {
    Write-Host "  OK PASS" -ForegroundColor Green
    
    if ($eventsResponse.Content) {
        try {
            $eventsData = $eventsResponse.Content | ConvertFrom-Json
            if ($eventsData.events -and $eventsData.events.Count -gt 0) {
                Write-Host "  Eventos encontrados: $($eventsData.events.Count)" -ForegroundColor Green
            }
        }
        catch {
            Write-Log "Error parseando respuesta de eventos" -Level "WARNING"
        }
    }
}
else {
    Write-Host "  WARNING" -ForegroundColor Yellow
}

Add-TestResult -Results $results -Category "Endpoint" -TestData @{
    Url        = "/api/events"
    Method     = "GET"
    StatusCode = $eventsResponse.StatusCode
    DurationMs = $eventsResponse.DurationMs
    Pass       = $eventsPass
    Error      = $eventsResponse.Error
}

# =============================================================================
# FASE 4: MÉTRICAS DE RENDIMIENTO
# =============================================================================

Write-Host "`nFASE 4: Metricas de Rendimiento" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$endpointTimes = $results.Endpoints | ForEach-Object { $_.DurationMs }
$avgTime = if ($endpointTimes.Count -gt 0) { ($endpointTimes | Measure-Object -Average).Average } else { 0 }

$summaryTimes = $results.Endpoints | Where-Object { $_.Url -like "*summary*" } | ForEach-Object { $_.DurationMs }
$avgSummaryTime = if ($summaryTimes.Count -gt 0) { ($summaryTimes | Measure-Object -Average).Average } else { 0 }

$results.Performance = @{
    avg_summary_time_ms      = [math]::Round($avgSummaryTime, 2)
    avg_other_endpoints_ms   = [math]::Round($avgTime, 2)
    frontend_initial_load_ms = "N/A"
}

Write-Host "`nResumen de Rendimiento:" -ForegroundColor Yellow
Write-Host "  Tiempo promedio /summary: $($results.Performance.avg_summary_time_ms)ms (threshold: menos de 3000ms)" -ForegroundColor Cyan
Write-Host "  Tiempo promedio otros endpoints: $($results.Performance.avg_other_endpoints_ms)ms (threshold: menos de 1000ms)" -ForegroundColor Cyan

# =============================================================================
# FASE 5: VALIDACIÓN DE UI
# =============================================================================

Write-Host "`nFASE 5: Validacion de UI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n  La validacion de UI requiere revision manual" -ForegroundColor Cyan
Write-Host "  Consulta el checklist en: scripts/testing/dashboard-ui-checklist.md" -ForegroundColor Cyan
Write-Host "`n  Para automatizacion completa, ejecutar:" -ForegroundColor Yellow
Write-Host "  node scripts/testing/audit-ui-playwright.js" -ForegroundColor Gray

$results.UIChecks = @{
    no_scroll_main_container = "MANUAL_CHECK_REQUIRED"
    tabs_load_successfully   = "MANUAL_CHECK_REQUIRED"
    filters_responsive       = "MANUAL_CHECK_REQUIRED"
    pdf_exports_work         = "MANUAL_CHECK_REQUIRED"
    note                     = "Ejecutar checklist manual o script Playwright para validacion completa"
}

# =============================================================================
# FASE 6: GENERACIÓN DE REPORTES
# =============================================================================

Write-Host "`nFASE 6: Generacion de Reportes" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$jsonPath = Join-Path $outputDir "audit-data.json"
$mdPath = Join-Path $outputDir "audit-report.md"

Export-TestResultsToJson -Results $results -OutputPath $jsonPath
Export-TestResultsToMarkdown -Results $results -OutputPath $mdPath

Write-Host "`nReportes generados:" -ForegroundColor Green
Write-Host "  JSON:     $jsonPath" -ForegroundColor Cyan
Write-Host "  Markdown: $mdPath" -ForegroundColor Cyan
Write-Host "  Log:      $logFile" -ForegroundColor Cyan

# =============================================================================
# RESUMEN FINAL
# =============================================================================

Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "  RESUMEN DE AUDITORIA"  -ForegroundColor Cyan
Write-Host "========================================`n"  -ForegroundColor Cyan

Write-Host "Resultados:" -ForegroundColor Yellow
Write-Host "  Total de pruebas: $($results.Summary.TotalTests)" -ForegroundColor White
Write-Host "  Exitosas:         $($results.Summary.Passed)" -ForegroundColor Green
Write-Host "  Fallidas:         $($results.Summary.Failed)" -ForegroundColor Red
Write-Host "  Advertencias:     $($results.Summary.Warnings)" -ForegroundColor Yellow

$successRate = if ($results.Summary.TotalTests -gt 0) { 
    [math]::Round(($results.Summary.Passed / $results.Summary.TotalTests) * 100, 2) 
}
else { 
    0 
}

Write-Host "`nTasa de exito: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })

if ($results.Summary.Failed -eq 0) {
    Write-Host "`nAUDITORIA COMPLETADA EXITOSAMENTE`n" -ForegroundColor Green
}
elseif ($results.Summary.Failed -le 2) {
    Write-Host "`nAUDITORIA COMPLETADA CON ADVERTENCIAS`n" -ForegroundColor Yellow
}
else {
    Write-Host "`nAUDITORIA COMPLETADA CON ERRORES CRITICOS`n" -ForegroundColor Red
}

Write-Log "=== AUDITORIA FINALIZADA ===" -Level "INFO"

exit $(if ($results.Summary.Failed -eq 0) { 0 } else { 1 })

