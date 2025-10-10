/**
 * 🚒 SERVICIO DE GPS EN TIEMPO REAL - BOMBEROS MADRID
 * Lee archivos GPS_DOBACKXXX_realTime.txt cada 30 segundos
 */

import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { geofenceService } from './GeofenceService';

export interface GPSData {
    vehicleId: string;
    timestamp: string;
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    heading: number;
    satellites: number;
    accuracy: number;
    lastUpdate: Date;
    status: 'ONLINE' | 'OFFLINE' | 'ERROR';
}

// ID de organización de Bomberos Madrid
const BOMBEROS_MADRID_ORG_ID = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26';

export interface VehicleStatus {
    vehicleId: string;
    name: string;
    type: string;
    gpsData: GPSData | null;
    isActive: boolean;
    lastSeen: Date;
    emergencyStatus: 'AVAILABLE' | 'ON_EMERGENCY' | 'MAINTENANCE' | 'OFFLINE';
}

class RealTimeGPSService extends EventEmitter {
    private vehicles: Map<string, VehicleStatus> = new Map();
    private dataPath: string;
    private updateInterval: NodeJS.Timeout | null = null;
    private readonly UPDATE_INTERVAL = 30000; // 30 segundos
    private readonly OFFLINE_THRESHOLD = 60000; // 1 minuto sin datos = offline

    constructor() {
        super();
        this.dataPath = path.join(process.cwd(), 'data', 'datosDoback', 'CMadrid');
        this.initializeVehicles();
    }

    /**
     * Inicializa la lista de vehículos basada en las carpetas existentes
     */
    private initializeVehicles(): void {
        try {
            // Crear directorio si no existe
            if (!fs.existsSync(this.dataPath)) {
                fs.mkdirSync(this.dataPath, { recursive: true });
                logger.info(`📁 Directorio de datos creado: ${this.dataPath}`);
            }

            const vehicleFolders = fs.readdirSync(this.dataPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('doback'))
                .map(dirent => dirent.name);

            vehicleFolders.forEach(folder => {
                const vehicleId = folder.toUpperCase(); // doback022 -> DOBACK022
                const vehicleName = this.getVehicleDisplayName(vehicleId);
                const vehicleType = this.getVehicleType(vehicleId);

                this.vehicles.set(vehicleId, {
                    vehicleId,
                    name: vehicleName,
                    type: vehicleType,
                    gpsData: null,
                    isActive: false,
                    lastSeen: new Date(0),
                    emergencyStatus: 'OFFLINE'
                });
            });

            logger.info(`🚒 Inicializados ${vehicleFolders.length} vehículos de Bomberos Madrid`);
        } catch (error) {
            logger.error('Error inicializando vehículos:', error);
        }
    }

    /**
     * Obtiene el nombre de visualización del vehículo
     */
    private getVehicleDisplayName(vehicleId: string): string {
        const vehicleNames: Record<string, string> = {
            'DOBACK022': 'Bomba Escalera 1',
            'DOBACK023': 'Bomba Escalera 2',
            'DOBACK024': 'Bomba Urbana 1',
            'DOBACK025': 'Bomba Forestal 1',
            'DOBACK027': 'Ambulancia 1',
            'DOBACK028': 'Unidad de Rescate 1'
        };
        return vehicleNames[vehicleId] || `Vehículo ${vehicleId}`;
    }

    /**
     * Obtiene el tipo de vehículo
     */
    private getVehicleType(vehicleId: string): string {
        const vehicleTypes: Record<string, string> = {
            'DOBACK022': 'FIRE_TRUCK',
            'DOBACK023': 'FIRE_TRUCK',
            'DOBACK024': 'FIRE_TRUCK',
            'DOBACK025': 'FIRE_TRUCK',
            'DOBACK027': 'AMBULANCE',
            'DOBACK028': 'RESCUE_UNIT'
        };
        return vehicleTypes[vehicleId] || 'UNKNOWN';
    }

