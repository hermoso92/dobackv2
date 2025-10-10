@echo off

:: Inicializar la base de datos
echo Inicializando la base de datos...
call npm run db:init

:: Iniciar el servidor en modo desarrollo
echo Iniciando el servidor en modo desarrollo...
call npm run dev 