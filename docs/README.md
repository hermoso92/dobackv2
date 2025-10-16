# 📚 Documentación DobackSoft - Estructura Modular

> **Última actualización:** Octubre 12, 2025  
> **Estructura:** Modular por funcionalidad

---

## ⚠️ REGLAS OBLIGATORIAS

**🚨 TODA la documentación DEBE estar en esta carpeta `docs/`.**

**❌ NUNCA crear archivos .md en la raíz del proyecto (excepto README.md).**

**✅ USAR estructura modular:** Cada módulo tiene su carpeta en `MODULOS/`

📋 Ver: **[00-ESTRUCTURA-OBLIGATORIA.md](00-ESTRUCTURA-OBLIGATORIA.md)** para reglas completas.

---

## 🏗️ ESTRUCTURA MODULAR

```
docs/
│
├── README.md                          ← Este archivo
├── 00-ESTRUCTURA-OBLIGATORIA.md       ← Reglas de organización
├── PLANTILLA-MODULO.md                ← Plantilla para nuevos módulos
│
├── 00-INICIO/                         🚀 Inicio del Proyecto
│   ├── README.md
│   ├── INSTALACION.md
│   ├── CONFIGURACION-INICIAL.md
│   ├── PRIMER-USO.md
│   └── CREAR-USUARIO-ADMIN.md
│
├── 00-GENERAL/                        📖 Documentación General
│   ├── README.md
│   ├── ARQUITECTURA-SISTEMA.md
│   ├── ESTRUCTURA-PROYECTO.md
│   ├── CONVENCIONES-CODIGO.md
│   ├── FLUJO-DATOS.md
│   └── STACK-TECNOLOGICO.md
│
├── MODULOS/                           🧩 MÓDULOS FUNCIONALES
│   ├── README.md                      ← Índice de módulos
│   │
│   ├── dashboard/                     🏠 Panel de Control
│   ├── estabilidad/                   📊 Análisis de Estabilidad
│   ├── telemetria/                    📡 Datos CAN + GPS
│   ├── ia/                            🤖 Inteligencia Artificial
│   ├── geofences/                     🗺️ Geocercas
│   ├── operaciones/                   🔧 Eventos y Alertas
│   ├── reportes/                      📈 Generación de Reportes
│   ├── administracion/                ⚙️ Gestión del Sistema
│   ├── upload/                        📤 Sistema de Subida ✅
│   ├── autenticacion/                 🔐 Seguridad y Auth
│   ├── vehiculos/                     🚗 Gestión de Flota
│   └── base-conocimiento/             📚 Docs Internas
│
├── BACKEND/                           🔧 Documentación Backend
│   ├── README.md
│   ├── arquitectura.md
│   ├── api-rest.md
│   ├── base-datos.md
│   └── servicios.md
│
├── FRONTEND/                          💻 Documentación Frontend
│   ├── README.md
│   ├── arquitectura.md
│   ├── componentes.md
│   └── hooks.md
│
├── INFRAESTRUCTURA/                   🏗️ Infraestructura
│   ├── README.md
│   ├── docker.md
│   ├── ci-cd.md
│   └── despliegue.md
│
├── API/                               📡 Documentación de APIs
│   ├── README.md
│   ├── endpoints-completos.md
│   └── autenticacion.md
│
├── DESARROLLO/                        👨‍💻 Guías de Desarrollo
│   ├── README.md
│   ├── setup-entorno.md
│   ├── convenciones-codigo.md
│   └── git-workflow.md
│
├── CALIDAD/                           ✅ Control de Calidad
│   ├── README.md
│   ├── auditorias/
│   ├── checklists/
│   └── metricas/
│
└── HISTORICO/                         📜 Histórico
    ├── README.md
    ├── versiones-anteriores/
    ├── entregas/
    └── correcciones/
```

---

## 🧩 MÓDULOS DEL SISTEMA

### **🏠 [Dashboard](MODULOS/dashboard/)** - Panel de Control
Panel principal con KPIs estratégicos y modo TV Wall.

### **📊 [Estabilidad](MODULOS/estabilidad/)** - Análisis de Estabilidad
Análisis de estabilidad vehicular con métricas avanzadas.

### **📡 [Telemetría](MODULOS/telemetria/)** - Datos CAN + GPS
Telemetría en tiempo real con datos CAN y GPS.

### **🤖 [IA](MODULOS/ia/)** - Inteligencia Artificial
Sistema de IA para análisis y recomendaciones.

### **🗺️ [Geofences](MODULOS/geofences/)** - Geocercas
Gestión de geocercas y eventos de entrada/salida.

### **🔧 [Operaciones](MODULOS/operaciones/)** - Gestión de Operaciones
Eventos, alertas y mantenimiento del sistema.

### **📈 [Reportes](MODULOS/reportes/)** - Generación de Reportes
Generación y exportación de reportes en PDF.

### **⚙️ [Administración](MODULOS/administracion/)** - Gestión del Sistema
Administración del sistema (solo ADMIN).

### **📤 [Upload](MODULOS/upload/)** ✅ - Sistema de Subida
Sistema de carga masiva de archivos Doback.  
**Estado:** Completamente documentado

