@echo off
echo Inicializando el proyecto DobackSoft Frontend...

:: Verificar si Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js no está instalado. Por favor, instala Node.js desde https://nodejs.org/
    exit /b 1
)

:: Verificar si npm está instalado
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: npm no está instalado. Por favor, instala Node.js que incluye npm.
    exit /b 1
)

:: Instalar dependencias
echo Instalando dependencias...
call npm install

:: Verificar si la instalación fue exitosa
if %errorlevel% neq 0 (
    echo Error: La instalación de dependencias falló.
    exit /b 1
)

:: Crear archivo .env si no existe
if not exist .env (
    echo Creando archivo .env...
    echo VITE_API_URL=http://localhost:9998 > .env
)

:: Iniciar el servidor de desarrollo
echo Iniciando el servidor de desarrollo...
call npm run dev

exit /b 0 