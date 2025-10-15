# 📊 Script de Comparación: Carpetas CMadrid
# Compara backend\data\CMadrid vs backend\data\datosDoback\CMadrid
# Fecha: 12/10/2025

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  COMPARACIÓN CARPETAS CMadrid" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Rutas
$carpeta1 = "backend\data\CMadrid"
$carpeta2 = "backend\data\datosDoback\CMadrid"

# Verificar que existan
if (-not (Test-Path $carpeta1)) {
    Write-Host "❌ No existe: $carpeta1" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $carpeta2)) {
    Write-Host "❌ No existe: $carpeta2" -ForegroundColor Red
    exit 1
}

Write-Host "📂 Carpeta 1: $carpeta1" -ForegroundColor Yellow
Write-Host "📂 Carpeta 2: $carpeta2" -ForegroundColor Yellow
Write-Host ""

# Contar archivos
$archivos1 = Get-ChildItem -Path $carpeta1 -Recurse -File
$archivos2 = Get-ChildItem -Path $carpeta2 -Recurse -File

Write-Host "📊 ESTADÍSTICAS GENERALES" -ForegroundColor Cyan
Write-Host "-----------------------------------"
Write-Host "Total archivos carpeta 1: $($archivos1.Count)" -ForegroundColor White
Write-Host "Total archivos carpeta 2: $($archivos2.Count)" -ForegroundColor Green
Write-Host "Diferencia: $($archivos2.Count - $archivos1.Count) archivos" -ForegroundColor Yellow
Write-Host ""

# Listar vehículos
$vehiculos1 = Get-ChildItem -Path $carpeta1 -Directory | Select-Object -ExpandProperty Name | Sort-Object
$vehiculos2 = Get-ChildItem -Path $carpeta2 -Directory | Select-Object -ExpandProperty Name | Sort-Object

Write-Host "🚒 VEHÍCULOS POR CARPETA" -ForegroundColor Cyan
Write-Host "-----------------------------------"
Write-Host "Carpeta 1 ($($vehiculos1.Count) vehículos):" -ForegroundColor White
$vehiculos1 | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
Write-Host ""
Write-Host "Carpeta 2 ($($vehiculos2.Count) vehículos):" -ForegroundColor Green
$vehiculos2 | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
Write-Host ""

# Vehículos únicos
$unicos2 = $vehiculos2 | Where-Object { $_ -notin $vehiculos1 }

if ($unicos2) {
    Write-Host "✅ Vehículos ADICIONALES en carpeta 2:" -ForegroundColor Green
    $unicos2 | ForEach-Object { 
        Write-Host "  - $_" -ForegroundColor Green
        $archivosVehiculo = Get-ChildItem -Path "$carpeta2\$_" -Recurse -File
        Write-Host "    ($($archivosVehiculo.Count) archivos)" -ForegroundColor Gray
    }
}
else {
    Write-Host "⚠️  No hay vehículos adicionales" -ForegroundColor Yellow
}
Write-Host ""

# Detalle por vehículo
Write-Host "📋 DETALLE POR VEHÍCULO" -ForegroundColor Cyan
Write-Host "-----------------------------------"

foreach ($vehiculo in $vehiculos2) {
    $existe1 = Test-Path "$carpeta1\$vehiculo"
    
    if ($existe1) {
        $count1 = (Get-ChildItem -Path "$carpeta1\$vehiculo" -Recurse -File).Count
        $count2 = (Get-ChildItem -Path "$carpeta2\$vehiculo" -Recurse -File).Count
        
        if ($count1 -eq $count2) {
            Write-Host "✅ $vehiculo : $count2 archivos (idéntico)" -ForegroundColor Green
        }
        else {
            Write-Host "⚠️  $vehiculo : carpeta1=$count1, carpeta2=$count2 (diferente)" -ForegroundColor Yellow
        }
    }
    else {
        $count2 = (Get-ChildItem -Path "$carpeta2\$vehiculo" -Recurse -File).Count
        Write-Host "🆕 $vehiculo : $count2 archivos (SOLO en carpeta2)" -ForegroundColor Cyan
        
        # Listar archivos
        Get-ChildItem -Path "$carpeta2\$vehiculo" -Recurse -File | ForEach-Object {
            Write-Host "     - $($_.Name)" -ForegroundColor Gray
        }
    }
}
Write-Host ""

