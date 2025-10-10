import { beforeEach, describe, expect, it } from 'vitest';
import {
    CANPoint,
    generateStabilityEvents,
    GPSPoint,
    StabilityDataPoint
} from '../../src/services/StabilityEventService';

describe('StabilityEventService - generateStabilityEvents', () => {
    let mockStabilityData: StabilityDataPoint[];
    let mockGpsData: GPSPoint[];
    let mockCanData: CANPoint[];
    const sessionId = 'test-session-123';

    beforeEach(() => {
        // Datos de prueba base
        mockStabilityData = [
            {
                timestamp: '2024-01-01T10:00:00Z',
                si: 0.2,
                roll: 10,
                pitch: 5,
                ay: 0.4,
                gz: 20,
                time: 1704110400000
            },
            {
                timestamp: '2024-01-01T10:00:05Z',
                si: 0.1,
                roll: 15,
                pitch: 8,
                ay: 0.6,
                gz: 30,
                time: 1704110405000
            }
        ];

        mockGpsData = [
            {
                timestamp: '2024-01-01T10:00:00Z',
                latitude: 40.4168,
                longitude: -3.7038,
                speed: 60
            },
            {
                timestamp: '2024-01-01T10:00:05Z',
                latitude: 40.4169,
                longitude: -3.7039,
                speed: 65
            }
        ];

        mockCanData = [
            {
                timestamp: '2024-01-01T10:00:00Z',
                engineRPM: 2000,
                vehicleSpeed: 60,
                rotativo: true
            },
            {
                timestamp: '2024-01-01T10:00:05Z',
                engineRPM: 2200,
                vehicleSpeed: 65,
                rotativo: true
            }
        ];
    });

    describe('Filtros de contexto', () => {
        it('debe descartar eventos cuando el motor está apagado', () => {
            const canDataWithEngineOff = [
                {
                    timestamp: '2024-01-01T10:00:00Z',
                    engineRPM: 0,
                    vehicleSpeed: 60,
                    rotativo: false
                }
            ];

            const events = generateStabilityEvents(
                mockStabilityData,
                mockGpsData,
                canDataWithEngineOff,
                sessionId
            );

            expect(events).toHaveLength(0);
        });

        it('debe descartar eventos cuando la velocidad es muy baja', () => {
            const gpsDataWithLowSpeed = [
                {
                    timestamp: '2024-01-01T10:00:00Z',
                    latitude: 40.4168,
                    longitude: -3.7038,
                    speed: 3 // Velocidad muy baja
                }
            ];

            const events = generateStabilityEvents(
                mockStabilityData,
                gpsDataWithLowSpeed,
                mockCanData,
                sessionId
            );

            expect(events).toHaveLength(0);
        });

        it('debe descartar eventos cuando SI es muy alto (estabilidad buena)', () => {
            const stabilityDataWithHighSI = [
                {
                    timestamp: '2024-01-01T10:00:00Z',
                    si: 0.8, // SI alto = estabilidad buena
                    roll: 10,
                    pitch: 5,
                    ay: 0.4,
                    gz: 20,
                    time: 1704110400000
                }
            ];

            const events = generateStabilityEvents(
                stabilityDataWithHighSI,
                mockGpsData,
                mockCanData,
                sessionId
            );

            expect(events).toHaveLength(0);
        });
    });

    describe('Detección de eventos críticos', () => {
        it('debe detectar evento crítico con SI muy bajo', () => {
            const stabilityDataCritical = [
                {
                    timestamp: '2024-01-01T10:00:00Z',
                    si: 0.05, // SI muy bajo
                    roll: 10,
                    pitch: 5,
                    ay: 0.4,
                    gz: 20,
                    time: 1704110400000
                }
            ];

            const events = generateStabilityEvents(
                stabilityDataCritical,
                mockGpsData,
                mockCanData,
                sessionId
            );

            expect(events).toHaveLength(1);
            expect(events[0].level).toBe('critical');
            expect(events[0].tipos).toContain('riesgo_de_vuelco');
        });

        it('debe detectar vuelco inminente con roll alto', () => {
            const stabilityDataRollover = [
                {
                    timestamp: '2024-01-01T10:00:00Z',
                    si: 0.1,
                    roll: 25, // Roll muy alto
                    pitch: 15,
                    ay: 0.4,
                    gz: 20,
                    time: 1704110400000
                }
            ];

            const events = generateStabilityEvents(
                stabilityDataRollover,
                mockGpsData,
                mockCanData,
                sessionId
            );

            expect(events).toHaveLength(1);
            expect(events[0].tipos).toContain('vuelco_inminente');
            expect(events[0].level).toBe('critical');
        });

        it('debe detectar maniobra brusca con aceleración lateral alta', () => {
            const stabilityDataManeuver = [
                {
                    timestamp: '2024-01-01T10:00:00Z',
                    si: 0.3,
                    roll: 5,
                    pitch: 2,
                    ay: 0.8, // Aceleración lateral alta
                    gz: 40,
                    time: 1704110400000
                }
            ];

            const events = generateStabilityEvents(
                stabilityDataManeuver,
                mockGpsData,
                mockCanData,
                sessionId
            );

            expect(events).toHaveLength(1);
            expect(events[0].tipos).toContain('maniobra_brusca');
        });
    });

    describe('Agrupación de eventos', () => {
        it('debe agrupar eventos cercanos en tiempo y espacio', () => {
            const stabilityDataMultiple = [
                {
                    timestamp: '2024-01-01T10:00:00Z',
                    si: 0.1,
                    roll: 10,
                    pitch: 5,
                    ay: 0.4,
                    gz: 20,
                    time: 1704110400000
                },
                {
                    timestamp: '2024-01-01T10:00:02Z', // 2 segundos después
                    si: 0.15,
                    roll: 12,
                    pitch: 6,
                    ay: 0.5,
                    gz: 25,
                    time: 1704110402000
                }
            ];

            const gpsDataMultiple = [
                {
                    timestamp: '2024-01-01T10:00:00Z',
                    latitude: 40.4168,
                    longitude: -3.7038,
                    speed: 60
                },
                {
                    timestamp: '2024-01-01T10:00:02Z',
                    latitude: 40.41681, // Muy cerca
                    longitude: -3.70381,
                    speed: 62
                }
            ];

            const events = generateStabilityEvents(
                stabilityDataMultiple,
                gpsDataMultiple,
                mockCanData,
                sessionId
            );

            // Debería agrupar en un solo evento
            expect(events).toHaveLength(1);
            expect(events[0].tipos).toContain('riesgo_de_vuelco');
        });
    });

    describe('Casos límite', () => {
        it('debe manejar datos vacíos', () => {
            const events = generateStabilityEvents([], [], [], sessionId);
            expect(events).toHaveLength(0);
        });

        it('debe manejar datos sin GPS', () => {
            const events = generateStabilityEvents(mockStabilityData, [], mockCanData, sessionId);
            expect(events).toHaveLength(0);
        });

        it('debe manejar datos sin CAN', () => {
            const events = generateStabilityEvents(mockStabilityData, mockGpsData, [], sessionId);
            expect(events).toHaveLength(0);
        });

        it('debe manejar timestamps no coincidentes', () => {
            const gpsDataDifferentTime = [
                {
                    timestamp: '2024-01-01T11:00:00Z', // Hora diferente
                    latitude: 40.4168,
                    longitude: -3.7038,
                    speed: 60
                }
            ];

            const events = generateStabilityEvents(
                mockStabilityData,
                gpsDataDifferentTime,
                mockCanData,
                sessionId
            );

            expect(events).toHaveLength(0);
        });
    });

    describe('Validación de estructura de eventos', () => {
        it('debe generar eventos con estructura correcta', () => {
            const events = generateStabilityEvents(
                mockStabilityData,
                mockGpsData,
                mockCanData,
                sessionId
            );

            if (events.length > 0) {
                const event = events[0];

                expect(event).toHaveProperty('id');
                expect(event).toHaveProperty('sessionId', sessionId);
                expect(event).toHaveProperty('timestamp');
                expect(event).toHaveProperty('lat');
                expect(event).toHaveProperty('lon');
                expect(event).toHaveProperty('level');
                expect(event).toHaveProperty('perc');
                expect(event).toHaveProperty('tipos');
                expect(event).toHaveProperty('valores');
                expect(event).toHaveProperty('can');

                expect(Array.isArray(event.tipos)).toBe(true);
                expect(typeof event.level).toBe('string');
                expect(['critical', 'danger', 'moderate']).toContain(event.level);
                expect(typeof event.perc).toBe('number');
                expect(event.perc >= 0 && event.perc <= 1).toBe(true);
            }
        });
    });
});
