
export interface GPSPoint {
    lat: number;
    lon: number;
    timestamp: Date;
    speed: number; // km/h
    altitude?: number;
    satellites?: number;
    hdop?: number;
}

export interface ValidationResult {
    isValid: boolean;
    reason?: string;
    severity: 'error' | 'warning' | 'info';
}

export interface QualityMetrics {
    totalPoints: number;
    validPoints: number;
    invalidPoints: number;
    errors: {
        noSignal: number; // Primeros puntos sin señal
        impossibleSpeed: number; // Velocidades > 200 km/h
        speedJump: number; // Saltos > 50 km/h en 1 segundo
        positionJump: number; // Saltos > 500m en 1 segundo
        outOfBounds: number; // Fuera de bounding box
        lowAccuracy: number; // HDOP > 5 o satélites < 4
    };
    warnings: {
        highSpeed: number; // 80-200 km/h
        mediumSpeed: number; // 50-80 km/h
        lowAccuracy: number; // HDOP 3-5
    };
    statistics: {
        avgSpeed: number;
        maxSpeed: number;
        avgAccuracy: number;
        totalDistance: number;
        avgDistanceBetweenPoints: number;
    };
}

export class GPSValidationService {
    private readonly MAX_SPEED = 200; // km/h (imposible para bomberos)
    private readonly MAX_SPEED_JUMP = 50; // km/h (cambio brusco)
    private readonly MAX_POSITION_JUMP = 500; // metros (salto espacial)
    private readonly MIN_SATELLITES = 4;
    private readonly MAX_HDOP = 5;
    private readonly WARNING_HDOP = 3;
    private readonly INITIAL_SIGNAL_TIMEOUT = 300; // segundos (5 min sin señal válida)

    /**
     * Valida un punto GPS individual
     */
    validatePoint(
        point: GPSPoint,
        previousPoint?: GPSPoint,
        context?: {
            isFirstValidPoint: boolean;
            initialTimestamp?: Date;
        }
    ): ValidationResult {
        // 1. Validar coordenadas básicas
        if (!point.lat || !point.lon || isNaN(point.lat) || isNaN(point.lon)) {
            return { isValid: false, reason: 'Coordenadas inválidas', severity: 'error' };
        }

        // 2. Validar bounding box (Madrid)
        if (!this.isInMadridBounds(point.lat, point.lon)) {
            return { isValid: false, reason: 'Fuera de límites geográficos', severity: 'error' };
        }

        // 3. Validar precisión (si hay datos)
        if (point.satellites !== undefined && point.satellites < this.MIN_SATELLITES) {
            return { isValid: false, reason: `Pocos satélites (${point.satellites})`, severity: 'error' };
        }

        if (point.hdop !== undefined && point.hdop > this.MAX_HDOP) {
            return { isValid: false, reason: `Precisión baja (HDOP: ${point.hdop})`, severity: 'error' };
        }

        // 4. Validar velocidad imposible
        if (point.speed > this.MAX_SPEED) {
            return { isValid: false, reason: `Velocidad imposible (${point.speed} km/h)`, severity: 'error' };
        }

        // 5. Validar salto de velocidad (si hay punto anterior)
        if (previousPoint) {
            const speedJump = Math.abs(point.speed - previousPoint.speed);
            if (speedJump > this.MAX_SPEED_JUMP) {
                return { isValid: false, reason: `Salto de velocidad (${speedJump} km/h)`, severity: 'error' };
            }

            // 6. Validar salto de posición
            const distance = this.calculateDistance(previousPoint, point);
            if (distance > this.MAX_POSITION_JUMP) {
                return { isValid: false, reason: `Salto de posición (${distance.toFixed(0)}m)`, severity: 'error' };
            }
        }

        // 7. Validar timeout inicial de señal (primeros 5 minutos)
        if (context?.isFirstValidPoint && context?.initialTimestamp) {
            const elapsed = (point.timestamp.getTime() - context.initialTimestamp.getTime()) / 1000;
            if (elapsed > this.INITIAL_SIGNAL_TIMEOUT) {
                return { isValid: false, reason: 'Timeout inicial de señal GPS', severity: 'error' };
            }
        }

        return { isValid: true, severity: 'info' };
    }

