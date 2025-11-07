import {
    Box,
    Card,
    CardContent,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    SelectChangeEvent,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    useTheme
} from '@mui/material';
import { format } from 'date-fns';
import React, { useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Brush,
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
import { VisualizationOptions } from '../types/stability';

type StatisticsInfo = any;
type TelemetryData = any;

// Tipo de sensores disponibles
type SensorType = 'acceleration' | 'gyro' | 'angular';
// Ejes disponibles
type AxisType = 'x' | 'y' | 'z' | 'all';
// Modos de visualización
type ChartMode = 'normal' | 'derivative' | 'fft';

// Interfaz para los datos procesados
interface ProcessedSensorData {
    timestamp: number;
    timeFormatted: string;
    [key: string]: number | string; // Para campos dinámicos como acceleration_x, gyro_y, etc.
}

// Utilidad para calcular desviación estándar (fuera del componente para evitar problemas con hooks)
const calculateStdDev = (values: number[]): number => {
    if (!values.length) return 0;
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(val => Math.pow(val - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, sqDiff) => sum + sqDiff, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
};

// Utilidad para obtener valores seguros de los datos simulados
const getSensorValue = (data: TelemetryData, sensorType: SensorType, axis: string): number => {
    if (sensorType === 'acceleration') {
        if (axis === 'x') return data.acceleration_x;
        if (axis === 'y') return data.acceleration_y;
        if (axis === 'z') return data.acceleration_z;
    } else if (sensorType === 'gyro') {
        if (axis === 'x') return data.gyro_x;
        if (axis === 'y') return data.gyro_y;
        if (axis === 'z') return data.gyro_z;
    } else if (sensorType === 'angular') {
        if (axis === 'x') return data.angular_x;
        if (axis === 'y') return data.angular_y;
        if (axis === 'z') return data.angular_z;
    }
    return 0;
};

interface AdvancedSensorChartProps {
    telemetryData: TelemetryData[];
    options?: VisualizationOptions;
    initialSensor?: SensorType;
    initialAxis?: AxisType;
    alarmThresholds?: {
        [key: string]: {
            warning: number;
            danger: number;
            critical: number;
        };
    };
}

/**
 * Componente para visualización avanzada de datos de sensores
 */
const AdvancedSensorChart: React.FC<AdvancedSensorChartProps> = ({
    telemetryData,
    options = { timeWindow: 60, samplingRate: 100, decimationFactor: 1 },
    initialSensor = 'acceleration',
    initialAxis = 'all',
    alarmThresholds
}) => {
    const theme = useTheme();

    // Estados para controles de usuario
    const [selectedSensor, setSelectedSensor] = useState<SensorType>(initialSensor);
    const [selectedAxis, setSelectedAxis] = useState<AxisType>(initialAxis);
    const [chartMode, setChartMode] = useState<ChartMode>('normal');
    const [showThresholds, setShowThresholds] = useState<boolean>(true);

    // Si no hay datos, mostrar un mensaje indicativo
    if (!telemetryData || telemetryData.length === 0) {
        return (
            <Paper
                elevation={3}
                sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 3
                }}
            >
                <Typography variant="body1" color="text.secondary" align="center" gutterBottom>
                    {t('no_hay_datos_de_telemetria_disponibles_para_mostrar_graficas')}</Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                    {t('los_datos_de_sensores_apareceran_aqui_cuando_esten_disponibles')}</Typography>
            </Paper>
        );
    }

    // Mapeo de nombres de sensores
    const sensorNames = {
        acceleration: 'Aceleración',
        gyro: 'Giroscopio',
        angular: 'Ángulos'
    };

    // Unidades de medida para cada sensor
    const sensorUnits = {
        acceleration: 'g',
        gyro: '°/s',
        angular: '°'
    };

    // Colores para cada eje
    const axisColors = {
        x: theme.palette.primary.main,
        y: theme.palette.success.main,
        z: theme.palette.warning.main,
        all: theme.palette.primary.main
    };

    // Función para convertir datos crudos a datos procesados
    const convertToProcessedData = (data: TelemetryData, sensorType: SensorType): ProcessedSensorData => {
        const result: ProcessedSensorData = {
            timestamp: data.timestamp,
            timeFormatted: format(data.timestamp, 'HH:mm:ss.SSS')
        };

        // Añadir los datos según el sensor seleccionado
        if (sensorType === 'acceleration') {
            result['acceleration_x'] = data.acceleration_x;
            result['acceleration_y'] = data.acceleration_y;
            result['acceleration_z'] = data.acceleration_z;
        } else if (sensorType === 'gyro') {
            result['gyro_x'] = data.gyro_x;
            result['gyro_y'] = data.gyro_y;
            result['gyro_z'] = data.gyro_z;
        } else if (sensorType === 'angular') {
            result['angular_x'] = data.angular_x;
            result['angular_y'] = data.angular_y;
            result['angular_z'] = data.angular_z;
        }

        return result;
    };

    // Decimación inteligente de datos para mejorar rendimiento
    const processedData = useMemo(() => {
        if (!telemetryData.length) return [];

        // Filtrar por ventana de tiempo
        const now = Date.now();
        const cutoffTime = now - options.timeWindow * 1000;
        const filteredData = telemetryData.filter(data => data.timestamp > cutoffTime);

        // Aplicar decimación si es necesario
        const { decimationFactor = 1 } = options;

        if (decimationFactor <= 1 || filteredData.length < 100) {
            // Sin decimación, procesar todos los puntos
            return filteredData.map(data => convertToProcessedData(data, selectedSensor));
        }

        // Decimación inteligente
        const result: ProcessedSensorData[] = [];
        for (let i = 0; i < filteredData.length; i += decimationFactor) {
            const chunk = filteredData.slice(i, Math.min(i + decimationFactor, filteredData.length));

            // Siempre incluir el primer punto
            const basePoint = chunk[0];
            const processedPoint = convertToProcessedData(basePoint, selectedSensor);

            result.push(processedPoint);

            // Buscar valores extremos (mínimo y máximo) en el chunk para preservar picos
            if (chunk.length > 1) {
                // Para cada eje, encontrar min/max
                ['x', 'y', 'z'].forEach(axis => {
                    const values = chunk.map(d => getSensorValue(d, selectedSensor, axis));
                    const minValue = Math.min(...values);
                    const maxValue = Math.max(...values);
                    const baseValue = getSensorValue(basePoint, selectedSensor, axis);

                    // Si min/max son diferentes al primer punto, añadirlos
                    if (minValue < baseValue) {
                        const minPoint = chunk.find(d => getSensorValue(d, selectedSensor, axis) === minValue)!;
                        result.push(convertToProcessedData(minPoint, selectedSensor));
                    }

                    if (maxValue > baseValue) {
                        const maxPoint = chunk.find(d => getSensorValue(d, selectedSensor, axis) === maxValue)!;
                        result.push(convertToProcessedData(maxPoint, selectedSensor));
                    }
                });
            }
        }

        // Ordenar por timestamp (ya que al añadir min/max pueden desordenarse)
        return result.sort((a, b) => a.timestamp - b.timestamp);
    }, [telemetryData, selectedSensor, options.timeWindow, options.decimationFactor]);

    // Calcular derivadas (tasas de cambio)
    const derivativeData = useMemo(() => {
        if (chartMode !== 'derivative' || processedData.length < 2) return [];

        const result = [];
        for (let i = 1; i < processedData.length; i++) {
            const current = processedData[i];
            const previous = processedData[i - 1];
            const timeDiff = (current.timestamp - previous.timestamp) / 1000; // en segundos

            if (timeDiff === 0) continue;

            const dataPoint: any = {
                timestamp: current.timestamp,
                timeFormatted: current.timeFormatted
            };

            // Calcular derivadas para cada eje
            ['x', 'y', 'z'].forEach(axis => {
                const currentKey = `${selectedSensor}_${axis}`;
                const previousKey = `${selectedSensor}_${axis}`;

                const currentValue = typeof current[currentKey] === 'number' ? Number(current[currentKey]) : 0;
                const previousValue = typeof previous[previousKey] === 'number' ? Number(previous[previousKey]) : 0;

                dataPoint[`d${selectedSensor}_${axis}`] = (currentValue - previousValue) / timeDiff;
            });

            result.push(dataPoint);
        }

        return result;
    }, [chartMode, processedData, selectedSensor]);

    // Calcular FFT (simulado)
    const fftData = useMemo(() => {
        if (chartMode !== 'fft' || processedData.length < 32) return [];

        // Simulación simplificada de FFT
        const result = [];
        const fftSize = Math.min(32, processedData.length);
        const sampleRate = options.samplingRate || 100;
        const nyquist = sampleRate / 2;

        // Usar los últimos datos para el análisis de frecuencia
        const samples = processedData.slice(-fftSize);

        // Generar frecuencias discretas
        for (let i = 0; i < fftSize / 2; i++) {
            const frequency = (i * nyquist) / (fftSize / 2);

            // Simulación de amplitudes
            const dataPoint = {
                frequency,
                [`fft_${selectedSensor}_x`]: 0,
                [`fft_${selectedSensor}_y`]: 0,
                [`fft_${selectedSensor}_z`]: 0
            };

            // Calcular amplitudes (simuladas)
            ['x', 'y', 'z'].forEach(axis => {
                // Simulamos una respuesta en frecuencia realista
                const key = `${selectedSensor}_${axis}`;
                const values: number[] = samples.map(s => {
                    const val = s[key];
                    return typeof val === 'number' ? val : 0;
                });

                // Simular picos en frecuencias específicas (depende del sensor)
                let amplitude = 0;
                if (selectedSensor === 'acceleration') {
                    // Aceleración suele tener componentes de baja frecuencia
                    amplitude = Math.exp(-frequency / 5) * Math.random() * 2;
                    // Simular resonancias
                    if (Math.abs(frequency - 2) < 0.5) amplitude *= 3;
                    if (Math.abs(frequency - 10) < 1) amplitude *= 2;
                } else if (selectedSensor === 'gyro') {
                    // Giroscopio suele tener componentes de media frecuencia
                    amplitude = Math.exp(-Math.abs(frequency - 8) / 5) * Math.random() * 2;
                } else {
                    // Ángulos son principalmente de baja frecuencia
                    amplitude = Math.exp(-frequency / 2) * Math.random() * 2;
                }

                // Añadir variación basada en los datos reales
                const stdDev = calculateStdDev(values);
                amplitude *= stdDev * 5;

                dataPoint[`fft_${selectedSensor}_${axis}`] = amplitude;
            });

            result.push(dataPoint);
        }

        return result;
    }, [chartMode, processedData, selectedSensor, options.samplingRate]);

    // Calcular estadísticas para los datos mostrados
    const statistics = useMemo(() => {
        if (!processedData.length) {
            return {
                x: { min: 0, max: 0, avg: 0, median: 0, stdDev: 0 },
                y: { min: 0, max: 0, avg: 0, median: 0, stdDev: 0 },
                z: { min: 0, max: 0, avg: 0, median: 0, stdDev: 0 }
            };
        }

        const stats: { [key: string]: StatisticsInfo } = {};

        ['x', 'y', 'z'].forEach(axis => {
            // Obtener los valores para cada eje usando la clave correcta
            const key = `${selectedSensor}_${axis}`;
            const values: number[] = processedData.map(d => {
                const val = d[key];
                return typeof val === 'number' ? val : 0;
            });

            // Ordenar valores para cálculos
            const sorted = [...values].sort((a, b) => a - b);

            const min = sorted[0];
            const max = sorted[sorted.length - 1];
            const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

            const midIndex = Math.floor(sorted.length / 2);
            const median = sorted.length % 2 === 0
                ? (sorted[midIndex - 1] + sorted[midIndex]) / 2
                : sorted[midIndex];

            const stdDev = calculateStdDev(values);

            stats[axis] = { min, max, avg, median, stdDev };
        });

        return stats;
    }, [processedData, selectedSensor]);

    // Manejadores de eventos
    const handleSensorChange = (event: SelectChangeEvent) => {
        setSelectedSensor(event.target.value as SensorType);
    };

    const handleAxisChange = (event: React.MouseEvent<HTMLElement>, newAxis: AxisType | null) => {
        if (newAxis !== null) {
            setSelectedAxis(newAxis);
        }
    };

    const handleModeChange = (event: React.MouseEvent<HTMLElement>, newMode: ChartMode | null) => {
        if (newMode !== null) {
            setChartMode(newMode);
        }
    };

    // Determinar si hay umbrales de alarma disponibles
    const hasThresholds = alarmThresholds &&
        (selectedSensor === 'acceleration' ||
            selectedSensor === 'angular' ||
            selectedAxis === 'x' ||
            selectedAxis === 'y');

    // Renderizar la gráfica según el modo
    const renderChart = () => {
        // Si no hay datos, mostrar mensaje
        if (!processedData.length) {
            return (
                <Box sx={{
                    height: 300,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                    borderRadius: 1
                }}>
                    <Typography variant="body2" color="text.secondary">
                        {t('no_hay_datos_de_telemetria_disponibles')}</Typography>
                </Box>
            );
        }

        // Variables para determinar qué datos mostrar
        const chartData = chartMode === 'derivative' ? derivativeData
            : chartMode === 'fft' ? fftData
                : processedData;

        const xAxisKey = chartMode === 'fft' ? 'frequency' : 'timeFormatted';
        const xAxisLabel = chartMode === 'fft' ? 'Frecuencia (Hz)' : 'Tiempo';

        // Prefijos para acceder a los datos correctos
        const dataPrefix = chartMode === 'derivative' ? `d${selectedSensor}_`
            : chartMode === 'fft' ? `fft_${selectedSensor}_`
                : `${selectedSensor}_`;

        // Determinar qué ejes mostrar
        const axesToShow = selectedAxis === 'all'
            ? ['x', 'y', 'z']
            : [selectedAxis];

        // Obtener las líneas de alarma si hay umbrales y estamos en modo normal
        let alarmLines = [];
        if (showThresholds && hasThresholds && chartMode === 'normal') {
            // Para aceleración lateral (eje Y)
            if (selectedSensor === 'acceleration' && (selectedAxis === 'y' || selectedAxis === 'all')) {
                if (alarmThresholds?.lateral_acc) {
                    const { warning, danger, critical } = alarmThresholds.lateral_acc;
                    alarmLines.push(
                        <ReferenceLine key="warning-y" y={warning} stroke="#FFFF00" strokeDasharray="3 3" label="Advertencia" />,
                        <ReferenceLine key="danger-y" y={danger} stroke="#FFA500" strokeDasharray="3 3" label="Peligro" />,
                        <ReferenceLine key="critical-y" y={critical} stroke="#FF0000" strokeDasharray="3 3" label="Crítico" />
                    );
                }
            }

            // Para ángulo de roll (eje X de angular)
            if (selectedSensor === 'angular' && (selectedAxis === 'x' || selectedAxis === 'all')) {
                if (alarmThresholds?.roll_angle) {
                    const { warning, danger, critical } = alarmThresholds.roll_angle;
                    alarmLines.push(
                        <ReferenceLine key="warning-x" y={warning} stroke="#FFFF00" strokeDasharray="3 3" label="Advertencia" />,
                        <ReferenceLine key="danger-x" y={danger} stroke="#FFA500" strokeDasharray="3 3" label="Peligro" />,
                        <ReferenceLine key="critical-x" y={critical} stroke="#FF0000" strokeDasharray="3 3" label="Crítico" />
                    );
                    // Añadir también líneas negativas
                    alarmLines.push(
                        <ReferenceLine key="warning-x-neg" y={-warning} stroke="#FFFF00" strokeDasharray="3 3" />,
                        <ReferenceLine key="danger-x-neg" y={-danger} stroke="#FFA500" strokeDasharray="3 3" />,
                        <ReferenceLine key="critical-x-neg" y={-critical} stroke="#FF0000" strokeDasharray="3 3" />
                    );
                }
            }
        }

        if (chartMode === 'fft') {
            // Gráfica de FFT (análisis de frecuencia)
            return (
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey={xAxisKey}
                            label={{ value: xAxisLabel, position: 'insideBottomRight', offset: -10 }}
                        />
                        <YAxis
                            label={{
                                value: `Amplitud (${sensorUnits[selectedSensor]})`,
                                angle: -90,
                                position: 'insideLeft'
                            }}
                        />
                        <Tooltip
                            formatter={(value: number) => `${value.toFixed(4)}`}
                            labelFormatter={(label) => `Frecuencia: ${label} Hz`}
                        />
                        <Legend />

                        {axesToShow.map(axis => (
                            <Area
                                key={axis}
                                type="monotone"
                                dataKey={`${dataPrefix}${axis}`}
                                name={`${axis.toUpperCase()} - ${sensorNames[selectedSensor]}`}
                                stroke={axisColors[axis as AxisType]}
                                fillOpacity={0.3}
                                fill={axisColors[axis as AxisType]}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            );
        } else {
            // Gráfica normal o de derivadas
            return (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey={xAxisKey}
                            label={{ value: xAxisLabel, position: 'insideBottomRight', offset: -10 }}
                        />
                        <YAxis
                            label={{
                                value: chartMode === 'derivative'
                                    ? `Tasa de cambio (${sensorUnits[selectedSensor]}/s)`
                                    : `${sensorNames[selectedSensor]} (${sensorUnits[selectedSensor]})`,
                                angle: -90,
                                position: 'insideLeft'
                            }}
                        />
                        <Tooltip
                            formatter={(value: number) => `${value.toFixed(4)} ${sensorUnits[selectedSensor]}`}
                            labelFormatter={(label) => `Tiempo: ${label}`}
                        />
                        <Legend />

                        {/* Añadir líneas de referencia de alarmas */}
                        {alarmLines}

                        {/* Gráfica 0 */}
                        <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />

                        {/* Líneas de datos */}
                        {axesToShow.map(axis => (
                            <Line
                                key={axis}
                                type="monotone"
                                dataKey={`${dataPrefix}${axis}`}
                                name={`${axis.toUpperCase()} - ${sensorNames[selectedSensor]}`}
                                stroke={axisColors[axis as AxisType]}
                                dot={false}
                                activeDot={{ r: 8 }}
                            />
                        ))}

                        {/* Añadir brush para zoom */}
                        <Brush
                            dataKey={xAxisKey}
                            height={30}
                            stroke={theme.palette.primary.main}
                            fill={theme.palette.background.paper}
                        />
                    </LineChart>
                </ResponsiveContainer>
            );
        }
    };

    return (
        <Paper
            elevation={3}
            sx={{
                borderRadius: 2,
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Encabezado y controles */}
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 2,
                    borderBottom: 1,
                    borderColor: 'divider'
                }}
            >
                <Typography variant="h6">
                    {sensorNames[selectedSensor]}
                    {selectedAxis !== 'all' && ` - Eje ${selectedAxis.toUpperCase()}`}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {/* Selector de sensor */}
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>{t('sensor')}</InputLabel>
                        <Select
                            value={selectedSensor}
                            onChange={handleSensorChange}
                            label="Sensor"
                        >
                            <MenuItem value="acceleration">{t('aceleracion')}</MenuItem>
                            <MenuItem value="gyro">{t('giroscopio')}</MenuItem>
                            <MenuItem value="angular">{t('angulos')}</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Selector de eje */}
                    <ToggleButtonGroup
                        value={selectedAxis}
                        exclusive
                        onChange={handleAxisChange}
                        size="small"
                    >
                        <ToggleButton value="all">{t('todos')}</ToggleButton>
                        <ToggleButton value="x">{t('x')}</ToggleButton>
                        <ToggleButton value="y">{t('y')}</ToggleButton>
                        <ToggleButton value="z">{t('z')}</ToggleButton>
                    </ToggleButtonGroup>

                    {/* Selector de modo */}
                    <ToggleButtonGroup
                        value={chartMode}
                        exclusive
                        onChange={handleModeChange}
                        size="small"
                    >
                        <ToggleButton value="normal">{t('normal')}</ToggleButton>
                        <ToggleButton value="derivative">{t('derivada')}</ToggleButton>
                        <ToggleButton value="fft">{t('fft')}</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Box>

            {/* Contenido principal */}
            <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Gráfico */}
                <Box sx={{ mb: 2, flex: 1 }}>
                    {renderChart()}
                </Box>

                {/* Estadísticas */}
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        flexWrap: 'wrap',
                        justifyContent: 'space-between'
                    }}
                >
                    {selectedAxis === 'all' ? (
                        // Mostrar estadísticas para todos los ejes
                        ['x', 'y', 'z'].map(axis => (
                            <Card key={axis} sx={{ flex: '1 1 30%', minWidth: 200 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="subtitle2">
                                            {t('eje')}{axis.toUpperCase()}
                                        </Typography>
                                        <Chip
                                            label={sensorUnits[selectedSensor]}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        <Typography variant="caption" sx={{ flex: '1 1 50%' }}>
                                            {t('min')}{statistics[axis].min.toFixed(4)}
                                        </Typography>
                                        <Typography variant="caption" sx={{ flex: '1 1 50%' }}>
                                            {t('max')}{statistics[axis].max.toFixed(4)}
                                        </Typography>
                                        <Typography variant="caption" sx={{ flex: '1 1 50%' }}>
                                            {t('prom')}{statistics[axis].avg.toFixed(4)}
                                        </Typography>
                                        <Typography variant="caption" sx={{ flex: '1 1 50%' }}>
                                            {t('med')}{statistics[axis].median.toFixed(4)}
                                        </Typography>
                                        <Typography variant="caption" sx={{ flex: '1 1 100%' }}>
                                            σ: {statistics[axis].stdDev.toFixed(4)}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        // Mostrar estadísticas detalladas para un eje
                        <Card sx={{ width: '100%' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="subtitle2">
                                        {t('eje_1')}{selectedAxis.toUpperCase()} {t('estadisticas')}</Typography>
                                    <Chip
                                        label={sensorUnits[selectedSensor]}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">
                                        {t('minimo')}{statistics[selectedAxis].min.toFixed(4)} {sensorUnits[selectedSensor]}
                                    </Typography>
                                    <Typography variant="body2">
                                        {t('maximo')}{statistics[selectedAxis].max.toFixed(4)} {sensorUnits[selectedSensor]}
                                    </Typography>
                                    <Typography variant="body2">
                                        {t('promedio')}{statistics[selectedAxis].avg.toFixed(4)} {sensorUnits[selectedSensor]}
                                    </Typography>
                                    <Typography variant="body2">
                                        {t('mediana')}{statistics[selectedAxis].median.toFixed(4)} {sensorUnits[selectedSensor]}
                                    </Typography>
                                    <Typography variant="body2">
                                        {t('desv_estandar')}{statistics[selectedAxis].stdDev.toFixed(4)} {sensorUnits[selectedSensor]}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    )}
                </Box>
            </Box>
        </Paper>
    );
};

export default AdvancedSensorChart; 