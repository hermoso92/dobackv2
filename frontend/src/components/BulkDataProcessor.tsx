import {
    Storage as DataIcon,
    Error as ErrorIcon,
    ExpandMore as ExpandIcon,
    Speed as ProcessIcon,
    PlayArrow as StartIcon,
    CheckCircle as SuccessIcon
} from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    List,
    ListItem,
    ListItemText,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { logger } from '../utils/logger';

interface DataOverview {
    organizationId: string;
    stats: {
        totalVehicles: number;
        totalSessions: number;
        vehicles: Array<{
            name: string;
            sessionsCount: number;
            sessions: Array<{
                key: string;
                hasStability: boolean;
                hasCAN: boolean;
                hasGPS: boolean;
                hasRotativo: boolean;
            }>;
        }>;
    };
    availableOrganizations: string[];
}

interface ProcessingResult {
    sessionKey: string;
    vehicleName: string;
    success: boolean;
    sessionId?: string;
    sessionNumber?: number;
    dataInserted?: {
        stability: number;
        can: number;
        gps: number;
        rotativo: number;
    };
    eventsGenerated?: number;
    error?: string;
    warnings?: string[];
}

interface ProcessingSummary {
    organizationId: string;
    processingCompleted: boolean;
    timestamp: string;
    results: {
        totalVehicles: number;
        totalSessions: number;
        successfulSessions: number;
        failedSessions: number;
        vehiclesCreated: number;
        vehiclesSkipped: number;
        sessionsCreated: number;
        sessionsSkipped: number;
        errors: string[];
        warnings: string[];
        details: ProcessingResult[];
    };
}

