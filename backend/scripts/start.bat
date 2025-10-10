@echo off
echo 🚀 Iniciando DobackSoft V2...

REM Intentar ejecutar con PowerShell primero
powershell -Command "& {Set-ExecutionPolicy Bypass -Scope Process -Force; .\scripts\start.ps1}" 2>nul
if %ERRORLEVEL% EQU 0 goto :eof

REM Si PowerShell no está disponible, ejecutar comandos directamente
echo PowerShell no disponible, usando comandos de batch...

REM Verificar Node.js
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js no encontrado. Por favor instálalo desde https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar npm
npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm no encontrado
    pause
    exit /b 1
)

echo ✅ Requisitos verificados

REM Instalar dependencias
echo 📦 Instalando dependencias...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error instalando dependencias
    pause
    exit /b 1
)

REM Inicializar base de datos
echo 🗃️ Inicializando base de datos...

echo Generando cliente de Prisma...
call npm run prisma:generate
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error generando cliente de Prisma
    pause
    exit /b 1
)

echo Ejecutando migraciones...
call npm run prisma:migrate
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error ejecutando migraciones
    pause
    exit /b 1
)

echo Inicializando datos de prueba...
call npm run db:init
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error inicializando datos de prueba
    pause
    exit /b 1
)

echo ✅ Base de datos inicializada correctamente

REM Iniciar aplicación
echo 🌐 Iniciando aplicación...
call npm run dev

pause 