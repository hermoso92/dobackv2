@echo off
title DobackSoft - PostgreSQL con Docker

echo.
echo ========================================================
echo   INICIANDO POSTGRESQL CON DOCKER
echo ========================================================
echo.

echo Verificando Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker no encontrado
    echo.
    echo Por favor:
    echo   1. Instala Docker Desktop desde: https://www.docker.com/products/docker-desktop
    echo   2. Ejecuta Docker Desktop
    echo   3. Vuelve a ejecutar este script
    echo.
    pause
    exit /b 1
)

echo [OK] Docker instalado
echo.

echo Verificando si Docker Desktop esta corriendo...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker Desktop no esta corriendo
    echo.
    echo Por favor:
    echo   1. Abre Docker Desktop desde el menu inicio
    echo   2. Espera a que diga "Docker Desktop is running"
    echo   3. Vuelve a ejecutar este script
    echo.
    pause
    exit /b 1
)

echo [OK] Docker Desktop corriendo
echo.

echo Buscando contenedor dobacksoft-postgres existente...
docker ps -a --filter "name=dobacksoft-postgres" --format "{{.Names}}" | findstr "dobacksoft-postgres" >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Contenedor encontrado, iniciando...
    docker start dobacksoft-postgres
    goto :verify
)

echo Creando nuevo contenedor PostgreSQL...
echo.
docker run --name dobacksoft-postgres ^
  -e POSTGRES_PASSWORD=dobacksoft123 ^
  -e POSTGRES_USER=postgres ^
  -e POSTGRES_DB=dobacksoft ^
  -p 5432:5432 ^
  -d postgres:16

if %errorlevel% neq 0 (
    echo.
    echo ERROR: No se pudo crear el contenedor
    pause
    exit /b 1
)

echo [OK] Contenedor creado
echo.

:verify
echo Esperando 5 segundos...
timeout /t 5 /nobreak >nul

echo.
echo Verificando que PostgreSQL responda...
docker exec dobacksoft-postgres pg_isready -U postgres >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] PostgreSQL respondiendo correctamente
    echo.
    echo ========================================================
    echo   POSTGRESQL INICIADO CON DOCKER
    echo ========================================================
    echo.
    echo Contenedor: dobacksoft-postgres
    echo Puerto: 5432
    echo Usuario: postgres
    echo Password: dobacksoft123
    echo Database: dobacksoft
    echo.
    echo DATABASE_URL para backend\.env:
    echo postgresql://postgres:dobacksoft123@localhost:5432/dobacksoft
    echo.
    echo SIGUIENTE PASO:
    echo   1. Copia el DATABASE_URL de arriba
    echo   2. Abre: backend\.env
    echo   3. Pega en: DATABASE_URL="..."
    echo   4. El backend se conectara automaticamente
    echo.
) else (
    echo.
    echo ADVERTENCIA: Contenedor iniciado pero aun no responde
    echo Puede necesitar unos segundos mas...
    echo.
)

echo.
echo ========================================================
echo   COMANDOS UTILES
echo ========================================================
echo.
echo Ver logs:        docker logs dobacksoft-postgres
echo Detener:         docker stop dobacksoft-postgres
echo Iniciar:         docker start dobacksoft-postgres
echo Eliminar:        docker rm -f dobacksoft-postgres
echo.
pause

