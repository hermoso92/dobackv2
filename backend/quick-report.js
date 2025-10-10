const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function generateQuickReport() {
    try {
        console.log('📊 GENERANDO REPORTE RÁPIDO DEL SISTEMA...');

        // Estadísticas básicas
        const totalSessions = await prisma.session.count();
        const totalStabilityMeasurements = await prisma.stabilityMeasurement.count();
        const totalCanMeasurements = await prisma.canMeasurement.count();
        const totalGpsMeasurements = await prisma.gpsMeasurement.count();
        const totalRotativoMeasurements = await prisma.rotativoMeasurement.count();

        // Sesiones por vehículo (sin groupBy problemático)
        const sessions = await prisma.session.findMany({
            include: {
                vehicle: {
                    select: {
                        name: true
                    }
                }
            }
        });

        const vehicleStats = {};
        sessions.forEach(session => {
            const vehicleName = session.vehicle?.name || 'Desconocido';
            if (!vehicleStats[vehicleName]) {
                vehicleStats[vehicleName] = 0;
            }
            vehicleStats[vehicleName]++;
        });

        // Sesiones recientes
        const recentSessions = await prisma.session.findMany({
            take: 10,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                vehicle: {
                    select: {
                        name: true
                    }
                },
                _count: {
                    select: {
                        stabilityMeasurements: true,
                        canMeasurements: true,
                        gpsMeasurements: true,
                        rotativoMeasurements: true
                    }
                }
            }
        });

        // Generar reporte
        const report = `
🎉 REPORTE RÁPIDO DEL SISTEMA DE PROCESAMIENTO
=============================================
📅 Fecha: ${new Date().toLocaleString('es-ES')}

📊 ESTADÍSTICAS GENERALES:
- Sesiones totales: ${totalSessions}
- Mediciones de estabilidad: ${totalStabilityMeasurements.toLocaleString()}
- Mediciones CAN: ${totalCanMeasurements.toLocaleString()}
- Mediciones GPS: ${totalGpsMeasurements.toLocaleString()}
- Mediciones Rotativo: ${totalRotativoMeasurements.toLocaleString()}
- TOTAL MEDICIONES: ${(totalStabilityMeasurements + totalCanMeasurements + totalGpsMeasurements + totalRotativoMeasurements).toLocaleString()}

🚗 SESIONES POR VEHÍCULO:
${Object.entries(vehicleStats).map(([vehicle, count]) => `- ${vehicle}: ${count} sesiones`).join('\n')}

📅 SESIONES RECIENTES (últimas 10):
${recentSessions.map(session => {
    const total = session._count.stabilityMeasurements + session._count.canMeasurements + 
                  session._count.gpsMeasurements + session._count.rotativoMeasurements;
    return `- ${session.vehicle?.name || 'N/A'}: ${total.toLocaleString()} mediciones (${new Date(session.startTime).toLocaleDateString('es-ES')})`;
}).join('\n')}

🔍 ANÁLISIS DE LOGS:
- Log principal: ${fs.existsSync('processing-log.txt') ? '✅ Generado' : '❌ No encontrado'}
- Log de errores: ${fs.existsSync('processing-errors.txt') ? '✅ Generado' : '❌ No encontrado'}
- Log de progreso: ${fs.existsSync('processing-progress.txt') ? '✅ Generado' : '❌ No encontrado'}

📋 PROBLEMAS IDENTIFICADOS:
1. ❌ Error de constraint único: (sessionId, timestamp) duplicado
2. ❌ Algunos archivos fallan al procesar mediciones
3. ⚠️ El archivo de errores es muy grande (>200MB)

🔧 RECOMENDACIONES:
1. Usar timestamps únicos para evitar duplicados
2. Implementar skipDuplicates en createMany
3. Agregar validación de datos antes de insertar
4. Implementar sistema de seguimiento de archivos procesados

=============================================
        `;

        console.log(report);

        // Guardar reporte
        fs.writeFileSync('quick-report.txt', report);
        console.log('\n✅ Reporte guardado en: quick-report.txt');

    } catch (error) {
        console.error('❌ Error generando reporte:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

generateQuickReport();
