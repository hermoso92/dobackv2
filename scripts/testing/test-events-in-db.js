
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        async function testEvents() {
          try {
            console.log('Testing events in database...');
            
            // Count total events
            const totalEvents = await prisma.stabilityEvent.count();
            console.log('Total events in DB:', totalEvents);
            
            if (totalEvents > 0) {
              // Get sample events
              const sampleEvents = await prisma.stabilityEvent.findMany({
                take: 10,
                orderBy: { timestamp: 'desc' },
                select: {
                  id: true,
                  session_id: true,
                  type: true,
                  severity: true,
                  timestamp: true
                }
              });
              
              console.log('\nSample events:');
              sampleEvents.forEach((event, i) => {
                console.log(`  ${i + 1}. ${event.type} (${event.severity}) - ${event.timestamp} - Session: ${event.session_id}`);
              });
              
              // Count events by type
              const eventsByType = await prisma.stabilityEvent.groupBy({
                by: ['type'],
                _count: { type: true }
              });
              
              console.log('\nEvents by type:');
              eventsByType.forEach(group => {
                console.log(`  ${group.type}: ${group._count.type}`);
              });
              
              // Count events by severity
              const eventsBySeverity = await prisma.stabilityEvent.groupBy({
                by: ['severity'],
                _count: { severity: true }
              });
              
              console.log('\nEvents by severity:');
              eventsBySeverity.forEach(group => {
                console.log(`  ${group.severity}: ${group._count.severity}`);
              });
            }
            
            await prisma.$disconnect();
          } catch (error) {
            console.error('Error:', error.message);
          }
        }
        
        testEvents();
      