# 🔐 Script de Configuración - Google OAuth 2.0
# Ayuda al usuario a configurar Google OAuth paso a paso

$ErrorActionPreference = "Stop"

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║         🔐 CONFIGURACIÓN GOOGLE OAUTH 2.0 - DOBACKSOFT         ║" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Este script te ayudará a configurar Google OAuth 2.0 paso a paso.`n" -ForegroundColor White

# Paso 1: Verificar si ya existe configuración
Write-Host "📋 PASO 1: Verificando configuración existente...`n" -ForegroundColor Yellow

$envFile = ".\backend\.env"

if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    
    if ($envContent -match "GOOGLE_CLIENT_ID=(.+)") {
        $existingClientId = $Matches[1].Trim()
        
        if ($existingClientId -and $existingClientId -ne "" -and $existingClientId -ne "tu-client-id") {
            Write-Host "✅ Configuración existente encontrada:" -ForegroundColor Green
            Write-Host "   GOOGLE_CLIENT_ID: $existingClientId`n" -ForegroundColor Gray
            
            $overwrite = Read-Host "¿Deseas sobrescribir la configuración existente? (s/N)"
            
            if ($overwrite -ne "s" -and $overwrite -ne "S") {
                Write-Host "`n✅ Configuración mantenida. Saliendo...`n" -ForegroundColor Green
                exit 0
            }
        }
    }
}

# Paso 2: Instrucciones para Google Cloud Console
Write-Host "`n📋 PASO 2: Configurar Google Cloud Console`n" -ForegroundColor Yellow

Write-Host "Abre tu navegador y sigue estos pasos:`n" -ForegroundColor White

Write-Host "1️⃣  Ve a: https://console.cloud.google.com/" -ForegroundColor Cyan
Write-Host "2️⃣  Crea un nuevo proyecto llamado 'DobackSoft OAuth'" -ForegroundColor Cyan
Write-Host "3️⃣  Habilita la API de Google+ (APIs & Services > Library)" -ForegroundColor Cyan
Write-Host "4️⃣  Configura OAuth Consent Screen:" -ForegroundColor Cyan
Write-Host "     - Tipo: External" -ForegroundColor Gray
Write-Host "     - App name: DobackSoft" -ForegroundColor Gray
Write-Host "     - Scopes: email, profile" -ForegroundColor Gray
Write-Host "5️⃣  Crea credenciales OAuth 2.0 Client ID:" -ForegroundColor Cyan
Write-Host "     - Tipo: Web application" -ForegroundColor Gray
Write-Host "     - Authorized JavaScript origins:" -ForegroundColor Gray
Write-Host "       * http://localhost:5174" -ForegroundColor DarkGray
Write-Host "     - Authorized redirect URIs:" -ForegroundColor Gray
Write-Host "       * http://localhost:9998/api/auth/google/callback`n" -ForegroundColor DarkGray

$openBrowser = Read-Host "¿Abrir Google Cloud Console ahora? (S/n)"

if ($openBrowser -ne "n" -and $openBrowser -ne "N") {
    Start-Process "https://console.cloud.google.com/"
    Write-Host "`n✅ Navegador abierto. Completa los pasos y vuelve aquí.`n" -ForegroundColor Green
}

Read-Host "Presiona ENTER cuando hayas completado la configuración en Google Cloud Console"

# Paso 3: Capturar credenciales
Write-Host "`n📋 PASO 3: Ingresando credenciales`n" -ForegroundColor Yellow

Write-Host "Copia las credenciales de Google Cloud Console:`n" -ForegroundColor White

$clientId = Read-Host "Ingresa tu GOOGLE_CLIENT_ID (termina en .apps.googleusercontent.com)"
$clientSecret = Read-Host "Ingresa tu GOOGLE_CLIENT_SECRET (empieza con GOCSPX-)"

# Validar formato básico
if ($clientId -notmatch "\.apps\.googleusercontent\.com$") {
    Write-Host "`n⚠️  ADVERTENCIA: El Client ID no tiene el formato esperado." -ForegroundColor Yellow
    Write-Host "   Debería terminar en '.apps.googleusercontent.com'`n" -ForegroundColor Yellow
    
    $continue = Read-Host "¿Continuar de todas formas? (s/N)"
    
    if ($continue -ne "s" -and $continue -ne "S") {
        Write-Host "`n❌ Configuración cancelada.`n" -ForegroundColor Red
        exit 1
    }
}

if ($clientSecret -notmatch "^GOCSPX-") {
    Write-Host "`n⚠️  ADVERTENCIA: El Client Secret no tiene el formato esperado." -ForegroundColor Yellow
    Write-Host "   Debería empezar con 'GOCSPX-'`n" -ForegroundColor Yellow
    
    $continue = Read-Host "¿Continuar de todas formas? (s/N)"
    
    if ($continue -ne "s" -and $continue -ne "S") {
        Write-Host "`n❌ Configuración cancelada.`n" -ForegroundColor Red
        exit 1
    }
}

