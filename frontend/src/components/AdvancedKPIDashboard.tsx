import {
    DirectionsCar as CarIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    LocationOn as LocationIcon,
    Refresh as RefreshIcon,
    Settings as SettingsIcon,
    Speed as SpeedIcon,
    Timeline as TimelineIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    IconButton,
    Paper,
    Tooltip,
    Typography
} from '@mui/material';
// import { styled } from '@mui/material/styles'; // Removido para evitar errores
import React, { useEffect, useState } from 'react';

// Tipos de datos
interface KPICard {
    title: string;
    value: number;
    unit: string;
    icon: string;
    color: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary';
    status: 'good' | 'warning' | 'danger';
}

interface AdvancedKPIData {
    mainBoxes: KPICard[];
    speedBoxes: KPICard[];
    speedExcessBoxes: KPICard[];
    eventBoxes: KPICard[];
    statsBoxes: KPICard[];
    operationalKeys: KPICard[];
    rawData: any;
}

interface AdvancedKPIDashboardProps {
    vehicleId?: string;
    date?: string;
}

// Componentes estilizados
const DashboardContainer = (props: any) => (
    <Box
        sx={{
            padding: 3,
            backgroundColor: 'background.default',
            minHeight: '100vh'
        }}
        {...props}
    />
);

const SectionTitle = (props: any) => (
    <Typography
        variant="h6"
        sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            marginBottom: 2,
            fontWeight: 600,
            color: 'text.primary',
            '& .MuiSvgIcon-root': {
                fontSize: '1.5rem'
            }
        }}
        {...props}
    />
);

const KPICard = ({ status, ...props }: any) => (
    <Card
        sx={{
            height: '100%',
            transition: 'all 0.3s ease',
            border: `2px solid ${status === 'danger' ? 'error.main' :
                    status === 'warning' ? 'warning.main' :
                        'success.main'
                }`,
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 8
            }
        }}
        {...props}
    />
);

const StatusChip = ({ status, ...props }: any) => (
    <Chip
        sx={{
            backgroundColor:
                status === 'danger' ? 'error.main' :
                    status === 'warning' ? 'warning.main' :
                        'success.main',
            color: 'common.white',
            fontWeight: 600
        }}
        {...props}
    />
);

// Función para obtener el color del tema
function getThemeColor(color: string, theme: any) {
    switch (color) {
        case 'success': return theme.palette.success.main;
        case 'warning': return theme.palette.warning.main;
        case 'error': return theme.palette.error.main;
        case 'info': return theme.palette.info.main;
        case 'primary': return theme.palette.primary.main;
        case 'secondary': return theme.palette.secondary.main;
        default: return theme.palette.grey[500];
    }
}

// Función para obtener el icono
function getIcon(iconName: string) {
    switch (iconName) {
        case '🏢': return <LocationIcon />;
        case '🔧': return <SettingsIcon />;
        case '🚗': return <CarIcon />;
        case '⚡': return <SpeedIcon />;
        case '📊': return <TimelineIcon />;
        case '⚠️': return <WarningIcon />;
        case '🟡': return <WarningIcon />;
        case '🟠': return <WarningIcon />;
        case '🔴': return <ErrorIcon />;
        case '🛑': return <ErrorIcon />;
        case '🚨': return <ErrorIcon />;
        case 'ℹ️': return <InfoIcon />;
        case '📏': return <TimelineIcon />;
        case '🚀': return <SpeedIcon />;
        case '⏸️': return <InfoIcon />;
        case '📍': return <LocationIcon />;
        case '🔑': return <SettingsIcon />;
        default: return <InfoIcon />;
    }
}

// Función para obtener el texto del status
function getStatusText(status: string) {
    switch (status) {
        case 'good': return 'Bueno';
        case 'warning': return 'Advertencia';
        case 'danger': return 'Peligro';
        default: return 'Normal';
    }
}

