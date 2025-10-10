const fetch = require('node-fetch');

async function checkSystemStatus() {
    try {
        console.log('🔍 Verificando estado del sistema automático...');
        
        // Verificar que el servidor backend está corriendo
        try {
            const response = await fetch('http://localhost:3001/test');
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Servidor backend funcionando correctamente');
            } else {
                console.log('❌ Servidor backend no responde correctamente');
                return;
            }
        } catch (error) {
            console.log('❌ No se puede conectar al servidor backend:', error.message);
            console.log('💡 Asegúrate de que el servidor backend esté ejecutándose en el puerto 3001');
            return;
        }
        
        // Verificar estado del servicio automático
        try {
            const response = await fetch('http://localhost:3001/api/automatic-upload/status');
            const data = await response.json();
            
            if (data.success) {
                console.log('📊 Estado del servicio automático:', data.status);
                console.log('📈 Estadísticas:', {
                    sesionesProcesadas: data.stats.sessionsProcessed,
                    archivosProcesados: data.stats.filesProcessed,
                    errores: data.stats.errors,
                    ultimaActividad: data.stats.lastActivity
                });
            } else {
                console.log('❌ Error obteniendo estado del servicio automático');
            }
        } catch (error) {
            console.log('⚠️ No se puede obtener el estado del servicio automático:', error.message);
            console.log('💡 El servicio puede no estar iniciado o no estar configurado correctamente');
        }
        
        // Verificar archivos pendientes
        try {
            const response = await fetch('http://localhost:3001/api/automatic-upload/pending-files');
            const data = await response.json();
            
            if (data.success) {
                console.log(`📋 Archivos pendientes: ${data.pendingFiles}`);
            } else {
                console.log('❌ Error obteniendo archivos pendientes');
            }
        } catch (error) {
            console.log('⚠️ No se puede obtener archivos pendientes:', error.message);
        }
        
        // Verificar archivos con errores
        try {
            const response = await fetch('http://localhost:3001/api/automatic-upload/error-files');
            const data = await response.json();
            
            if (data.success) {
                console.log(`❌ Archivos con errores: ${data.errorFiles}`);
            } else {
                console.log('❌ Error obteniendo archivos con errores');
            }
        } catch (error) {
            console.log('⚠️ No se puede obtener archivos con errores:', error.message);
        }
        
        console.log('✅ Verificación completada');
        
    } catch (error) {
        console.error('💥 Error en la verificación:', error);
    }
}

// Ejecutar la verificación
checkSystemStatus().catch(console.error);