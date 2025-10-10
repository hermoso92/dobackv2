import {
    PanTool as BrakingIcon,
    DoubleArrow as CorrelationIcon,
    Error as CriticalIcon,
    Settings as EngineIcon,
    CompareArrows as RollIcon,
    Speed as SpeedIcon,
    TurnSlightRight as TurningIcon,
    WarningAmber as WarningIcon
} from '@mui/icons-material';
import {
    Timeline,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
    TimelineItem,
    TimelineOppositeContent,
    TimelineSeparator
} from '@mui/lab';
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    LinearProgress,
    Paper,
    Typography,
    useTheme
} from '@mui/material';
import { useEffect, useState } from 'react';
import { t } from "../i18n";

// Tipos de datos
interface StabilityDataPoint {
    time: number;
    roll: number;
    pitch: number;
    lateralAcceleration: number;
    speed: number;
    ltr: number;
    ssf: number;
    drs: number;
    ssc: number;
    [key: string]: number;
}

interface CANDataPoint {
    time: number;
    engineRPM: number;
    throttlePosition: number;
    brakePosition: number;
    steeringAngle: number;
    fuelLevel: number;
    engineTemp: number;
    transmission: number;
    [key: string]: number;
}

interface CrossEvent {
    id: number;
    time: number;
    type: 'warning' | 'critical';
    title: string;
    description: string;
    stabilityValues: {
        [key: string]: number;
    };
    canValues: {
        [key: string]: number;
    };
    correlations: string[];
    risk: number; // 0-100
}

interface TimelineEvent {
    id: number;
    time: number;
    type: 'warning' | 'critical' | 'correlation';
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    details?: string;
}

interface CrossAnalysisPanelProps {
    stabilityData: StabilityDataPoint[];
    canData: CANDataPoint[];
    onEventsDetected?: (events: CrossEvent[]) => void;
}

// Función para interpolar datos CAN al tiempo de los datos de estabilidad
const interpolateCANData = (stabilityData: StabilityDataPoint[], canData: CANDataPoint[]): (StabilityDataPoint & CANDataPoint)[] => {
    return stabilityData.map(stabilityPoint => {
        // Buscar los puntos de datos CAN más cercanos
        const closestCANPoint = canData.reduce((prev, curr) => {
            return Math.abs(curr.time - stabilityPoint.time) < Math.abs(prev.time - stabilityPoint.time) ? curr : prev;
        }, canData[0]);

        // Combinar los datos
        return {
            ...stabilityPoint,
            ...closestCANPoint
        };
    });
};

