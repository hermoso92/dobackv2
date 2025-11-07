import { Box, Paper, Typography } from '@mui/material';
import { format } from 'date-fns';
import React, { useMemo } from 'react';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { t } from "../i18n";
import {
    DangerInfo,
    ProcessedTelemetryPoint,
    TelemetryData,
    TrendInfo,
    VehicleConfig
} from '../types/stability';
import { logger } from '../utils/logger';
import {
    calculateDangerInfo,
    calculateDangerTrend
} from '../utils/stabilityCalculations';

interface DangerBarProps {
    telemetryData: TelemetryData[];
    vehicleConfig: VehicleConfig;
    showDetails?: boolean;
    timeWindow?: number;
}

/**
 * Componente para visualizar el nivel de peligrosidad del vehículo
 */
const DangerBar: React.FC<DangerBarProps> = ({
    telemetryData,
    vehicleConfig,
    showDetails = true,
    timeWindow = 60
}) => {
    // Si no hay datos, mostrar un mensaje indicativo
    if (!telemetryData || telemetryData.length === 0) {
        return (
            <Box sx={{ width: '100%' }}>
                <Paper
                    elevation={3}
                    sx={{
                        p: 2,
                        mb: 2,
                        borderRadius: 2,
                        borderLeft: 4,
                        borderColor: 'grey.400',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 150
                    }}
                >
                    <Typography variant="body1" color="text.secondary" align="center">
                        {t('no_hay_datos_de_telemetria_disponibles_para_mostrar_el_nivel_de_peligrosidad')}<br />
                        <span style={{ fontSize: '0.9rem' }}>
                            {t('los_datos_apareceran_aqui_cuando_esten_disponibles')}</span>
                    </Typography>
                </Paper>
            </Box>
        );
    }

    // Calcular información de peligrosidad con el último dato
    const dangerInfo: DangerInfo = useMemo(() => {
        if (!telemetryData.length) {
            logger.info('DangerBar: No hay datos de telemetría');
            return {
                dangerLevel: 0,
                level: 'safe',
                color: '#00FF00',
                description: 'Sin datos de telemetría',
                ltrValue: 0,
                ssfValue: 0,
                drsValue: 0
            };
        }

        logger.info(`DangerBar: Procesando ${telemetryData.length} puntos de datos`);
        const latestData = telemetryData[telemetryData.length - 1];
        logger.info('DangerBar: Último dato de telemetría:', latestData);

        try {
            const info = calculateDangerInfo(latestData, vehicleConfig);
            logger.info('DangerBar: Info de peligrosidad calculada:', info);
            return info;
        } catch (error) {
            logger.error('DangerBar: Error al calcular info de peligrosidad:', error);
            return {
                dangerLevel: 0,
                level: 'safe',
                color: '#FF0000',
                description: 'Error al procesar datos',
                ltrValue: 0,
                ssfValue: 0,
                drsValue: 0
            };
        }
    }, [telemetryData, vehicleConfig]);

    // Calcular tendencia de peligrosidad
    const trendInfo: TrendInfo = useMemo(() => {
        if (telemetryData.length < 2) {
            return {
                trend: 'stable',
                changeRate: 0,
                direction: 'none'
            };
        }

        return calculateDangerTrend(telemetryData, vehicleConfig);
    }, [telemetryData, vehicleConfig]);

    // Procesar datos para gráficas
    const processedData: ProcessedTelemetryPoint[] = useMemo(() => {
        if (!telemetryData.length) return [];

        // Filtrar por ventana de tiempo
        const now = Date.now();
        const cutoffTime = now - timeWindow * 1000;

        return telemetryData
            .filter(data => data.timestamp > cutoffTime)
            .map(data => {
                // Calcular información de peligrosidad para este punto
                const info = calculateDangerInfo(data, vehicleConfig);

                return {
                    timestamp: data.timestamp,
                    timeFormatted: format(data.timestamp, 'HH:mm:ss'),
                    ltr: info.ltrValue,
                    ssf: info.ssfValue,
                    drs: info.drsValue,
                    dangerLevel: info.dangerLevel
                };
            });
    }, [telemetryData, vehicleConfig, timeWindow]);

    // Calcular estadísticas
    const statistics = useMemo(() => {
        if (!processedData.length) {
            return { min: 0, max: 0, avg: 0, median: 0, stdDev: 0 };
        }

        const dangerLevels = processedData.map(d => d.dangerLevel);
        const sorted = [...dangerLevels].sort((a, b) => a - b);

        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const avg = dangerLevels.reduce((sum, level) => sum + level, 0) / dangerLevels.length;

        const midIndex = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 === 0
            ? (sorted[midIndex - 1] + sorted[midIndex]) / 2
            : sorted[midIndex];

        const squareDiffs = dangerLevels.map(level => Math.pow(level - avg, 2));
        const avgSquareDiff = squareDiffs.reduce((sum, sqDiff) => sum + sqDiff, 0) / squareDiffs.length;
        const stdDev = Math.sqrt(avgSquareDiff);

        return { min, max, avg, median, stdDev };
    }, [processedData]);

    // Formateo del nivel de peligro para mostrar
    const dangerLevelPercent = Math.round(dangerInfo.dangerLevel * 100);

    // Cálculo de contribuciones
    const ltrContribution = Math.round(dangerInfo.ltrValue * 100);
    const ssfContribution = Math.round((1 - Math.min(dangerInfo.ssfValue / 2, 1)) * 100);
    const drsContribution = Math.round((1 - Math.min(Math.max(dangerInfo.drsValue, 0), 1)) * 100);

    return (
        <Box sx={{ width: '100%' }}>
            <Paper
                elevation={3}
                sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    borderLeft: 4,
                    borderColor: dangerInfo.color
                }}
            >
                {/* Encabezado con nivel actual */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            {t('nivel_de_peligrosidad')}<Box
                                component="span"
                                sx={{
                                    ml: 2,
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 1,
                                    backgroundColor: dangerInfo.color,
                                    color: dangerInfo.level === 'safe' ? 'black' : 'white',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                }}
                            >
                                {dangerInfo.level === 'safe' && 'Seguro'}
                                {dangerInfo.level === 'warning' && 'Advertencia'}
                                {dangerInfo.level === 'danger' && 'Peligro'}
                                {dangerInfo.level === 'critical' && 'Crítico'}
                            </Box>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {dangerInfo.description}
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h4" sx={{ color: dangerInfo.color, fontWeight: 'bold' }}>
                            {dangerLevelPercent}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {trendInfo.trend === 'increasing' && '↑ Aumentando'}
                            {trendInfo.trend === 'decreasing' && '↓ Disminuyendo'}
                            {trendInfo.trend === 'stable' && '→ Estable'}
                        </Typography>
                    </Box>
                </Box>

                {/* Barra principal de peligrosidad */}
                <Box sx={{ mb: 2 }}>
                    <Box
                        sx={{
                            height: 12,
                            borderRadius: 2,
                            bgcolor: 'grey.200',
                            overflow: 'hidden',
                            position: 'relative'
                        }}
                    >
                        <Box
                            sx={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                height: '100%',
                                width: `${dangerLevelPercent}%`,
                                backgroundColor: dangerInfo.color,
                                borderRadius: 2,
                                transition: 'width 0.3s ease-in-out'
                            }}
                        />

                        {/* Umbrales 10%, 30%, 50% */}
                        <Box
                            sx={{
                                position: 'absolute',
                                left: '10%',
                                height: '100%',
                                borderLeft: '2px dashed rgba(255, 255, 0, 0.7)'
                            }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                left: '30%',
                                height: '100%',
                                borderLeft: '2px dashed rgba(255, 165, 0, 0.7)'
                            }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                left: '50%',
                                height: '100%',
                                borderLeft: '2px dashed rgba(255, 0, 0, 0.7)'
                            }}
                        />
                    </Box>

                    {/* Marcadores de texto */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">0%</Typography>
                        <Typography variant="caption" color="warning.main">10%</Typography>
                        <Typography variant="caption" color="orange">30%</Typography>
                        <Typography variant="caption" color="error.main">50%</Typography>
                        <Typography variant="caption" color="text.secondary">100%</Typography>
                    </Box>
                </Box>

                {/* Contribuciones individuales */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        {t('contribuciones_al_riesgo')}</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ flex: '1 1 30%' }}>
                            <Typography variant="body2">{t('ltr_2')}{ltrContribution}%</Typography>
                            <Box
                                sx={{
                                    height: 6,
                                    borderRadius: 1,
                                    bgcolor: 'grey.200',
                                    overflow: 'hidden',
                                    mt: 0.5
                                }}
                            >
                                <Box
                                    sx={{
                                        height: '100%',
                                        width: `${ltrContribution}%`,
                                        backgroundColor: '#FF0000',
                                    }}
                                />
                            </Box>
                        </Box>
                        <Box sx={{ flex: '1 1 30%' }}>
                            <Typography variant="body2">{t('ssf')}{ssfContribution}%</Typography>
                            <Box
                                sx={{
                                    height: 6,
                                    borderRadius: 1,
                                    bgcolor: 'grey.200',
                                    overflow: 'hidden',
                                    mt: 0.5
                                }}
                            >
                                <Box
                                    sx={{
                                        height: '100%',
                                        width: `${ssfContribution}%`,
                                        backgroundColor: '#FFA500',
                                    }}
                                />
                            </Box>
                        </Box>
                        <Box sx={{ flex: '1 1 30%' }}>
                            <Typography variant="body2">{t('drs')}{drsContribution}%</Typography>
                            <Box
                                sx={{
                                    height: 6,
                                    borderRadius: 1,
                                    bgcolor: 'grey.200',
                                    overflow: 'hidden',
                                    mt: 0.5
                                }}
                            >
                                <Box
                                    sx={{
                                        height: '100%',
                                        width: `${drsContribution}%`,
                                        backgroundColor: '#FFFF00',
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* Estadísticas rápidas */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        py: 1,
                        px: 2,
                        bgcolor: 'background.default',
                        borderRadius: 1
                    }}
                >
                    <Typography variant="caption">
                        {t('min_1')}{(statistics.min * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption">
                        {t('max_1')}{(statistics.max * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption">
                        {t('avg')}{(statistics.avg * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption">
                        {t('med_1')}{(statistics.median * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption">
                        σ: {(statistics.stdDev * 100).toFixed(1)}%
                    </Typography>
                </Box>
            </Paper>

            {/* Gráfica detallada */}
            {showDetails && processedData.length > 1 && (
                <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        {t('evolucion_del_nivel_de_peligrosidad')}</Typography>
                    <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={processedData}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="timeFormatted"
                                    label={{ value: 'Tiempo', position: 'insideBottomRight', offset: -10 }}
                                />
                                <YAxis
                                    domain={[0, 1]}
                                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                                    label={{ value: 'Peligrosidad', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                    formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                                    labelFormatter={(label) => `Tiempo: ${label}`}
                                />
                                <Legend />

                                {/* Líneas de referencia */}
                                <ReferenceLine y={0.1} stroke="#FFFF00" strokeDasharray="3 3" label="Moderado" />
                                <ReferenceLine y={0.3} stroke="#FFA500" strokeDasharray="3 3" label="Peligroso" />
                                <ReferenceLine y={0.5} stroke="#FF0000" strokeDasharray="3 3" label="Crítico" />

                                {/* Líneas de datos */}
                                <Line
                                    type="monotone"
                                    dataKey="dangerLevel"
                                    name="Peligrosidad"
                                    stroke="#8884d8"
                                    activeDot={{ r: 8 }}
                                    strokeWidth={2}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="ltr"
                                    name="LTR"
                                    stroke="#FF0000"
                                    dot={false}
                                    strokeWidth={1}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>
            )}
        </Box>
    );
};

export default DangerBar; 