import fs from 'fs';
import path from 'path';
import { detectarSesionesEstabilidad, parseEstabilidadRobust } from './src/services/parsers/RobustStabilityParser';

const archivoPath = path.join(__dirname, 'data', 'datosDoback', 'CMadrid', 'doback024', 'estabilidad', 'ESTABILIDAD_DOBACK024_20251008.txt');

console.log('📖 Leyendo archivo ESTABILIDAD...\n');

const buffer = fs.readFileSync(archivoPath);
const contenido = buffer.toString('utf-8');
const lineas = contenido.split('\n');

console.log(`Total de líneas: ${lineas.length}`);
console.log(`\nPrimeras 20 líneas:\n`);

for (let i = 0; i < 20 && i < lineas.length; i++) {
    const linea = lineas[i];
    console.log(`${i + 1}: [${linea.substring(0, 100)}...]`);

    // Análisis
    if (linea.startsWith('ESTABILIDAD;')) console.log('   → CABECERA SESIÓN');
    if (linea.startsWith('ax')) console.log('   → CABECERA COLUMNAS');
    if (linea.match(/^\d{2}:\d{2}:\d{2}$/)) console.log('   → MARCADOR TEMPORAL');
    if (linea.includes(';') && !linea.startsWith('ESTABILIDAD') && !linea.startsWith('ax')) {
        const partes = linea.split(';');
        console.log(`   → DATOS (${partes.length} campos)`);
    }
}

console.log('\n' + '='.repeat(80));
console.log('🔍 Detectando sesiones múltiples...\n');

const sesiones = detectarSesionesEstabilidad(buffer);
console.log(`Sesiones detectadas: ${sesiones.length}`);
sesiones.forEach(s => {
    console.log(`  - Sesión ${s.numeroSesion}: ${s.fecha} (líneas ${s.inicio}-${s.fin})`);
});

console.log('\n' + '='.repeat(80));
console.log('🔧 Parseando sesión 1...\n');

// Extraer solo la sesión 1
const lineasSesion1 = lineas.slice(sesiones[0].inicio, sesiones[0].fin + 1);
const bufferSesion1 = Buffer.from(lineasSesion1.join('\n'), 'utf-8');

const resultado = parseEstabilidadRobust(bufferSesion1, new Date('2025-10-08'));

console.log(`\n📊 RESULTADO:`);
console.log(`  Total líneas procesadas: ${resultado.estadisticas.total}`);
console.log(`  Válidas: ${resultado.estadisticas.validas}`);
console.log(`  Sin timestamp: ${resultado.estadisticas.sinTimestamp}`);
console.log(`  Valores inválidos: ${resultado.estadisticas.valoresInvalidos}`);
console.log(`  Marcadores detectados: ${resultado.estadisticas.marcadoresDetectados}`);
console.log(`  Porcentaje válido: ${resultado.estadisticas.porcentajeValido.toFixed(2)}%`);

if (resultado.problemas.length > 0) {
    console.log(`\n⚠️ Primeros 10 problemas:`);
    resultado.problemas.slice(0, 10).forEach(p => {
        console.log(`  [${p.tipo}] Línea ${p.linea}: ${p.descripcion}`);
    });
}

console.log(`\n✅ Mediciones parseadas: ${resultado.mediciones.length}`);
if (resultado.mediciones.length > 0) {
    console.log(`  Primera: ${resultado.mediciones[0].timestamp.toISOString()} - SI=${resultado.mediciones[0].si}`);
    console.log(`  Última: ${resultado.mediciones[resultado.mediciones.length - 1].timestamp.toISOString()} - SI=${resultado.mediciones[resultado.mediciones.length - 1].si}`);
}

