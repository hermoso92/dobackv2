# Script para organizar archivos en sus carpetas correctas
# Siguiendo la estructura modular de docs/

Write-Host "Organizando archivos..." -ForegroundColor Cyan

# Documentacion del modulo UPLOAD
$uploadDocs = @(
    "ANALISIS_REGLAS_SISTEMA_UPLOAD.md",
    "CAMBIO_UMBRAL_CORRELACION.md",
    "COMO_PROBAR_UPLOAD.md",
    "CORRECCIONES_APLICADAS_UPLOAD.md",
    "CORRECCION_CORRELACION_SESIONES.md",
    "GUIA_TESTING_CONFIGURACION.md",
    "INDICE_MAESTRO_UPLOAD.md",
    "INFORME_COMPARACION_SESIONES.md",
    "MEJORAS_UPLOAD_UI_COMPLETAS.md",
    "PLAN_PRUEBA_UPLOAD_AHORA.md",
    "PROBLEMA_DETECTADO_SESIONES.md",
    "PROTOCOLOS_SISTEMA_UPLOAD.md",
    "PRUEBA_REPORTE_DETALLADO.md",
    "REPORTE_DETALLADO_EXPLICACION.md",
    "RESUMEN_FINAL_SISTEMA_UPLOAD_V2.md",
    "RESUMEN_FINAL_UPLOAD_V2.md",
    "RESUMEN_MODULARIZACION_UPLOAD.md",
    "RESUMEN_UPLOAD_FINAL.md",
    "SISTEMA_CORRELACION_SESIONES_LISTO.md",
    "SISTEMA_UPLOAD_ROBUSTO_V2_LISTO.md",
    "SOLUCION_FINAL_UPLOAD.md",
    "SUBIDA_MASIVA_LISTA_COMPLETA.md",
    "TODO_LISTO_REPORTE_DETALLADO.md",
    "TROUBLESHOOTING_UPLOAD.md",
    "_IMPLEMENTACION_COMPLETA_UPLOAD_V2.md",
    "_LEE_ESTO_PRIMERO_UPLOAD.md",
    "_LISTO_SISTEMA_UPLOAD_COMPLETO.md",
    "_MEJORAS_PAGINA_UPLOAD_FINAL.md",
    "_NUEVO_REPORTE_SIMPLE_Y_CLARO.md",
    "_PROBLEMA_CRITICO_DETECCION.md",
    "_RESUMEN_EJECUTIVO_UPLOAD_COMPLETO.md",
    "_SISTEMA_UPLOAD_COMPLETADO.md",
    "_SISTEMA_UPLOAD_COMPLETADO_FINAL.md",
    "_SISTEMA_UPLOAD_DOCUMENTADO_COMPLETO.md",
    "_SISTEMA_UPLOAD_FINAL_COMPLETO.md",
    "_SISTEMA_UPLOAD_LISTO_USAR.md",
    "_SISTEMA_UPLOAD_MEJORADO_V3.md"
)

foreach ($file in $uploadDocs) {
    if (Test-Path $file) {
        Move-Item $file "docs\MODULOS\upload\" -Force
        Write-Host "[OK] $file -> docs\MODULOS\upload\" -ForegroundColor Green
    }
}

# Documentacion general / inicio
$inicioDocs = @(
    "EJECUTAR_ESTO_AHORA.md",
    "INSTRUCCIONES_REINICIO.md",
    "REPORTE_VERIFICACION_STABILSAFE_V3.md",
    "_ACCION_INMEDIATA_TESTING.md",
    "_CONFIGURACION_UI_IMPLEMENTADA.md",
    "_LISTO_PARA_PROBAR.md"
)

foreach ($file in $inicioDocs) {
    if (Test-Path $file) {
        Move-Item $file "docs\00-INICIO\" -Force
        Write-Host "[OK] $file -> docs\00-INICIO\" -ForegroundColor Green
    }
}

# Documentacion de correcciones y soluciones (CALIDAD)
$calidadDocs = @(
    "_CORRECCION_TIMEOUT_Y_LIMPIEZA_BD.md",
    "_RESUMEN_CORRECCIONES_FINAL.md",
    "_RESUMEN_CORRECCIONES_PRISMA.md",
    "_SOLUCION_ENGINE_NOT_CONNECTED.md",
    "_SOLUCION_ERR_EMPTY_RESPONSE.md"
)

foreach ($file in $calidadDocs) {
    if (Test-Path $file) {
        Move-Item $file "docs\CALIDAD\auditorias\" -Force
        Write-Host "[OK] $file -> docs\CALIDAD\auditorias\" -ForegroundColor Green
    }
}

# Estado actual del sistema
$estadoDocs = @(
    "_ESTADO_ACTUAL_SISTEMA_V2.md"
)

foreach ($file in $estadoDocs) {
    if (Test-Path $file) {
        Move-Item $file "docs\00-GENERAL\" -Force
        Write-Host "[OK] $file -> docs\00-GENERAL\" -ForegroundColor Green
    }
}

# Scripts JavaScript de analisis
$scriptsAnalisis = @(
    "analizar-rechazos-detallado.js",
    "analizar-sesiones-faltantes.js",
    "check-sessions.js",
    "comparacion-final.js",
    "comparar-analisis-real.js",
    "comparar-con-mismo-filtro.js",
    "comparar-sesiones-validas.js",
    "procesar-archivos-cmadrid.js"
)

foreach ($file in $scriptsAnalisis) {
    if (Test-Path $file) {
        Move-Item $file "scripts\analisis\" -Force
        Write-Host "[OK] $file -> scripts\analisis\" -ForegroundColor Green
    }
}

# Scripts de verificacion
$scriptsVerificacion = @(
    "limpiar-bd-sesiones.js",
    "listar-sesiones-esperadas.js",
    "test-event-generation.js",
    "test-events-in-db.js",
    "test-foreign-keys.js",
    "test-stability-values.js",
    "verificar-contraseñas.js",
    "verificar-sesiones-creadas.js",
    "verificar-sistema-subida.js",
    "verificar-vehiculos-bd.js"
)

foreach ($file in $scriptsVerificacion) {
    if (Test-Path $file) {
        Move-Item $file "scripts\testing\" -Force
        Write-Host "[OK] $file -> scripts\testing\" -ForegroundColor Green
    }
}

# Scripts PowerShell de utilidad
$scriptsPS = @(
    "actualizar-prisma-singleton.ps1",
    "limpiar-bd-manual.ps1",
    "limpiar-bd-rapido.ps1",
    "verificar-sesiones-generadas.ps1"
)

foreach ($file in $scriptsPS) {
    if (Test-Path $file) {
        Move-Item $file "scripts\utils\" -Force
        Write-Host "[OK] $file -> scripts\utils\" -ForegroundColor Green
    }
}

# Archivos temporales / logs
$tempFiles = @(
    "backend.txt",
    "backend2.txt",
    "backend3.txt",
    "backend4.txt",
    "CWINDOWSsystem32cmd.exe .txt",
    "sesiones-esperadas-gps-5min.json"
)

foreach ($file in $tempFiles) {
    if (Test-Path $file) {
        Move-Item $file "temp\" -Force
        Write-Host "[OK] $file -> temp\" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Reorganizacion completada" -ForegroundColor Green
