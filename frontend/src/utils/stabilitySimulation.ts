import { format } from 'date-fns';
import { StabilityDataPoint, StabilityEvent, StabilityEventType } from '../types/stability';
// Función para añadir ruido controlado a un valor
const addNoise = (value: number, amplitude: number = 0.1): number => {
    const noise = (Math.random() * 2 - 1) * amplitude;
    return value + noise * Math.abs(value * 0.05);
};

// Función para generar un valor aleatorio con distribución normal
const randomNormal = (mean: number, stdDev: number): number => {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
};

// Función para generar un valor con tendencia y ruido
const generateTrendValue = (time: number, baseValue: number, amplitude: number, noiseAmplitude: number, frequency: number = 0.1) => {
    // En autopista, los cambios son muy sutiles
    const slowTrend = Math.sin(time * frequency * 0.1) * amplitude * 0.3;
    const microVariation = Math.sin(time * frequency) * amplitude * 0.1;
    return baseValue + slowTrend + microVariation + addNoise(0, noiseAmplitude);
};

// Constantes para simulación realista
const TRAFFIC_CONSTANTS = {
    CITY: {
        NORMAL: 40,           // Velocidad normal en ciudad
        MIN_MOVING: 20,       // Velocidad mínima cuando está en movimiento
        MAX: 50,             // Velocidad máxima en ciudad
        SEMAFORO: {
            DISTANCIA_MIN: 300,  // Mínima distancia entre semáforos
            DISTANCIA_MAX: 600,  // Máxima distancia entre semáforos
            TIEMPO_FRENADO: 8,   // Segundos para frenar completamente
            TIEMPO_ARRANQUE: 5   // Segundos para alcanzar velocidad normal
        },
        ACELERACION: {
            NORMAL: 2.5,     // m/s² - Aceleración normal
            FUERTE: 3.0,     // m/s² - Aceleración fuerte (después de semáforo)
            FRENADA: -3.0,   // m/s² - Frenada normal
            EMERGENCIA: -5.0 // m/s² - Frenada fuerte
        }
    },
    HIGHWAY: {
        NORMAL: 100,         // Velocidad normal en autopista
        MIN_MOVING: 80,      // Velocidad mínima en autopista
        MAX: 120,           // Velocidad máxima en autopista
        CAMBIO_MAXIMO: 2     // Máximo cambio de velocidad por segundo
    },
    TRAFFIC_LIGHT: {
        MIN_DISTANCE: 300,   // Distancia mínima entre semáforos (metros)
        MAX_DISTANCE: 800    // Distancia máxima entre semáforos (metros)
    },
    ACCELERATION: {
        NORMAL: 2.5,        // m/s²
        AGGRESSIVE: 3.5,    // m/s²
        BRAKE_NORMAL: -3.0, // m/s²
        BRAKE_HARD: -6.0    // m/s²
    }
};

// Función para generar ruido Perlin simplificado
const perlinNoise = (() => {
    const permutation = Array.from({ length: 256 }, (_, i) => i)
        .sort(() => Math.random() - 0.5);
    const p = [...permutation, ...permutation];

    const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (t: number, a: number, b: number) => a + t * (b - a);

    const grad = (hash: number, x: number) => {
        const h = hash & 15;
        const grad = 1 + (h & 7);
        return (h & 8 ? -grad : grad) * x;
    };

    return (x: number) => {
        const xi = Math.floor(x) & 255;
        x -= Math.floor(x);
        const u = fade(x);
        return lerp(u, grad(p[xi], x), grad(p[xi + 1], x - 1));
    };
})();

