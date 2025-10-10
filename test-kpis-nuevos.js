/**
 * Test de nuevos KPIs con lógica inteligente
 */

const http = require('http');

function consultarKPIs(filtros = '') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 9998,
            path: '/api/kpis/summary' + filtros,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-organization-id': 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    resolve({ error: 'Invalid JSON', raw: data });
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(5000, () => reject(new Error('Timeout')));
        req.end();
    });
}

async function main() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('TEST DE KPIs CON LÓGICA INTELIGENTE');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Esperar a que el backend se inicie
    console.log('⏳ Esperando backend...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
        const resultado = await consultarKPIs();

        if (resultado.error) {
            console.log('❌ Error:', resultado.error);
            if (resultado.raw) console.log('Raw:', resultado.raw);
            return;
        }

        const data = resultado.data;

        console.log('✅ Backend respondió correctamente\n');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('RESULTADOS');
        console.log('═══════════════════════════════════════════════════════════\n');

        // Estados
        console.log('🔑 ESTADOS:\n');
        data.states.states.forEach(s => {
            console.log(`   Clave ${s.key} (${s.name}): ${s.duration_formatted}`);
        });
        console.log(`\n   TOTAL: ${data.states.total_time_formatted}`);
        console.log(`   Fuera de Parque (2+3+4+5): ${data.states.time_outside_formatted}\n`);

        // Actividad
        console.log('🚗 ACTIVIDAD:\n');
        console.log(`   Kilómetros: ${data.activity.km_total} km`);
        console.log(`   Horas Conducción: ${data.activity.driving_hours_formatted}`);
        console.log(`   % Rotativo: ${data.activity.rotativo_on_percentage}%`);
        console.log(`   Salidas en Emergencia: ${data.activity.emergency_departures}\n`);

        // Calcular velocidad promedio
        const avgSpeed = data.activity.driving_hours > 0
            ? (data.activity.km_total / data.activity.driving_hours).toFixed(2)
            : 0;
        console.log(`   Velocidad Promedio Calculada: ${avgSpeed} km/h\n`);

        // Incidencias
        console.log('⚠️  INCIDENCIAS:\n');
        console.log(`   Total: ${data.stability.total_incidents}`);
        console.log(`   Graves: ${data.stability.critical}`);
        console.log(`   Moderadas: ${data.stability.moderate}`);
        console.log(`   Leves: ${data.stability.light}\n`);

        // Validaciones
        console.log('═══════════════════════════════════════════════════════════');
        console.log('VALIDACIONES');
        console.log('═══════════════════════════════════════════════════════════\n');

        const timeOutside = data.states.time_outside_station;
        const issues = [];

        if (timeOutside < 60) {
            issues.push('❌ Tiempo fuera de parque < 60 segundos');
        } else if (timeOutside < 3600) {
            issues.push('⚠️  Tiempo fuera de parque < 1 hora');
        } else {
            console.log(`✅ Tiempo fuera de parque: ${Math.round(timeOutside/3600)} horas (realista)`);
        }

        if (parseFloat(avgSpeed) > 200) {
            issues.push(`❌ Velocidad imposible: ${avgSpeed} km/h`);
        } else if (parseFloat(avgSpeed) > 100) {
            issues.push(`⚠️  Velocidad alta: ${avgSpeed} km/h`);
        } else {
            console.log(`✅ Velocidad promedio: ${avgSpeed} km/h (realista)`);
        }

        if (data.activity.km_total > 0 && timeOutside < 600) {
            issues.push(`❌ ${data.activity.km_total} km en ${timeOutside} segundos = imposible`);
        } else {
            console.log(`✅ Kilómetros vs tiempo: coherente`);
        }

        if (data.stability.total_incidents > 0) {
            const todasLeves = data.stability.critical === 0 && data.stability.moderate === 0;
            if (todasLeves) {
                issues.push(`⚠️  Todas las incidencias son leves`);
            } else {
                console.log(`✅ Incidencias distribuidas correctamente`);
            }
        }

        if (issues.length > 0) {
            console.log('\n🚨 PROBLEMAS DETECTADOS:\n');
            issues.forEach(issue => console.log(`   ${issue}`));
        } else {
            console.log('\n🎉 TODOS LOS KPIs SON VÁLIDOS');
        }

        console.log('\n═══════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ Error consultando backend:', error.message);
        console.log('   Verifica que el backend esté corriendo en puerto 9998\n');
    }
}

main();

