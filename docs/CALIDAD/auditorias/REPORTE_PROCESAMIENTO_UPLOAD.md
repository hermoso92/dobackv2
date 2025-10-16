# 📊 ANÁLISIS Y SOLUCIÓN - SISTEMA DE UPLOAD

**Fecha:** 2025-10-11  
**Problemas Identificados:** 4 críticos

---

## 🚨 PROBLEMAS DETECTADOS

### **1. ✅ RESUELTO: Conexiones BD (Too many clients)**

**Causa:** Múltiples instancias de `PrismaClient` en 130+ archivos

**Solución Implementada:**
```typescript
// Creado: backend/src/lib/prisma.ts (Singleton)
export const prisma = globalForPrisma.prisma || new PrismaClient({...});

// Actualizado en archivos críticos:
- backend/src/services/UnifiedFileProcessor.ts
- backend/src/routes/upload-unified.ts
- backend/src/services/kpiCalculator.ts
- backend/src/services/OperationalKeyCalculator.ts
- backend/src/services/TemporalCorrelationService.ts
- backend/src/routes/upload.ts
```

**Estado:** ✅ **COMPLETADO** (archivos críticos actualizados)

**Próximo paso:** Actualizar los 124 archivos restantes (automatizable)

---

### **2. 🔍 PENDIENTE: GPS con Coordenadas Inválidas**

**Ejemplos detectados en logs:**
```
40.5754288, -355654.5833333  ← Longitud inválida
40.570735, -3.9275477        ← Latitud inválida (salto de ~600m)
0.575398, -3.927545          ← Latitud inválida (falta dígito)
4.0587252, -3.927541         ← Latitud inválida (fuera de España)
```

**Análisis:**
- Coordenadas válidas para España: lat 36-44, lon -10 a 5
- Problema en parseo de archivos GPS
- Necesita validación en `RobustGPSParser.ts`

**Solución Propuesta:**
1. Validar rangos de coordenadas
2. Detectar saltos GPS > 1km
3. Marcar como "GPS inválido" en lugar de procesar
4. Reportar en métricas de calidad

---

### **3. 📋 PENDIENTE: Sistema de Reportes Detallado**

**Requisito del Usuario:**
> "quiero un reporte detallado en la pagina de cada sesion y que ha pasado con cada una"

**Estructura Propuesta:**
```typescript
interface SessionReport {
    sessionId: string;
    vehicleId: string;
    startTime: Date;
    endTime: Date;
    
    // Archivos procesados
    filesProcessed: {
        gps: {
            fileName: string;
            linesTotal: number;
            linesValid: number;
            linesInvalid: number;
            errors: string[];
        };
        estabilidad: { /* similar */ };
        rotativo: { /* similar */ };
    };
    
    // Métricas de calidad
    quality: {
        gpsValidPercent: number;
        gpsInterpolatedCount: number;
        gpsInvalidCoords: number;
        jumpDetected: boolean;
        jumpDistance?: number;
    };
    
    // Eventos detectados
    events: {
        total: number;
        byType: Record<string, number>;
        critical: number;
    };
    
    // Status final
    status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
    warnings: string[];
    errors: string[];
}
```

**Componentes a Crear:**
1. **Backend:** `SessionReportService.ts`
2. **Backend:** Endpoint `/api/sessions/:id/report`
3. **Frontend:** `SessionReportModal.tsx` (componente visual)
4. **Frontend:** Integrar en `FileUploadManager.tsx`

---

### **4. 🔴 PENDIENTE: Botón de Borrar Sesiones**

**Análisis:** Necesita verificarse qué endpoint está fallando

---

## 🎯 PLAN DE ACCIÓN INMEDIATO

### **Prioridad 1: Validación GPS (30 min)**
1. Actualizar `RobustGPSParser.ts`
2. Añadir validación de rangos
3. Detectar saltos GPS
4. Añadir tests

### **Prioridad 2: Sistema de Reportes (1-2 horas)**
1. Crear `SessionReportService.ts`
2. Crear endpoint `/api/sessions/:id/report`
3. Modificar upload para guardar reportes
4. Crear componente React de visualización

### **Prioridad 3: UI Frontend (1 hora)**
1. Añadir modal de reporte por sesión
2. Mostrar métricas visuales (gráficas)
3. Lista de archivos procesados con iconos
4. Indicadores de calidad (verde/amarillo/rojo)

### **Prioridad 4: Prueba Completa (30 min)**
1. Borrar todas las sesiones
2. Procesar archivos desde `backend/data/CMadrid`
3. Verificar reportes generados
4. Verificar que no hay errores de conexión BD

---

## 📐 ARQUITECTURA DEL SISTEMA DE REPORTES

