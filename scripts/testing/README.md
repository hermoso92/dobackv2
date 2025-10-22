# Sistema de Auditoría Automatizada - Dashboard StabilSafe V3

Sistema completo de auditoría y validación del Dashboard StabilSafe V3, incluyendo pruebas de backend, frontend, UI/UX y cumplimiento de reglas de StabilSafe V2.

## 📋 Archivos del Sistema

### Scripts Principales

- **`audit-dashboard.ps1`** - Script principal de auditoría automatizada
- **`test-helpers.ps1`** - Funciones auxiliares reutilizables
- **`audit-ui-playwright.js`** - Automatización UI con Playwright
- **`dashboard-ui-checklist.md`** - Checklist de validación manual

### Configuración

- **`audit-config.sample.json`** - Configuración de ejemplo (copiar a `audit-config.json` y personalizar)

### Directorios

- **`results/`** - Reportes generados (Markdown, JSON, screenshots)
- **`../../logs/testing/`** - Logs detallados de ejecución
- **`../../backend/uploads/sessions/test_base/`** - Dataset de prueba controlado

## 🚀 Inicio Rápido

### Prerrequisitos

1. **Backend y Frontend corriendo:**
   ```powershell
   .\iniciar.ps1
   ```

2. **Node.js instalado** (para Playwright)

3. **Playwright instalado:**
   ```bash
   npm install playwright
   ```

### Ejecución Básica

```powershell
# Auditoría automatizada completa (solo backend + endpoints)
.\scripts\testing\audit-dashboard.ps1

# Auditoría con configuración personalizada
.\scripts\testing\audit-dashboard.ps1 -ConfigFile ".\audit-config.json"

# Auditoría en modo headless (sin navegador)
.\scripts\testing\audit-dashboard.ps1 -Headless

# Auditoría con log detallado
.\scripts\testing\audit-dashboard.ps1 -LogLevel DEBUG

# Auditoría UI automatizada con Playwright
node scripts\testing\audit-ui-playwright.js

# Auditoría UI con Playwright en modo headless
node scripts\testing\audit-ui-playwright.js --headless
```

### Ejecución Completa (Backend + UI)

```powershell
# 1. Auditoría automatizada de backend
.\scripts\testing\audit-dashboard.ps1

# 2. Auditoría automatizada de UI
node scripts\testing\audit-ui-playwright.js

# 3. Revisar checklist manual (opcional, para validación adicional)
# Consultar: scripts/testing/dashboard-ui-checklist.md
```

## 🎯 Qué Prueba el Sistema

### 1. Servicios (FASE 1)
- ✅ Backend disponible en puerto 9998
- ✅ Frontend disponible en puerto 5174
- ✅ Health endpoints respondiendo

### 2. Autenticación (FASE 2)
- ✅ Login como ADMIN
- ✅ Login como MANAGER
- ✅ Validación de tokens JWT
- ✅ Verificación de organizationId

### 3. Endpoints Backend (FASE 3)
- ✅ `/api/summary` - KPIs principales
- ✅ `/api/devices/status` - Estado de dispositivos
- ✅ `/api/sessions` - Listado de sesiones
- ✅ `/api/events` - Eventos de estabilidad
- ✅ Validación de tiempos de respuesta
- ✅ Validación de estructura JSON

### 4. Subida de Sesiones (FASE 4)
- ⚠️ Opcional - Subida de archivo de prueba
- ⚠️ Validación de sessionId generado
- ⚠️ Verificación de eventos generados

### 5. Rendimiento (FASE 5)
- ✅ Tiempo `/api/summary` < 3 segundos
- ✅ Tiempo otros endpoints < 1 segundo
- ✅ Métricas agregadas y promedios

### 6. Validación UI (FASE 6)

#### Con Playwright (Automatizado):
- ✅ Login funcional
- ✅ Dashboard carga correctamente
- ✅ **Regla StabilSafe V2: Sin scroll en contenedor principal**
- ✅ Todas las pestañas cargan sin errores
- ✅ Filtros globales disponibles
- ✅ Botones de exportación PDF presentes
- ✅ Capturas de pantalla de cada pestaña
- ✅ Detección de errores de consola