// Función para detectar patrones de riesgo cruzados
const detectCrossPatterns = (combinedData: (StabilityDataPoint & CANDataPoint)[]): CrossEvent[] => {
    const events: CrossEvent[] = [];
    let eventId = 1;

    // Umbrales para detección
    const thresholds = {
        ltr: 0.8,
        ssf: 1.2,
        drs: 6.5,
        roll: 15,
        lateralAcceleration: 0.6,
        steeringAngle: 30,
        brakePosition: 0.8,
        throttlePosition: 0.9,
        engineRPM: 4000
    };

    // Analizar cada punto de datos
    combinedData.forEach((point, index) => {
        if (index === 0) return; // Omitir el primer punto para tener uno anterior para comparación

        const prevPoint = combinedData[index - 1];
        const correlations: string[] = [];
        let type: 'warning' | 'critical' = 'warning';
        let title = '';
        let description = '';
        let detected = false;
        let risk = 0;

        // Detección de patrón 1: Vuelco inminente (LTR alto + Roll alto + Aceleración lateral alta)
        if (point.ltr > thresholds.ltr && Math.abs(point.roll) > thresholds.roll && Math.abs(point.lateralAcceleration) > thresholds.lateralAcceleration) {
            detected = true;
            type = 'critical';
            title = 'Patrón de vuelco inminente';
            description = 'Alta carga lateral (LTR), inclinación elevada y fuerte aceleración lateral simultáneas';
            correlations.push('Relación LTR-Roll-Aceleración');
            risk = Math.min(100, (point.ltr / thresholds.ltr) * 70 + (Math.abs(point.roll) / thresholds.roll) * 30);
        }

        // Detección de patrón 2: Giro rápido a alta velocidad
        else if (
            Math.abs(point.steeringAngle) > thresholds.steeringAngle &&
            point.speed > 70 &&
            Math.abs(point.steeringAngle - prevPoint.steeringAngle) > 15
        ) {
            detected = true;
            type = point.ltr > 0.6 ? 'critical' : 'warning';
            title = 'Giro rápido a alta velocidad';
            description = 'Cambio brusco de dirección manteniendo alta velocidad';
            correlations.push('Relación Volante-Velocidad-LTR');
            risk = 60 + (point.ltr * 40);
        }

        // Detección de patrón 3: Frenado brusco en curva
        else if (
            point.brakePosition > thresholds.brakePosition &&
            Math.abs(point.steeringAngle) > thresholds.steeringAngle / 2 &&
            point.speed > 50
        ) {
            detected = true;
            type = point.ltr > 0.7 ? 'critical' : 'warning';
            title = 'Frenado brusco en curva';
            description = 'Aplicación fuerte del freno mientras se negocia una curva';
            correlations.push('Relación Freno-Volante-Velocidad');
            risk = 50 + (point.ltr * 50);
        }

        // Detección de patrón 4: Aceleración fuerte en curva
        else if (
            point.throttlePosition > thresholds.throttlePosition &&
            Math.abs(point.steeringAngle) > thresholds.steeringAngle / 2 &&
            (point.speed - prevPoint.speed) > 5
        ) {
            detected = true;
            type = point.ltr > 0.65 ? 'critical' : 'warning';
            title = 'Aceleración fuerte en curva';
            description = 'Aceleración excesiva mientras se negocia una curva';
            correlations.push('Relación Acelerador-Volante-LTR');
            risk = 45 + (point.ltr * 55);
        }

        // Detección de patrón 5: Movimiento de pendular (roll oscilante)
        else if (
            index > 2 &&
            Math.sign(point.roll) !== Math.sign(combinedData[index - 2].roll) &&
            Math.abs(point.roll) > thresholds.roll / 2 &&
            Math.abs(combinedData[index - 2].roll) > thresholds.roll / 2
        ) {
            detected = true;
            type = 'warning';
            title = 'Movimiento pendular detectado';
            description = 'Oscilación peligrosa del vehículo de lado a lado';
            correlations.push('Patrón de Roll Oscilante');
            risk = 65;
        }

        // Detección de patrón 6: Cambio de marcha en curva cerrada
        else if (
            index > 0 &&
            point.transmission !== prevPoint.transmission &&
            Math.abs(point.steeringAngle) > thresholds.steeringAngle &&
            point.ltr > 0.6
        ) {
            detected = true;
            type = 'warning';
            title = 'Cambio de marcha en curva cerrada';
            description = 'Cambio de marcha durante una maniobra de giro pronunciada';
            correlations.push('Relación Transmisión-Volante-LTR');
            risk = 55;
        }

        // Si se detectó algún patrón, crear el evento
        if (detected) {
            events.push({
                id: eventId++,
                time: point.time,
                type,
                title,
                description,
                stabilityValues: {
                    ltr: point.ltr,
                    ssf: point.ssf,
                    drs: point.drs,
                    roll: point.roll,
                    pitch: point.pitch,
                    lateralAcceleration: point.lateralAcceleration,
                    speed: point.speed
                },
                canValues: {
                    engineRPM: point.engineRPM,
                    throttlePosition: point.throttlePosition,
                    brakePosition: point.brakePosition,
                    steeringAngle: point.steeringAngle,
                    fuelLevel: point.fuelLevel,
                    engineTemp: point.engineTemp
                },
                correlations,
                risk
            });
        }
    });

    return events;
};

