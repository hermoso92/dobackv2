# =============================================================================
# test-helpers.ps1
# Funciones auxiliares para auditoría del Dashboard StabilSafe V3
# =============================================================================

# Configuración global
$script:LogLevel = "INFO" # DEBUG, INFO, WARNING, ERROR
$script:LogFile = $null

# =============================================================================
# LOGGING
# =============================================================================

function Initialize-Logging {
    param(
        [string]$LogFilePath,
        [string]$Level = "INFO"
    )
    
    $script:LogFile = $LogFilePath
    $script:LogLevel = $Level
    
    # Crear directorio si no existe
    $logDir = Split-Path -Parent $LogFilePath
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    
    # Inicializar log
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $LogFilePath -Value "=== AUDIT LOG STARTED: $timestamp ==="
}

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO",
        [switch]$NoConsole
    )
    
    $levels = @{
        "DEBUG"   = 0
        "INFO"    = 1
        "WARNING" = 2
        "ERROR"   = 3
    }
    
    $currentLevel = $levels[$script:LogLevel]
    $messageLevel = $levels[$Level]
    
    if ($messageLevel -ge $currentLevel) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
        $logEntry = "[$timestamp] [$Level] $Message"
        
        # Escribir a archivo
        if ($script:LogFile) {
            Add-Content -Path $script:LogFile -Value $logEntry
        }
        
        # Escribir a consola
        if (-not $NoConsole) {
            switch ($Level) {
                "DEBUG" { Write-Host $logEntry -ForegroundColor Gray }
                "INFO" { Write-Host $logEntry -ForegroundColor Cyan }
                "WARNING" { Write-Host $logEntry -ForegroundColor Yellow }
                "ERROR" { Write-Host $logEntry -ForegroundColor Red }
            }
        }
    }
}

# =============================================================================
# HTTP REQUESTS
# =============================================================================

function Invoke-ApiRequest {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$TimeoutSeconds = 10
    )
    
    Write-Log "HTTP $Method $Url" -Level "DEBUG"
    
    $startTime = Get-Date
    
    try {
        $params = @{
            Uri             = $Url
            Method          = $Method
            Headers         = $Headers
            TimeoutSec      = $TimeoutSeconds
            UseBasicParsing = $true
        }
        
        if ($Body) {
            if ($Body -is [hashtable] -or $Body -is [PSCustomObject]) {
                $params.Body = ($Body | ConvertTo-Json -Depth 10)
                $params.ContentType = "application/json"
            }
            else {
                $params.Body = $Body
            }
        }
        
        $response = Invoke-WebRequest @params
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        Write-Log "Response: $($response.StatusCode) in ${duration}ms" -Level "DEBUG"
        
        return @{
            Success    = $true
            StatusCode = $response.StatusCode
            Content    = $response.Content
            Headers    = $response.Headers
            DurationMs = [math]::Round($duration, 2)
            Error      = $null
        }
    }
    catch {
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        Write-Log "Request failed: $($_.Exception.Message)" -Level "ERROR"
        
        return @{
            Success    = $false
            StatusCode = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
            Content    = $null
            Headers    = $null
            DurationMs = [math]::Round($duration, 2)
            Error      = $_.Exception.Message
        }
    }
}

function Test-ServiceAvailability {
    param(
        [string]$Url,
        [string]$ServiceName,
        [int]$TimeoutSeconds = 5
    )
    
    Write-Log "Testing $ServiceName availability at $Url" -Level "INFO"
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec $TimeoutSeconds -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Write-Log "$ServiceName is available (200 OK)" -Level "INFO"
            return @{ Available = $true; StatusCode = 200; Error = $null }
        }
        else {
            Write-Log "$ServiceName returned unexpected status: $($response.StatusCode)" -Level "WARNING"
            return @{ Available = $false; StatusCode = $response.StatusCode; Error = "Unexpected status code" }
        }
    }
    catch {
        Write-Log "$ServiceName is NOT available: $($_.Exception.Message)" -Level "ERROR"
        return @{ Available = $false; StatusCode = 0; Error = $_.Exception.Message }
    }
}

# =============================================================================
# AUTHENTICATION
# =============================================================================

