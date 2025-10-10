#!/bin/bash

echo "==================================="
echo "Ejecutando Prueba de Navegación"
echo "==================================="

# Verificar si Playwright está instalado
if ! npx playwright --version > /dev/null 2>&1; then
    echo "Instalando Playwright..."
    npm install -D @playwright/test
    npx playwright install chromium
fi

# Crear directorio de logs si no existe
mkdir -p logs

# Ejecutar la prueba
echo "Ejecutando prueba de navegación..."
npx playwright test tests/navigation.spec.ts

# Mostrar resultado
if [ $? -eq 0 ]; then
    echo ""
    echo "==================================="
    echo "Prueba completada exitosamente"
    echo "==================================="
else
    echo ""
    echo "==================================="
    echo "Prueba fallida"
    echo "Revisa los archivos en la carpeta logs"
    echo "==================================="
fi

read -p "Presiona Enter para continuar..." 