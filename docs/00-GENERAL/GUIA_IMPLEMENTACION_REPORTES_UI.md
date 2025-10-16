# 🎯 GUÍA COMPLETA: IMPLEMENTACIÓN UI DE REPORTES

**Estado:** LISTA PARA IMPLEMENTAR  
**Fecha:** 2025-10-11  
**Tiempo Estimado:** 30 minutos

---

## 📋 PASOS DE IMPLEMENTACIÓN

### **PASO 1: Migrar Base de Datos (5 min)**

```powershell
# En la terminal del backend
cd backend
npx prisma migrate dev --name add-session-processing-reports
npx prisma generate
```

Esto creará la tabla `SessionProcessingReport` en PostgreSQL.

---

### **PASO 2: Actualizar UnifiedFileProcessor (YA HECHO)**

El archivo `backend/src/services/UnifiedFileProcessor.ts` ya guarda las métricas de calidad.
Solo necesitamos añadir el guardado del reporte completo.

**Añadir al final del archivo antes del export:**

```typescript
// Al final de procesarGrupoArchivos(), después de guardar la sesión:
await this.guardarReporteProces

amiento(sessionId, {
    filesProcessed: {
        gps: gpsResult ? {
            fileName: grupo.archivos.gps?.nombre || '',
            linesTotal: gpsResult.estadisticas.total,
            linesValid: gpsResult.estadisticas.validas,
            linesInvalid: gpsResult.estadisticas.coordenadasInvalidas + gpsResult.estadisticas.sinSenal,
            errors: gpsResult.problemas
        } : null,
        estabilidad: estabilidadResult ? {
            fileName: grupo.archivos.estabilidad?.nombre || '',
            linesTotal: estabilidadResult.estadisticas.total,
            linesValid: estabilidadResult.estadisticas.validas,
            errors: estabilidadResult.problemas
        } : null,
        rotativo: rotativoResult ? {
            fileName: grupo.archivos.rotativo?.nombre || '',
            linesTotal: rotativoResult.estadisticas.total,
            linesValid: rotativoResult.estadisticas.validas,
            errors: rotativoResult.problemas
        } : null
    },
    gpsMetrics: gpsResult?.estadisticas || {},
    stabilityMetrics: estabilidadResult?.estadisticas || {},
    rotativoMetrics: rotativoResult?.estadisticas || {},
    status: 'SUCCESS',
    warnings: [],
    errors: []
});
```

---

### **PASO 3: Crear Endpoint de API**

Crear `backend/src/routes/sessionReports.ts`:

```typescript
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, extractOrganizationId } from '../middleware/auth';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('SessionReports');

router.use(requireAuth, extractOrganizationId);

/**
 * GET /api/sessions/:sessionId/report
 * Obtiene el reporte detallado de una sesión
 */
router.get('/:sessionId/report', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const organizationId = (req as any).organizationId;

        // Verificar que la sesión pertenece a la organización
        const session = await prisma.session.findFirst({
            where: {
                id: sessionId,
                organizationId
            },
            include: {
                vehicle: {
                    select: {
                        identifier: true,
                        name: true
                    }
                },
                dataQualityMetrics: true,
                processingReport: true
            }
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Sesión no encontrada'
            });
        }

        res.json({
            success: true,
            data: {
                sessionId: session.id,
                vehicleId: session.vehicle.identifier,
                vehicleName: session.vehicle.name,
                startTime: session.startTime,
                endTime: session.endTime,
                qualityMetrics: session.dataQualityMetrics,
                processingReport: session.processingReport
            }
        });

    } catch (error: any) {
        logger.error('Error obteniendo reporte de sesión', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/sessions/recent
 * Lista las sesiones recientes con sus reportes
 */
router.get('/recent', async (req, res) => {
    try {
        const organizationId = (req as any).organizationId;
        const limit = parseInt(req.query.limit as string) || 20;

        const sessions = await prisma.session.findMany({
            where: { organizationId },
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                vehicle: {
                    select: {
                        identifier: true,
                        name: true
                    }
                },
                dataQualityMetrics: true,
                processingReport: true
            }
        });

        res.json({
            success: true,
            data: sessions.map(s => ({
                sessionId: s.id,
                vehicleId: s.vehicle.identifier,
                vehicleName: s.vehicle.name,
                startTime: s.startTime,
                endTime: s.endTime,
                hasReport: !!s.processingReport,
                qualitySummary: s.dataQualityMetrics ? {
                    gpsValid: s.dataQualityMetrics.porcentajeGPSValido,
                    hasIssues: (s.dataQualityMetrics.gpsSinSenal || 0) > 10
                } : null
            }))
        });

    } catch (error: any) {
        logger.error('Error obteniendo sesiones recientes', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

export default router;
```

