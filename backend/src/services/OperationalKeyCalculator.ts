import { prisma } from '../config/prisma';
import { createLogger } from '../utils/logger';
import { dataCorrelationService } from './DataCorrelationService';
import { radarIntegration } from './radarIntegration';

const logger = createLogger('OperationalKeyCalculator');

interface EstadoClave {
    keyType: number;
    startTime: Date;
    startLat: number;
    startLon: number;
    rotativoState?: boolean;
    geofenceId?: string;
    geofenceName?: string;
}

interface Geocerca {
    id: string;
    name: string;
    type: string;
    coordinates: any;
}

/**
 * Calculador de Claves Operacionales de Bomberos
 * 
 * CLAVES:
 * 0 = Taller
 * 1 = Operativo en parque
 * 2 = Salida en emergencia
 * 3 = En incendio/emergencia
 * 5 = Regreso al parque
 * 
 * CORRECCIONES APLICADAS:
 * - Clave 3: Ventana rodante de ≥5 min a <5 km/h con cluster de posición (≤50m)
 * - Registro de geocerca asociada
 * - Alertas de transiciones inválidas
 */
export class OperationalKeyCalculator {

    /**
     * Calcula claves operacionales para una sesión
     */
    async calcularClavesOperacionales(sessionId: string): Promise<string[]> {
        try {
            logger.info(`Calculando claves operacionales para sesión ${sessionId}`);

            // 1. Obtener datos correlacionados (GPS con rotativo)
            const { gpsConRotativo } = await dataCorrelationService.correlacionarSesion(sessionId);

            if (gpsConRotativo.length === 0) {
                logger.warn(`No hay datos GPS para sesión ${sessionId}`);
                return [];
            }

            // 2. Cargar geocercas (parques y talleres)
            const geocercas = await this.cargarGeocercas();

            // 3. Máquina de estados para detectar claves
            let estadoActual: EstadoClave | null = null;
            const clavesCreadas: string[] = [];
            const transicionesInvalidas: string[] = [];

            // Buffer para detectar Clave 3 (≥5 min parado en mismo lugar)
            const ventanaParado: Array<{ timestamp: Date; lat: number; lon: number; speed: number }> = [];

            for (let i = 0; i < gpsConRotativo.length; i++) {
                const punto = gpsConRotativo[i];

                // Verificar geocercas
                const enParque = await this.verificarEnGeocerca(punto.latitude, punto.longitude, geocercas.parques);
                const enTaller = await this.verificarEnGeocerca(punto.latitude, punto.longitude, geocercas.talleres);

                // ============================================
                // CLAVE 0 - TALLER
                // ============================================
                if (enTaller.dentro) {
                    if (!estadoActual || estadoActual.keyType !== 0) {
                        if (estadoActual) {
                            // Guardar clave anterior
                            const claveId = await this.guardarClave(sessionId, estadoActual, punto.timestamp, punto.latitude, punto.longitude);
                            clavesCreadas.push(claveId);
                        }

                        estadoActual = {
                            keyType: 0,
                            startTime: punto.timestamp,
                            startLat: punto.latitude,
                            startLon: punto.longitude,
                            geofenceId: enTaller.geocerca?.id,
                            geofenceName: enTaller.geocerca?.name || 'Taller'
                        };

                        logger.info(`Clave 0 (Taller) iniciada en ${enTaller.geocerca?.name}`);
                    }
                }
                // ============================================
                // CLAVE 1 - OPERATIVO EN PARQUE
                // ============================================
                else if (enParque.dentro && !punto.rotativoOn) {
                    if (!estadoActual || estadoActual.keyType !== 1) {
                        if (estadoActual) {
                            const claveId = await this.guardarClave(sessionId, estadoActual, punto.timestamp, punto.latitude, punto.longitude);
                            clavesCreadas.push(claveId);
                        }

                        estadoActual = {
                            keyType: 1,
                            startTime: punto.timestamp,
                            startLat: punto.latitude,
                            startLon: punto.longitude,
                            rotativoState: false,
                            geofenceId: enParque.geocerca?.id,
                            geofenceName: enParque.geocerca?.name || 'Parque'
                        };

                        logger.info(`Clave 1 (Parque) iniciada en ${enParque.geocerca?.name}`);
                    }
                }
                // ============================================
                // CLAVE 2 - SALIDA EN EMERGENCIA
                // ============================================
                else if (!enParque.dentro && punto.rotativoOn && estadoActual?.keyType === 1) {
                    // Transición válida: 1 → 2
                    const claveId = await this.guardarClave(sessionId, estadoActual, punto.timestamp, punto.latitude, punto.longitude);
                    clavesCreadas.push(claveId);

                    estadoActual = {
                        keyType: 2,
                        startTime: punto.timestamp,
                        startLat: punto.latitude,
                        startLon: punto.longitude,
                        rotativoState: true
                    };

                    logger.info(`Clave 2 (Salida Emergencia) iniciada desde ${enParque.geocerca?.name || 'parque'}`);
                }
                // ============================================
                // CLAVE 3 - EN INCENDIO/EMERGENCIA
                // ============================================
                else if (estadoActual?.keyType === 2) {
                    // Detectar parada prolongada (≥5 min en mismo lugar)

                    if (punto.speed < 5) {
                        // Agregar a ventana de parado
                        ventanaParado.push({
                            timestamp: punto.timestamp,
                            lat: punto.latitude,
                            lon: punto.longitude,
                            speed: punto.speed
                        });

                        // Verificar si cumple condiciones de Clave 3
                        if (ventanaParado.length >= 2) {
                            const primerPunto = ventanaParado[0];
                            const ultimoPunto = ventanaParado[ventanaParado.length - 1];

                            const duracionParado = (ultimoPunto.timestamp.getTime() - primerPunto.timestamp.getTime()) / 1000;
                            const distanciaMovida = this.calcularDistancia(
                                primerPunto.lat,
                                primerPunto.lon,
                                ultimoPunto.lat,
                                ultimoPunto.lon
                            );

                            // ✅ VENTANA RODANTE: ≥5 min Y cluster de posición ≤50m
                            if (duracionParado >= 300 && distanciaMovida <= 0.05) {
                                // Cambiar a Clave 3
                                const claveId = await this.guardarClave(sessionId, estadoActual, punto.timestamp, punto.latitude, punto.longitude);
                                clavesCreadas.push(claveId);

                                estadoActual = {
                                    keyType: 3,
                                    startTime: primerPunto.timestamp,
                                    startLat: primerPunto.lat,
                                    startLon: primerPunto.lon,
                                    rotativoState: punto.rotativoOn
                                };

                                logger.info(`Clave 3 (En Incendio) iniciada - parado ${duracionParado.toFixed(0)}s en radio ${distanciaMovida.toFixed(3)}km`);

                                // Limpiar ventana
                                ventanaParado.length = 0;
                            }
                        }
                    } else {
                        // Vuelve a moverse, limpiar ventana
                        ventanaParado.length = 0;
                    }
                }
                // ============================================
                // CLAVE 5 - REGRESO AL PARQUE
                // ============================================
                else if (!punto.rotativoOn && estadoActual?.keyType === 3) {
                    // Transición válida: 3 → 5
                    const claveId = await this.guardarClave(sessionId, estadoActual, punto.timestamp, punto.latitude, punto.longitude);
                    clavesCreadas.push(claveId);

                    estadoActual = {
                        keyType: 5,
                        startTime: punto.timestamp,
                        startLat: punto.latitude,
                        startLon: punto.longitude,
                        rotativoState: false
                    };

                    logger.info(`Clave 5 (Regreso) iniciada`);
                }
                // ============================================
                // TRANSICIONES INVÁLIDAS
                // ============================================
                else if (estadoActual) {
                    // Detectar transiciones anómalas
                    if (enParque.dentro && estadoActual.keyType !== 1 && !punto.rotativoOn) {
                        // Vuelve al parque sin completar secuencia
                        transicionesInvalidas.push(`${estadoActual.keyType} → 1 (regreso directo sin completar ciclo)`);

                        // Guardar estado actual
                        const claveId = await this.guardarClave(sessionId, estadoActual, punto.timestamp, punto.latitude, punto.longitude);
                        clavesCreadas.push(claveId);

                        // Forzar Clave 1
                        estadoActual = {
                            keyType: 1,
                            startTime: punto.timestamp,
                            startLat: punto.latitude,
                            startLon: punto.longitude,
                            rotativoState: false,
                            geofenceId: enParque.geocerca?.id,
                            geofenceName: enParque.geocerca?.name || 'Parque'
                        };

                        logger.warn(`Transición inválida detectada - forzado a Clave 1`);
                    }
                }
            }

            // Guardar última clave
            if (estadoActual) {
                const ultimoPunto = gpsConRotativo[gpsConRotativo.length - 1];
                const claveId = await this.guardarClave(sessionId, estadoActual, ultimoPunto.timestamp, ultimoPunto.latitude, ultimoPunto.longitude);
                clavesCreadas.push(claveId);
            }

            // Guardar alertas de transiciones inválidas
            if (transicionesInvalidas.length > 0) {
                logger.warn(`Transiciones inválidas detectadas: ${transicionesInvalidas.join(', ')}`);
                // TODO: Crear alertas en tabla de notificaciones
            }

            logger.info(`Claves operacionales calculadas: ${clavesCreadas.length} claves creadas`);

            return clavesCreadas;

        } catch (error: any) {
            logger.error(`Error calculando claves operacionales: ${error.message}`);
            throw error;
        }
    }

