import {
    ArrowPathIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentArrowDownIcon,
    InformationCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Grid,
    IconButton,
    LinearProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../utils/logger';

interface ProcessingFile {
    id: string;
    filename: string;
    type: 'CAN' | 'GPS' | 'ESTABILIDAD' | 'ROTATIVO';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    vehicle_id: string;
    vehicle_name: string;
    organization_id: string;
    uploaded_at: string;
    processed_at?: string;
    error_message?: string;
    records_processed?: number;
    total_records?: number;
    file_size: number;
}

interface ProcessingStats {
    totalFiles: number;
    pendingFiles: number;
    processingFiles: number;
    completedFiles: number;
    failedFiles: number;
    totalRecords: number;
    processedRecords: number;
    avgProcessingTime: number;
}

interface ProcessingEvent {
    id: string;
    file_id: string;
    filename: string;
    event_type: 'upload' | 'start_processing' | 'progress' | 'complete' | 'error';
    message: string;
    timestamp: string;
    details?: any;
}

interface ProcessingTrackingDashboardProps {
    autoRefresh?: boolean;
    refreshInterval?: number;
}

export const ProcessingTrackingDashboard: React.FC<ProcessingTrackingDashboardProps> = ({
    autoRefresh = true,
    refreshInterval = 30000
}) => {
    const { user } = useAuth();
    const [files, setFiles] = useState<ProcessingFile[]>([]);
    const [stats, setStats] = useState<ProcessingStats | null>(null);
    const [events, setEvents] = useState<ProcessingEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cargar archivos de procesamiento
    const loadProcessingFiles = useCallback(async () => {
        if (!user?.organizationId) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/processing/files?organizationId=${user.organizationId}&limit=100`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setFiles(data.data || []);
                }
            }
        } catch (error) {
            logger.warn('Error cargando archivos de procesamiento, usando datos mock:', error);

            // Datos mock para Bomberos Madrid
            const mockFiles: ProcessingFile[] = [
                {
                    id: 'file-1',
                    filename: 'CAN_DOBACK001_2024-01-15_001.txt',
                    type: 'CAN',
                    status: 'completed',
                    progress: 100,
                    vehicle_id: 'DOBACK001',
                    vehicle_name: 'Bomba Escalera 1',
                    organization_id: user.organizationId,
                    uploaded_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    processed_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
                    records_processed: 15420,
                    total_records: 15420,
                    file_size: 2048576
                },
                {
                    id: 'file-2',
                    filename: 'GPS_DOBACK002_2024-01-15_001.txt',
                    type: 'GPS',
                    status: 'processing',
                    progress: 65,
                    vehicle_id: 'DOBACK002',
                    vehicle_name: 'Bomba Escalera 2',
                    organization_id: user.organizationId,
                    uploaded_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                    records_processed: 9800,
                    total_records: 15000,
                    file_size: 1536000
                },
                {
                    id: 'file-3',
                    filename: 'ESTABILIDAD_DOBACK003_2024-01-15_001.txt',
                    type: 'ESTABILIDAD',
                    status: 'pending',
                    progress: 0,
                    vehicle_id: 'DOBACK003',
                    vehicle_name: 'Ambulancia 1',
                    organization_id: user.organizationId,
                    uploaded_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
                    total_records: 8750,
                    file_size: 1024000
                },
                {
                    id: 'file-4',
                    filename: 'ROTATIVO_DOBACK001_2024-01-15_001.txt',
                    type: 'ROTATIVO',
                    status: 'failed',
                    progress: 45,
                    vehicle_id: 'DOBACK001',
                    vehicle_name: 'Bomba Escalera 1',
                    organization_id: user.organizationId,
                    uploaded_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
                    error_message: 'Error de formato en línea 1234: datos corruptos',
                    records_processed: 5600,
                    total_records: 12400,
                    file_size: 987654
                }
            ];
            setFiles(mockFiles);
        } finally {
            setLoading(false);
        }
    }, [user?.organizationId]);

    // Cargar estadísticas de procesamiento
    const loadProcessingStats = useCallback(async () => {
        if (!user?.organizationId) return;

        try {
            const response = await fetch(`/api/processing/stats?organizationId=${user.organizationId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setStats(data.data);
                }
            }
        } catch (error) {
            logger.warn('Error cargando estadísticas, usando datos mock:', error);

            // Calcular estadísticas de los archivos mock
            const mockStats: ProcessingStats = {
                totalFiles: files.length,
                pendingFiles: files.filter(f => f.status === 'pending').length,
                processingFiles: files.filter(f => f.status === 'processing').length,
                completedFiles: files.filter(f => f.status === 'completed').length,
                failedFiles: files.filter(f => f.status === 'failed').length,
                totalRecords: files.reduce((sum, f) => sum + (f.total_records || 0), 0),
                processedRecords: files.reduce((sum, f) => sum + (f.records_processed || 0), 0),
                avgProcessingTime: 180 // 3 minutos promedio
            };
            setStats(mockStats);
        }
    }, [user?.organizationId, files]);

    // Cargar eventos de procesamiento
    const loadProcessingEvents = useCallback(async () => {
        if (!user?.organizationId) return;

        try {
            const response = await fetch(`/api/processing/events?organizationId=${user.organizationId}&limit=50`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setEvents(data.data || []);
                }
            }
        } catch (error) {
            logger.warn('Error cargando eventos, usando datos mock:', error);

            // Datos mock para eventos
            const mockEvents: ProcessingEvent[] = [
                {
                    id: 'event-1',
                    file_id: 'file-2',
                    filename: 'GPS_DOBACK002_2024-01-15_001.txt',
                    event_type: 'progress',
                    message: 'Procesando registros GPS: 9800/15000 (65%)',
                    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                    details: { progress: 65, records_processed: 9800, total_records: 15000 }
                },
                {
                    id: 'event-2',
                    file_id: 'file-1',
                    filename: 'CAN_DOBACK001_2024-01-15_001.txt',
                    event_type: 'complete',
                    message: 'Procesamiento completado exitosamente',
                    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                    details: { records_processed: 15420, processing_time: 180 }
                },
                {
                    id: 'event-3',
                    file_id: 'file-4',
                    filename: 'ROTATIVO_DOBACK001_2024-01-15_001.txt',
                    event_type: 'error',
                    message: 'Error de formato en línea 1234: datos corruptos',
                    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
                    details: { error_line: 1234, error_type: 'format_error' }
                }
            ];
            setEvents(mockEvents);
        }
    }, [user?.organizationId]);

    useEffect(() => {
        loadProcessingFiles();
    }, [loadProcessingFiles]);

    useEffect(() => {
        if (files.length > 0) {
            loadProcessingStats();
            loadProcessingEvents();
        }
    }, [files, loadProcessingStats, loadProcessingEvents]);

    // Auto-refresh
    useEffect(() => {
        if (autoRefresh && refreshInterval > 0) {
            const interval = setInterval(() => {
                loadProcessingFiles();
                loadProcessingStats();
                loadProcessingEvents();
            }, refreshInterval);

            return () => clearInterval(interval);
        }
    }, [autoRefresh, refreshInterval, loadProcessingFiles, loadProcessingStats, loadProcessingEvents]);

    // Reprocesar archivo
    const reprocessFile = useCallback(async (fileId: string) => {
        if (!user?.organizationId) return false;

        try {
            const response = await fetch(`/api/processing/files/${fileId}/reprocess`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    organizationId: user.organizationId
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    loadProcessingFiles();
                    logger.info('Archivo enviado a reprocesamiento', { fileId, userId: user?.id });
                    return true;
                }
            }
            return false;
        } catch (error) {
            logger.error('Error reprocesando archivo:', error);
            setError('Error al reprocesar el archivo');
            return false;
        }
    }, [user?.organizationId, user?.id, loadProcessingFiles]);

    // Eliminar archivo
    const deleteFile = useCallback(async (fileId: string) => {
        if (!user?.organizationId) return;

        try {
            const response = await fetch(`/api/processing/files/${fileId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    loadProcessingFiles();
                    logger.info('Archivo eliminado', { fileId, userId: user?.id });
                }
            }
        } catch (error) {
            logger.error('Error eliminando archivo:', error);
            setError('Error al eliminar el archivo');
        }
    }, [user?.organizationId, user?.id, loadProcessingFiles]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'success';
            case 'processing': return 'info';
            case 'pending': return 'warning';
            case 'failed': return 'error';
            default: return 'default';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircleIcon className="h-5 w-5" />;
            case 'processing': return <ArrowPathIcon className="h-5 w-5 animate-spin" />;
            case 'pending': return <ClockIcon className="h-5 w-5" />;
            case 'failed': return <XCircleIcon className="h-5 w-5" />;
            default: return <InformationCircleIcon className="h-5 w-5" />;
        }
    };

    const formatFileSize = (bytes: number) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    // const formatDuration = (seconds: number) => {
    //     const minutes = Math.floor(seconds / 60);
    //     const remainingSeconds = seconds % 60;
    //     return `${minutes}m ${remainingSeconds}s`;
    // };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Tracking de Procesamiento de Archivos
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<ArrowPathIcon className="h-5 w-5" />}
                    onClick={loadProcessingFiles}
                    disabled={loading}
                >
                    Actualizar
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Estadísticas */}
            {stats && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography color="text.secondary" gutterBottom>
                                            Total Archivos
                                        </Typography>
                                        <Typography variant="h4">
                                            {stats.totalFiles}
                                        </Typography>
                                    </Box>
                                    <DocumentArrowDownIcon className="h-8 w-8 text-blue-500" />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography color="text.secondary" gutterBottom>
                                            Procesando
                                        </Typography>
                                        <Typography variant="h4">
                                            {stats.processingFiles}
                                        </Typography>
                                    </Box>
                                    <ArrowPathIcon className="h-8 w-8 text-orange-500 animate-spin" />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography color="text.secondary" gutterBottom>
                                            Completados
                                        </Typography>
                                        <Typography variant="h4">
                                            {stats.completedFiles}
                                        </Typography>
                                    </Box>
                                    <CheckCircleIcon className="h-8 w-8 text-green-500" />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography color="text.secondary" gutterBottom>
                                            Con Errores
                                        </Typography>
                                        <Typography variant="h4">
                                            {stats.failedFiles}
                                        </Typography>
                                    </Box>
                                    <XCircleIcon className="h-8 w-8 text-red-500" />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            <Grid container spacing={3}>
                {/* Lista de Archivos */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Archivos de Procesamiento ({files.length})
                            </Typography>
                            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Archivo</TableCell>
                                            <TableCell>Vehículo</TableCell>
                                            <TableCell>Tipo</TableCell>
                                            <TableCell>Estado</TableCell>
                                            <TableCell>Progreso</TableCell>
                                            <TableCell>Tamaño</TableCell>
                                            <TableCell>Acciones</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center">
                                                    <CircularProgress size={24} />
                                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                                        Cargando archivos...
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : files.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center">
                                                    <Typography variant="body2" color="text.secondary">
                                                        No hay archivos de procesamiento
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            files.map((file) => (
                                                <TableRow key={file.id} hover>
                                                    <TableCell>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="medium">
                                                                {file.filename}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {new Date(file.uploaded_at).toLocaleString('es-ES')}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {file.vehicle_name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {file.vehicle_id}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={file.type}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            icon={getStatusIcon(file.status)}
                                                            label={file.status.toUpperCase()}
                                                            size="small"
                                                            color={getStatusColor(file.status) as any}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={file.progress}
                                                                sx={{ width: 60 }}
                                                            />
                                                            <Typography variant="caption">
                                                                {file.progress}%
                                                            </Typography>
                                                        </Box>
                                                        {file.records_processed && file.total_records && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {file.records_processed}/{file.total_records} registros
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {formatFileSize(file.file_size)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            {file.status === 'failed' && (
                                                                <Tooltip title="Reprocesar">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => reprocessFile(file.id)}
                                                                    >
                                                                        <ArrowPathIcon className="h-4 w-4" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                            <Tooltip title="Eliminar">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => deleteFile(file.id)}
                                                                    color="error"
                                                                >
                                                                    <XCircleIcon className="h-4 w-4" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Eventos Recientes */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Eventos Recientes ({events.length})
                            </Typography>
                            <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
                                {events.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary" align="center">
                                        No hay eventos recientes
                                    </Typography>
                                ) : (
                                    events.map((event) => (
                                        <Box key={event.id} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                {event.event_type === 'complete' && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
                                                {event.event_type === 'error' && <XCircleIcon className="h-4 w-4 text-red-500" />}
                                                {event.event_type === 'progress' && <ArrowPathIcon className="h-4 w-4 text-blue-500" />}
                                                {event.event_type === 'upload' && <DocumentArrowDownIcon className="h-4 w-4 text-gray-500" />}
                                                <Typography variant="caption" fontWeight="medium">
                                                    {event.event_type.toUpperCase()}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(event.timestamp).toLocaleTimeString('es-ES')}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                {event.filename}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {event.message}
                                            </Typography>
                                        </Box>
                                    ))
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};