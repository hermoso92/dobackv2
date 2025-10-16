
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        async function testStability() {
          try {
            console.log('Testing stability measurements for session: de808566-f9c8-4233-a702-8270f9b594ae');
            
            // Get stability measurements
            const stabilityMeasurements = await prisma.stabilityMeasurement.findMany({
              where: { sessionId: 'de808566-f9c8-4233-a702-8270f9b594ae' },
              take: 10,
              orderBy: { timestamp: 'asc' }
            });
            
            console.log('Stability measurements count:', stabilityMeasurements.length);
            
            if (stabilityMeasurements.length > 0) {
              console.log('\nSample stability measurements:');
              stabilityMeasurements.forEach((m, i) => {
                const siPercent = (m.si || 0) * 100;
                console.log(`  ${i + 1}. SI: ${siPercent.toFixed(2)}% (raw: ${m.si}), Roll: ${m.roll?.toFixed(2) || 'N/A'}°, Gx: ${m.gx?.toFixed(2) || 'N/A'}°/s`);
              });
              
              // Check for low SI values (potential events)
              const lowSiMeasurements = stabilityMeasurements.filter(m => (m.si || 0) < 0.3); // SI < 30%
              console.log(`\nMeasurements with SI < 30%: ${lowSiMeasurements.length}`);
              
              if (lowSiMeasurements.length > 0) {
                console.log('Low SI measurements:');
                lowSiMeasurements.slice(0, 5).forEach((m, i) => {
                  const siPercent = (m.si || 0) * 100;
                  console.log(`  ${i + 1}. SI: ${siPercent.toFixed(2)}%, Roll: ${m.roll?.toFixed(2) || 'N/A'}°, Gx: ${m.gx?.toFixed(2) || 'N/A'}°/s`);
                });
              }
              
              // Check for very low SI values (critical events)
              const criticalSiMeasurements = stabilityMeasurements.filter(m => (m.si || 0) < 0.1); // SI < 10%
              console.log(`\nMeasurements with SI < 10%: ${criticalSiMeasurements.length}`);
            }
            
            await prisma.$disconnect();
          } catch (error) {
            console.error('Error:', error.message);
          }
        }
        
        testStability();
      