#!/bin/bash

# Configurar el directorio de trabajo
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Función para manejar errores
handle_error() {
    echo -e "\e[31mError: $1\e[0m"
    exit 1
}

# Función para verificar si un comando existe
check_command() {
    if ! command -v $1 &> /dev/null; then
        handle_error "El comando '$1' no está instalado"
    fi
}

# Establecer variables de entorno
export NODE_ENV='production'
export HOST='31.97.54.148'

echo -e "\e[32mIniciando script de automatización de DobackSoft...\e[0m"
echo -e "\e[36mDirectorio de trabajo: $SCRIPT_DIR\e[0m"
echo -e "\e[36mIP Pública: $HOST\e[0m"

# Verificar que existe el archivo .env
if [ ! -f "backend/.env" ]; then
    handle_error "No se encontró el archivo .env en el directorio backend"
fi

# Verificar comandos necesarios
check_command "npm"
check_command "node"

# Instalar dependencias globales si es necesario
if ! command -v typescript &> /dev/null || ! command -v husky &> /dev/null; then
    echo -e "\e[33mInstalando dependencias globales...\e[0m"
    # Instalar sin sudo, usando el directorio de usuario
    if ! npm install -g typescript husky --prefix ~/.npm-global; then
        handle_error "Error al instalar dependencias globales"
    fi
    # Agregar al PATH si no está ya
    if [[ ":$PATH:" != *":$HOME/.npm-global/bin:"* ]]; then
        echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
        export PATH=~/.npm-global/bin:$PATH
    fi
fi

# Función para verificar si un proceso está en ejecución
is_process_running() {
    local pid=$1
    if ps -p $pid > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Función para detener un proceso de manera segura
stop_process() {
    local pid=$1
    local name=$2
    
    if is_process_running $pid; then
        echo -e "\e[33mDeteniendo proceso $name (PID: $pid)...\e[0m"
        kill -15 $pid 2>/dev/null || true
        sleep 2
        
        if is_process_running $pid; then
            echo -e "\e[33mForzando terminación del proceso $name (PID: $pid)...\e[0m"
            kill -9 $pid 2>/dev/null || true
            sleep 1
        fi
    fi
}

# Función para forzar el cierre de conexiones TCP
force_close_tcp_connections() {
    local port=$1
    echo -e "\e[33mVerificando conexiones TCP en el puerto ${port}...\e[0m"
    
    # Obtener todas las conexiones TCP
    local connections=$(netstat -tulpn 2>/dev/null | grep ":$port" || true)
    if [ ! -z "$connections" ]; then
        echo -e "\e[33mEncontradas conexiones en el puerto ${port}:\e[0m"
        echo "$connections"
    fi

    # Obtener y detener procesos de manera segura
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    for pid in $pids; do
        if [ ! -z "$pid" ]; then
            stop_process $pid "en puerto $port"
        fi
    done

    # Esperar a que se apliquen los cambios
    sleep 2

    # Verificar que el puerto esté libre
    if lsof -ti:$port >/dev/null 2>&1; then
        echo -e "\e[31mAdvertencia: Todavía hay conexiones en el puerto ${port}\e[0m"
        return 1
    fi
    return 0
}

# Función para detener procesos Node.js
stop_node_processes() {
    echo -e "\e[33mDeteniendo procesos Node.js existentes...\e[0m"
    
    # Obtener PIDs de procesos Node.js del usuario actual
    local node_pids=$(pgrep -f -u $USER node || true)
    
    for pid in $node_pids; do
        stop_process $pid "Node.js"
    done
    
    # Detener procesos que usan los puertos específicos
    local ports=(9998 5174)
    for port in "${ports[@]}"; do
        echo -e "\e[33mBuscando procesos que usan el puerto ${port}...\e[0m"
        force_close_tcp_connections $port
    done

    # Esperar un momento para asegurar que los procesos se han detenido
    sleep 2
}

# Función para verificar si un puerto está en uso
test_port_in_use() {
    local port=$1
    lsof -ti:$port >/dev/null 2>&1
    return $?
}

# Función para esperar a que un puerto esté disponible
wait_for_port() {
    local port=$1
    local timeout=${2:-30}
    local start_time=$(date +%s)
    local attempts=0
    
    while [ $(($(date +%s) - start_time)) -lt $timeout ]; do
        if ! test_port_in_use $port; then
            return 0
        fi
        attempts=$((attempts + 1))
        echo -e "\e[33mEsperando a que el puerto $port esté disponible... (Intento $attempts)\e[0m"
        if [ $((attempts % 3)) -eq 0 ]; then
            echo -e "\e[33mReintentando liberar el puerto $port...\e[0m"
            force_close_tcp_connections $port
        fi
        sleep 1
    done
    return 1
}

# Detener todos los procesos existentes
stop_node_processes

# Liberar puertos con múltiples intentos
max_attempts=3
attempt=0
while [ $attempt -lt $max_attempts ]; do
    attempt=$((attempt + 1))
    echo -e "\n\e[33mIntento $attempt de liberar puertos...\e[0m"
    
    # Liberar puertos
    if force_close_tcp_connections 9998 && force_close_tcp_connections 5174; then
        echo -e "\e[32mPuertos liberados exitosamente\e[0m"
        break
    else
        echo -e "\e[33mNo se pudieron liberar los puertos en el intento $attempt\e[0m"
        if [ $attempt -lt $max_attempts ]; then
            echo -e "\e[33mReintentando en 5 segundos...\e[0m"
            sleep 5
        fi
    fi
done

# Verificar si los puertos están libres
if test_port_in_use 9998 || test_port_in_use 5174; then
    handle_error "No se pudieron liberar los puertos después de $max_attempts intentos"
fi

# Preparar comandos
BACKEND_CMD="cd $SCRIPT_DIR/backend && npm install --no-save && npm run build && NODE_ENV=production npm run start"
FRONTEND_CMD="cd $SCRIPT_DIR/frontend && npm install --no-save && npm run build && NODE_ENV=production npm run preview -- --host $HOST --port 5174"

# Verificar terminal disponible
if command -v gnome-terminal &> /dev/null; then
    TERMINAL="gnome-terminal"
elif command -v xterm &> /dev/null; then
    TERMINAL="xterm"
elif command -v konsole &> /dev/null; then
    TERMINAL="konsole"
else
    handle_error "No se encontró un terminal compatible. Por favor, instale gnome-terminal, xterm o konsole."
fi

# Abrir terminales
case $TERMINAL in
    "gnome-terminal")
        gnome-terminal -- bash -c "$BACKEND_CMD; exec bash" &
        gnome-terminal -- bash -c "$FRONTEND_CMD; exec bash" &
        ;;
    "xterm")
        xterm -e "bash -c '$BACKEND_CMD; exec bash'" &
        xterm -e "bash -c '$FRONTEND_CMD; exec bash'" &
        ;;
    "konsole")
        konsole -e "bash -c '$BACKEND_CMD; exec bash'" &
        konsole -e "bash -c '$FRONTEND_CMD; exec bash'" &
        ;;
esac

echo -e "\e[32mServicios iniciados en terminales separadas\e[0m"
echo -e "\e[36mBackend URL: http://$HOST:9998\e[0m"
echo -e "\e[36mFrontend URL: http://$HOST:5174\e[0m" 