#### Con Checklist Manual (Complementario):
- ⚠️ Interacciones de filtros (cambio de vehículo, fechas, rotativo)
- ⚠️ Exportaciones PDF completas
- ⚠️ Validación de contenido en PDFs
- ⚠️ Responsividad en diferentes resoluciones

## 📊 Reportes Generados

### Estructura de Salida

```
scripts/testing/results/[timestamp]/
├── audit-report.md          # Reporte legible en Markdown
├── audit-data.json          # Datos estructurados en JSON
├── audit-debug.log          # Log detallado de ejecución
└── screenshots/             # Capturas de pantalla
    ├── login-form.png
    ├── dashboard-initial.png
    ├── tab-estados_&_tiempos.png
    ├── tab-puntos_negros.png
    ├── tab-velocidad.png
    ├── tab-sesiones.png
    └── tab-reportes.png
```

### Formato JSON de Resultados

```json
{
  "timestamp": "2025-10-21T22:00:00Z",
  "services": {
    "Backend": {
      "status": "running",
      "port": 9998,
      "health": "ok",
      "available": true
    },
    "Frontend": {
      "status": "running",
      "port": 5174,
      "available": true
    }
  },
  "endpoints": [
    {
      "url": "/api/summary",
      "method": "GET",
      "statusCode": 200,
      "durationMs": 1850,
      "pass": true
    }
  ],
  "uiChecks": {
    "no_scroll_main_container": true,
    "tabs_load_successfully": true,
    "filters_responsive": true,
    "pdf_exports_work": true
  },
  "performance": {
    "avg_summary_time_ms": 1850,
    "avg_other_endpoints_ms": 450
  },
  "summary": {
    "totalTests": 35,
    "passed": 33,
    "failed": 2,
    "warnings": 0
  }
}
```

## ⚙️ Configuración Personalizada

### Crear Archivo de Configuración

```powershell
# Copiar ejemplo y editar
cp scripts\testing\audit-config.sample.json scripts\testing\audit-config.json
```

### Editar Configuración

```json
{
  "backend_url": "http://localhost:9998",
  "frontend_url": "http://localhost:5174",
  "auth": {
    "endpoint": "/api/auth/login",
    "admin": {
      "email": "tu-admin@example.com",
      "password": "tu-password"
    },
    "manager": {
      "email": "tu-manager@example.com",
      "password": "tu-password"
    }
  },
  "dataset_path": "./backend/uploads/sessions/test_base",
  "endpoints": {
    "health": "/health",
    "summary": "/api/summary",
    "devices": "/api/devices/status",
    "events": "/api/events",
    "sessions": "/api/sessions",
    "upload": "/api/upload-single"
  },
  "performance_thresholds": {
    "summary_ms": 3000,
    "other_ms": 1000
  },
  "test_filters": {
    "date_from": "2025-09-29",
    "date_to": "2025-10-08"
  },
  "output": {
    "base_dir": "./scripts/testing/results",
    "include_screenshots": true,
    "log_level": "INFO"
  }
}
```

## 🔧 Parámetros CLI

### audit-dashboard.ps1

```powershell
# Parámetros disponibles:
-ConfigFile        # Ruta al archivo de configuración
-BaseUrlBackend    # URL del backend (sobreescribe config)
-BaseUrlFrontend   # URL del frontend (sobreescribe config)
-AdminEmail        # Email del admin (sobreescribe config)
-AdminPassword     # Password del admin (sobreescribe config)
-ManagerEmail      # Email del manager (sobreescribe config)
-ManagerPassword   # Password del manager (sobreescribe config)
-DatasetPath       # Ruta a archivos de prueba (sobreescribe config)
-OutDir            # Directorio de salida (sobreescribe config)
-Headless          # Ejecutar sin navegador
-LogLevel          # DEBUG | INFO | WARNING | ERROR
```

### Ejemplos de Uso

```powershell
# Producción
.\scripts\testing\audit-dashboard.ps1 `
  -BaseUrlBackend "https://api.stabilsafe.com" `
  -BaseUrlFrontend "https://dashboard.stabilsafe.com" `
  -AdminEmail "admin@example.com" `
  -AdminPassword "secure-password" `
  -Headless `
  -LogLevel INFO

# Desarrollo con logs detallados
.\scripts\testing\audit-dashboard.ps1 -LogLevel DEBUG

# CI/CD
.\scripts\testing\audit-dashboard.ps1 -Headless -OutDir "./ci-results"
```