# Paso 4: Actualizar archivo .env
Write-Host "`n📋 PASO 4: Actualizando archivo .env...`n" -ForegroundColor Yellow

$backendEnvFile = ".\backend\.env"

if (-not (Test-Path $backendEnvFile)) {
    Write-Host "❌ Error: No se encontró el archivo backend\.env`n" -ForegroundColor Red
    exit 1
}

# Leer contenido actual
$envContent = Get-Content $backendEnvFile -Raw

# Añadir o actualizar variables de Google OAuth
$googleOAuthConfig = @"


# ═══════════════════════════════════════════════════════════════
# 🔐 GOOGLE OAUTH 2.0 CONFIGURATION
# ═══════════════════════════════════════════════════════════════
GOOGLE_CLIENT_ID=$clientId
GOOGLE_CLIENT_SECRET=$clientSecret
GOOGLE_CALLBACK_URL=http://localhost:9998/api/auth/google/callback
FRONTEND_URL=http://localhost:5174

# Para producción, cambiar a:
# GOOGLE_CALLBACK_URL=https://api.dobacksoft.com/api/auth/google/callback
# FRONTEND_URL=https://dobacksoft.com
"@

# Remover configuración antigua si existe
$envContent = $envContent -replace "(?ms)# ═+\s*# 🔐 GOOGLE OAUTH.*?# ═+\s*GOOGLE_CLIENT_ID=.*?FRONTEND_URL=.*?(\r?\n)", ""

# Añadir nueva configuración
$envContent = $envContent.TrimEnd() + "`n" + $googleOAuthConfig

# Guardar
Set-Content -Path $backendEnvFile -Value $envContent -NoNewline

Write-Host "✅ Archivo .env actualizado exitosamente`n" -ForegroundColor Green

# Paso 5: Aplicar migración de BD
Write-Host "📋 PASO 5: Aplicando migración de base de datos...`n" -ForegroundColor Yellow

$applyMigration = Read-Host "¿Aplicar migración SQL para añadir campo googleId? (S/n)"

if ($applyMigration -ne "n" -and $applyMigration -ne "N") {
    $migrationFile = ".\database\migrations\add_google_oauth.sql"
    
    if (Test-Path $migrationFile) {
        Write-Host "Ejecutando: psql -U postgres -d dobacksoft -f $migrationFile`n" -ForegroundColor Gray
        
        $output = psql -U postgres -d dobacksoft -f $migrationFile 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Migración aplicada exitosamente`n" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Error aplicando migración:" -ForegroundColor Yellow
            Write-Host $output -ForegroundColor Red
            Write-Host "`nPuedes aplicarla manualmente con:" -ForegroundColor Yellow
            Write-Host "psql -U postgres -d dobacksoft -f $migrationFile`n" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠️  Archivo de migración no encontrado: $migrationFile`n" -ForegroundColor Yellow
    }
}

# Paso 6: Instalar dependencias de backend
Write-Host "`n📋 PASO 6: Instalando dependencias de backend...`n" -ForegroundColor Yellow

$installDeps = Read-Host "¿Instalar passport y passport-google-oauth20? (S/n)"

if ($installDeps -ne "n" -and $installDeps -ne "N") {
    Set-Location backend
    
    Write-Host "Ejecutando: npm install passport passport-google-oauth20`n" -ForegroundColor Gray
    npm install passport passport-google-oauth20
    
    Write-Host "Ejecutando: npm install --save-dev @types/passport @types/passport-google-oauth20`n" -ForegroundColor Gray
    npm install --save-dev @types/passport @types/passport-google-oauth20
    
    Set-Location ..
    
    Write-Host "`n✅ Dependencias instaladas exitosamente`n" -ForegroundColor Green
}

# Resumen final
Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║               ✅ CONFIGURACIÓN COMPLETADA                       ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📋 Próximos pasos:`n" -ForegroundColor White

Write-Host "1️⃣  Crear archivo backend/src/config/passport.ts" -ForegroundColor Cyan
Write-Host "2️⃣  Modificar backend/src/routes/auth.ts (añadir rutas /google)" -ForegroundColor Cyan
Write-Host "3️⃣  Modificar backend/src/index.ts (inicializar Passport)" -ForegroundColor Cyan
Write-Host "4️⃣  Modificar frontend/src/pages/Login.tsx (añadir botón Google)" -ForegroundColor Cyan
Write-Host "5️⃣  Reiniciar backend con: .\iniciar.ps1`n" -ForegroundColor Cyan

Write-Host "📚 Documentación completa en:" -ForegroundColor White
Write-Host "   docs\DESARROLLO\google-oauth-implementacion.md`n" -ForegroundColor Gray

Write-Host "🔍 Verificar configuración en:" -ForegroundColor White
Write-Host "   backend\.env (líneas finales)`n" -ForegroundColor Gray

Read-Host "Presiona ENTER para salir"

