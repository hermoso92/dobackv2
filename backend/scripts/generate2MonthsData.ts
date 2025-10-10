import { PrismaClient } from '@prisma/client';
import { addDays, addHours, addMinutes, format, subDays } from 'date-fns';

const prisma = new PrismaClient();

// Configuración para 2 meses de datos
const DAYS_TO_GENERATE = 60; // 2 meses
const SESSIONS_PER_DAY = 3; // 3 sesiones por día
const DATA_POINTS_PER_SESSION = 1800; // 30 minutos de datos por sesión (1 punto por segundo)

// Vehículos existentes (ajustar según tu base de datos)
const VEHICLE_IDS = [
    'DOBACK022', 'DOBACK023', 'DOBACK024',
    'DOBACK025', 'DOBACK027', 'DOBACK028'
];

// Escenarios de conducción
const SCENARIOS = [
    { name: 'normal', speed: { min: 20, max: 60 }, rpm: { min: 1500, max: 3000 } },
    { name: 'aggressive', speed: { min: 40, max: 100 }, rpm: { min: 2500, max: 5000 } },
    { name: 'emergency', speed: { min: 60, max: 120 }, rpm: { min: 3000, max: 6000 } }
];

// Zonas de operación en Madrid
const OPERATION_ZONES = [
    { name: 'Centro', lat: 40.4168, lng: -3.7038 },
    { name: 'Chamartín', lat: 40.4618, lng: -3.6734 },
    { name: 'Salamanca', lat: 40.4295, lng: -3.6795 },
    { name: 'Retiro', lat: 40.4150, lng: -3.6834 },
    { name: 'Arganzuela', lat: 40.3950, lng: -3.7000 }
];

function getRandomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomScenario() {
    return SCENARIOS[getRandomInt(0, SCENARIOS.length - 1)];
}

function getRandomZone() {
    return OPERATION_ZONES[getRandomInt(0, OPERATION_ZONES.length - 1)];
}

async function generateStabilityData(sessionId: string, startTime: Date, scenario: any) {
    const stabilityData = [];

    for (let i = 0; i < DATA_POINTS_PER_SESSION; i++) {
        const timestamp = addMinutes(startTime, i / 60);

        // Generar datos de estabilidad realistas
        const roll = getRandomFloat(-15, 15); // Grados
        const pitch = getRandomFloat(-10, 10); // Grados
        const yaw = getRandomFloat(-5, 5); // Grados

        // Calcular índice de estabilidad (0-100)
        const stabilityIndex = Math.max(0, 100 - (Math.abs(roll) + Math.abs(pitch) + Math.abs(yaw)) * 2);

        // Determinar nivel de alerta
        let alertLevel = 'NORMAL';
        if (stabilityIndex < 30) alertLevel = 'CRITICAL';
        else if (stabilityIndex < 60) alertLevel = 'WARNING';

        stabilityData.push({
            sessionId,
            timestamp,
            roll,
            pitch,
            yaw,
            stabilityIndex,
            alertLevel,
            lateralAcceleration: getRandomFloat(-2, 2),
            longitudinalAcceleration: getRandomFloat(-1, 1),
            verticalAcceleration: getRandomFloat(-0.5, 0.5)
        });
    }

    return stabilityData;
}

async function generateCANData(sessionId: string, startTime: Date, scenario: any) {
    const canData = [];

    for (let i = 0; i < DATA_POINTS_PER_SESSION; i++) {
        const timestamp = addMinutes(startTime, i / 60);

        // Generar datos CAN según el escenario
        const speed = getRandomFloat(scenario.speed.min, scenario.speed.max);
        const rpm = getRandomFloat(scenario.rpm.min, scenario.rpm.max);

        canData.push({
            sessionId,
            timestamp,
            rpm,
            speed,
            engineTemperature: getRandomFloat(75, 95),
            oilPressure: getRandomFloat(2.5, 4.5),
            fuelLevel: getRandomFloat(20, 100),
            gear: getRandomInt(1, 6),
            transmissionTemperature: getRandomFloat(70, 90),
            brakePressure: getRandomFloat(0, 100),
            brakeTemperature: getRandomFloat(20, 150),
            lateralAcceleration: getRandomFloat(-2, 2),
            longitudinalAcceleration: getRandomFloat(-1, 1),
            steeringAngle: getRandomFloat(-180, 180),
            throttlePosition: getRandomFloat(0, 100),
            brakePosition: getRandomFloat(0, 100)
        });
    }

    return canData;
}

