import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    LinearProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Stack,
    Typography,
    useTheme
} from '@mui/material';
import {
    AlertTriangleIcon,
    BarChart3Icon,
    MapPinIcon,
    TrendingUpIcon,
    ZapIcon
} from 'lucide-react';
import React from 'react';
import { StabilityIndexEvent } from '../hooks/useStabilityIndexEvents';

interface SmartAnalysis {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    totalEvents: number;
    criticalEvents: number;
    dangerEvents: number;
    moderateEvents: number;
    recommendations: Array<{
        id: string;
        priority: 'high' | 'medium' | 'low';
        title: string;
        description: string;
        action: string;
        category: 'safety' | 'performance' | 'maintenance' | 'training';
    }>;
    patterns: Array<{
        type: string;
        description: string;
        frequency: number;
    }>;
    hotspots: Array<{
        lat: number;
        lon: number;
        eventCount: number;
        severity: string;
    }>;
}

interface SmartControlPanelProps {
    events: StabilityIndexEvent[];
    onEventSelect?: (event: StabilityIndexEvent) => void;
}

const SmartControlPanel: React.FC<SmartControlPanelProps> = ({
    events,
    onEventSelect
}) => {
    const theme = useTheme();

    // Análisis inteligente de eventos
    const analysis: SmartAnalysis = React.useMemo(() => {
        if (!events || events.length === 0) {
            return {
                riskLevel: 'low',
                riskScore: 0,
                totalEvents: 0,
                criticalEvents: 0,
                dangerEvents: 0,
                moderateEvents: 0,
                recommendations: [],
                patterns: [],
                hotspots: []
            };
        }

        // Usar los valores correctos según el tipo StabilityLevel
        const criticalEvents = events.filter(e => e.level === 'critical').length;
        const moderateEvents = events.filter(e => e.level === 'moderate').length;
        const dangerEvents = events.filter(e => e.level === 'danger').length;

        // Calcular score de riesgo
        const riskScore = events.length > 0 ?
            (criticalEvents * 100 + dangerEvents * 75 + moderateEvents * 50) / events.length : 0;

        let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (riskScore >= 80) riskLevel = 'critical';
        else if (riskScore >= 60) riskLevel = 'high';
        else if (riskScore >= 30) riskLevel = 'medium';

        // Analizar patrones
        const typeCount: Record<string, number> = {};
        events.forEach(event => {
            event.tipos?.forEach(tipo => {
                typeCount[tipo] = (typeCount[tipo] || 0) + 1;
            });
        });

        const patterns = Object.entries(typeCount)
            .map(([type, count]) => ({
                type,
                description: getPatternDescription(type, count, events.length),
                frequency: (count / events.length) * 100
            }))
            .filter(p => p.frequency > 5) // Solo patrones significativos
            .sort((a, b) => b.frequency - a.frequency);

        // Generar recomendaciones
        const recommendations = generateRecommendations(events, patterns, riskLevel);

        // Identificar hotspots
        const hotspots = identifyHotspots(events);

        return {
            riskLevel,
            riskScore,
            totalEvents: events.length,
            criticalEvents,
            dangerEvents,
            moderateEvents,
            recommendations,
            patterns,
            hotspots
        };
    }, [events]);

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'critical': return theme.palette.error.main;
            case 'high': return theme.palette.warning.main;
            case 'medium': return theme.palette.info.main;
            default: return theme.palette.success.main;
        }
    };

    const getRiskLabel = (level: string) => {
        switch (level) {
            case 'critical': return 'CRÍTICO';
            case 'high': return 'ALTO';
            case 'medium': return 'MEDIO';
            default: return 'BAJO';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'high': return <AlertTriangleIcon size={16} />;
            case 'medium': return <TrendingUpIcon size={16} />;
            default: return <ZapIcon size={16} />;
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header de Análisis */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: getRiskColor(analysis.riskLevel), color: 'white' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            ANÁLISIS INTELIGENTE
                        </Typography>
                        <Typography variant="body1">
                            Nivel de Riesgo: {getRiskLabel(analysis.riskLevel)} ({analysis.riskScore.toFixed(0)}/100)
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {analysis.totalEvents}
                        </Typography>
                        <Typography variant="body2">
                            Eventos Analizados
                        </Typography>
                    </Box>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={analysis.riskScore}
                    sx={{
                        mt: 2,
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(255,255,255,0.3)',
                        '& .MuiLinearProgress-bar': {
                            bgcolor: 'white'
                        }
                    }}
                />
            </Paper>

            <Grid container spacing={3}>
                {/* Distribución de Eventos */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                📊 Distribución de Eventos
                            </Typography>
                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2">Críticos</Typography>
                                    <Chip
                                        label={analysis.criticalEvents}
                                        color="error"
                                        size="small"
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2">Peligrosos</Typography>
                                    <Chip
                                        label={analysis.dangerEvents}
                                        color="warning"
                                        size="small"
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2">Moderados</Typography>
                                    <Chip
                                        label={analysis.moderateEvents}
                                        color="info"
                                        size="small"
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2">Puntos de Interés</Typography>
                                    <Chip
                                        label={events.filter(e => e.perc >= 50 && e.perc < 60).length}
                                        color="success"
                                        size="small"
                                    />
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Patrones Detectados */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                🔍 Patrones Detectados
                            </Typography>
                            {analysis.patterns.length > 0 ? (
                                <List dense>
                                    {analysis.patterns.slice(0, 3).map((pattern, index) => (
                                        <ListItem key={index} sx={{ px: 0 }}>
                                            <ListItemIcon>
                                                <BarChart3Icon size={20} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={pattern.type.replace('_', ' ').toUpperCase()}
                                                secondary={`${pattern.frequency.toFixed(1)}% de eventos - ${pattern.description}`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No se detectaron patrones significativos
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Recomendaciones */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                💡 Recomendaciones Inteligentes
                            </Typography>
                            {analysis.recommendations.length > 0 ? (
                                <Grid container spacing={2}>
                                    {analysis.recommendations.map((rec, index) => (
                                        <Grid item xs={12} md={6} key={rec.id}>
                                            <Alert
                                                severity={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'info'}
                                                action={
                                                    <Button
                                                        color="inherit"
                                                        size="small"
                                                        onClick={() => onEventSelect?.(rec.id)}
                                                    >
                                                        {rec.action}
                                                    </Button>
                                                }
                                            >
                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                    {rec.title}
                                                </Typography>
                                                <Typography variant="body2">
                                                    {rec.description}
                                                </Typography>
                                            </Alert>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Alert severity="success">
                                    <Typography variant="subtitle2">
                                        ✅ Todo en orden
                                    </Typography>
                                    <Typography variant="body2">
                                        No se requieren acciones inmediatas. El sistema está operando dentro de parámetros normales.
                                    </Typography>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Hotspots */}
                {analysis.hotspots.length > 0 && (
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    📍 Zonas de Alto Riesgo
                                </Typography>
                                <Grid container spacing={2}>
                                    {analysis.hotspots.slice(0, 3).map((hotspot, index) => (
                                        <Grid item xs={12} md={4} key={index}>
                                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                                                <MapPinIcon size={32} color={theme.palette.error.main} />
                                                <Typography variant="h6" sx={{ mt: 1 }}>
                                                    {hotspot.eventCount} eventos
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Lat: {hotspot.lat.toFixed(4)}, Lon: {hotspot.lon.toFixed(4)}
                                                </Typography>
                                                <Chip
                                                    label={hotspot.severity}
                                                    color="error"
                                                    size="small"
                                                    sx={{ mt: 1 }}
                                                />
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

// Funciones auxiliares
function getPatternDescription(type: string, count: number, total: number): string {
    const percentage = (count / total * 100).toFixed(1);
    const descriptions: Record<string, string> = {
        'curva_brusca': `Maniobras bruscas frecuentes (${percentage}%)`,
        'limite_superado_velocidad': `Excesos de velocidad recurrentes (${percentage}%)`,
        'terreno_irregular': `Terreno irregular constante (${percentage}%)`,
        'pendiente_lateral': `Pendientes laterales frecuentes (${percentage}%)`,
        'maniobra_brusca': `Comportamiento de conducción agresivo (${percentage}%)`,
        'perdida_adherencia': `Problemas de adherencia repetidos (${percentage}%)`,
        'sin_causa_clara': `Eventos sin causa identificada (${percentage}%)`
    };
    return descriptions[type] || `Patrón ${type} detectado (${percentage}%)`;
}

function generateRecommendations(
    events: StabilityIndexEvent[],
    patterns: any[],
    riskLevel: string
): SmartAnalysis['recommendations'] {
    const recommendations: SmartAnalysis['recommendations'] = [];

    // Recomendaciones basadas en nivel de riesgo
    if (riskLevel === 'critical') {
        recommendations.push({
            id: 'immediate-inspection',
            priority: 'high',
            title: 'Inspección Inmediata Requerida',
            description: 'El vehículo presenta múltiples eventos críticos. Se recomienda detener operaciones.',
            action: 'Inspeccionar',
            category: 'safety'
        });
    }

    // Recomendaciones basadas en patrones
    patterns.forEach(pattern => {
        if (pattern.type === 'limite_superado_velocidad' && pattern.frequency > 20) {
            recommendations.push({
                id: 'speed-training',
                priority: 'high',
                title: 'Entrenamiento en Velocidad',
                description: 'Patrón de exceso de velocidad detectado. Capacitación requerida.',
                action: 'Programar',
                category: 'training'
            });
        }

        if (pattern.type === 'maniobra_brusca' && pattern.frequency > 15) {
            recommendations.push({
                id: 'driving-behavior',
                priority: 'medium',
                title: 'Revisión de Comportamiento de Conducción',
                description: 'Maniobras bruscas frecuentes pueden indicar necesidad de entrenamiento.',
                action: 'Evaluar',
                category: 'training'
            });
        }

        if (pattern.type === 'terreno_irregular' && pattern.frequency > 25) {
            recommendations.push({
                id: 'route-analysis',
                priority: 'medium',
                title: 'Análisis de Rutas',
                description: 'Considerar rutas alternativas para evitar terreno irregular.',
                action: 'Analizar',
                category: 'performance'
            });
        }
    });

    // Limitar a 4 recomendaciones más importantes
    return recommendations
        .sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        })
        .slice(0, 4);
}

function identifyHotspots(events: StabilityIndexEvent[]): SmartAnalysis['hotspots'] {
    // Agrupar eventos por proximidad geográfica
    const threshold = 0.001; // ~100 metros
    const clusters: Array<{ lat: number; lon: number; events: StabilityIndexEvent[] }> = [];

    events.forEach(event => {
        let added = false;
        for (const cluster of clusters) {
            const distance = Math.sqrt(
                Math.pow(cluster.lat - event.lat, 2) +
                Math.pow(cluster.lon - event.lon, 2)
            );
            if (distance < threshold) {
                cluster.events.push(event);
                // Recalcular centro
                cluster.lat = cluster.events.reduce((sum, e) => sum + e.lat, 0) / cluster.events.length;
                cluster.lon = cluster.events.reduce((sum, e) => sum + e.lon, 0) / cluster.events.length;
                added = true;
                break;
            }
        }
        if (!added) {
            clusters.push({ lat: event.lat, lon: event.lon, events: [event] });
        }
    });

    // Convertir clusters a hotspots (solo los que tienen múltiples eventos)
    return clusters
        .filter(cluster => cluster.events.length >= 3)
        .map(cluster => ({
            lat: cluster.lat,
            lon: cluster.lon,
            eventCount: cluster.events.length,
            severity: cluster.events.some(e => e.level === 'critical' || e.level === 'critico' || (e.perc < 30)) ? 'Crítica' : 'Moderada'
        }))
        .sort((a, b) => b.eventCount - a.eventCount)
        .slice(0, 5);
}

export default SmartControlPanel; 