### **🔐 [Autenticación](MODULOS/autenticacion/)** - Seguridad
Sistema de autenticación y seguridad.

### **🚗 [Vehículos](MODULOS/vehiculos/)** - Gestión de Flota
Gestión completa de vehículos y flota.

### **📚 [Base de Conocimiento](MODULOS/base-conocimiento/)** - Docs Internas
Base de conocimiento interna del sistema.

---

## 🔍 BÚSQUEDA RÁPIDA

### **¿Cómo inicio el sistema?**
→ [00-INICIO/](00-INICIO/)

### **¿Cómo funciona la arquitectura?**
→ [00-GENERAL/ARQUITECTURA-SISTEMA.md](00-GENERAL/ARQUITECTURA-SISTEMA.md)

### **¿Necesito docs de un módulo específico?**
→ [MODULOS/](MODULOS/) → `[nombre-modulo]/`

### **¿Documentación técnica del backend?**
→ [BACKEND/](BACKEND/)

### **¿Documentación técnica del frontend?**
→ [FRONTEND/](FRONTEND/)

### **¿Cómo usar las APIs?**
→ [API/](API/)

### **¿Guías de desarrollo?**
→ [DESARROLLO/](DESARROLLO/)

---

## 📝 CONVENCIONES

### **Estructura por Módulo**
Cada módulo en `MODULOS/[modulo]/` contiene:
- `README.md` - Índice del módulo
- `arquitectura.md` - Diseño técnico
- `funcionalidades.md` - Características
- `api-endpoints.md` - Endpoints API
- `componentes.md` - Componentes UI
- `troubleshooting.md` - Problemas comunes
- `tests.md` - Testing

### **Plantilla para Nuevos Módulos**
Ver: [PLANTILLA-MODULO.md](PLANTILLA-MODULO.md)

---

## 🚀 INICIO RÁPIDO

### **Para Usuarios Nuevos:**
1. Leer: [README.md](../README.md) (raíz del proyecto)
2. Luego: [00-INICIO/](00-INICIO/)
3. Ejecutar: `.\iniciar.ps1`

### **Para Desarrolladores:**
1. Arquitectura: [00-GENERAL/ARQUITECTURA-SISTEMA.md](00-GENERAL/)
2. Setup: [DESARROLLO/setup-entorno.md](DESARROLLO/)
3. Módulos: [MODULOS/](MODULOS/)

### **Para Documentar un Módulo:**
1. Crear carpeta en `MODULOS/[modulo]/`
2. Usar [PLANTILLA-MODULO.md](PLANTILLA-MODULO.md)
3. Crear `README.md` del módulo
4. Añadir docs específicas

---

## 🎯 VENTAJAS DE LA ESTRUCTURA MODULAR

✅ **Clara separación** por módulo funcional  
✅ **Fácil encontrar** documentación específica  
✅ **Escalable** - nuevo módulo = nueva carpeta  
✅ **Refleja la arquitectura** real del código  
✅ **Mejor colaboración** - equipos trabajan en sus módulos  
✅ **Menos conflictos** en Git

---

## 🚨 IMPORTANTE

### **Al crear nueva documentación:**
1. ✅ Identificar el módulo apropiado
2. ✅ Colocar en `MODULOS/[modulo]/`
3. ✅ Seguir la plantilla estándar
4. ✅ Actualizar README del módulo
5. ❌ **NUNCA dejar .md en la raíz**

### **Al crear nuevo módulo:**
1. ✅ Crear carpeta en `MODULOS/`
2. ✅ Usar `PLANTILLA-MODULO.md`
3. ✅ Crear `README.md` del módulo
4. ✅ Actualizar `MODULOS/README.md`
5. ✅ Actualizar `.cursorrules`

---

## 📊 ESTADO DE DOCUMENTACIÓN

| Módulo | Estado | Completitud |
|--------|--------|-------------|
| Upload ✅ | Completo | 100% |
| Dashboard | Básico | 30% |
| Estabilidad | Básico | 30% |
| Telemetría | Básico | 20% |
| IA | Básico | 10% |
| Geofences | Básico | 10% |
| Operaciones | Básico | 10% |
| Reportes | Básico | 10% |
| Administración | Básico | 10% |
| Autenticación | Básico | 10% |
| Vehículos | Básico | 10% |
| Base Conocimiento | Básico | 10% |

---

## 📚 DOCUMENTACIÓN RELACIONADA

- **Reglas del proyecto:** [../.cursorrules](../.cursorrules)
- **Estructura obligatoria:** [00-ESTRUCTURA-OBLIGATORIA.md](00-ESTRUCTURA-OBLIGATORIA.md)
- **README principal:** [../README.md](../README.md)
- **Scripts:** [../scripts/README.md](../scripts/README.md)

---

## 🔄 MIGRACIÓN COMPLETADA

**Fecha:** Octubre 12, 2025

Se migró de estructura genérica (9 carpetas por tipo) a estructura modular (12 módulos funcionales).

**Ver:** [PROPUESTA-ESTRUCTURA-MODULAR.md](PROPUESTA-ESTRUCTURA-MODULAR.md)

---

**DobackSoft © 2025 - Sistema Profesional de Análisis de Estabilidad Vehicular**
