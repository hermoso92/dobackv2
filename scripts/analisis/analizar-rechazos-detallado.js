/**
 * 📊 ANÁLISIS DETALLADO DE RECHAZOS
 * 
 * Lee el reporte del frontend para entender exactamente
 * por qué se rechazan las 31 sesiones faltantes
 */

const fs = require('fs');

function analizarRechazos() {
    console.log('📊 ANÁLISIS DETALLADO DE RECHAZOS\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Contadores por tipo de rechazo
    const rechazos = {
        'Falta GPS': [],
        'Falta ROTATIVO': [],
        'Falta ESTABILIDAD': [],
        'Duración < 280s': [],
        'Duración > 7200s': [],
        'Duración inválida (≤ 0s)': [],
        'Sesión ya existía': []
    };

    // Del reporte del frontend (copiado arriba)
    const reporteRechazos = [
        // DOBACK024
        { vehiculo: 'DOBACK024', fecha: '30/09/2025', sesion: 2, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '01/10/2025', sesion: 2, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '01/10/2025', sesion: 3, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '01/10/2025', sesion: 4, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '01/10/2025', sesion: 5, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '01/10/2025', sesion: 6, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '02/10/2025', sesion: 2, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '02/10/2025', sesion: 3, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '02/10/2025', sesion: 4, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '02/10/2025', sesion: 5, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '02/10/2025', sesion: 6, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '03/10/2025', sesion: 3, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '04/10/2025', sesion: 2, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '04/10/2025', sesion: 3, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '04/10/2025', sesion: 4, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '04/10/2025', sesion: 5, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '04/10/2025', sesion: 6, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '04/10/2025', sesion: 7, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '04/10/2025', sesion: 8, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '05/10/2025', sesion: 4, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '05/10/2025', sesion: 5, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '05/10/2025', sesion: 6, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '05/10/2025', sesion: 7, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '06/10/2025', sesion: 2, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '07/10/2025', sesion: 2, razon: 'Duración > 7200s (8193s)' },
        { vehiculo: 'DOBACK024', fecha: '07/10/2025', sesion: 3, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '07/10/2025', sesion: 4, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '07/10/2025', sesion: 5, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '07/10/2025', sesion: 6, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK024', fecha: '07/10/2025', sesion: 7, razon: 'Falta GPS' },
        // DOBACK027
        { vehiculo: 'DOBACK027', fecha: '01/10/2025', sesion: 4, razon: 'Duración < 280s (236.9s)' },
        { vehiculo: 'DOBACK027', fecha: '01/10/2025', sesion: 5, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK027', fecha: '04/10/2025', sesion: 2, razon: 'Duración < 280s (263.9s)' },
        { vehiculo: 'DOBACK027', fecha: '05/10/2025', sesion: 2, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK027', fecha: '06/10/2025', sesion: 1, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK027', fecha: '06/10/2025', sesion: 2, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK027', fecha: '07/10/2025', sesion: 2, razon: 'Duración < 280s (183s)' },
        // DOBACK028
        { vehiculo: 'DOBACK028', fecha: '30/09/2025', sesion: 1, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK028', fecha: '30/09/2025', sesion: 2, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK028', fecha: '30/09/2025', sesion: 3, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK028', fecha: '02/10/2025', sesion: 2, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK028', fecha: '03/10/2025', sesion: 3, razon: 'Duración < 280s (228.8s)' },
        { vehiculo: 'DOBACK028', fecha: '03/10/2025', sesion: 5, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK028', fecha: '03/10/2025', sesion: 6, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK028', fecha: '05/10/2025', sesion: 1, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK028', fecha: '07/10/2025', sesion: 3, razon: 'Duración < 280s (77.8s)' },
        { vehiculo: 'DOBACK028', fecha: '07/10/2025', sesion: 4, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK028', fecha: '08/10/2025', sesion: 2, razon: 'Duración > 7200s (9347s)' },
        { vehiculo: 'DOBACK028', fecha: '08/10/2025', sesion: 3, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK028', fecha: '08/10/2025', sesion: 4, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK028', fecha: '08/10/2025', sesion: 5, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK028', fecha: '08/10/2025', sesion: 6, razon: 'Falta GPS' },
        { vehiculo: 'DOBACK028', fecha: '08/10/2025', sesion: 7, razon: 'Falta GPS' }
    ];

    // Contar por categoría
    rechazos['Falta GPS'] = reporteRechazos.filter(r => r.razon === 'Falta GPS');
    rechazos['Duración < 280s'] = reporteRechazos.filter(r => r.razon.includes('Duración < 280s'));
    rechazos['Duración > 7200s'] = reporteRechazos.filter(r => r.razon.includes('Duración > 7200s'));
    rechazos['Falta ROTATIVO'] = reporteRechazos.filter(r => r.razon === 'Falta ROTATIVO');

    console.log('📊 RECHAZOS POR CATEGORÍA:\n');
    
    for (const [categoria, items] of Object.entries(rechazos)) {
        if (items.length > 0) {
            console.log(`   ❌ ${categoria}: ${items.length} sesiones`);
        }
    }
    console.log();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 ANÁLISIS DETALLADO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`1. ❌ Falta GPS (${rechazos['Falta GPS'].length} sesiones):\n`);
    console.log('   Estas son sesiones que el análisis real marca con GPS ✅');
    console.log('   pero el sistema no encuentra GPS correlacionable.\n');
    console.log('   Posibles causas:');
    console.log('   • GPS está fuera del rango ESTABILIDAD +/- 5min');
    console.log('   • GPS tiene timestamps muy desviados');
    console.log('   • GPS está en archivo diferente al esperado\n');

    if (rechazos['Duración < 280s'].length > 0) {
        console.log(`2. ❌ Duración < 280s (${rechazos['Duración < 280s'].length} sesiones):\n`);
        rechazos['Duración < 280s'].forEach(r => {
            console.log(`   • ${r.vehiculo} ${r.fecha} Sesión ${r.sesion}: ${r.razon}`);
        });
        console.log();
        console.log('   Solución: Reducir a 230s (3m 50s) captura más\n');
    }

    if (rechazos['Duración > 7200s'].length > 0) {
        console.log(`3. ⚠️  Duración > 7200s (${rechazos['Duración > 7200s'].length} sesiones):\n`);
        rechazos['Duración > 7200s'].forEach(r => {
            console.log(`   • ${r.vehiculo} ${r.fecha} Sesión ${r.sesion}: ${r.razon}`);
        });
        console.log();
        console.log('   Estas son sesiones REALES muy largas (>2h)');
        console.log('   Solución: Aumentar maxSessionDuration a 0 (sin límite)\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 RECOMENDACIONES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const faltanGPS = rechazos['Falta GPS'].length;
    const faltanDuracion = rechazos['Duración < 280s'].length + rechazos['Duración > 7200s'].length;
    const total = faltanGPS + faltanDuracion;

    console.log(`   Total rechazos: ${total}\n`);
    console.log(`   1. "Falta GPS": ${faltanGPS} sesiones (${((faltanGPS/total)*100).toFixed(1)}%)`);
    console.log(`      → Estas sesiones probablemente NO tienen GPS en el archivo`);
    console.log(`      → El análisis real podría estar equivocado o usar archivos diferentes\n`);

    console.log(`   2. "Duración fuera de rango": ${faltanDuracion} sesiones (${((faltanDuracion/total)*100).toFixed(1)}%)`);
    console.log(`      → Ajustar rangos: minSessionDuration = 230s, maxSessionDuration = 0\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 MEJORA LOGRADA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('   Correlación Simple:       44 sesiones (51.8%)');
    console.log('   GPS Fragmentado:          54 sesiones (63.5%)');
    console.log('   Mejora:                   +10 sesiones (+11.7%)\n');

    console.log('   Progreso:');
    console.log('   • DOBACK024: 13 → 17 (+4 sesiones, +30.8%)');
    console.log('   • DOBACK027: 10 → 13 (+3 sesiones, +30.0%)');
    console.log('   • DOBACK028: 21 → 24 (+3 sesiones, +14.3%)\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

analizarRechazos();