// Función para generar eventos aleatorios pero coherentes
const generateTrafficEvent = (time: number, phase: string) => {
    // Usar ruido Perlin para generar eventos más naturales
    const noise = perlinNoise(time * 0.01);
    const hourOfDay = (time / 3600) % 24;

    // Factores que afectan al tráfico
    const isRushHour = (hourOfDay > 7 && hourOfDay < 10) || (hourOfDay > 17 && hourOfDay < 20);
    const isWeekend = Math.floor(time / (24 * 3600)) % 7 >= 5;
    const weatherFactor = perlinNoise(time * 0.005 + 1000); // Cambios climáticos lentos

    // Probabilidad base de eventos según el contexto
    let eventProb = 0.1;
    if (isRushHour) eventProb += 0.2;
    if (isWeekend) eventProb -= 0.05;
    if (weatherFactor > 0.6) eventProb += 0.15; // Mal tiempo
    if (phase.includes('city')) eventProb += 0.1;

    // Tipos de eventos posibles
    const events = {
        normal: { prob: 0.6, speedMod: 0 },
        slowdown: { prob: 0.2, speedMod: -15 },
        traffic: { prob: 0.1, speedMod: -25 },
        stop: { prob: 0.1, speedMod: -999 }
    };

    // Determinar el evento basado en ruido y probabilidades
    const eventRoll = (noise + 1) / 2; // Normalizar a 0-1
    if (eventRoll < eventProb) {
        let cumProb = 0;
        for (const [type, data] of Object.entries(events)) {
            cumProb += data.prob;
            if (eventRoll / eventProb < cumProb) {
                return data.speedMod;
            }
        }
    }

    return 0;
};

// Función para determinar la fase actual del viaje
export const getTravelPhase = (time: number, totalDuration: number) => {
    const progress = time / totalDuration;
    if (progress < 0.167) return 'city_start';        // 0-20 min
    if (progress < 0.25) return 'emergency';          // 20-30 min
    if (progress < 0.833) return 'highway';           // 30-100 min
    if (progress < 0.917) return 'intervention';      // 100-110 min
    return 'city_end';                                // 110-120 min
};

// Función para simular semáforos reales con variación en distancias
const simulateTrafficLight = (time: number, phase: string, progress: number): { mustStop: boolean, distance: number, state: 'red' | 'amber' | 'green' } => {
    if (!phase.includes('city')) return { mustStop: false, distance: Infinity, state: 'green' };

    // Calcular posición aproximada en la ciudad
    const cityProgress = phase === 'city_start' ? progress / 0.15 : (progress - 0.85) / 0.15;
    const distanceInCity = cityProgress * 8000; // ~8km en ciudad

    // Usar un offset basado en la posición para variar la distancia entre semáforos
    const baseDistance = TRAFFIC_CONSTANTS.CITY.SEMAFORO.DISTANCIA_MAX;
    const variacion = TRAFFIC_CONSTANTS.CITY.SEMAFORO.DISTANCIA_MAX - TRAFFIC_CONSTANTS.CITY.SEMAFORO.DISTANCIA_MIN;
    const semaforoDistance = TRAFFIC_CONSTANTS.CITY.SEMAFORO.DISTANCIA_MIN + Math.sin(distanceInCity * 0.1) * variacion;

    // Determinar si hay semáforo basado en la posición
    const semaforoId = Math.floor(distanceInCity / semaforoDistance);
    const distanceToSemaforo = distanceInCity % semaforoDistance;

    // Cada semáforo tiene un offset diferente basado en su ID
    const offset = (semaforoId * 17) % (TRAFFIC_CONSTANTS.CITY.SEMAFORO.TIEMPO_FRENADO +
        TRAFFIC_CONSTANTS.CITY.SEMAFORO.TIEMPO_ARRANQUE);

    const cycleDuration = TRAFFIC_CONSTANTS.CITY.SEMAFORO.TIEMPO_FRENADO +
        TRAFFIC_CONSTANTS.CITY.SEMAFORO.TIEMPO_ARRANQUE;

    const cycleTime = (time + offset) % cycleDuration;

    // Determinar el estado del semáforo
    let state: 'red' | 'amber' | 'green' = 'green';
    if (cycleTime < TRAFFIC_CONSTANTS.CITY.SEMAFORO.TIEMPO_FRENADO) {
        state = 'red';
    } else if (cycleTime < TRAFFIC_CONSTANTS.CITY.SEMAFORO.TIEMPO_FRENADO + TRAFFIC_CONSTANTS.CITY.SEMAFORO.TIEMPO_ARRANQUE) {
        state = 'amber';
    }

    return {
        mustStop: state === 'red' || (state === 'amber' && distanceToSemaforo < 50),
        distance: semaforoDistance - distanceToSemaforo,
        state
    };
};