function Get-AuthToken {
    param(
        [string]$BaseUrl,
        [string]$AuthEndpoint,
        [string]$Email,
        [string]$Password
    )
    
    Write-Log "Attempting login for user: $Email" -Level "INFO"
    
    $url = "$BaseUrl$AuthEndpoint"
    $body = @{
        email    = $Email
        password = $Password
    }
    
    $result = Invoke-ApiRequest -Url $url -Method "POST" -Body $body -TimeoutSeconds 10
    
    if ($result.Success) {
        try {
            $data = $result.Content | ConvertFrom-Json
            
            if ($data.access_token -or $data.token) {
                $token = if ($data.access_token) { $data.access_token } else { $data.token }
                Write-Log "Login successful for $Email" -Level "INFO"
                return @{
                    Success        = $true
                    Token          = $token
                    User           = $data.user
                    OrganizationId = $data.user.organizationId
                    Error          = $null
                }
            }
            else {
                Write-Log "Login response missing token" -Level "ERROR"
                return @{ Success = $false; Token = $null; User = $null; OrganizationId = $null; Error = "Missing token in response" }
            }
        }
        catch {
            Write-Log "Failed to parse login response: $($_.Exception.Message)" -Level "ERROR"
            return @{ Success = $false; Token = $null; User = $null; OrganizationId = $null; Error = "Invalid JSON response" }
        }
    }
    else {
        return @{ Success = $false; Token = $null; User = $null; OrganizationId = $null; Error = $result.Error }
    }
}

# =============================================================================
# JSON VALIDATION
# =============================================================================

function Test-JsonStructure {
    param(
        [string]$JsonString,
        [string[]]$RequiredFields
    )
    
    try {
        $obj = $JsonString | ConvertFrom-Json
        
        $missingFields = @()
        foreach ($field in $RequiredFields) {
            $fieldParts = $field -split '\.'
            $current = $obj
            $found = $true
            
            foreach ($part in $fieldParts) {
                if ($current.PSObject.Properties.Name -contains $part) {
                    $current = $current.$part
                }
                else {
                    $found = $false
                    break
                }
            }
            
            if (-not $found) {
                $missingFields += $field
            }
        }
        
        if ($missingFields.Count -eq 0) {
            return @{ Valid = $true; MissingFields = @(); Error = $null }
        }
        else {
            return @{ Valid = $false; MissingFields = $missingFields; Error = "Missing fields: $($missingFields -join ', ')" }
        }
    }
    catch {
        return @{ Valid = $false; MissingFields = @(); Error = "Invalid JSON: $($_.Exception.Message)" }
    }
}

# =============================================================================
# FILE OPERATIONS
# =============================================================================

function Get-TestDataFiles {
    param(
        [string]$DatasetPath,
        [string]$Pattern = "*.csv"
    )
    
    Write-Log "Searching for test files in $DatasetPath with pattern $Pattern" -Level "DEBUG"
    
    if (-not (Test-Path $DatasetPath)) {
        Write-Log "Dataset path does not exist: $DatasetPath" -Level "ERROR"
        return @()
    }
    
    $files = Get-ChildItem -Path $DatasetPath -Filter $Pattern -File -ErrorAction SilentlyContinue
    
    Write-Log "Found $($files.Count) test files" -Level "INFO"
    
    return $files
}

# =============================================================================
# REPORT GENERATION
# =============================================================================

function Initialize-TestResults {
    return @{
        Timestamp   = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        Services    = @{}
        Endpoints   = @()
        UploadTest  = @{}
        EventsTest  = @{}
        UIChecks    = @{}
        Performance = @{}
        Summary     = @{
            TotalTests = 0
            Passed     = 0
            Failed     = 0
            Warnings   = 0
        }
    }
}

function Add-TestResult {
    param(
        [hashtable]$Results,
        [string]$Category,
        [hashtable]$TestData
    )
    
    if ($TestData.Pass -eq $true) {
        $Results.Summary.Passed++
    }
    elseif ($TestData.Pass -eq $false) {
        $Results.Summary.Failed++
    }
    else {
        $Results.Summary.Warnings++
    }
    
    $Results.Summary.TotalTests++
    
    switch ($Category) {
        "Endpoint" { $Results.Endpoints += $TestData }
        "Upload" { $Results.UploadTest = $TestData }
        "Events" { $Results.EventsTest = $TestData }
        "UI" { 
            if (-not $Results.UIChecks) {
                $Results.UIChecks = @{}
            }
            $Results.UIChecks += $TestData
        }
        "Service" {
            if (-not $Results.Services) {
                $Results.Services = @{}
            }
            $Results.Services += $TestData
        }
    }
}

function Export-TestResultsToJson {
    param(
        [hashtable]$Results,
        [string]$OutputPath
    )
    
    Write-Log "Exporting test results to JSON: $OutputPath" -Level "INFO"
    
    $json = $Results | ConvertTo-Json -Depth 10
    Set-Content -Path $OutputPath -Value $json -Encoding UTF8
    
    Write-Log "JSON export complete" -Level "INFO"
}

