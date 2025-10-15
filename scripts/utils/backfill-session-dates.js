const { PrismaClient } = require("../../backend/node_modules/@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.session.findMany({ select: { id: true, startTime: true, endTime: true } });
  let updated = 0;

  for (const s of sessions) {
    const [gMin, gMax, eMin, eMax, rMin, rMax] = await Promise.all([
      prisma.gpsMeasurement.aggregate({ where: { sessionId: s.id }, _min: { timestamp: true } }),
      prisma.gpsMeasurement.aggregate({ where: { sessionId: s.id }, _max: { timestamp: true } }),
      prisma.stabilityMeasurement.aggregate({ where: { sessionId: s.id }, _min: { timestamp: true } }),
      prisma.stabilityMeasurement.aggregate({ where: { sessionId: s.id }, _max: { timestamp: true } }),
      prisma.rotativoMeasurement.aggregate({ where: { sessionId: s.id }, _min: { timestamp: true } }),
      prisma.rotativoMeasurement.aggregate({ where: { sessionId: s.id }, _max: { timestamp: true } }),
    ]);

    const mins = [gMin._min.timestamp, eMin._min.timestamp, rMin._min.timestamp].filter(Boolean).map(d => new Date(d));
    const maxs = [gMax._max.timestamp, eMax._max.timestamp, rMax._max.timestamp].filter(Boolean).map(d => new Date(d));
    const minTs = mins.length ? new Date(Math.min(...mins)) : null;
    const maxTs = maxs.length ? new Date(Math.max(...maxs)) : null;

    if (minTs || maxTs) {
      await prisma.session.update({
        where: { id: s.id },
        data: { startTime: minTs ?? s.startTime, endTime: maxTs ?? s.endTime }
      });
      updated++;
    }
  }

  console.log(JSON.stringify({ updated, total: sessions.length }));
}

main().then(() => prisma.$disconnect()).catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
