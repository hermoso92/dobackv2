import InfoIcon from '@mui/icons-material/Info';
import {
import { logger } from '../utils/logger';
    Box,
    Checkbox,
    FormControlLabel,
    FormGroup,
    Grid,
    IconButton,
    Paper,
    Popover,
    Slider,
    Typography,
    useTheme
} from '@mui/material';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    CartesianGrid,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    TooltipProps,
    XAxis,
    YAxis
} from 'recharts';
import { t } from "../i18n";
import { logger } from '../utils/logger';

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

// Tipo para la configuración del gráfico
export interface ChartConfig {
    showLTR: boolean;
    showSSF: boolean;
    showDRS: boolean;
    showSSC: boolean;
    showRoll: boolean;
    showPitch: boolean;
    showLateralAcceleration: boolean;
    showSpeed: boolean;
    alertLTR: number;
    alertSSF: number;
    alertDRS: number;
    alertSSC: number;
    alertRoll: number;
    warningLTR: number;
    warningSSF: number;
    warningDRS: number;
    warningSSC: number;
    warningRoll: number;
    warningPitch: number;
    warningLateralAcceleration: number;
    warningSpeed: number;
    showGrid: boolean;
    showLegend: boolean;
    animationEnabled: boolean;
    dataPointSize: number;
    lineThickness: number;
}

interface SeriesInfo {
    id: string;
    name: string;
    description: string;
    color: string;
    unit: string;
    alertValue?: number;
    alertName?: string;
}

export interface ConfigurableStabilityChartProps {
    data: StabilityDataPoint[];
    height?: number;
    title?: string;
    defaultConfig?: ChartConfig;
    onConfigChange?: (config: ChartConfig) => void;
}

// Sistema de caché para los datos
const dataCache = new Map<string, {
    data: StabilityDataPoint[];
    timestamp: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Función para limpiar la caché
const cleanupCache = () => {
    const now = Date.now();
    for (const [key, value] of dataCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
            dataCache.delete(key);
        }
    }
};

// Limpiar la caché cada minuto
setInterval(cleanupCache, 60 * 1000);

// Definiciones de series con información mejorada
const SERIES_DEFINITIONS = [
    {
        id: 'ltr',
        name: 'LTR',
        description: 'Load Transfer Ratio - Indica la distribución de carga entre ruedas.',
        color: '#f44336',
        unit: '',
        domain: [0, 1]
    },
    {
        id: 'ssf',
        name: 'SSF',
        description: 'Static Stability Factor - Factor de estabilidad estática.',
        color: '#ff9800',
        unit: '',
        domain: [0, 2]
    },
    {
        id: 'drs',
        name: 'DRS',
        description: 'Dynamic Rollover Score - Puntuación dinámica de vuelco.',
        color: '#ffd700',
        unit: '',
        domain: [0, 10]
    },
    {
        id: 'ssc',
        name: 'SSC',
        description: 'Stability Score Combined - Puntuación combinada de estabilidad.',
        color: '#4caf50',
        unit: '%',
        domain: [0, 100]
    },
    {
        id: 'roll',
        name: 'Inclinación',
        description: 'Ángulo de inclinación lateral del vehículo.',
        color: '#2196f3',
        unit: '°',
        domain: [-45, 45]
    },
    {
        id: 'pitch',
        name: 'Cabeceo',
        description: 'Ángulo de cabeceo del vehículo (elevación frontal/trasera).',
        color: '#607d8b',
        unit: '°',
        domain: [-45, 45]
    },
    {
        id: 'lateralAcceleration',
        name: 'Aceleración Lateral',
        description: 'Fuerza lateral como proporción de la gravedad.',
        color: '#e91e63',
        unit: 'G',
        domain: [-2, 2]
    },
    {
        id: 'speed',
        name: 'Velocidad',
        description: 'Velocidad del vehículo.',
        color: '#795548',
        unit: 'km/h',
        domain: [0, 200]
    }
];

// Configuración por defecto del gráfico
const defaultChartConfig: ChartConfig = {
    showLTR: true,
    showSSF: true,
    showDRS: true,
    showSSC: true,
    showRoll: true,
    showPitch: true,
    showLateralAcceleration: false,
    showSpeed: true,
    alertLTR: 0.8,
    alertSSF: 1.2,
    alertDRS: 6.5,
    alertSSC: 75,
    alertRoll: 15,
    warningLTR: 0.65,
    warningSSF: 1.4,
    warningDRS: 7.5,
    warningSSC: 80,
    warningRoll: 10,
    warningPitch: 8,
    warningLateralAcceleration: 0.7,
    warningSpeed: 90,
    showGrid: true,
    showLegend: true,
    animationEnabled: false,
    dataPointSize: 0,
    lineThickness: 2
};

