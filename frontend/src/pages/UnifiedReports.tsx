import { API_CONFIG } from '@/config/api';
import {
    Add as AddIcon,
    Warning as AlertIcon,
    Assessment as AssessmentIcon,
    Business as CompanyIcon,
    Download as DownloadIcon,
    FilterList as FilterIcon,
    History as HistoryIcon,
    Map as MapIcon,
    Print as PrintIcon,
    Refresh as RefreshIcon,
    Assignment as ReportIcon,
    Search as SearchIcon,
    Speed as SpeedIcon,
    Timeline as TimelineIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    List,
    ListItem,
    ListItemText,
    MenuItem,
    Paper,
    Select,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Tabs,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { logger } from '../utils/logger';

// Interfaces
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    category: 'emergency' | 'operational' | 'maintenance' | 'compliance';
    estimatedTime: string;
    parameters: ReportParameter[];
}

interface ReportParameter {
    name: string;
    type: 'date' | 'vehicle' | 'boolean' | 'select';
    label: string;
    required: boolean;
    options?: string[];
    defaultValue?: any;
}

interface GeneratedReport {
    id: string;
    name: string;
    type: string;
    status: 'PENDING' | 'READY' | 'FAILED';
    createdAt: string;
    expiresAt: string;
    sizeBytes: number;
    downloadUrl?: string;
    parameters: Record<string, any>;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`reports-tabpanel-${index}`}
            aria-labelledby={`reports-tab-${index}`}
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