function Export-TestResultsToMarkdown {
    param(
        [hashtable]$Results,
        [string]$OutputPath
    )
    
    Write-Log "Exporting test results to Markdown: $OutputPath" -Level "INFO"
    
    $md = @"
# Audit Report - Dashboard StabilSafe V3

**Generated:** $($Results.Timestamp)

---

## Summary

- **Total Tests:** $($Results.Summary.TotalTests)
- **Passed:** $($Results.Summary.Passed) ✅
- **Failed:** $($Results.Summary.Failed) ❌
- **Warnings:** $($Results.Summary.Warnings) ⚠️

**Success Rate:** $(if ($Results.Summary.TotalTests -gt 0) { [math]::Round(($Results.Summary.Passed / $Results.Summary.TotalTests) * 100, 2) } else { 0 })%

---

## Services Status

"@

    foreach ($service in $Results.Services.Keys) {
        $status = $Results.Services[$service]
        $icon = if ($status.Available) { "✅" } else { "❌" }
        $md += "`n### $icon $service`n`n"
        $md += "- **Status:** $($status.Status)`n"
        $md += "- **Port:** $($status.Port)`n"
        if ($status.Error) {
            $md += "- **Error:** $($status.Error)`n"
        }
    }

    $md += "`n---`n`n## Endpoint Tests`n`n"
    $md += "| Endpoint | Method | Status | Time (ms) | Result |`n"
    $md += "|----------|--------|--------|-----------|--------|`n"

    foreach ($endpoint in $Results.Endpoints) {
        $icon = if ($endpoint.Pass) { "✅" } else { "❌" }
        $md += "| $($endpoint.Url) | $($endpoint.Method) | $($endpoint.StatusCode) | $($endpoint.DurationMs) | $icon |`n"
    }

    $md += "`n---`n`n## Upload Test`n`n"
    if ($Results.UploadTest.Count -gt 0) {
        $icon = if ($Results.UploadTest.Pass) { "✅" } else { "❌" }
        $md += "- **Result:** $icon`n"
        $md += "- **File:** $($Results.UploadTest.FileUsed)`n"
        $md += "- **Session ID:** $($Results.UploadTest.SessionId)`n"
        $md += "- **Events Generated:** $($Results.UploadTest.EventsGenerated)`n"
    }
    else {
        $md += "_No upload test performed_`n"
    }

    $md += "`n---`n`n## Performance Metrics`n`n"
    foreach ($metric in $Results.Performance.Keys) {
        $value = $Results.Performance[$metric]
        $md += "- **$metric**: $value`n"
    }

    $md += "`n---`n`n## End of Report`n"

    Set-Content -Path $OutputPath -Value $md -Encoding UTF8
    
    Write-Log "Markdown export complete" -Level "INFO"
}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

function Get-Timestamp {
    return Get-Date -Format "yyyyMMdd_HHmmss"
}

function New-OutputDirectory {
    param(
        [string]$BasePath
    )
    
    $timestamp = Get-Timestamp
    $outputDir = Join-Path $BasePath $timestamp
    
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $outputDir "screenshots") -Force | Out-Null
    
    Write-Log "Created output directory: $outputDir" -Level "INFO"
    
    return $outputDir
}

# Note: Functions are available when dot-sourced
# Export-ModuleMember is only for modules (.psm1)


# Funciones auxiliares para auditoría del Dashboard StabilSafe V3
# =============================================================================

# Configuración global
$script:LogLevel = "INFO" # DEBUG, INFO, WARNING, ERROR
$script:LogFile = $null

# =============================================================================
# LOGGING
# =============================================================================

function Initialize-Logging {
    param(
        [string]$LogFilePath,
        [string]$Level = "INFO"
    )
    
    $script:LogFile = $LogFilePath
    $script:LogLevel = $Level
    
    # Crear directorio si no existe
    $logDir = Split-Path -Parent $LogFilePath
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    
    # Inicializar log
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $LogFilePath -Value "=== AUDIT LOG STARTED: $timestamp ==="
}

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO",
        [switch]$NoConsole
    )
    
    $levels = @{
        "DEBUG"   = 0
        "INFO"    = 1
        "WARNING" = 2
        "ERROR"   = 3
    }
    
    $currentLevel = $levels[$script:LogLevel]
    $messageLevel = $levels[$Level]
    
    if ($messageLevel -ge $currentLevel) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
        $logEntry = "[$timestamp] [$Level] $Message"
        
        # Escribir a archivo
        if ($script:LogFile) {
            Add-Content -Path $script:LogFile -Value $logEntry
        }
        
        # Escribir a consola
        if (-not $NoConsole) {
            switch ($Level) {
                "DEBUG" { Write-Host $logEntry -ForegroundColor Gray }
                "INFO" { Write-Host $logEntry -ForegroundColor Cyan }
                "WARNING" { Write-Host $logEntry -ForegroundColor Yellow }
                "ERROR" { Write-Host $logEntry -ForegroundColor Red }
            }
        }
    }
}

