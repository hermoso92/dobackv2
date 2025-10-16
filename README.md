# 🚗 DobackSoft - StabilSafe V3

Sistema profesional de análisis de estabilidad vehicular para flotas profesionales.

---

## 🚀 INICIO RÁPIDO

### **Iniciar Sistema Completo**
```powershell
.\iniciar.ps1
```

Este script único:
- ✅ Libera puertos 9998 (backend) y 5174 (frontend)
- ✅ Verifica archivos necesarios
- ✅ Inicia backend y frontend en ventanas separadas
- ✅ Abre navegador automáticamente
- ✅ Muestra credenciales de acceso

### **Acceso**
- **URL:** http://localhost:5174
- **Usuario Admin:** admin@dobacksoft.com
- **Password:** Admin123!

---

## 📚 DOCUMENTACIÓN ORGANIZADA

Toda la documentación ha sido organizada en `docs/`:

### **📁 01-inicio/**
Documentos esenciales para comenzar:
- Instrucciones de instalación
- Guías de inicio rápido
- README principal del sistema

### **📁 02-arquitectura/**
Documentación técnica del sistema:
- Flujo completo del sistema
- Arquitectura de módulos
- Protocolos y estándares

### **📁 03-implementacion/**
Progreso de desarrollo:
- Fases completadas
- Cronogramas
- Integraciones realizadas

### **📁 04-auditorias/**
Informes de calidad:
- Auditorías del sistema
- Reportes de estado
- Diagnósticos

### **📁 05-correcciones/**
Soluciones implementadas:
- Correcciones aplicadas
- Problemas resueltos
- Mejoras realizadas

### **📁 06-guias/**
Manuales de uso:
- Guías de funcionalidades
- Configuración del sistema
- Licencias y contribución

### **📁 07-verificaciones/**
Testing y validación:
- Checklists de pruebas
- Planes de verificación
- Tests realizados

### **📁 08-analisis/**
Análisis técnicos:
- Análisis de archivos
- Cálculos de KPIs
- Descubrimientos técnicos

### **📁 09-historico/**
Registro histórico:
- Entregas anteriores
- Estados previos del sistema
- Consolidados históricos

---

## 🎯 MÓDULOS PRINCIPALES

### **🏠 Panel de Control**
- KPIs estratégicos en tiempo real
- Modo TV Wall automático
- Bloques de mantenimiento y alertas

### **📊 Estabilidad**
- Métricas de conducción
- Eventos críticos detectados
- Comparador de sesiones
- Exportación PDF

### **📡 Telemetría**
- Datos CAN en tiempo real
- Mapa GPS interactivo
- Alarmas configurables
- Comparador CAN/GPS

### **🤖 Inteligencia Artificial**
- Chat IA especializado
- Patrones detectados
- Recomendaciones automáticas

### **🗺️ Geofences**
- CRUD completo de zonas
- Eventos de entrada/salida
- Alertas automáticas

### **🔧 Operaciones**
- Eventos del sistema
- Alertas configurables
- Gestión de mantenimiento

### **📈 Reportes**
- Generación automática de PDF
- Reportes personalizables
- Análisis comparativos

### **⚙️ Administración** (Solo ADMIN)
- Gestión de organizaciones
- Usuarios y roles
- Configuración global

---

## 🛠️ STACK TECNOLÓGICO

### **Backend**
- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT + httpOnly cookies
- AWS S3 (archivos)

### **Frontend**
- React 18 + TypeScript
- Tailwind CSS
- Leaflet + TomTom (mapas)
- Recharts (gráficas)

### **Puertos Fijos**
- Backend: **9998** (no cambiar)
- Frontend: **5174** (no cambiar)

---

## 📦 ESTRUCTURA DEL PROYECTO

```
DobackSoft/
├── backend/           # API y lógica de negocio
├── frontend/          # Interfaz React
├── docs/             # Documentación organizada (207 archivos)
│   ├── 01-inicio/           # Guías de inicio
│   ├── 02-arquitectura/     # Diseño del sistema
│   ├── 03-implementacion/   # Fases de desarrollo
│   ├── 04-auditorias/       # Control de calidad
│   ├── 05-correcciones/     # Soluciones aplicadas
│   ├── 06-guias/            # Manuales de uso
│   ├── 07-verificaciones/   # Testing
│   ├── 08-analisis/         # Análisis técnicos
│   └── 09-historico/        # Registro histórico
├── scripts/          # Scripts de desarrollo
│   ├── analisis/            # Análisis de datos
│   ├── testing/             # Tests y validación
│   ├── setup/               # Inicialización
│   ├── utils/               # Utilidades
│   └── historico/           # Scripts obsoletos
├── database/         # Scripts SQL y migraciones
├── tests/            # Tests automatizados (Playwright)
├── temp/             # Archivos temporales
├── logs/             # Logs del sistema
├── config/           # Configuración
├── data/             # Datos de prueba
└── iniciar.ps1       # ⭐ Script de inicio único
```

---

## 🔐 SEGURIDAD

- Autenticación JWT con cookies httpOnly
- Protección CSRF implementada
- Cifrado S3 (SSE-KMS)
- Aislamiento por organización
- Roles ADMIN/MANAGER

---

## 📋 ROLES Y PERMISOS

### **ADMIN**
- Acceso total al sistema
- Gestión de organizaciones
- Configuración global
- Base de conocimiento

### **MANAGER**
- Acceso a su organización
- Gestión de su flota
- Reportes y análisis
- Panel de control

---

## 🚨 REGLAS CRÍTICAS

1. **NUNCA iniciar backend/frontend manualmente** → usar `iniciar.ps1`
2. **NUNCA cambiar puertos** → 9998 (backend), 5174 (frontend)
3. **NUNCA hardcodear URLs** → usar `frontend/src/config/api.ts`
4. **NUNCA usar console.log** → usar `logger` de `utils/logger`
5. **SIEMPRE filtrar por organizationId** en requests

---

## 📞 SOPORTE

Para más información, consulta la documentación en `docs/` o contacta al equipo de desarrollo.

---

**DobackSoft © 2025 - Sistema Profesional de Análisis de Estabilidad Vehicular**

