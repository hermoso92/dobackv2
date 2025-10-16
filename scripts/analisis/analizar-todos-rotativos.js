/**
 * Analizar TODOS los archivos ROTATIVO para ver qué estados tienen
 */

const fs = require('fs');
const path = require('path');

const basePath = 'backend/data/CMadrid';
const vehicles = ['doback024', 'doback027', 'doback028'];

console.log('\n═══════════════════════════════════════════════════════════');
console.log('ANÁLISIS DE ARCHIVOS ROTATIVO');
console.log('═══════════════════════════════════════════════════════════\n');

const globalStates = new Set();
const statesByFile = {};

vehicles.forEach(vehicle => {
    const rotativoPath = path.join(basePath, vehicle, 'ROTATIVO');
    
    if (!fs.existsSync(rotativoPath)) {
        console.log(`⚠️  No existe carpeta ROTATIVO para ${vehicle}`);
        return;
    }

    const files = fs.readdirSync(rotativoPath).filter(f => f.endsWith('.txt'));
    console.log(`\n📁 ${vehicle}: ${files.length} archivos`);

    files.forEach(file => {
        const filePath = path.join(rotativoPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        const states = new Set();
        let lineCount = 0;
        let sessionCount = 0;

        lines.forEach(line => {
            line = line.trim();
            
            // Detectar cabecera de sesión
            if (line.startsWith('ROTATIVO;')) {
                sessionCount++;
            }
            
            // Detectar línea de datos (formato: DD/MM/YYYY-HH:MM:SS;Estado)
            if (line.match(/^\d{2}\/\d{2}\/\d{4}-\d{2}:\d{2}:\d{2};\d$/)) {
                const parts = line.split(';');
                if (parts.length >= 2) {
                    const state = parts[1].trim();
                    states.add(state);
                    globalStates.add(state);
                    lineCount++;
                }
            }
        });

        statesByFile[file] = {
            states: Array.from(states).sort(),
            lines: lineCount,
            sessions: sessionCount
        };

        const statesStr = Array.from(states).sort().join(', ');
        console.log(`   ${file}: ${sessionCount} sesiones, ${lineCount} mediciones, Estados: [${statesStr}]`);
    });
});

console.log('\n═══════════════════════════════════════════════════════════');
console.log('RESUMEN GLOBAL');
console.log('═══════════════════════════════════════════════════════════\n');

const sortedStates = Array.from(globalStates).sort();
console.log(`Estados encontrados en TODOS los archivos: [${sortedStates.join(', ')}]\n`);

if (sortedStates.length === 1) {
    console.log('⚠️  SOLO HAY 1 ESTADO en todos los archivos');
} else if (sortedStates.length === 2) {
    console.log('⚠️  SOLO HAY 2 ESTADOS en todos los archivos');
    console.log('   Falta: Estados 2, 3, 4, 5 (operaciones)');
} else if (!sortedStates.includes('2')) {
    console.log('⚠️  FALTA Estado 2 (Emergencia con rotativo)');
}

console.log('\n📊 INTERPRETACIÓN:');
console.log('   Estado 0: Taller / Fuera de servicio');
console.log('   Estado 1: Operativo en Parque');
console.log('   Estado 2: Emergencia con rotativo ← FALTA');
console.log('   Estado 3: En Siniestro ← FALTA');
console.log('   Estado 4: Fin de Actuación ← FALTA');
console.log('   Estado 5: Regreso al Parque ← FALTA');

console.log('\n═══════════════════════════════════════════════════════════');
console.log('ANÁLISIS COMPLETADO');
console.log('═══════════════════════════════════════════════════════════\n');

