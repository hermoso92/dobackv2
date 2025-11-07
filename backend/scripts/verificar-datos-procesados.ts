/**
 * Script para verificar qué datos se procesaron y guardaron en la BD
 */

import { prisma } from '../src/config/prisma';
import { createLogger } from '../src/utils/logger';

const logger = createLogger('VerificarDatos');

async function main() {
  try {
    logger.info('🔍 VERIFICANDO DATOS PROCESADOS EN LA BASE DE DATOS...\n');

    const orgId = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26'; // CMadrid

    // 1. Sesiones
    const sessions = await prisma.session.findMany({
      where: { organizationId: orgId },
      include: {
        Vehicle: { select: { name: true, identifier: true } },
        _count: {
          select: {
            GpsMeasurement: true,
            StabilityMeasurement: true,
            RotativoMeasurement: true
          }
        }
      },
      orderBy: { startTime: 'desc' }
    });

    logger.info(`\n📊 SESIONES: ${sessions.length}`);
    sessions.forEach((s, i) => {
      logger.info(`  ${i + 1}. ${s.Vehicle?.name || s.Vehicle?.identifier} - ${s.startTime.toISOString().split('T')[0]} - Session ${s.sessionNumber}`);
      logger.info(`     GPS: ${s._count.GpsMeasurement}, Estabilidad: ${s._count.StabilityMeasurement}, Rotativo: ${s._count.RotativoMeasurement}`);
    });

    // 2. Eventos de estabilidad
    const events = await prisma.stability_events.findMany({
      where: { Session: { organizationId: orgId } },
      include: { Session: { select: { id: true, sessionNumber: true } } }
    });

    logger.info(`\n🔴 EVENTOS DE ESTABILIDAD: ${events.length}`);
    events.slice(0, 5).forEach((e, i) => {
      logger.info(`  ${i + 1}. Session ${e.Session?.sessionNumber} - Severidad: ${e.severity} - Tipo: ${e.type}`);
    });

    // 3. Segmentos operacionales
    const segments = await prisma.operational_state_segments.findMany({
      where: { Session: { organizationId: orgId } },
      include: { Session: { select: { id: true, sessionNumber: true } } }
    });

    logger.info(`\n⚙️ SEGMENTOS OPERACIONALES: ${segments.length}`);
    
    // Agrupar por clave
    const byKey: any = {};
    segments.forEach(s => {
      const key = s.clave || 'unknown';
      if (!byKey[key]) byKey[key] = { count: 0, totalDuration: 0 };
      byKey[key].count++;
      byKey[key].totalDuration += s.durationSeconds || 0;
    });

    Object.entries(byKey).forEach(([key, data]: [string, any]) => {
      const minutes = Math.floor(data.totalDuration / 60);
      logger.info(`  Clave ${key}: ${data.count} segmentos, ${minutes} minutos totales`);
    });

    // 4. Puntos GPS
    const gpsCount = await prisma.gpsMeasurement.count({
      where: { Session: { organizationId: orgId } }
    });

    logger.info(`\n📍 PUNTOS GPS: ${gpsCount.toLocaleString()}`);

    // 5. Reportes de procesamiento
    const reports = await prisma.processingReport.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 3
    });

    logger.info(`\n📝 REPORTES DE PROCESAMIENTO: ${reports.length}`);
    reports.forEach((r, i) => {
      logger.info(`  ${i + 1}. ${r.reportType} - ${r.status} - ${r.totalSessions} sesiones - ${r.createdAt.toISOString()}`);
    });

    logger.info('\n✅ VERIFICACIÓN COMPLETADA\n');

  } catch (error) {
    logger.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

