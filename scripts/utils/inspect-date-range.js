const { PrismaClient } = require("../../backend/node_modules/@prisma/client");
const prisma = new PrismaClient();

function ymd(d){ const dt = new Date(d); const p=n=>String(n).padStart(2,'0'); return `${dt.getUTCFullYear()}-${p(dt.getUTCMonth()+1)}-${p(dt.getUTCDate())}`; }

async function main(){
  const [gps, stab, rot, sess] = await Promise.all([
    prisma.gpsMeasurement.aggregate({ _min: { timestamp: true }, _max: { timestamp: true } }),
    prisma.stabilityMeasurement.aggregate({ _min: { timestamp: true }, _max: { timestamp: true } }),
    prisma.rotativoMeasurement.aggregate({ _min: { timestamp: true }, _max: { timestamp: true } }),
    prisma.session.aggregate({ _min: { startTime: true }, _max: { endTime: true }, _count: true })
  ]);

  const start = new Date("2025-09-29T00:00:00Z");
  const end = new Date("2025-10-08T23:59:59Z");

  const [sessionsInRange, gpsCountRange, stabCountRange, rotCountRange] = await Promise.all([
    prisma.session.findMany({ where: { startTime: { gte: start, lte: end } }, select: { id: true, startTime: true } }),
    prisma.gpsMeasurement.count({ where: { timestamp: { gte: start, lte: end } } }),
    prisma.stabilityMeasurement.count({ where: { timestamp: { gte: start, lte: end } } }),
    prisma.rotativoMeasurement.count({ where: { timestamp: { gte: start, lte: end } } })
  ]);

  const byDay = {};
  for (const s of sessionsInRange){ const d = ymd(s.startTime); byDay[d] = (byDay[d]||0)+1; }

  console.log(JSON.stringify({
    minMax: { gps, stability: stab, rotativo: rot, sessions: sess },
    range: { start: start.toISOString(), end: end.toISOString() },
    countsInRange: { sessions: sessionsInRange.length, gps: gpsCountRange, stability: stabCountRange, rotativo: rotCountRange, sessionsByDay: byDay }
  }, null, 2));
}

main().then(()=>prisma.$disconnect()).catch(async (e)=>{ console.error(e); await prisma.$disconnect(); process.exit(1); });