const CrossAnalysisPanel = ({ stabilityData, canData, onEventsDetected }: CrossAnalysisPanelProps) => {
    const theme = useTheme();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [crossEvents, setCrossEvents] = useState<CrossEvent[]>([]);
    const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

    // Realizar análisis cuando cambian los datos
    useEffect(() => {
        if (stabilityData.length > 0 && canData.length > 0) {
            setIsAnalyzing(true);

            // Simular un breve retardo para el procesamiento
            const timer = setTimeout(() => {
                // Interpolar datos CAN a los tiempos de estabilidad
                const combinedData = interpolateCANData(stabilityData, canData);

                // Detectar patrones cruzados
                const events = detectCrossPatterns(combinedData);
                setCrossEvents(events);

                // Convertir a eventos de línea de tiempo
                const timeline = createTimelineEvents(events);
                setTimelineEvents(timeline);

                // Notificar eventos detectados
                if (onEventsDetected) {
                    onEventsDetected(events);
                }

                setIsAnalyzing(false);
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [stabilityData, canData, onEventsDetected]);

    // Crear eventos de línea de tiempo a partir de eventos cruzados
    const createTimelineEvents = (events: CrossEvent[]): TimelineEvent[] => {
        const timeline: TimelineEvent[] = [];

        events.forEach(event => {
            // Evento principal
            timeline.push({
                id: event.id * 10,
                time: event.time,
                type: event.type,
                title: event.title,
                subtitle: `Nivel de riesgo: ${event.risk.toFixed(0)}%`,
                icon: event.type === 'critical' ? <CriticalIcon /> : <WarningIcon />,
                details: event.description
            });

            // Eventos de correlación
            event.correlations.forEach((correlation, index) => {
                timeline.push({
                    id: event.id * 10 + index + 1,
                    time: event.time + 0.5 + index * 0.5,
                    type: 'correlation',
                    title: correlation,
                    icon: getCorrelationIcon(correlation),
                });
            });
        });

        // Ordenar por tiempo
        return timeline.sort((a, b) => a.time - b.time);
    };

    // Obtener icono apropiado para cada tipo de correlación
    const getCorrelationIcon = (correlation: string) => {
        if (correlation.includes('Volante-Velocidad')) return <SpeedIcon />;
        if (correlation.includes('Freno')) return <BrakingIcon />;
        if (correlation.includes('Volante')) return <TurningIcon />;
        if (correlation.includes('Roll')) return <RollIcon />;
        if (correlation.includes('Transmisión') || correlation.includes('Motor')) return <EngineIcon />;
        return <CorrelationIcon />;
    };

    // Formatear tiempo para mostrar
    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    // Obtener color según el tipo de evento
    const getEventColor = (type: string) => {
        switch (type) {
            case 'critical': return theme.palette.error.main;
            case 'warning': return theme.palette.warning.main;
            case 'correlation': return theme.palette.info.main;
            default: return theme.palette.grey[500];
        }
    };

    // Estadísticas básicas
    const statsData = {
        totalEvents: crossEvents.length,
        criticalEvents: crossEvents.filter(e => e.type === 'critical').length,
        warningEvents: crossEvents.filter(e => e.type === 'warning').length,
        averageRisk: crossEvents.length > 0
            ? crossEvents.reduce((sum, event) => sum + event.risk, 0) / crossEvents.length
            : 0
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    {t('analisis_cruzado_de_estabilidad_y_can')}</Typography>

                {isAnalyzing ? (
                    <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {t('analizando_patrones_cruzados')}</Typography>
                        <LinearProgress />
                    </Box>
                ) : (
                    <>
                        {/* Resumen de eventos */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="h3">{statsData.totalEvents}</Typography>
                                    <Typography variant="body2">{t('eventos_detectados')}</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: `${theme.palette.error.light}20` }}>
                                    <Typography variant="h3" color="error">{statsData.criticalEvents}</Typography>
                                    <Typography variant="body2">{t('eventos_criticos')}</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: `${theme.palette.warning.light}20` }}>
                                    <Typography variant="h3" color="warning.main">{statsData.warningEvents}</Typography>
                                    <Typography variant="body2">{t('advertencias')}</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="h3">{statsData.averageRisk.toFixed(0)}%</Typography>
                                    <Typography variant="body2">{t('riesgo_promedio')}</Typography>
                                </Paper>
                            </Grid>
                        </Grid>

                        {crossEvents.length === 0 ? (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                {t('no_se_detectaron_patrones_de_riesgo_cruzados_en_esta_sesion')}</Alert>
                        ) : (
                            <>
                                {/* Línea de tiempo de eventos */}
                                <Typography variant="subtitle1" gutterBottom>
                                    {t('linea_de_tiempo_de_eventos')}</Typography>
                                <Box sx={{ maxHeight: 400, overflowY: 'auto', mb: 3 }}>
                                    <Timeline position="alternate">
                                        {timelineEvents.map((event) => (
                                            <TimelineItem key={event.id}>
                                                <TimelineOppositeContent color="text.secondary">
                                                    {formatTime(event.time)}
                                                </TimelineOppositeContent>
                                                <TimelineSeparator>
                                                    <TimelineDot sx={{ bgcolor: getEventColor(event.type) }}>
                                                        {event.icon}
                                                    </TimelineDot>
                                                    <TimelineConnector />
                                                </TimelineSeparator>
                                                <TimelineContent>
                                                    <Typography variant="subtitle2" component="span">
                                                        {event.title}
                                                    </Typography>
                                                    {event.subtitle && (
                                                        <Typography variant="caption" display="block" color="text.secondary">
                                                            {event.subtitle}
                                                        </Typography>
                                                    )}
                                                    {event.details && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {event.details}
                                                        </Typography>
                                                    )}
                                                </TimelineContent>
                                            </TimelineItem>
                                        ))}
                                    </Timeline>
                                </Box>

                                {/* Detalles de eventos críticos */}
                                {statsData.criticalEvents > 0 && (
                                    <>
                                        <Typography variant="subtitle1" gutterBottom>
                                            {t('detalles_de_eventos_criticos')}</Typography>
                                        {crossEvents
                                            .filter(event => event.type === 'critical')
                                            .map(event => (
                                                <Paper key={event.id} sx={{ p: 2, mb: 2, borderLeft: `4px solid ${theme.palette.error.main}` }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                        <Typography variant="subtitle1" fontWeight="bold">
                                                            {event.title}
                                                        </Typography>
                                                        <Chip
                                                            label={`Riesgo: ${event.risk.toFixed(0)}%`}
                                                            color="error"
                                                            size="small"
                                                        />
                                                    </Box>
                                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                                        {event.description} {t('tiempo_1')}{formatTime(event.time)}
                                                    </Typography>
                                                    <Divider sx={{ my: 1 }} />
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={12} md={6}>
                                                            <Typography variant="body2" fontWeight="medium">
                                                                {t('datos_de_estabilidad')}</Typography>
                                                            <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                                                                <li>
                                                                    <Typography variant="body2" component="span">
                                                                        {t('ltr_1')}<b>{event.stabilityValues.ltr.toFixed(2)}</b>
                                                                    </Typography>
                                                                </li>
                                                                <li>
                                                                    <Typography variant="body2" component="span">
                                                                        {t('roll')}<b>{event.stabilityValues.roll.toFixed(2)}°</b>
                                                                    </Typography>
                                                                </li>
                                                                <li>
                                                                    <Typography variant="body2" component="span">
                                                                        {t('aceleracion_lateral_1')}<b>{event.stabilityValues.lateralAcceleration.toFixed(2)} {t('g')}</b>
                                                                    </Typography>
                                                                </li>
                                                            </ul>
                                                        </Grid>
                                                        <Grid item xs={12} md={6}>
                                                            <Typography variant="body2" fontWeight="medium">
                                                                {t('datos_can')}</Typography>
                                                            <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                                                                <li>
                                                                    <Typography variant="body2" component="span">
                                                                        {t('angulo_de_direccion')}<b>{event.canValues.steeringAngle.toFixed(1)}°</b>
                                                                    </Typography>
                                                                </li>
                                                                <li>
                                                                    <Typography variant="body2" component="span">
                                                                        {t('posicion_del_freno')}<b>{(event.canValues.brakePosition * 100).toFixed(0)}%</b>
                                                                    </Typography>
                                                                </li>
                                                                <li>
                                                                    <Typography variant="body2" component="span">
                                                                        {t('posicion_del_acelerador')}<b>{(event.canValues.throttlePosition * 100).toFixed(0)}%</b>
                                                                    </Typography>
                                                                </li>
                                                            </ul>
                                                        </Grid>
                                                    </Grid>
                                                </Paper>
                                            ))}
                                    </>
                                )}
                            </>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default CrossAnalysisPanel; 