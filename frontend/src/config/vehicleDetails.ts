export const BOMBEROS_MADRID_VEHICLE_DETAILS: { [key: string]: any } = {
    1: {
        id: 1,
        name: "Bomba Escalera 1",
        model: "Rosenbauer AT",
        plateNumber: "M-1234-BM",
        organizationId: 1,
        status: "ACTIVE",
        type: "BOMBA_ESCALERA",
        brand: "Rosenbauer",
        createdAt: new Date(),
        updatedAt: new Date(),
        stats: {
            totalSessions: 12,
            sessionsWithEvents: 3,
            totalDistance: 1200,
            totalDuration: 340,
            averageSpeed: 45,
            lastMaintenance: "2024-06-01T10:00:00.000Z",
            nextMaintenance: "2024-07-01T10:00:00.000Z",
            activeAlarms: 2,
            waterPressure: 8.5,
            foamConcentration: 3.2
        },
        stabilitySessions: [
            { id: 101, date: "2024-06-10T12:34:56.789Z" },
            { id: 102, date: "2024-06-09T11:20:00.000Z" }
        ],
        events: [
            { id: 201, message: "Evento crítico", severity: "HIGH", timestamp: "2024-06-10T12:34:56.789Z" },
            { id: 202, message: "Alerta leve", severity: "MEDIUM", timestamp: "2024-06-09T11:20:00.000Z" }
        ],
        alarms: [
            { id: 301, type: "OVERSTEER", status: "ACTIVE", severity: "HIGH", message: "Riesgo de vuelco" }
        ]
    },
    2: {
        id: 2,
        name: "Nodriza 2",
        model: "Iveco Magirus",
        plateNumber: "M-2345-BM",
        organizationId: 1,
        status: "ACTIVE",
        type: "NODRIZA",
        brand: "Iveco",
        createdAt: new Date(),
        updatedAt: new Date(),
        stats: {
            totalSessions: 8,
            sessionsWithEvents: 2,
            totalDistance: 900,
            totalDuration: 220,
            averageSpeed: 50,
            lastMaintenance: "2024-05-20T10:00:00.000Z",
            nextMaintenance: "2024-06-20T10:00:00.000Z",
            activeAlarms: 1,
            waterPressure: 8.2,
            foamConcentration: 2.8
        },
        stabilitySessions: [
            { id: 103, date: "2024-06-09T09:12:00.000Z" }
        ],
        events: [
            { id: 203, message: "Alerta de presión", severity: "MEDIUM", timestamp: "2024-06-09T09:12:00.000Z" }
        ],
        alarms: [
            { id: 302, type: "PRESSURE", status: "ACTIVE", severity: "MEDIUM", message: "Presión baja" }
        ]
    },
    3: {
        id: 3,
        name: "Autoescala 3",
        model: "Mercedes-Benz Atego",
        plateNumber: "M-3456-BM",
        organizationId: 1,
        status: "MAINTENANCE",
        type: "AUTOESCALA",
        brand: "Mercedes-Benz",
        createdAt: new Date(),
        updatedAt: new Date(),
        stats: {
            totalSessions: 5,
            sessionsWithEvents: 1,
            totalDistance: 600,
            totalDuration: 150,
            averageSpeed: 40,
            lastMaintenance: "2024-06-05T10:00:00.000Z",
            nextMaintenance: "2024-07-05T10:00:00.000Z",
            activeAlarms: 3,
            waterPressure: 7.9,
            foamConcentration: 2.5
        },
        stabilitySessions: [
            { id: 104, date: "2024-06-08T15:20:00.000Z" }
        ],
        events: [
            { id: 204, message: "Mantenimiento programado", severity: "LOW", timestamp: "2024-06-08T15:20:00.000Z" }
        ],
        alarms: [
            { id: 303, type: "MAINTENANCE", status: "ACTIVE", severity: "LOW", message: "En mantenimiento" }
        ]
    },
    4: {
        id: 4,
        name: "Bomba Urbana 4",
        model: "Scania P320",
        plateNumber: "M-4567-BM",
        organizationId: 1,
        status: "ACTIVE",
        type: "BOMBA_URBANA",
        brand: "Scania",
        createdAt: new Date(),
        updatedAt: new Date(),
        stats: {
            totalSessions: 10,
            sessionsWithEvents: 2,
            totalDistance: 1100,
            totalDuration: 300,
            averageSpeed: 48,
            lastMaintenance: "2024-06-03T10:00:00.000Z",
            nextMaintenance: "2024-07-03T10:00:00.000Z",
            activeAlarms: 0,
            waterPressure: 8.7,
            foamConcentration: 3.0
        },
        stabilitySessions: [
            { id: 105, date: "2024-06-10T08:00:00.000Z" }
        ],
        events: [
            { id: 205, message: "Operación exitosa", severity: "LOW", timestamp: "2024-06-10T08:00:00.000Z" }
        ],
        alarms: []
    },
    5: {
        id: 5,
        name: "Unidad de Rescate 5",
        model: "MAN TGM",
        plateNumber: "M-5678-BM",
        organizationId: 1,
        status: "ACTIVE",
        type: "UNIDAD_RESCATE",
        brand: "MAN",
        createdAt: new Date(),
        updatedAt: new Date(),
        stats: {
            totalSessions: 7,
            sessionsWithEvents: 2,
            totalDistance: 800,
            totalDuration: 180,
            averageSpeed: 42,
            lastMaintenance: "2024-06-02T10:00:00.000Z",
            nextMaintenance: "2024-07-02T10:00:00.000Z",
            activeAlarms: 1,
            waterPressure: 8.0,
            foamConcentration: 2.9
        },
        stabilitySessions: [
            { id: 106, date: "2024-06-07T18:45:00.000Z" }
        ],
        events: [
            { id: 206, message: "Rescate exitoso", severity: "HIGH", timestamp: "2024-06-07T18:45:00.000Z" }
        ],
        alarms: [
            { id: 304, type: "RESCUE", status: "ACTIVE", severity: "HIGH", message: "Rescate en curso" }
        ]
    }
}; 