// Función para simular tráfico real
const simulateTraffic = (time: number, phase: string, progress: number): { speed: number, isJammed: boolean } => {
    // Eventos aleatorios pero realistas según la zona
    const randomEvent = Math.random();

    if (phase.includes('city')) {
        // En ciudad
        if (randomEvent < 0.1) { // 10% de probabilidad de tráfico denso
            return {
                speed: -10 - Math.random() * 5, // Reducción de 10-15 km/h
                isJammed: false
            };
        }
    } else if (phase === 'highway') {
        // En la A-42
        if (randomEvent < 0.05) { // 5% de probabilidad de tráfico
            return {
                speed: -20 - Math.random() * 10, // Reducción de 20-30 km/h
                isJammed: false
            };
        }
    }

    // Variaciones normales de velocidad
    const variation = phase.includes('city') ?
        (Math.random() - 0.5) * 10 : // ±5 km/h en ciudad
        (Math.random() - 0.5) * 20;  // ±10 km/h en autovía

    return { speed: variation, isJammed: false };
};

// Función para simular comportamiento del conductor
const simulateDriverBehavior = (time: number, phase: string, isJammed: boolean, isStopped: boolean): number => {
    if (isStopped) return -999; // Parada completa
    if (isJammed) return randomNormal(-5, 1);

    // Comportamiento específico por fase
    switch (phase) {
        case 'city_start':
        case 'city_end':
            return randomNormal(0, 1);
        case 'highway_entry':
            return TRAFFIC_CONSTANTS.ACCELERATION.NORMAL;
        case 'highway_exit':
            return TRAFFIC_CONSTANTS.ACCELERATION.BRAKE_NORMAL;
        case 'highway':
            return randomNormal(0, 0.5);
        case 'final_stop':
            return TRAFFIC_CONSTANTS.ACCELERATION.BRAKE_NORMAL;
        default:
            return 0;
    }
};

// Función para generar velocidad según la fase
const getTargetSpeedForPhase = (phase: string, time: number, progress: number): number => {
    let baseSpeed = 0;
    let currentSpeed = 0;

    switch (phase) {
        case 'city_start':
        case 'city_end':
            baseSpeed = TRAFFIC_CONSTANTS.CITY.NORMAL;
            break;

        case 'highway_entry':
            // Aceleración progresiva a la autovía (más rápida)
            const entryProgress = Math.min(1, (progress - 0.15) / 0.03); // 3% del trayecto
            baseSpeed = TRAFFIC_CONSTANTS.CITY.NORMAL +
                (TRAFFIC_CONSTANTS.HIGHWAY.NORMAL - TRAFFIC_CONSTANTS.CITY.NORMAL) * entryProgress;
            break;

        case 'highway':
            baseSpeed = TRAFFIC_CONSTANTS.HIGHWAY.NORMAL;
            break;

        case 'highway_exit':
            // Desaceleración progresiva (más rápida)
            const exitProgress = Math.min(1, (progress - 0.85) / 0.03); // 3% del trayecto
            baseSpeed = TRAFFIC_CONSTANTS.HIGHWAY.NORMAL -
                (TRAFFIC_CONSTANTS.HIGHWAY.NORMAL - TRAFFIC_CONSTANTS.CITY.NORMAL) * exitProgress;
            break;
    }

    const trafficLight = simulateTrafficLight(time, phase, progress);
    const traffic = simulateTraffic(time, phase, progress);

    // Gestión de paradas y arranques
    if (trafficLight.mustStop) {
        // Si llevamos menos de 45 segundos parados, mantener parada
        if (trafficLight.distance < TRAFFIC_CONSTANTS.CITY.SEMAFORO.TIEMPO_FRENADO) {
            return 0;
        } else {
            // Después de 45 segundos, comenzar aceleración
            return Math.min(30, trafficLight.distance - TRAFFIC_CONSTANTS.CITY.SEMAFORO.TIEMPO_FRENADO);
        }
    }

    // Aplicar efectos del tráfico
    currentSpeed = baseSpeed + traffic.speed;

    // Asegurar límites realistas según la zona
    if (phase.includes('city')) {
        if (currentSpeed > 0) {
            // En ciudad, evitar velocidades intermedias sostenidas
            if (currentSpeed < TRAFFIC_CONSTANTS.CITY.MIN_MOVING) {
                currentSpeed = Math.min(currentSpeed + TRAFFIC_CONSTANTS.CITY.ACELERACION.NORMAL,
                    TRAFFIC_CONSTANTS.CITY.NORMAL);
            }
            currentSpeed = Math.max(TRAFFIC_CONSTANTS.CITY.MIN_MOVING,
                Math.min(TRAFFIC_CONSTANTS.CITY.MAX, currentSpeed));
        }
    } else if (phase.includes('highway')) {
        currentSpeed = Math.max(TRAFFIC_CONSTANTS.HIGHWAY.MIN_MOVING,
            Math.min(TRAFFIC_CONSTANTS.HIGHWAY.MAX, currentSpeed));
    }

    return Math.max(0, currentSpeed);
};

