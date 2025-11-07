# Script para corregir imports duplicados de logger
$files = @(
    "frontend/src/components/Layout.tsx",
    "frontend/src/components/MultiVehicleSelector.tsx",
    "frontend/src/components/ProcessingDashboard.tsx",
    "frontend/src/components/Sidebar.tsx",
    "frontend/src/components/StabilityDashboard.tsx",
    "frontend/src/components/UploadConfigPanel.tsx",
    "frontend/src/components/VehicleSelector.tsx",
    "frontend/src/components/kpi/OperationalKeysTab.tsx",
    "frontend/src/components/maps/AdvancedHeatmapView.tsx",
    "frontend/src/components/reports/ProfessionalReportGenerator.tsx",
    "frontend/src/pages/EmergencyDashboard.tsx",
    "frontend/src/pages/Perfil.tsx",
    "frontend/src/pages/Settings.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Corrigiendo $file..." -ForegroundColor Cyan
        
        $content = Get-Content $file -Raw
        
        # Patron: buscar "import {\n" seguido de "import { logger...}"
        $pattern = "(?m)^import \{\s*\n^import \{ logger \} from"
        $replacement = "import { logger } from"
        
        $newContent = $content -replace $pattern, $replacement
        
        if ($content -ne $newContent) {
            Set-Content $file -Value $newContent -NoNewline
            Write-Host "  [OK] Corregido" -ForegroundColor Green
        }
        else {
            Write-Host "  [-] Sin cambios necesarios" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "  [ERROR] Archivo no encontrado: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "[OK] Correccion de imports completada" -ForegroundColor Green
