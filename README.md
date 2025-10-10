# 🚀 DobackSoft V3 - StabilSafe

**Sistema integral de gestión, análisis y monitorización de flotas de emergencia**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-3.0.0-green.svg)](https://github.com/hermoso92/dobackv2)

---

## 📋 **Descripción**

DobackSoft V3 (StabilSafe) es una plataforma profesional diseñada para el análisis en tiempo real de vehículos de emergencia. Procesa datos de estabilidad, telemetría CAN/GPS, genera reportes inteligentes con IA y gestiona geocercas para optimizar operaciones.

### **Características Principales**

✅ **Panel de Control** - KPIs en tiempo real con modo TV Wall  
✅ **Módulo de Estabilidad** - Análisis de eventos críticos con exportación PDF  
✅ **Telemetría CAN/GPS** - Monitoreo avanzado con mapas interactivos  
✅ **Inteligencia Artificial** - Análisis predictivo y recomendaciones  
✅ **Geofences** - Gestión de zonas con alertas automáticas  
✅ **Operaciones** - Eventos, alertas y mantenimiento unificado  
✅ **Reportes Profesionales** - Generación PDF en 1 clic  
✅ **Multi-organización** - Aislamiento total de datos por empresa  

---

## 🏗️ **Arquitectura**

### **Stack Tecnológico**

**Backend:**
- TypeScript + Node.js + Express
- PostgreSQL + PostGIS
- Prisma ORM
- Python (procesamiento de datos)

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS
- Leaflet + TomTom (mapas)
- Recharts (gráficas)

---

## 🚀 **Inicio Rápido**

### **Requisitos Previos**

- Node.js 18+
- Python 3.9+
- PostgreSQL 14+ con extensión PostGIS
- Git

### **Instalación**

```bash
# Clonar repositorio
git clone https://github.com/hermoso92/dobackv2.git
cd dobackv2

# Instalar dependencias backend
cd backend
npm install
pip install -r requirements.txt

# Instalar dependencias frontend
cd ../frontend
npm install

# Configurar variables de entorno
# Copiar .env.example a .env y configurar
```

### **Configuración de Base de Datos**

```bash
# Crear base de datos
createdb dobacksoft

# Aplicar migraciones
cd backend
npx prisma migrate deploy
npx prisma db seed
```

### **Iniciar el Sistema**

**Windows:**
```powershell
.\iniciar.ps1
```

**Linux/Mac:**
```bash
./iniciar.sh
```

El script iniciará automáticamente:
- Backend en `http://localhost:9998`
- Frontend en `http://localhost:5174`

---

## 📁 **Estructura del Proyecto**

```
DobackSoft/
├── backend/                    # Backend TypeScript/Python
│   ├── src/
│   │   ├── controllers/        # Controladores de rutas
│   │   ├── services/           # Lógica de negocio
│   │   ├── middleware/         # Middlewares (auth, CORS, etc.)
│   │   ├── routes/             # Definición de endpoints
│   │   └── utils/              # Utilidades y helpers
│   ├── prisma/                 # Schema y migraciones
│   ├── processors/             # Procesadores de datos Python
│   └── data/                   # Datos de vehículos
│
├── frontend/                   # Frontend React
│   ├── src/
│   │   ├── components/         # Componentes React
│   │   ├── pages/              # Páginas principales
│   │   ├── hooks/              # Custom hooks
│   │   ├── services/           # Servicios de API
│   │   ├── config/             # Configuraciones
│   │   └── styles/             # Estilos CSS
│   └── public/                 # Assets estáticos
│
├── config/                     # Configuraciones del sistema
├── scripts/                    # Scripts de automatización
└── docs/                       # Documentación
```

---

## 🎯 **Módulos del Sistema**

### **1. Panel de Control**
Dashboard con KPIs estratégicos:
- Disponibilidad de flota
- Tiempo con rotativo encendido
- Kilómetros recorridos
- Incidencias por severidad
- Modo TV Wall para salas de control

### **2. Estabilidad**
Análisis de eventos de conducción:
- Métricas de estabilidad (aceleraciones, frenadas)
- Mapa de eventos GPS
- Comparador entre sesiones
- Exportación PDF profesional

### **3. Telemetría**
Monitoreo CAN/GPS unificado:
- Visualización de datos CAN en tiempo real
- Mapas GPS con trazado de rutas
- Alarmas configurables
- Comparador de sesiones

### **4. Inteligencia Artificial**
Copiloto inteligente:
- Chat con análisis de datos
- Detección de patrones
- Recomendaciones automáticas
- Generación de reportes con IA

### **5. Geofences**
Gestión de zonas geográficas:
- CRUD completo de geocercas
- Detección de entrada/salida
- Alertas automáticas
- Integración con mapas

### **6. Operaciones**
Gestión operativa unificada:
- Registro de eventos
- Sistema de alertas configurable
- Mantenimiento preventivo/correctivo
- Historial completo

### **7. Reportes**
Generación de informes:
- PDF profesional en 1 clic
- Reportes con gráficas y mapas
- Análisis IA incluido
- Exportación CSV/Excel

### **8. Administración**
Gestión del sistema (solo ADMIN):
- Usuarios y roles
- Empresas y flotas
- Vehículos
- Base de conocimiento

---

## 👥 **Roles de Usuario**

### **ADMIN**
- Acceso total al sistema
- Gestión de múltiples organizaciones
- Configuración avanzada

### **MANAGER**
- Acceso a su organización
- Gestión de su flota
- Reportes y análisis

---

## 🔐 **Seguridad**

- ✅ **JWT con cookies httpOnly** - Autenticación segura
- ✅ **Aislamiento por organización** - Filtrado automático `organizationId`
- ✅ **Protección CSRF** implementada
- ✅ **Rate limiting** en endpoints sensibles
- ✅ **Validación estricta** de inputs
- ✅ **Logs de auditoría** completos

---

## 📊 **Flujo de Datos**

```
1. Subida de archivos (FTP/Manual)
   ↓
2. Procesamiento automático
   ↓
3. Detección de eventos
   ↓
4. Almacenamiento en BD
   ↓
5. Visualización en dashboard
   ↓
6. Análisis IA
   ↓
7. Generación de reportes
```

---

## 🛠️ **Configuración**

### **Backend (.env)**
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/dobacksoft
JWT_SECRET=your-secret-key
PORT=9998
OPENAI_API_KEY=your-openai-key
TOMTOM_API_KEY=your-tomtom-key
RADAR_SECRET_KEY=your-radar-key
```

### **Frontend (.env)**
```env
VITE_API_URL=http://localhost:9998
VITE_TOMTOM_API_KEY=your-tomtom-key
VITE_RADAR_PUBLISHABLE_KEY=your-radar-pk
```

---

## 🧪 **Testing**

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test

# E2E
npm run test:e2e
```

---

## 📦 **Despliegue**

### **Producción con Docker**

```bash
docker-compose up -d
```

### **Manual**

```bash
# Build frontend
cd frontend
npm run build

# Iniciar backend
cd ../backend
npm run start:prod
```

---

## 📝 **Licencia**

MIT License - Ver [LICENSE](LICENSE) para más detalles

---

## 👤 **Autor**

**Antonio Hermoso**
- GitHub: [@hermoso92](https://github.com/hermoso92)
- Email: antoniohermoso92@gmail.com

---

## 🔗 **Enlaces**

- **Repositorio**: https://github.com/hermoso92/dobackv2
- **Documentación completa**: Ver carpeta `/docs`
- **Issues**: https://github.com/hermoso92/dobackv2/issues

---

**DobackSoft V3** - *Innovación en gestión de flotas de emergencia*  
© 2025 - Todos los derechos reservados
