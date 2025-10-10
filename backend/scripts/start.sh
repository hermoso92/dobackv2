#!/bin/bash

# Colores para los mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Función para mostrar mensajes de error y salir
error() {
    echo -e "${RED}❌ Error: $1${NC}"
    exit 1
}

# Función para mostrar mensajes de éxito
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Función para mostrar mensajes informativos
info() {
    echo -e "${CYAN}🔍 $1${NC}"
}

# Función para mostrar mensajes de proceso
process() {
    echo -e "${YELLOW}$1${NC}"
}

# Verificar requisitos
info "Verificando requisitos..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    error "Node.js no encontrado. Por favor instálalo desde https://nodejs.org/"
fi
success "Node.js $(node --version) encontrado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    error "npm no encontrado"
fi
success "npm $(npm --version) encontrado"

# Instalar dependencias
process "📦 Instalando dependencias..."
echo -e "${GRAY}Instalando dependencias de Node.js...${NC}"
npm install || error "Error instalando dependencias de Node.js"
success "Dependencias instaladas correctamente"

# Inicializar base de datos
process "🗃️ Inicializando base de datos..."

# Generar cliente de Prisma
echo -e "${GRAY}Generando cliente de Prisma...${NC}"
npm run prisma:generate || error "Error generando cliente de Prisma"

# Ejecutar migraciones
echo -e "${GRAY}Ejecutando migraciones...${NC}"
npm run prisma:migrate || error "Error ejecutando migraciones"

# Inicializar datos de prueba
echo -e "${GRAY}Inicializando datos de prueba...${NC}"
npm run db:init || error "Error inicializando datos de prueba"

success "Base de datos inicializada correctamente"

# Iniciar aplicación
process "🌐 Iniciando aplicación..."
echo -e "${GRAY}Iniciando servidor...${NC}"
npm run dev 