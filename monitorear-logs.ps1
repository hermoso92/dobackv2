# ============================================
# DOBACKSOFT - MONITOREO DE LOGS EN TIEMPO REAL
# ============================================

param(
    [ValidateSet("ambos", "backend", "frontend")]
    [string]$Servicio = "ambos",
    
    [ValidateSet("all", "error", "warn", "info", "debug")]
    [string]$Level = "all",
    
    [string]$Filter = "",
    
    [switch]$Follow,
    
    [int]$Lines = 50
)

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host   "║                                                                ║" -ForegroundColor Cyan
Write-Host   "║   📊 MONITOR DE LOGS - DOBACKSOFT                             ║" -ForegroundColor Cyan
Write-Host   "║                                                                ║" -ForegroundColor Cyan
Write-Host   "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

if (-not (Test-Path "logs")) {
    Write-Host "❌ No existe la carpeta logs" -ForegroundColor Red
    exit 1
}

function Format-LogLine {
    param([string]$line, [string]$source)
    
    # Colorear según nivel
    $color = "White"
    if ($line -match '\[error\]|ERROR|❌') {
        $color = "Red"
    }
    elseif ($line -match '\[warn\]|WARNING|⚠️') {
        $color = "Yellow"
    }
    elseif ($line -match '\[info\]|INFO|✅') {
        $color = "Green"
    }
    elseif ($line -match '\[debug\]|DEBUG') {
        $color = "Blue"
    }
    
    # Filtrar por nivel si se especificó
    if ($Level -ne "all") {
        $levelPattern = "\[$Level\]|$($Level.ToUpper())"
        if ($line -notmatch $levelPattern) {
            return
        }
    }
    
    # Filtrar por palabra clave si se especificó
    if ($Filter -ne "" -and $line -notmatch $Filter) {
        return
    }
    
    # Añadir prefijo de fuente
    $prefix = if ($source -eq "backend") { "[BE]" } else { "[FE]" }
    Write-Host "$prefix " -ForegroundColor Cyan -NoNewline
    Write-Host $line -ForegroundColor $color
}

function Show-LogSnapshot {
    param([string]$logFile, [string]$source, [int]$lineCount)
    
    if (Test-Path $logFile) {
        $content = Get-Content $logFile -Tail $lineCount -ErrorAction SilentlyContinue
        foreach ($line in $content) {
            Format-LogLine -line $line -source $source
        }
    }
}

function Monitor-LogsRealtime {
    $backendLog = Get-ChildItem logs -Filter "backend_*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    $frontendLog = Get-ChildItem logs -Filter "frontend_*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    
    Write-Host "Monitoreando logs en tiempo real (Ctrl+C para salir)...`n" -ForegroundColor Yellow
    
    $jobs = @()
    
    if (($Servicio -eq "ambos" -or $Servicio -eq "backend") -and $backendLog) {
        $jobs += Start-Job -ScriptBlock {
            param($logPath)
            Get-Content $logPath -Wait -Tail 10 | ForEach-Object {
                [PSCustomObject]@{
                    Source = "backend"
                    Line   = $_
                }
            }
        } -ArgumentList $backendLog.FullName
    }
    
    if (($Servicio -eq "ambos" -or $Servicio -eq "frontend") -and $frontendLog) {
        $jobs += Start-Job -ScriptBlock {
            param($logPath)
            Get-Content $logPath -Wait -Tail 10 | ForEach-Object {
                [PSCustomObject]@{
                    Source = "frontend"
                    Line   = $_
                }
            }
        } -ArgumentList $frontendLog.FullName
    }
    
    try {
        while ($true) {
            foreach ($job in $jobs) {
                $output = Receive-Job -Job $job -ErrorAction SilentlyContinue
                foreach ($item in $output) {
                    Format-LogLine -line $item.Line -source $item.Source
                }
            }
            Start-Sleep -Milliseconds 100
        }
    }
    finally {
        $jobs | Stop-Job
        $jobs | Remove-Job
    }
}

# Obtener logs más recientes
$backendLogs = Get-ChildItem logs -Filter "backend_*.log" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
$frontendLogs = Get-ChildItem logs -Filter "frontend_*.log" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending

if ($backendLogs.Count -eq 0 -and $frontendLogs.Count -eq 0) {
    Write-Host "❌ No se encontraron archivos de log" -ForegroundColor Red
    exit 1
}

# Mostrar información de logs disponibles
Write-Host "📁 Logs disponibles:" -ForegroundColor Cyan
if ($backendLogs.Count -gt 0) {
    Write-Host "   Backend:  $($backendLogs[0].Name) ($([math]::Round($backendLogs[0].Length/1KB, 2)) KB)" -ForegroundColor Green
}
if ($frontendLogs.Count -gt 0) {
    Write-Host "   Frontend: $($frontendLogs[0].Name) ($([math]::Round($frontendLogs[0].Length/1KB, 2)) KB)" -ForegroundColor Green
}

if ($Filter -ne "") {
    Write-Host "`n🔍 Filtro activo: '$Filter'" -ForegroundColor Yellow
}
if ($Level -ne "all") {
    Write-Host "📊 Nivel: $Level" -ForegroundColor Yellow
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor DarkGray

if ($Follow) {
    Monitor-LogsRealtime
}
else {
    # Mostrar snapshot de logs
    if ($Servicio -eq "ambos" -or $Servicio -eq "backend") {
        if ($backendLogs.Count -gt 0) {
            Write-Host "═══ BACKEND (últimas $Lines líneas) ═══" -ForegroundColor Cyan
            Show-LogSnapshot -logFile $backendLogs[0].FullName -source "backend" -lineCount $Lines
            Write-Host "`n" -ForegroundColor DarkGray
        }
    }
    
    if ($Servicio -eq "ambos" -or $Servicio -eq "frontend") {
        if ($frontendLogs.Count -gt 0) {
            Write-Host "═══ FRONTEND (últimas $Lines líneas) ═══" -ForegroundColor Cyan
            Show-LogSnapshot -logFile $frontendLogs[0].FullName -source "frontend" -lineCount $Lines
        }
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor DarkGray

# Mostrar ayuda
Write-Host "💡 COMANDOS ÚTILES:" -ForegroundColor Yellow
Write-Host "   Monitorear en tiempo real:      .\monitorear-logs.ps1 -Follow" -ForegroundColor White
Write-Host "   Solo errores:                    .\monitorear-logs.ps1 -Level error" -ForegroundColor White
Write-Host "   Filtrar por palabra:             .\monitorear-logs.ps1 -Filter 'alert'" -ForegroundColor White
Write-Host "   Solo backend:                    .\monitorear-logs.ps1 -Servicio backend" -ForegroundColor White
Write-Host "   Más líneas:                      .\monitorear-logs.ps1 -Lines 100" -ForegroundColor White
Write-Host "   Combinar opciones:               .\monitorear-logs.ps1 -Follow -Level error -Servicio backend`n" -ForegroundColor White