**Registrar en `backend/src/routes/index.ts`:**

```typescript
import sessionReportsRouter from './sessionReports';

// Añadir después de otras rutas:
router.use('/sessions', sessionReportsRouter);
```

---

### **PASO 4: Crear Componente React de Reporte**

Crear `frontend/src/components/SessionReportModal.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import {
    Box,
    Modal,
    Typography,
    IconButton,
    Card,
    CardContent,
    Grid,
    Chip,
    LinearProgress,
    Alert,
    Divider,
    List,
    ListItem,
    ListItemText,
    CircularProgress
} from '@mui/material';
import {
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Error as ErrorIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';
import { logger } from '../utils/logger';

interface SessionReportModalProps {
    sessionId: string | null;
    onClose: () => void;
}

interface SessionReport {
    sessionId: string;
    vehicleId: string;
    vehicleName: string;
    startTime: string;
    endTime: string;
    qualityMetrics: {
        gpsTotal: number;
        gpsValidas: number;
        gpsSinSenal: number;
        porcentajeGPSValido: number;
        estabilidadTotal: number;
        estabilidadValidas: number;
        rotativoTotal: number;
        rotativoValidas: number;
    };
    processingReport?: {
        status: string;
        warnings: string[];
        errors: string[];
        filesProcessed: any;
        gpsMetrics: any;
    };
}

export const SessionReportModal: React.FC<SessionReportModalProps> = ({
    sessionId,
    onClose
}) => {
    const [report, setReport] = useState<SessionReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (sessionId) {
            fetchReport();
        }
    }, [sessionId]);

    const fetchReport = async () => {
        if (!sessionId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await apiService.get(`/api/sessions/${sessionId}/report`);
            
            if (response.success) {
                setReport(response.data);
            } else {
                setError(response.error || 'Error obteniendo reporte');
            }
        } catch (err: any) {
            logger.error('Error fetching session report', { error: err.message });
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    if (!sessionId) return null;

    return (
        <Modal
            open={!!sessionId}
            onClose={onClose}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Box
                sx={{
                    width: '90%',
                    maxWidth: 900,
                    maxHeight: '90vh',
                    overflow: 'auto',
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 24,
                    p: 4
                }}
            >
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5">
                        📊 Reporte de Procesamiento
                    </Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Loading */}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                )}

                {/* Error */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Report Content */}
                {report && !loading && (
                    <Box>
                        {/* Información General */}
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Información General
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Vehículo
                                        </Typography>
                                        <Typography variant="body1">
                                            {report.vehicleName} ({report.vehicleId})
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Sesión
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontSize: '0.9rem' }}>
                                            {report.sessionId.substring(0, 8)}...
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Inicio
                                        </Typography>
                                        <Typography variant="body1">
                                            {new Date(report.startTime).toLocaleString('es-ES')}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Fin
                                        </Typography>
                                        <Typography variant="body1">
                                            {new Date(report.endTime).toLocaleString('es-ES')}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Calidad GPS */}
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    📍 Calidad GPS
                                </Typography>
                                
                                <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">
                                            GPS Válido
                                        </Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {report.qualityMetrics.porcentajeGPSValido.toFixed(1)}%
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={report.qualityMetrics.porcentajeGPSValido}
                                        sx={{
                                            height: 10,
                                            borderRadius: 5,
                                            bgcolor: 'grey.200',
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor: report.qualityMetrics.porcentajeGPSValido > 80
                                                    ? 'success.main'
                                                    : report.qualityMetrics.porcentajeGPSValido > 50
                                                        ? 'warning.main'
                                                        : 'error.main'
                                            }
                                        }}
                                    />
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={4}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="success.main">
                                                {report.qualityMetrics.gpsValidas}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                GPS Válidos
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="error.main">
                                                {report.qualityMetrics.gpsSinSenal}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Sin Señal
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4">
                                                {report.qualityMetrics.gpsTotal}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Total
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Estabilidad y Rotativo */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            📊 Estabilidad
                                        </Typography>
                                        <Typography variant="h3" color="primary.main">
                                            {report.qualityMetrics.estabilidadValidas}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            de {report.qualityMetrics.estabilidadTotal} mediciones
                                        </Typography>
                                        <Chip
                                            icon={<CheckCircleIcon />}
                                            label={`${((report.qualityMetrics.estabilidadValidas / report.qualityMetrics.estabilidadTotal) * 100).toFixed(1)}% válidas`}
                                            color="success"
                                            size="small"
                                            sx={{ mt: 1 }}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            🚨 Rotativo
                                        </Typography>
                                        <Typography variant="h3" color="secondary.main">
                                            {report.qualityMetrics.rotativoValidas}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            de {report.qualityMetrics.rotativoTotal} estados
                                        </Typography>
                                        <Chip
                                            icon={<CheckCircleIcon />}
                                            label={`${((report.qualityMetrics.rotativoValidas / report.qualityMetrics.rotativoTotal) * 100).toFixed(1)}% válidas`}
                                            color="success"
                                            size="small"
                                            sx={{ mt: 1 }}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Advertencias */}
                        {report.processingReport?.warnings && report.processingReport.warnings.length > 0 && (
                            <Card sx={{ mb: 3 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <WarningIcon color="warning" />
                                        Advertencias
                                    </Typography>
                                    <List dense>
                                        {report.processingReport.warnings.map((warning, idx) => (
                                            <ListItem key={idx}>
                                                <ListItemText
                                                    primary={warning}
                                                    primaryTypographyProps={{ variant: 'body2' }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </CardContent>
                            </Card>
                        )}

                        {/* Errores */}
                        {report.processingReport?.errors && report.processingReport.errors.length > 0 && (
                            <Card sx={{ mb: 3 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ErrorIcon color="error" />
                                        Errores
                                    </Typography>
                                    <List dense>
                                        {report.processingReport.errors.map((error, idx) => (
                                            <ListItem key={idx}>
                                                <ListItemText
                                                    primary={error}
                                                    primaryTypographyProps={{ variant: 'body2', color: 'error' }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </CardContent>
                            </Card>
                        )}
                    </Box>
                )}
            </Box>
        </Modal>
    );
};
```

