const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEvents() {
    try {
        // Contar eventos totales
        const total = await prisma.$queryRaw`SELECT COUNT(*) as count FROM stability_events`;
        console.log('✅ Total eventos en BD:', total[0].count);

        // Eventos de la sesión específica
        const sessionId = '92c52856-02cc-4ac9-92da-17ccebc75ec6';
        const sessionEvents = await prisma.$queryRaw`
            SELECT COUNT(*) as count 
            FROM stability_events 
            WHERE session_id = ${sessionId}
        `;
        console.log(`✅ Eventos para sesión ${sessionId}:`, sessionEvents[0].count);

        // Mostrar primeros 5 eventos de cualquier sesión
        const sampleEvents = await prisma.$queryRaw`
            SELECT session_id, type, severity, timestamp 
            FROM stability_events 
            ORDER BY timestamp DESC 
            LIMIT 5
        `;
        console.log('📊 Primeros 5 eventos en BD:', JSON.stringify(sampleEvents, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkEvents();

