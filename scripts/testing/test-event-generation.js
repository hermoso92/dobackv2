
          const { eventDetector } = require('./backend/src/services/eventDetector');
          
          async function testEventGeneration() {
            try {
              console.log('Generating events for session: 14aca91d-8c23-456e-8e39-5c2383fdcf01');
              
              const result = await eventDetector.detectarYGuardarEventos('14aca91d-8c23-456e-8e39-5c2383fdcf01');
              console.log('Result:', result);
              
              process.exit(0);
            } catch (error) {
              console.error('Error:', error.message);
              process.exit(1);
            }
          }
          
          testEventGeneration();
        