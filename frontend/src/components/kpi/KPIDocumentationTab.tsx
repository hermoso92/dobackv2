import { BookOpenIcon, ChartBarIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useMemo, useState } from 'react';
import { useGlobalFilters } from '../../hooks/useGlobalFilters';
import { useKPIs } from '../../hooks/useKPIs';

interface KPIDocumentation {
    id: string;
    name: string;
    description: string;
    calculation: string;
    formula?: string;
    dataSource: string;
    troubleshooting: {
        zeroValue: string;
        incorrectValue: string;
    };
    examples?: string[];
}

type KPIStatus = 'ok' | 'warning' | 'critical';

interface KPIComputedData {
    primaryLabel: string;
    primaryValue: string;
    status: KPIStatus;
    statusLabel: string;
    breakdown?: Array<{ label: string; value: string }>;
    observations?: string[];
    actions?: string[];
}

const kpiDocumentation: KPIDocumentation[] = [
    {
        id: 'driving-hours',
        name: 'Horas de Conducción',
        description: 'Tiempo total que el vehículo ha estado en movimiento (fuera del parque y con velocidad > 1 km/h).',
        calculation: 'Se calcula sumando los intervalos de tiempo entre puntos GPS consecutivos donde la velocidad calculada es ≥ 1 km/h y ≤ 160 km/h. Solo se consideran puntos GPS válidos (coordenadas dentro de España: 36-44°N, -10 a 5°E, y con al menos 4 satélites).',
        formula: 'driving_seconds = Σ(delta_tiempo) donde velocidad_kmh ∈ [1, 160] y GPS válido',
        dataSource: 'GpsMeasurement (tabla de mediciones GPS)',
        troubleshooting: {
            zeroValue: 'Si sale 0, verifica: (1) Que haya sesiones en el rango de fechas seleccionado, (2) Que existan mediciones GPS válidas (coordenadas dentro de España y ≥4 satélites), (3) Que la velocidad calculada entre puntos sea ≥ 1 km/h. Si no hay GPS, el sistema intentará usar matchedduration de la sesión.',
            incorrectValue: 'Si el valor parece incorrecto: (1) Verifica que los puntos GPS no tengan saltos grandes (>100m en 5s), (2) Comprueba que las coordenadas estén dentro de España, (3) Revisa que el intervalo entre puntos GPS no exceda 90 segundos (se limita automáticamente).'
        },
        examples: [
            'Ejemplo: Si un vehículo tiene 3 puntos GPS válidos con intervalos de 10s, 15s y 20s, y todos tienen velocidad > 1 km/h, entonces driving_seconds = 10 + 15 + 20 = 45 segundos.',
            'Si hay un salto GPS de 500m en 5s (velocidad = 360 km/h), ese intervalo se descarta por exceder el límite de 160 km/h.'
        ]
    },
    {
        id: 'kilometers',
        name: 'Kilómetros Recorridos',
        description: 'Distancia total recorrida por el vehículo calculada usando la fórmula Haversine entre puntos GPS consecutivos.',
        calculation: 'Se suma la distancia Haversine entre cada par de puntos GPS consecutivos válidos. La distancia se calcula en kilómetros usando el radio terrestre (6371 km). Solo se consideran segmentos con velocidad ≤ 160 km/h y coordenadas válidas.',
        formula: 'km_total = Σ(haversine(lat1, lon1, lat2, lon2)) donde velocidad ≤ 160 km/h',
        dataSource: 'GpsMeasurement (tabla de mediciones GPS)',
        troubleshooting: {
            zeroValue: 'Si sale 0, verifica: (1) Que haya puntos GPS válidos (coordenadas dentro de España y ≥4 satélites), (2) Que existan al menos 2 puntos GPS consecutivos para calcular distancia, (3) Que los puntos no estén todos en la misma ubicación. Si no hay GPS, el sistema intentará usar matcheddistance de la sesión.',
            incorrectValue: 'Si el valor parece incorrecto: (1) Verifica que no haya saltos GPS grandes (se filtran automáticamente), (2) Comprueba que las coordenadas sean correctas (dentro de España), (3) Revisa que la velocidad calculada no exceda 160 km/h (se descartan segmentos).'
        },
        examples: [
            'Ejemplo: Si un vehículo tiene 3 puntos GPS: A(40.4168, -3.7038), B(40.4170, -3.7040), C(40.4172, -3.7042), se calcula haversine(A→B) + haversine(B→C).',
            'Si hay un salto GPS de 500m en 5s, ese segmento se descarta por exceder el límite de velocidad razonable.'
        ]
    },
    {
        id: 'clave-1',
        name: 'Tiempo en Parque (Clave 1)',
        description: 'Tiempo total que el vehículo ha estado dentro de una geocerca de tipo "parque" con el rotativo apagado.',
        calculation: 'Se calcula sumando la duración de todos los segmentos operacionales con clave = 1. Un segmento tiene clave 1 cuando: (1) El vehículo está dentro de una geocerca de tipo "parque", (2) El rotativo está apagado (state = 0), (3) La velocidad es < 5 km/h. Los segmentos se generan automáticamente durante el procesamiento de archivos.',
        formula: 'tiempo_parque = Σ(duration_seconds) de OperationalStateSegment WHERE clave = 1',
        dataSource: 'OperationalStateSegment (tabla de segmentos operacionales)',
        troubleshooting: {
            zeroValue: 'Si sale 0, verifica: (1) Que existan geocercas de tipo "parque" configuradas y válidas (coordenadas correctas, polígono cerrado), (2) Que el vehículo haya estado dentro de alguna geocerca de parque, (3) Que el rotativo esté apagado durante ese tiempo, (4) Que la velocidad sea < 5 km/h. Si no hay geocercas configuradas, este KPI siempre será 0.',
            incorrectValue: 'Si el valor parece incorrecto: (1) Verifica que las geocercas de parque estén correctamente configuradas (polígonos válidos), (2) Comprueba que las geocercas no estén duplicadas o inválidas (revisa en Administración > Geocercas), (3) Revisa que los segmentos operacionales se hayan generado correctamente durante el procesamiento.'
        },
        examples: [
            'Ejemplo: Si un vehículo está dentro de la geocerca "Parque Rozas" durante 2 horas con rotativo apagado y velocidad < 5 km/h, se generará un segmento con clave = 1 de 7200 segundos.',
            'Si el vehículo está en el parque pero con rotativo encendido, se clasificará como Clave 2 (Salida en Emergencia) en lugar de Clave 1.'
        ]
    },
    {
        id: 'clave-0',
        name: 'Tiempo en Taller (Clave 0)',
        description: 'Tiempo total que el vehículo ha estado en el taller (dentro de una geocerca de tipo "taller" o con velocidad = 0 durante períodos prolongados).',
        calculation: 'Se calcula sumando la duración de todos los segmentos operacionales con clave = 0. Un segmento tiene clave 0 cuando: (1) El vehículo está dentro de una geocerca de tipo "taller", O (2) El vehículo está parado (velocidad = 0) durante más de 30 minutos consecutivos dentro de una geocerca de parque.',
        formula: 'tiempo_taller = Σ(duration_seconds) de OperationalStateSegment WHERE clave = 0',
        dataSource: 'OperationalStateSegment (tabla de segmentos operacionales)',
        troubleshooting: {
            zeroValue: 'Si sale 0, verifica: (1) Que existan geocercas de tipo "taller" configuradas, (2) Que el vehículo haya estado dentro de alguna geocerca de taller, (3) Que haya períodos de parada prolongada (>30 min) dentro del parque. Si no hay geocercas de taller configuradas, este KPI puede ser 0 incluso si el vehículo está en mantenimiento.',
            incorrectValue: 'Si el valor parece incorrecto: (1) Verifica que las geocercas de taller estén correctamente configuradas, (2) Comprueba que los períodos de parada se detecten correctamente (velocidad = 0 durante >30 min).'
        },
        examples: [
            'Ejemplo: Si un vehículo está dentro de la geocerca "Taller Central" durante 4 horas, se generará un segmento con clave = 0 de 14400 segundos.',
            'Si un vehículo está parado dentro del parque durante 45 minutos consecutivos, también se clasificará como Clave 0.'
        ]
    },
    {
        id: 'clave-2',
        name: 'Salida en Emergencia (Clave 2)',
        description: 'Tiempo total que el vehículo ha estado fuera del parque con el rotativo encendido (en servicio de emergencia).',
        calculation: 'Se calcula sumando la duración de todos los segmentos operacionales con clave = 2. Un segmento tiene clave 2 cuando: (1) El vehículo está fuera de cualquier geocerca de parque, (2) El rotativo está encendido (state = 1 o 2), (3) La velocidad es > 5 km/h.',
        formula: 'tiempo_emergencia = Σ(duration_seconds) de OperationalStateSegment WHERE clave = 2',
        dataSource: 'OperationalStateSegment (tabla de segmentos operacionales)',
        troubleshooting: {
            zeroValue: 'Si sale 0, verifica: (1) Que haya mediciones de rotativo (RotativoMeasurement) con state = 1 o 2, (2) Que el vehículo haya salido del parque (no esté dentro de ninguna geocerca de parque), (3) Que la velocidad sea > 5 km/h. Si el vehículo nunca sale del parque o el rotativo nunca se enciende, este KPI será 0.',
            incorrectValue: 'Si el valor parece incorrecto: (1) Verifica que las mediciones de rotativo sean correctas (state = 1 o 2 para encendido), (2) Comprueba que las geocercas de parque estén correctamente configuradas para detectar salidas, (3) Revisa que los segmentos operacionales se generen correctamente.'
        },
        examples: [
            'Ejemplo: Si un vehículo sale del parque con rotativo encendido y recorre 50 km en 1 hora, se generará un segmento con clave = 2 de 3600 segundos.',
            'Si el vehículo está fuera del parque pero con rotativo apagado, se clasificará como Clave 5 (Regreso al Parque) o Clave 3 (En Siniestro) según las condiciones.'
        ]
    },
    {
        id: 'clave-3',
        name: 'En Siniestro (Clave 3)',
        description: 'Tiempo total que el vehículo ha estado parado fuera del parque durante más de 5 minutos consecutivos (posible siniestro o emergencia).',
        calculation: 'Se calcula sumando la duración de todos los segmentos operacionales con clave = 3. Un segmento tiene clave 3 cuando: (1) El vehículo está fuera de cualquier geocerca de parque, (2) El vehículo está parado (velocidad < 1 km/h) durante más de 5 minutos consecutivos.',
        formula: 'tiempo_siniestro = Σ(duration_seconds) de OperationalStateSegment WHERE clave = 3',
        dataSource: 'OperationalStateSegment (tabla de segmentos operacionales)',
        troubleshooting: {
            zeroValue: 'Si sale 0, verifica: (1) Que el vehículo haya estado fuera del parque, (2) Que haya períodos de parada prolongada (>5 min) fuera del parque. Si el vehículo siempre está en movimiento o dentro del parque, este KPI será 0.',
            incorrectValue: 'Si el valor parece incorrecto: (1) Verifica que la detección de parada funcione correctamente (velocidad < 1 km/h), (2) Comprueba que el umbral de 5 minutos se aplique correctamente, (3) Revisa que los segmentos operacionales se generen correctamente.'
        },
        examples: [
            'Ejemplo: Si un vehículo está parado fuera del parque durante 10 minutos consecutivos, se generará un segmento con clave = 3 de 600 segundos.',
            'Si el vehículo está parado solo 3 minutos, no se generará un segmento Clave 3 (el umbral es 5 minutos).'
        ]
    },
    {
        id: 'clave-5',
        name: 'Regreso al Parque (Clave 5)',
        description: 'Tiempo total que el vehículo ha estado regresando al parque (fuera del parque, rotativo apagado, velocidad > 5 km/h, y acercándose a una geocerca de parque).',
        calculation: 'Se calcula sumando la duración de todos los segmentos operacionales con clave = 5. Un segmento tiene clave 5 cuando: (1) El vehículo está fuera de cualquier geocerca de parque, (2) El rotativo está apagado (state = 0), (3) La velocidad es > 5 km/h, (4) El vehículo se está acercando a una geocerca de parque (distancia decreciente).',
        formula: 'tiempo_regreso = Σ(duration_seconds) de OperationalStateSegment WHERE clave = 5',
        dataSource: 'OperationalStateSegment (tabla de segmentos operacionales)',
        troubleshooting: {
            zeroValue: 'Si sale 0, verifica: (1) Que el vehículo haya salido del parque previamente, (2) Que el rotativo esté apagado durante el regreso, (3) Que la velocidad sea > 5 km/h, (4) Que el vehículo se esté acercando a una geocerca de parque. Si el vehículo siempre está en el parque o el rotativo siempre está encendido, este KPI será 0.',
            incorrectValue: 'Si el valor parece incorrecto: (1) Verifica que la detección de acercamiento al parque funcione correctamente, (2) Comprueba que las geocercas de parque estén correctamente configuradas, (3) Revisa que los segmentos operacionales se generen correctamente.'
        },
        examples: [
            'Ejemplo: Si un vehículo sale del parque, realiza un servicio, y luego regresa al parque con rotativo apagado durante 20 minutos, se generará un segmento con clave = 5 de 1200 segundos.',
            'Si el vehículo regresa con rotativo encendido, se clasificará como Clave 2 (Salida en Emergencia) en lugar de Clave 5.'
        ]
    },
    {
        id: 'rotativo-percentage',
        name: '% Rotativo',
        description: 'Porcentaje de tiempo que el rotativo ha estado encendido respecto al tiempo total fuera del parque.',
        calculation: 'Se calcula dividiendo el tiempo total con rotativo encendido (clave 2 + clave 5 con rotativo ON) entre el tiempo total fuera del parque (clave 2 + clave 3 + clave 5), multiplicado por 100. Si no hay tiempo fuera del parque, el porcentaje es 0.',
        formula: '%_rotativo = (tiempo_rotativo_ON / tiempo_fuera_parque) * 100',
        dataSource: 'OperationalStateSegment (tabla de segmentos operacionales) + RotativoMeasurement',
        troubleshooting: {
            zeroValue: 'Si sale 0, verifica: (1) Que haya mediciones de rotativo (RotativoMeasurement) con state = 1 o 2, (2) Que el vehículo haya salido del parque (tiempo fuera del parque > 0), (3) Que los segmentos operacionales se hayan generado correctamente. Si el vehículo nunca sale del parque, este KPI será 0.',
            incorrectValue: 'Si el valor parece incorrecto: (1) Verifica que las mediciones de rotativo sean correctas (state = 1 o 2 para encendido), (2) Comprueba que el tiempo fuera del parque se calcule correctamente, (3) Revisa que los segmentos operacionales se generen correctamente.'
        },
        examples: [
            'Ejemplo: Si un vehículo está fuera del parque durante 10 horas y el rotativo está encendido durante 6 horas, entonces %_rotativo = (6 / 10) * 100 = 60%.',
            'Si el vehículo nunca sale del parque, el porcentaje será 0% (división por cero).'
        ]
    },
    {
        id: 'average-speed',
        name: 'Velocidad Promedio',
        description: 'Velocidad promedio del vehículo durante el tiempo de conducción, calculada como distancia total dividida entre tiempo de conducción.',
        calculation: 'Se calcula dividiendo los kilómetros totales recorridos entre las horas de conducción. Si no hay tiempo de conducción o distancia, la velocidad promedio es 0. Solo se consideran segmentos con velocidad válida (1-160 km/h).',
        formula: 'velocidad_promedio = km_total / (driving_hours)',
        dataSource: 'GpsMeasurement (calculado a partir de distancia y tiempo)',
        troubleshooting: {
            zeroValue: 'Si sale 0, verifica: (1) Que haya kilómetros recorridos > 0, (2) Que haya horas de conducción > 0, (3) Que los puntos GPS sean válidos y permitan calcular distancia. Si no hay GPS o no hay movimiento, la velocidad promedio será 0.',
            incorrectValue: 'Si el valor parece incorrecto: (1) Verifica que los kilómetros recorridos se calculen correctamente (fórmula Haversine), (2) Comprueba que las horas de conducción se calculen correctamente, (3) Revisa que no haya saltos GPS grandes que distorsionen el cálculo.'
        },
        examples: [
            'Ejemplo: Si un vehículo recorre 100 km en 2 horas de conducción, entonces velocidad_promedio = 100 / 2 = 50 km/h.',
            'Si el vehículo está parado (0 km en 0 horas), la velocidad promedio será 0.'
        ]
    },
    {
        id: 'incidents-total',
        name: 'Total Incidencias',
        description: 'Número total de eventos de estabilidad detectados (eventos con SI < 0.50).',
        calculation: 'Se cuenta el número total de eventos en la tabla stability_events que tienen un índice de estabilidad (SI) < 0.50. Los eventos se deduplican por sesión, tipo y bucket de 10 segundos para evitar contar el mismo evento múltiples veces.',
        formula: 'total_incidencias = COUNT(*) de stability_events WHERE SI < 0.50 (deduplicado)',
        dataSource: 'stability_events (tabla de eventos de estabilidad)',
        troubleshooting: {
            zeroValue: 'Si sale 0, verifica: (1) Que haya mediciones de estabilidad (StabilityMeasurement) con SI < 0.50, (2) Que los eventos se hayan generado correctamente durante el procesamiento, (3) Que el rango de fechas incluya sesiones con eventos. Si no hay eventos de estabilidad, este KPI será 0.',
            incorrectValue: 'Si el valor parece incorrecto: (1) Verifica que los eventos se deduplicen correctamente (bucket de 10 segundos), (2) Comprueba que el umbral de SI < 0.50 se aplique correctamente, (3) Revisa que los eventos se generen durante el procesamiento de archivos.'
        },
        examples: [
            'Ejemplo: Si un vehículo tiene 5 eventos con SI = 0.15, 0.25, 0.30, 0.40 y 0.45, entonces total_incidencias = 5.',
            'Si un vehículo tiene eventos con SI = 0.60, 0.70, 0.80, estos NO se cuentan como incidencias (SI ≥ 0.50).'
        ]
    },
    {
        id: 'incidents-critical',
        name: 'Incidencias Graves',
        description: 'Número de eventos de estabilidad con severidad GRAVE (SI < 0.20).',
        calculation: 'Se cuenta el número de eventos en stability_events que tienen SI < 0.20. Estos eventos representan pérdida crítica de estabilidad o riesgo inminente de vuelco.',
        formula: 'incidencias_graves = COUNT(*) de stability_events WHERE SI < 0.20',
        dataSource: 'stability_events (tabla de eventos de estabilidad)',
        troubleshooting: {
            zeroValue: 'Si sale 0, verifica: (1) Que haya eventos con SI < 0.20, (2) Que los eventos se hayan generado correctamente durante el procesamiento, (3) Que el rango de fechas incluya sesiones con eventos graves. Si no hay eventos graves, este KPI será 0 (lo cual es bueno).',
            incorrectValue: 'Si el valor parece incorrecto: (1) Verifica que la clasificación de severidad se aplique correctamente (SI < 0.20 = GRAVE), (2) Comprueba que los eventos se deduplicen correctamente, (3) Revisa que los eventos se generen durante el procesamiento.'
        },
        examples: [
            'Ejemplo: Si un vehículo tiene 3 eventos con SI = 0.10, 0.15 y 0.18, entonces incidencias_graves = 3.',
            'Si un vehículo tiene eventos con SI = 0.25, 0.30, estos NO se cuentan como graves (SI ≥ 0.20).'
        ]
    },
    {
        id: 'incidents-moderate',
        name: 'Incidencias Moderadas',
        description: 'Número de eventos de estabilidad con severidad MODERADA (0.20 ≤ SI < 0.35).',
        calculation: 'Se cuenta el número de eventos en stability_events que tienen 0.20 ≤ SI < 0.35. Estos eventos representan pérdida moderada de estabilidad o deslizamiento controlable.',
        formula: 'incidencias_moderadas = COUNT(*) de stability_events WHERE 0.20 ≤ SI < 0.35',
        dataSource: 'stability_events (tabla de eventos de estabilidad)',
        troubleshooting: {
            zeroValue: 'Si sale 0, verifica: (1) Que haya eventos con 0.20 ≤ SI < 0.35, (2) Que los eventos se hayan generado correctamente durante el procesamiento, (3) Que el rango de fechas incluya sesiones con eventos moderados. Si no hay eventos moderados, este KPI será 0.',
            incorrectValue: 'Si el valor parece incorrecto: (1) Verifica que la clasificación de severidad se aplique correctamente (0.20 ≤ SI < 0.35 = MODERADA), (2) Comprueba que los eventos se deduplicen correctamente, (3) Revisa que los eventos se generen durante el procesamiento.'
        },
        examples: [
            'Ejemplo: Si un vehículo tiene 4 eventos con SI = 0.22, 0.25, 0.30 y 0.33, entonces incidencias_moderadas = 4.',
            'Si un vehículo tiene eventos con SI = 0.15 (GRAVE) o SI = 0.40 (LEVE), estos NO se cuentan como moderados.'
        ]
    },
    {
        id: 'incidents-light',
        name: 'Incidencias Leves',
        description: 'Número de eventos de estabilidad con severidad LEVE (0.35 ≤ SI < 0.50).',
        calculation: 'Se cuenta el número de eventos en stability_events que tienen 0.35 ≤ SI < 0.50. Estos eventos representan pérdida leve de estabilidad o maniobra exigida pero estable.',
        formula: 'incidencias_leves = COUNT(*) de stability_events WHERE 0.35 ≤ SI < 0.50',
        dataSource: 'stability_events (tabla de eventos de estabilidad)',
        troubleshooting: {
            zeroValue: 'Si sale 0, verifica: (1) Que haya eventos con 0.35 ≤ SI < 0.50, (2) Que los eventos se hayan generado correctamente durante el procesamiento, (3) Que el rango de fechas incluya sesiones con eventos leves. Si no hay eventos leves, este KPI será 0.',
            incorrectValue: 'Si el valor parece incorrecto: (1) Verifica que la clasificación de severidad se aplique correctamente (0.35 ≤ SI < 0.50 = LEVE), (2) Comprueba que los eventos se deduplicen correctamente, (3) Revisa que los eventos se generen durante el procesamiento.'
        },
        examples: [
            'Ejemplo: Si un vehículo tiene 6 eventos con SI = 0.36, 0.40, 0.42, 0.45, 0.48 y 0.49, entonces incidencias_leves = 6.',
            'Si un vehículo tiene eventos con SI = 0.30 (MODERADA) o SI = 0.60 (sin evento), estos NO se cuentan como leves.'
        ]
    },
    {
        id: 'stability-index',
        name: 'Índice de Estabilidad (SI)',
        description: 'Índice de estabilidad promedio calculado a partir de todos los eventos de estabilidad. Valores más bajos indican menor estabilidad.',
        calculation: 'Se calcula como el promedio del SI de todos los eventos de estabilidad (SI < 0.50). Si no hay eventos, el SI es 1.0 (estabilidad perfecta). El SI se normaliza siempre al rango [0, 1].',
        formula: 'SI_promedio = AVG(SI) de stability_events WHERE SI < 0.50',
        dataSource: 'stability_events (tabla de eventos de estabilidad)',
        troubleshooting: {
            zeroValue: 'El SI nunca debería ser exactamente 0. Si sale 0, verifica: (1) Que haya eventos de estabilidad, (2) Que los eventos tengan valores de SI válidos, (3) Que el cálculo del promedio funcione correctamente. Si no hay eventos, el SI debería ser 1.0, no 0.',
            incorrectValue: 'Si el valor parece incorrecto: (1) Verifica que el SI se normalice correctamente al rango [0, 1], (2) Comprueba que solo se consideren eventos con SI < 0.50, (3) Revisa que el cálculo del promedio funcione correctamente.'
        },
        examples: [
            'Ejemplo: Si un vehículo tiene 3 eventos con SI = 0.15, 0.25 y 0.35, entonces SI_promedio = (0.15 + 0.25 + 0.35) / 3 = 0.25.',
            'Si un vehículo no tiene eventos (SI ≥ 0.50 en todas las mediciones), el SI promedio es 1.0 (estabilidad perfecta).'
        ]
    }
];