## 🎨 Integración CI/CD

### GitHub Actions

```yaml
name: StabilSafe Audit

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  audit:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install playwright
      
      - name: Start services
        run: |
          docker-compose up -d
          sleep 30
      
      - name: Run audit
        run: |
          pwsh scripts/testing/audit-dashboard.ps1 -Headless
          node scripts/testing/audit-ui-playwright.js --headless
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: audit-results
          path: scripts/testing/results/
```

## 📚 Documentación Adicional

- **Checklist Manual UI:** `dashboard-ui-checklist.md`
- **Dataset de Prueba:** `../../backend/uploads/sessions/test_base/README.md`
- **Guía de Pruebas de Aceptación:** `../../docs/00-GENERAL/GUIA_PRUEBAS_ACEPTACION.md`
- **Reglas StabilSafe V2:** `../../docs/HISTORICO/versiones-anteriores/RESUMEN_IMPLEMENTACION_V2.md`

## 🐛 Troubleshooting

### Backend no disponible

```powershell
# Verificar que el backend esté corriendo
Get-NetTCPConnection -LocalPort 9998

# Reiniciar servicios
.\iniciar.ps1
```

### Frontend no disponible

```powershell
# Verificar que el frontend esté corriendo
Get-NetTCPConnection -LocalPort 5174

# Reiniciar servicios
.\iniciar.ps1
```

### Error de autenticación

```
# Verificar credenciales en audit-config.json
# Asegurarse de que el usuario existe en la base de datos
# Verificar que la contraseña es correcta
```

### Playwright no instalado

```bash
npm install playwright
npx playwright install chromium
```

### Permisos de ejecución PowerShell

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📞 Soporte

Para issues o mejoras:
1. Revisar logs en `logs/testing/audit-[timestamp].log`
2. Consultar documentación en `docs/`
3. Contactar al equipo QA DobackSoft

---

**Versión:** 1.0.0  
**Última actualización:** 2025-10-21  
**Mantenedor:** Equipo QA DobackSoft



Sistema completo de auditoría y validación del Dashboard StabilSafe V3, incluyendo pruebas de backend, frontend, UI/UX y cumplimiento de reglas de StabilSafe V2.

## 📋 Archivos del Sistema

### Scripts Principales

- **`audit-dashboard.ps1`** - Script principal de auditoría automatizada
- **`test-helpers.ps1`** - Funciones auxiliares reutilizables
- **`audit-ui-playwright.js`** - Automatización UI con Playwright
- **`dashboard-ui-checklist.md`** - Checklist de validación manual

### Configuración

- **`audit-config.sample.json`** - Configuración de ejemplo (copiar a `audit-config.json` y personalizar)

### Directorios

- **`results/`** - Reportes generados (Markdown, JSON, screenshots)
- **`../../logs/testing/`** - Logs detallados de ejecución
- **`../../backend/uploads/sessions/test_base/`** - Dataset de prueba controlado

## 🚀 Inicio Rápido

### Prerrequisitos

1. **Backend y Frontend corriendo:**
   ```powershell
   .\iniciar.ps1
   ```

2. **Node.js instalado** (para Playwright)

3. **Playwright instalado:**
   ```bash
   npm install playwright
   ```

### Ejecución Básica

```powershell
# Auditoría automatizada completa (solo backend + endpoints)
.\scripts\testing\audit-dashboard.ps1

# Auditoría con configuración personalizada
.\scripts\testing\audit-dashboard.ps1 -ConfigFile ".\audit-config.json"

# Auditoría en modo headless (sin navegador)
.\scripts\testing\audit-dashboard.ps1 -Headless

# Auditoría con log detallado
.\scripts\testing\audit-dashboard.ps1 -LogLevel DEBUG

# Auditoría UI automatizada con Playwright
node scripts\testing\audit-ui-playwright.js

# Auditoría UI con Playwright en modo headless
node scripts\testing\audit-ui-playwright.js --headless
```

### Ejecución Completa (Backend + UI)