    /**
     * Valida una secuencia completa de puntos GPS
     */
    validateSequence(points: GPSPoint[]): QualityMetrics {
        const metrics: QualityMetrics = {
            totalPoints: points.length,
            validPoints: 0,
            invalidPoints: 0,
            errors: {
                noSignal: 0,
                impossibleSpeed: 0,
                speedJump: 0,
                positionJump: 0,
                outOfBounds: 0,
                lowAccuracy: 0,
            },
            warnings: {
                highSpeed: 0,
                mediumSpeed: 0,
                lowAccuracy: 0,
            },
            statistics: {
                avgSpeed: 0,
                maxSpeed: 0,
                avgAccuracy: 0,
                totalDistance: 0,
                avgDistanceBetweenPoints: 0,
            },
        };

        if (points.length === 0) return metrics;

        let validPoints: GPSPoint[] = [];
        let previousValidPoint: GPSPoint | undefined;
        let firstValidTimestamp: Date | undefined;
        let isFirstValid = true;

        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const context = {
                isFirstValidPoint: isFirstValid,
                initialTimestamp: firstValidTimestamp,
            };

            const result = this.validatePoint(point, previousValidPoint, context);

            if (result.isValid) {
                validPoints.push(point);
                previousValidPoint = point;

                if (isFirstValid) {
                    firstValidTimestamp = point.timestamp;
                    isFirstValid = false;
                }
            } else {
                metrics.invalidPoints++;

                // Categorizar errores
                if (result.reason?.includes('Coordenadas inválidas')) {
                    metrics.errors.noSignal++;
                } else if (result.reason?.includes('Velocidad imposible')) {
                    metrics.errors.impossibleSpeed++;
                } else if (result.reason?.includes('Salto de velocidad')) {
                    metrics.errors.speedJump++;
                } else if (result.reason?.includes('Salto de posición')) {
                    metrics.errors.positionJump++;
                } else if (result.reason?.includes('límites geográficos')) {
                    metrics.errors.outOfBounds++;
                } else if (result.reason?.includes('satélites') || result.reason?.includes('HDOP')) {
                    metrics.errors.lowAccuracy++;
                }
            }

            // Warnings (solo para puntos válidos)
            if (result.isValid) {
                if (point.speed >= 80 && point.speed < this.MAX_SPEED) {
                    metrics.warnings.highSpeed++;
                } else if (point.speed >= 50 && point.speed < 80) {
                    metrics.warnings.mediumSpeed++;
                }

                if (point.hdop && point.hdop >= this.WARNING_HDOP && point.hdop <= this.MAX_HDOP) {
                    metrics.warnings.lowAccuracy++;
                }
            }
        }

        metrics.validPoints = validPoints.length;

        // Calcular estadísticas
        if (validPoints.length > 0) {
            metrics.statistics.avgSpeed = validPoints.reduce((sum, p) => sum + p.speed, 0) / validPoints.length;
            metrics.statistics.maxSpeed = Math.max(...validPoints.map(p => p.speed));
            metrics.statistics.avgAccuracy = validPoints.reduce((sum, p) => sum + (p.hdop || 0), 0) / validPoints.length;

            // Calcular distancia total
            let totalDistance = 0;
            let distanceCount = 0;
            for (let i = 1; i < validPoints.length; i++) {
                const dist = this.calculateDistance(validPoints[i - 1], validPoints[i]);
                totalDistance += dist;
                distanceCount++;
            }

            metrics.statistics.totalDistance = totalDistance;
            metrics.statistics.avgDistanceBetweenPoints = distanceCount > 0 ? totalDistance / distanceCount : 0;
        }