# =============================================================================
# HTTP REQUESTS
# =============================================================================

function Invoke-ApiRequest {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$TimeoutSeconds = 10
    )
    
    Write-Log "HTTP $Method $Url" -Level "DEBUG"
    
    $startTime = Get-Date
    
    try {
        $params = @{
            Uri             = $Url
            Method          = $Method
            Headers         = $Headers
            TimeoutSec      = $TimeoutSeconds
            UseBasicParsing = $true
        }
        
        if ($Body) {
            if ($Body -is [hashtable] -or $Body -is [PSCustomObject]) {
                $params.Body = ($Body | ConvertTo-Json -Depth 10)
                $params.ContentType = "application/json"
            }
            else {
                $params.Body = $Body
            }
        }
        
        $response = Invoke-WebRequest @params
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        Write-Log "Response: $($response.StatusCode) in ${duration}ms" -Level "DEBUG"
        
        return @{
            Success    = $true
            StatusCode = $response.StatusCode
            Content    = $response.Content
            Headers    = $response.Headers
            DurationMs = [math]::Round($duration, 2)
            Error      = $null
        }
    }
    catch {
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        Write-Log "Request failed: $($_.Exception.Message)" -Level "ERROR"
        
        return @{
            Success    = $false
            StatusCode = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
            Content    = $null
            Headers    = $null
            DurationMs = [math]::Round($duration, 2)
            Error      = $_.Exception.Message
        }
    }
}

function Test-ServiceAvailability {
    param(
        [string]$Url,
        [string]$ServiceName,
        [int]$TimeoutSeconds = 5
    )
    
    Write-Log "Testing $ServiceName availability at $Url" -Level "INFO"
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec $TimeoutSeconds -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Write-Log "$ServiceName is available (200 OK)" -Level "INFO"
            return @{ Available = $true; StatusCode = 200; Error = $null }
        }
        else {
            Write-Log "$ServiceName returned unexpected status: $($response.StatusCode)" -Level "WARNING"
            return @{ Available = $false; StatusCode = $response.StatusCode; Error = "Unexpected status code" }
        }
    }
    catch {
        Write-Log "$ServiceName is NOT available: $($_.Exception.Message)" -Level "ERROR"
        return @{ Available = $false; StatusCode = 0; Error = $_.Exception.Message }
    }
}

# =============================================================================
# AUTHENTICATION
# =============================================================================

function Get-AuthToken {
    param(
        [string]$BaseUrl,
        [string]$AuthEndpoint,
        [string]$Email,
        [string]$Password
    )
    
    Write-Log "Attempting login for user: $Email" -Level "INFO"
    
    $url = "$BaseUrl$AuthEndpoint"
    $body = @{
        email    = $Email
        password = $Password
    }
    
    $result = Invoke-ApiRequest -Url $url -Method "POST" -Body $body -TimeoutSeconds 10
    
    if ($result.Success) {
        try {
            $data = $result.Content | ConvertFrom-Json
            
            if ($data.access_token -or $data.token) {
                $token = if ($data.access_token) { $data.access_token } else { $data.token }
                Write-Log "Login successful for $Email" -Level "INFO"
                return @{
                    Success        = $true
                    Token          = $token
                    User           = $data.user
                    OrganizationId = $data.user.organizationId
                    Error          = $null
                }
            }
            else {
                Write-Log "Login response missing token" -Level "ERROR"
                return @{ Success = $false; Token = $null; User = $null; OrganizationId = $null; Error = "Missing token in response" }
            }
        }
        catch {
            Write-Log "Failed to parse login response: $($_.Exception.Message)" -Level "ERROR"
            return @{ Success = $false; Token = $null; User = $null; OrganizationId = $null; Error = "Invalid JSON response" }
        }
    }
    else {
        return @{ Success = $false; Token = $null; User = $null; OrganizationId = $null; Error = $result.Error }
    }
}

# =============================================================================
# JSON VALIDATION
# =============================================================================

function Test-JsonStructure {
    param(
        [string]$JsonString,
        [string[]]$RequiredFields
    )
    
    try {
        $obj = $JsonString | ConvertFrom-Json
        
        $missingFields = @()
        foreach ($field in $RequiredFields) {
            $fieldParts = $field -split '\.'
            $current = $obj
            $found = $true
            
            foreach ($part in $fieldParts) {
                if ($current.PSObject.Properties.Name -contains $part) {
                    $current = $current.$part
                }
                else {
                    $found = $false
                    break
                }
            }
            
            if (-not $found) {
                $missingFields += $field
            }
        }
        
        if ($missingFields.Count -eq 0) {
            return @{ Valid = $true; MissingFields = @(); Error = $null }
        }
        else {
            return @{ Valid = $false; MissingFields = $missingFields; Error = "Missing fields: $($missingFields -join ', ')" }
        }
    }
    catch {
        return @{ Valid = $false; MissingFields = @(); Error = "Invalid JSON: $($_.Exception.Message)" }
    }
}