```powershell
# 1. Auditoría automatizada de backend
.\scripts\testing\audit-dashboard.ps1

# 2. Auditoría automatizada de UI
node scripts\testing\audit-ui-playwright.js

# 3. Revisar checklist manual (opcional, para validación adicional)
# Consultar: scripts/testing/dashboard-ui-checklist.md
```

## 🎯 Qué Prueba el Sistema

### 1. Servicios (FASE 1)
- ✅ Backend disponible en puerto 9998
- ✅ Frontend disponible en puerto 5174
- ✅ Health endpoints respondiendo

### 2. Autenticación (FASE 2)
- ✅ Login como ADMIN
- ✅ Login como MANAGER
- ✅ Validación de tokens JWT
- ✅ Verificación de organizationId

### 3. Endpoints Backend (FASE 3)
- ✅ `/api/summary` - KPIs principales
- ✅ `/api/devices/status` - Estado de dispositivos
- ✅ `/api/sessions` - Listado de sesiones
- ✅ `/api/events` - Eventos de estabilidad
- ✅ Validación de tiempos de respuesta
- ✅ Validación de estructura JSON

### 4. Subida de Sesiones (FASE 4)
- ⚠️ Opcional - Subida de archivo de prueba
- ⚠️ Validación de sessionId generado
- ⚠️ Verificación de eventos generados

### 5. Rendimiento (FASE 5)
- ✅ Tiempo `/api/summary` < 3 segundos
- ✅ Tiempo otros endpoints < 1 segundo
- ✅ Métricas agregadas y promedios

### 6. Validación UI (FASE 6)

#### Con Playwright (Automatizado):
- ✅ Login funcional
- ✅ Dashboard carga correctamente
- ✅ **Regla StabilSafe V2: Sin scroll en contenedor principal**
- ✅ Todas las pestañas cargan sin errores
- ✅ Filtros globales disponibles
- ✅ Botones de exportación PDF presentes
- ✅ Capturas de pantalla de cada pestaña
- ✅ Detección de errores de consola

#### Con Checklist Manual (Complementario):
- ⚠️ Interacciones de filtros (cambio de vehículo, fechas, rotativo)
- ⚠️ Exportaciones PDF completas
- ⚠️ Validación de contenido en PDFs
- ⚠️ Responsividad en diferentes resoluciones

## 📊 Reportes Generados

### Estructura de Salida

```
scripts/testing/results/[timestamp]/
├── audit-report.md          # Reporte legible en Markdown
├── audit-data.json          # Datos estructurados en JSON
├── audit-debug.log          # Log detallado de ejecución
└── screenshots/             # Capturas de pantalla
    ├── login-form.png
    ├── dashboard-initial.png
    ├── tab-estados_&_tiempos.png
    ├── tab-puntos_negros.png
    ├── tab-velocidad.png
    ├── tab-sesiones.png
    └── tab-reportes.png
```

### Formato JSON de Resultados

```json
{
  "timestamp": "2025-10-21T22:00:00Z",
  "services": {
    "Backend": {
      "status": "running",
      "port": 9998,
      "health": "ok",
      "available": true
    },
    "Frontend": {
      "status": "running",
      "port": 5174,
      "available": true
    }
  },
  "endpoints": [
    {
      "url": "/api/summary",
      "method": "GET",
      "statusCode": 200,
      "durationMs": 1850,
      "pass": true
    }
  ],
  "uiChecks": {
    "no_scroll_main_container": true,
    "tabs_load_successfully": true,
    "filters_responsive": true,
    "pdf_exports_work": true
  },
  "performance": {
    "avg_summary_time_ms": 1850,
    "avg_other_endpoints_ms": 450
  },
  "summary": {
    "totalTests": 35,
    "passed": 33,
    "failed": 2,
    "warnings": 0
  }
}
```

## ⚙️ Configuración Personalizada

### Crear Archivo de Configuración

```powershell
# Copiar ejemplo y editar
cp scripts\testing\audit-config.sample.json scripts\testing\audit-config.json
```

### Editar Configuración

