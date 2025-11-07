# Script para ejecutar la migración de OperationalKeys
# Llama al endpoint /api/admin/migrate-operational-keys

Write-Host "Iniciando migracion de OperationalKeys..." -ForegroundColor Cyan
Write-Host ""

# Esperar a que el servidor esté listo
Write-Host "Esperando a que el servidor este listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Credenciales del superadmin
$email = "admin@dobacksoft.com"
$password = "Admin2024!"

# URL base
$baseUrl = "http://localhost:9998"

# 1. Login para obtener token
Write-Host "Autenticando como superadmin..." -ForegroundColor Yellow

$loginBody = @{
    email    = $email
    password = $password
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"

$token = $loginResponse.token

if (-not $token) {
    Write-Host "Error: No se pudo obtener el token de autenticacion" -ForegroundColor Red
    exit 1
}

Write-Host "Autenticacion exitosa" -ForegroundColor Green
Write-Host ""

# 2. Llamar al endpoint de migración
Write-Host "Ejecutando migracion..." -ForegroundColor Yellow
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

$migrateResponse = Invoke-RestMethod -Uri "$baseUrl/api/admin/migrate-operational-keys" -Method POST -Headers $headers

# 3. Mostrar resultados
Write-Host ""
Write-Host "RESULTADO DE MIGRACION" -ForegroundColor Cyan
Write-Host "Sesiones encontradas: $($migrateResponse.sessionsFound)" -ForegroundColor White
Write-Host "Sesiones procesadas: $($migrateResponse.sessionsProcessed)" -ForegroundColor Green
Write-Host "Sesiones fallidas: $($migrateResponse.sessionsFailed)" -ForegroundColor Yellow
Write-Host "Total claves creadas: $($migrateResponse.totalKeysCreated)" -ForegroundColor Green
Write-Host ""

if ($migrateResponse.errors -and $migrateResponse.errors.Count -gt 0) {
    Write-Host "ERRORES ENCONTRADOS:" -ForegroundColor Yellow
    foreach ($error in $migrateResponse.errors) {
        Write-Host "  - $error" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "Migracion completada exitosamente" -ForegroundColor Green
Write-Host ""
Write-Host "Puedes verificar los resultados en el dashboard:" -ForegroundColor Cyan
Write-Host "http://localhost:5174/dashboard" -ForegroundColor Cyan
Write-Host "Panel de Control > Estados y Tiempos > Eventos Detallados" -ForegroundColor Cyan
Write-Host ""