export const KPIDocumentationTab: React.FC = () => {
    const { filters } = useGlobalFilters();
    const {
        loading,
        error,
        activity,
        states,
        stability,
        quality,
        getStateByKey
    } = useKPIs();
    const [searchTerm, setSearchTerm] = useState('');

    const filterSummary = useMemo(() => {
        const dateRange = filters.dateRange?.start
            ? `${filters.dateRange.start} → ${filters.dateRange?.end || filters.dateRange.start}`
            : 'Todo el histórico';
        const vehicles = filters.vehicles && filters.vehicles.length > 0
            ? `${filters.vehicles.length} vehículo(s) seleccionado(s)`
            : 'Todos los vehículos';
        const severity = filters.severity && filters.severity.length > 0
            ? filters.severity.join(', ')
            : 'Todas las severidades';
        const rotativo = filters.rotativo && filters.rotativo !== 'all'
            ? filters.rotativo.toUpperCase()
            : 'Todos';
        return { dateRange, vehicles, severity, rotativo };
    }, [filters]);

    const integerFormatter = useMemo(() => new Intl.NumberFormat('es-ES'), []);
    const decimalFormatter = useMemo(
        () => new Intl.NumberFormat('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
        []
    );
    const decimalFormatterTwo = useMemo(
        () => new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        []
    );

    const secondsToHHMMSS = useCallback((seconds: number) => {
        const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
        const hours = Math.floor(safeSeconds / 3600);
        const minutes = Math.floor((safeSeconds % 3600) / 60);
        const secs = safeSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs
            .toString()
            .padStart(2, '0')}`;
    }, []);

    const formatDuration = useCallback(
        (formatted?: string, seconds?: number) => formatted || secondsToHHMMSS(seconds ?? 0),
        [secondsToHHMMSS]
    );

    const safeState = useCallback(
        (key: number) => (typeof getStateByKey === 'function' ? getStateByKey(key) : null),
        [getStateByKey]
    );

    const totalSegments = useMemo(
        () => states?.states?.reduce((sum, item) => sum + (item.count || 0), 0) ?? 0,
        [states?.states]
    );

    const getComputedData = useCallback(
        (id: string): KPIComputedData | null => {
            switch (id) {
                case 'driving-hours': {
                    const drivingFormatted =
                        activity?.driving_hours_formatted ||
                        secondsToHHMMSS(Math.round((activity?.driving_hours ?? 0) * 3600));
                    const hoursNumeric = activity?.driving_hours ?? 0;
                    const kmNumeric = activity?.km_total ?? 0;
                    const totalTime = states?.total_time_seconds ?? 0;
                    const issues: string[] = [];
                    let status: KPIStatus = 'ok';
                    let statusLabel = 'Valor coherente';

                    if (hoursNumeric <= 0 && (kmNumeric > 0 || totalTime > 0)) {
                        status = kmNumeric > 0 ? 'critical' : 'warning';
                        statusLabel =
                            kmNumeric > 0
                                ? 'Horas de conducción = 0 pero hay kilómetros recorridos'
                                : 'No se detectaron segmentos de conducción';
                        issues.push(
                            'Revisar que los puntos GPS estén llegando con velocidad > 1 km/h.',
                            'Verificar que no haya demasiados huecos entre puntos (máximo 90 s).',
                            'Ejecutar `/api/kpis/summary?force=true` para recalcular sesiones si los datos son recientes.'
                        );
                    }

                    return {
                        primaryLabel: 'Horas de conducción registradas en el período filtrado',
                        primaryValue: drivingFormatted,
                        status,
                        statusLabel,
                        actions: issues,
                        breakdown: [
                            { label: 'Horas (decimal)', value: `${decimalFormatterTwo.format(activity?.driving_hours ?? 0)} h` },
                            { label: 'Kilómetros validados', value: `${decimalFormatter.format(activity?.km_total ?? 0)} km` },
                            {
                                label: 'Tiempo fuera de parque',
                                value: formatDuration(states?.time_outside_formatted, states?.time_outside_station)
                            }
                        ]
                    };
                }
                case 'kilometers': {
                    const km = activity?.km_total ?? 0;
                    const hoursNumeric = activity?.driving_hours ?? 0;
                    const timeOutside = states?.time_outside_station ?? 0;
                    let status: KPIStatus = 'ok';
                    let statusLabel = 'Valor coherente';
                    const actions: string[] = [];

                    if (km <= 0 && (hoursNumeric > 0 || timeOutside > 0)) {
                        status = 'warning';
                        statusLabel = 'Kilómetros = 0 pero hay tiempo fuera del parque';
                        actions.push(
                            'Verificar cobertura GPS (≥4 satélites) y que los puntos estén dentro de España.',
                            'Revisar que los archivos procesados contengan `GpsMeasurement` (tabla no vacía).',
                            'Si los datos son nuevos, reintentar con `/api/kpis/summary?force=true`.'
                        );
                    }

                    return {
                        primaryLabel: 'Kilómetros recorridos con GPS válido (Haversine)',
                        primaryValue: `${decimalFormatter.format(km)} km`,
                        status,
                        statusLabel,
                        actions,
                        breakdown: [
                            {
                                label: 'Horas de conducción',
                                value:
                                    activity?.driving_hours_formatted ||
                                    secondsToHHMMSS(Math.round((activity?.driving_hours ?? 0) * 3600))
                            },
                            {
                                label: 'Segmentos procesados',
                                value: integerFormatter.format(totalSegments)
                            },
                            {
                                label: 'Tiempo rotativo ON',
                                value: formatDuration(activity?.rotativo_on_formatted, activity?.rotativo_on_seconds)
                            }
                        ]
                    };
                }
                case 'clave-0': {
                    const state = safeState(0);
                    const totalTime = states?.total_time_seconds ?? 0;
                    let status: KPIStatus = 'ok';
                    let statusLabel = 'Valor coherente';
                    const actions: string[] = [];

                    if ((state?.duration_seconds ?? 0) === 0 && totalTime > 0) {
                        status = 'warning';
                        statusLabel = 'Sin tiempo detectado en taller (clave 0)';
                        actions.push(
                            'Revisar que existan geocercas de tipo "taller" y estén activas.',
                            'Verificar si el vehículo permanece parado >30 min dentro del parque (segmentos de mantenimiento).',
                            'Confirmar que `operational_state_segments` se generaron correctamente.'
                        );
                    }

                    return {
                        primaryLabel: 'Tiempo en taller (Clave 0)',
                        primaryValue: formatDuration(state?.duration_formatted, state?.duration_seconds),
                        status,
                        statusLabel,
                        actions,
                        breakdown: [
                            { label: 'Segmentos detectados', value: integerFormatter.format(state?.count ?? 0) },
                            { label: 'Segundos acumulados', value: integerFormatter.format(state?.duration_seconds ?? 0) }
                        ]
                    };
                }
                case 'clave-1': {
                    const state = safeState(1);
                    const totalTime = states?.total_time_seconds ?? 0;
                    let status: KPIStatus = 'ok';
                    let statusLabel = 'Valor coherente';
                    const actions: string[] = [];

                    if ((state?.duration_seconds ?? 0) === 0 && totalTime > 0) {
                        status = 'critical';
                        statusLabel = 'Tiempo en parque (clave 1) = 0';
                        actions.push(
                            'Validar que existan geocercas de parque bien definidas (polígono cerrado).',
                            'Confirmar que el vehículo entra en la geocerca de parque (revisar `/api/geofences/diagnostics`).',
                            'Reprocesar la sesión con `iniciar.ps1` para regenerar `operational_state_segments`.'
                        );
                    }

                    return {
                        primaryLabel: 'Tiempo en parque con rotativo OFF (Clave 1)',
                        primaryValue: formatDuration(state?.duration_formatted, state?.duration_seconds),
                        status,
                        statusLabel,
                        actions,
                        breakdown: [
                            { label: 'Segmentos detectados', value: integerFormatter.format(state?.count ?? 0) },
                            { label: 'Segundos acumulados', value: integerFormatter.format(state?.duration_seconds ?? 0) }
                        ]
                    };
                }
                case 'clave-2': {
                    const state = safeState(2);
                    const rotativoSeconds = activity?.rotativo_on_seconds ?? 0;
                    let status: KPIStatus = 'ok';
                    let statusLabel = 'Valor coherente';
                    const actions: string[] = [];

                    if ((state?.duration_seconds ?? 0) === 0 && rotativoSeconds > 0) {
                        status = 'warning';
                        statusLabel = 'Rotativo ON detectado pero clave 2 = 0';
                        actions.push(
                            'Revisar mediciones de rotativo (`rotativoMeasurement`) y que se estén clasificando correctamente.',
                            'Verificar si la unidad sale realmente del parque (geocercas actualizadas).',
                            'Forzar recalculo de claves con `/api/kpis/summary?force=true`.'
                        );
                    }

                    return {
                        primaryLabel: 'Tiempo en emergencia con rotativo ON (Clave 2)',
                        primaryValue: formatDuration(state?.duration_formatted, state?.duration_seconds),
                        status,
                        statusLabel,
                        actions,
                        breakdown: [
                            { label: 'Segmentos detectados', value: integerFormatter.format(state?.count ?? 0) },
                            { label: 'Segundos acumulados', value: integerFormatter.format(state?.duration_seconds ?? 0) },
                            { label: 'Salidas registradas', value: integerFormatter.format(activity?.emergency_departures ?? 0) }
                        ]
                    };
                }
                case 'clave-3': {
                    const state = safeState(3);
                    let status: KPIStatus = 'ok';
                    let statusLabel = 'Valor coherente';
                    const actions: string[] = [];

                    if ((state?.duration_seconds ?? 0) === 0 && (states?.time_outside_station ?? 0) > 0) {
                        status = 'warning';
                        statusLabel = 'No se detectaron paradas largas fuera del parque';
                        actions.push(
                            'Verificar que el umbral de parada (velocidad < 1 km/h) se cumpla en los datos GPS.',
                            'Confirmar que el vehículo estuvo realmente fuera del parque (geocercas).'
                        );
                    }

                    return {
                        primaryLabel: 'Tiempo en siniestro parado fuera del parque (Clave 3)',
                        primaryValue: formatDuration(state?.duration_formatted, state?.duration_seconds),
                        status,
                        statusLabel,
                        actions,
                        breakdown: [
                            { label: 'Segmentos detectados', value: integerFormatter.format(state?.count ?? 0) },
                            { label: 'Segundos acumulados', value: integerFormatter.format(state?.duration_seconds ?? 0) }
                        ]
                    };
                }
                case 'clave-5': {
                    const state = safeState(5);
                    let status: KPIStatus = 'ok';
                    let statusLabel = 'Valor coherente';
                    const actions: string[] = [];

                    if ((state?.duration_seconds ?? 0) === 0 && (states?.time_outside_station ?? 0) > 0) {
                        status = 'warning';
                        statusLabel = 'No se detectaron regresos al parque (clave 5)';
                        actions.push(
                            'Revisar que el rotativo esté apagado en los datos al volver al parque.',
                            'Verificar el cálculo de distancia al parque (geocercas actualizadas).'
                        );
                    }

                    return {
                        primaryLabel: 'Tiempo de regreso al parque (Clave 5)',
                        primaryValue: formatDuration(state?.duration_formatted, state?.duration_seconds),
                        status,
                        statusLabel,
                        actions,
                        breakdown: [
                            { label: 'Segmentos detectados', value: integerFormatter.format(state?.count ?? 0) },
                            { label: 'Segundos acumulados', value: integerFormatter.format(state?.duration_seconds ?? 0) }
                        ]
                    };
                }
                case 'rotativo-percentage': {
                    const percentage = activity?.rotativo_on_percentage ?? 0;
                    const rotativoSeconds = activity?.rotativo_on_seconds ?? 0;
                    const timeOutside = states?.time_outside_station ?? 0;
                    let status: KPIStatus = 'ok';
                    let statusLabel = 'Valor coherente';
                    const actions: string[] = [];

                    if (percentage <= 0 && rotativoSeconds > 0) {
                        status = 'warning';
                        statusLabel = 'Rotativo con segundos ON pero porcentaje = 0';
                        actions.push(
                            'Revisar que las muestras ON/OFF del rotativo tengan estado correcto (`1` o `2`).',
                            'Verificar tiempo total fuera del parque: si es 0, el porcentaje se fuerza a 0.'
                        );
                    }

                    if (rotativoSeconds <= 0 && timeOutside > 0 && percentage > 0) {
                        status = 'warning';
                        statusLabel = 'Porcentaje > 0 pero no se registraron segundos ON';
                        actions.push(
                            'Forzar recalculo de actividad (`/api/kpis/summary?force=true`).',
                            'Validar integridad de `rotativoMeasurement` durante las salidas.'
                        );
                    }

                    return {
                        primaryLabel: 'Porcentaje de tiempo con rotativo encendido',
                        primaryValue: `${decimalFormatter.format(percentage)} %`,
                        status,
                        statusLabel,
                        actions,
                        breakdown: [
                            {
                                label: 'Tiempo con rotativo ON',
                                value: formatDuration(activity?.rotativo_on_formatted, activity?.rotativo_on_seconds)
                            },
                            {
                                label: 'Tiempo fuera de parque',
                                value: formatDuration(states?.time_outside_formatted, states?.time_outside_station)
                            },
                            { label: 'Salidas en emergencia', value: integerFormatter.format(activity?.emergency_departures ?? 0) }
                        ]
                    };
                }
                case 'average-speed': {
                    const km = activity?.km_total ?? 0;
                    const hours = activity?.driving_hours ?? 0;
                    const average = hours > 0 ? km / hours : 0;
                    let status: KPIStatus = 'ok';
                    let statusLabel = 'Valor coherente';
                    const actions: string[] = [];

                    if (average <= 0 && km > 0 && hours > 0) {
                        status = 'warning';
                        statusLabel = 'Velocidad promedio = 0 pese a tener km y horas';
                        actions.push(
                            'Verificar formato de `km_total` (debe venir en km, no en metros).',
                            'Revisar `driving_hours` decimal: si es muy pequeño, aplicar saneo de datos GPS.'
                        );
                    }

                    return {
                        primaryLabel: 'Velocidad promedio saneada (km/h)',
                        primaryValue: `${decimalFormatter.format(average)} km/h`,
                        status,
                        statusLabel,
                        actions,
                        breakdown: [
                            { label: 'Kilómetros validados', value: `${decimalFormatter.format(km)} km` },
                            { label: 'Horas de conducción', value: `${decimalFormatterTwo.format(hours)} h` },
                            { label: 'Emergencias registradas', value: integerFormatter.format(activity?.emergency_departures ?? 0) }
                        ],
                        observations: ['Solo se consideran segmentos con velocidad entre 1 y 160 km/h y GPS válido.']
                    };
                }
                case 'incidents-total': {
                    const total = stability?.total_incidents ?? 0;
                    let status: KPIStatus = 'ok';
                    let statusLabel = 'Sin incidencias registradas';
                    if (total > 0) {
                        statusLabel = 'Incidencias detectadas';
                    }
                    return {
                        primaryLabel: 'Incidencias de estabilidad (SI < 0.50)',
                        primaryValue: integerFormatter.format(total),
                        status,
                        statusLabel,
                        breakdown: [
                            { label: 'Graves (SI < 0.20)', value: integerFormatter.format(stability?.critical ?? 0) },
                            { label: 'Moderadas (0.20 ≤ SI < 0.35)', value: integerFormatter.format(stability?.moderate ?? 0) },
                            { label: 'Leves (0.35 ≤ SI < 0.50)', value: integerFormatter.format(stability?.light ?? 0) }
                        ],
                        observations: ['Eventos deduplicados agrupando en ventanas de 10 segundos por sesión y tipo.']
                    };
                }
                case 'incidents-critical': {
                    const critical = stability?.critical ?? 0;
                    let status: KPIStatus = 'ok';
                    let statusLabel = 'Sin incidencias graves';
                    if (critical > 0) {
                        statusLabel = 'Incidencias graves presentes';
                    }
                    return {
                        primaryLabel: 'Incidencias graves (SI < 0.20)',
                        primaryValue: integerFormatter.format(critical),
                        status,
                        statusLabel,
                        breakdown: [
                            { label: 'Total incidencias', value: integerFormatter.format(stability?.total_incidents ?? 0) },
                            {
                                label: 'Eventos detallados',
                                value: integerFormatter.format(stability?.eventos_detallados?.critical?.length ?? 0)
                            }
                        ],
                        observations: ['Corresponden a riesgo extremo o vuelco inminente.']
                    };
                }
                case 'incidents-moderate': {
                    const moderate = stability?.moderate ?? 0;
                    let status: KPIStatus = 'ok';
                    let statusLabel = 'Sin incidencias moderadas';
                    if (moderate > 0) {
                        statusLabel = 'Incidencias moderadas presentes';
                    }
                    return {
                        primaryLabel: 'Incidencias moderadas (0.20 ≤ SI < 0.35)',
                        primaryValue: integerFormatter.format(moderate),
                        status,
                        statusLabel,
                        breakdown: [
                            { label: 'Total incidencias', value: integerFormatter.format(stability?.total_incidents ?? 0) },
                            {
                                label: 'Eventos detallados',
                                value: integerFormatter.format(stability?.eventos_detallados?.moderate?.length ?? 0)
                            }
                        ],
                        observations: ['Indican pérdida moderada de estabilidad (deslizamiento controlable).']
                    };
                }
                case 'incidents-light': {
                    const light = stability?.light ?? 0;
                    let status: KPIStatus = 'ok';
                    let statusLabel = 'Sin incidencias leves';
                    if (light > 0) {
                        statusLabel = 'Incidencias leves presentes';
                    }
                    return {
                        primaryLabel: 'Incidencias leves (0.35 ≤ SI < 0.50)',
                        primaryValue: integerFormatter.format(light),
                        status,
                        statusLabel,
                        breakdown: [
                            { label: 'Total incidencias', value: integerFormatter.format(stability?.total_incidents ?? 0) },
                            {
                                label: 'Eventos detallados',
                                value: integerFormatter.format(stability?.eventos_detallados?.light?.length ?? 0)
                            }
                        ],
                        observations: ['Advertencias de maniobras exigidas; SI ≥ 0.50 no genera evento.']
                    };
                }
                case 'stability-index': {
                    const indice = quality?.indice_promedio ?? 0;
                    const percent = indice * 100;
                    let status: KPIStatus = 'ok';
                    let statusLabel = 'Calculo disponible';
                    const actions: string[] = [];

                    if (!quality && (stability?.total_incidents ?? 0) > 0) {
                        status = 'warning';
                        statusLabel = 'No se pudo calcular índice de estabilidad';
                        actions.push(
                            'Validar que el backend devuelva `quality` en `/api/kpis/summary`.',
                            'Revisar log de `KPICalculationService` para ver si hubo fallos de normalización.'
                        );
                    }

                    return {
                        primaryLabel: 'Índice de estabilidad promedio (0-100%)',
                        primaryValue: quality
                            ? `${decimalFormatter.format(percent)} %`
                            : 'Sin datos',
                        status,
                        statusLabel,
                        actions,
                        breakdown: [
                            { label: 'Calificación', value: quality?.calificacion ?? 'Sin datos' },
                            { label: 'Estrellas', value: quality?.estrellas ?? 'Sin datos' },
                            {
                                label: 'Eventos evaluados',
                                value: integerFormatter.format(quality?.total_muestras ?? stability?.total_incidents ?? 0)
                            }
                        ],
                        observations: quality
                            ? undefined
                            : ['El backend no devolvió índice de estabilidad para los filtros seleccionados.']
                    };
                }
                default:
                    return null;
            }
        },
        [
            activity,
            decimalFormatter,
            decimalFormatterTwo,
            formatDuration,
            integerFormatter,
            safeState,
            secondsToHHMMSS,
            stability,
            states,
            totalSegments,
            quality
        ]
    );

    const filteredKPIs = useMemo(
        () =>
            kpiDocumentation.filter(
                (kpi) =>
                    kpi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    kpi.description.toLowerCase().includes(searchTerm.toLowerCase())
            ),
        [searchTerm]
    );

    return (
        <div className="h-full w-full bg-white overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <BookOpenIcon className="h-8 w-8 text-blue-600" />
                        <h1 className="text-3xl font-bold text-slate-800">Documentación de KPIs</h1>
                    </div>
                    <p className="text-slate-600">
                        Explicación detallada de cada KPI: qué es, cómo se calcula, y qué hacer si sale 0 o valores incorrectos.
                    </p>
                </div>

                {/* Resumen de filtros */}
                <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rango de fechas</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{filterSummary.dateRange}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vehículos</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{filterSummary.vehicles}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Severidad</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{filterSummary.severity}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rotativo</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{filterSummary.rotativo}</p>
                    </div>
                </div>

                {loading && (
                    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                        Calculando KPIs según los filtros aplicados...
                    </div>
                )}

                        {error && (
                            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Buscar KPI por nombre o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="space-y-10">
                    {filteredKPIs.length === 0 ? (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-10 text-center text-slate-600">
                            No se encontraron KPIs que coincidan con el criterio de búsqueda.
                        </div>
                    ) : (
                        filteredKPIs.map((kpi) => {
                            const sectionData = getComputedData(kpi.id);
                            return (
                                <section key={kpi.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                                    <div className="mb-6">
                                        <h2 className="mb-2 text-2xl font-bold text-slate-800">{kpi.name}</h2>
                                        <p className="text-slate-600">{kpi.description}</p>
                                    </div>

                                    {sectionData ? (
                                        <div className="mb-6">
                                            <div className="mb-3 flex items-center gap-2">
                                                <ChartBarIcon className="h-5 w-5 text-indigo-600" />
                                                <h3 className="text-lg font-semibold text-slate-800">
                                                    Valor con filtros actuales
                                                </h3>
                                            </div>
                                            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                                                <div className="mb-3 flex items-center gap-3">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                            sectionData.status === 'ok'
                                                                ? 'bg-green-100 text-green-800'
                                                                : sectionData.status === 'warning'
                                                                    ? 'bg-amber-100 text-amber-800'
                                                                    : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {sectionData.statusLabel}
                                                    </span>
                                                    {sectionData.status !== 'ok' && (
                                                        <span className="text-xs text-slate-500">Acción requerida</span>
                                                    )}
                                                </div>
                                                <p className="text-3xl font-bold text-indigo-700">{sectionData.primaryValue}</p>
                                                <p className="mt-1 text-sm text-slate-600">{sectionData.primaryLabel}</p>

                                                {sectionData.breakdown && sectionData.breakdown.length > 0 && (
                                                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                                                        {sectionData.breakdown.map((item, index) => (
                                                            <div
                                                                key={`${kpi.id}-detail-${index}`}
                                                                className="rounded-md border border-indigo-100 bg-white/80 p-3"
                                                            >
                                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                                    {item.label}
                                                                </p>
                                                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                                                    {item.value}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {sectionData.observations && sectionData.observations.length > 0 && (
                                                    <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-slate-600">
                                                        {sectionData.observations.map((note, index) => (
                                                            <li key={`${kpi.id}-note-${index}`}>{note}</li>
                                                        ))}
                                                    </ul>
                                                )}

                                                {sectionData.actions && sectionData.actions.length > 0 && (
                                                    <div className="mt-4 rounded-md border border-indigo-200 bg-white/70 p-3">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                                                            Pasos sugeridos
                                                        </p>
                                                        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
                                                            {sectionData.actions.map((action, index) => (
                                                                <li key={`${kpi.id}-action-${index}`}>{action}</li>
                                                            ))}
                                                        </ol>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        !loading && (
                                            <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                                                No hay datos disponibles para los filtros aplicados.
                                            </div>
                                        )
                                    )}

                                    <div className="mb-6">
                                        <div className="mb-3 flex items-center gap-2">
                                            <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                                            <h3 className="text-lg font-semibold text-slate-800">Cómo se calcula</h3>
                                        </div>
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                            <p className="mb-3 text-slate-700">{kpi.calculation}</p>
                                            {kpi.formula && (
                                                <div className="mt-3 border-t border-blue-300 pt-3">
                                                    <p className="rounded border border-blue-200 bg-white p-3 font-mono text-sm text-slate-800">
                                                        {kpi.formula}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <div className="mb-3 flex items-center gap-2">
                                            <InformationCircleIcon className="h-5 w-5 text-green-600" />
                                            <h3 className="text-lg font-semibold text-slate-800">Fuente de datos</h3>
                                        </div>
                                        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                            <p className="text-slate-700">{kpi.dataSource}</p>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <div className="mb-3 flex items-center gap-2">
                                            <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
                                            <h3 className="text-lg font-semibold text-slate-800">Solución de problemas</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                                                <h4 className="mb-2 font-semibold text-orange-800">Si sale 0:</h4>
                                                <p className="text-sm text-slate-700">{kpi.troubleshooting.zeroValue}</p>
                                            </div>
                                            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                                                <h4 className="mb-2 font-semibold text-yellow-800">Si el valor parece incorrecto:</h4>
                                                <p className="text-sm text-slate-700">{kpi.troubleshooting.incorrectValue}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {kpi.examples && kpi.examples.length > 0 && (
                                        <div>
                                            <div className="mb-3 flex items-center gap-2">
                                                <InformationCircleIcon className="h-5 w-5 text-purple-600" />
                                                <h3 className="text-lg font-semibold text-slate-800">Ejemplos</h3>
                                            </div>
                                            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                                                <ul className="space-y-2">
                                                    {kpi.examples.map((example, index) => (
                                                        <li key={`${kpi.id}-example-${index}`} className="text-sm text-slate-700">
                                                            <span className="font-semibold text-purple-800">
                                                                Ejemplo {index + 1}:
                                                            </span>{' '}
                                                            {example}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
