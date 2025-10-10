# =====================================================
# ⚡ Script de Subida RÁPIDA a GitHub (sin preguntas)
# DobackSoft V3
# =====================================================

$fecha = Get-Date -Format 'dd/MM/yyyy HH:mm'

Write-Host "🔄 Subiendo cambios a GitHub..." -ForegroundColor Cyan

git add .
git commit -m "Actualización $fecha"
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ ¡Subido exitosamente!" -ForegroundColor Green
    Write-Host "🔗 https://github.com/hermoso92/dobackv2" -ForegroundColor Cyan
} else {
    Write-Host "❌ Error en el proceso" -ForegroundColor Red
}