        return metrics;
    }

    /**
     * Filtra puntos GPS inválidos de una secuencia
     */
    filterValidPoints(points: GPSPoint[]): GPSPoint[] {
        const validPoints: GPSPoint[] = [];
        let previousValidPoint: GPSPoint | undefined;
        let firstValidTimestamp: Date | undefined;
        let isFirstValid = true;

        for (const point of points) {
            const context = {
                isFirstValidPoint: isFirstValid,
                initialTimestamp: firstValidTimestamp,
            };

            const result = this.validatePoint(point, previousValidPoint, context);

            if (result.isValid) {
                validPoints.push(point);
                previousValidPoint = point;

                if (isFirstValid) {
                    firstValidTimestamp = point.timestamp;
                    isFirstValid = false;
                }
            }
        }

        return validPoints;
    }

    /**
     * Calcula distancia entre dos puntos (Haversine)
     */
    private calculateDistance(point1: GPSPoint, point2: GPSPoint): number {
        const R = 6371e3; // Radio de la Tierra en metros
        const φ1 = (point1.lat * Math.PI) / 180;
        const φ2 = (point2.lat * Math.PI) / 180;
        const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
        const Δλ = ((point2.lon - point1.lon) * Math.PI) / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * Verifica si un punto está dentro de los límites de Madrid
     */
    private isInMadridBounds(lat: number, lon: number): boolean {
        const MADRID_BBOX = {
            latMin: 40.30,
            latMax: 40.60,
            lonMin: -3.90,
            lonMax: -3.50,
        };

        return lat >= MADRID_BBOX.latMin &&
            lat <= MADRID_BBOX.latMax &&
            lon >= MADRID_BBOX.lonMin &&
            lon <= MADRID_BBOX.lonMax;
    }

    /**
     * Genera un reporte de calidad en texto legible
     */
    generateQualityReport(metrics: QualityMetrics, sessionId: string): string {
        const quality = (metrics.validPoints / metrics.totalPoints) * 100;
        const qualityLevel = quality >= 90 ? 'EXCELENTE' : quality >= 70 ? 'BUENA' : quality >= 50 ? 'REGULAR' : 'POBRE';

        let report = `\n╔════════════════════════════════════════════════════════════════╗\n`;
        report += `║           REPORTE DE CALIDAD GPS - SESIÓN ${sessionId}              ║\n`;
        report += `╠════════════════════════════════════════════════════════════════╣\n`;
        report += `║  CALIDAD GENERAL: ${quality.toFixed(1)}% (${qualityLevel})${' '.repeat(30 - qualityLevel.length)}║\n`;
        report += `║  Puntos totales: ${metrics.totalPoints}${' '.repeat(42 - metrics.totalPoints.toString().length)}║\n`;
        report += `║  Puntos válidos: ${metrics.validPoints}${' '.repeat(42 - metrics.validPoints.toString().length)}║\n`;
        report += `║  Puntos inválidos: ${metrics.invalidPoints}${' '.repeat(40 - metrics.invalidPoints.toString().length)}║\n`;
        report += `╠════════════════════════════════════════════════════════════════╣\n`;
        report += `║  ERRORES DETECTADOS:${' '.repeat(38)}║\n`;
        report += `║    • Sin señal inicial: ${metrics.errors.noSignal}${' '.repeat(33 - metrics.errors.noSignal.toString().length)}║\n`;
        report += `║    • Velocidad imposible: ${metrics.errors.impossibleSpeed}${' '.repeat(31 - metrics.errors.impossibleSpeed.toString().length)}║\n`;
        report += `║    • Salto de velocidad: ${metrics.errors.speedJump}${' '.repeat(34 - metrics.errors.speedJump.toString().length)}║\n`;
        report += `║    • Salto de posición: ${metrics.errors.positionJump}${' '.repeat(33 - metrics.errors.positionJump.toString().length)}║\n`;
        report += `║    • Fuera de límites: ${metrics.errors.outOfBounds}${' '.repeat(34 - metrics.errors.outOfBounds.toString().length)}║\n`;
        report += `║    • Precisión baja: ${metrics.errors.lowAccuracy}${' '.repeat(35 - metrics.errors.lowAccuracy.toString().length)}║\n`;
        report += `╠════════════════════════════════════════════════════════════════╣\n`;
        report += `║  ADVERTENCIAS:${' '.repeat(44)}║\n`;
        report += `║    • Velocidad alta (80-200 km/h): ${metrics.warnings.highSpeed}${' '.repeat(18 - metrics.warnings.highSpeed.toString().length)}║\n`;
        report += `║    • Velocidad media (50-80 km/h): ${metrics.warnings.mediumSpeed}${' '.repeat(18 - metrics.warnings.mediumSpeed.toString().length)}║\n`;
        report += `║    • Precisión media (HDOP 3-5): ${metrics.warnings.lowAccuracy}${' '.repeat(21 - metrics.warnings.lowAccuracy.toString().length)}║\n`;
        report += `╠════════════════════════════════════════════════════════════════╣\n`;
        report += `║  ESTADÍSTICAS:${' '.repeat(45)}║\n`;
        report += `║    • Velocidad promedio: ${metrics.statistics.avgSpeed.toFixed(1)} km/h${' '.repeat(22 - metrics.statistics.avgSpeed.toFixed(1).length)}║\n`;
        report += `║    • Velocidad máxima: ${metrics.statistics.maxSpeed.toFixed(1)} km/h${' '.repeat(24 - metrics.statistics.maxSpeed.toFixed(1).length)}║\n`;
        report += `║    • Distancia total: ${(metrics.statistics.totalDistance / 1000).toFixed(2)} km${' '.repeat(28 - (metrics.statistics.totalDistance / 1000).toFixed(2).length)}║\n`;
        report += `║    • Distancia entre puntos: ${metrics.statistics.avgDistanceBetweenPoints.toFixed(1)} m${' '.repeat(22 - metrics.statistics.avgDistanceBetweenPoints.toFixed(1).length)}║\n`;
        report += `║    • Precisión promedio: ${metrics.statistics.avgAccuracy.toFixed(2)} HDOP${' '.repeat(25 - metrics.statistics.avgAccuracy.toFixed(2).length)}║\n`;
        report += `╚════════════════════════════════════════════════════════════════╝\n`;

        return report;
    }
}

export const gpsValidationService = new GPSValidationService();

