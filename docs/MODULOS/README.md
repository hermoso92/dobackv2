# 🧩 Módulos de DobackSoft

Documentación organizada por módulos funcionales del sistema.

---

## 📋 MÓDULOS DISPONIBLES

### **🏠 [Dashboard](dashboard/)** - Panel de Control
Panel principal del sistema con KPIs estratégicos y modo TV Wall.

**Características:**
- KPIs en tiempo real
- Modo TV Wall automático
- Bloques de mantenimiento y alertas
- Visualización de tendencias

**Documentación:**
- `arquitectura.md` - Diseño del módulo
- `kpis.md` - Cálculo de KPIs
- `tv-wall.md` - Modo presentación
- `api-endpoints.md` - Endpoints API

---

### **📊 [Estabilidad](estabilidad/)** - Análisis de Estabilidad
Análisis de estabilidad vehicular con métricas avanzadas.

**Características:**
- Métricas de conducción
- Eventos críticos detectados
- Comparador de sesiones
- Exportación PDF

**Documentación:**
- `arquitectura.md` - Diseño del módulo
- `metricas.md` - Métricas calculadas
- `eventos.md` - Sistema de eventos
- `api-endpoints.md` - Endpoints API

---

### **📡 [Telemetría](telemetria/)** - Datos CAN + GPS
Telemetría en tiempo real con datos CAN y GPS.

**Características:**
- Datos CAN en tiempo real
- Mapa GPS interactivo
- Alarmas configurables
- Comparador CAN/GPS

**Documentación:**
- `arquitectura.md` - Diseño del módulo
- `can-datos.md` - Datos CAN
- `gps-datos.md` - Datos GPS
- `api-endpoints.md` - Endpoints API

---

### **🤖 [IA](ia/)** - Inteligencia Artificial
Sistema de IA para análisis y recomendaciones.

**Características:**
- Chat IA especializado
- Patrones detectados
- Recomendaciones automáticas
- Reportes PDF generados por IA

**Documentación:**
- `arquitectura.md` - Diseño del módulo
- `chat-ia.md` - Sistema de chat
- `patrones.md` - Detección de patrones
- `api-endpoints.md` - Endpoints API

---

### **🗺️ [Geofences](geofences/)** - Geocercas
Gestión de geocercas y eventos de entrada/salida.

**Características:**
- CRUD completo de zonas
- Eventos de entrada/salida
- Alertas automáticas
- Integración con mapas

**Documentación:**
- `arquitectura.md` - Diseño del módulo
- `crud-zonas.md` - Gestión de zonas
- `eventos.md` - Sistema de eventos
- `api-endpoints.md` - Endpoints API

---

### **🔧 [Operaciones](operaciones/)** - Gestión de Operaciones
Eventos, alertas y mantenimiento del sistema.

**Características:**
- Gestión de eventos
- Sistema de alertas
- Mantenimiento preventivo
- Calendario de tareas

**Documentación:**
- `arquitectura.md` - Diseño del módulo
- `eventos.md` - Gestión de eventos
- `alertas.md` - Sistema de alertas
- `api-endpoints.md` - Endpoints API

---

### **📈 [Reportes](reportes/)** - Generación de Reportes
Generación y exportación de reportes en PDF.

**Características:**
- Generación automática de PDF
- Reportes personalizables
- Análisis comparativos
- Exportación múltiple

**Documentación:**
- `arquitectura.md` - Diseño del módulo
- `generacion-pdf.md` - Generación de PDFs
- `tipos-reportes.md` - Tipos disponibles
- `api-endpoints.md` - Endpoints API

---

### **⚙️ [Administración](administracion/)** - Gestión del Sistema
Administración del sistema (solo ADMIN).

**Características:**
- Gestión de organizaciones
- Usuarios y roles
- Configuración global
- Permisos y accesos

**Documentación:**
- `arquitectura.md` - Diseño del módulo
- `organizaciones.md` - Gestión de orgs
- `usuarios.md` - Gestión de usuarios
- `api-endpoints.md` - Endpoints API

---

### **📤 [Upload](upload/)** - Sistema de Subida ✅
Sistema de carga masiva de archivos Doback.

**Características:**
- Validación robusta
- GPS validado con 5 niveles
- Modal de reporte automático
- 80+ tests automatizados

**Documentación:**
- `README.md` - Índice del módulo
- `01-PROTOCOLOS.md` - Reglas inmutables
- `02-VALIDACIONES.md` - Sistema de validación
- `03-FLUJO-PROCESAMIENTO.md` - Flujo completo
- `04-TROUBLESHOOTING.md` - Problemas comunes

---

### **🔐 [Autenticación](autenticacion/)** - Seguridad
Sistema de autenticación y seguridad.

**Características:**
- Login con JWT
- Cookies httpOnly
- Roles ADMIN/MANAGER
- Protección CSRF

**Documentación:**
- `arquitectura.md` - Diseño del módulo
- `jwt-tokens.md` - Tokens JWT
- `cookies.md` - Gestión de cookies
- `api-endpoints.md` - Endpoints API

---

### **🚗 [Vehículos](vehiculos/)** - Gestión de Flota
Gestión completa de vehículos y flota.

**Características:**
- CRUD de vehículos
- Gestión de flota
- Catálogo DGT
- Historial de sesiones

**Documentación:**
- `arquitectura.md` - Diseño del módulo
- `crud.md` - Operaciones CRUD
- `catalogo-dgt.md` - Integración DGT
- `api-endpoints.md` - Endpoints API

---

### **📚 [Base de Conocimiento](base-conocimiento/)** - Documentación
Base de conocimiento interna del sistema.

**Características:**
- Gestión de documentos
- Búsqueda avanzada
- Categorización
- Acceso controlado

**Documentación:**
- `arquitectura.md` - Diseño del módulo
- `gestion-documentos.md` - Gestión de docs
- `api-endpoints.md` - Endpoints API

---

## 📝 ESTRUCTURA ESTÁNDAR POR MÓDULO

Cada módulo contiene:

```
modulo/
├── README.md              # Índice del módulo
├── arquitectura.md        # Diseño técnico
├── funcionalidades.md     # Características
├── api-endpoints.md       # Endpoints API
├── componentes.md         # Componentes UI
├── troubleshooting.md     # Problemas comunes
└── tests.md               # Testing
```

---

## 🔍 BÚSQUEDA RÁPIDA

**¿Necesitas información sobre...?**

| Tema | Módulo |
|------|--------|
| KPIs y métricas | `dashboard/` |
| Eventos de estabilidad | `estabilidad/` |
| Datos CAN/GPS | `telemetria/` |
| Chat IA | `ia/` |
| Zonas geográficas | `geofences/` |
| Alertas y mantenimiento | `operaciones/` |
| PDFs y reportes | `reportes/` |
| Usuarios y roles | `administracion/` |
| Subida de archivos | `upload/` |
| Login y seguridad | `autenticacion/` |
| Gestión de vehículos | `vehiculos/` |
| Documentos internos | `base-conocimiento/` |

---

## 🚀 INICIO RÁPIDO

1. **Identifica el módulo** que necesitas
2. **Abre la carpeta** del módulo
3. **Lee el README.md** del módulo
4. **Consulta la documentación** específica

---

**DobackSoft © 2025**