# =============================================================================
# FILE OPERATIONS
# =============================================================================

function Get-TestDataFiles {
    param(
        [string]$DatasetPath,
        [string]$Pattern = "*.csv"
    )
    
    Write-Log "Searching for test files in $DatasetPath with pattern $Pattern" -Level "DEBUG"
    
    if (-not (Test-Path $DatasetPath)) {
        Write-Log "Dataset path does not exist: $DatasetPath" -Level "ERROR"
        return @()
    }
    
    $files = Get-ChildItem -Path $DatasetPath -Filter $Pattern -File -ErrorAction SilentlyContinue
    
    Write-Log "Found $($files.Count) test files" -Level "INFO"
    
    return $files
}

# =============================================================================
# REPORT GENERATION
# =============================================================================

function Initialize-TestResults {
    return @{
        Timestamp   = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        Services    = @{}
        Endpoints   = @()
        UploadTest  = @{}
        EventsTest  = @{}
        UIChecks    = @{}
        Performance = @{}
        Summary     = @{
            TotalTests = 0
            Passed     = 0
            Failed     = 0
            Warnings   = 0
        }
    }
}

function Add-TestResult {
    param(
        [hashtable]$Results,
        [string]$Category,
        [hashtable]$TestData
    )
    
    if ($TestData.Pass -eq $true) {
        $Results.Summary.Passed++
    }
    elseif ($TestData.Pass -eq $false) {
        $Results.Summary.Failed++
    }
    else {
        $Results.Summary.Warnings++
    }
    
    $Results.Summary.TotalTests++
    
    switch ($Category) {
        "Endpoint" { $Results.Endpoints += $TestData }
        "Upload" { $Results.UploadTest = $TestData }
        "Events" { $Results.EventsTest = $TestData }
        "UI" { 
            if (-not $Results.UIChecks) {
                $Results.UIChecks = @{}
            }
            $Results.UIChecks += $TestData
        }
        "Service" {
            if (-not $Results.Services) {
                $Results.Services = @{}
            }
            $Results.Services += $TestData
        }
    }
}

function Export-TestResultsToJson {
    param(
        [hashtable]$Results,
        [string]$OutputPath
    )
    
    Write-Log "Exporting test results to JSON: $OutputPath" -Level "INFO"
    
    $json = $Results | ConvertTo-Json -Depth 10
    Set-Content -Path $OutputPath -Value $json -Encoding UTF8
    
    Write-Log "JSON export complete" -Level "INFO"
}

function Export-TestResultsToMarkdown {
    param(
        [hashtable]$Results,
        [string]$OutputPath
    )
    
    Write-Log "Exporting test results to Markdown: $OutputPath" -Level "INFO"
    
    $md = @"
# Audit Report - Dashboard StabilSafe V3

**Generated:** $($Results.Timestamp)

---

## Summary

- **Total Tests:** $($Results.Summary.TotalTests)
- **Passed:** $($Results.Summary.Passed) ✅
- **Failed:** $($Results.Summary.Failed) ❌
- **Warnings:** $($Results.Summary.Warnings) ⚠️

**Success Rate:** $(if ($Results.Summary.TotalTests -gt 0) { [math]::Round(($Results.Summary.Passed / $Results.Summary.TotalTests) * 100, 2) } else { 0 })%

---

## Services Status

"@

    foreach ($service in $Results.Services.Keys) {
        $status = $Results.Services[$service]
        $icon = if ($status.Available) { "✅" } else { "❌" }
        $md += "`n### $icon $service`n`n"
        $md += "- **Status:** $($status.Status)`n"
        $md += "- **Port:** $($status.Port)`n"
        if ($status.Error) {
            $md += "- **Error:** $($status.Error)`n"
        }
    }

    $md += "`n---`n`n## Endpoint Tests`n`n"
    $md += "| Endpoint | Method | Status | Time (ms) | Result |`n"
    $md += "|----------|--------|--------|-----------|--------|`n"

    foreach ($endpoint in $Results.Endpoints) {
        $icon = if ($endpoint.Pass) { "✅" } else { "❌" }
        $md += "| $($endpoint.Url) | $($endpoint.Method) | $($endpoint.StatusCode) | $($endpoint.DurationMs) | $icon |`n"
    }

    $md += "`n---`n`n## Upload Test`n`n"
    if ($Results.UploadTest.Count -gt 0) {
        $icon = if ($Results.UploadTest.Pass) { "✅" } else { "❌" }
        $md += "- **Result:** $icon`n"
        $md += "- **File:** $($Results.UploadTest.FileUsed)`n"
        $md += "- **Session ID:** $($Results.UploadTest.SessionId)`n"
        $md += "- **Events Generated:** $($Results.UploadTest.EventsGenerated)`n"
    }
    else {
        $md += "_No upload test performed_`n"
    }

    $md += "`n---`n`n## Performance Metrics`n`n"
    foreach ($metric in $Results.Performance.Keys) {
        $value = $Results.Performance[$metric]
        $md += "- **$metric**: $value`n"
    }

    $md += "`n---`n`n## End of Report`n"

    Set-Content -Path $OutputPath -Value $md -Encoding UTF8
    
    Write-Log "Markdown export complete" -Level "INFO"
}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