const UnifiedReports: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [reports, setReports] = useState<GeneratedReport[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Estados para generación de reportes
    const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
    const [reportParams, setReportParams] = useState<Record<string, any>>({});
    const [generatingReport, setGeneratingReport] = useState(false);
    const [showGenerateDialog, setShowGenerateDialog] = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

    // Cargar reportes al montar el componente
    useEffect(() => {
        // Usar datos mock por ahora
        setReports(mockReports);
    }, []);

    // Plantillas de reportes basadas en las pestañas del dashboard ejecutivo
    const reportTemplates: ReportTemplate[] = [
        // Reportes de Estados & Tiempos (Pestaña 0 del Dashboard)
        {
            id: 'estados-tiempos-kpis',
            name: 'Reporte de Estados & Tiempos - KPIs Ejecutivos',
            description: 'Análisis completo de KPIs de disponibilidad, tiempos de operación, eficiencia y rendimiento general',
            icon: <AssessmentIcon />,
            category: 'operational',
            estimatedTime: '2-3 minutos',
            parameters: [
                { name: 'startDate', type: 'date', label: 'Fecha Inicio', required: true },
                { name: 'endDate', type: 'date', label: 'Fecha Fin', required: true },
                { name: 'includeAvailability', type: 'boolean', label: 'Incluir Métricas de Disponibilidad', required: false, defaultValue: true },
                { name: 'includePerformance', type: 'boolean', label: 'Incluir Análisis de Rendimiento', required: false, defaultValue: true },
                { name: 'includeCosts', type: 'boolean', label: 'Incluir Análisis de Costes', required: false, defaultValue: true }
            ]
        },
        {
            id: 'tiempos-respuesta',
            name: 'Análisis de Tiempos de Respuesta',
            description: 'Evaluación detallada de tiempos de respuesta, eficiencia operativa y comparativas temporales',
            icon: <TimelineIcon />,
            category: 'operational',
            estimatedTime: '2-3 minutos',
            parameters: [
                { name: 'startDate', type: 'date', label: 'Fecha Inicio', required: true },
                { name: 'endDate', type: 'date', label: 'Fecha Fin', required: true },
                { name: 'vehicleId', type: 'select', label: 'Vehículo', required: false, options: ['Todos', 'DOBACK027', 'DOBACK015', 'DOBACK042'] },
                { name: 'includeComparison', type: 'boolean', label: 'Incluir Comparativas Temporales', required: false, defaultValue: true }
            ]
        },

        // Reportes de Puntos Negros (Pestaña 1 del Dashboard)
        {
            id: 'puntos-negros-eventos',
            name: 'Reporte de Puntos Negros y Eventos Críticos',
            description: 'Identificación y análisis de zonas problemáticas, eventos críticos y patrones de riesgo',
            icon: <AlertIcon />,
            category: 'emergency',
            estimatedTime: '3-4 minutos',
            parameters: [
                { name: 'startDate', type: 'date', label: 'Fecha Inicio', required: true },
                { name: 'endDate', type: 'date', label: 'Fecha Fin', required: true },
                { name: 'severityLevel', type: 'select', label: 'Nivel de Severidad', required: false, options: ['Todos', 'Leve', 'Grave', 'Crítico'] },
                { name: 'includeMap', type: 'boolean', label: 'Incluir Mapa de Eventos', required: false, defaultValue: true },
                { name: 'includeRecommendations', type: 'boolean', label: 'Incluir Recomendaciones IA', required: false, defaultValue: true }
            ]
        },
        {
            id: 'zonas-riesgo',
            name: 'Análisis de Zonas de Alto Riesgo',
            description: 'Mapeo de zonas con mayor concentración de eventos críticos y recomendaciones de mejora',
            icon: <MapIcon />,
            category: 'emergency',
            estimatedTime: '3-4 minutos',
            parameters: [
                { name: 'startDate', type: 'date', label: 'Fecha Inicio', required: true },
                { name: 'endDate', type: 'date', label: 'Fecha Fin', required: true },
                { name: 'includeHeatmap', type: 'boolean', label: 'Incluir Heatmap de Riesgo', required: false, defaultValue: true },
                { name: 'includeTrends', type: 'boolean', label: 'Incluir Análisis de Tendencias', required: false, defaultValue: true }
            ]
        },

        // Reportes de Velocidad (Pestaña 2 del Dashboard)
        {
            id: 'analisis-velocidad',
            name: 'Análisis Avanzado de Velocidad',
            description: 'Estudio detallado de patrones de velocidad, aceleración y comportamiento de conducción',
            icon: <SpeedIcon />,
            category: 'operational',
            estimatedTime: '3-4 minutos',
            parameters: [
                { name: 'startDate', type: 'date', label: 'Fecha Inicio', required: true },
                { name: 'endDate', type: 'date', label: 'Fecha Fin', required: true },
                { name: 'vehicleId', type: 'select', label: 'Vehículo', required: false, options: ['Todos', 'DOBACK027', 'DOBACK015', 'DOBACK042'] },
                { name: 'includeCAN', type: 'boolean', label: 'Incluir Datos CAN Detallados', required: false, defaultValue: true },
                { name: 'includeViolations', type: 'boolean', label: 'Incluir Análisis de Violaciones', required: false, defaultValue: true }
            ]
        },
        {
            id: 'telemetria-conduccion',
            name: 'Telemetría de Conducción y Patrones',
            description: 'Análisis de patrones de conducción, eficiencia y optimización de rutas',
            icon: <SpeedIcon />,
            category: 'operational',
            estimatedTime: '4-5 minutos',
            parameters: [
                { name: 'startDate', type: 'date', label: 'Fecha Inicio', required: true },
                { name: 'endDate', type: 'date', label: 'Fecha Fin', required: true },
                { name: 'includeGPS', type: 'boolean', label: 'Incluir Datos GPS', required: false, defaultValue: true },
                { name: 'includeFuel', type: 'boolean', label: 'Incluir Análisis de Combustible', required: false, defaultValue: true }
            ]
        },

        // Reportes de Sesiones & Recorridos (Pestaña 3 del Dashboard)
        {
            id: 'sesiones-recorridos',
            name: 'Reporte de Sesiones y Recorridos',
            description: 'Análisis completo de sesiones de trabajo, rutas utilizadas y eficiencia de desplazamientos',
            icon: <MapIcon />,
            category: 'operational',
            estimatedTime: '3-4 minutos',
            parameters: [
                { name: 'startDate', type: 'date', label: 'Fecha Inicio', required: true },
                { name: 'endDate', type: 'date', label: 'Fecha Fin', required: true },
                { name: 'vehicleId', type: 'select', label: 'Vehículo', required: false, options: ['Todos', 'DOBACK027', 'DOBACK015', 'DOBACK042'] },
                { name: 'includeRoutes', type: 'boolean', label: 'Incluir Mapa de Rutas', required: false, defaultValue: true },
                { name: 'includeDistance', type: 'boolean', label: 'Incluir Análisis de Distancias', required: false, defaultValue: true }
            ]
        },
        {
            id: 'optimizacion-rutas',
            name: 'Optimización de Rutas y Eficiencia',
            description: 'Recomendaciones de optimización de rutas, análisis de tráfico y mejora de eficiencia',
            icon: <MapIcon />,
            category: 'operational',
            estimatedTime: '4-5 minutos',
            parameters: [
                { name: 'startDate', type: 'date', label: 'Fecha Inicio', required: true },
                { name: 'endDate', type: 'date', label: 'Fecha Fin', required: true },
                { name: 'includeTraffic', type: 'boolean', label: 'Incluir Análisis de Tráfico', required: false, defaultValue: true },
                { name: 'includeSuggestions', type: 'boolean', label: 'Incluir Sugerencias de Optimización', required: false, defaultValue: true }
            ]
        },

        // Reportes de Mantenimiento y Cumplimiento
        {
            id: 'mantenimiento-preventivo',
            name: 'Programa de Mantenimiento Preventivo',
            description: 'Reporte de mantenimientos programados, realizados y predicciones basadas en IA',
            icon: <TimelineIcon />,
            category: 'maintenance',
            estimatedTime: '2-3 minutos',
            parameters: [
                { name: 'startDate', type: 'date', label: 'Fecha Inicio', required: true },
                { name: 'endDate', type: 'date', label: 'Fecha Fin', required: true },
                { name: 'maintenanceType', type: 'select', label: 'Tipo de Mantenimiento', required: false, options: ['Todos', 'Preventivo', 'Correctivo', 'Predictivo'] },
                { name: 'includePredictions', type: 'boolean', label: 'Incluir Predicciones IA', required: false, defaultValue: true }
            ]
        },
        {
            id: 'cumplimiento-normativo',
            name: 'Reporte de Cumplimiento y Seguridad',
            description: 'Verificación de cumplimiento normativo, estándares de seguridad y auditoría operativa',
            icon: <AlertIcon />,
            category: 'compliance',
            estimatedTime: '2-3 minutos',
            parameters: [
                { name: 'startDate', type: 'date', label: 'Fecha Inicio', required: true },
                { name: 'endDate', type: 'date', label: 'Fecha Fin', required: true },
                { name: 'includeAlerts', type: 'boolean', label: 'Incluir Alertas de Seguridad', required: false, defaultValue: true },
                { name: 'includeAudit', type: 'boolean', label: 'Incluir Traza de Auditoría', required: false, defaultValue: true }
            ]
        }
    ];

    // Datos simulados de reportes generados basados en las pestañas del dashboard
    const mockReports: GeneratedReport[] = [
        {
            id: '1',
            name: 'Estados & Tiempos - KPIs Ejecutivos Diciembre 2024',
            type: 'estados-tiempos-kpis',
            status: 'READY',
            createdAt: '2024-12-20T10:30:00Z',
            expiresAt: '2025-06-20T10:30:00Z',
            sizeBytes: 2048576,
            parameters: { startDate: '2024-12-01', endDate: '2024-12-20', includeAvailability: true, includePerformance: true }
        },
        {
            id: '2',
            name: 'Puntos Negros y Eventos Críticos - DOBACK027',
            type: 'puntos-negros-eventos',
            status: 'READY',
            createdAt: '2024-12-19T15:45:00Z',
            expiresAt: '2025-06-19T15:45:00Z',
            sizeBytes: 1536000,
            parameters: { startDate: '2024-12-01', endDate: '2024-12-19', severityLevel: 'Crítico', includeMap: true }
        },
        {
            id: '3',
            name: 'Análisis de Velocidad Avanzado - Q4 2024',
            type: 'analisis-velocidad',
            status: 'PENDING',
            createdAt: '2024-12-20T09:15:00Z',
            expiresAt: '2025-06-20T09:15:00Z',
            sizeBytes: 0,
            parameters: { startDate: '2024-10-01', endDate: '2024-12-31', vehicleId: 'Todos', includeCAN: true }
        },
        {
            id: '4',
            name: 'Sesiones y Recorridos - Análisis de Rutas',
            type: 'sesiones-recorridos',
            status: 'READY',
            createdAt: '2024-12-18T14:20:00Z',
            expiresAt: '2025-06-18T14:20:00Z',
            sizeBytes: 1876543,
            parameters: { startDate: '2024-12-01', endDate: '2024-12-18', includeRoutes: true, includeDistance: true }
        },
        {
            id: '5',
            name: 'Programa de Mantenimiento Preventivo',
            type: 'mantenimiento-preventivo',
            status: 'READY',
            createdAt: '2024-12-17T11:30:00Z',
            expiresAt: '2025-06-17T11:30:00Z',
            sizeBytes: 987654,
            parameters: { startDate: '2024-12-01', endDate: '2024-12-31', maintenanceType: 'Preventivo', includePredictions: true }
        }
    ];

    useEffect(() => {
        // Usar datos mock por ahora
        setReports(mockReports);
    }, [page, rowsPerPage]);


    // Filtrar reportes
    const filteredReports = useMemo(() => {
        let filtered = reports;

        if (searchTerm) {
            filtered = filtered.filter(report =>
                report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report.type.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(report => report.status === statusFilter);
        }

        if (categoryFilter !== 'ALL') {
            filtered = filtered.filter(report => {
                const template = reportTemplates.find(t => t.id === report.type);
                return template?.category === categoryFilter;
            });
        }

        return filtered;
    }, [reports, searchTerm, statusFilter, categoryFilter]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };



    const handleGenerateReport = (template: ReportTemplate) => {
        setSelectedTemplate(template);
        setReportParams({});
        setShowGenerateDialog(true);
    };

    const handleGenerateConfirm = async () => {
        if (!selectedTemplate) return;

        setGeneratingReport(true);
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/reports/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    module: selectedTemplate.category,
                    template: selectedTemplate.id,
                    params: reportParams,
                    options: {
                        includeKPIs: true,
                        includeHeatmap: true,
                        includeEvents: true,
                        includeAI: selectedTemplate.category === 'compliance'
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Recargar la lista de reportes
                    setReports(mockReports);
                    setShowGenerateDialog(false);

                    logger.info('Reporte generado exitosamente', { reportId: data.data.id });
                } else {
                    throw new Error(data.error || 'Error al generar el reporte');
                }
            } else {
                throw new Error('Error en la respuesta del servidor');
            }
        } catch (error) {
            logger.error('Error generando reporte:', error);
            // setError('Error al generar el reporte');
        } finally {
            setGeneratingReport(false);
        }
    };

    const handleDownload = async (report: GeneratedReport) => {
        try {
            logger.info('Descargando reporte:', report.id);

            const response = await fetch(`/api/reports/${report.id}/download`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `reporte-${report.id}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else {
                throw new Error('Error al descargar el reporte');
            }
        } catch (error) {
            logger.error('Error descargando reporte:', error);
            // setError('Error al descargar el reporte');
        }
    };

    const getStatusChip = (status: GeneratedReport['status']) => {
        const statusConfig = {
            PENDING: { color: 'warning' as const, label: 'Generando...' },
            READY: { color: 'success' as const, label: 'Listo' },
            FAILED: { color: 'error' as const, label: 'Error' }
        };

        const config = statusConfig[status];
        return <Chip size="small" color={config.color} label={config.label} />;
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'emergency': return 'error';
            case 'operational': return 'primary';
            case 'maintenance': return 'warning';
            case 'compliance': return 'info';
            default: return 'secondary';
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <ReportIcon sx={{ mr: 2, fontSize: 40 }} />
                    Centro de Reportes Personalizados
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    Genera reportes especializados basados en las pestañas del dashboard ejecutivo
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Estados & Tiempos • Puntos Negros • Velocidad • Sesiones & Recorridos
                </Typography>
            </Box>

            <Paper elevation={2}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={activeTab} onChange={handleTabChange} aria-label="reportes tabs">
                        <Tab
                            icon={<AddIcon />}
                            label="Generar Reportes"
                            iconPosition="start"
                        />
                        <Tab
                            icon={<HistoryIcon />}
                            label="Historial de Reportes"
                            iconPosition="start"
                        />
                        <Tab
                            icon={<FilterIcon />}
                            label="Plantillas Avanzadas"
                            iconPosition="start"
                        />
                    </Tabs>
                </Box>

                {/* Pestaña: Generar Reportes */}
                <TabPanel value={activeTab} index={0}>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        <Typography variant="h6" component="div" gutterBottom>
                            📊 Reportes Basados en Dashboard Ejecutivo
                        </Typography>
                        <Typography variant="body2">
                            • <strong>Estados & Tiempos:</strong> KPIs de disponibilidad, rendimiento y análisis de costes<br />
                            • <strong>Puntos Negros:</strong> Eventos críticos, zonas de riesgo y recomendaciones IA<br />
                            • <strong>Velocidad:</strong> Análisis de conducción, telemetría CAN/GPS y patrones<br />
                            • <strong>Sesiones & Recorridos:</strong> Rutas, eficiencia y optimización de desplazamientos<br />
                            • <strong>Mantenimiento:</strong> Programas preventivos y predicciones basadas en IA
                        </Typography>
                    </Alert>

                    <Grid container spacing={3}>
                        {reportTemplates.map((template) => (
                            <Grid item xs={12} md={6} lg={4} key={template.id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s',
                                        '&:hover': { transform: 'translateY(-4px)' }
                                    }}
                                    onClick={() => handleGenerateReport(template)}
                                >
                                    <CardContent>
                                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                                            <Box sx={{ color: `${getCategoryColor(template.category)}.main` }}>
                                                {template.icon}
                                            </Box>
                                            <Chip
                                                label={template.category.toUpperCase()}
                                                size="small"
                                                color={getCategoryColor(template.category)}
                                            />
                                        </Stack>

                                        <Typography variant="h6" gutterBottom>
                                            {template.name}
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {template.description}
                                        </Typography>

                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="caption" color="text.secondary">
                                                Tiempo estimado: {template.estimatedTime}
                                            </Typography>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color={getCategoryColor(template.category)}
                                            >
                                                Generar
                                            </Button>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </TabPanel>

                {/* Pestaña: Historial de Reportes */}
                <TabPanel value={activeTab} index={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                        <Typography variant="h6">
                            Historial de Reportes Generados
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            <TextField
                                size="small"
                                placeholder="Buscar reportes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                }}
                                sx={{ minWidth: 200 }}
                            />
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Estado</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Estado"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="ALL">Todos</MenuItem>
                                    <MenuItem value="READY">Listos</MenuItem>
                                    <MenuItem value="PENDING">Generando</MenuItem>
                                    <MenuItem value="FAILED">Error</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Categoría</InputLabel>
                                <Select
                                    value={categoryFilter}
                                    label="Categoría"
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                    <MenuItem value="ALL">Todas</MenuItem>
                                    <MenuItem value="emergency">Emergencia</MenuItem>
                                    <MenuItem value="operational">Operacional</MenuItem>
                                    <MenuItem value="maintenance">Mantenimiento</MenuItem>
                                    <MenuItem value="compliance">Cumplimiento</MenuItem>
                                </Select>
                            </FormControl>
                            <Button
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                onClick={() => window.location.reload()}
                            >
                                Actualizar
                            </Button>
                        </Stack>
                    </Stack>

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Nombre del Reporte</TableCell>
                                    <TableCell>Categoría</TableCell>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell>Tamaño</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell>Expira</TableCell>
                                    <TableCell align="center">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredReports.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">
                                                No hay reportes que coincidan con los filtros
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredReports.map((report) => {
                                        const template = reportTemplates.find(t => t.id === report.type);
                                        return (
                                            <TableRow key={report.id} hover>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {report.name}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {template && (
                                                        <Chip
                                                            label={template.category.toUpperCase()}
                                                            size="small"
                                                            color={getCategoryColor(template.category)}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>{formatDate(report.createdAt)}</TableCell>
                                                <TableCell>
                                                    {report.sizeBytes > 0 ? formatFileSize(report.sizeBytes) : '-'}
                                                </TableCell>
                                                <TableCell>{getStatusChip(report.status)}</TableCell>
                                                <TableCell>{formatDate(report.expiresAt)}</TableCell>
                                                <TableCell align="center">
                                                    <Stack direction="row" spacing={1} justifyContent="center">
                                                        {report.status === 'READY' && (
                                                            <>
                                                                <Tooltip title="Descargar PDF">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="primary"
                                                                        onClick={() => handleDownload(report)}
                                                                    >
                                                                        <DownloadIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Vista previa">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="secondary"
                                                                    >
                                                                        <ViewIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Imprimir">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="default"
                                                                    >
                                                                        <PrintIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </>
                                                        )}
                                                        {report.status === 'PENDING' && (
                                                            <CircularProgress size={20} />
                                                        )}
                                                        {report.status === 'FAILED' && (
                                                            <Typography variant="caption" color="error">
                                                                Error al generar
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filteredReports.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
                        labelRowsPerPage="Filas por página:"
                    />
                </TabPanel>

                {/* Pestaña: Plantillas Avanzadas */}
                <TabPanel value={activeTab} index={2}>
                    <Typography variant="h6" gutterBottom>
                        📋 Plantillas de Reportes Personalizadas
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Configura y personaliza tus reportes con parámetros avanzados
                    </Typography>

                    <Grid container spacing={3}>
                        {reportTemplates.map((template) => (
                            <Grid item xs={12} key={template.id}>
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Stack direction="row" alignItems="center" spacing={2}>
                                            <Box sx={{ color: `${getCategoryColor(template.category)}.main` }}>
                                                {template.icon}
                                            </Box>
                                            <Box>
                                                <Typography variant="h6">
                                                    {template.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {template.description}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Parámetros Disponibles:
                                                </Typography>
                                                <List dense>
                                                    {template.parameters.map((param, index) => (
                                                        <ListItem key={index}>
                                                            <ListItemText
                                                                primary={param.label}
                                                                secondary={`Tipo: ${param.type} ${param.required ? '(Requerido)' : '(Opcional)'}`}
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Stack spacing={2}>
                                                    <Typography variant="subtitle2">
                                                        Información del Reporte:
                                                    </Typography>
                                                    <Box>
                                                        <Typography variant="body2">
                                                            <strong>Categoría:</strong> {template.category}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            <strong>Tiempo estimado:</strong> {template.estimatedTime}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            <strong>Parámetros:</strong> {template.parameters.length}
                                                        </Typography>
                                                    </Box>
                                                    <Button
                                                        variant="contained"
                                                        color={getCategoryColor(template.category)}
                                                        onClick={() => handleGenerateReport(template)}
                                                        fullWidth
                                                    >
                                                        Configurar y Generar
                                                    </Button>
                                                </Stack>
                                            </Grid>
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>
                            </Grid>
                        ))}
                    </Grid>
                </TabPanel>
            </Paper>

            {/* Dialog para generar reporte */}
            <Dialog
                open={showGenerateDialog}
                onClose={() => setShowGenerateDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Generar Reporte: {selectedTemplate?.name}
                </DialogTitle>
                <DialogContent>
                    {selectedTemplate && (
                        <Stack spacing={3} sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                {selectedTemplate.description}
                            </Typography>

                            {selectedTemplate.parameters.map((param) => (
                                <Box key={param.name}>
                                    {param.type === 'date' && (
                                        <TextField
                                            fullWidth
                                            type="date"
                                            label={param.label}
                                            value={reportParams[param.name] || ''}
                                            onChange={(e) => setReportParams(prev => ({
                                                ...prev,
                                                [param.name]: e.target.value
                                            }))}
                                            required={param.required}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    )}

                                    {param.type === 'select' && (
                                        <FormControl fullWidth>
                                            <InputLabel>{param.label}</InputLabel>
                                            <Select
                                                value={reportParams[param.name] || param.options?.[0] || ''}
                                                label={param.label}
                                                onChange={(e) => setReportParams(prev => ({
                                                    ...prev,
                                                    [param.name]: e.target.value
                                                }))}
                                            >
                                                {param.options?.map((option) => (
                                                    <MenuItem key={option} value={option}>
                                                        {option}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}

                                    {param.type === 'boolean' && (
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={reportParams[param.name] ?? param.defaultValue ?? false}
                                                    onChange={(e) => setReportParams(prev => ({
                                                        ...prev,
                                                        [param.name]: e.target.checked
                                                    }))}
                                                />
                                            }
                                            label={param.label}
                                        />
                                    )}
                                </Box>
                            ))}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowGenerateDialog(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleGenerateConfirm}
                        variant="contained"
                        disabled={generatingReport}
                        startIcon={generatingReport ? <CircularProgress size={20} /> : <AddIcon />}
                    >
                        {generatingReport ? 'Generando...' : 'Generar Reporte'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Información adicional */}
            <Box sx={{ mt: 4 }}>
                <Paper elevation={1} sx={{ p: 3, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <CompanyIcon sx={{ mr: 1 }} />
                        Información del Sistema de Reportes Personalizados
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Alineación Dashboard:</strong> Reportes estructurados según las 4 pestañas principales del dashboard ejecutivo
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Duración:</strong> Los reportes tienen una duración de 180 días antes de expirar automáticamente
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Seguridad:</strong> Todos los reportes se almacenan con cifrado y acceso restringido por organización
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Formatos:</strong> PDF profesional con logos, tablas y gráficas especializadas
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Integración IA:</strong> Recomendaciones y análisis predictivo incluidos en reportes especializados
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Personalización:</strong> Parámetros configurables según necesidades específicas de cada módulo
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        </Container>
    );
};

export default UnifiedReports;
