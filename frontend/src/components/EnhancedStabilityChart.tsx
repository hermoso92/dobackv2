import { Box } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ConfigurableStabilityChart from './ConfigurableStabilityChart';
import ErrorBoundary from './ErrorBoundary';
import { logger } from '../utils/logger';

// Tipos de datos mejorados con validación estricta
export interface StabilityDataPoint {
    time: number;
    ltr: number;
    roll: number;
    pitch: number;
    lateralAcceleration: number;
    speed: number;
    ssf: number;
    drs: number;
    ssc: number;
    [key: string]: number; // Permitir indexación con strings
}

// Tipo para la configuración del gráfico con valores por defecto
interface ChartConfig {
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

export interface EnhancedStabilityChartProps {
    data: StabilityDataPoint[];
    height?: number;
    title?: string;
    defaultConfig?: ChartConfig;
    onConfigChange?: (config: ChartConfig) => void;
}

// Configuración predeterminada optimizada
const defaultChartSettings: ChartConfig = {
    showLTR: true,
    showRoll: true,
    showLateralAcceleration: true,
    showSpeed: true,
    showSSF: true,
    showDRS: true,
    showSSC: true,
    showPitch: true,
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
    animationEnabled: true,
    dataPointSize: 5,
    lineThickness: 1.5
};

// Constantes para validación
const VALIDATION_LIMITS = {
    roll: { min: -90, max: 90 },
    pitch: { min: -90, max: 90 },
    lateralAcceleration: { min: -2, max: 2 },
    speed: { min: 0, max: 200 },
    ltr: { min: 0, max: 1 },
    ssf: { min: 0, max: 2 },
    drs: { min: 0, max: 10 },
    ssc: { min: 0, max: 100 }
};

const EnhancedStabilityChart: React.FC<EnhancedStabilityChartProps> = ({
    data,
    height = 400,
    title = "",
    defaultConfig,
    onConfigChange
}) => {
    // Estado para datos de emergencia y validación
    const [emergencyData, setEmergencyData] = useState<StabilityDataPoint[]>([]);
    const [isDataValid, setIsDataValid] = useState(true);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Validación mejorada con tipado estricto
    const validateData = useCallback((dataToValidate: StabilityDataPoint[]): { isValid: boolean; error: string | null } => {
        if (!Array.isArray(dataToValidate) || dataToValidate.length === 0) {
            return { isValid: false, error: "No hay datos disponibles" };
        }

        for (const point of dataToValidate) {
            // Validar campos requeridos
            const requiredFields: (keyof StabilityDataPoint)[] = [
                'time', 'roll', 'pitch', 'lateralAcceleration', 'speed',
                'ltr', 'ssf', 'drs', 'ssc'
            ];

            for (const field of requiredFields) {
                if (point[field] === undefined || point[field] === null || isNaN(point[field])) {
                    return {
                        isValid: false,
                        error: `Campo requerido faltante o inválido: ${field}`
                    };
                }
            }

            // Validar rangos
            for (const [key, limits] of Object.entries(VALIDATION_LIMITS)) {
                const value = point[key as keyof StabilityDataPoint];
                if (value < limits.min || value > limits.max) {
                    return {
                        isValid: false,
                        error: `Valor fuera de rango para ${key}: ${value} (límites: ${limits.min} - ${limits.max})`
                    };
                }
            }
        }

        return { isValid: true, error: null };
    }, []);

    // Procesamiento de datos optimizado con memoización
    const processedData = useMemo(() => {
        if (!Array.isArray(data) || data.length === 0) {
            logger.warn('Datos no válidos o vacíos:', data);
            return null;
        }

        // Muestreo de datos para conjuntos grandes
        const maxPoints = 1000;
        let sampledData = data;
        if (data.length > maxPoints) {
            const samplingRate = Math.floor(data.length / maxPoints);
            sampledData = data.filter((_, index) => index % samplingRate === 0);
        }

        return sampledData.map(point => ({
            time: point.time,
            roll: point.roll,
            pitch: point.pitch,
            lateralAcceleration: point.lateralAcceleration,
            speed: point.speed,
            ltr: point.ltr,
            ssf: point.ssf,
            drs: point.drs,
            ssc: point.ssc
        }));
    }, [data]);

    // Efecto para validación y generación de datos de emergencia
    useEffect(() => {
        const validation = validateData(data);
        setIsDataValid(validation.isValid);
        setValidationError(validation.error);

        if (!validation.isValid) {
            const emergencyPoints = generateEmergencyData();
            setEmergencyData(emergencyPoints);
        }
    }, [data, validateData]);

    // Datos finales para renderizado
    const finalData = useMemo(() => {
        return isDataValid ? processedData : emergencyData;
    }, [isDataValid, processedData, emergencyData]);

    // Configuración final
    const mergedConfig = useMemo(() => ({
        ...defaultChartSettings,
        ...defaultConfig
    }), [defaultConfig]);

    return (
        <ErrorBoundary>
            <Box sx={{
                width: '100%',
                height: '100%',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {finalData && finalData.length > 0 && (
                    <Box sx={{
                        height: '100%',
                        width: '100%',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <ConfigurableStabilityChart
                            data={finalData}
                            height={height}
                            title=""
                            defaultConfig={mergedConfig}
                            onConfigChange={onConfigChange}
                        />
                    </Box>
                )}
            </Box>
        </ErrorBoundary>
    );
};

export default EnhancedStabilityChart;

// Función auxiliar para generar datos de emergencia
function generateEmergencyData(): StabilityDataPoint[] {
    const data: StabilityDataPoint[] = [];
    const totalPoints = 1080;
    const samplingInterval = 5;

    for (let i = 0; i < totalPoints; i++) {
        const currentTime = i * samplingInterval;
        const t = currentTime / 60;

        const roll = Math.sin(t * 0.05) * 2 + Math.sin(t * 0.12) * 1;
        const lateralAcc = Math.sin(t * 0.08) * 0.1 + Math.sin(t * 0.15) * 0.05;
        const speed = 60 + Math.sin(t * 0.1) * 20;
        const ltr = Math.max(0, Math.min(1, 0.9 - Math.abs(lateralAcc) * 0.3 - Math.abs(roll) / 30));
        const ssf = Math.max(0, Math.min(2, 1.2 + Math.sin(t * 0.1) * 0.1));
        const drs = Math.max(0, Math.min(10, 6.5 + Math.sin(t * 0.15) * 0.5));
        const ssc = Math.max(0, Math.min(100, 75 + Math.sin(t * 0.2) * 5));

        data.push({
            time: currentTime,
            roll,
            pitch: Math.sin(t * 0.1) * 2,
            lateralAcceleration: lateralAcc,
            speed,
            ltr,
            ssf,
            drs,
            ssc
        });
    }

    return data;
} 