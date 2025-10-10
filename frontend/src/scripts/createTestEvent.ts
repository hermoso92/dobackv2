import { eventService } from '../services/events';
import './setupLocalStorage';
async function createTestEvent() {
    console.log('Iniciando creación de evento de prueba...');
    try {
        const result = await eventService.createTestEvent();
        console.log('Evento creado exitosamente:', result);
    } catch (error) {
        console.error('Error al crear el evento:', error);
    }
}

createTestEvent().then(() => {
    console.log('Proceso completado');
}); 