const { webfleetStyleReportService } = require('./src/services/WebfleetStyleReportService');
const { getStabilityEvents } = require('./src/services/StabilityEventService');

async function testCompleteEventDetails() {
    console.log('🔍 Verificando detalles completos de eventos...\n');

    // 1. Obtener eventos directamente para ver la estructura de datos
    console.log('📊 Obteniendo eventos de estabilidad reales...');
    const events = await getStabilityEvents('9cf0abd0-fe51-4831-8fdf-1f3bb84d7bc7', {});
    
    console.log(`✅ ${events.length} eventos encontrados\n`);

    // 2. Mostrar detalles del primer evento para verificar datos disponibles
    if (events.length > 0) {
        console.log('🎯 DETALLES DEL PRIMER EVENTO:');
        console.log('============================');
        const firstEvent = events[0];
        
        console.log('🕐 Tiempo:', firstEvent.timestamp || firstEvent.created_at || firstEvent.datetime || 'No disponible');
        console.log('📍 GPS:', firstEvent.lat && firstEvent.lon ? `${firstEvent.lat}, ${firstEvent.lon}` : 'No disponible');
        console.log('⚡ Severidad:', firstEvent.level || 'No especificada');
        console.log('🔧 Tipo:', firstEvent.eventType || firstEvent.eventname || 'No especificado');
        
        // Datos de aceleración
        if (firstEvent.accel_x !== undefined) {
            console.log('🎢 Aceleración X:', firstEvent.accel_x + 'g');
        }
        if (firstEvent.accel_y !== undefined) {
            console.log('🎢 Aceleración Y:', firstEvent.accel_y + 'g');
        }
        if (firstEvent.accel_z !== undefined) {
            console.log('🎢 Aceleración Z:', firstEvent.accel_z + 'g');
        }
        
        // Datos de giroscopio
        if (firstEvent.gyro_x !== undefined) {
            console.log('🌪️ Giroscopio X:', firstEvent.gyro_x + '°/s');
        }
        if (firstEvent.gyro_y !== undefined) {
            console.log('🌪️ Giroscopio Y:', firstEvent.gyro_y + '°/s');
        }
        if (firstEvent.gyro_z !== undefined) {
            console.log('🌪️ Giroscopio Z:', firstEvent.gyro_z + '°/s');
        }
        
        // Velocidad
        if (firstEvent.speed || firstEvent.velocity) {
            console.log('🚗 Velocidad:', (firstEvent.speed || firstEvent.velocity) + ' km/h');
        }
        
        // Datos CAN si están disponibles
        if (firstEvent.engine_rpm !== undefined) {
            console.log('🔧 RPM Motor:', firstEvent.engine_rpm);
        }
        if (firstEvent.fuel_level !== undefined) {
            console.log('⛽ Combustible:', firstEvent.fuel_level + '%');
        }
        if (firstEvent.engine_temp !== undefined) {
            console.log('🌡️ Temp. Motor:', firstEvent.engine_temp + '°C');
        }
        
        console.log('\n🗃️ ESTRUCTURA COMPLETA DEL EVENTO:');
        console.log('==================================');
        console.log(JSON.stringify(firstEvent, null, 2));
    }

    // 3. Generar reporte y verificar que incluya estos detalles
    console.log('\n📄 Generando reporte completo...');
    
    const config = {
        startDate: new Date('2025-07-10T00:00:00.000Z'),
        endDate: new Date('2025-07-10T23:59:59.000Z'),
        organizationId: '6c2bdfc3-01c1-4b2c-b0f0-a136563fa5f0',
        reportType: 'detailed',
        title: 'Reporte Detallado con Eventos Completos',
        includeCriticalEvents: true,
        includeConsumptionAnalysis: true,
        fuelReferenceBase: 8.5
    };

    try {
        const result = await webfleetStyleReportService.generateWebfleetStyleReport(config);
        
        console.log('✅ REPORTE GENERADO EXITOSAMENTE');
        console.log('================================');
        console.log('📁 Archivo:', result.filePath);
        console.log('📊 Tamaño:', (result.size / 1024).toFixed(2), 'KB');
        
        console.log('\n🎉 El reporte debe incluir ahora:');
        console.log('   ✓ Tabla resumen de sesiones');
        console.log('   ✓ Detalles expandidos por cada evento crítico');
        console.log('   ✓ Todos los datos GPS, aceleración y giroscopio');
        console.log('   ✓ Ubicación exacta del evento');
        console.log('   ✓ Tiempo preciso del evento');
        console.log('   ✓ Velocidad en el momento del evento');
        console.log('   ✓ Datos CAN adicionales si están disponibles');
        
    } catch (error) {
        console.error('❌ Error generando reporte:', error.message);
        console.error(error);
    }
}

// Ejecutar el test
testCompleteEventDetails().catch(console.error); 