async function generateGPSData(sessionId: string, startTime: Date, scenario: any) {
    const gpsData = [];
    const zone = getRandomZone();

    // Posición inicial
    let currentLat = zone.lat;
    let currentLng = zone.lng;

    for (let i = 0; i < DATA_POINTS_PER_SESSION; i++) {
        const timestamp = addMinutes(startTime, i / 60);

        // Simular movimiento
        const speed = getRandomFloat(scenario.speed.min, scenario.speed.max);
        const heading = getRandomFloat(0, 360);

        // Calcular nueva posición (aproximación simple)
        const distanceKm = (speed / 3600) / 60; // km por segundo
        const latOffset = (distanceKm / 111) * Math.cos(heading * Math.PI / 180);
        const lngOffset = (distanceKm / (111 * Math.cos(currentLat * Math.PI / 180))) * Math.sin(heading * Math.PI / 180);

        currentLat += latOffset;
        currentLng += lngOffset;

        gpsData.push({
            sessionId,
            timestamp,
            latitude: currentLat,
            longitude: currentLng,
            altitude: getRandomFloat(500, 800),
            speed,
            heading,
            satellites: getRandomInt(6, 12),
            accuracy: getRandomFloat(1, 5),
            hdop: getRandomFloat(0.8, 2.5),
            vdop: getRandomFloat(1.2, 3.0)
        });
    }

    return gpsData;
}

async function generateTelemetryEvents(sessionId: string, startTime: Date, scenario: any) {
    const events = [];

    // Generar algunos eventos durante la sesión
    const numEvents = getRandomInt(0, 5);

    for (let i = 0; i < numEvents; i++) {
        const eventTime = addMinutes(startTime, getRandomInt(0, DATA_POINTS_PER_SESSION / 60));

        const eventTypes = [
            { type: 'SPEED_LIMIT_EXCEEDED', severity: 'WARNING', description: 'Velocidad excedida' },
            { type: 'HARD_BRAKING', severity: 'WARNING', description: 'Frenado brusco detectado' },
            { type: 'AGGRESSIVE_ACCELERATION', severity: 'INFO', description: 'Aceleración agresiva' },
            { type: 'SHARP_TURN', severity: 'INFO', description: 'Giro brusco detectado' },
            { type: 'ENGINE_TEMPERATURE_HIGH', severity: 'CRITICAL', description: 'Temperatura del motor elevada' }
        ];

        const eventType = eventTypes[getRandomInt(0, eventTypes.length - 1)];

        events.push({
            sessionId,
            timestamp: eventTime,
            eventType: eventType.type,
            severity: eventType.severity,
            description: eventType.description,
            latitude: getRandomFloat(40.3, 40.6),
            longitude: getRandomFloat(-3.8, -3.6),
            speed: getRandomFloat(0, 120),
            additionalData: JSON.stringify({
                zone: getRandomZone().name,
                scenario: scenario.name
            })
        });
    }

    return events;
}

async function generateMaintenanceTasks() {
    const tasks = [];
    const taskTypes = [
        { type: 'PREVENTIVE', description: 'Mantenimiento preventivo programado' },
        { type: 'CORRECTIVE', description: 'Reparación de avería detectada' },
        { type: 'INSPECTION', description: 'Inspección técnica obligatoria' },
        { type: 'CLEANING', description: 'Limpieza y desinfección' },
        { type: 'CALIBRATION', description: 'Calibración de sensores' }
    ];

    for (const vehicleId of VEHICLE_IDS) {
        // Generar 2-4 tareas por vehículo en los últimos 2 meses
        const numTasks = getRandomInt(2, 4);

        for (let i = 0; i < numTasks; i++) {
            const taskType = taskTypes[getRandomInt(0, taskTypes.length - 1)];
            const scheduledDate = subDays(new Date(), getRandomInt(1, DAYS_TO_GENERATE));
            const completedDate = Math.random() > 0.3 ? addDays(scheduledDate, getRandomInt(0, 7)) : null;

            tasks.push({
                vehicleId,
                type: taskType.type,
                description: taskType.description,
                scheduledDate,
                completedDate,
                status: completedDate ? 'COMPLETED' : (Math.random() > 0.5 ? 'IN_PROGRESS' : 'SCHEDULED'),
                priority: getRandomInt(1, 5),
                estimatedDuration: getRandomInt(30, 240), // minutos
                assignedTo: `Técnico ${getRandomInt(1, 5)}`,
                notes: completedDate ? 'Tarea completada según protocolo' : 'Pendiente de ejecución'
            });
        }
    }

    return tasks;
}