function Get-Timestamp {
    return Get-Date -Format "yyyyMMdd_HHmmss"
}

function New-OutputDirectory {
    param(
        [string]$BasePath
    )
    
    $timestamp = Get-Timestamp
    $outputDir = Join-Path $BasePath $timestamp
    
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $outputDir "screenshots") -Force | Out-Null
    
    Write-Log "Created output directory: $outputDir" -Level "INFO"
    
    return $outputDir
}

# Note: Functions are available when dot-sourced
# Export-ModuleMember is only for modules (.psm1)

# test-helpers.ps1
# Funciones auxiliares para auditoría del Dashboard StabilSafe V3
# =============================================================================

# Configuración global
$script:LogLevel = "INFO" # DEBUG, INFO, WARNING, ERROR
$script:LogFile = $null

# =============================================================================
# LOGGING
# =============================================================================

function Initialize-Logging {
    param(
        [string]$LogFilePath,
        [string]$Level = "INFO"
    )
    
    $script:LogFile = $LogFilePath
    $script:LogLevel = $Level
    
    # Crear directorio si no existe
    $logDir = Split-Path -Parent $LogFilePath
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    
    # Inicializar log
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $LogFilePath -Value "=== AUDIT LOG STARTED: $timestamp ==="
}

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO",
        [switch]$NoConsole
    )
    
    $levels = @{
        "DEBUG"   = 0
        "INFO"    = 1
        "WARNING" = 2
        "ERROR"   = 3
    }
    
    $currentLevel = $levels[$script:LogLevel]
    $messageLevel = $levels[$Level]
    
    if ($messageLevel -ge $currentLevel) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
        $logEntry = "[$timestamp] [$Level] $Message"
        
        # Escribir a archivo
        if ($script:LogFile) {
            Add-Content -Path $script:LogFile -Value $logEntry
        }
        
        # Escribir a consola
        if (-not $NoConsole) {
            switch ($Level) {
                "DEBUG" { Write-Host $logEntry -ForegroundColor Gray }
                "INFO" { Write-Host $logEntry -ForegroundColor Cyan }
                "WARNING" { Write-Host $logEntry -ForegroundColor Yellow }
                "ERROR" { Write-Host $logEntry -ForegroundColor Red }
            }
        }
    }
}

# =============================================================================
# HTTP REQUESTS
# =============================================================================

function Invoke-ApiRequest {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$TimeoutSeconds = 10
    )
    
    Write-Log "HTTP $Method $Url" -Level "DEBUG"
    
    $startTime = Get-Date
    
    try {
        $params = @{
            Uri             = $Url
            Method          = $Method
            Headers         = $Headers
            TimeoutSec      = $TimeoutSeconds
            UseBasicParsing = $true
        }
        
        if ($Body) {
            if ($Body -is [hashtable] -or $Body -is [PSCustomObject]) {
                $params.Body = ($Body | ConvertTo-Json -Depth 10)
                $params.ContentType = "application/json"
            }
            else {
                $params.Body = $Body
            }
        }
        
        $response = Invoke-WebRequest @params
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        Write-Log "Response: $($response.StatusCode) in ${duration}ms" -Level "DEBUG"
        
        return @{
            Success    = $true
            StatusCode = $response.StatusCode
            Content    = $response.Content
            Headers    = $response.Headers
            DurationMs = [math]::Round($duration, 2)
            Error      = $null
        }
    }
    catch {
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        Write-Log "Request failed: $($_.Exception.Message)" -Level "ERROR"
        
        return @{
            Success    = $false
            StatusCode = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
            Content    = $null
            Headers    = $null
            DurationMs = [math]::Round($duration, 2)
            Error      = $_.Exception.Message
        }
    }
}

