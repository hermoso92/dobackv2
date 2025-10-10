import { eventService } from '../services/events.js';
import { CreateEventDTO, EventStatus, EventType } from '../types/events.js';
import { logger } from './logger.js';
interface TestEvent {
    type: EventType;
    description: string;
    vehicleId: string;
    organizationId: string;
}

const testEvents: TestEvent[] = [
    // Test 1: Valores mínimos
    {
        type: EventType.STABILITY,
        description: 'Test event 1',
        vehicleId: '388f72c2-011e-4444-bedb-6aeb647cefa1',
        organizationId: '09e08ff8-cd21-4f22-8543-389554360787'
    },
    // Test 2: Valores reales
    {
        type: EventType.STABILITY,
        description: 'Test event with real values',
        vehicleId: '71570269-4ba2-4c07-95be-10d3f24fc226',
        organizationId: '09e08ff8-cd21-4f22-8543-389554360787'
    },
    // Test 3: Valores máximos
    {
        type: EventType.STABILITY,
        description: 'Test event with max values',
        vehicleId: '44de2cc4-1f15-4841-b65e-bc263dd5236f',
        organizationId: '09e08ff8-cd21-4f22-8543-389554360787'
    }
];

export const testEventCreation = async () => {
    logger.info('Iniciando pruebas de creación de eventos');

    for (const [index, event] of testEvents.entries()) {
        try {
            logger.info(`Probando evento ${index + 1}:`, event);

            const createEventDTO: CreateEventDTO = {
                name: `Test Event ${index + 1}`,
                description: event.description,
                estado: EventStatus.ACTIVE,
                tipo: event.type,
                isPredefined: false,
                conditions: [],
                vehicles: [event.vehicleId]
            };

            const response = await eventService.createEvent(createEventDTO, event.organizationId);

            logger.info(`Evento ${index + 1} creado exitosamente:`, response);
        } catch (error) {
            logger.error(`Error en evento ${index + 1}:`, {
                error,
                event,
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    logger.info('Pruebas de creación de eventos completadas');
};

// Función para probar diferentes formatos de vehicleId
export const testVehicleIdFormats = async () => {
    const vehicleIds = [
        1,          // Número entero positivo
        '1',        // String numérico
        '388',      // String numérico real
        388,        // Número entero real
        'abc',      // String no numérico
        -1,         // Número negativo
        0,          // Cero
        null,       // Null
        undefined   // Undefined
    ];

    logger.info('Iniciando pruebas de formatos de vehicleId');

    for (const vehicleId of vehicleIds) {
        try {
            const createEventDTO: CreateEventDTO = {
                name: `Test Event with vehicleId ${vehicleId}`,
                description: `Test event with vehicleId: ${vehicleId}`,
                estado: EventStatus.ACTIVE,
                tipo: EventType.STABILITY,
                isPredefined: false,
                conditions: [],
                vehicles: [vehicleId?.toString() || '']
            };

            logger.info('Probando vehicleId:', vehicleId);

            const response = await eventService.createEvent(createEventDTO, testEvents[0].organizationId);

            logger.info(`Evento creado exitosamente con vehicleId ${vehicleId}:`, response);
        } catch (error) {
            logger.error(`Error con vehicleId ${vehicleId}:`, {
                error,
                vehicleId,
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    logger.info('Pruebas de formatos de vehicleId completadas');
};

// Función para probar diferentes tipos de eventos
export const testEventTypes = async () => {
    const eventTypes = [
        EventType.STABILITY,
        EventType.CAN,
        EventType.COMBINED
    ];

    logger.info('Iniciando pruebas de tipos de eventos');

    for (const type of eventTypes) {
        try {
            const createEventDTO: CreateEventDTO = {
                name: `Test Event with type ${type}`,
                description: `Test event with type: ${type}`,
                estado: EventStatus.ACTIVE,
                tipo: type,
                isPredefined: false,
                conditions: [],
                vehicles: ['388f72c2-011e-4444-bedb-6aeb647cefa1']
            };

            logger.info('Probando tipo:', type);

            const response = await eventService.createEvent(createEventDTO, testEvents[0].organizationId);

            logger.info(`Evento creado exitosamente con tipo ${type}:`, response);
        } catch (error) {
            logger.error(`Error con tipo ${type}:`, {
                error,
                type,
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    logger.info('Pruebas de tipos de eventos completadas');
};

// Función para probar diferentes estados
export const testEventStatuses = async () => {
    const statuses = [
        EventStatus.ACTIVE,
        EventStatus.INACTIVE,
        EventStatus.TRIGGERED,
        EventStatus.RESOLVED
    ];

    logger.info('Iniciando pruebas de estados de eventos');

    for (const status of statuses) {
        try {
            const createEventDTO: CreateEventDTO = {
                name: `Test Event with status ${status}`,
                description: `Test event with status: ${status}`,
                estado: status,
                tipo: EventType.STABILITY,
                isPredefined: false,
                conditions: [],
                vehicles: ['388f72c2-011e-4444-bedb-6aeb647cefa1']
            };

            logger.info('Probando estado:', status);

            const response = await eventService.createEvent(createEventDTO, testEvents[0].organizationId);

            logger.info(`Evento creado exitosamente con estado ${status}:`, response);
        } catch (error) {
            logger.error(`Error con estado ${status}:`, {
                error,
                status,
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    logger.info('Pruebas de estados de eventos completadas');
};

export const runAllTests = async () => {
    await testEventCreation();
    await testVehicleIdFormats();
    await testEventTypes();
    await testEventStatuses();
}; 