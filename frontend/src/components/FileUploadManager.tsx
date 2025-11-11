import {
    Add as AddIcon,
    Error as AlertCircleIcon,
    Assessment as AssessmentIcon,
    AutoAwesome as AutoAwesomeIcon,
    BarChart as BarChartIcon,
    CheckCircle as CheckCircleIcon,
    Delete as DeleteIcon,
    Download as DownloadIcon,
    Description as FileTextIcon,
    PlayArrow as PlayArrowIcon,
    CloudUpload as UploadIcon,
    Warning as ExclamationTriangleIcon
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    IconButton,
    LinearProgress,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Paper,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Typography
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { FEATURE_FLAGS, isFeatureEnabled } from '../config/features';
import { apiService } from '../services/api';
import { logger } from '../utils/logger';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/auth';
import { SimpleProcessingReport } from './SimpleProcessingReport';
import { UploadConfigPanel } from './UploadConfigPanel';

interface UploadedFile {
    name: string;
    size: number;
    uploadDate: string;
    type: string;
}

interface FileGroup {
    vehicleId: string;
    date: string;
    files: {
        [key: string]: {
            fileName: string;
            sessionsCount: number;
            measurementsCount: number;
            fileSize: number;
        };
    };
    sessions: {
        [key: string]: Array<{
            sessionNumber: number;
            startTime: string;
            measurementsCount: number;
        }>;
    };
    totalSessions: number;
    totalMeasurements: number;
}

interface UploadResult {
    totalFiles: number;
    vehicleGroups: number;
    results: FileGroup[];
    errors?: Array<{
        file: string;
        error: string;
    }>;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`upload-tabpanel-${index}`}
            aria-labelledby={`upload-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const FileUploadManager: React.FC = () => {
    const { user } = useAuth();
    const currentUser = user ?? authService.getCurrentUser();
    const isAdmin = currentUser?.role === 'ADMIN';
    const isManager = currentUser?.role === 'MANAGER';
    const canManageDatabase = isAdmin || isManager;

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [recentSessions, setRecentSessions] = useState<any[]>([]);

    // Estados para pestañas y procesamiento automático
    const [currentTab, setCurrentTab] = useState(0);
    const [isProcessingAuto, setIsProcessingAuto] = useState(false);
    const [autoProcessProgress, setAutoProcessProgress] = useState(0);
    const [autoProcessResults, setAutoProcessResults] = useState<any>(null);
    const [autoProcessError, setAutoProcessError] = useState<string | null>(null);
    const [showReportModal, setShowReportModal] = useState(false);

    // ✅ NUEVO: Estados para regeneración de eventos
    const [isRegeneratingEvents, setIsRegeneratingEvents] = useState(false);

    // ✅ NUEVO: Estados para borrar todos los datos
    const [showDeleteAllConfirmation, setShowDeleteAllConfirmation] = useState(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    // ✅ NUEVO: Estados para limpiar base de datos (botón secundario)
    const [showCleanDBConfirmation, setShowCleanDBConfirmation] = useState(false);
    const [isCleaningDB, setIsCleaningDB] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ✅ NUEVO: Función para borrar todos los datos
    const handleDeleteAllData = async () => {
        try {
            setIsDeletingAll(true);
            logger.warn('🚨 Iniciando borrado total de datos');

            const response = await apiService.post('/api/admin/delete-all-data', {
                confirmacion: 'ELIMINAR_TODO'
            });

            if (response.success) {
                logger.info('✅ Todos los datos han sido eliminados', response.data);
                
                // Limpiar estados locales
                setUploadResult(null);
                setRecentSessions([]);
                setAutoProcessResults(null);
                setSelectedFiles([]);
                setUploadError(null);
                setAutoProcessError(null);
                
                // Limpiar localStorage
                localStorage.removeItem('lastProcessingReport');

                alert('✅ Todos los datos han sido eliminados exitosamente');
            } else {
                throw new Error(response.error || 'Error desconocido');
            }

        } catch (error: any) {
            logger.error('❌ Error al eliminar datos:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
            alert(`❌ Error al eliminar datos: ${errorMessage}`);
        } finally {
            setIsDeletingAll(false);
            setShowDeleteAllConfirmation(false);
        }
    };

    // ✅ MEJORA: Cargar reporte con cleanup para evitar memory leaks
    useEffect(() => {
        let mounted = true;

        const loadLastReport = async () => {
            if (!mounted) return;

            try {
                // 1. Intentar cargar desde localStorage
                const savedReport = localStorage.getItem('lastProcessingReport');
                if (savedReport && mounted) {
                    const report = JSON.parse(savedReport);
                    setAutoProcessResults(report);
                    logger.info('📊 Reporte de procesamiento cargado desde localStorage', report);
                }

                // 2. Intentar cargar desde la API (último reporte guardado en BD)
                try {
                    const response = await apiService.get('/api/processing-reports/latest');
                    if (mounted && response && (response as any).reportData) {
                        setAutoProcessResults((response as any).reportData);
                        logger.info('📊 Reporte de procesamiento cargado desde API', (response as any).reportData);
                    }
                } catch (apiError) {
                    if (mounted) {
                        logger.warn('No se pudo cargar el reporte desde la API:', apiError);
                    }
                }
            } catch (error) {
                if (mounted) {
                    logger.error('Error cargando reporte:', error);
                }
            }
        };

        loadLastReport();

        return () => {
            mounted = false;
        };
    }, []);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length > 0) {
            // Validar formato de archivos
            const validFiles: File[] = [];
            const errors: string[] = [];

            files.forEach(file => {
                const fileNamePattern = /^(ESTABILIDAD|GPS|ROTATIVO|CAN)_DOBACK\d+_\d{8}\.txt$/;
                if (fileNamePattern.test(file.name)) {
                    validFiles.push(file);
                } else {
                    errors.push(`Formato inválido: ${file.name}`);
                }
            });

            if (errors.length > 0) {
                setUploadError(errors.join(', '));
            } else {
                setSelectedFiles(prev => [...prev, ...validFiles]);
                setUploadError(null);
            }
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const clearAllFiles = () => {
        setSelectedFiles([]);
        setUploadResult(null);
        setUploadError(null);
    };

    const handleMultipleUpload = async () => {
        if (selectedFiles.length === 0) return;

        setUploading(true);
        setUploadError(null);

        try {
            // ✅ MEJORA: Limpieza BD solo si feature flag está activo (testing/dev)
            if (isFeatureEnabled('allowDatabaseCleanup')) {
                logger.warn('🧹 [TESTING MODE] Limpiando base de datos antes de subir archivos...');
                try {
                    const cleanResponse = await apiService.post('/api/clean-all-sessions', {});
                    if (cleanResponse.success) {
                        logger.info('✅ Base de datos limpiada correctamente', cleanResponse.data);
                    } else {
                        logger.warn('⚠️ No se pudo limpiar la base de datos, continuando con la subida...');
                    }
                } catch (cleanError) {
                    logger.warn('⚠️ Error al limpiar base de datos, continuando con la subida...', cleanError);
                }
            }

            // PASO 1: Subir archivos
            logger.info('📤 Subiendo archivos...');
            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('files', file);
            });

            // ✅ MEJORA: Timeout aumentado de 2 min → configurable (5 min en prod, 10 min en dev)
            const response = await apiService.post('/api/upload/multiple', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: FEATURE_FLAGS.uploadTimeoutMs
            });

            if (response.success) {
                setUploadResult(response.data as UploadResult);
                setSelectedFiles([]);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                fetchUploadedFiles();
                logger.info('✅ Archivos subidos correctamente');
            } else {
                setUploadError(response.error || 'Error subiendo archivos');
            }
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.message || 'Error de conexión al subir archivos';
            setUploadError(errorMessage);
            logger.error('Error al subir archivos:', error);
        } finally {
            setUploading(false);
        }
    };

    const fetchUploadedFiles = async () => {
        try {
            const response = await apiService.get('/api/upload/files');
            if (response.success && response.data) {
                setUploadedFiles((response.data as any).files || []);
            } else {
                setUploadedFiles([]);
            }
        } catch (error) {
            logger.error('Error obteniendo archivos:', error);
            setUploadedFiles([]);
            // Mostrar mensaje de error más claro al usuario
            setUploadError('El servidor backend no está respondiendo correctamente. Por favor, verifica que el servidor esté ejecutándose.');
        }
    };

    const analyzeCMadrid = async () => {
        setLoadingAnalysis(true);
        try {
            const response = await apiService.get('/api/upload/analyze-cmadrid');
            if (response.success && response.data) {
                setAnalysisData((response.data as any).analysis);
            } else {
                setUploadError(response.error || 'Error analizando archivos');
                setAnalysisData(null);
            }
        } catch (error) {
            setUploadError('Error de conexión al analizar archivos');
            setAnalysisData(null);
        } finally {
            setLoadingAnalysis(false);
        }
    };

    const fetchRecentSessions = async () => {
        try {
            const response = await apiService.get('/api/upload/recent-sessions');
            if (response.success && response.data) {
                setRecentSessions((response.data as any).sessions || []);
            } else {
                setRecentSessions([]);
            }
        } catch (error) {
            logger.error('Error obteniendo sesiones recientes:', error);
            setRecentSessions([]);
        }
    };

    // Funciones para procesamiento automático
    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
        setAutoProcessError(null);
        setAutoProcessResults(null);
    };

    const handleAutoProcess = async () => {
        // ✅ MEJORA: Verificar rate limit antes de procesar (solo en producción)
        if (process.env.NODE_ENV === 'production') {
            const lastProcessing = localStorage.getItem('lastProcessingTimestamp');
            if (lastProcessing) {
                const timeSince = Date.now() - parseInt(lastProcessing);
                if (timeSince < FEATURE_FLAGS.processingRateLimitMs) {
                    const minutesLeft = Math.ceil((FEATURE_FLAGS.processingRateLimitMs - timeSince) / 60000);
                    setAutoProcessError(`⏱️ Rate limit: Espera ${minutesLeft} minutos antes de procesar nuevamente`);
                    return;
                }
            }
        }

        setIsProcessingAuto(true);
        setAutoProcessError(null);
        setAutoProcessResults(null);
        setAutoProcessProgress(0);

        // ✅ MEJORA: useRef para manejar cleanup de intervals/timeouts
        let pollInterval: NodeJS.Timeout | null = null;
        let timeoutId: NodeJS.Timeout | null = null;
        let mounted = true;

        try {
            logger.info('🚀 Iniciando procesamiento automático de todos los vehículos...');

            // ✅ MEJORA: Guardar timestamp del procesamiento (rate limiting)
            localStorage.setItem('lastProcessingTimestamp', Date.now().toString());

            // ✅ NUEVO: Leer configuración guardada de localStorage
            let uploadConfig = null;
            try {
                const savedConfig = localStorage.getItem('uploadConfig');
                if (savedConfig) {
                    uploadConfig = JSON.parse(savedConfig);
                    logger.info('⚙️ Usando configuración personalizada', uploadConfig);
                }
            } catch (e) {
                logger.error('Error leyendo configuración:', e);
            }

            // Simular progreso inicial
            setAutoProcessProgress(10);

            // Llamar al endpoint de procesamiento automático CON configuración
            const response = await apiService.post('/api/upload/process-all-cmadrid', {
                config: uploadConfig // ✅ NUEVO: Pasar configuración al backend
            });

            // ✅ El backend ahora devuelve inmediatamente con el ID del reporte
            if (response.success && (response.data as any)?.reportId) {
                const reportId = (response.data as any).reportId;
                logger.info(`📝 Procesamiento iniciado con reportId: ${reportId}`);

                setAutoProcessProgress(20);

                // ✅ MEJORA: Polling con cleanup automático
                pollInterval = setInterval(async () => {
                    if (!mounted) {
                        if (pollInterval) clearInterval(pollInterval);
                        return;
                    }

                    try {
                        const statusResponse = await apiService.get(`/api/processing-reports/status/${reportId}`);

                        if (statusResponse.success && (statusResponse as any).report) {
                            const report = (statusResponse as any).report;

                            if (report.status === 'COMPLETED') {
                                if (pollInterval) clearInterval(pollInterval);
                                if (timeoutId) clearTimeout(timeoutId);
                                setAutoProcessProgress(100);
                                setAutoProcessResults(report.reportData);
                                setShowReportModal(true);

                                logger.info('✅ Procesamiento completado', {
                                    duration: report.duration,
                                    totalFiles: report.totalFiles,
                                    totalSessions: report.totalSessions
                                });

                                // Actualizar datos
                                if (mounted) {
                                    fetchRecentSessions();
                                }
                            } else if (report.status === 'FAILED') {
                                if (pollInterval) clearInterval(pollInterval);
                                if (timeoutId) clearTimeout(timeoutId);
                                setAutoProcessError(report.errorMessage || 'Error en el procesamiento');
                                setAutoProcessProgress(0);
                            } else if (report.status === 'PROCESSING') {
                                // Simular progreso basado en tiempo
                                setAutoProcessProgress(prev => Math.min(prev + 5, 90));
                            }
                        }
                    } catch (error) {
                        logger.error('Error consultando estado del reporte:', error);
                    }
                }, 5000); // Consultar cada 5 segundos

                // ✅ MEJORA: Timeout de seguridad con cleanup
                timeoutId = setTimeout(() => {
                    if (pollInterval) clearInterval(pollInterval);
                    if (mounted && autoProcessResults === null) {
                        setAutoProcessError('Timeout: El procesamiento está tardando más de lo esperado. Usa el botón "Ver Último Reporte" para verificar.');
                        setIsProcessingAuto(false);
                    }
                }, 900000); // 15 minutos

                // ✅ MEJORA: Cleanup function
                return () => {
                    mounted = false;
                    if (pollInterval) clearInterval(pollInterval);
                    if (timeoutId) clearTimeout(timeoutId);
                };

            } else if (response.success) {
                // Fallback para compatibilidad con respuesta antigua
                setAutoProcessProgress(100);
                setAutoProcessResults(response.data);

                // ✅ NUEVO: Guardar reporte en localStorage
                try {
                    localStorage.setItem('lastProcessingReport', JSON.stringify(response.data));
                    logger.info('💾 Reporte de procesamiento guardado en localStorage');
                } catch (error) {
                    logger.error('Error guardando reporte en localStorage:', error);
                }

                // ✅ Debug: Verificar eventos en la respuesta
                const responseData = response.data as any;
                const totalEvents = responseData.results?.reduce((sum: number, v: any) =>
                    sum + (v.sessionDetails?.reduce((s: number, session: any) =>
                        s + (session.eventsGenerated || 0), 0) || 0), 0);
                const sessionsWithEvents = responseData.results?.reduce((sum: number, v: any) =>
                    sum + (v.sessionDetails?.filter((s: any) => s.eventsGenerated > 0).length || 0), 0);

                logger.info('✅ Procesamiento automático completado', {
                    totalSessions: responseData.totalSaved,
                    totalEvents,
                    sessionsWithEvents,
                    firstSessionExample: responseData.results?.[0]?.sessionDetails?.[0]
                });

                setShowReportModal(true); // ✅ Mostrar modal automáticamente

                // Actualizar datos
                fetchRecentSessions();
            } else {
                setAutoProcessError(response.error || 'Error en el procesamiento automático');
            }
        } catch (error: any) {
            // Si es timeout, dar un mensaje específico
            if (error?.code === 'ECONNABORTED' && error?.message?.includes('timeout')) {
                const timeoutMsg = '⏱️ Timeout: El procesamiento está tardando más de lo esperado. Continúa en segundo plano. Revisa el historial en unos minutos.';
                setAutoProcessError(timeoutMsg);
                logger.error('Timeout en procesamiento automático:', error.message);
            } else {
                const errorMessage = error?.response?.data?.error || error?.message || 'Error de conexión durante el procesamiento';
                setAutoProcessError(errorMessage);
                logger.error('Error en procesamiento automático:', error);
            }
        } finally {
            setIsProcessingAuto(false);
        }
    };

    const handleViewLastReport = async () => {
        try {
            logger.info('📊 Consultando último reporte de procesamiento...');

            const response = await apiService.get('/api/processing-reports/latest');

            if (response.success && (response as any).report) {
                setAutoProcessResults((response as any).report);
                setShowReportModal(true);
                logger.info('✅ Reporte cargado exitosamente');
            } else {
                setAutoProcessError('No se encontró ningún reporte de procesamiento previo');
            }
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || 'Error al cargar el reporte';
            setAutoProcessError(errorMessage);
            logger.error('Error cargando último reporte:', error);
        }
    };

    const handleCleanDatabase = async () => {
        try {
            setIsCleaningDB(true);
            logger.warn('🧹 Limpiando base de datos de la organización...');

            const response = await apiService.post('/api/clean-all-sessions', {});

            if (response.success) {
                logger.info('✅ Base de datos limpiada correctamente', response.data);
                
                // Limpiar estados locales
                setUploadResult(null);
                setRecentSessions([]);
                setAutoProcessResults(null);
                setSelectedFiles([]);
                setUploadError(null);
                setAutoProcessError(null);
                
                alert('✅ Base de datos limpiada exitosamente');
                fetchRecentSessions();
            } else {
                throw new Error(response.error || 'Error limpiando la base de datos');
            }
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.message || 'Error limpiando base de datos';
            setAutoProcessError(errorMessage);
            logger.error('Error limpiando base de datos:', error);
            alert(`❌ Error al limpiar base de datos: ${errorMessage}`);
        } finally {
            setIsCleaningDB(false);
            setShowCleanDBConfirmation(false);
        }
    };

    // ✅ NUEVO: Handler para regenerar eventos
    const handleRegenerateEvents = async () => {
        setIsRegeneratingEvents(true);
        setAutoProcessError(null);

        try {
            logger.info('🔄 Regenerando eventos de estabilidad...');
            const response = await apiService.post('/api/generate-events', {}, {
                timeout: 300000 // 5 minutos timeout
            });

            if (response.success) {
                logger.info('✅ Eventos regenerados correctamente', response.data);

                // Mostrar alerta de éxito
                const data = response.data as any;
                const { sesionesProcesadas = 0, totalEventosGenerados = 0, totalEventosBD = 0 } = data;
                setAutoProcessError(null);
                setAutoProcessResults({
                    message: `✅ Regeneración completada: ${totalEventosGenerados} eventos generados en ${sesionesProcesadas} sesiones. Total en BD: ${totalEventosBD}`,
                    type: 'success'
                });

                fetchRecentSessions();
            } else {
                setAutoProcessError(response.error || 'Error regenerando eventos');
            }
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.message || 'Error regenerando eventos';
            setAutoProcessError(`Error regenerando eventos: ${errorMessage}`);
            logger.error('Error regenerando eventos:', error);
        } finally {
            setIsRegeneratingEvents(false);
        }
    };

    // ✅ MEJORA: useEffect con cleanup para evitar memory leaks
    React.useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            if (mounted) {
                await fetchUploadedFiles();
                await fetchRecentSessions();
            }
        };

        fetchData();

        return () => {
            mounted = false;
        };
    }, []);

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-ES');
    };

    const getFileTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'estabilidad': return 'primary';
            case 'gps': return 'success';
            case 'rotativo': return 'secondary';
            case 'can': return 'warning';
            default: return 'default';
        }
    };

    const groupFilesByVehicle = (files: File[]) => {
        const groups: { [key: string]: File[] } = {};
        files.forEach(file => {
            const match = file.name.match(/^(ESTABILIDAD|GPS|ROTATIVO|CAN)_DOBACK(\d+)_(\d{8})\.txt$/);
            if (match) {
                const vehicleId = `DOBACK${match[2]}`;
                if (!groups[vehicleId]) {
                    groups[vehicleId] = [];
                }
                groups[vehicleId].push(file);
            }
        });
        return groups;
    };

    const fileGroups = groupFilesByVehicle(selectedFiles);

    return (
        <Box sx={{ p: 3, maxWidth: '1400px', mx: 'auto', overflowY: 'auto', height: 'calc(100vh - 100px)' }}>
            {/* Header con título y botón Borrar Todo */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Gestión de Datos de Vehículos
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Sube archivos individuales o procesa automáticamente todos los vehículos de CMadrid
                    </Typography>
                </Box>
                {canManageDatabase && (
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setShowDeleteAllConfirmation(true)}
                        disabled={isDeletingAll}
                        sx={{ whiteSpace: 'nowrap' }}
                    >
                        {isDeletingAll ? 'Eliminando...' : 'Borrar Todos los Datos'}
                    </Button>
                )}
            </Box>

            {/* ✅ NUEVO: Reglas de Correlación */}
            <Card sx={{ mb: 3, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.main' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <AutoAwesomeIcon color="info" />
                        <Typography variant="h6" fontWeight="bold">
                            📐 Reglas de Correlación de Sesiones
                        </Typography>
                    </Box>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                🔍 Detección de Sesiones:
                            </Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemText
                                        primary="• Gap > 5 minutos = nueva sesión"
                                        primaryTypographyProps={{ variant: 'body2' }}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="• Numeración reinicia cada día"
                                        primaryTypographyProps={{ variant: 'body2' }}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="• Duración mínima: 1 segundo"
                                        primaryTypographyProps={{ variant: 'body2' }}
                                    />
                                </ListItem>
                            </List>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                🔗 Correlación de Archivos:
                            </Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemText
                                        primary="• Umbral: ≤ 120 segundos entre inicios"
                                        primaryTypographyProps={{ variant: 'body2' }}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="• Requerido: ESTABILIDAD + ROTATIVO"
                                        primaryTypographyProps={{ variant: 'body2' }}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="• Opcional: GPS (puede faltar)"
                                        primaryTypographyProps={{ variant: 'body2' }}
                                    />
                                </ListItem>
                            </List>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Pestañas */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={currentTab} onChange={handleTabChange} aria-label="upload tabs">
                    <Tab
                        icon={<UploadIcon />}
                        label="Subida Manual"
                        id="upload-tab-0"
                        aria-controls="upload-tabpanel-0"
                    />
                    <Tab
                        icon={<AutoAwesomeIcon />}
                        label="Procesamiento Automático"
                        id="upload-tab-1"
                        aria-controls="upload-tabpanel-1"
                    />
                </Tabs>
            </Box>

            {/* Pestaña 1: Subida Manual */}
            <TabPanel value={currentTab} index={0}>
                <Typography variant="h5" gutterBottom>
                    Subida Manual de Archivos
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Sube múltiples archivos de datos de vehículos (Estabilidad, GPS, Rotativo, CAN) para procesamiento manual
                </Typography>

                {/* Zona de subida múltiple */}
                <Card sx={{ mb: 4 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <UploadIcon sx={{ mr: 1 }} />
                            <Typography variant="h6">Subir Múltiples Archivos</Typography>
                        </Box>

                        {uploadError && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {uploadError}
                            </Alert>
                        )}

                        <Box
                            sx={{
                                border: '2px dashed',
                                borderColor: 'grey.300',
                                borderRadius: 2,
                                p: 4,
                                textAlign: 'center',
                                bgcolor: 'grey.50'
                            }}
                        >
                            <FileTextIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".txt"
                                onChange={handleFileSelect}
                                multiple
                                style={{ display: 'none' }}
                                id="file-upload"
                            />
                            <label htmlFor="file-upload">
                                <Button
                                    variant="contained"
                                    component="span"
                                    startIcon={<AddIcon />}
                                    sx={{ mb: 2 }}
                                >
                                    Seleccionar Archivos
                                </Button>
                            </label>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Puedes seleccionar múltiples archivos a la vez
                            </Typography>

                            {selectedFiles.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Archivos seleccionados ({selectedFiles.length}):
                                    </Typography>
                                    <List dense>
                                        {selectedFiles.map((file, index) => (
                                            <ListItem key={index} sx={{ py: 0.5 }}>
                                                <ListItemText
                                                    primary={file.name}
                                                    secondary={`${formatFileSize(file.size)}`}
                                                />
                                                <ListItemSecondaryAction>
                                                    <IconButton
                                                        edge="end"
                                                        onClick={() => removeFile(index)}
                                                        color="error"
                                                        size="small"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        ))}
                                    </List>

                                    <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
                                        <Button
                                            variant="outlined"
                                            onClick={clearAllFiles}
                                            size="small"
                                        >
                                            Limpiar Todo
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            onClick={handleMultipleUpload}
                                            disabled={uploading}
                                            startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
                                        >
                                            {uploading ? 'Subiendo...' : `Subir ${selectedFiles.length} Archivos`}
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        </Box>

                        {/* Vista previa de grupos */}
                        {Object.keys(fileGroups).length > 0 && (
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Archivos agrupados por vehículo:
                                </Typography>
                                {Object.entries(fileGroups).map(([vehicleId, files]) => (
                                    <Card key={vehicleId} variant="outlined" sx={{ mb: 1 }}>
                                        <CardContent sx={{ py: 1 }}>
                                            <Typography variant="subtitle2" color="primary">
                                                {vehicleId} ({files.length} archivos)
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                                {files.map((file, index) => {
                                                    const match = file.name.match(/^(ESTABILIDAD|GPS|ROTATIVO|CAN)_/);
                                                    const type = match?.[1]?.toLowerCase() || 'unknown';
                                                    return (
                                                        <Chip
                                                            key={index}
                                                            label={type.toUpperCase()}
                                                            size="small"
                                                            color={getFileTypeColor(type) as any}
                                                        />
                                                    );
                                                })}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        )}

                        {/* Formato esperado */}
                        <Alert severity="info" sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Formatos de archivo esperados:
                            </Typography>
                            <Typography variant="body2">
                                <strong>Estabilidad:</strong> ESTABILIDAD_DOBACK###_YYYYMMDD.txt<br />
                                <strong>GPS:</strong> GPS_DOBACK###_YYYYMMDD.txt<br />
                                <strong>Rotativo:</strong> ROTATIVO_DOBACK###_YYYYMMDD.txt<br />
                                <strong>CAN:</strong> CAN_DOBACK###_YYYYMMDD.txt
                            </Typography>
                        </Alert>
                    </CardContent>
                </Card>

                {/* Resultado de subida múltiple */}
                {uploadResult && (
                    <Alert severity="success" sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <CheckCircleIcon sx={{ mr: 1 }} />
                            <Typography variant="h6">
                                {uploadResult.totalFiles} Archivos Procesados Exitosamente
                            </Typography>
                        </Box>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2">
                                    <strong>Archivos procesados:</strong> {uploadResult.totalFiles}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Grupos de vehículos:</strong> {uploadResult.vehicleGroups}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2">
                                    <strong>Sesiones totales:</strong> {uploadResult.results.reduce((sum, r) => sum + r.totalSessions, 0)}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Mediciones totales:</strong> {uploadResult.results.reduce((sum, r) => sum + r.totalMeasurements, 0).toLocaleString()}
                                </Typography>
                            </Grid>
                        </Grid>

                        {/* Detalles por grupo */}
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Detalles por grupo:
                            </Typography>
                            {(uploadResult.results || []).map((group, index) => (
                                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Typography variant="subtitle2" color="primary" gutterBottom>
                                            {group.vehicleId} - {group.date}
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="body2">
                                                    <strong>Archivos:</strong> {Object.keys(group.files || {}).length}
                                                </Typography>
                                                <Typography variant="body2">
                                                    <strong>Sesiones:</strong> {group.totalSessions}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="body2">
                                                    <strong>Mediciones:</strong> {group.totalMeasurements.toLocaleString()}
                                                </Typography>
                                            </Grid>
                                        </Grid>

                                        {/* Detalle de archivos */}
                                        <Box sx={{ mt: 1 }}>
                                            {Object.entries(group.files || {}).map(([type, file]) => (
                                                <Chip
                                                    key={type}
                                                    label={`${type.toUpperCase()}: ${file.sessionsCount} sesiones`}
                                                    size="small"
                                                    color={getFileTypeColor(type) as any}
                                                    sx={{ mr: 0.5, mb: 0.5 }}
                                                />
                                            ))}
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>

                        {/* Errores si los hay */}
                        {uploadResult.errors && uploadResult.errors.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" color="error" gutterBottom>
                                    Errores encontrados:
                                </Typography>
                                {(uploadResult.errors || []).map((error, index) => (
                                    <Typography key={index} variant="body2" color="error">
                                        {error.file}: {error.error}
                                    </Typography>
                                ))}
                            </Box>
                        )}
                    </Alert>
                )}

                {/* Error de subida */}
                {uploadError && (
                    <Alert severity="error" sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AlertCircleIcon sx={{ mr: 1 }} />
                            <Typography variant="h6">Error</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            {uploadError}
                        </Typography>
                    </Alert>
                )}

                {/* Análisis CMadrid */}
                <Card sx={{ mb: 4 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <BarChartIcon sx={{ mr: 1 }} />
                                <Typography variant="h6">Análisis Integral CMadrid</Typography>
                            </Box>
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={analyzeCMadrid}
                                disabled={loadingAnalysis}
                                startIcon={loadingAnalysis ? <CircularProgress size={20} /> : <BarChartIcon />}
                            >
                                {loadingAnalysis ? 'Analizando...' : 'Analizar Archivos'}
                            </Button>
                        </Box>

                        {analysisData && (
                            <Box>
                                {/* Resumen general */}
                                <Grid container spacing={2} sx={{ mb: 4 }}>
                                    <Grid item xs={6} md={3}>
                                        <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                                            <Typography variant="h4" color="primary">
                                                {Object.keys(analysisData?.vehicles || {}).length}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Vehículos
                                            </Typography>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                                            <Typography variant="h4" color="success.main">
                                                {analysisData?.totalFiles || 0}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Archivos
                                            </Typography>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                                            <Typography variant="h4" color="warning.main">
                                                {analysisData?.totalSessions || 0}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Sesiones
                                            </Typography>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                                            <Typography variant="h4" color="secondary">
                                                {(analysisData?.totalMeasurements || 0).toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Mediciones
                                            </Typography>
                                        </Card>
                                    </Grid>
                                </Grid>

                                {/* Tipos de archivo */}
                                {analysisData?.fileTypes && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Tipos de Archivo
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            {Object.entries(analysisData.fileTypes || {}).map(([type, count]) => (
                                                <Chip
                                                    key={type}
                                                    label={`${type.toUpperCase()}: ${count}`}
                                                    color={getFileTypeColor(type) as any}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                )}

                                {/* Detalle por vehículo */}
                                <Typography variant="h6" gutterBottom>
                                    Detalle por Vehículo
                                </Typography>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Vehículo</TableCell>
                                                <TableCell>Estabilidad</TableCell>
                                                <TableCell>GPS</TableCell>
                                                <TableCell>Rotativo</TableCell>
                                                <TableCell>CAN</TableCell>
                                                <TableCell>Sesiones</TableCell>
                                                <TableCell>Mediciones</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {Object.values(analysisData.vehicles || {}).map((vehicle: any) => (
                                                <TableRow key={vehicle.vehicleId}>
                                                    <TableCell>
                                                        <Typography variant="subtitle2" fontWeight="bold">
                                                            {vehicle.vehicleId}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>{vehicle.files.estabilidad}</TableCell>
                                                    <TableCell>{vehicle.files.gps}</TableCell>
                                                    <TableCell>{vehicle.files.rotativo}</TableCell>
                                                    <TableCell>{vehicle.files.can || 0}</TableCell>
                                                    <TableCell>{vehicle.sessions}</TableCell>
                                                    <TableCell>{vehicle.measurements.toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {/* Lista de archivos subidos */}
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <DownloadIcon sx={{ mr: 1 }} />
                            <Typography variant="h6">Archivos Subidos</Typography>
                        </Box>

                        {uploadedFiles.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                No hay archivos subidos
                            </Typography>
                        ) : (
                            <TableContainer component={Paper} variant="outlined">
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Archivo</TableCell>
                                            <TableCell>Tipo</TableCell>
                                            <TableCell>Vehículo</TableCell>
                                            <TableCell>Fecha Subida</TableCell>
                                            <TableCell>Sesiones</TableCell>
                                            <TableCell>Mediciones</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(uploadedFiles || []).map((file, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {file.name}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={(file.type || 'unknown').toUpperCase()}
                                                        size="small"
                                                        color={getFileTypeColor(file.type || 'unknown') as any}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {file.name.match(/DOBACK(\d+)/)?.[0] || 'N/A'}
                                                </TableCell>
                                                <TableCell>{formatDate(file.uploadDate)}</TableCell>
                                                <TableCell>0</TableCell>
                                                <TableCell>{file.size.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        {/* Sesiones Recientes */}
                        {recentSessions.length > 0 && (
                            <Card sx={{ mb: 4 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <BarChartIcon sx={{ mr: 1 }} />
                                        <Typography variant="h6">Sesiones Recién Creadas</Typography>
                                    </Box>
                                    <TableContainer component={Paper}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Vehículo</TableCell>
                                                    <TableCell>Tipo</TableCell>
                                                    <TableCell>Sesión</TableCell>
                                                    <TableCell>Inicio</TableCell>
                                                    <TableCell>Mediciones</TableCell>
                                                    <TableCell>Estado</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {(recentSessions || []).map((session, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight="medium">
                                                                {session.licensePlate}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={session.sessionType || 'N/A'}
                                                                size="small"
                                                                color={getFileTypeColor((session.sessionType || 'unknown').toLowerCase()) as any}
                                                            />
                                                        </TableCell>
                                                        <TableCell>{session.sessionNumber}</TableCell>
                                                        <TableCell>
                                                            {new Date(session.startTime).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell>{(session.totalMeasurements || 0).toLocaleString()}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={session.status || 'N/A'}
                                                                size="small"
                                                                color={session.status === 'completed' ? 'success' : 'warning'}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        )}
                    </CardContent>
                </Card>
            </TabPanel>

            {/* Pestaña 2: Procesamiento Automático */}
            <TabPanel value={currentTab} index={1}>
                <Typography variant="h5" gutterBottom>
                    Procesamiento Automático de CMadrid
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Procesa automáticamente todos los archivos de los 3 vehículos (DOBACK024, DOBACK027, DOBACK028) con detección de eventos y filtrado inteligente
                </Typography>

                {/* Información del sistema */}
                <Card sx={{ mb: 4 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <AutoAwesomeIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h6">
                                Sistema Automático
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            El sistema procesará automáticamente:
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                            <li><strong>21 conjuntos completos</strong> (3 vehículos × 7 fechas)</li>
                            <li><strong>Filtrado inteligente</strong>: Solo sesiones ≥5 min con GPS válido</li>
                            <li><strong>Detección de eventos</strong>: Estable (≥60%), Correcta (50-60%), Inestable (&lt;50%)</li>
                            <li><strong>Correlación GPS</strong>: Eventos con ubicación exacta</li>
                            <li><strong>Callejeado 300m</strong>: Rutas realistas sin saltos GPS</li>
                        </Box>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <strong>Tiempo estimado:</strong> 5-10 minutos para procesar todos los archivos
                        </Alert>
                    </CardContent>
                </Card>

                {/* ⚙️ PANEL DE CONFIGURACIÓN */}
                <UploadConfigPanel onConfigChange={(config) => {
                    logger.info('Configuración actualizada', config);
                }} />

                {/* Controles */}
                <Card sx={{ mb: 4 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Controles de Procesamiento
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                            {canManageDatabase && (
                                <Button
                                    variant="outlined"
                                    color="warning"
                                    onClick={() => setShowCleanDBConfirmation(true)}
                                    disabled={isProcessingAuto || isRegeneratingEvents || isCleaningDB}
                                    startIcon={<DeleteIcon />}
                                >
                                    {isCleaningDB ? 'Limpiando...' : 'Limpiar Base de Datos'}
                                </Button>
                            )}
                            {isAdmin && (
                                <Button
                                    variant="outlined"
                                    color="info"
                                    onClick={handleRegenerateEvents}
                                    disabled={isProcessingAuto || isRegeneratingEvents}
                                    startIcon={isRegeneratingEvents ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
                                >
                                    {isRegeneratingEvents ? 'Regenerando...' : 'Regenerar Eventos'}
                                </Button>
                            )}
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleAutoProcess}
                                disabled={isProcessingAuto || isRegeneratingEvents}
                                startIcon={isProcessingAuto ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                                size="large"
                            >
                                {isProcessingAuto ? 'Procesando...' : 'Iniciar Procesamiento Automático'}
                            </Button>
                            <Button
                                variant="outlined"
                                color="success"
                                onClick={handleViewLastReport}
                                disabled={isProcessingAuto}
                                startIcon={<AssessmentIcon />}
                                size="large"
                            >
                                Ver Último Reporte
                            </Button>
                        </Box>

                        {/* Barra de progreso */}
                        {isProcessingAuto && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="body2" gutterBottom>
                                    Procesando archivos... {autoProcessProgress}%
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={autoProcessProgress}
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                            </Box>
                        )}

                        {/* Errores */}
                        {autoProcessError && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                <strong>Error:</strong> {autoProcessError}
                            </Alert>
                        )}

                        {/* Resultados */}
                        {autoProcessResults && (
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="h6" gutterBottom color="success.main">
                                        ✅ Procesamiento Completado
                                    </Typography>

                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                                                <Typography variant="h4" color="success.main">
                                                    {autoProcessResults.totalSaved}
                                                </Typography>
                                                <Typography variant="body2">
                                                    Sesiones Guardadas
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                                                <Typography variant="h4" color="warning.main">
                                                    {autoProcessResults.totalSkipped}
                                                </Typography>
                                                <Typography variant="body2">
                                                    Sesiones Descartadas
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>

                                    <Divider sx={{ my: 3 }} />

                                    <Typography variant="h6" gutterBottom>
                                        Detalle por Vehículo
                                    </Typography>
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Vehículo</TableCell>
                                                    <TableCell>Fecha</TableCell>
                                                    <TableCell>Guardadas</TableCell>
                                                    <TableCell>Descartadas</TableCell>
                                                    <TableCell>Estado</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {(autoProcessResults?.results || []).map((result: any, index: number) => (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            <Typography variant="subtitle2" fontWeight="bold">
                                                                {result.vehicle}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>{result.date}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={result.savedSessions || 0}
                                                                color="success"
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={result.skippedSessions || 0}
                                                                color="warning"
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            {result.error ? (
                                                                <Chip
                                                                    label="Error"
                                                                    color="error"
                                                                    size="small"
                                                                    title={result.error}
                                                                />
                                                            ) : (
                                                                <Chip
                                                                    label="Completado"
                                                                    color="success"
                                                                    size="small"
                                                                />
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        )}
                    </CardContent>
                </Card>

                {/* Sesiones Recientes */}
                {recentSessions.length > 0 && (
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <BarChartIcon sx={{ mr: 1 }} />
                                <Typography variant="h6">Sesiones Recién Creadas</Typography>
                            </Box>
                            <TableContainer component={Paper}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Vehículo</TableCell>
                                            <TableCell>Tipo</TableCell>
                                            <TableCell>Sesión</TableCell>
                                            <TableCell>Inicio</TableCell>
                                            <TableCell>Mediciones</TableCell>
                                            <TableCell>Estado</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(recentSessions || []).slice(0, 10).map((session, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {session.licensePlate}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={session.sessionType || 'N/A'}
                                                        size="small"
                                                        color={getFileTypeColor((session.sessionType || 'unknown').toLowerCase()) as any}
                                                    />
                                                </TableCell>
                                                <TableCell>{session.sessionNumber}</TableCell>
                                                <TableCell>
                                                    {new Date(session.startTime).toLocaleString()}
                                                </TableCell>
                                                <TableCell>{(session.totalMeasurements || 0).toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={session.status || 'N/A'}
                                                        size="small"
                                                        color={session.status === 'completed' ? 'success' : 'default'}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                )}
            </TabPanel>

            {/* Modal de Reporte Detallado */}
            <SimpleProcessingReport
                open={showReportModal}
                onClose={() => setShowReportModal(false)}
                results={autoProcessResults}
            />

            {/* Modal de Confirmación de Borrado Total */}
            {canManageDatabase && showDeleteAllConfirmation && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999
                    }}
                >
                    <Card sx={{ maxWidth: 500, m: 2 }}>
                        <CardContent>
                            <Box sx={{ mb: 3, textAlign: 'center' }}>
                                <ExclamationTriangleIcon className="h-16 w-16 text-red-600 mx-auto mb-2" />
                                <Typography variant="h5" color="error" fontWeight="bold" gutterBottom>
                                    ⚠️ ADVERTENCIA: Acción Irreversible
                                </Typography>
                            </Box>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                Estás a punto de eliminar <strong>TODOS los datos</strong> de tu organización de la base de datos:
                            </Typography>

                            <Box component="ul" sx={{ mb: 3, pl: 2, '& li': { mb: 1 } }}>
                                <li>Todas las sesiones</li>
                                <li>Todas las mediciones (GPS, CAN, Rotativo, Estabilidad)</li>
                                <li>Todos los eventos de estabilidad</li>
                                <li>Todos los segmentos operacionales</li>
                                <li>Toda la caché de KPIs</li>
                            </Box>

                            <Alert severity="error" sx={{ mb: 3 }}>
                                <strong>Esta acción NO se puede deshacer.</strong> Todos los datos serán eliminados permanentemente.
                            </Alert>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="error"
                                    onClick={handleDeleteAllData}
                                    disabled={isDeletingAll}
                                >
                                    {isDeletingAll ? 'Eliminando...' : 'Sí, eliminar todo'}
                                </Button>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={() => setShowDeleteAllConfirmation(false)}
                                    disabled={isDeletingAll}
                                >
                                    Cancelar
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            )}

            {/* Modal de Confirmación para Limpiar Base de Datos */}
            {canManageDatabase && showCleanDBConfirmation && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999
                    }}
                >
                    <Card sx={{ maxWidth: 500, m: 2 }}>
                        <CardContent>
                            <Box sx={{ mb: 3, textAlign: 'center' }}>
                                <ExclamationTriangleIcon className="h-16 w-16 text-orange-600 mx-auto mb-2" />
                                <Typography variant="h5" color="warning.main" fontWeight="bold" gutterBottom>
                                    ⚠️ ADVERTENCIA: Limpiar Base de Datos
                                </Typography>
                            </Box>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                Estás a punto de limpiar todas las sesiones de tu organización:
                            </Typography>

                            <Box component="ul" sx={{ mb: 3, pl: 2, '& li': { mb: 1 } }}>
                                <li>Todas las sesiones</li>
                                <li>Todas las mediciones (GPS, CAN, Rotativo, Estabilidad)</li>
                                <li>Todos los eventos de estabilidad</li>
                                <li>Todos los segmentos operacionales</li>
                                <li>Toda la caché de KPIs</li>
                            </Box>

                            <Alert severity="warning" sx={{ mb: 3 }}>
                                <strong>Nota:</strong> Esta acción es útil para re-procesar archivos desde cero.
                            </Alert>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="warning"
                                    onClick={handleCleanDatabase}
                                    disabled={isCleaningDB}
                                >
                                    {isCleaningDB ? 'Limpiando...' : 'Sí, limpiar'}
                                </Button>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={() => setShowCleanDBConfirmation(false)}
                                    disabled={isCleaningDB}
                                >
                                    Cancelar
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            )}
        </Box>
    );
};

export default FileUploadManager;