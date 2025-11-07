# Script de Configuracion - Google Roads API
# Configura Google Roads API para limites de velocidad

$ErrorActionPreference = "Stop"

Write-Host "`n=============================================================" -ForegroundColor Cyan
Write-Host "   CONFIGURACION GOOGLE ROADS API - LIMITES DE VELOCIDAD" -ForegroundColor Cyan
Write-Host "=============================================================`n" -ForegroundColor Cyan

Write-Host "Este script configurara Google Roads API para reemplazar TomTom.`n" -ForegroundColor White

# Paso 1: Verificar configuracion existente
Write-Host "PASO 1: Verificando configuracion existente...`n" -ForegroundColor Yellow

$envFile = ".\backend\.env"

if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    
    if ($envContent -match "GOOGLE_ROADS_API_KEY=(.+)") {
        $existingKey = $Matches[1].Trim()
        
        if ($existingKey -and $existingKey -ne "" -and $existingKey -ne "tu-api-key") {
            Write-Host "[OK] Google Roads API Key ya configurada" -ForegroundColor Green
            Write-Host "   Key: $($existingKey.Substring(0, 20))...`n" -ForegroundColor Gray
            
            $overwrite = Read-Host "Deseas reconfigurar? (s/N)"
            
            if ($overwrite -ne "s" -and $overwrite -ne "S") {
                Write-Host "`n[OK] Configuracion mantenida. Saliendo...`n" -ForegroundColor Green
                exit 0
            }
        }
    }
}

# Paso 2: Instrucciones para Google Cloud Console
Write-Host "`nPASO 2: Configurar Google Cloud Console`n" -ForegroundColor Yellow

Write-Host "IMPORTANTE: Google Roads API requiere habilitar la API en tu proyecto.`n" -ForegroundColor Yellow

Write-Host "Sigue estos pasos:`n" -ForegroundColor White

Write-Host "1. Ve a: https://console.cloud.google.com/" -ForegroundColor Cyan
Write-Host "2. Selecciona tu proyecto (o crea uno nuevo)" -ForegroundColor Cyan
Write-Host "3. Ve a: APIs and Services > Library" -ForegroundColor Cyan
Write-Host "4. Busca 'Roads API' y haz click en ENABLE" -ForegroundColor Cyan
Write-Host "5. Ve a: APIs and Services > Credentials" -ForegroundColor Cyan
Write-Host "6. Click en CREATE CREDENTIALS > API Key" -ForegroundColor Cyan
Write-Host "7. (Opcional pero recomendado) Restringe la key:" -ForegroundColor Cyan
Write-Host "     - Application restrictions: None" -ForegroundColor Gray
Write-Host "     - API restrictions: Roads API" -ForegroundColor Gray
Write-Host "8. Copia la API Key generada`n" -ForegroundColor Cyan

$openBrowser = Read-Host "Abrir Google Cloud Console ahora? (S/n)"

if ($openBrowser -ne "n" -and $openBrowser -ne "N") {
    Start-Process "https://console.cloud.google.com/apis/library"
    Write-Host "`n[OK] Navegador abierto en APIs Library.`n" -ForegroundColor Green
    Write-Host "  1. Busca 'Roads API' y habilítala" -ForegroundColor White
    Write-Host "  2. Luego ve a Credentials y crea una API Key`n" -ForegroundColor White
}

Read-Host "Presiona ENTER cuando hayas completado la configuracion en Google Cloud Console"

# Paso 3: Ingresar API Key
Write-Host "`nPASO 3: Ingresando Google Roads API Key`n" -ForegroundColor Yellow

Write-Host "Pega tu Google Roads API Key (empieza con 'AIza'):`n" -ForegroundColor White

$apiKey = Read-Host "GOOGLE_ROADS_API_KEY"

# Validar formato basico
if ($apiKey -notmatch "^AIza") {
    Write-Host "`n[!] ADVERTENCIA: La API Key no empieza con 'AIza'" -ForegroundColor Yellow
    Write-Host "   Las API keys de Google normalmente empiezan con 'AIza'`n" -ForegroundColor Yellow
    
    $continue = Read-Host "Continuar de todas formas? (s/N)"
    
    if ($continue -ne "s" -and $continue -ne "S") {
        Write-Host "`n[X] Configuracion cancelada.`n" -ForegroundColor Red
        exit 1
    }
}

# Paso 4: Configurar fallback a TomTom (opcional)
Write-Host "`nPASO 4: Configurar fallback a TomTom (opcional)`n" -ForegroundColor Yellow

Write-Host "Puedes configurar TomTom como fallback si Google falla." -ForegroundColor White
Write-Host "Esto es opcional y normalmente no es necesario.`n" -ForegroundColor Gray

$useTomTomFallback = Read-Host "Habilitar TomTom como fallback? (s/N)"

$tomtomEnabled = "false"
$tomtomKey = ""

if ($useTomTomFallback -eq "s" -or $useTomTomFallback -eq "S") {
    $tomtomKey = Read-Host "Ingresa tu TomTom API Key (o deja vacio para omitir)"
    if ($tomtomKey) {
        $tomtomEnabled = "true"
    }
}

# Paso 5: Actualizar archivo .env
Write-Host "`nPASO 5: Actualizando archivo .env...`n" -ForegroundColor Yellow

$backendEnvFile = ".\backend\.env"

if (-not (Test-Path $backendEnvFile)) {
    Write-Host "[X] Error: No se encontro el archivo backend\.env`n" -ForegroundColor Red
    exit 1
}

# Leer contenido actual
$envContent = Get-Content $backendEnvFile -Raw

# Crear configuracion de Google Roads
$googleRoadsConfig = @"


