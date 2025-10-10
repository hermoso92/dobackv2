@echo off
setlocal enabledelayedexpansion

echo ===================================
echo Ejecutando Prueba de Navegacion
echo ===================================

:: Verificar si Playwright está instalado
npx playwright --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Instalando Playwright...
    npm install -D @playwright/test
    npx playwright install chromium
)

:: Crear directorio de logs si no existe
if not exist "logs" mkdir logs

:: Ejecutar la prueba
echo Ejecutando prueba de navegacion...
npx playwright test tests/navigation.spec.ts

:: Mostrar resultado
if %ERRORLEVEL% equ 0 (
    echo.
    echo ===================================
    echo Prueba completada exitosamente
    echo ===================================
) else (
    echo.
    echo ===================================
    echo Prueba fallida
    echo Revisa los archivos en la carpeta logs
    echo ===================================
)

pause 