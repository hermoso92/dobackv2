import { prisma } from '../config/prisma';

prisma.geofenceEvent.findMany({ 
    include: { 
        Geofence: { select: { name: true } }, 
        Vehicle: { select: { licensePlate: true } } 
    } 
}).then(events => {
    console.log('\n📊 EVENTOS EN BD:', events.length);
    events.forEach(e => {
        console.log(`  ${e.type} → ${e.Geofence.name} (${e.Vehicle.licensePlate}) @ ${e.timestamp}`);
    });
    process.exit(0);
}).catch(e => {
    console.error('Error:', e);
    process.exit(1);
});










