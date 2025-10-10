import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función simple de logger para consola
const logger = {
    info: (message: string, meta?: any) => {
        console.log(`INFO: ${message}`, meta ? JSON.stringify(meta) : '');
    },
    error: (message: string, meta?: any) => {
        console.error(`ERROR: ${message}`, meta ? JSON.stringify(meta) : '');
    }
};

// Función para generar datos sintéticos de sensores
function generateSensorData(index: number) {
    // Simulamos patrones de aceleración y giro que podrían ocurrir en un vehículo
    // Agregamos algunas variaciones para que los datos parezcan reales

    // Tiempo en segundos desde el inicio de la sesión
    const timeSeconds = index * 0.1; // una lectura cada 100ms

    // Oscilación de baja frecuencia para simular terreno
    const terrainFactor = Math.sin(timeSeconds * 0.5) * 0.3;

    // Oscilación de alta frecuencia para simular vibraciones del motor
    const engineVibration = Math.sin(timeSeconds * 10) * 0.05;

    // Simulamos un giro gradual entre 20-30 segundos
    const turnFactor =
        timeSeconds > 20 && timeSeconds < 30
            ? Math.sin(((timeSeconds - 20) * Math.PI) / 10) * 0.8
            : 0;

    // Simulamos aceleración entre 40-50 segundos
    const accelerationFactor = timeSeconds > 40 && timeSeconds < 50 ? (timeSeconds - 40) * 0.1 : 0;

    // Valor base de velocidad con aceleración y desaceleración en algunos puntos
    let speed = 30;
    if (timeSeconds > 40 && timeSeconds < 50) {
        speed += (timeSeconds - 40) * 2; // Aceleración
    } else if (timeSeconds > 80 && timeSeconds < 90) {
        speed -= (timeSeconds - 80) * 1.5; // Frenado
    }

    // Datos básicos con variaciones
    return {
        acceleration_x: 0.2 + engineVibration + accelerationFactor + Math.random() * 0.1,
        acceleration_y: 0.1 + terrainFactor + turnFactor + Math.random() * 0.1,
        acceleration_z: 0.98 + engineVibration + Math.random() * 0.05,
        gyro_x: 0.5 + terrainFactor * 2 + Math.random() * 0.2,
        gyro_y: -0.3 + turnFactor + Math.random() * 0.2,
        gyro_z: 0.1 + engineVibration + Math.random() * 0.1,
        roll: terrainFactor + Math.random() * 0.03,
        pitch: 0.02 + terrainFactor * 0.5 + Math.random() * 0.02,
        yaw: turnFactor + Math.random() * 0.01,
        lateral_acc: (0.1 + terrainFactor + turnFactor) / 100,
        speed
    };
}

async function importDoback003Data() {
    logger.info('Iniciando importación de datos de DOBACK003');

    try {
        // 1. Verificar si el vehículo ya existe
        let vehicle = await prisma.vehicle.findFirst({
            where: {
                name: 'DOBACK003'
            }
        });

        // 2. Crear el vehículo si no existe
        if (!vehicle) {
            logger.info('Vehículo DOBACK003 no encontrado, creándolo...');
            vehicle = await prisma.vehicle.create({
                data: {
                    name: 'DOBACK003',
                    model: 'Todoterreno Unidad Militar',
                    type: 'UME',
                    plateNumber: 'DOBACK-003',
                    status: 'ACTIVE',
                    organizationId: 1 // Asegúrate de que esta organización existe
                }
            });
            logger.info(`Vehículo DOBACK003 creado con ID: ${vehicle.id}`);
        } else {
            logger.info(`Vehículo DOBACK003 encontrado con ID: ${vehicle.id}`);
        }

        // 3. Verificar si ya existe una sesión para este vehículo con fecha 05-03-2025
        const sessionDate = new Date('2025-03-05T09:28:37');
        let stabilitySession = await prisma.stabilitySession.findFirst({
            where: {
                vehicleId: vehicle.id,
                date: {
                    gte: new Date('2025-03-05T00:00:00'),
                    lt: new Date('2025-03-06T00:00:00')
                }
            }
        });

        // 4. Crear la sesión si no existe
        if (!stabilitySession) {
            logger.info(`Creando nueva sesión de estabilidad para el 05/03/2025`);
            stabilitySession = await prisma.stabilitySession.create({
                data: {
                    vehicleId: vehicle.id,
                    date: sessionDate,
                    status: 'COMPLETED',
                    metrics: JSON.stringify({
                        location: 'Pruebas de estabilidad terreno montañoso',
                        driver: 'Conductor UME',
                        weather: 'Soleado',
                        notes: 'Pruebas de estabilidad en condiciones reales'
                    })
                }
            });
            logger.info(`Sesión de estabilidad creada con ID: ${stabilitySession.id}`);
        } else {
            logger.info(
                `Sesión de estabilidad existente encontrada con ID: ${stabilitySession.id}`
            );
        }

        // 5. Generar datos sintéticos para la sesión
        logger.info(`Generando datos sintéticos para la sesión de estabilidad`);

        // Decidir cuántos puntos de datos generar
        const numberOfDataPoints = 1000; // 1000 puntos = 100 segundos a 10Hz
        let processedLines = 0;

        // Calcular timestamp base
        const baseTimestamp = new Date('2025-03-05T09:28:37');

        // Generar y guardar cada punto de datos
        for (let i = 0; i < numberOfDataPoints; i++) {
            try {
                // Calcular timestamp para este punto
                const timeOffset = i * 100; // 100ms por punto
                const timestamp = new Date(baseTimestamp.getTime() + timeOffset);

                // Generar datos sintéticos
                const sensorData = generateSensorData(i);

                // Crear medición
                const measurement = {
                    timestamp,
                    vehicleId: vehicle.id,
                    sessionId: stabilitySession.id.toString(),
                    data: JSON.stringify(sensorData),
                    metrics: 'STABILITY'
                };

                // Mostrar algunos ejemplos de datos generados
                if (i < 3 || i % 100 === 0) {
                    logger.info(`Generando datos para punto ${i}:`, sensorData);
                }

                // Guardar la medición
                await prisma.measurement.create({
                    data: measurement
                });

                processedLines++;
                if (processedLines % 50 === 0) {
                    logger.info(`Procesados ${processedLines} puntos de datos`);
                }
            } catch (error) {
                logger.error(`Error procesando punto ${i}:`, error);
            }
        }

        logger.info(`Generación completada. Creados ${processedLines} puntos de datos.`);

        // 6. Actualizar la sesión de estabilidad
        await prisma.stabilitySession.update({
            where: { id: stabilitySession.id },
            data: {
                data: JSON.stringify({
                    dataPoints: processedLines,
                    generatedDate: new Date().toISOString(),
                    synthetic: true
                })
            }
        });

        // 7. Crear eventos relacionados con la sesión
        await prisma.event.create({
            data: {
                type: 'STABILITY_SESSION',
                severity: 'INFO',
                message: `Sesión de estabilidad sintética creada para DOBACK003 - 05/03/2025`,
                vehicleId: vehicle.id,
                organizationId: 1,
                status: 'ACTIVE'
            }
        });

        logger.info('Proceso de generación de datos completado con éxito.');
    } catch (error) {
        logger.error('Error durante la generación de datos:', error);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar la función si este archivo se ejecuta directamente
if (require.main === module) {
    importDoback003Data()
        .then(() => {
            logger.info('Script finalizado');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Error en script principal:', error);
            console.error(error);
            process.exit(1);
        });
}

export { importDoback003Data };