    /**
     * Lee el archivo GPS en tiempo real de un vehículo
     */
    private readRealTimeGPS(vehicleId: string): GPSData | null {
        try {
            const gpsFilePath = path.join(this.dataPath, vehicleId.toLowerCase(), 'GPS', `GPS_${vehicleId}_realTime.txt`);

            if (!fs.existsSync(gpsFilePath)) {
                logger.warn(`📡 Archivo GPS no encontrado para ${vehicleId}: ${gpsFilePath}`);
                return null;
            }

            const content = fs.readFileSync(gpsFilePath, 'utf-8').trim();
            const lines = content.split('\n');

            if (lines.length < 2) {
                logger.warn(`📡 Datos GPS insuficientes para ${vehicleId}`);
                return null;
            }

            // Parsear timestamp del archivo
            const fileTimestamp = lines[0].trim();

            // Parsear línea de datos GPS
            const gpsLine = lines[1].trim();
            const gpsParts = gpsLine.split(',');

            if (gpsParts.length < 9) {
                logger.warn(`📡 Formato GPS inválido para ${vehicleId}: ${gpsLine}`);
                return null;
            }

            const [date, time, lat, lng, alt, speed, heading, satellites, accuracy] = gpsParts;

            return {
                vehicleId,
                timestamp: `${date} ${time}`,
                latitude: parseFloat(lat),
                longitude: parseFloat(lng),
                altitude: parseFloat(alt),
                speed: parseFloat(speed),
                heading: parseFloat(heading),
                satellites: parseInt(satellites),
                accuracy: parseFloat(accuracy),
                lastUpdate: new Date(),
                status: 'ONLINE'
            };

        } catch (error) {
            logger.error(`Error leyendo GPS para ${vehicleId}:`, error);
            return null;
        }
    }

    /**
     * Actualiza el estado de un vehículo
     */
    private updateVehicleStatus(vehicleId: string, gpsData: GPSData | null): void {
        const vehicle = this.vehicles.get(vehicleId);
        if (!vehicle) return;

        const now = new Date();
        const timeSinceLastUpdate = now.getTime() - vehicle.lastSeen.getTime();

        // Determinar estado del vehículo
        let emergencyStatus: VehicleStatus['emergencyStatus'] = 'OFFLINE';
        let isActive = false;

        if (gpsData) {
            vehicle.lastSeen = now;
            vehicle.gpsData = gpsData;

            if (timeSinceLastUpdate < this.OFFLINE_THRESHOLD) {
                isActive = true;

                // Determinar estado de emergencia basado en velocidad y ubicación
                if (gpsData.speed > 80) { // Velocidad alta = emergencia
                    emergencyStatus = 'ON_EMERGENCY';
                } else if (gpsData.speed > 5) { // En movimiento pero no emergencia
                    emergencyStatus = 'ON_EMERGENCY';
                } else { // Parado
                    emergencyStatus = 'AVAILABLE';
                }
            }
        } else {
            emergencyStatus = 'OFFLINE';
            isActive = false;
        }

        vehicle.isActive = isActive;
        vehicle.emergencyStatus = emergencyStatus;

        // Emitir evento si hay cambios significativos
        this.emit('vehicleUpdate', vehicle);
    }

