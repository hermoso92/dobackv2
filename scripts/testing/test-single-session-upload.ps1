# Test Single Session Upload Endpoint
# Este script prueba el endpoint /api/upload/single-session

Write-Host "🧪 Test del Endpoint: Single Session Upload" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Configuración
$baseUrl = "http://localhost:9998/api/upload/single-session"
$authToken = "tu-auth-token-aqui"  # Cambiar por token real

# Archivos de prueba (ajustar rutas según tu sistema)
$estabilidadFile = "backend/data/datosDoback/CMadrid/estabilidad/ESTABILIDAD_DOBACK001_20240101.txt"
$gpsFile = "backend/data/datosDoback/CMadrid/gps/GPS_DOBACK001_20240101.txt"
$rotativoFile = "backend/data/datosDoback/CMadrid/rotativo/ROTATIVO_DOBACK001_20240101.txt"

Write-Host "📁 Archivos de prueba:" -ForegroundColor Yellow
Write-Host "  - Estabilidad: $estabilidadFile"
Write-Host "  - GPS: $gpsFile"
Write-Host "  - Rotativo: $rotativoFile"
Write-Host ""

# Verificar que los archivos existen
$allFilesExist = $true
if (!(Test-Path $estabilidadFile)) {
    Write-Host "❌ No se encuentra: $estabilidadFile" -ForegroundColor Red
    $allFilesExist = $false
}
if (!(Test-Path $gpsFile)) {
    Write-Host "❌ No se encuentra: $gpsFile" -ForegroundColor Red
    $allFilesExist = $false
}
if (!(Test-Path $rotativoFile)) {
    Write-Host "❌ No se encuentra: $rotativoFile" -ForegroundColor Red
    $allFilesExist = $false
}

if (!$allFilesExist) {
    Write-Host ""
    Write-Host "⚠️  Por favor, ajusta las rutas de los archivos en el script" -ForegroundColor Yellow
    Write-Host "    o coloca archivos de prueba en las rutas indicadas." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Todos los archivos encontrados" -ForegroundColor Green
Write-Host ""

# Preguntar si continuar
Write-Host "⚠️  ADVERTENCIA: Este script subirá una nueva sesión a la base de datos" -ForegroundColor Yellow
$continuar = Read-Host "¿Deseas continuar? (s/n)"
if ($continuar -ne "s" -and $continuar -ne "S") {
    Write-Host "❌ Operación cancelada" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🚀 Iniciando subida..." -ForegroundColor Cyan

# Crear FormData usando curl (alternativa a Invoke-WebRequest)
Write-Host "📤 Subiendo archivos al endpoint..." -ForegroundColor Yellow

try {
    # Opción 1: Usando curl (recomendado para PowerShell)
    $curlCommand = "curl -X POST `"$baseUrl`" -H `"Cookie: authToken=$authToken`" -F `"files=@$estabilidadFile`" -F `"files=@$gpsFile`" -F `"files=@$rotativoFile`""
    
    Write-Host "Ejecutando: curl..." -ForegroundColor Gray
    $response = Invoke-Expression $curlCommand
    
    Write-Host ""
    Write-Host "✅ Respuesta recibida:" -ForegroundColor Green
    Write-Host $response | ConvertFrom-Json | ConvertTo-Json -Depth 10
    
}
catch {
    Write-Host ""
    Write-Host "❌ Error durante la subida:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host ""
    Write-Host "💡 Posibles causas:" -ForegroundColor Yellow
    Write-Host "  1. El backend no está corriendo en puerto 9998"
    Write-Host "  2. El token de autenticación es inválido"
    Write-Host "  3. Los archivos tienen formato incorrecto"
    Write-Host "  4. curl no está instalado (instalar desde https://curl.se/)"
    exit 1
}

Write-Host ""
Write-Host "✅ Test completado" -ForegroundColor Green

# Opción 2: Usando Postman-like approach con PowerShell
# (Descomenta si prefieres este método)
<#
try {
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    $bodyLines = @(
        "--$boundary",
        "Content-Disposition: form-data; name=`"files`"; filename=`"$(Split-Path $estabilidadFile -Leaf)`"",
        "Content-Type: text/plain$LF",
        [System.IO.File]::ReadAllText($estabilidadFile),
        "--$boundary",
        "Content-Disposition: form-data; name=`"files`"; filename=`"$(Split-Path $gpsFile -Leaf)`"",
        "Content-Type: text/plain$LF",
        [System.IO.File]::ReadAllText($gpsFile),
        "--$boundary",
        "Content-Disposition: form-data; name=`"files`"; filename=`"$(Split-Path $rotativoFile -Leaf)`"",
        "Content-Type: text/plain$LF",
        [System.IO.File]::ReadAllText($rotativoFile),
        "--$boundary--$LF"
    )
    
    $body = $bodyLines -join $LF
    
    $response = Invoke-WebRequest `
        -Uri $baseUrl `
        -Method POST `
        -Headers @{
            "Cookie" = "authToken=$authToken"
            "Content-Type" = "multipart/form-data; boundary=$boundary"
        } `
        -Body $body
    
    Write-Host ""
    Write-Host "✅ Respuesta recibida:" -ForegroundColor Green
    Write-Host ($response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10)
    
} catch {
    Write-Host ""
    Write-Host "❌ Error durante la subida:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}
#>

