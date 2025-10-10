import { PrismaClient } from '@prisma/client';
import { DatabaseService } from '../../services/DatabaseService';
import { EventService } from '../../services/EventService';
import { NotificationService } from '../../services/NotificationService';
import { StabilityProcessor } from '../../services/StabilityProcessor';
import { ValidationService } from '../../services/ValidationService';
import { createMockLogger } from '../../test/utils';
import { EventSeverity, EventStatus, EventType } from '../../types/enums';
import { RawStabilityData, StabilityMeasurements } from '../../types/stability';

describe('Data Processing Integration Tests', () => {
    let prisma: PrismaClient;
    let stabilityProcessor: StabilityProcessor;
    let eventService: EventService;
    let notificationService: NotificationService;
    let validationService: ValidationService;
    let databaseService: DatabaseService;
    let mockLogger: any;

    beforeAll(async () => {
        prisma = new PrismaClient();
        mockLogger = createMockLogger();
        stabilityProcessor = new StabilityProcessor();
        notificationService = new NotificationService();
        eventService = new EventService(notificationService);
        validationService = new ValidationService();
        databaseService = new DatabaseService(prisma);

        // Limpiar datos de prueba
        await prisma.event.deleteMany();
        await prisma.measurement.deleteMany();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('Raw Data Processing Flow', () => {
        const rawData: RawStabilityData = {
            timestamp: Date.now(),
            roll: 5,
            pitch: 3,
            yaw: 1,
            acc_x: 0.1,
            acc_y: 0.2,
            acc_z: 9.81,
            load_fl: 0.25,
            load_fr: 0.25,
            load_rl: 0.25,
            load_rr: 0.25,
            lat: 40.4168,
            lon: -3.7038,
            alt: 667,
            vehicle_id: "TEST-001",
            session_id: "test-session"
        };

        it('should process raw data and store measurements', async () => {
            // 1. Validar datos crudos
            const validationResult = validationService.validateStabilityData(rawData);
            expect(validationResult.isValid).toBe(true);

            // 2. Convertir a mediciones estructuradas
            const measurement: StabilityMeasurements = {
                timestamp: new Date(rawData.timestamp),
                vehicleId: rawData.vehicle_id,
                sessionId: rawData.session_id,
                accelerometer: {
                    x: rawData.acc_x,
                    y: rawData.acc_y,
                    z: rawData.acc_z
                },
                gyroscope: {
                    x: Math.cos(rawData.roll) * Math.cos(rawData.pitch),
                    y: Math.sin(rawData.roll) * Math.cos(rawData.pitch),
                    z: Math.sin(rawData.pitch)
                },
                location: {
                    latitude: rawData.lat,
                    longitude: rawData.lon,
                    altitude: rawData.alt
                },
                loadCells: {
                    frontLeft: rawData.load_fl,
                    frontRight: rawData.load_fr,
                    rearLeft: rawData.load_rl,
                    rearRight: rawData.load_rr
                }
            };

            // 3. Procesar mediciones
            const metrics = stabilityProcessor.processMeasurements([measurement]);
            expect(metrics).toBeDefined();
            expect(metrics.ltr).toBeDefined();
            expect(metrics.ssf).toBeDefined();
            expect(metrics.drs).toBeDefined();
            expect(metrics.rsc).toBeDefined();

            // 4. Almacenar resultados
            await databaseService.transaction(async (prisma) => {
                // Guardar medición
                const savedMeasurement = await prisma.measurement.create({
                    data: {
                        timestamp: measurement.timestamp,
                        vehicleId: parseInt(measurement.vehicleId),
                        sessionId: measurement.sessionId,
                        data: {
                            accelerometer: measurement.accelerometer,
                            gyroscope: measurement.gyroscope,
                            location: measurement.location,
                            loadCells: measurement.loadCells
                        },
                        metrics: metrics
                    }
                });

                expect(savedMeasurement).toBeDefined();
                expect(savedMeasurement.id).toBeDefined();

                // Si hay métricas críticas, generar evento
                if (metrics.ltr > 0.8 || metrics.rollAngle > 30) {
                    const event = await eventService.createEvent({
                        type: EventType.STABILITY_WARNING,
                        severity: EventSeverity.HIGH,
                        description: 'Valores críticos detectados',
                        vehicleId: parseInt(measurement.vehicleId),
                        organizationId: 1,
                        context: {
                            measurementId: savedMeasurement.id,
                            metrics,
                            location: measurement.location
                        }
                    });

                    expect(event).toBeDefined();
                    expect(event.type).toBe(EventType.STABILITY_WARNING);
                    expect(event.status).toBe(EventStatus.ACTIVE);
                }
            });
        });

        it('should handle batch processing', async () => {
            // 1. Crear lote de datos crudos
            const batchData: RawStabilityData[] = [
                rawData,
                {
                    ...rawData,
                    timestamp: rawData.timestamp + 1000,
                    acc_y: 0.3,
                    load_fr: 0.3,
                    load_rr: 0.3
                },
                {
                    ...rawData,
                    timestamp: rawData.timestamp + 2000,
                    acc_y: 0.4,
                    load_fr: 0.35,
                    load_rr: 0.35
                }
            ];

            // 2. Procesar lote
            const processedData = await databaseService.transaction(async (prisma) => {
                const results = [];

                for (const data of batchData) {
                    // Validar y convertir
                    const validationResult = validationService.validateStabilityData(data);
                    if (!validationResult.isValid) continue;

                    const measurement: StabilityMeasurements = {
                        timestamp: new Date(data.timestamp),
                        vehicleId: data.vehicle_id,
                        sessionId: data.session_id,
                        accelerometer: {
                            x: data.acc_x,
                            y: data.acc_y,
                            z: data.acc_z
                        },
                        gyroscope: {
                            x: Math.cos(data.roll) * Math.cos(data.pitch),
                            y: Math.sin(data.roll) * Math.cos(data.pitch),
                            z: Math.sin(data.pitch)
                        },
                        location: {
                            latitude: data.lat,
                            longitude: data.lon,
                            altitude: data.alt
                        },
                        loadCells: {
                            frontLeft: data.load_fl,
                            frontRight: data.load_fr,
                            rearLeft: data.load_rl,
                            rearRight: data.load_rr
                        }
                    };

                    // Procesar y almacenar
                    const metrics = stabilityProcessor.processMeasurements([measurement]);
                    const savedMeasurement = await prisma.measurement.create({
                        data: {
                            timestamp: measurement.timestamp,
                            vehicleId: parseInt(measurement.vehicleId),
                            sessionId: measurement.sessionId,
                            data: {
                                accelerometer: measurement.accelerometer,
                                gyroscope: measurement.gyroscope,
                                location: measurement.location,
                                loadCells: measurement.loadCells
                            },
                            metrics: metrics
                        }
                    });

                    results.push({ measurement: savedMeasurement, metrics });
                }

                return results;
            });

            // 3. Verificar resultados
            expect(processedData).toHaveLength(3);
            expect(processedData[2].metrics.lateralAcceleration)
                .toBeGreaterThan(processedData[0].metrics.lateralAcceleration);

            // 4. Verificar tendencias
            const trend = {
                start: processedData[0].metrics.lateralAcceleration,
                end: processedData[2].metrics.lateralAcceleration,
                duration: 2000
            };

            if (trend.end > trend.start * 1.5) {
                const event = await eventService.createEvent({
                    type: EventType.STABILITY_WARNING,
                    severity: EventSeverity.MEDIUM,
                    description: 'Tendencia creciente en aceleración lateral',
                    vehicleId: parseInt(rawData.vehicle_id),
                    organizationId: 1,
                    context: {
                        trend,
                        measurements: processedData.map(d => d.measurement.id)
                    }
                });

                expect(event).toBeDefined();
                expect(event.type).toBe(EventType.STABILITY_WARNING);
                expect(event.severity).toBe(EventSeverity.MEDIUM);
            }
        });

        it('should handle data recovery after errors', async () => {
            // 1. Simular error en procesamiento
            const corruptedData = { ...rawData, acc_z: NaN };

            try {
                await databaseService.transaction(async (prisma) => {
                    const measurement: StabilityMeasurements = {
                        timestamp: new Date(corruptedData.timestamp),
                        vehicleId: corruptedData.vehicle_id,
                        sessionId: corruptedData.session_id,
                        accelerometer: {
                            x: corruptedData.acc_x,
                            y: corruptedData.acc_y,
                            z: corruptedData.acc_z
                        },
                        gyroscope: {
                            x: Math.cos(corruptedData.roll) * Math.cos(corruptedData.pitch),
                            y: Math.sin(corruptedData.roll) * Math.cos(corruptedData.pitch),
                            z: Math.sin(corruptedData.pitch)
                        },
                        location: {
                            latitude: corruptedData.lat,
                            longitude: corruptedData.lon,
                            altitude: corruptedData.alt
                        },
                        loadCells: {
                            frontLeft: corruptedData.load_fl,
                            frontRight: corruptedData.load_fr,
                            rearLeft: corruptedData.load_rl,
                            rearRight: corruptedData.load_rr
                        }
                    };

                    // Esto debería fallar
                    const metrics = stabilityProcessor.processMeasurements([measurement]);
                    await prisma.measurement.create({
                        data: {
                            timestamp: measurement.timestamp,
                            vehicleId: parseInt(measurement.vehicleId),
                            sessionId: measurement.sessionId,
                            data: {
                                accelerometer: measurement.accelerometer,
                                gyroscope: measurement.gyroscope,
                                location: measurement.location,
                                loadCells: measurement.loadCells
                            },
                            metrics: metrics
                        }
                    });
                });
            } catch (error) {
                // 2. Verificar que se generó evento de error
                const event = await eventService.createEvent({
                    type: EventType.DATA_ERROR,
                    severity: EventSeverity.HIGH,
                    description: 'Error en procesamiento de datos',
                    vehicleId: parseInt(corruptedData.vehicle_id),
                    organizationId: 1,
                    context: {
                        error: error.message,
                        rawData: corruptedData
                    }
                });

                expect(event).toBeDefined();
                expect(event.type).toBe(EventType.DATA_ERROR);
                expect(event.severity).toBe(EventSeverity.HIGH);
            }

            // 3. Intentar recuperación con datos limpios
            const cleanData = { ...rawData };
            const validationResult = validationService.validateStabilityData(cleanData);
            expect(validationResult.isValid).toBe(true);

            // 4. Procesar datos limpios
            await databaseService.transaction(async (prisma) => {
                const measurement: StabilityMeasurements = {
                    timestamp: new Date(cleanData.timestamp),
                    vehicleId: cleanData.vehicle_id,
                    sessionId: cleanData.session_id,
                    accelerometer: {
                        x: cleanData.acc_x,
                        y: cleanData.acc_y,
                        z: cleanData.acc_z
                    },
                    gyroscope: {
                        x: Math.cos(cleanData.roll) * Math.cos(cleanData.pitch),
                        y: Math.sin(cleanData.roll) * Math.cos(cleanData.pitch),
                        z: Math.sin(cleanData.pitch)
                    },
                    location: {
                        latitude: cleanData.lat,
                        longitude: cleanData.lon,
                        altitude: cleanData.alt
                    },
                    loadCells: {
                        frontLeft: cleanData.load_fl,
                        frontRight: cleanData.load_fr,
                        rearLeft: cleanData.load_rl,
                        rearRight: cleanData.load_rr
                    }
                };

                const metrics = stabilityProcessor.processMeasurements([measurement]);
                const savedMeasurement = await prisma.measurement.create({
                    data: {
                        timestamp: measurement.timestamp,
                        vehicleId: parseInt(measurement.vehicleId),
                        sessionId: measurement.sessionId,
                        data: {
                            accelerometer: measurement.accelerometer,
                            gyroscope: measurement.gyroscope,
                            location: measurement.location,
                            loadCells: measurement.loadCells
                        },
                        metrics: metrics
                    }
                });

                expect(savedMeasurement).toBeDefined();
                expect(savedMeasurement.id).toBeDefined();
            });
        });
    });
}); 