    /**
     * Actualiza todos los vehículos
     */
    private async updateAllVehicles(): Promise<void> {
        let onlineCount = 0;
        let emergencyCount = 0;

        for (const [vehicleId, vehicle] of this.vehicles.entries()) {
            const gpsData = this.readRealTimeGPS(vehicleId);
            this.updateVehicleStatus(vehicleId, gpsData);

            // Procesar geofences si hay datos GPS válidos
            if (gpsData && gpsData.latitude && gpsData.longitude) {
                try {
                    await geofenceService.processGPSPoints(
                        vehicleId,
                        BOMBEROS_MADRID_ORG_ID,
                        [{
                            latitude: gpsData.latitude,
                            longitude: gpsData.longitude,
                            timestamp: gpsData.timestamp,
                            speed: gpsData.speed,
                            heading: gpsData.heading
                        }]
                    );
                } catch (error) {
                    logger.error(`🗺️  Error procesando geofences para ${vehicleId}:`, error);
                }
            }

            if (vehicle.isActive) onlineCount++;
            if (vehicle.emergencyStatus === 'ON_EMERGENCY') emergencyCount++;
        }

        // Emitir estadísticas generales
        this.emit('statusUpdate', {
            totalVehicles: this.vehicles.size,
            onlineVehicles: onlineCount,
            emergencyVehicles: emergencyCount,
            timestamp: new Date()
        });

        logger.info(`📡 GPS Update: ${onlineCount}/${this.vehicles.size} vehículos online, ${emergencyCount} en emergencia`);
    }

    /**
     * Inicia el monitoreo en tiempo real
     */
    public startMonitoring(): void {
        if (this.updateInterval) {
            logger.warn('📡 Monitoreo GPS ya está activo');
            return;
        }

        logger.info('🚒 Iniciando monitoreo GPS en tiempo real para Bomberos Madrid');
        logger.info('🗺️  Detección de geofences habilitada');

        // Actualización inmediata
        this.updateAllVehicles().catch(err =>
            logger.error('Error en actualización inicial de GPS:', err)
        );

        // Configurar actualización periódica
        this.updateInterval = setInterval(() => {
            this.updateAllVehicles().catch(err =>
                logger.error('Error en actualización periódica de GPS:', err)
            );
        }, this.UPDATE_INTERVAL);

        this.emit('monitoringStarted');
    }

    /**
     * Detiene el monitoreo
     */
    public stopMonitoring(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            logger.info('📡 Monitoreo GPS detenido');
            this.emit('monitoringStopped');
        }
    }

    /**
     * Obtiene el estado de todos los vehículos
     */
    public getAllVehicles(): VehicleStatus[] {
        return Array.from(this.vehicles.values());
    }

    /**
     * Obtiene un vehículo específico
     */
    public getVehicle(vehicleId: string): VehicleStatus | null {
        return this.vehicles.get(vehicleId.toUpperCase()) || null;
    }

    /**
     * Obtiene vehículos en emergencia
     */
    public getEmergencyVehicles(): VehicleStatus[] {
        return Array.from(this.vehicles.values())
            .filter(vehicle => vehicle.emergencyStatus === 'ON_EMERGENCY');
    }

    /**
     * Obtiene vehículos disponibles
     */
    public getAvailableVehicles(): VehicleStatus[] {
        return Array.from(this.vehicles.values())
            .filter(vehicle => vehicle.emergencyStatus === 'AVAILABLE' && vehicle.isActive);
    }

    /**
     * Obtiene estadísticas generales
     */
    public getStats() {
        const vehicles = Array.from(this.vehicles.values());
        return {
            total: vehicles.length,
            online: vehicles.filter(v => v.isActive).length,
            emergency: vehicles.filter(v => v.emergencyStatus === 'ON_EMERGENCY').length,
            available: vehicles.filter(v => v.emergencyStatus === 'AVAILABLE').length,
            offline: vehicles.filter(v => v.emergencyStatus === 'OFFLINE').length,
            maintenance: vehicles.filter(v => v.emergencyStatus === 'MAINTENANCE').length
        };
    }

    /**
     * Fuerza una actualización inmediata
     */
    public forceUpdate(): void {
        logger.info('📡 Forzando actualización GPS...');
        this.updateAllVehicles();
    }

    /**
     * Verifica si el servicio está activo
     */
    public isMonitoring(): boolean {
        return this.updateInterval !== null;
    }
}

// Instancia singleton
export const realTimeGPSService = new RealTimeGPSService();

// Auto-iniciar en producción
if (process.env.NODE_ENV === 'production') {
    realTimeGPSService.startMonitoring();
}

export default realTimeGPSService;
