const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function generateSimpleReport() {
    try {
        console.log('📊 GENERANDO REPORTE SIMPLE DEL SISTEMA...');

        // Estadísticas básicas
        const totalSessions = await prisma.session.count();
        const totalStabilityMeasurements = await prisma.stabilityMeasurement.count();
        const totalCanMeasurements = await prisma.canMeasurement.count();
        const totalGpsMeasurements = await prisma.gpsMeasurement.count();
        const totalRotativoMeasurements = await prisma.rotativoMeasurement.count();

        // Obtener algunas sesiones recientes
        const recentSessions = await prisma.session.findMany({
            take: 10,
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Contar archivos de log
        const logFiles = {
            'processing-log.txt': fs.existsSync('processing-log.txt'),
            'processing-errors.txt': fs.existsSync('processing-errors.txt'),
            'processing-progress.txt': fs.existsSync('processing-progress.txt')
        };

        // Verificar tamaño de archivo de errores
        let errorFileSize = 0;
        if (logFiles['processing-errors.txt']) {
            const stats = fs.statSync('processing-errors.txt');
            errorFileSize = Math.round(stats.size / (1024 * 1024)); // MB
        }

        // Generar reporte
        const report = `
🎉 REPORTE SIMPLE DEL SISTEMA DE PROCESAMIENTO
==============================================
📅 Fecha: ${new Date().toLocaleString('es-ES')}

📊 ESTADÍSTICAS GENERALES:
- Sesiones totales: ${totalSessions}
- Mediciones de estabilidad: ${totalStabilityMeasurements.toLocaleString()}
- Mediciones CAN: ${totalCanMeasurements.toLocaleString()}
- Mediciones GPS: ${totalGpsMeasurements.toLocaleString()}
- Mediciones Rotativo: ${totalRotativoMeasurements.toLocaleString()}
- TOTAL MEDICIONES: ${(totalStabilityMeasurements + totalCanMeasurements + totalGpsMeasurements + totalRotativoMeasurements).toLocaleString()}

📅 SESIONES RECIENTES (últimas 10):
${recentSessions.map((session, index) => {
    return `${index + 1}. ID: ${session.id.substring(0, 8)}... | ${new Date(session.startTime).toLocaleDateString('es-ES')} | ${session.status}`;
}).join('\n')}

🔍 ARCHIVOS DE LOG GENERADOS:
${Object.entries(logFiles).map(([file, exists]) => 
    `- ${file}: ${exists ? '✅ Generado' : '❌ No encontrado'}`
).join('\n')}

📋 INFORMACIÓN DE ERRORES:
- Tamaño del archivo de errores: ${errorFileSize} MB
- ${errorFileSize > 100 ? '⚠️ Archivo de errores muy grande - muchos errores detectados' : '✅ Archivo de errores de tamaño normal'}

🔧 PROBLEMAS IDENTIFICADOS:
1. ❌ Error de constraint único: (sessionId, timestamp) duplicado
   - Causa: Múltiples archivos con timestamps similares
   - Solución: Usar timestamps únicos o skipDuplicates

2. ❌ Archivo de errores muy grande (${errorFileSize} MB)
   - Indica muchos errores durante el procesamiento
   - Necesita revisión de la lógica de inserción

3. ⚠️ Falta sistema de seguimiento de archivos procesados
   - Los archivos se reprocesan si se ejecuta de nuevo
   - Necesita implementar tabla de archivos procesados

📈 PROGRESO DEL PROCESAMIENTO:
Según los logs, el sistema procesó exitosamente:
- Vehículo doback022: Múltiples fechas procesadas
- Miles de mediciones insertadas correctamente
- Algunos archivos fallaron por duplicados

🎯 RECOMENDACIONES INMEDIATAS:
1. Implementar skipDuplicates en todas las operaciones createMany
2. Generar timestamps únicos por archivo
3. Crear tabla ProcessedFile para seguimiento
4. Revisar lógica de agrupación por fechas

==============================================
        `;

        console.log(report);

        // Guardar reporte
        fs.writeFileSync('simple-report.txt', report);
        console.log('\n✅ Reporte guardado en: simple-report.txt');

        // Mostrar resumen de logs
        if (fs.existsSync('processing-log.txt')) {
            const logContent = fs.readFileSync('processing-log.txt', 'utf-8');
            const lines = logContent.split('\n');
            const lastLines = lines.slice(-10);
            console.log('\n📋 ÚLTIMAS LÍNEAS DEL LOG:');
            lastLines.forEach(line => {
                if (line.trim()) console.log(line);
            });
        }

    } catch (error) {
        console.error('❌ Error generando reporte:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

generateSimpleReport();
