import { GestorDeEventoService } from './src/services/GestorDeEventoService';

async function testEventCreation() {
    try {
        console.log('🚀 Iniciando prueba de creación de eventos...');

        const service = new GestorDeEventoService();

        const testData = {
            name: 'Evento de Prueba',
            description: 'Evento para probar la funcionalidad',
            tipo: 'STABILITY',
            autoEvaluate: true,
            conditions: [
                {
                    variable: 'roll',
                    operator: 'GREATER_THAN',
                    value: '15',
                    unit: 'degrees'
                }
            ],
            vehicles: [],
            createdById: 'test-user-123'
        };

        console.log('📤 Datos de prueba:', JSON.stringify(testData, null, 2));

        const result = await service.crearEvento(testData);

        console.log('✅ Evento creado exitosamente:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('❌ Error creando evento:', error);
        console.error('Stack:', error.stack);
    }
}

testEventCreation();
