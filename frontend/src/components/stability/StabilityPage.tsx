import {
    Assessment,
    Compare,
    Download,
    Refresh,
    TrendingDown,
    TrendingUp,
    Warning
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Tab,
    Tabs,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useState } from 'react';
import { StabilityFilters, StabilitySessionDTO } from '../../types/stability';
import { logger } from '../../utils/logger';

interface StabilityPageProps {
    initialSessionId?: string;
    initialFilters?: StabilityFilters;
}

export const StabilityPage: React.FC<StabilityPageProps> = ({
    initialSessionId,
    initialFilters
}) => {
    const [activeTab, setActiveTab] = useState(0);
    const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
    const [filters, setFilters] = useState<StabilityFilters>(initialFilters || {});
    const [isLoading] = useState(false);
    const [error] = useState<string | null>(null);

    // Mock data para desarrollo
    const mockSessions: StabilitySessionDTO[] = [
        {
            id: 'session-1',
            orgId: 'org-1',
            vehicleId: 'vehicle-1',
            startedAt: '2024-01-15T10:00:00Z',
            endedAt: '2024-01-15T11:30:00Z',
            duration: 5400,
            status: 'completed',
            metrics: {
                overallStability: 85,
                lateralAcceleration: { max: 0.8, avg: 0.3, std: 0.15 },
                longitudinalAcceleration: { max: 0.6, avg: 0.2, std: 0.12 },
                verticalAcceleration: { max: 0.4, avg: 0.1, std: 0.08 },
                stabilityIndex: 82,
                riskLevel: 'medium',
                instabilityCount: 12,
                criticalEventsCount: 3
            },
            events: [],
            summary: {
                totalDuration: 5400,
                stabilityScore: 85,
                riskAssessment: 'Moderado',
                recommendations: ['Revisar amortiguadores', 'Verificar presión de neumáticos'],
                topInstabilities: [
                    { type: 'lateral_instability', count: 8, severity: 'medium' },
                    { type: 'longitudinal_instability', count: 4, severity: 'low' }
                ],
                performance: { excellent: 45, good: 35, fair: 15, poor: 5 }
            },
            version: 1
        }
    ];

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleSessionSelect = (sessionId: string, selected: boolean) => {
        if (selected) {
            setSelectedSessions(prev => [...prev, sessionId]);
        } else {
            setSelectedSessions(prev => prev.filter(id => id !== sessionId));
        }
    };

    const handleCompareSession = () => {
        if (selectedSessions.length < 2) {
            alert('Selecciona al menos 2 sesiones para comparar');
            return;
        }

        logger.info('Iniciando comparación de sesiones', { sessionIds: selectedSessions });
        // TODO: Implementar comparación
    };

    const handleExportSession = (sessionId: string) => {
        logger.info('Exportando sesión de estabilidad', { sessionId });
        // TODO: Implementar exportación
    };

    const handleRefreshData = () => {
        logger.info('Refrescando datos de estabilidad');
        // TODO: Implementar refresh
    };

    const getStabilityColor = (score: number) => {
        if (score >= 90) return '#4caf50'; // Verde
        if (score >= 70) return '#ff9800'; // Naranja
        if (score >= 50) return '#f44336'; // Rojo
        return '#d32f2f'; // Rojo oscuro
    };

    const getRiskIcon = (riskLevel: string) => {
        switch (riskLevel) {
            case 'low':
                return <TrendingUp color="success" />;
            case 'medium':
                return <Warning color="warning" />;
            case 'high':
            case 'critical':
                return <TrendingDown color="error" />;
            default:
                return <Assessment />;
        }
    };

    if (isLoading) {
        return (
            <Box className="h-full flex items-center justify-center">
                <CircularProgress />
                <Typography className="ml-2">Cargando datos de estabilidad...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box className="h-full p-4">
                <Alert severity="error">
                    Error cargando datos de estabilidad: {error}
                </Alert>
            </Box>
        );
    }

    return (
        <Box className="h-full flex flex-col">
            {/* Header */}
            <Box className="mb-4">
                <Box className="flex items-center justify-between mb-2">
                    <Box className="flex items-center gap-2">
                        <Assessment />
                        <Typography variant="h4" className="font-bold">
                            Análisis de Estabilidad
                        </Typography>
                    </Box>

                    <Box className="flex items-center gap-2">
                        <Tooltip title="Comparar sesiones">
                            <IconButton
                                onClick={handleCompareSession}
                                disabled={selectedSessions.length < 2}
                                color="primary"
                            >
                                <Compare />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Refrescar datos">
                            <IconButton onClick={handleRefreshData}>
                                <Refresh />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                <Typography variant="body1" className="text-gray-600">
                    Análisis de estabilidad vehicular con métricas de aceleración y eventos críticos
                </Typography>
            </Box>

            {/* Filtros rápidos */}
            <Card className="mb-4">
                <CardContent className="py-2">
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Vehículo</InputLabel>
                                <Select
                                    value={filters.vehicleId || ''}
                                    onChange={(e) => setFilters(prev => ({ ...prev, vehicleId: e.target.value }))}
                                    label="Vehículo"
                                >
                                    <MenuItem value="">Todos</MenuItem>
                                    <MenuItem value="vehicle-1">Vehículo 001</MenuItem>
                                    <MenuItem value="vehicle-2">Vehículo 002</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Nivel de Riesgo</InputLabel>
                                <Select
                                    value={filters.riskLevel || ''}
                                    onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value as any }))}
                                    label="Nivel de Riesgo"
                                >
                                    <MenuItem value="">Todos</MenuItem>
                                    <MenuItem value="low">Bajo</MenuItem>
                                    <MenuItem value="medium">Medio</MenuItem>
                                    <MenuItem value="high">Alto</MenuItem>
                                    <MenuItem value="critical">Crítico</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6} md={2}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => setFilters({})}
                                size="small"
                            >
                                Limpiar
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Card className="flex-1 flex flex-col">
                <Box className="border-b border-gray-200">
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        className="min-h-0"
                    >
                        <Tab label="Vista General" />
                        <Tab label="Métricas Detalladas" />
                        <Tab label="Comparación" />
                        <Tab label="Eventos" />
                    </Tabs>
                </Box>

                {/* Tab Content */}
                <CardContent className="flex-1 p-4">
                    {activeTab === 0 && (
                        <Grid container spacing={3}>
                            {mockSessions.map((session) => (
                                <Grid item xs={12} md={6} lg={4} key={session.id}>
                                    <Card className="h-full">
                                        <CardContent>
                                            <Box className="flex items-center justify-between mb-2">
                                                <Typography variant="h6" className="font-bold">
                                                    Sesión {session.id.slice(-4)}
                                                </Typography>
                                                <Box className="flex items-center gap-1">
                                                    {getRiskIcon(session.metrics.riskLevel)}
                                                    <Tooltip title="Exportar">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleExportSession(session.id)}
                                                        >
                                                            <Download />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Box>

                                            <Typography variant="body2" className="text-gray-600 mb-3">
                                                {new Date(session.startedAt).toLocaleString()}
                                            </Typography>

                                            <Box className="space-y-2">
                                                <Box className="flex justify-between items-center">
                                                    <Typography variant="body2">Estabilidad General:</Typography>
                                                    <Typography
                                                        variant="body2"
                                                        className="font-bold"
                                                        style={{ color: getStabilityColor(session.metrics.overallStability) }}
                                                    >
                                                        {session.metrics.overallStability}%
                                                    </Typography>
                                                </Box>

                                                <Box className="flex justify-between items-center">
                                                    <Typography variant="body2">Eventos Críticos:</Typography>
                                                    <Typography variant="body2" className="font-bold">
                                                        {session.metrics.criticalEventsCount}
                                                    </Typography>
                                                </Box>

                                                <Box className="flex justify-between items-center">
                                                    <Typography variant="body2">Nivel de Riesgo:</Typography>
                                                    <Typography variant="body2" className="font-bold">
                                                        {session.metrics.riskLevel}
                                                    </Typography>
                                                </Box>

                                                <Box className="flex justify-between items-center">
                                                    <Typography variant="body2">Duración:</Typography>
                                                    <Typography variant="body2" className="font-bold">
                                                        {Math.round((session.duration || 0) / 60)} min
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {activeTab === 1 && (
                        <Box>
                            <Typography variant="h6" className="mb-4">
                                Métricas Detalladas
                            </Typography>
                            <Alert severity="info">
                                Vista de métricas detalladas en desarrollo...
                            </Alert>
                        </Box>
                    )}

                    {activeTab === 2 && (
                        <Box>
                            <Typography variant="h6" className="mb-4">
                                Comparación de Sesiones
                            </Typography>
                            <Alert severity="info">
                                Vista de comparación en desarrollo...
                            </Alert>
                        </Box>
                    )}

                    {activeTab === 3 && (
                        <Box>
                            <Typography variant="h6" className="mb-4">
                                Eventos Críticos
                            </Typography>
                            <Alert severity="info">
                                Vista de eventos en desarrollo...
                            </Alert>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};
