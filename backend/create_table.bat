@echo off
echo Creando tabla RotativoMeasurement...

REM Configuración de la base de datos
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=dobacksoft
set DB_USER=postgres
set DB_PASSWORD=cosigein

REM Ejecutar SQL
psql -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -U %DB_USER% -f create_table_direct.sql

echo.
echo Verificando que la tabla se creo...
psql -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -U %DB_USER% -c "SELECT table_name FROM information_schema.tables WHERE table_name = 'RotativoMeasurement';"

echo.
echo Proceso completado.
pause 