```
┌─────────────────────────────────────────────────────────┐
│                   UPLOAD PROCESO                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Usuario sube archivos                               │
│     ↓                                                    │
│  2. UnifiedFileProcessor procesa                        │
│     ├─ Parsea GPS (con validación nueva)                │
│     ├─ Parsea Estabilidad                               │
│     ├─ Parsea Rotativo                                  │
│     ↓                                                    │
│  3. Guarda en BD                                        │
│     ├─ Session                                          │
│     ├─ GpsMeasurement                                   │
│     ├─ StabilityMeasurement                             │
│     ├─ RotativoMeasurement                              │
│     ├─ DataQualityMetrics                               │
│     └─ **SessionProcessingReport** (NUEVO)              │
│     ↓                                                    │
│  4. Genera reporte detallado                            │
│     └─ SessionReportService.generateReport()            │
│     ↓                                                    │
│  5. Devuelve resultado                                  │
│     └─ Con URLs a reportes de cada sesión               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 ESTRUCTURA BASE DE DATOS NUEVA

```prisma
model SessionProcessingReport {
  id            String   @id @default(uuid())
  sessionId     String   @unique
  session       Session  @relation(fields: [sessionId], references: [id])
  
  // Archivos procesados
  filesProcessed Json    // { gps: {...}, estabilidad: {...}, rotativo: {...} }
  
  // Métricas detalladas
  gpsMetrics     Json    // { valid, invalid, interpolated, errors }
  stabilityMetrics Json
  rotativoMetrics  Json
  
  // Eventos y alertas
  eventsDetected Json   // { total, byType, critical }
  
  // Estado final
  status        String  // SUCCESS, PARTIAL, FAILED
  warnings      String[]
  errors        String[]
  
  // Timestamps
  processingStarted  DateTime
  processingEnded    DateTime
  processingDuration Int    // milisegundos
  
  createdAt     DateTime @default(now())
  
  @@index([sessionId])
  @@index([status])
}
```

---

## 🔧 IMPLEMENTACIÓN PASO A PASO

### **Paso 1: Actualizar Prisma Schema**
```bash
# En backend/prisma/schema.prisma añadir modelo SessionProcessingReport
npx prisma migrate dev --name add-session-processing-reports
```

### **Paso 2: Crear SessionReportService**
- Ubicación: `backend/src/services/SessionReportService.ts`
- Funciones:
  - `generateReport(sessionId): Promise<SessionReport>`
  - `saveReport(report): Promise<void>`
  - `getReport(sessionId): Promise<SessionReport>`
  - `listReports(filters): Promise<SessionReport[]>`

### **Paso 3: Actualizar UnifiedFileProcessor**
```typescript
// En cada sesión procesada, guardar reporte
const report = {
    filesProcessed: {
        gps: { fileName, linesTotal, linesValid, errors },
        // ...
    },
    quality: { gpsValidPercent, ... },
    events: { total, byType },
    status: 'SUCCESS',
    warnings: [],
    errors: []
};

await sessionReportService.saveReport(sessionId, report);
```

### **Paso 4: Crear Endpoint**
```typescript
// backend/src/routes/sessions.ts
router.get('/:sessionId/report', async (req, res) => {
    const report = await sessionReportService.getReport(req.params.sessionId);
    res.json(report);
});
```

### **Paso 5: Componente React**
```typescript
// frontend/src/components/SessionReportModal.tsx
interface Props {
    sessionId: string;
    onClose: () => void;
}

export const SessionReportModal: React.FC<Props> = ({ sessionId, onClose }) => {
    const [report, setReport] = useState<SessionReport | null>(null);
    
    useEffect(() => {
        fetchReport(sessionId).then(setReport);
    }, [sessionId]);
    
    return (
        <Modal>
            {/* Visualización detallada con gráficas */}
        </Modal>
    );
};
```

---

## ⏱️ ESTIMACIÓN DE TIEMPOS

| Tarea | Tiempo | Prioridad |
|-------|--------|-----------|
| Arreglar validación GPS | 30 min | 🔴 CRÍTICO |
| Crear SessionReportService | 45 min | 🔴 CRÍTICO |
| Añadir modelo Prisma | 15 min | 🔴 CRÍTICO |
| Crear endpoint /report | 20 min | 🟡 ALTA |
| Componente React visual | 60 min | 🟡 ALTA |
| Integrar en FileUploadManager | 30 min | 🟡 ALTA |
| Actualizar 124 archivos restantes | 20 min | 🟢 MEDIA |
| Testing completo | 30 min | 🟢 MEDIA |

**Total:** ~4 horas

---

## 📝 CHECKLIST DE VERIFICACIÓN

### **Antes de Probar:**
- [x] Singleton Prisma creado
- [x] Archivos críticos actualizados
- [ ] Validación GPS implementada
- [ ] SessionReportService creado
- [ ] Modelo Prisma migrado
- [ ] Endpoint de reporte creado
- [ ] Componente React creado

### **Durante Prueba:**
- [ ] Borrar todas las sesiones existentes
- [ ] Ejecutar procesamiento desde CMadrid
- [ ] Verificar logs: Sin "too many clients"
- [ ] Verificar logs: GPS válidos procesados
- [ ] Verificar BD: Reportes creados
- [ ] Verificar UI: Reportes visibles

### **Después de Prueba:**
- [ ] No hay errores de conexión
- [ ] GPS inválidos detectados y reportados
- [ ] Reportes muestran info detallada
- [ ] UI es clara y profesional

---

**ESTADO ACTUAL:** 
- ✅ Problema 1 resuelto (conexiones BD)
- 🔄 Trabajando en Problema 2 (validación GPS)
- ⏸️ Pendiente Problema 3 (reportes)
- ⏸️ Pendiente Problema 4 (botón borrar)

**Última actualización:** 2025-10-11 19:15