    /**
     * Guarda una clave operacional en BD
     */
    private async guardarClave(
        sessionId: string,
        estado: EstadoClave,
        endTime: Date,
        endLat: number,
        endLon: number
    ): Promise<string> {
        const duration = Math.floor((endTime.getTime() - estado.startTime.getTime()) / 1000);

        const clave = await prisma.operationalKey.create({
            data: {
                sessionId,
                keyType: estado.keyType,
                startTime: estado.startTime,
                endTime,
                duration,
                startLat: estado.startLat,
                startLon: estado.startLon,
                endLat,
                endLon,
                rotativoState: estado.rotativoState || null,
                geofenceId: estado.geofenceId || null,
                geofenceName: estado.geofenceName || null
            }
        });

        logger.info(`Clave ${estado.keyType} guardada: ${duration}s`);

        return clave.id;
    }

    /**
     * Verifica si un punto está dentro de una geocerca
     */
    private async verificarEnGeocerca(
        lat: number,
        lon: number,
        geocercas: Geocerca[]
    ): Promise<{ dentro: boolean; geocerca?: Geocerca }> {
        // Opción 1: Usar Radar.com API (HABILITADO)
        if (process.env.RADAR_SECRET_KEY) {
            try {
                // Verificar parques
                const resultadoParque = await radarIntegration.verificarEnParque(lat, lon);
                if (resultadoParque.enParque) {
                    return {
                        dentro: true,
                        geocerca: {
                            id: 'radar-parque',
                            name: resultadoParque.nombreParque || 'Parque',
                            type: 'parque',
                            coordinates: undefined // Radar Context API no devuelve geometry
                        }
                    };
                }

                // Verificar talleres
                const resultadoTaller = await radarIntegration.verificarEnTaller(lat, lon);
                if (resultadoTaller.enTaller) {
                    return {
                        dentro: true,
                        geocerca: {
                            id: 'radar-taller',
                            name: resultadoTaller.nombreTaller || 'Taller',
                            type: 'taller',
                            coordinates: undefined // Radar Context API no devuelve geometry
                        }
                    };
                }

            } catch (error: any) {
                logger.warn('Radar.com falló, usando BD local', { error: error.message });
            }
        }

        // Opción 2: Fallback a geocercas de BD local
        for (const geocerca of geocercas) {
            if (this.puntoEnGeocerca(lat, lon, geocerca)) {
                return { dentro: true, geocerca };
            }
        }

        return { dentro: false };
    }

