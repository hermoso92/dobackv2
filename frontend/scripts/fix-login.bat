@echo off
chcp 65001 >nul

echo [1/6] Verificando Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado
    exit /b 1
)
echo [OK] Node.js encontrado

echo [2/6] Verificando npm...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm no esta instalado
    exit /b 1
)
echo [OK] npm encontrado

echo [3/6] Verificando backend...
curl -s http://localhost:9998/health >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Backend no esta respondiendo
    echo [INFO] Por favor, asegurate de que el backend este en ejecucion
    exit /b 1
)
echo [OK] Backend esta respondiendo

echo [4/6] Verificando dependencias...
if not exist node_modules (
    echo [INFO] Instalando dependencias...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Fallo la instalacion de dependencias
        exit /b 1
    )
)
echo [OK] Dependencias verificadas

echo [5/6] Ejecutando diagnostico...
node scripts/repair-login.js
if %errorlevel% neq 0 (
    echo [ERROR] El diagnostico fallo
    exit /b 1
)

echo [6/6] Reiniciando servidor...
taskkill /F /IM node.exe >nul 2>nul
start /B npm run dev
echo [OK] Servidor reiniciado

echo.
echo [COMPLETADO] Proceso finalizado correctamente 