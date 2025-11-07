# Script de Configuracion - Google OAuth 2.0
# Version simplificada sin emojis para evitar problemas de encoding

$ErrorActionPreference = "Stop"

Write-Host "`n=============================================================" -ForegroundColor Cyan
Write-Host "   CONFIGURACION GOOGLE OAUTH 2.0 - DOBACKSOFT" -ForegroundColor Cyan
Write-Host "=============================================================`n" -ForegroundColor Cyan

Write-Host "Este script te ayudara a configurar Google OAuth 2.0 paso a paso.`n" -ForegroundColor White

# Paso 1: Verificar configuracion existente
Write-Host "PASO 1: Verificando configuracion existente...`n" -ForegroundColor Yellow

$envFile = ".\backend\.env"

if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    
    if ($envContent -match "GOOGLE_CLIENT_ID=(.+)") {
        $existingClientId = $Matches[1].Trim()
        
        if ($existingClientId -and $existingClientId -ne "" -and $existingClientId -ne "tu-client-id") {
            Write-Host "[OK] Configuracion existente encontrada:" -ForegroundColor Green
            Write-Host "   GOOGLE_CLIENT_ID: $existingClientId`n" -ForegroundColor Gray
            
            $overwrite = Read-Host "Deseas sobrescribir la configuracion existente? (s/N)"
            
            if ($overwrite -ne "s" -and $overwrite -ne "S") {
                Write-Host "`n[OK] Configuracion mantenida. Saliendo...`n" -ForegroundColor Green
                exit 0
            }
        }
    }
}

# Paso 2: Instrucciones para Google Cloud Console
Write-Host "`nPASO 2: Configurar Google Cloud Console`n" -ForegroundColor Yellow

Write-Host "Abre tu navegador y sigue estos pasos:`n" -ForegroundColor White

Write-Host "1. Ve a: https://console.cloud.google.com/" -ForegroundColor Cyan
Write-Host "2. Crea un nuevo proyecto llamado 'DobackSoft OAuth'" -ForegroundColor Cyan
Write-Host "3. Habilita la API de Google+ (APIs and Services > Library)" -ForegroundColor Cyan
Write-Host "4. Configura OAuth Consent Screen:" -ForegroundColor Cyan
Write-Host "     - Tipo: External" -ForegroundColor Gray
Write-Host "     - App name: DobackSoft" -ForegroundColor Gray
Write-Host "     - Scopes: email, profile" -ForegroundColor Gray
Write-Host "5. Crea credenciales OAuth 2.0 Client ID:" -ForegroundColor Cyan
Write-Host "     - Tipo: Web application" -ForegroundColor Gray
Write-Host "     - Authorized JavaScript origins:" -ForegroundColor Gray
Write-Host "       * http://localhost:5174" -ForegroundColor DarkGray
Write-Host "     - Authorized redirect URIs:" -ForegroundColor Gray
Write-Host "       * http://localhost:9998/api/auth/google/callback`n" -ForegroundColor DarkGray

$openBrowser = Read-Host "Abrir Google Cloud Console ahora? (S/n)"

if ($openBrowser -ne "n" -and $openBrowser -ne "N") {
    Start-Process "https://console.cloud.google.com/"
    Write-Host "`n[OK] Navegador abierto. Completa los pasos y vuelve aqui.`n" -ForegroundColor Green
}

Read-Host "Presiona ENTER cuando hayas completado la configuracion en Google Cloud Console"

# Paso 3: Capturar credenciales
Write-Host "`nPASO 3: Ingresando credenciales`n" -ForegroundColor Yellow

Write-Host "Copia las credenciales de Google Cloud Console:`n" -ForegroundColor White

$clientId = Read-Host "Ingresa tu GOOGLE_CLIENT_ID (termina en .apps.googleusercontent.com)"
$clientSecret = Read-Host "Ingresa tu GOOGLE_CLIENT_SECRET (empieza con GOCSPX-)"

# Validar formato basico
if ($clientId -notmatch "\.apps\.googleusercontent\.com$") {
    Write-Host "`n[!] ADVERTENCIA: El Client ID no tiene el formato esperado." -ForegroundColor Yellow
    Write-Host "   Deberia terminar en '.apps.googleusercontent.com'`n" -ForegroundColor Yellow
    
    $continue = Read-Host "Continuar de todas formas? (s/N)"
    
    if ($continue -ne "s" -and $continue -ne "S") {
        Write-Host "`n[X] Configuracion cancelada.`n" -ForegroundColor Red
        exit 1
    }
}

