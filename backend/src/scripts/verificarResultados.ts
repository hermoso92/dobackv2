/**
 * VERIFICACIÓN DE RESULTADOS DEL POST-PROCESAMIENTO
 * 
 * Script para verificar qué datos se procesaron correctamente:
 * - Violaciones de velocidad
 * - KPIs diarios
 * - Eventos de geocercas
 * - Datos generales de sesiones
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

async function verificarResultados() {
  try {
    console.log('\n========================================');
    console.log('   VERIFICACIÓN DE POST-PROCESAMIENTO');
    console.log('========================================\n');

    // 1. Buscar el vehículo
    const vehicle = await prisma.vehicle.findFirst({
      where: { identifier: 'DOBACK028' },
      select: { id: true, name: true, identifier: true }
    });

    if (!vehicle) {
      console.log('❌ Vehículo DOBACK028 no encontrado');
      return;
    }

    console.log(`✅ Vehículo encontrado: ${vehicle.name} (${vehicle.identifier})\n`);

    // 2. SESIONES
    console.log('1. SESIONES PROCESADAS');
    console.log('----------------------------------------');
    
    const sessions = await prisma.session.findMany({
      where: {
        vehicleId: vehicle.id,
        startTime: {
          gte: new Date('2025-09-30'),
          lt: new Date('2025-11-03')
        }
      },
      orderBy: { startTime: 'asc' }
    });

    console.log(`Total de sesiones: ${sessions.length}`);
    if (sessions.length > 0) {
      console.log(`Primera sesión: ${sessions[0].startTime.toISOString()}`);
      console.log(`Última sesión: ${sessions[sessions.length - 1].startTime.toISOString()}`);
      
      // Agrupar por día
      const sessionsByDay = sessions.reduce((acc, session) => {
        const date = session.startTime.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log(`\nDistribución por día:`);
      Object.entries(sessionsByDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([date, count]) => {
          console.log(`  ${date}: ${count} sesiones`);
        });
    }

    // 3. DATOS GPS
    console.log('\n2. DATOS GPS');
    console.log('----------------------------------------');
    
    const gpsCount = await prisma.gpsMeasurement.count({
      where: {
        Session: {
          vehicleId: vehicle.id,
          startTime: {
            gte: new Date('2025-09-30'),
            lt: new Date('2025-11-03')
          }
        }
      }
    });

    console.log(`Total de puntos GPS: ${gpsCount}`);
    console.log(`Promedio por sesión: ${Math.round(gpsCount / sessions.length)}`);

    // 4. DATOS DE ESTABILIDAD
    console.log('\n3. DATOS DE ESTABILIDAD');
    console.log('----------------------------------------');
    
    const stabilityCount = await prisma.stabilityMeasurement.count({
      where: {
        Session: {
          vehicleId: vehicle.id,
          startTime: {
            gte: new Date('2025-09-30'),
            lt: new Date('2025-11-03')
          }
        }
      }
    });

    console.log(`Total de mediciones: ${stabilityCount}`);
    console.log(`Promedio por sesión: ${Math.round(stabilityCount / sessions.length)}`);

    // 5. SEGMENTOS OPERACIONALES
    console.log('\n4. SEGMENTOS OPERACIONALES');
    console.log('----------------------------------------');
    
    const operationalKeys = await prisma.operationalKey.findMany({
      where: {
        Session: {
          vehicleId: vehicle.id,
          startTime: {
            gte: new Date('2025-09-30'),
            lt: new Date('2025-11-03')
          }
        }
      }
    });

    if (operationalKeys.length > 0) {
      // Agrupar manualmente
      const grouped = operationalKeys.reduce((acc, key) => {
        if (!acc[key.keyType]) {
          acc[key.keyType] = { count: 0, totalSeconds: 0 };
        }
        acc[key.keyType].count++;
        acc[key.keyType].totalSeconds += key.duration || 0;
        return acc;
      }, {} as Record<number, { count: number; totalSeconds: 0 }}>);
      
      Object.entries(grouped)
        .sort(([a], [b]) => Number(a) - Number(b))
        .forEach(([keyType, data]) => {
          const hours = data.totalSeconds / 3600;
          console.log(`  Clave ${keyType}: ${data.count} segmentos, ${hours.toFixed(2)} horas`);
        });
    } else {
      console.log('  ⚠️ No hay segmentos operacionales');
    }

    // 6. KPIs DIARIOS
    console.log('\n5. KPIs DIARIOS');
    console.log('----------------------------------------');
    
    try {
      const kpis: any[] = await prisma.$queryRaw`
        SELECT *
        FROM daily_kpi
        WHERE "vehicleId" = ${vehicle.id}::uuid
          AND date >= '2025-09-30'::date
          AND date < '2025-11-03'::date
        ORDER BY date ASC
      `;

      console.log(`Total de días con KPIs: ${kpis.length}`);
      
      if (kpis.length > 0) {
        const totals = kpis.reduce((acc, kpi) => {
          acc.distanceKm += Number(kpi.totalDistanceKm) || 0;
          acc.timeInPark += Number(kpi.totalTimeInPark) || 0;
          acc.timeInWorkshop += Number(kpi.totalTimeInWorkshop) || 0;
          return acc;
        }, { distanceKm: 0, timeInPark: 0, timeInWorkshop: 0 });

        console.log(`\nResumen:`);
        console.log(`  Distancia total: ${totals.distanceKm.toFixed(2)} km`);
        console.log(`  Tiempo en parque: ${(totals.timeInPark / 60).toFixed(2)} horas`);
        console.log(`  Tiempo en taller: ${(totals.timeInWorkshop / 60).toFixed(2)} horas`);
        
        console.log(`\nPrimeros 5 días con KPIs:`);
        kpis.slice(0, 5).forEach((kpi: any) => {
          const date = new Date(kpi.date).toISOString().split('T')[0];
          const distance = Number(kpi.totalDistanceKm) || 0;
          const parkTime = Number(kpi.totalTimeInPark) || 0;
          console.log(`  ${date}: ${distance.toFixed(2)} km, ${(parkTime / 60).toFixed(2)}h parque`);
        });
      } else {
        console.log('  ⚠️ No se encontraron KPIs calculados');
      }
    } catch (error) {
      console.log('  ⚠️ Tabla daily_kpi no existe o no tiene datos');
    }

    // 7. VIOLACIONES DE VELOCIDAD (si existe la tabla)
    console.log('\n6. VIOLACIONES DE VELOCIDAD');
    console.log('----------------------------------------');
    
    try {
      // Intentar consultar la tabla speed_violations
      const violations: any[] = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM speed_violations sv
        JOIN "Session" s ON s.id = sv.session_id
        WHERE s."vehicleId" = ${vehicle.id}::uuid
          AND s."startTime" >= '2025-09-30'::timestamp
          AND s."startTime" < '2025-11-03'::timestamp
      `;
      
      if (violations && violations[0]) {
        console.log(`Total de violaciones: ${violations[0].count}`);
      }
    } catch (error) {
      console.log('  ⚠️ Tabla speed_violations no existe o no tiene datos');
    }

    // 8. EVENTOS DE GEOCERCAS
    console.log('\n7. EVENTOS DE GEOCERCAS');
    console.log('----------------------------------------');
    
    const geofenceEvents = await prisma.geofenceEvent.findMany({
      where: {
        vehicleId: vehicle.id,
        timestamp: {
          gte: new Date('2025-09-30'),
          lt: new Date('2025-11-03')
        }
      }
    });

    console.log(`Total de eventos: ${geofenceEvents.length}`);
    
    if (geofenceEvents.length > 0) {
      const eventsByType = geofenceEvents.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log(`\nDistribución por tipo:`);
      Object.entries(eventsByType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count} eventos`);
      });
    } else {
      console.log('  ⚠️ No se encontraron eventos de geocercas');
    }

    console.log('\n========================================');
    console.log('   FIN DE VERIFICACIÓN');
    console.log('========================================\n');

  } catch (error: any) {
    console.error('❌ Error durante la verificación:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
verificarResultados()
  .then(() => {
    console.log('✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