# ====================================================================
# GOOGLE ROADS API - Limites de Velocidad
# ====================================================================
GOOGLE_ROADS_API_KEY=$apiKey
GOOGLE_ROADS_ENABLED=true

# Fallback a TomTom (opcional)
TOMTOM_FALLBACK_ENABLED=$tomtomEnabled
TOMTOM_API_KEY=$tomtomKey

# Configuracion de cache
SPEED_LIMIT_CACHE_TTL=3600
SPEED_LIMIT_CACHE_RADIUS=100

# Batch processing (no modificar a menos que sepas lo que haces)
GOOGLE_ROADS_BATCH_SIZE=100
GOOGLE_ROADS_TIMEOUT=5000
"@

# Anadir nueva configuracion al final del archivo
$newEnvContent = $envContent.TrimEnd() + "`n" + $googleRoadsConfig

# Guardar
Set-Content -Path $backendEnvFile -Value $newEnvContent -NoNewline

Write-Host "[OK] Archivo .env actualizado exitosamente`n" -ForegroundColor Green

# Paso 6: Aplicar migracion de BD
Write-Host "PASO 6: Aplicando migracion de base de datos...`n" -ForegroundColor Yellow

$applyMigration = Read-Host "Aplicar migracion SQL para Google Roads? (S/n)"

if ($applyMigration -ne "n" -and $applyMigration -ne "N") {
    $migrationFile = ".\database\migrations\add_google_roads_support.sql"
    
    if (Test-Path $migrationFile) {
        Write-Host "Ejecutando: psql -U postgres -d dobacksoft -f $migrationFile`n" -ForegroundColor Gray
        
        try {
            $output = psql -U postgres -d dobacksoft -f $migrationFile 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[OK] Migracion aplicada exitosamente`n" -ForegroundColor Green
            } else {
                Write-Host "[!] Error aplicando migracion:" -ForegroundColor Yellow
                Write-Host $output -ForegroundColor Red
                Write-Host "`nPuedes aplicarla manualmente con:" -ForegroundColor Yellow
                Write-Host "psql -U postgres -d dobacksoft -f $migrationFile`n" -ForegroundColor Gray
            }
        } catch {
            Write-Host "[!] Error ejecutando psql. Asegurate de que PostgreSQL este instalado.`n" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[!] Archivo de migracion no encontrado: $migrationFile`n" -ForegroundColor Yellow
    }
}

# Paso 7: Verificar API Key
Write-Host "`nPASO 7: Verificando API Key...`n" -ForegroundColor Yellow

$testKey = Read-Host "Deseas probar la API Key ahora? (S/n)"

if ($testKey -ne "n" -and $testKey -ne "N") {
    Write-Host "`nProbando Snap to Roads con coordenadas de Madrid...`n" -ForegroundColor Gray
    
    $testUrl = "https://roads.googleapis.com/v1/snapToRoads?path=40.4169,-3.7038&key=$apiKey"
    
    try {
        $response = Invoke-RestMethod -Uri $testUrl -Method Get -TimeoutSec 10
        
        if ($response.snappedPoints) {
            Write-Host "[OK] API Key funciona correctamente!`n" -ForegroundColor Green
            Write-Host "Punto corregido:" -ForegroundColor White
            Write-Host "  Lat: $($response.snappedPoints[0].location.latitude)" -ForegroundColor Gray
            Write-Host "  Lon: $($response.snappedPoints[0].location.longitude)" -ForegroundColor Gray
            Write-Host "  PlaceId: $($response.snappedPoints[0].placeId)`n" -ForegroundColor Gray
        } else {
            Write-Host "[!] API Key funciona pero no devolvio resultados`n" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[X] Error al probar API Key:" -ForegroundColor Red
        Write-Host "  $($_.Exception.Message)`n" -ForegroundColor Red
        Write-Host "Verifica que:" -ForegroundColor Yellow
        Write-Host "  1. La API Key sea correcta" -ForegroundColor Gray
        Write-Host "  2. Roads API este habilitada en Google Cloud Console" -ForegroundColor Gray
        Write-Host "  3. Tengas creditos disponibles en tu cuenta de Google Cloud`n" -ForegroundColor Gray
    }
}

# Resumen final
Write-Host "`n=============================================================" -ForegroundColor Green
Write-Host "           CONFIGURACION COMPLETADA" -ForegroundColor Green
Write-Host "=============================================================`n" -ForegroundColor Green

Write-Host "Google Roads API esta configurado!`n" -ForegroundColor White

Write-Host "Proximos pasos:`n" -ForegroundColor White

Write-Host "1. Reiniciar backend:" -ForegroundColor Cyan
Write-Host "   .\iniciar.ps1`n" -ForegroundColor Gray

Write-Host "2. Verificar logs del backend:" -ForegroundColor Cyan
Write-Host "   tail -f backend\logs\combined.log | grep Google`n" -ForegroundColor Gray

Write-Host "3. Verificar en base de datos:" -ForegroundColor Cyan
Write-Host "   SELECT * FROM speed_limits_cache WHERE source = 'google' LIMIT 5;`n" -ForegroundColor Gray

Write-Host "Documentacion completa en:" -ForegroundColor White
Write-Host "   docs\DESARROLLO\configurar-google-roads-api.md`n" -ForegroundColor Gray

Write-Host "Costes estimados (con cache al 90%):" -ForegroundColor White
Write-Host "   10 vehiculos: ~$20/mes" -ForegroundColor Gray
Write-Host "   20 vehiculos: ~$40/mes" -ForegroundColor Gray
Write-Host "   Credito gratis: $200/mes (suficiente para ~100 vehiculos)`n" -ForegroundColor Gray

Read-Host "Presiona ENTER para salir"

