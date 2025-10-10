# Configurar la codificación
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Iniciando servidor frontend..."

# Verificar que npm está instalado
try {
    $npmVersion = npm --version
    Write-Host "Versión de npm: $npmVersion"
}
catch {
    Write-Host "Error: npm no está instalado"
    exit 1
}

# Verificar que node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error al instalar dependencias"
        exit 1
    }
}

# Iniciar el servidor de desarrollo
Write-Host "Iniciando servidor Vite..."
npm run dev 