const BulkDataProcessor: React.FC = () => {
    const [overview, setOverview] = useState<DataOverview | null>(null);
    const [processing, setProcessing] = useState(false);
    const [processingSummary, setProcessingSummary] = useState<ProcessingSummary | null>(null);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');

    useEffect(() => {
        loadDataOverview();
    }, []);

    const loadDataOverview = async () => {
        try {
            setError('');
            const response = await apiService.get('/api/bulk-processor/overview');

            if (response.success) {
                setOverview(response.data as DataOverview);
            } else {
                setError(response.error || 'Error al cargar la vista general');
            }
        } catch (error: any) {
            logger.error('Error cargando vista general:', error);
            setError('Error al cargar la vista general de datos');
        }
    };

    const startProcessing = async () => {
        setProcessing(true);
        setError('');
        setSuccess('');
        setProcessingSummary(null);

        try {
            const response = await apiService.post('/api/bulk-processor/process-all', {}, {
                timeout: 1800000 // 30 minutos para procesamiento masivo
            });

            if (response.success) {
                setSuccess(response.message || 'Procesamiento completado');
                setProcessingSummary((response as any).summary as ProcessingSummary);
            } else {
                setError(response.error || 'Error en el procesamiento masivo');
            }
        } catch (error: any) {
            logger.error('Error en procesamiento masivo:', error);
            setError('Error en el procesamiento masivo');
        } finally {
            setProcessing(false);
        }
    };

    const getFileTypeColor = (type: string) => {
        switch (type) {
            case 'CAN': return 'primary';
            case 'GPS': return 'success';
            case 'ESTABILIDAD': return 'warning';
            case 'ROTATIVO': return 'info';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Procesamiento Masivo de Datos
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Procesa automáticamente todos los archivos de la carpeta datosDoback. El sistema escaneará, agrupará y procesará todos los datos disponibles.
            </Typography>

            {/* Vista general de datos */}
            {overview && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <DataIcon sx={{ mr: 1 }} />
                            <Typography variant="h6">
                                Datos Disponibles - {overview.organizationId}
                            </Typography>
                        </Box>

                        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="h6" color="primary">
                                        {overview.stats.totalVehicles}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Vehículos
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="h6" color="success.main">
                                        {overview.stats.totalSessions}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Sesiones
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="h6" color="warning.main">
                                        {overview.availableOrganizations.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Organizaciones
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="h6" gutterBottom>
                            Vehículos Disponibles
                        </Typography>

                        {overview.stats.vehicles.map((vehicle, idx) => (
                            <Accordion key={idx} sx={{ mb: 1 }}>
                                <AccordionSummary expandIcon={<ExpandIcon />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                        <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                                            {vehicle.name}
                                        </Typography>
                                        <Chip
                                            label={`${vehicle.sessionsCount} sesiones`}
                                            size="small"
                                            color="success"
                                            sx={{ mr: 1 }}
                                        />
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Sesiones:
                                    </Typography>
                                    <List dense>
                                        {vehicle.sessions.map((session, sessionIdx) => (
                                            <ListItem key={sessionIdx}>
                                                <ListItemText
                                                    primary={session.key}
                                                    secondary={`Estabilidad: ${session.hasStability ? '✓' : '✗'} | CAN: ${session.hasCAN ? '✓' : '✗'} | GPS: ${session.hasGPS ? '✓' : '✗'} | Rotativo: ${session.hasRotativo ? '✓' : '✗'}`}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Botón de procesamiento */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Button
                    variant="contained"
                    size="large"
                    onClick={startProcessing}
                    disabled={processing || !overview || overview.stats.totalSessions === 0}
                    startIcon={processing ? <CircularProgress size={20} /> : <StartIcon />}
                    sx={{ minWidth: 250 }}
                >
                    {processing ? 'Procesando...' : 'Iniciar Procesamiento Masivo'}
                </Button>
            </Box>

            {/* Mensajes de estado */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}

            {/* Resumen de procesamiento */}
            {processingSummary && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <ProcessIcon sx={{ mr: 1 }} />
                            <Typography variant="h6">
                                Resumen del Procesamiento
                            </Typography>
                        </Box>

                        <Grid container spacing={2}>
                            <Grid item xs={6} md={3}>
                                <Typography variant="h6" color="primary">
                                    {processingSummary.results.totalSessions}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Sesiones Encontradas
                                </Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Typography variant="h6" color="success.main">
                                    {processingSummary.results.sessionsCreated}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Sesiones Creadas
                                </Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Typography variant="h6" color="warning.main">
                                    {processingSummary.results.vehiclesCreated}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Vehículos Creados
                                </Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Typography variant="h6" color="info.main">
                                    {processingSummary.results.successfulSessions}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Exitosas
                                </Typography>
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                            <Chip
                                icon={<SuccessIcon />}
                                label={`${processingSummary.results.successfulSessions} exitosas`}
                                color="success"
                            />
                            <Chip
                                icon={<ErrorIcon />}
                                label={`${processingSummary.results.failedSessions} fallidas`}
                                color="error"
                            />
                            <Chip
                                label={`${processingSummary.results.sessionsSkipped} omitidas`}
                                color="warning"
                            />
                        </Box>

                        {/* Errores */}
                        {processingSummary.results.errors.length > 0 && (
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="h6" color="error" gutterBottom>
                                    Errores ({processingSummary.results.errors.length})
                                </Typography>
                                <List dense>
                                    {processingSummary.results.errors.map((error, idx) => (
                                        <ListItem key={idx}>
                                            <ListItemText
                                                primary={error}
                                                sx={{ '& .MuiListItemText-primary': { color: 'error.main' } }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        )}

                        {/* Detalles de sesiones */}
                        {processingSummary.results.details.length > 0 && (
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Detalles de Sesiones ({processingSummary.results.details.length})
                                </Typography>
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandIcon />}>
                                        <Typography>Ver detalles completos</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <List dense>
                                            {processingSummary.results.details.map((detail, idx) => (
                                                <ListItem key={idx}>
                                                    <ListItemText
                                                        primary={`${detail.vehicleName} - ${detail.sessionKey}`}
                                                        secondary={
                                                            detail.success ?
                                                                `Sesión ${detail.sessionNumber} creada. Datos: Estabilidad(${detail.dataInserted?.stability}), CAN(${detail.dataInserted?.can}), GPS(${detail.dataInserted?.gps}), Rotativo(${detail.dataInserted?.rotativo}). Eventos: ${detail.eventsGenerated}` :
                                                                `Error: ${detail.error}`
                                                        }
                                                        sx={{
                                                            '& .MuiListItemText-primary': {
                                                                color: detail.success ? 'success.main' : 'error.main',
                                                                fontWeight: 'bold'
                                                            }
                                                        }}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </AccordionDetails>
                                </Accordion>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default BulkDataProcessor; 