// Función para generar valores según la fase y el estado del vehículo
const getPhaseParameters = (phase: string, speed: number, isStopped: boolean) => {
    const baseParams = {
        rollAmplitude: 0,
        pitchAmplitude: 0,
        noiseAmplitude: 0,
        eventProbability: 0
    };

    // Si el vehículo está parado, reducir drásticamente los movimientos
    if (isStopped || speed < 0.1) {
        return {
            rollAmplitude: 0.1,    // Mínimo movimiento por suspensión
            pitchAmplitude: 0.1,   // Mínimo movimiento por suspensión
            noiseAmplitude: 0.05,  // Ruido mínimo
            eventProbability: 0     // Sin eventos cuando está parado
        };
    }

    // Calcular parámetros base según la velocidad
    const speedFactor = speed / TRAFFIC_CONSTANTS.HIGHWAY.MAX;
    const baseRoll = 2 * speedFactor;
    const basePitch = 1.5 * speedFactor;
    const baseNoise = 0.1 * speedFactor;
    const baseEventProb = 0.02 * speedFactor;

    switch (phase) {
        case 'city_start':
        case 'city_end':
            return {
                rollAmplitude: baseRoll * 1.5 * (1 + Math.random() * 0.3),    // Variación adicional
                pitchAmplitude: basePitch * 1.5 * (1 + Math.random() * 0.3),
                noiseAmplitude: baseNoise * 2,
                eventProbability: baseEventProb * 2
            };

        case 'highway_entry':
        case 'highway_exit':
            return {
                rollAmplitude: baseRoll * 1.2 * (1 + Math.random() * 0.2),
                pitchAmplitude: basePitch * 1.2 * (1 + Math.random() * 0.2),
                noiseAmplitude: baseNoise * 1.5,
                eventProbability: baseEventProb * 1.5
            };

        case 'highway':
            return {
                rollAmplitude: baseRoll * (1 + Math.random() * 0.1),
                pitchAmplitude: basePitch * (1 + Math.random() * 0.1),
                noiseAmplitude: baseNoise,
                eventProbability: baseEventProb
            };

        case 'final_stop':
            const finalSpeedFactor = Math.min(1, speed / TRAFFIC_CONSTANTS.CITY.NORMAL);
            return {
                rollAmplitude: baseRoll * finalSpeedFactor,
                pitchAmplitude: basePitch * finalSpeedFactor,
                noiseAmplitude: baseNoise * finalSpeedFactor,
                eventProbability: 0
            };

        default:
            return baseParams;
    }
};

