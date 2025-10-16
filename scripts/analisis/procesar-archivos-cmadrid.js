/**
 * 🚀 PROCESAR ARCHIVOS CMADRID VIA HTTP
 * 
 * Llama al endpoint /api/upload/process-all-cmadrid
 * (lo mismo que hace el frontend)
 */

const http = require('http');

async function procesarCMadrid() {
    console.log('🚀 PROCESAMIENTO AUTOMÁTICO DE CMADRID\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⏳ Iniciando procesamiento (esto puede tardar varios minutos)...\n');

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 9998,
            path: '/api/upload/process-all-cmadrid',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': 0
            },
            timeout: 600000 // 10 minutos
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('✅ PROCESAMIENTO COMPLETADO');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

                try {
                    const result = JSON.parse(data);
                    
                    if (result.success) {
                        console.log('📊 RESUMEN:\n');
                        console.log(`   • Total archivos procesados: ${result.totalArchivosLeidos || 0}`);
                        console.log(`   • Total sesiones creadas: ${result.totalSesionesCreadas || 0}`);
                        console.log(`   • Vehículos procesados: ${result.results?.length || 0}\n`);

                        if (result.results && result.results.length > 0) {
                            console.log('📋 Detalle por vehículo:\n');
                            result.results.forEach(vehicleResult => {
                                console.log(`   🚗 ${vehicleResult.vehicleId}:`);
                                console.log(`      • Archivos procesados: ${vehicleResult.filesProcessed || 0}`);
                                console.log(`      • Sesiones creadas: ${vehicleResult.savedSessions || 0}`);
                                
                                if (vehicleResult.sessionDetails && vehicleResult.sessionDetails.length > 0) {
                                    const creadas = vehicleResult.sessionDetails.filter(s => s.status === 'CREADA');
                                    const omitidas = vehicleResult.sessionDetails.filter(s => s.status === 'OMITIDA');
                                    
                                    if (creadas.length > 0) {
                                        console.log(`\n      ✅ Sesiones creadas (${creadas.length}):`);
                                        creadas.forEach(s => {
                                            console.log(`         • Sesión ${s.sessionNumber}: ${s.startTime} - ${s.endTime} (${s.durationFormatted})`);
                                            if (s.estabilidad) console.log(`           ESTABILIDAD: ${s.estabilidad.fileName}`);
                                            if (s.gps) console.log(`           GPS: ${s.gps.fileName}`);
                                            if (s.rotativo) console.log(`           ROTATIVO: ${s.rotativo.fileName}`);
                                        });
                                    }
                                    
                                    if (omitidas.length > 0) {
                                        console.log(`\n      ⚠️  Sesiones omitidas (${omitidas.length}):`);
                                        omitidas.slice(0, 3).forEach(s => {
                                            console.log(`         • Sesión ${s.sessionNumber}: ${s.reason}`);
                                        });
                                        if (omitidas.length > 3) {
                                            console.log(`         ... y ${omitidas.length - 3} más`);
                                        }
                                    }
                                }
                                console.log();
                            });
                        }
                        
                        resolve(result);
                    } else {
                        console.log('❌ Error en procesamiento:', result.error);
                        reject(new Error(result.error));
                    }
                } catch (error) {
                    console.log('❌ Error parseando respuesta:', error.message);
                    console.log('\nRespuesta recibida:', data.substring(0, 500));
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.log('\n❌ ERROR DE CONEXIÓN:', error.message);
            console.log('\n⚠️  Verifica que el backend esté corriendo en puerto 9998');
            reject(error);
        });

        req.on('timeout', () => {
            console.log('\n⏱️  TIMEOUT: El procesamiento está tomando más de 10 minutos');
            console.log('    Esto es normal para archivos grandes');
            console.log('    El procesamiento continúa en segundo plano\n');
            req.destroy();
            resolve({ timeout: true });
        });

        req.end();
    });
}

procesarCMadrid()
    .then(() => {
        console.log('🎉 Script finalizado\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Error fatal:', error.message);
        process.exit(1);
    });