    /**
     * Carga geocercas de BD local (parques y talleres)
     */
    private async cargarGeocercas(): Promise<{ parques: Geocerca[]; talleres: Geocerca[] }> {
        const parques = await prisma.park.findMany({
            select: {
                id: true,
                name: true,
                geometry: true
            }
        });

        // TODO: Cargar talleres cuando exista la tabla
        const talleres: Geocerca[] = [];

        return {
            parques: parques.map(p => ({
                id: p.id,
                name: p.name,
                type: 'parque',
                coordinates: p.geometry as any // JsonValue from Prisma
            })),
            talleres
        };
    }

    /**
     * Verifica si un punto está dentro de un polígono (ray-casting algorithm)
     */
    private puntoEnGeocerca(lat: number, lon: number, geocerca: Geocerca): boolean {
        const coords = geocerca.coordinates;

        if (!coords || !Array.isArray(coords) || coords.length === 0) {
            return false;
        }

        // Ray-casting algorithm
        let dentro = false;

        for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
            const xi = coords[i][1]; // lat
            const yi = coords[i][0]; // lon
            const xj = coords[j][1]; // lat
            const yj = coords[j][0]; // lon

            const intersect = ((yi > lon) !== (yj > lon))
                && (lat < (xj - xi) * (lon - yi) / (yj - yi) + xi);

            if (intersect) dentro = !dentro;
        }

        return dentro;
    }

    /**
     * Calcula distancia entre dos puntos usando fórmula de Haversine
     */
    private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radio de la Tierra en km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    private toRad(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    /**
     * Obtiene resumen de claves para una o más sesiones
     */
    async obtenerResumenClaves(sessionIds: string[]): Promise<any> {
        const claves = await prisma.operationalKey.groupBy({
            by: ['keyType'],
            where: { sessionId: { in: sessionIds } },
            _sum: { duration: true },
            _count: true
        });

        return {
            clave0_taller: this.formatearTiempo(claves.find(c => c.keyType === 0)?._sum.duration || 0),
            clave1_parque: this.formatearTiempo(claves.find(c => c.keyType === 1)?._sum.duration || 0),
            clave2_emergencia: this.formatearTiempo(claves.find(c => c.keyType === 2)?._sum.duration || 0),
            clave3_incendio: this.formatearTiempo(claves.find(c => c.keyType === 3)?._sum.duration || 0),
            clave5_regreso: this.formatearTiempo(claves.find(c => c.keyType === 5)?._sum.duration || 0),
            detalle: claves.map(c => ({
                clave: c.keyType,
                duracion: c._sum.duration || 0,
                ocurrencias: c._count
            }))
        };
    }

    private formatearTiempo(segundos: number): string {
        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        const segs = segundos % 60;

        return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
}

export const operationalKeyCalculator = new OperationalKeyCalculator();