function Test-ServiceAvailability {
    param(
        [string]$Url,
        [string]$ServiceName,
        [int]$TimeoutSeconds = 5
    )
    
    Write-Log "Testing $ServiceName availability at $Url" -Level "INFO"
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec $TimeoutSeconds -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Write-Log "$ServiceName is available (200 OK)" -Level "INFO"
            return @{ Available = $true; StatusCode = 200; Error = $null }
        }
        else {
            Write-Log "$ServiceName returned unexpected status: $($response.StatusCode)" -Level "WARNING"
            return @{ Available = $false; StatusCode = $response.StatusCode; Error = "Unexpected status code" }
        }
    }
    catch {
        Write-Log "$ServiceName is NOT available: $($_.Exception.Message)" -Level "ERROR"
        return @{ Available = $false; StatusCode = 0; Error = $_.Exception.Message }
    }
}

# =============================================================================
# AUTHENTICATION
# =============================================================================

function Get-AuthToken {
    param(
        [string]$BaseUrl,
        [string]$AuthEndpoint,
        [string]$Email,
        [string]$Password
    )
    
    Write-Log "Attempting login for user: $Email" -Level "INFO"
    
    $url = "$BaseUrl$AuthEndpoint"
    $body = @{
        email    = $Email
        password = $Password
    }
    
    $result = Invoke-ApiRequest -Url $url -Method "POST" -Body $body -TimeoutSeconds 10
    
    if ($result.Success) {
        try {
            $data = $result.Content | ConvertFrom-Json
            
            if ($data.access_token -or $data.token) {
                $token = if ($data.access_token) { $data.access_token } else { $data.token }
                Write-Log "Login successful for $Email" -Level "INFO"
                return @{
                    Success        = $true
                    Token          = $token
                    User           = $data.user
                    OrganizationId = $data.user.organizationId
                    Error          = $null
                }
            }
            else {
                Write-Log "Login response missing token" -Level "ERROR"
                return @{ Success = $false; Token = $null; User = $null; OrganizationId = $null; Error = "Missing token in response" }
            }
        }
        catch {
            Write-Log "Failed to parse login response: $($_.Exception.Message)" -Level "ERROR"
            return @{ Success = $false; Token = $null; User = $null; OrganizationId = $null; Error = "Invalid JSON response" }
        }
    }
    else {
        return @{ Success = $false; Token = $null; User = $null; OrganizationId = $null; Error = $result.Error }
    }
}

# =============================================================================
# JSON VALIDATION
# =============================================================================

function Test-JsonStructure {
    param(
        [string]$JsonString,
        [string[]]$RequiredFields
    )
    
    try {
        $obj = $JsonString | ConvertFrom-Json
        
        $missingFields = @()
        foreach ($field in $RequiredFields) {
            $fieldParts = $field -split '\.'
            $current = $obj
            $found = $true
            
            foreach ($part in $fieldParts) {
                if ($current.PSObject.Properties.Name -contains $part) {
                    $current = $current.$part
                }
                else {
                    $found = $false
                    break
                }
            }
            
            if (-not $found) {
                $missingFields += $field
            }
        }
        
        if ($missingFields.Count -eq 0) {
            return @{ Valid = $true; MissingFields = @(); Error = $null }
        }
        else {
            return @{ Valid = $false; MissingFields = $missingFields; Error = "Missing fields: $($missingFields -join ', ')" }
        }
    }
    catch {
        return @{ Valid = $false; MissingFields = @(); Error = "Invalid JSON: $($_.Exception.Message)" }
    }
}

# =============================================================================
# FILE OPERATIONS
# =============================================================================

function Get-TestDataFiles {
    param(
        [string]$DatasetPath,
        [string]$Pattern = "*.csv"
    )
    
    Write-Log "Searching for test files in $DatasetPath with pattern $Pattern" -Level "DEBUG"
    
    if (-not (Test-Path $DatasetPath)) {
        Write-Log "Dataset path does not exist: $DatasetPath" -Level "ERROR"
        return @()
    }
    
    $files = Get-ChildItem -Path $DatasetPath -Filter $Pattern -File -ErrorAction SilentlyContinue
    
    Write-Log "Found $($files.Count) test files" -Level "INFO"
    
    return $files
}

# =============================================================================
# REPORT GENERATION
# =============================================================================

function Initialize-TestResults {
    return @{
        Timestamp   = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        Services    = @{}
        Endpoints   = @()
        UploadTest  = @{}
        EventsTest  = @{}
        UIChecks    = @{}
        Performance = @{}
        Summary     = @{
            TotalTests = 0
            Passed     = 0
            Failed     = 0
            Warnings   = 0
        }
    }
}