// Componente de tooltip personalizado y memoizado
const CustomTooltip = memo(({ active, payload, label }: TooltipProps<number, string>) => {
    const theme = useTheme();

    if (!active || !payload || !payload.length) {
        return null;
    }

    const currentPoint = payload[0].payload as StabilityDataPoint;
    const formattedTime = formatTime(currentPoint.time);

    const stabilityLevel =
        currentPoint.ltr > 0.8 ? "Estable" :
            currentPoint.ltr > 0.65 ? "Advertencia" : "Crítico";

    const stabilityColor =
        currentPoint.ltr > 0.8 ? theme.palette.success.main :
            currentPoint.ltr > 0.65 ? theme.palette.warning.main : theme.palette.error.main;

    const formatValue = (value: number, decimals: number = 2) => {
        if (value === null || value === undefined || isNaN(value)) return "N/A";
        return value.toFixed(decimals);
    };

    return (
        <Paper elevation={3} sx={{ p: 1.5, minWidth: 200 }}>
            <Typography variant="subtitle2" gutterBottom>
                {t('tiempo')}{formattedTime}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ mr: 1 }}>{t('estado')}</Typography>
                <Typography
                    variant="caption"
                    sx={{
                        color: stabilityColor,
                        bgcolor: `${stabilityColor}20`,
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        fontWeight: 'medium'
                    }}
                >
                    {stabilityLevel}
                </Typography>
            </Box>

            <Grid container spacing={1}>
                {payload.map((entry) => {
                    const series = SERIES_DEFINITIONS.find(s => s.id === entry.dataKey);
                    if (!series) return null;

                    return (
                        <Grid item xs={6} key={entry.dataKey}>
                            <Typography
                                variant="caption"
                                sx={{ color: series.color, display: 'block' }}
                            >
                                {series.name}:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {formatValue(entry.value as number)}{series.unit}
                            </Typography>
                        </Grid>
                    );
                })}
            </Grid>
        </Paper>
    );
});

CustomTooltip.displayName = 'CustomTooltip';

// Función auxiliar para formatear tiempo
const formatTime = (seconds: number): string => {
    try {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } catch (error) {
        logger.error('Error al formatear tiempo:', error);
        return '00:00:00';
    }
};