```json
{
  "backend_url": "http://localhost:9998",
  "frontend_url": "http://localhost:5174",
  "auth": {
    "endpoint": "/api/auth/login",
    "admin": {
      "email": "tu-admin@example.com",
      "password": "tu-password"
    },
    "manager": {
      "email": "tu-manager@example.com",
      "password": "tu-password"
    }
  },
  "dataset_path": "./backend/uploads/sessions/test_base",
  "endpoints": {
    "health": "/health",
    "summary": "/api/summary",
    "devices": "/api/devices/status",
    "events": "/api/events",
    "sessions": "/api/sessions",
    "upload": "/api/upload-single"
  },
  "performance_thresholds": {
    "summary_ms": 3000,
    "other_ms": 1000
  },
  "test_filters": {
    "date_from": "2025-09-29",
    "date_to": "2025-10-08"
  },
  "output": {
    "base_dir": "./scripts/testing/results",
    "include_screenshots": true,
    "log_level": "INFO"
  }
}
```

## 🔧 Parámetros CLI

### audit-dashboard.ps1

```powershell
# Parámetros disponibles:
-ConfigFile        # Ruta al archivo de configuración
-BaseUrlBackend    # URL del backend (sobreescribe config)
-BaseUrlFrontend   # URL del frontend (sobreescribe config)
-AdminEmail        # Email del admin (sobreescribe config)
-AdminPassword     # Password del admin (sobreescribe config)
-ManagerEmail      # Email del manager (sobreescribe config)
-ManagerPassword   # Password del manager (sobreescribe config)
-DatasetPath       # Ruta a archivos de prueba (sobreescribe config)
-OutDir            # Directorio de salida (sobreescribe config)
-Headless          # Ejecutar sin navegador
-LogLevel          # DEBUG | INFO | WARNING | ERROR
```

### Ejemplos de Uso

```powershell
# Producción
.\scripts\testing\audit-dashboard.ps1 `
  -BaseUrlBackend "https://api.stabilsafe.com" `
  -BaseUrlFrontend "https://dashboard.stabilsafe.com" `
  -AdminEmail "admin@example.com" `
  -AdminPassword "secure-password" `
  -Headless `
  -LogLevel INFO

# Desarrollo con logs detallados
.\scripts\testing\audit-dashboard.ps1 -LogLevel DEBUG

# CI/CD
.\scripts\testing\audit-dashboard.ps1 -Headless -OutDir "./ci-results"
```

## 🎨 Integración CI/CD

### GitHub Actions

```yaml
name: StabilSafe Audit

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  audit:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install playwright
      
      - name: Start services
        run: |
          docker-compose up -d
          sleep 30
      
      - name: Run audit
        run: |
          pwsh scripts/testing/audit-dashboard.ps1 -Headless
          node scripts/testing/audit-ui-playwright.js --headless
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: audit-results
          path: scripts/testing/results/
```

## 📚 Documentación Adicional

- **Checklist Manual UI:** `dashboard-ui-checklist.md`
- **Dataset de Prueba:** `../../backend/uploads/sessions/test_base/README.md`
- **Guía de Pruebas de Aceptación:** `../../docs/00-GENERAL/GUIA_PRUEBAS_ACEPTACION.md`
- **Reglas StabilSafe V2:** `../../docs/HISTORICO/versiones-anteriores/RESUMEN_IMPLEMENTACION_V2.md`

## 🐛 Troubleshooting

### Backend no disponible

```powershell
# Verificar que el backend esté corriendo
Get-NetTCPConnection -LocalPort 9998

# Reiniciar servicios
.\iniciar.ps1
```

### Frontend no disponible

```powershell
# Verificar que el frontend esté corriendo
Get-NetTCPConnection -LocalPort 5174

# Reiniciar servicios
.\iniciar.ps1
```

### Error de autenticación

```
# Verificar credenciales en audit-config.json
# Asegurarse de que el usuario existe en la base de datos
# Verificar que la contraseña es correcta
```

### Playwright no instalado

```bash
npm install playwright
npx playwright install chromium
```

### Permisos de ejecución PowerShell

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📞 Soporte

Para issues o mejoras:
1. Revisar logs en `logs/testing/audit-[timestamp].log`
2. Consultar documentación en `docs/`
3. Contactar al equipo QA DobackSoft

---

**Versión:** 1.0.0  
**Última actualización:** 2025-10-21  
**Mantenedor:** Equipo QA DobackSoft