if ($clientSecret -notmatch "^GOCSPX-") {
    Write-Host "`n[!] ADVERTENCIA: El Client Secret no tiene el formato esperado." -ForegroundColor Yellow
    Write-Host "   Deberia empezar con 'GOCSPX-'`n" -ForegroundColor Yellow
    
    $continue = Read-Host "Continuar de todas formas? (s/N)"
    
    if ($continue -ne "s" -and $continue -ne "S") {
        Write-Host "`n[X] Configuracion cancelada.`n" -ForegroundColor Red
        exit 1
    }
}

# Paso 4: Actualizar archivo .env
Write-Host "`nPASO 4: Actualizando archivo .env...`n" -ForegroundColor Yellow

$backendEnvFile = ".\backend\.env"

if (-not (Test-Path $backendEnvFile)) {
    Write-Host "[X] Error: No se encontro el archivo backend\.env`n" -ForegroundColor Red
    exit 1
}

# Leer contenido actual
$envContent = Get-Content $backendEnvFile -Raw

# Crear configuracion de Google OAuth
$googleOAuthConfig = @"


# ====================================================================
# GOOGLE OAUTH 2.0 CONFIGURATION
# ====================================================================
GOOGLE_CLIENT_ID=$clientId
GOOGLE_CLIENT_SECRET=$clientSecret
GOOGLE_CALLBACK_URL=http://localhost:9998/api/auth/google/callback
FRONTEND_URL=http://localhost:5174

# Para produccion, cambiar a:
# GOOGLE_CALLBACK_URL=https://api.dobacksoft.com/api/auth/google/callback
# FRONTEND_URL=https://dobacksoft.com
"@

# Anadir nueva configuracion al final del archivo
$newEnvContent = $envContent.TrimEnd() + "`n" + $googleOAuthConfig

# Guardar
Set-Content -Path $backendEnvFile -Value $newEnvContent -NoNewline

Write-Host "[OK] Archivo .env actualizado exitosamente`n" -ForegroundColor Green

# Paso 5: Aplicar migracion de BD
Write-Host "PASO 5: Aplicando migracion de base de datos...`n" -ForegroundColor Yellow

$applyMigration = Read-Host "Aplicar migracion SQL para anadir campo googleId? (S/n)"

if ($applyMigration -ne "n" -and $applyMigration -ne "N") {
    $migrationFile = ".\database\migrations\add_google_oauth.sql"
    
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

# Paso 6: Instalar dependencias de backend
Write-Host "`nPASO 6: Instalando dependencias de backend...`n" -ForegroundColor Yellow

$installDeps = Read-Host "Instalar passport y passport-google-oauth20? (S/n)"

if ($installDeps -ne "n" -and $installDeps -ne "N") {
    Push-Location backend
    
    Write-Host "Ejecutando: npm install passport passport-google-oauth20`n" -ForegroundColor Gray
    npm install passport passport-google-oauth20
    
    Write-Host "Ejecutando: npm install --save-dev @types/passport @types/passport-google-oauth20`n" -ForegroundColor Gray
    npm install --save-dev @types/passport @types/passport-google-oauth20
    
    Pop-Location
    
    Write-Host "`n[OK] Dependencias instaladas exitosamente`n" -ForegroundColor Green
}

# Resumen final
Write-Host "`n=============================================================" -ForegroundColor Green
Write-Host "           CONFIGURACION COMPLETADA" -ForegroundColor Green
Write-Host "=============================================================`n" -ForegroundColor Green

Write-Host "Proximos pasos:`n" -ForegroundColor White

Write-Host "1. Crear archivo backend/src/config/passport.ts" -ForegroundColor Cyan
Write-Host "2. Modificar backend/src/routes/auth.ts (anadir rutas /google)" -ForegroundColor Cyan
Write-Host "3. Modificar backend/src/index.ts (inicializar Passport)" -ForegroundColor Cyan
Write-Host "4. Modificar frontend/src/pages/Login.tsx (anadir boton Google)" -ForegroundColor Cyan
Write-Host "5. Reiniciar backend con: .\iniciar.ps1`n" -ForegroundColor Cyan

Write-Host "Documentacion completa en:" -ForegroundColor White
Write-Host "   docs\DESARROLLO\google-oauth-implementacion.md`n" -ForegroundColor Gray

Write-Host "Verificar configuracion en:" -ForegroundColor White
Write-Host "   backend\.env (lineas finales)`n" -ForegroundColor Gray

Read-Host "Presiona ENTER para salir"