---

### **PASO 5: Integrar en FileUploadManager**

Actualizar `frontend/src/components/FileUploadManager.tsx`:

```typescript
// Al inicio, importar el modal
import { SessionReportModal } from './SessionReportModal';

// En el componente, añadir estado
const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

// En la tabla de resultados, añadir botón
<Button
    size="small"
    variant="outlined"
    onClick={() => setSelectedSessionId(session.sessionId)}
>
    Ver Reporte
</Button>

// Al final del return, antes del cierre
<SessionReportModal
    sessionId={selectedSessionId}
    onClose={() => setSelectedSessionId(null)}
/>
```

---

## ✅ VERIFICACIÓN

Después de implementar:

1. ✅ Backend reiniciado
2. ✅ Migración ejecutada
3. ✅ Procesar un archivo
4. ✅ Ver resultado en UI
5. ✅ Clic en "Ver Reporte"
6. ✅ Ver modal con métricas detalladas

---

**RESULTADO ESPERADO:**

```
📊 Reporte de Procesamiento

Información General:
- Vehículo: DOBACK001
- Inicio: 11/10/2025 10:00:00
- Fin: 11/10/2025 12:30:00

📍 Calidad GPS: 95.6%
✅ GPS Válidos: 1180
❌ Sin Señal: 20
📊 Total: 1234

📊 Estabilidad: 2456 mediciones (100% válidas)
🚨 Rotativo: 345 estados (100% válidas)

⚠️ Advertencias:
- Salto GPS de 1234m detectado en línea 789
- Latitud fuera de rango España en línea 123

✅ PROCESAMIENTO EXITOSO
```

---

**Tiempo Total:** 30 minutos  
**Estado:** LISTA PARA IMPLEMENTAR  
**Última actualización:** 2025-10-11 19:40

