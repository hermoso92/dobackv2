/**
 * 🔑 SCRIPT DE MIGRACIÓN DE OPERATIONAL KEYS (Para consola del navegador)
 * 
 * INSTRUCCIONES:
 * 1. Abre el dashboard en tu navegador: http://localhost:5174
 * 2. Inicia sesión con tus credenciales de ADMIN
 * 3. Abre las herramientas de desarrollo (F12)
 * 4. Ve a la pestaña "Console" (Consola)
 * 5. Copia y pega TODO este código y presiona Enter
 * 6. Espera a que termine la migración
 */

(async function() {
    console.log('🔑 Iniciando migración de OperationalKeys...');
    console.log('');

    try {
        // Obtener el token del localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.error('❌ Error: No hay token de autenticación. Por favor inicia sesión primero.');
            return;
        }

        console.log('✅ Token encontrado');
        console.log('🔄 Ejecutando migración...');
        console.log('');

        // Llamar al endpoint de migración
        const response = await fetch('http://localhost:9998/api/admin/migrate-operational-keys', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('❌ Error en la migración:');
            console.error(result);
            return;
        }

        // Mostrar resultados
        console.log('');
        console.log('╔═══════════════════════════════════════════════════════════════╗');
        console.log('║           RESULTADO DE MIGRACIÓN DE OPERATIONAL KEYS         ║');
        console.log('╠═══════════════════════════════════════════════════════════════╣');
        console.log(`║  Sesiones encontradas:     ${String(result.sessionsFound).padStart(4)} sesiones             ║`);
        console.log(`║  Sesiones procesadas:      ${String(result.sessionsProcessed).padStart(4)} sesiones             ║`);
        console.log(`║  Sesiones fallidas:        ${String(result.sessionsFailed).padStart(4)} sesiones             ║`);
        console.log(`║  Total claves creadas:     ${String(result.totalKeysCreated).padStart(4)} claves              ║`);
        console.log('╚═══════════════════════════════════════════════════════════════╝');
        console.log('');

        if (result.errors && result.errors.length > 0) {
            console.warn('⚠️ ERRORES ENCONTRADOS:');
            result.errors.forEach(error => {
                console.error('   -', error);
            });
            console.log('');
        }

        console.log('✅ Migración completada exitosamente');
        console.log('');
        console.log('💡 Actualiza la página y ve a:');
        console.log('   Panel de Control > Estados y Tiempos > Eventos Detallados');
        console.log('');

        // Retornar el resultado para inspección
        return result;

    } catch (error) {
        console.error('❌ ERROR FATAL EN LA MIGRACIÓN:');
        console.error(error);
    }
})();











