# Script mejorado para corregir imports
$files = @(
    "frontend/src/components/MultiVehicleSelector.tsx",
    "frontend/src/components/operations/OperationalKeysTab.tsx",
    "frontend/src/components/panel/AdvancedHeatmapView.tsx",
    "frontend/src/components/ProcessingDashboard.tsx",
    "frontend/src/components/reports/ProfessionalReportGenerator.tsx",
    "frontend/src/components/Sidebar.tsx",
    "frontend/src/components/StabilityDashboard.tsx",
    "frontend/src/components/UploadConfigPanel.tsx",
    "frontend/src/components/VehicleSelector.tsx",
    "frontend/src/pages/EmergencyDashboard.tsx",
    "frontend/src/pages/Perfil.tsx",
    "frontend/src/pages/Settings.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Corrigiendo $file..." -ForegroundColor Cyan
        
        $content = Get-Content $file -Raw
        
        # Patron: buscar "logger import\n    Componente" y agregar "import {" antes
        $pattern = "(import \{ logger \} from [^\n]+\n)(    [A-Z])"
        $replacement = "`$1import {`n`$2"
        
        $newContent = $content -replace $pattern, $replacement
        
        if ($content -ne $newContent) {
            Set-Content $file -Value $newContent -NoNewline
            Write-Host "  [OK] Corregido" -ForegroundColor Green
        }
        else {
            Write-Host "  [-] Sin cambios" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "  [ERROR] No encontrado: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "[OK] Correccion completada" -ForegroundColor Green