export const AdvancedKPIDashboard: React.FC<AdvancedKPIDashboardProps> = ({
    vehicleId,
    date = new Date().toISOString().slice(0, 10)
}) => {
    const [kpiData, setKpiData] = useState<AdvancedKPIData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchKPIData = async () => {
        if (!vehicleId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/advanced-kpi/dashboard?vehicleId=${vehicleId}&date=${date}`,
                {
                    credentials: 'include'
                }
            );

            if (!response.ok) {
                throw new Error('Error al obtener datos de KPIs');
            }

            const result = await response.json();

            if (result.success) {
                setKpiData(result.data);
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKPIData();
    }, [vehicleId, date]);

    const renderKPICard = (card: KPICard, index: number) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <KPICard $status={card.status}>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                            {getIcon(card.icon)}
                            <Typography variant="h6" component="h3" fontWeight={600}>
                                {card.title}
                            </Typography>
                        </Box>
                        <StatusChip
                            label={getStatusText(card.status)}
                            size="small"
                            $status={card.status}
                        />
                    </Box>

                    <Box textAlign="center" py={2}>
                        <Typography variant="h4" component="div" fontWeight={700} color="primary">
                            {card.value.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {card.unit}
                        </Typography>
                    </Box>
                </CardContent>
            </KPICard>
        </Grid>
    );

    if (loading) {
        return (
            <DashboardContainer>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress size={60} />
                </Box>
            </DashboardContainer>
        );
    }

    if (error) {
        return (
            <DashboardContainer>
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            </DashboardContainer>
        );
    }

    if (!kpiData) {
        return (
            <DashboardContainer>
                <Alert severity="info">
                    No hay datos disponibles para mostrar
                </Alert>
            </DashboardContainer>
        );
    }

    return (
        <DashboardContainer>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1" fontWeight={700}>
                    Dashboard de KPIs Avanzados
                </Typography>
                <Tooltip title="Actualizar datos">
                    <IconButton onClick={fetchKPIData} color="primary">
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Métricas principales */}
            <Box mb={4}>
                <SectionTitle variant="h5">
                    <CarIcon />
                    Estados del Vehículo
                </SectionTitle>
                <Grid container spacing={2}>
                    {kpiData.mainBoxes.map(renderKPICard)}
                </Grid>
            </Box>

            {/* Métricas de velocidad */}
            <Box mb={4}>
                <SectionTitle variant="h5">
                    <SpeedIcon />
                    Velocidad y Excesos
                </SectionTitle>
                <Grid container spacing={2}>
                    {kpiData.speedBoxes.map(renderKPICard)}
                </Grid>
            </Box>

            {/* Excesos de velocidad detallados */}
            <Box mb={4}>
                <SectionTitle variant="h5">
                    <WarningIcon />
                    Excesos de Velocidad por Categoría
                </SectionTitle>
                <Grid container spacing={2}>
                    {kpiData.speedExcessBoxes.map(renderKPICard)}
                </Grid>
            </Box>

            {/* Eventos */}
            <Box mb={4}>
                <SectionTitle variant="h5">
                    <WarningIcon />
                    Eventos de Estabilidad
                </SectionTitle>
                <Grid container spacing={2}>
                    {kpiData.eventBoxes.map(renderKPICard)}
                </Grid>
            </Box>

            {/* Estadísticas generales */}
            <Box mb={4}>
                <SectionTitle variant="h5">
                    <TimelineIcon />
                    Estadísticas Generales
                </SectionTitle>
                <Grid container spacing={2}>
                    {kpiData.statsBoxes.map(renderKPICard)}
                </Grid>
            </Box>

            {/* Claves operativas */}
            <Box mb={4}>
                <SectionTitle variant="h5">
                    <SettingsIcon />
                    Claves Operativas
                </SectionTitle>
                <Grid container spacing={2}>
                    {kpiData.operationalKeys.map(renderKPICard)}
                </Grid>
            </Box>

            {/* Resumen */}
            <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Resumen Ejecutivo
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Tiempo total operativo:</strong> {kpiData.rawData.totalTiempo} minutos
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Distancia recorrida:</strong> {kpiData.rawData.distanciaRecorrida} km
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Velocidad máxima:</strong> {kpiData.rawData.maxVelocidadAlcanzada} km/h
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Eventos críticos:</strong> {kpiData.rawData.eventosCriticos}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Eventos peligrosos:</strong> {kpiData.rawData.eventosPeligrosos}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Puntos GPS analizados:</strong> {kpiData.rawData.totalPuntosGPS}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>
        </DashboardContainer>
    );
};

export default AdvancedKPIDashboard; 