/**
 * VERIFICACIÓN SIMPLE DE RESULTADOS
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificar() {
  console.log('\n======================================');
  console.log('VERIFICACIÓN DE POST-PROCESAMIENTO');
  console.log('======================================\n');

  // 1. Vehículo
  const vehicle = await prisma.vehicle.findFirst({
    where: { identifier: 'DOBACK028' }
  });

  if (!vehicle) {
    console.log('❌ Vehículo no encontrado');
    return;
  }

  console.log(`✅ Vehículo: ${vehicle.name}\n`);

  // 2. Sesiones
  const sessions = await prisma.session.count({
    where: {
      vehicleId: vehicle.id,
      startTime: { gte: new Date('2025-09-30'), lt: new Date('2025-11-03') }
    }
  });
  console.log(`📊 Sesiones: ${sessions}`);

  // 3. GPS
  const gps = await prisma.gpsMeasurement.count({
    where: {
      Session: {
        vehicleId: vehicle.id,
        startTime: { gte: new Date('2025-09-30'), lt: new Date('2025-11-03') }
      }
    }
  });
  console.log(`📍 Puntos GPS: ${gps}`);

  // 4. Estabilidad
  const stability = await prisma.stabilityMeasurement.count({
    where: {
      Session: {
        vehicleId: vehicle.id,
        startTime: { gte: new Date('2025-09-30'), lt: new Date('2025-11-03') }
      }
    }
  });
  console.log(`📈 Mediciones estabilidad: ${stability}`);

  // 5. Segmentos operacionales
  const keys = await prisma.operationalKey.count({
    where: {
      Session: {
        vehicleId: vehicle.id,
        startTime: { gte: new Date('2025-09-30'), lt: new Date('2025-11-03') }
      }
    }
  });
  console.log(`🔑 Segmentos operacionales: ${keys}`);

  // 6. KPIs
  try {
    const kpis: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM daily_kpi
      WHERE "vehicleId" = ${vehicle.id}::uuid
        AND date >= '2025-09-30'::date
        AND date < '2025-11-03'::date
    `;
    console.log(`📊 Días con KPIs: ${kpis[0]?.count || 0}`);
  } catch {
    console.log(`⚠️  KPIs: Tabla no existe`);
  }

  // 7. Geocercas
  const geofences = await prisma.geofenceEvent.count({
    where: {
      vehicleId: vehicle.id,
      timestamp: { gte: new Date('2025-09-30'), lt: new Date('2025-11-03') }
    }
  });
  console.log(`🗺️  Eventos de geocercas: ${geofences}`);

  // 8. Violaciones
  try {
    const violations: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM speed_violations sv
      JOIN "Session" s ON s.id = sv.session_id
      WHERE s."vehicleId" = ${vehicle.id}::uuid
        AND s."startTime" >= '2025-09-30'::timestamp
        AND s."startTime" < '2025-11-03'::timestamp
    `;
    console.log(`🚗 Violaciones de velocidad: ${violations[0]?.count || 0}`);
  } catch {
    console.log(`⚠️  Violaciones: Tabla no existe`);
  }

  console.log('\n======================================\n');
  
  await prisma.$disconnect();
}

verificar()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });

