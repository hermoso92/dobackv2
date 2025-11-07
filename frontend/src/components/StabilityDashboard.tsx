import { logger } from '../utils/logger';
import {
    DeleteSweep as ClearIcon,
    Pause as PauseIcon,
    PlayArrow as PlayIcon
} from '@mui/icons-material';
import {
    Box,
    Button,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    SelectChangeEvent,
    Stack,
    Typography,
    useTheme
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { ALARM_THRESHOLDS, SAMPLING_RATES, TIME_WINDOWS } from '../config/stabilityConfig';
import { useTelemetryData } from '../hooks/useTelemetryData';
import AdvancedSensorChart from './AdvancedSensorChart';
import DangerBar from './DangerBar';
import { t } from "../i18n";

/**
 * Dashboard principal que integra todos los componentes de visualización
 * de estabilidad del vehículo en una interfaz unificada y moderna.
 */
const StabilityDashboard: React.FC = () => {
    const theme = useTheme();

    // Estado para opciones de visualización
    const [timeWindow, setTimeWindow] = useState<number>(60);
    const [samplingRate, setSamplingRate] = useState<number>(100);
    const [decimationFactor, setDecimationFactor] = useState<number>(1);
    const [showDetailedGraphs, setShowDetailedGraphs] = useState<boolean>(true);
    // Forzar simulationMode a false para usar datos reales
    const [dataSimulationEnabled, setDataSimulationEnabled] = useState<boolean>(false);

    // Usar hook para obtener datos de telemetría en tiempo real
    const {
        telemetryData,
        vehicleConfig,
        isRunning,
        toggleRunning,
        setTimeWindow: setDataTimeWindow,
        setDecimationFactor: setDataDecimationFactor,
        clearData,
        lastError
    } = useTelemetryData({
        simulationMode: false, // Forzar modo de simulación a false
        samplingRate,
        timeWindow,
        decimationFactor
    });

    // Cargar vehículo y sesión desde location
    useEffect(() => {
        // Intentar obtener los parámetros de la URL
        const params = new URLSearchParams(window.location.search);
        const vehicleId = params.get('vehicle');
        const sessionId = params.get('session');

        // Si tenemos parámetros, cargar datos reales automáticamente
        if (vehicleId && sessionId) {
            logger.info(`Cargando datos reales para vehículo ${vehicleId} y sesión ${sessionId}`);
            setDataSimulationEnabled(false);
        }
    }, []);

    // Log para depuración
    useEffect(() => {
        logger.info(`StabilityDashboard: Datos de telemetría actualizados, ${telemetryData.length} puntos`);
    }, [telemetryData]);

    // Manejar cambio de ventana de tiempo
    const handleTimeWindowChange = (event: SelectChangeEvent<number>) => {
        const newTimeWindow = Number(event.target.value);
        setTimeWindow(newTimeWindow);
        setDataTimeWindow(newTimeWindow);
    };

    // Manejar cambio de frecuencia de muestreo
    const handleSamplingRateChange = (event: SelectChangeEvent<number>) => {
        setSamplingRate(Number(event.target.value));
    };

    // Manejar cambio de factor de decimación
    const handleDecimationChange = (event: SelectChangeEvent<number>) => {
        const newFactor = Number(event.target.value);
        setDecimationFactor(newFactor);
        setDataDecimationFactor(newFactor);
    };

    // Toggle para mostrar/ocultar gráficos detallados
    const toggleDetailedGraphs = () => {
        setShowDetailedGraphs(prev => !prev);
    };

    // Mostrar mensaje cuando no hay datos
    if (telemetryData.length === 0) {
        return (
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        borderRadius: 2,
                        maxWidth: 600,
                        textAlign: 'center',
                        mb: 3
                    }}
                >
                    <Typography variant="h5" gutterBottom color="primary">
                        {t('bienvenido_al_monitor_de_estabilidad')}</Typography>

                    <Typography variant="body1" paragraph>
                        {t('este_modulo_permite_analizar_en_tiempo_real_la_estabilidad_y_riesgo_de_vuelco_de_los_vehiculos')}</Typography>

                    <Typography variant="body2" color="text.secondary" paragraph>
                        {t('conectando_con_el_sistema_de_monitoreo_en_tiempo_real')}</Typography>

                    <Box sx={{ mt: 3 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<PlayIcon />}
                            onClick={toggleRunning}
                            size="large"
                        >
                            {t('iniciar_monitoreo')}</Button>
                    </Box>
                </Paper>

                <Typography variant="caption" color="text.secondary">
                    {t('la_aplicacion_esta_configurada_para_recibir_datos_reales_de_los_sensores_del_vehiculo')}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            <Paper
                elevation={3}
                sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: 2,
                    backgroundColor: theme.palette.background.paper
                }}
            >
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                    mb: 2
                }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                        {t('sistema_avanzado_de_monitoreo_de_estabilidad')}</Typography>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                            label={isRunning ? 'Monitoreo activo' : 'Monitoreo en pausa'}
                            color={isRunning ? 'success' : 'default'}
                            size="small"
                            sx={{ px: 1 }}
                        />
                        <Chip
                            label={`Datos: ${telemetryData.length}`}
                            color="primary"
                            variant="outlined"
                            size="small"
                        />
                    </Box>
                </Box>

                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems="center"
                    sx={{ mb: 3 }}
                >
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>{t('ventana_de_tiempo')}</InputLabel>
                        <Select
                            value={timeWindow}
                            onChange={handleTimeWindowChange}
                            label="Ventana de tiempo"
                        >
                            {TIME_WINDOWS.map(tw => (
                                <MenuItem key={tw} value={tw}>{tw}{t('s')}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>{t('frecuencia')}</InputLabel>
                        <Select
                            value={samplingRate}
                            onChange={handleSamplingRateChange}
                            label="Frecuencia"
                        >
                            {SAMPLING_RATES.map(sr => (
                                <MenuItem key={sr} value={sr}>{sr} {t('hz_1')}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>{t('decimacion_1')}</InputLabel>
                        <Select
                            value={decimationFactor}
                            onChange={handleDecimationChange}
                            label="Decimación"
                        >
                            <MenuItem value={1}>{t('ninguna')}</MenuItem>
                            <MenuItem value={2}>{t('2x')}</MenuItem>
                            <MenuItem value={5}>{t('5x')}</MenuItem>
                            <MenuItem value={10}>{t('10x')}</MenuItem>
                        </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                        <Button
                            variant="contained"
                            color={isRunning ? 'warning' : 'success'}
                            startIcon={isRunning ? <PauseIcon /> : <PlayIcon />}
                            onClick={toggleRunning}
                        >
                            {isRunning ? 'Pausar' : 'Reanudar'}
                        </Button>

                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<ClearIcon />}
                            onClick={clearData}
                        >
                            {t('limpiar')}</Button>

                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={toggleDetailedGraphs}
                        >
                            {showDetailedGraphs ? 'Ocultar detalles' : 'Mostrar detalles'}
                        </Button>
                    </Box>
                </Stack>

                {lastError && (
                    <Paper
                        elevation={0}
                        sx={{
                            mb: 3,
                            p: 2,
                            backgroundColor: theme.palette.error.light,
                            color: theme.palette.error.contrastText,
                            borderRadius: 1
                        }}
                    >
                        <Typography variant="body2">
                            {t('error')}{lastError}
                        </Typography>
                    </Paper>
                )}

                {/* Mensaje de modo simulación */}
                {telemetryData.length > 0 && window.location.search.indexOf('vehicle=') === -1 && (
                    <Paper
                        elevation={0}
                        sx={{
                            mb: 3,
                            p: 2,
                            backgroundColor: theme.palette.warning.light,
                            color: theme.palette.warning.contrastText,
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Typography variant="body2" align="center">
                            {t('no_se_ha_podido_conectar_con_el_servidor_de_datos_en_tiempo_real')}<br />
                            <span style={{ fontSize: '0.9rem' }}>
                                {t('se_estan_mostrando_datos_simulados_para_datos_reales_asegurese_de_que_el_servidor_esta_en_funcionamiento')}</span>
                        </Typography>
                    </Paper>
                )}

                <Box sx={{ mb: 3 }}>
                    <DangerBar
                        telemetryData={telemetryData}
                        vehicleConfig={vehicleConfig}
                        showDetails={showDetailedGraphs}
                        timeWindow={timeWindow}
                    />
                </Box>

                {showDetailedGraphs && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            {t('analisis_de_sensores')}</Typography>

                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                            gap: 3
                        }}>
                            {/* Gráfica avanzada para aceleración */}
                            <AdvancedSensorChart
                                telemetryData={telemetryData}
                                options={{
                                    timeWindow,
                                    samplingRate,
                                    decimationFactor
                                }}
                                initialSensor="acceleration"
                                initialAxis="all"
                                alarmThresholds={ALARM_THRESHOLDS}
                            />

                            {/* Gráfica avanzada para giroscopio */}
                            <AdvancedSensorChart
                                telemetryData={telemetryData}
                                options={{
                                    timeWindow,
                                    samplingRate,
                                    decimationFactor
                                }}
                                initialSensor="gyro"
                                initialAxis="all"
                                alarmThresholds={ALARM_THRESHOLDS}
                            />

                            {/* Gráfica avanzada para ángulos */}
                            <AdvancedSensorChart
                                telemetryData={telemetryData}
                                options={{
                                    timeWindow,
                                    samplingRate,
                                    decimationFactor
                                }}
                                initialSensor="angular"
                                initialAxis="all"
                                alarmThresholds={ALARM_THRESHOLDS}
                            />
                        </Box>
                    </Box>
                )}

                <Paper
                    elevation={1}
                    sx={{
                        mt: 3,
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.default
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                {t('vehiculo_1')}</Typography>
                            <Typography variant="body2">
                                {vehicleConfig.name || 'Vehículo de prueba'}
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                {t('ancho_de_via')}</Typography>
                            <Typography variant="body2">
                                {vehicleConfig.track_width.toFixed(2)} {t('m')}</Typography>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                {t('altura_cg')}</Typography>
                            <Typography variant="body2">
                                {vehicleConfig.cg_height.toFixed(2)} {t('m_1')}</Typography>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                {t('distancia_entre_ejes')}</Typography>
                            <Typography variant="body2">
                                {vehicleConfig.wheelbase.toFixed(2)} {t('m_2')}</Typography>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                {t('masa')}</Typography>
                            <Typography variant="body2">
                                {vehicleConfig.mass.toFixed(0)} {t('kg')}</Typography>
                        </Box>
                    </Box>
                </Paper>
            </Paper>
        </Box>
    );
};

export default StabilityDashboard; 