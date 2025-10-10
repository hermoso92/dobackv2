import React, { useCallback, useEffect, useState } from 'react';
import { t } from "../i18n";
import AdvancedSensorChart from './AdvancedSensorChart';

interface SimulatedDataPoint {
    timestamp: string;
    temperature: number;
    humidity: number;
    pressure: number;
    acceleration: {
        x: number;
        y: number;
        z: number;
    };
    gyroscope: {
        x: number;
        y: number;
        z: number;
    };
    magnetometer: {
        x: number;
        y: number;
        z: number;
    };
}

// Función para generar un valor con ruido basado en un valor base
const generateNoisyValue = (baseValue: number, noiseRange: number = 0.5) => {
    return baseValue + (Math.random() * 2 - 1) * noiseRange;
};

// Función para generar un valor sinusoidal con ruido
const generateSinusoidalValue = (
    time: number,
    amplitude: number = 1,
    period: number = 120,
    phase: number = 0,
    offset: number = 0,
    noiseAmplitude: number = 0.1
) => {
    const sinValue = amplitude * Math.sin((time / period) * 2 * Math.PI + phase) + offset;
    return sinValue + (Math.random() * 2 - 1) * noiseAmplitude;
};

const RealTimeSensors: React.FC = () => {
    const [data, setData] = useState<SimulatedDataPoint[]>([]);
    const [isRunning, setIsRunning] = useState(true);
    const [sampleRate, setSampleRate] = useState(10); // muestras por segundo
    const [displayWindow, setDisplayWindow] = useState(120); // segundos a mostrar
    const [showFFT, setShowFFT] = useState(false);
    const [showDerivative, setShowDerivative] = useState(true);
    const [decimationFactor, setDecimationFactor] = useState(1);

    // Valores base para la simulación
    const baseValues = {
        temperature: 24,      // 24°C
        humidity: 50,         // 50%
        pressure: 1013,       // 1013 hPa
        accelerationMag: 9.8, // 9.8 m/s² (gravedad)
        gyroscopeMag: 0,      // 0 °/s en reposo
        magnetometerMag: 45,  // 45 μT (aprox. campo magnético terrestre)
    };

    // Función para generar un nuevo punto de datos
    const generateDataPoint = useCallback((timeOffset: number = 0): SimulatedDataPoint => {
        const now = new Date();
        now.setSeconds(now.getSeconds() + timeOffset);

        const timeSeconds = now.getTime() / 1000;

        // Simulamos valores sinusoidales con diferentes períodos y fases
        // para crear patrones más interesantes y realistas
        return {
            timestamp: now.toISOString(),
            temperature: generateSinusoidalValue(
                timeSeconds,
                2,           // amplitud de 2°C
                300,         // período de 300 segundos (5 min)
                0,           // sin fase
                baseValues.temperature,
                0.05         // poco ruido para la temperatura
            ),
            humidity: generateSinusoidalValue(
                timeSeconds,
                10,          // amplitud de 10%
                600,         // período de 10 minutos
                Math.PI / 4,   // fase desplazada
                baseValues.humidity,
                0.2          // ruido moderado para humedad
            ),
            pressure: generateSinusoidalValue(
                timeSeconds,
                1.5,         // amplitud de 1.5 hPa
                1800,        // período de 30 minutos
                Math.PI / 2,   // fase desplazada
                baseValues.pressure,
                0.1          // poco ruido para presión
            ),
            acceleration: {
                x: generateSinusoidalValue(timeSeconds, 0.2, 5, 0, 0, 0.05),
                y: generateSinusoidalValue(timeSeconds, 0.2, 5, Math.PI / 3, 0, 0.05),
                z: generateSinusoidalValue(timeSeconds, 0.1, 5, Math.PI / 6, baseValues.accelerationMag, 0.05),
            },
            gyroscope: {
                x: generateSinusoidalValue(timeSeconds, 5, 3, 0, 0, 0.5),
                y: generateSinusoidalValue(timeSeconds, 5, 3, Math.PI / 4, 0, 0.5),
                z: generateSinusoidalValue(timeSeconds, 5, 3, Math.PI / 2, 0, 0.5),
            },
            magnetometer: {
                x: generateSinusoidalValue(timeSeconds, 5, 10, 0, 30, 0.2),
                y: generateSinusoidalValue(timeSeconds, 5, 10, Math.PI / 3, 10, 0.2),
                z: generateSinusoidalValue(timeSeconds, 5, 10, Math.PI / 6, 20, 0.2),
            }
        };
    }, [baseValues]);

    // Inicializar datos históricos al cargar el componente
    useEffect(() => {
        // Generar datos históricos para llenar la ventana de visualización inicial
        const historicalData: SimulatedDataPoint[] = [];
        const now = new Date();
        const samplesNeeded = Math.min(displayWindow * sampleRate, 1000); // Limitamos a 1000 muestras iniciales

        for (let i = samplesNeeded - 1; i >= 0; i--) {
            const timeOffset = -i / sampleRate;
            historicalData.push(generateDataPoint(timeOffset));
        }

        setData(historicalData);
    }, [displayWindow, sampleRate, generateDataPoint]);

    // Efecto para agregar nuevos datos en tiempo real
    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            const newPoint = generateDataPoint();

            setData(prevData => {
                // Mantenemos solo los datos dentro de la ventana de visualización
                const newData = [...prevData, newPoint];
                const cutoffTime = new Date();
                cutoffTime.setSeconds(cutoffTime.getSeconds() - displayWindow);

                return newData.filter(point => new Date(point.timestamp) >= cutoffTime);
            });
        }, 1000 / sampleRate);

        return () => clearInterval(interval);
    }, [isRunning, sampleRate, displayWindow, generateDataPoint]);

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>{t('DobackSoft_monitor_de_sensores_en_tiempo_real')}</h2>

            <div style={{
                backgroundColor: '#fff',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}>
                <div>
                    <label style={{ marginRight: '10px', fontWeight: 'bold' }}>{t('muestreo')}</label>
                    <select
                        value={sampleRate}
                        onChange={(e) => setSampleRate(Number(e.target.value))}
                        style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        <option value="1">{t('1_hz')}</option>
                        <option value="5">{t('5_hz')}</option>
                        <option value="10">{t('10_hz')}</option>
                        <option value="20">{t('20_hz')}</option>
                        <option value="50">{t('50_hz')}</option>
                        <option value="100">{t('100_hz')}</option>
                    </select>
                </div>

                <div>
                    <label style={{ marginRight: '10px', fontWeight: 'bold' }}>{t('ventana')}</label>
                    <select
                        value={displayWindow}
                        onChange={(e) => setDisplayWindow(Number(e.target.value))}
                        style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        <option value="30">{t('30_segundos')}</option>
                        <option value="60">{t('1_minuto')}</option>
                        <option value="120">{t('2_minutos')}</option>
                        <option value="300">{t('5_minutos')}</option>
                        <option value="600">{t('10_minutos')}</option>
                    </select>
                </div>

                <div>
                    <label style={{ marginRight: '10px', fontWeight: 'bold' }}>{t('decimacion')}</label>
                    <select
                        value={decimationFactor}
                        onChange={(e) => setDecimationFactor(Number(e.target.value))}
                        style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        <option value="1">{t('sin_decimacion')}</option>
                        <option value="2">1/2</option>
                        <option value="5">1/5</option>
                        <option value="10">1/10</option>
                    </select>
                </div>

                <div>
                    <label style={{ marginRight: '10px' }}>
                        <input
                            type="checkbox"
                            checked={showDerivative}
                            onChange={(e) => setShowDerivative(e.target.checked)}
                            style={{ marginRight: '5px' }}
                        />
                        {t('mostrar_derivada')}</label>

                    <label style={{ marginRight: '10px' }}>
                        <input
                            type="checkbox"
                            checked={showFFT}
                            onChange={(e) => setShowFFT(e.target.checked)}
                            style={{ marginRight: '5px' }}
                        />
                        {t('mostrar_fft')}</label>
                </div>

                <div>
                    <button
                        onClick={() => setIsRunning(!isRunning)}
                        style={{
                            padding: '5px 15px',
                            backgroundColor: isRunning ? '#f44336' : '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        {isRunning ? 'Pausar' : 'Iniciar'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <AdvancedSensorChart
                    title="Temperatura"
                    data={data}
                    sensorType="temperature"
                    timeWindow={displayWindow}
                    updateInterval={1000}
                    threshold={{ min: 20, max: 30 }}
                    showDerivative={showDerivative}
                    showFFT={showFFT}
                    tickInterval={10}
                    decimationFactor={decimationFactor}
                />

                <AdvancedSensorChart
                    title="Humedad"
                    data={data}
                    sensorType="humidity"
                    timeWindow={displayWindow}
                    updateInterval={1000}
                    threshold={{ min: 30, max: 70 }}
                    showDerivative={showDerivative}
                    showFFT={showFFT}
                    tickInterval={10}
                    decimationFactor={decimationFactor}
                />
            </div>

            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <AdvancedSensorChart
                    title="Presión Atmosférica"
                    data={data}
                    sensorType="pressure"
                    timeWindow={displayWindow}
                    updateInterval={1000}
                    threshold={{ min: 1010, max: 1020 }}
                    showDerivative={showDerivative}
                    showFFT={showFFT}
                    tickInterval={10}
                    decimationFactor={decimationFactor}
                />

                <AdvancedSensorChart
                    title="Aceleración"
                    data={data}
                    sensorType="acceleration"
                    timeWindow={displayWindow}
                    updateInterval={1000}
                    showDerivative={showDerivative}
                    showFFT={showFFT}
                    tickInterval={10}
                    decimationFactor={decimationFactor}
                />
            </div>

            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <AdvancedSensorChart
                    title="Giroscopio"
                    data={data}
                    sensorType="gyroscope"
                    timeWindow={displayWindow}
                    updateInterval={1000}
                    showDerivative={showDerivative}
                    showFFT={showFFT}
                    tickInterval={10}
                    decimationFactor={decimationFactor}
                />

                <AdvancedSensorChart
                    title="Magnetómetro"
                    data={data}
                    sensorType="magnetometer"
                    timeWindow={displayWindow}
                    updateInterval={1000}
                    showDerivative={showDerivative}
                    showFFT={showFFT}
                    tickInterval={10}
                    decimationFactor={decimationFactor}
                />
            </div>

            <div style={{
                margin: '30px 0',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                fontSize: '0.9em',
                color: '#666',
                borderLeft: '4px solid #2196F3'
            }}>
                <p><strong>{t('nota_tecnica')}</strong> {t('los_datos_mostrados_son_simulados_utilizando_funciones_senoidales_con_distintas_frecuencias_amplitudes_y_fases_con_ruido_aleatorio_superpuesto_para_mayor_realismo_en_un_sistema_real_estos_datos_provendrian_de_sensores_fisicos_a_traves_de_una_api_o_websockets')}</p>
                <p>{t('la_frecuencia_de_muestreo_actual_es_de')}<strong>{sampleRate} {t('hz')}</strong> {t('muestras_por_segundo_la_representacion_visual_utiliza_un_factor_de_decimacion_de')}<strong>1/{decimationFactor}</strong> {t('para_optimizar_el_rendimiento_de_renderizado')}</p>
            </div>
        </div>
    );
};

export default RealTimeSensors; 