// Función para generar velocidad base con patrón realista de autopista
const baseSpeed = (time: number): number => {
    const hourInSeconds = time / 3600;
    // Velocidad base de autopista (90-130 km/h)
    const baseSpeed = 110;

    // Variaciones por tráfico
    const trafficVariation = Math.sin(hourInSeconds * Math.PI * 2) * 10;

    // Eventos ocasionales (cada ~10 minutos)
    const isEvent = Math.sin(time * 0.0015) > 0.98;
    const eventVariation = isEvent ? (Math.random() > 0.5 ? -20 : 15) : 0;

    // Atascos ocasionales
    const isJam = Math.sin(time * 0.0008) > 0.99;
    const jamVariation = isJam ? -40 : 0;

    return Math.max(0, Math.min(130, baseSpeed + trafficVariation + eventVariation + jamVariation));
};

// Función para calcular la próxima parada en ciudad
const calculateNextStop = (currentPosition: number, phase: string): number => {
    if (!phase.includes('city')) return Infinity;

    // Distancia aleatoria entre semáforos
    const distancia = TRAFFIC_CONSTANTS.CITY.SEMAFORO.DISTANCIA_MIN +
        Math.random() * (TRAFFIC_CONSTANTS.CITY.SEMAFORO.DISTANCIA_MAX - TRAFFIC_CONSTANTS.CITY.SEMAFORO.DISTANCIA_MIN);

    return Math.floor(currentPosition / distancia + 1) * distancia;
};

