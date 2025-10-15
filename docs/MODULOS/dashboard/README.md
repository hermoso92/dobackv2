# 🏠 Dashboard - Panel de Control

Panel principal de DobackSoft con KPIs estratégicos y modo TV Wall.

---

## 📋 ÍNDICE

- [Arquitectura](arquitectura.md) - Diseño técnico del módulo
- [KPIs](kpis.md) - Cálculo y visualización de KPIs
- [TV Wall](tv-wall.md) - Modo presentación automático
- [Componentes](componentes.md) - Componentes UI utilizados
- [API Endpoints](api-endpoints.md) - Endpoints de la API
- [Troubleshooting](troubleshooting.md) - Problemas comunes
- [Tests](tests.md) - Testing del módulo

---

## 🎯 DESCRIPCIÓN

El Dashboard es el panel principal del sistema DobackSoft. Proporciona una vista consolidada de los KPIs más importantes de la flota en tiempo real.

---

## ✨ CARACTERÍSTICAS PRINCIPALES

### **KPIs Estratégicos**
- ✅ Disponibilidad de flota
- ✅ Tiempos de operación
- ✅ Tiempo con rotativo encendido
- ✅ Número de incidencias
- ✅ Kilómetros recorridos
- ✅ Costes operacionales

### **Modo TV Wall**
- ✅ Activación automática
- ✅ KPIs grandes y visuales
- ✅ Sin menús ni distracciones
- ✅ Rotación automática

### **Visualizaciones**
- ✅ Gráficas de tendencias
- ✅ Alertas destacadas
- ✅ Mapa de eventos
- ✅ Estado de mantenimiento

---

## 🏗️ ARQUITECTURA

```
Dashboard
├── Frontend
│   ├── UnifiedDashboard.tsx       # Componente principal
│   ├── hooks/
│   │   ├── useDashboardData.ts    # Hook de datos
│   │   ├── useKPIs.ts             # Hook de KPIs
│   │   └── useDashboardStats.ts   # Hook de estadísticas
│   └── components/
│       ├── KPICard.tsx            # Tarjeta de KPI
│       ├── TVWallMode.tsx         # Modo TV Wall
│       └── DashboardChart.tsx     # Gráficas
│
└── Backend
    ├── controllers/
    │   ├── DashboardController.ts  # Controlador principal
    │   ├── KPIController.ts        # Controlador de KPIs
    │   └── PanelController.ts      # Controlador del panel
    └── services/
        ├── DashboardService.ts     # Lógica de negocio
        └── KPIService.ts           # Cálculo de KPIs
```

---

## 📡 API ENDPOINTS

### **GET /api/dashboard**
Obtiene datos completos del dashboard.

**Query Params:**
- `organizationId` - ID de la organización
- `startDate` - Fecha de inicio
- `endDate` - Fecha de fin

**Response:**
```json
{
  "kpis": {
    "availability": 95.5,
    "operatingTime": 1234,
    "rotativeTime": 567,
    "incidents": 12,
    "kilometers": 5678,
    "costs": 12345.67
  },
  "trends": [...],
  "alerts": [...],
  "maintenance": [...]
}
```

### **GET /api/kpis**
Obtiene KPIs específicos.

Ver: [api-endpoints.md](api-endpoints.md) para más detalles.

---

## 🚀 INICIO RÁPIDO

### **Acceder al Dashboard**
1. Iniciar sesión en el sistema
2. El dashboard se carga automáticamente
3. Seleccionar filtros si es necesario

### **Activar Modo TV Wall**
1. Click en botón "TV Wall" (esquina superior derecha)
2. Dashboard entra en modo presentación
3. Para salir: presionar ESC o click en icono de salida

---

## 🔧 CONFIGURACIÓN

### **Configurar KPIs Visibles**
```typescript
// config/dashboardStats.ts
export const DASHBOARD_CONFIG = {
  kpis: {
    availability: true,
    operatingTime: true,
    rotativeTime: true,
    incidents: true,
    kilometers: false, // Ocultar KPI
    costs: true
  }
};
```

### **Configurar Actualización Automática**
```typescript
// Dashboard se actualiza cada 30 segundos
const REFRESH_INTERVAL = 30000;
```

---

## 🐛 TROUBLESHOOTING

### **KPIs no se actualizan**
**Problema:** Los KPIs muestran datos antiguos.

**Solución:**
1. Verificar conexión a internet
2. Revisar filtros aplicados
3. Refrescar página (F5)

### **Modo TV Wall no funciona**
**Problema:** No se activa el modo TV Wall.

**Solución:**
1. Verificar permisos del navegador
2. Usar navegador compatible (Chrome, Edge)
3. Permitir modo pantalla completa

Ver: [troubleshooting.md](troubleshooting.md) para más problemas.

---

## 🧪 TESTING

```bash
# Tests del dashboard
npm test -- dashboard

# Tests de KPIs
npm test -- kpis

# Tests de integración
npm test -- dashboard.integration
```

Ver: [tests.md](tests.md) para más detalles.

---

## 📚 DOCUMENTACIÓN RELACIONADA

- [KPIs](kpis.md) - Cálculo detallado de KPIs
- [Estabilidad](../estabilidad/) - Módulo de estabilidad
- [Telemetría](../telemetria/) - Módulo de telemetría
- [Reportes](../reportes/) - Generación de reportes

---

## 🔄 ÚLTIMA ACTUALIZACIÓN

**Fecha:** Octubre 2025  
**Versión:** 1.0  
**Estado:** ✅ Operativo

---

**DobackSoft © 2025**

