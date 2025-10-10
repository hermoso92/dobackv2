@echo off
echo ========================================
echo Decodificador CAN - Organizacion CMadrid
echo ========================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "data\DECODIFICADOR CAN\decodificador_can_unificado.py" (
    echo ERROR: No se encuentra el decodificador CAN
    echo Asegurate de ejecutar este script desde la carpeta backend
    pause
    exit /b 1
)

if not exist "data\datosDoback\CMadrid" (
    echo ERROR: No se encuentra la carpeta de datos CMadrid
    pause
    exit /b 1
)

echo Decodificador encontrado: data\DECODIFICADOR CAN\decodificador_can_unificado.py
echo Datos CMadrid encontrados: data\datosDoback\CMadrid
echo.

REM Cambiar al directorio del decodificador
cd "data\DECODIFICADOR CAN"

REM Ejecutar el decodificador en modo automático
echo Ejecutando decodificador...
python decodificador_can_unificado.py

echo.
echo Proceso completado.
pause 