// Función para generar datos de estabilidad realistas
export const generateStabilityData = (startTime: Date, durationMinutes: number) => {
    const data: StabilityDataPoint[] = [];
    const events: StabilityEvent[] = [];
    const duration = durationMinutes * 60;
    const initialTime = startTime;

    let currentSpeed = 40;
    let targetSpeed = 40;
    let isStoppingForLight = false;
    let stoppedTime = 0;
    let lastStopTime = -100;

    // Variables de estabilidad con valores base realistas
    let currentRoll = 1.5;
    let currentPitch = 4.5;
    let currentYaw = 0;
    let currentAx = 0;
    let currentAy = 85;
    let currentAz = 1020;
    let currentSi = 92;

    // Factores de suavizado
    const SMOOTHING = {
        ROLL: 0.05,
        PITCH: 0.05,
        YAW: 0.05,
        ACCEL: 0.1,
        SPEED: 0.1
    };

    for (let t = 0; t < duration; t++) {
        const progress = t / duration;
        const currentTime = new Date(initialTime.getTime() + t * 1000);
        const phase = getTravelPhase(t, duration);

        // Determinar velocidad objetivo según la fase
        if (phase === 'city_start' || phase === 'city_end') {
            if (!isStoppingForLight && t - lastStopTime > 120) {
                const shouldStop = Math.random() < 0.01;
                if (shouldStop) {
                    isStoppingForLight = true;
                    targetSpeed = 0;
                } else {
                    targetSpeed = 45 + Math.sin(t * 0.01) * 5;
                }
            }
        } else if (phase === 'highway') {
            isStoppingForLight = false;
            targetSpeed = 100 + Math.sin(t * 0.005) * 10;
        }

        // Gestión de paradas
        if (isStoppingForLight && currentSpeed < 0.1) {
            stoppedTime++;
            if (stoppedTime > 30) {
                isStoppingForLight = false;
                targetSpeed = 45;
                stoppedTime = 0;
                lastStopTime = t;
            }
        }

        // Ajustar velocidad con cambios graduales
        const speedDiff = targetSpeed - currentSpeed;
        const maxSpeedChange = phase.includes('city') ? 2 : 3;
        const speedChange = Math.max(-maxSpeedChange, Math.min(maxSpeedChange, speedDiff * SMOOTHING.SPEED));
        currentSpeed = Math.max(0, currentSpeed + speedChange);

        // Calcular variables de estabilidad
        const speedFactor = currentSpeed / 120;

        // Roll con cambios suaves
        const targetRoll = 1.5 + (Math.sin(t * 0.02) * 0.3 + Math.random() * 0.2 - 0.1) * speedFactor;
        currentRoll += (targetRoll - currentRoll) * SMOOTHING.ROLL;
        currentRoll = Math.max(1.0, Math.min(2.0, currentRoll));

        // Pitch afectado por aceleración/frenado
        const targetPitch = 4.5 + (speedChange > 0 ? 0.2 : speedChange < 0 ? -0.2 : 0);
        currentPitch += (targetPitch - currentPitch) * SMOOTHING.PITCH;
        currentPitch = Math.max(4.0, Math.min(5.0, currentPitch));

        // Yaw con cambios naturales
        const yawChange = phase.includes('city') ?
            Math.sin(t * 0.1) * 0.2 * speedFactor :
            Math.sin(t * 0.05) * 0.1 * speedFactor;
        currentYaw += yawChange;

        // Aceleraciones realistas
        const targetAx = speedChange + Math.sin(t * 0.1) * 0.5;
        const targetAy = 85 + speedChange * 2;
        const targetAz = 1020 + (phase.includes('city') ? Math.sin(t * 0.1) : Math.sin(t * 0.05));

        currentAx += (targetAx - currentAx) * SMOOTHING.ACCEL;
        currentAy += (targetAy - currentAy) * SMOOTHING.ACCEL;
        currentAz += (targetAz - currentAz) * SMOOTHING.ACCEL;

        // Mantener aceleraciones en rangos realistas
        currentAx = Math.max(-2, Math.min(2, currentAx));
        currentAy = Math.max(75, Math.min(95, currentAy));
        currentAz = Math.max(1015, Math.min(1025, currentAz));

        // Velocidades angulares
        const gx = (currentRoll - (data[data.length - 1]?.roll || currentRoll)) * 100;
        const gy = (currentPitch - (data[data.length - 1]?.pitch || currentPitch)) * 100;
        const gz = (currentYaw - (data[data.length - 1]?.yaw || currentYaw)) * 100;

        const accmag = Math.sqrt(currentAx * currentAx + currentAy * currentAy + currentAz * currentAz);

        // Índice de estabilidad más realista
        const targetSi = 92 - // Base más realista
            Math.abs(currentRoll - 1.5) * 3 -
            Math.abs(currentPitch - 4.5) * 2 -
            Math.abs(currentAx) * 2 -
            Math.abs(currentAy - 85) * 0.1 -
            Math.abs(speedChange) * 1;

        // Suavizar cambios en SI y mantener en rango realista
        currentSi += (targetSi - currentSi) * 0.1;
        currentSi = Math.max(75, Math.min(95, currentSi));

        data.push({
            time: format(currentTime, 'HH:mm'),
            timestamp: currentTime.toISOString(),
            ax: currentAx,
            ay: currentAy,
            az: currentAz,
            gx, gy, gz,
            roll: currentRoll,
            pitch: currentPitch,
            yaw: currentYaw,
            si: currentSi,
            accmag,
            speed: currentSpeed,
            lateralAcceleration: currentAx
        });

        // Generar eventos solo para cambios significativos
        if (Math.abs(speedChange) > 3 ||
            Math.abs(currentRoll - 1.5) > 0.4 ||
            Math.abs(currentAx) > 1.5 ||
            currentSi < 80) {

            events.push({
                id: events.length + 1,
                type: StabilityEventType.ROLL_CRITICAL,
                severity: currentSi < 78 ? 'high' : 'medium',
                value: `${currentRoll.toFixed(2)}°`,
                timestamp: currentTime.toISOString(),
                description: `${phase.replace('_', ' ')} - Roll: ${currentRoll.toFixed(2)}°, SI: ${currentSi.toFixed(1)}%, Acel. Lat: ${currentAx.toFixed(2)}g, Velocidad: ${currentSpeed.toFixed(0)} km/h`
            });
        }
    }

    return { data, events };
};