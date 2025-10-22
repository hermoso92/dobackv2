
import { EventService } from '../../services/EventService';
import { NotificationService } from '../../services/NotificationService';
import { StabilityProcessor } from '../../services/StabilityProcessor';
import { ValidationService } from '../../services/ValidationService';
import { createMockLogger } from '../../test/utils';
import { EventSeverity, EventStatus, EventType } from '../../types/enums';
import { StabilityMeasurements } from '../../types/stability';

describe('Vehicle Monitoring Integration Tests', () => {
    let prisma: PrismaClient;
    let stabilityProcessor: StabilityProcessor;
    let eventService: EventService;
    let notificationService: NotificationService;
    let validationService: ValidationService;
    let mockLogger: any;

    beforeAll(async () => {
        prisma = new PrismaClient();
        mockLogger = createMockLogger();
        stabilityProcessor = new StabilityProcessor();
        notificationService = new NotificationService();
        eventService = new EventService(notificationService);
        validationService = new ValidationService();

        // Limpiar datos de prueba
        await prisma.event.deleteMany();
        await prisma.measurement.deleteMany();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('Telemetry Processing Flow', () => {
        const testMeasurement: StabilityMeasurements = {
            timestamp: new Date(),
            vehicleId: "TEST-001",
            sessionId: "test-session",
            accelerometer: {
                x: 0.1,
                y: 0.2,
                z: 9.81
            },
            gyroscope: {
                x: 0.01,
                y: 0.02,
                z: 0.03
            },
            location: {
                latitude: 40.4168,
                longitude: -3.7038,
                altitude: 667
            },
            loadCells: {
                frontLeft: 0.3,
                frontRight: 0.3,
                rearLeft: 0.2,
                rearRight: 0.2
            }
        };

        it('should process telemetry data and generate events', async () => {
            // 1. Validar datos de telemetría
            const validationResult = validationService.validateStabilityData({
                timestamp: testMeasurement.timestamp.getTime(),
                roll: Math.atan2(testMeasurement.accelerometer.y, testMeasurement.accelerometer.z) * 180 / Math.PI,
                pitch: Math.atan2(-testMeasurement.accelerometer.x,
                    Math.sqrt(Math.pow(testMeasurement.accelerometer.y, 2) + Math.pow(testMeasurement.accelerometer.z, 2))) * 180 / Math.PI,
                yaw: Math.atan2(testMeasurement.gyroscope.z, testMeasurement.gyroscope.x),
                acc_x: testMeasurement.accelerometer.x,
                acc_y: testMeasurement.accelerometer.y,
                acc_z: testMeasurement.accelerometer.z,
                load_fl: testMeasurement.loadCells.frontLeft,
                load_fr: testMeasurement.loadCells.frontRight,
                load_rl: testMeasurement.loadCells.rearLeft,
                load_rr: testMeasurement.loadCells.rearRight,
                lat: testMeasurement.location.latitude,
                lon: testMeasurement.location.longitude,
                alt: testMeasurement.location.altitude,
                vehicle_id: testMeasurement.vehicleId,
                session_id: testMeasurement.sessionId
            });
            expect(validationResult.isValid).toBe(true);

            // 2. Procesar mediciones
            const metrics = stabilityProcessor.processMeasurements([testMeasurement]);
            expect(metrics).toBeDefined();
            expect(metrics.ltr).toBeDefined();
            expect(metrics.ssf).toBeDefined();
            expect(metrics.drs).toBeDefined();
            expect(metrics.rsc).toBeDefined();

            // 3. Generar eventos si es necesario
            if (metrics.ltr > 0.8) {
                const event = await eventService.createEvent({
                    type: EventType.STABILITY_WARNING,
                    severity: EventSeverity.HIGH,
                    description: 'Alta transferencia de carga detectada',
                    vehicleId: parseInt(testMeasurement.vehicleId),
                    organizationId: 1,
                    context: {
                        metrics,
                        location: testMeasurement.location
                    }
                });

                expect(event).toBeDefined();
                expect(event.type).toBe(EventType.STABILITY_WARNING);
                expect(event.severity).toBe(EventSeverity.HIGH);
                expect(event.status).toBe(EventStatus.ACTIVE);
            }
        });

        it('should handle critical stability events', async () => {
            // 1. Crear medición con valores críticos
            const criticalMeasurement: StabilityMeasurements = {
                ...testMeasurement,
                accelerometer: {
                    x: 0.5,
                    y: 5.0,  // Alta aceleración lateral
                    z: 9.81
                },
                loadCells: {
                    frontLeft: 0.1,
                    frontRight: 0.9,  // Alta transferencia de carga
                    rearLeft: 0.1,
                    rearRight: 0.9
                }
            };

            // 2. Procesar mediciones críticas
            const metrics = stabilityProcessor.processMeasurements([criticalMeasurement]);
            expect(metrics.ltr).toBeGreaterThan(0.8);  // Debe superar el umbral crítico

            // 3. Verificar generación de evento crítico
            const event = await eventService.createEvent({
                type: EventType.STABILITY_WARNING,
                severity: EventSeverity.CRITICAL,
                description: 'Riesgo crítico de vuelco detectado',
                vehicleId: parseInt(criticalMeasurement.vehicleId),
                organizationId: 1,
                context: {
                    metrics,
                    location: criticalMeasurement.location
                }
            });

            expect(event).toBeDefined();
            expect(event.severity).toBe(EventSeverity.CRITICAL);

            // 4. Verificar notificaciones
            const notifications = await notificationService.getNotificationsByVehicleId(criticalMeasurement.vehicleId);
            expect(notifications).toContainEqual(
                expect.objectContaining({
                    type: 'CRITICAL_ALERT',
                    message: expect.stringContaining('Riesgo crítico de vuelco')
                })
            );
        });

        it('should handle data validation errors', async () => {
            // 1. Crear medición con datos inválidos
            const invalidMeasurement: StabilityMeasurements = {
                ...testMeasurement,
                accelerometer: {
                    x: NaN,
                    y: Infinity,
                    z: -Infinity
                },
                loadCells: {
                    frontLeft: -1,
                    frontRight: 2,
                    rearLeft: NaN,
                    rearRight: Infinity
                }
            };

            // 2. Validar datos inválidos
            const validationResult = validationService.validateStabilityData({
                timestamp: invalidMeasurement.timestamp.getTime(),
                roll: 0,
                pitch: 0,
                yaw: 0,
                acc_x: invalidMeasurement.accelerometer.x,
                acc_y: invalidMeasurement.accelerometer.y,
                acc_z: invalidMeasurement.accelerometer.z,
                load_fl: invalidMeasurement.loadCells.frontLeft,
                load_fr: invalidMeasurement.loadCells.frontRight,
                load_rl: invalidMeasurement.loadCells.rearLeft,
                load_rr: invalidMeasurement.loadCells.rearRight,
                lat: invalidMeasurement.location.latitude,
                lon: invalidMeasurement.location.longitude,
                alt: invalidMeasurement.location.altitude,
                vehicle_id: invalidMeasurement.vehicleId,
                session_id: invalidMeasurement.sessionId
            });

            expect(validationResult.isValid).toBe(false);
            expect(validationResult.errors.length).toBeGreaterThan(0);

            // 3. Verificar generación de evento de error
            const event = await eventService.createEvent({
                type: EventType.SENSOR_ERROR,
                severity: EventSeverity.HIGH,
                description: 'Datos de sensores inválidos detectados',
                vehicleId: parseInt(invalidMeasurement.vehicleId),
                organizationId: 1,
                context: {
                    validationErrors: validationResult.errors,
                    rawData: invalidMeasurement
                }
            });

            expect(event).toBeDefined();
            expect(event.type).toBe(EventType.SENSOR_ERROR);
        });

        it('should handle multiple measurements in sequence', async () => {
            // 1. Crear secuencia de mediciones
            const measurements: StabilityMeasurements[] = [
                testMeasurement,
                {
                    ...testMeasurement,
                    timestamp: new Date(testMeasurement.timestamp.getTime() + 1000),
                    accelerometer: {
                        x: 0.2,
                        y: 0.3,
                        z: 9.81
                    }
                },
                {
                    ...testMeasurement,
                    timestamp: new Date(testMeasurement.timestamp.getTime() + 2000),
                    accelerometer: {
                        x: 0.3,
                        y: 0.4,
                        z: 9.81
                    }
                }
            ];

            // 2. Procesar secuencia
            const metricsSequence = measurements.map(m =>
                stabilityProcessor.processMeasurements([m])
            );

            // 3. Verificar tendencias
            expect(metricsSequence[2].lateralAcceleration)
                .toBeGreaterThan(metricsSequence[0].lateralAcceleration);

            // 4. Generar evento si hay tendencia peligrosa
            if (metricsSequence[2].lateralAcceleration > 0.5) {
                const event = await eventService.createEvent({
                    type: EventType.STABILITY_WARNING,
                    severity: EventSeverity.MEDIUM,
                    description: 'Tendencia creciente en aceleración lateral',
                    vehicleId: parseInt(testMeasurement.vehicleId),
                    organizationId: 1,
                    context: {
                        metrics: metricsSequence[2],
                        trend: {
                            start: metricsSequence[0].lateralAcceleration,
                            end: metricsSequence[2].lateralAcceleration,
                            duration: 2000
                        }
                    }
                });

                expect(event).toBeDefined();
                expect(event.type).toBe(EventType.STABILITY_WARNING);
                expect(event.severity).toBe(EventSeverity.MEDIUM);
            }
        });
    });
}); 