async function generateGeofences() {
    const geofences = [];

    // Geofences para Madrid
    const madridGeofences = [
        { name: 'Base Central Bomberos', type: 'BASE', lat: 40.4168, lng: -3.7038, radius: 500 },
        { name: 'Hospital Gregorio Marañón', type: 'HOSPITAL', lat: 40.4295, lng: -3.6795, radius: 300 },
        { name: 'Aeropuerto Barajas', type: 'AIRPORT', lat: 40.4839, lng: -3.5680, radius: 1000 },
        { name: 'Estación Atocha', type: 'STATION', lat: 40.4075, lng: -3.6917, radius: 400 },
        { name: 'Zona Centro Histórico', type: 'RESTRICTED', lat: 40.4168, lng: -3.7038, radius: 800 }
    ];

    for (const geofence of madridGeofences) {
        geofences.push({
            name: geofence.name,
            type: geofence.type,
            description: `Geocerca para ${geofence.name}`,
            geometryCenter: {
                type: 'Point',
                coordinates: [geofence.lng, geofence.lat]
            },
            geometryRadius: geofence.radius,
            enabled: true,
            organizationId: 1 // Ajustar según tu organización
        });
    }

    return geofences;
}

async function generate2MonthsData() {
    console.log('🚀 Iniciando generación de 2 meses de datos simulados...');

    try {
        // 1. Generar sesiones de telemetría
        console.log('📊 Generando sesiones de telemetría...');
        let sessionCounter = 1;

        for (const vehicleId of VEHICLE_IDS) {
            console.log(`🚗 Procesando vehículo: ${vehicleId}`);

            for (let day = 0; day < DAYS_TO_GENERATE; day++) {
                const currentDate = subDays(new Date(), day);

                for (let session = 0; session < SESSIONS_PER_DAY; session++) {
                    const startTime = addHours(currentDate, getRandomInt(8, 20));
                    const endTime = addMinutes(startTime, 30);
                    const scenario = getRandomScenario();

                    // Crear sesión
                    const sessionData = {
                        id: `session_${sessionCounter}`,
                        vehicleId,
                        startTime,
                        endTime,
                        duration: 30,
                        status: 'COMPLETED',
                        scenario: scenario.name,
                        zone: getRandomZone().name,
                        totalDistance: getRandomFloat(5, 25),
                        averageSpeed: getRandomFloat(scenario.speed.min, scenario.speed.max),
                        maxSpeed: getRandomFloat(scenario.speed.max, scenario.speed.max + 20),
                        fuelConsumed: getRandomFloat(2, 8)
                    };

                    // Generar datos de la sesión
                    const stabilityData = await generateStabilityData(sessionData.id, startTime, scenario);
                    const canData = await generateCANData(sessionData.id, startTime, scenario);
                    const gpsData = await generateGPSData(sessionData.id, startTime, scenario);
                    const events = await generateTelemetryEvents(sessionData.id, startTime, scenario);

                    console.log(`  ✅ Sesión ${sessionCounter}: ${format(startTime, 'dd/MM/yyyy HH:mm')} - ${scenario.name}`);
                    sessionCounter++;
                }
            }
        }

        // 2. Generar tareas de mantenimiento
        console.log('🔧 Generando tareas de mantenimiento...');
        const maintenanceTasks = await generateMaintenanceTasks();
        console.log(`  ✅ ${maintenanceTasks.length} tareas de mantenimiento generadas`);

        // 3. Generar geofences
        console.log('🗺️ Generando geofences...');
        const geofences = await generateGeofences();
        console.log(`  ✅ ${geofences.length} geofences generadas`);

        console.log('\n🎉 Generación de datos completada exitosamente!');
        console.log(`📈 Resumen:`);
        console.log(`   - ${sessionCounter - 1} sesiones de telemetría`);
        console.log(`   - ${maintenanceTasks.length} tareas de mantenimiento`);
        console.log(`   - ${geofences.length} geofences`);
        console.log(`   - Período: ${DAYS_TO_GENERATE} días (2 meses)`);

    } catch (error) {
        console.error('❌ Error generando datos:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    generate2MonthsData();
}

export { generate2MonthsData };
