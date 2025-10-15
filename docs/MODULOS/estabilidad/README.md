# 📊 Estabilidad - Análisis de Estabilidad Vehicular

Sistema de análisis de estabilidad vehicular con métricas avanzadas.

---

## 📋 DOCUMENTACIÓN

- [📐 Arquitectura](arquitectura.md) - Diseño técnico
- [📊 Métricas](metricas.md) - Métricas calculadas
- [⚡ Eventos](eventos.md) - Sistema de eventos
- [🔄 Procesamiento](procesamiento.md) - Procesamiento de datos
- [📈 Comparador](comparador.md) - Comparación de sesiones
- [📄 Exportación](exportacion.md) - Generación de PDF
- [📡 API Endpoints](api-endpoints.md) - Documentación de API
- [🐛 Troubleshooting](troubleshooting.md) - Problemas comunes
- [🧪 Tests](tests.md) - Testing del módulo

---

## 🎯 DESCRIPCIÓN

El módulo de **Estabilidad** analiza el comportamiento vehicular durante operaciones de emergencia (bomberos, policía, ambulancias) para detectar eventos críticos y generar métricas de seguridad.

---

## ✨ CARACTERÍSTICAS

### **Métricas Principales**
- ✅ Horas de conducción
- ✅ Kilómetros recorridos
- ✅ Tiempo con rotativo encendido (clave 2/5)
- ✅ Número de incidencias (leves, graves, críticas)
- ✅ Eventos críticos detectados

### **Análisis Avanzado**
- ✅ Detección de eventos en tiempo real
- ✅ Clasificación por severidad
- ✅ Correlación GPS + CAN
- ✅ Análisis de patrones

### **Visualización**
- ✅ Gráficas interactivas
- ✅ Mapa de eventos GPS
- ✅ Colores por severidad
- ✅ Timeline de sesión

### **Comparador**
- ✅ Comparar sesiones de estabilidad
- ✅ Entre vehículos, turnos o días
- ✅ Métricas lado a lado
- ✅ Gráficas comparativas

### **Exportación**
- ✅ PDF en 1 clic
- ✅ Incluye métricas, gráficas y mapa
- ✅ Análisis IA incluido
- ✅ Listo para imprimir

---

## 🏗️ ARQUITECTURA

```
Estabilidad
├── Frontend
│   ├── UnifiedEstabilidad.tsx
│   ├── hooks/
│   │   ├── useStability.ts
│   │   ├── useStabilityEvents.ts
│   │   └── useStabilityExport.ts
│   └── components/
│       ├── StabilityChart.tsx
│       ├── EventsMap.tsx
│       └── StabilityComparator.tsx
│
└── Backend
    ├── controllers/
    │   ├── StabilityController.ts
    │   ├── StabilityAnalysisController.ts
    │   └── StabilityExportController.ts
    ├── services/
    │   ├── StabilityService.ts
    │   ├── EventDetectionService.ts
    │   └── StabilityExportService.ts
    └── processors/
        ├── estabilidadProcessor.ts
        └── eventDetector.ts
```

---

## 📡 API PRINCIPALES

- `GET /api/stability/sessions` - Listado de sesiones
- `GET /api/stability/session/:id` - Sesión específica
- `GET /api/stability/events/:sessionId` - Eventos de sesión
- `POST /api/stability/export/:sessionId` - Exportar PDF
- `GET /api/stability/compare` - Comparar sesiones

Ver: [api-endpoints.md](api-endpoints.md)

---

## 🚀 INICIO RÁPIDO

1. **Subir archivos de estabilidad** via módulo Upload
2. **Acceder al módulo** Estabilidad
3. **Seleccionar sesión** de la lista
4. **Visualizar métricas** y eventos
5. **Exportar PDF** si es necesario

---

## 🔧 CONFIGURACIÓN

```typescript
// config/stabilityConfig.ts
export const STABILITY_THRESHOLDS = {
  acelX: { warning: 0.5, danger: 0.7 },
  acelY: { warning: 0.5, danger: 0.7 },
  gyroZ: { warning: 30, danger: 50 }
};
```

---

## 🐛 TROUBLESHOOTING COMÚN

### **No se muestran eventos**
- Verificar que la sesión tenga datos procesados
- Revisar umbrales de detección
- Verificar correlación GPS

### **Exportación PDF falla**
- Verificar permisos del navegador
- Comprobar que la sesión esté completa
- Revisar logs del backend

Ver: [troubleshooting.md](troubleshooting.md)

---

## 📚 DOCUMENTACIÓN RELACIONADA

- [Upload](../upload/) - Sistema de subida
- [Telemetría](../telemetria/) - Datos CAN/GPS
- [IA](../ia/) - Análisis IA
- [Reportes](../reportes/) - Reportes PDF

---

## 🔄 ACTUALIZACIÓN

**Fecha:** Octubre 2025  
**Versión:** 1.0  
**Estado:** ✅ Operativo

---

**DobackSoft © 2025**

