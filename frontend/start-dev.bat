@echo off
echo Iniciando DobackSoft V2...

:: Instalar chalk si no está instalado
call npm list chalk >nul 2>&1 || (
  echo Instalando dependencias...
  call npm install chalk --no-save
)

:: Ejecutar el script de inicio
node start-dev.js

pause 