import { useCallback, useMemo } from 'react';
import { GEO_CONFIG, VEHICLE_CONFIG } from '../config/constants';

interface GPSPoint {
    timestamp: string;
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    heading: number;
    satellites: number;
    accuracy: number;
}

interface TelemetryPoint {
    timestamp: string;
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    altitude: number;
    accuracy: number;
}

interface CANPoint {
    timestamp: string;
    engineRPM: number;
    vehicleSpeed: number;
    rotativo: boolean;
}

export const useMemoizedGPSData = (sessionData: any) => {
    const gpsTelemetryData = useMemo(() => {
        if (!sessionData) return [];

        return sessionData.gpsData?.map((point: GPSPoint) => ({
            timestamp: point.timestamp,
            latitude: point.latitude,
            longitude: point.longitude,
            speed: point.speed,
            heading: point.heading,
            altitude: point.altitude,
            accuracy: point.accuracy
        })) || [];
    }, [sessionData?.gpsData]);

    const canTelemetryData = useMemo(() => {
        if (!sessionData) return [];

        const rawCan = sessionData.canData as any[] | undefined;
        if (!rawCan) return [];

        return rawCan.map((cd: any) => ({
            timestamp: cd.timestamp,
            engineRPM: cd.engineRPM ?? cd.engine_rpm ?? 0,
            vehicleSpeed: cd.vehicleSpeed ?? cd.vehicle_speed ?? 0,
            rotativo: (cd.engineRPM ?? cd.engine_rpm ?? 0) > VEHICLE_CONFIG.RPM.ROTATIVO_THRESHOLD
        }));
    }, [sessionData?.canData]);

    const mapCenter = useMemo<[number, number]>(() => {
        if (gpsTelemetryData.length > 0) {
            const validPoints = gpsTelemetryData.filter((point: TelemetryPoint) =>
                point.latitude !== 0 && point.longitude !== 0
            );

            if (validPoints.length > 0) {
                // Usar solo el primer y último punto para calcular el centro (más robusto)
                const firstPoint = validPoints[0];
                const lastPoint = validPoints[validPoints.length - 1];

                const centerLat = (firstPoint.latitude + lastPoint.latitude) / 2;
                const centerLng = (firstPoint.longitude + lastPoint.longitude) / 2;

                const center: [number, number] = [centerLat, centerLng];
                return center;
            }
        }
        // Coordenadas por defecto (Córdoba, España)
        const defaultCenter: [number, number] = [GEO_CONFIG.DEFAULT_CENTER.latitude, GEO_CONFIG.DEFAULT_CENTER.longitude];
        return defaultCenter;
    }, [gpsTelemetryData]);

    const maxSpeed = useMemo(() => {
        if (!gpsTelemetryData.length) return undefined;
        return Math.max(...gpsTelemetryData.map((p: TelemetryPoint) => p.speed || 0));
    }, [gpsTelemetryData]);

    // Función para calcular distancia entre dos puntos GPS en metros
    const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371000; // Radio de la Tierra en metros
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }, []);

    const filteredGPSData = useMemo(() => {
        if (!gpsTelemetryData.length) return [];

        // Ordenar por timestamp para asegurar orden cronológico
        const sortedData = [...gpsTelemetryData].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Filtrar puntos válidos básicos
        const validPoints = sortedData.filter(point =>
            !isNaN(point.latitude) && !isNaN(point.longitude) &&
            point.latitude >= -90 && point.latitude <= 90 &&
            point.longitude >= -180 && point.longitude <= 180 &&
            point.latitude !== 0 && point.longitude !== 0
        );

        console.log(`GPS Data: ${validPoints.length} puntos válidos encontrados`);

        // Por ahora, devolver todos los puntos válidos sin filtrado adicional
        return validPoints;
    }, [gpsTelemetryData, calculateDistance]);

    return {
        gpsTelemetryData: filteredGPSData,
        canTelemetryData,
        mapCenter,
        maxSpeed
    };
}; 