// Componente principal
const ConfigurableStabilityChart: React.FC<ConfigurableStabilityChartProps> = ({
    data,
    height = 400,
    title = "",
    defaultConfig,
    onConfigChange
}) => {
    const theme = useTheme();
    const [config, setConfig] = useState<ChartConfig>(() => ({
        ...defaultChartConfig,
        ...defaultConfig,
        animationEnabled: false,
        dataPointSize: 0,
        lineThickness: 2
    }));

    const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
    const [infoAnchorEl, setInfoAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedInfo, setSelectedInfo] = useState<typeof SERIES_DEFINITIONS[0] | null>(null);
    const [processedData, setProcessedData] = useState<StabilityDataPoint[]>([]);
    const dataKeyRef = useRef<string>('');
    const processingTimeoutRef = useRef<NodeJS.Timeout>();

    // Procesar y cachear los datos con debounce
    useEffect(() => {
        if (!data || data.length === 0) return;

        const dataKey = JSON.stringify(data);
        if (dataKey === dataKeyRef.current) return;

        // Limpiar timeout anterior si existe
        if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
        }

        // Verificar caché
        const cachedData = dataCache.get(dataKey);
        if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
            setProcessedData(cachedData.data);
            return;
        }

        // Procesar los datos con debounce
        processingTimeoutRef.current = setTimeout(() => {
            const processed = data.map(point => ({
                ...point,
                time: new Date(point.time).getTime()
            }));

            // Guardar en caché
            dataCache.set(dataKey, {
                data: processed,
                timestamp: Date.now()
            });

            setProcessedData(processed);
            dataKeyRef.current = dataKey;
        }, 150); // 150ms debounce

        return () => {
            if (processingTimeoutRef.current) {
                clearTimeout(processingTimeoutRef.current);
            }
        };
    }, [data]);

    // Efecto para sincronizar la configuración con los props
    useEffect(() => {
        if (defaultConfig) {
            setConfig(prev => ({
                ...prev,
                ...defaultConfig,
                animationEnabled: false,
                dataPointSize: 0,
                lineThickness: 2
            }));
        }
    }, [defaultConfig]);

    // Manejadores de eventos memoizados
    const handleSettingsClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
        setSettingsAnchorEl(event.currentTarget);
    }, []);

    const handleSettingsClose = useCallback(() => {
        setSettingsAnchorEl(null);
    }, []);

    const handleInfoClick = useCallback((series: typeof SERIES_DEFINITIONS[0]) => (event: React.MouseEvent<HTMLButtonElement>) => {
        setSelectedInfo(series);
        setInfoAnchorEl(event.currentTarget);
    }, []);

    const handleInfoClose = useCallback(() => {
        setInfoAnchorEl(null);
    }, []);

    const handleConfigChange = useCallback((newConfig: Partial<ChartConfig>) => {
        setConfig(prev => {
            const updated = { ...prev, ...newConfig };
            onConfigChange?.(updated);
            return updated;
        });
    }, [onConfigChange]);

    // Cálculo de líneas memoizado
    const chartLines = useMemo(() => {
        return SERIES_DEFINITIONS.map(series => {
            const showKey = `show${series.id.charAt(0).toUpperCase()}${series.id.slice(1)}` as keyof ChartConfig;
            if (!config[showKey]) return null;

            return (
                <Line
                    key={series.id}
                    type="monotone"
                    dataKey={series.id}
                    stroke={series.color}
                    dot={false}
                    strokeWidth={config.lineThickness}
                    yAxisId={series.id === 'speed' ? 'right' : 'left'}
                    name={series.name}
                    isAnimationActive={false}
                />
            );
        }).filter(Boolean);
    }, [config]);

    const referenceLines = useMemo(() => {
        const lines: JSX.Element[] = [];

        SERIES_DEFINITIONS.forEach(series => {
            const showKey = `show${series.id.charAt(0).toUpperCase()}${series.id.slice(1)}` as keyof ChartConfig;
            const warningKey = `warning${series.id.charAt(0).toUpperCase()}${series.id.slice(1)}` as keyof ChartConfig;
            const alertKey = `alert${series.id.charAt(0).toUpperCase()}${series.id.slice(1)}` as keyof ChartConfig;

            if (config[showKey]) {
                // Línea de advertencia
                if (warningKey in config) {
                    lines.push(
                        <ReferenceLine
                            key={`warning-${series.id}`}
                            y={config[warningKey] as number}
                            stroke={theme.palette.warning.main}
                            strokeDasharray="3 3"
                            yAxisId={series.id === 'speed' ? 'right' : 'left'}
                            label={{
                                value: 'Advertencia',
                                position: 'insideTopRight',
                                fill: theme.palette.warning.main,
                                fontSize: 10
                            }}
                        />
                    );
                }

                // Línea de alerta
                if (alertKey in config) {
                    lines.push(
                        <ReferenceLine
                            key={`alert-${series.id}`}
                            y={config[alertKey] as number}
                            stroke={theme.palette.error.main}
                            strokeDasharray="3 3"
                            yAxisId={series.id === 'speed' ? 'right' : 'left'}
                            label={{
                                value: 'Alerta',
                                position: 'insideTopRight',
                                fill: theme.palette.error.main,
                                fontSize: 10
                            }}
                        />
                    );
                }
            }
        });

        return lines;
    }, [config, theme]);

    // Renderizado del panel de configuración
    const renderConfigPanel = () => (
        <Box sx={{ p: 2, width: 800 }}>
            <Typography variant="h6" gutterBottom>
                {t('configuracion_de_visualizacion')}</Typography>

            <Box sx={{ display: 'flex', gap: 2 }}>
                {/* Primera columna: Series principales */}
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        {t('series_principales')}</Typography>
                    <FormGroup>
                        {SERIES_DEFINITIONS.slice(0, 3).map(series => {
                            const showKey = `show${series.id.charAt(0).toUpperCase()}${series.id.slice(1)}` as keyof ChartConfig;
                            const alertKey = `alert${series.id.charAt(0).toUpperCase()}${series.id.slice(1)}` as keyof ChartConfig;
                            const warningKey = `warning${series.id.charAt(0).toUpperCase()}${series.id.slice(1)}` as keyof ChartConfig;

                            return (
                                <Box key={series.id} sx={{ mb: 2 }}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={config[showKey] as boolean}
                                                onChange={(e) => handleConfigChange({ [showKey]: e.target.checked })}
                                                sx={{ color: series.color }}
                                            />
                                        }
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {series.name}
                                                <IconButton
                                                    size="small"
                                                    onClick={handleInfoClick(series)}
                                                    sx={{ ml: 0.5, opacity: 0.6 }}
                                                >
                                                    <InfoIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        }
                                    />
                                    {config[showKey] && (
                                        <Box sx={{ px: 2, mt: 1 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {t('umbral_de_advertencia')}</Typography>
                                            <Slider
                                                value={config[warningKey] as number}
                                                onChange={(_, value) => handleConfigChange({ [warningKey]: value })}
                                                min={series.domain[0]}
                                                max={series.domain[1]}
                                                step={(series.domain[1] - series.domain[0]) / 100}
                                                sx={{
                                                    color: theme.palette.warning.main,
                                                    '& .MuiSlider-thumb': {
                                                        width: 12,
                                                        height: 12
                                                    }
                                                }}
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                {t('umbral_de_alerta')}</Typography>
                                            <Slider
                                                value={config[alertKey] as number}
                                                onChange={(_, value) => handleConfigChange({ [alertKey]: value })}
                                                min={series.domain[0]}
                                                max={series.domain[1]}
                                                step={(series.domain[1] - series.domain[0]) / 100}
                                                sx={{
                                                    color: theme.palette.error.main,
                                                    '& .MuiSlider-thumb': {
                                                        width: 12,
                                                        height: 12
                                                    }
                                                }}
                                            />
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </FormGroup>
                </Box>

                {/* Segunda columna: Series secundarias */}
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        {t('series_secundarias')}</Typography>
                    <FormGroup>
                        {SERIES_DEFINITIONS.slice(3, 6).map(series => {
                            const showKey = `show${series.id.charAt(0).toUpperCase()}${series.id.slice(1)}` as keyof ChartConfig;
                            const alertKey = `alert${series.id.charAt(0).toUpperCase()}${series.id.slice(1)}` as keyof ChartConfig;
                            const warningKey = `warning${series.id.charAt(0).toUpperCase()}${series.id.slice(1)}` as keyof ChartConfig;

                            return (
                                <Box key={series.id} sx={{ mb: 2 }}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={config[showKey] as boolean}
                                                onChange={(e) => handleConfigChange({ [showKey]: e.target.checked })}
                                                sx={{ color: series.color }}
                                            />
                                        }
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {series.name}
                                                <IconButton
                                                    size="small"
                                                    onClick={handleInfoClick(series)}
                                                    sx={{ ml: 0.5, opacity: 0.6 }}
                                                >
                                                    <InfoIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        }
                                    />
                                    {config[showKey] && (
                                        <Box sx={{ px: 2, mt: 1 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {t('umbral_de_advertencia_1')}</Typography>
                                            <Slider
                                                value={config[warningKey] as number}
                                                onChange={(_, value) => handleConfigChange({ [warningKey]: value })}
                                                min={series.domain[0]}
                                                max={series.domain[1]}
                                                step={(series.domain[1] - series.domain[0]) / 100}
                                                sx={{
                                                    color: theme.palette.warning.main,
                                                    '& .MuiSlider-thumb': {
                                                        width: 12,
                                                        height: 12
                                                    }
                                                }}
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                {t('umbral_de_alerta_1')}</Typography>
                                            <Slider
                                                value={config[alertKey] as number}
                                                onChange={(_, value) => handleConfigChange({ [alertKey]: value })}
                                                min={series.domain[0]}
                                                max={series.domain[1]}
                                                step={(series.domain[1] - series.domain[0]) / 100}
                                                sx={{
                                                    color: theme.palette.error.main,
                                                    '& .MuiSlider-thumb': {
                                                        width: 12,
                                                        height: 12
                                                    }
                                                }}
                                            />
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </FormGroup>
                </Box>

                {/* Tercera columna: Configuraciones generales */}
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        {t('configuraciones_generales')}</Typography>
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={config.showGrid}
                                    onChange={(e) => handleConfigChange({ showGrid: e.target.checked })}
                                />
                            }
                            label="Mostrar cuadrícula"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={config.showLegend}
                                    onChange={(e) => handleConfigChange({ showLegend: e.target.checked })}
                                />
                            }
                            label="Mostrar leyenda"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={config.animationEnabled}
                                    onChange={(e) => handleConfigChange({ animationEnabled: e.target.checked })}
                                />
                            }
                            label="Habilitar animaciones"
                        />
                    </FormGroup>

                    <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>
                        {t('apariencia')}</Typography>
                    <Box sx={{ px: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                            {t('tamano_de_puntos')}</Typography>
                        <Slider
                            value={config.dataPointSize}
                            onChange={(_, value) => handleConfigChange({ dataPointSize: value as number })}
                            min={0}
                            max={10}
                            step={0.5}
                            sx={{ mb: 2 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {t('grosor_de_lineas')}</Typography>
                        <Slider
                            value={config.lineThickness}
                            onChange={(_, value) => handleConfigChange({ lineThickness: value as number })}
                            min={0.5}
                            max={3}
                            step={0.1}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <Box sx={{
                width: '100%',
                height: '100%',
                position: 'relative'
            }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={processedData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        {config.showGrid && (
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(0, 0, 0, 0.1)"
                            />
                        )}
                        <XAxis
                            dataKey="time"
                            tickFormatter={formatTime}
                            tick={{ fontSize: 10 }}
                            tickCount={10}
                        />
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            tick={{ fontSize: 10 }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 10 }}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ stroke: 'rgba(0, 0, 0, 0.1)', strokeWidth: 1 }}
                        />
                        {config.showLTR && (
                            <Line
                                type="monotone"
                                dataKey="ltr"
                                stroke={SERIES_DEFINITIONS[0].color}
                                name={SERIES_DEFINITIONS[0].name}
                                dot={false}
                                isAnimationActive={config.animationEnabled}
                                strokeWidth={config.lineThickness}
                            />
                        )}
                        {config.showSSF && (
                            <Line
                                type="monotone"
                                dataKey="ssf"
                                stroke={SERIES_DEFINITIONS[1].color}
                                name={SERIES_DEFINITIONS[1].name}
                                dot={false}
                                isAnimationActive={config.animationEnabled}
                                strokeWidth={config.lineThickness}
                            />
                        )}
                        {config.showDRS && (
                            <Line
                                type="monotone"
                                dataKey="drs"
                                stroke={SERIES_DEFINITIONS[2].color}
                                name={SERIES_DEFINITIONS[2].name}
                                dot={false}
                                isAnimationActive={config.animationEnabled}
                                strokeWidth={config.lineThickness}
                            />
                        )}
                        {config.showSSC && (
                            <Line
                                type="monotone"
                                dataKey="ssc"
                                stroke={SERIES_DEFINITIONS[3].color}
                                name={SERIES_DEFINITIONS[3].name}
                                dot={false}
                                isAnimationActive={config.animationEnabled}
                                strokeWidth={config.lineThickness}
                            />
                        )}
                        {config.showRoll && (
                            <Line
                                type="monotone"
                                dataKey="roll"
                                stroke={SERIES_DEFINITIONS[4].color}
                                name={SERIES_DEFINITIONS[4].name}
                                dot={false}
                                isAnimationActive={config.animationEnabled}
                                strokeWidth={config.lineThickness}
                            />
                        )}
                        {config.showPitch && (
                            <Line
                                type="monotone"
                                dataKey="pitch"
                                stroke={SERIES_DEFINITIONS[5].color}
                                name={SERIES_DEFINITIONS[5].name}
                                dot={false}
                                isAnimationActive={config.animationEnabled}
                                strokeWidth={config.lineThickness}
                            />
                        )}
                        {config.showLateralAcceleration && (
                            <Line
                                type="monotone"
                                dataKey="lateralAcceleration"
                                stroke={SERIES_DEFINITIONS[6].color}
                                name={SERIES_DEFINITIONS[6].name}
                                dot={false}
                                isAnimationActive={config.animationEnabled}
                                strokeWidth={config.lineThickness}
                            />
                        )}
                        {config.showSpeed && (
                            <Line
                                type="monotone"
                                dataKey="speed"
                                stroke={SERIES_DEFINITIONS[7].color}
                                name={SERIES_DEFINITIONS[7].name}
                                dot={false}
                                isAnimationActive={config.animationEnabled}
                                strokeWidth={config.lineThickness}
                            />
                        )}
                        {referenceLines}
                    </LineChart>
                </ResponsiveContainer>
            </Box>

            <Popover
                open={Boolean(settingsAnchorEl)}
                anchorEl={settingsAnchorEl}
                onClose={handleSettingsClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                {renderConfigPanel()}
            </Popover>

            <Popover
                open={Boolean(infoAnchorEl)}
                anchorEl={infoAnchorEl}
                onClose={handleInfoClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                {selectedInfo && (
                    <Box sx={{ p: 2, maxWidth: 300 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            {selectedInfo.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {selectedInfo.description}
                        </Typography>
                    </Box>
                )}
            </Popover>
        </Box>
    );
};

ConfigurableStabilityChart.displayName = 'ConfigurableStabilityChart';

export default memo(ConfigurableStabilityChart); 