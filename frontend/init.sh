#!/bin/bash

echo "Inicializando el proyecto DobackSoft Frontend..."

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "Error: Node.js no está instalado. Por favor, instala Node.js desde https://nodejs.org/"
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "Error: npm no está instalado. Por favor, instala Node.js que incluye npm."
    exit 1
fi

# Instalar dependencias
echo "Instalando dependencias..."
npm install

# Verificar si la instalación fue exitosa
if [ $? -ne 0 ]; then
    echo "Error: La instalación de dependencias falló."
    exit 1
fi

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo "Creando archivo .env..."
    echo "VITE_API_URL=http://localhost:9998" > .env
fi

# Dar permisos de ejecución al script
chmod +x init.sh

# Iniciar el servidor de desarrollo
echo "Iniciando el servidor de desarrollo..."
npm run dev

exit 0 