# Verificar IDs incorrectos
Write-Host "🔍 VERIFICACIÓN DE IDs" -ForegroundColor Cyan
Write-Host "-----------------------------------"

$erroresID = @()

foreach ($vehiculo in $vehiculos2) {
    $archivosEstabilidad = Get-ChildItem -Path "$carpeta2\$vehiculo\estabilidad" -Filter "*.txt" -ErrorAction SilentlyContinue
    
    foreach ($archivo in $archivosEstabilidad) {
        $primeraLinea = Get-Content $archivo.FullName -TotalCount 1
        
        if ($primeraLinea -match "ESTABILIDAD;.*?;(DOBACK\d+);") {
            $idArchivo = $matches[1]
            $idEsperado = $vehiculo.ToUpper()
            
            if ($idArchivo -ne $idEsperado) {
                $erroresID += [PSCustomObject]@{
                    Vehiculo     = $vehiculo
                    Archivo      = $archivo.Name
                    IDEncontrado = $idArchivo
                    IDEsperado   = $idEsperado
                }
            }
        }
    }
}

if ($erroresID.Count -gt 0) {
    Write-Host "❌ ERRORES DE ID ENCONTRADOS:" -ForegroundColor Red
    $erroresID | ForEach-Object {
        Write-Host "  Archivo: $($_.Archivo)" -ForegroundColor Yellow
        Write-Host "    Vehículo: $($_.Vehiculo)" -ForegroundColor Gray
        Write-Host "    ID encontrado: $($_.IDEncontrado) ❌" -ForegroundColor Red
        Write-Host "    ID esperado: $($_.IDEsperado) ✅" -ForegroundColor Green
        Write-Host ""
    }
}
else {
    Write-Host "✅ No se encontraron errores de ID" -ForegroundColor Green
}
Write-Host ""

# Conclusión
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONCLUSIÓN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($archivos2.Count -gt $archivos1.Count) {
    Write-Host "✅ CARPETA RECOMENDADA: $carpeta2" -ForegroundColor Green
    Write-Host "   Razón: Más completa (+$($archivos2.Count - $archivos1.Count) archivos)" -ForegroundColor Green
}
elseif ($archivos2.Count -eq $archivos1.Count) {
    Write-Host "⚠️  CARPETAS IDÉNTICAS" -ForegroundColor Yellow
    Write-Host "   Usar cualquiera" -ForegroundColor Yellow
}
else {
    Write-Host "⚠️  CARPETA 1 TIENE MÁS ARCHIVOS" -ForegroundColor Yellow
    Write-Host "   Verificar manualmente" -ForegroundColor Yellow
}
Write-Host ""

# Guardar resultado
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$reportFile = "temp\comparacion_carpetas_$timestamp.txt"

@"
COMPARACIÓN CARPETAS CMadrid
Fecha: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")

Carpeta 1: $carpeta1
  - Vehículos: $($vehiculos1.Count)
  - Archivos: $($archivos1.Count)

Carpeta 2: $carpeta2
  - Vehículos: $($vehiculos2.Count)
  - Archivos: $($archivos2.Count)

Diferencia: $($archivos2.Count - $archivos1.Count) archivos

Vehículos únicos en carpeta 2:
$($unicos2 | ForEach-Object { "  - $_" } | Out-String)

Errores de ID: $($erroresID.Count)
$($erroresID | ForEach-Object { "  - $($_.Archivo): $($_.IDEncontrado) → $($_.IDEsperado)" } | Out-String)

CONCLUSIÓN: Usar $carpeta2
"@ | Out-File $reportFile -Encoding UTF8

Write-Host "💾 Reporte guardado en: $reportFile" -ForegroundColor Green
Write-Host ""