function Add-TestResult {
    param(
        [hashtable]$Results,
        [string]$Category,
        [hashtable]$TestData
    )
    
    if ($TestData.Pass -eq $true) {
        $Results.Summary.Passed++
    }
    elseif ($TestData.Pass -eq $false) {
        $Results.Summary.Failed++
    }
    else {
        $Results.Summary.Warnings++
    }
    
    $Results.Summary.TotalTests++
    
    switch ($Category) {
        "Endpoint" { $Results.Endpoints += $TestData }
        "Upload" { $Results.UploadTest = $TestData }
        "Events" { $Results.EventsTest = $TestData }
        "UI" { 
            if (-not $Results.UIChecks) {
                $Results.UIChecks = @{}
            }
            $Results.UIChecks += $TestData
        }
        "Service" {
            if (-not $Results.Services) {
                $Results.Services = @{}
            }
            $Results.Services += $TestData
        }
    }
}

function Export-TestResultsToJson {
    param(
        [hashtable]$Results,
        [string]$OutputPath
    )
    
    Write-Log "Exporting test results to JSON: $OutputPath" -Level "INFO"
    
    $json = $Results | ConvertTo-Json -Depth 10
    Set-Content -Path $OutputPath -Value $json -Encoding UTF8
    
    Write-Log "JSON export complete" -Level "INFO"
}

function Export-TestResultsToMarkdown {
    param(
        [hashtable]$Results,
        [string]$OutputPath
    )
    
    Write-Log "Exporting test results to Markdown: $OutputPath" -Level "INFO"
    
    $md = @"
# Audit Report - Dashboard StabilSafe V3

**Generated:** $($Results.Timestamp)

---

## Summary

- **Total Tests:** $($Results.Summary.TotalTests)
- **Passed:** $($Results.Summary.Passed) ✅
- **Failed:** $($Results.Summary.Failed) ❌
- **Warnings:** $($Results.Summary.Warnings) ⚠️

**Success Rate:** $(if ($Results.Summary.TotalTests -gt 0) { [math]::Round(($Results.Summary.Passed / $Results.Summary.TotalTests) * 100, 2) } else { 0 })%

---

## Services Status

"@

    foreach ($service in $Results.Services.Keys) {
        $status = $Results.Services[$service]
        $icon = if ($status.Available) { "✅" } else { "❌" }
        $md += "`n### $icon $service`n`n"
        $md += "- **Status:** $($status.Status)`n"
        $md += "- **Port:** $($status.Port)`n"
        if ($status.Error) {
            $md += "- **Error:** $($status.Error)`n"
        }
    }

    $md += "`n---`n`n## Endpoint Tests`n`n"
    $md += "| Endpoint | Method | Status | Time (ms) | Result |`n"
    $md += "|----------|--------|--------|-----------|--------|`n"

    foreach ($endpoint in $Results.Endpoints) {
        $icon = if ($endpoint.Pass) { "✅" } else { "❌" }
        $md += "| $($endpoint.Url) | $($endpoint.Method) | $($endpoint.StatusCode) | $($endpoint.DurationMs) | $icon |`n"
    }

    $md += "`n---`n`n## Upload Test`n`n"
    if ($Results.UploadTest.Count -gt 0) {
        $icon = if ($Results.UploadTest.Pass) { "✅" } else { "❌" }
        $md += "- **Result:** $icon`n"
        $md += "- **File:** $($Results.UploadTest.FileUsed)`n"
        $md += "- **Session ID:** $($Results.UploadTest.SessionId)`n"
        $md += "- **Events Generated:** $($Results.UploadTest.EventsGenerated)`n"
    }
    else {
        $md += "_No upload test performed_`n"
    }

    $md += "`n---`n`n## Performance Metrics`n`n"
    foreach ($metric in $Results.Performance.Keys) {
        $value = $Results.Performance[$metric]
        $md += "- **$metric**: $value`n"
    }

    $md += "`n---`n`n## End of Report`n"

    Set-Content -Path $OutputPath -Value $md -Encoding UTF8
    
    Write-Log "Markdown export complete" -Level "INFO"
}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

function Get-Timestamp {
    return Get-Date -Format "yyyyMMdd_HHmmss"
}

function New-OutputDirectory {
    param(
        [string]$BasePath
    )
    
    $timestamp = Get-Timestamp
    $outputDir = Join-Path $BasePath $timestamp
    
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $outputDir "screenshots") -Force | Out-Null
    
    Write-Log "Created output directory: $outputDir" -Level "INFO"
    
    return $outputDir
}

# Note: Functions are available when dot-sourced
# Export-ModuleMember is only for modules (.psm1)

