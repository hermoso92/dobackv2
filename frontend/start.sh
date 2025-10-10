#!/bin/bash

# Colores para los mensajes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Obtener el directorio del script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${BLUE}Iniciando DobackSoft...${NC}"

# Función para verificar si un puerto está en uso
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Detener procesos en puertos si están en uso
if check_port 9998; then
    echo "Deteniendo proceso en puerto 9998..."
    kill $(lsof -t -i:9998) 2>/dev/null || true
fi

if check_port 5174; then
    echo "Deteniendo proceso en puerto 5174..."
    kill $(lsof -t -i:5174) 2>/dev/null || true
fi

# Iniciar el backend en una nueva terminal
echo -e "${GREEN}Iniciando Backend...${NC}"
gnome-terminal -- bash -c "cd '$SCRIPT_DIR/backend'; npx ts-node-dev --respawn --transpile-only src/index.ts --env-file .env; bash" &

# Esperar a que el backend esté listo
echo "Esperando a que el backend esté listo..."
sleep 5

# Iniciar el frontend en otra nueva terminal
echo -e "${GREEN}Iniciando Frontend...${NC}"
gnome-terminal -- bash -c "cd '$SCRIPT_DIR/frontend'; npx vite; bash" &

echo -e "${BLUE}Backend y Frontend iniciados en terminales separadas${NC}" 