/**
 * 🔍 SCRIPT DE VALIDACIÓN PARA EVENTOS V2
 * 
 * Valida que los datos de estabilidad son compatibles con la nueva
 * especificación de eventos basada en fenómenos físicos.
 * 
 * Validaciones:
 * 1. Verificar convención de ejes (gx vs gy para roll rate)
 * 2. Calcular frecuencia de muestreo promedio
 * 3. Analizar rangos de valores
 * 4. Estimar eventos esperados con nuevos umbrales
 * 
 * Uso:
 *   npx ts-node scripts/analisis/validar-datos-eventos-v2.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CONFIG = {
    // Número de sesiones a analizar
    NUM_SESIONES: 5,

    // Número de muestras por sesión
    MUESTRAS_POR_SESION: 1000,

    // Umbrales de la nueva especificación
    UMBRALES: {
        MANIOBRA_BRUSCA: {
            gy_moderada: 15,
            gy_grave: 25,
            roll_max: 10
        },
        INCLINACION_EXCESIVA: {
            roll_moderada: 20,
            roll_critica: 30,
            ay_g_max: 0.10,
            gy_max: 3
        },
        CURVA_VELOCIDAD: {
            ay_g_moderada: 0.30,
            ay_g_grave: 0.40,
            roll_max: 20,
            gy_max: 10
        }
    }
};

const G = 9.81;

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Calcular correlación entre dos arrays
 */
function calcularCorrelacion(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const mean_x = x.reduce((a, b) => a + b, 0) / n;
    const mean_y = y.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denom_x = 0;
    let denom_y = 0;

    for (let i = 0; i < n; i++) {
        const dx = x[i] - mean_x;
        const dy = y[i] - mean_y;
        numerator += dx * dy;
        denom_x += dx * dx;
        denom_y += dy * dy;
    }

    if (denom_x === 0 || denom_y === 0) return 0;

    return numerator / Math.sqrt(denom_x * denom_y);
}

/**
 * Calcular derivada numérica
 */
function calcularDerivada(valores: number[], dt: number = 0.1): number[] {
    const derivada: number[] = [];

    for (let i = 1; i < valores.length; i++) {
        derivada.push((valores[i] - valores[i - 1]) / dt);
    }

    return derivada;
}

// ============================================================================
// VALIDACIONES
// ============================================================================

/**
 * VALIDACIÓN 1: Verificar convención de ejes
 * Determina si gy o gx es el roll rate (ω_roll)
 */
async function validarConvencionEjes(sessionId: string): Promise<{
    gy_es_roll_rate: boolean;
    correlacion_gy: number;
    correlacion_gx: number;
}> {
    console.log('\n📐 VALIDACIÓN 1: Convención de ejes');
    console.log('─'.repeat(80));

    // Obtener muestras
    const muestras = await prisma.stabilityMeasurement.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
        take: CONFIG.MUESTRAS_POR_SESION,
        select: {
            timestamp: true,
            gx: true,
            gy: true,
            gz: true,
            roll: true,
            pitch: true,
            yaw: true
        }
    });

    if (muestras.length < 10) {
        console.log('❌ Pocas muestras para analizar');
        return { gy_es_roll_rate: false, correlacion_gy: 0, correlacion_gx: 0 };
    }

    // Calcular derivadas de roll, pitch, yaw
    const roll_values = muestras.map(m => m.roll).filter((r): r is number => r !== null);
    const d_roll = calcularDerivada(roll_values);

    // Extraer gy y gx (ignorar primera muestra por derivada)
    const gy_values = muestras.slice(1).map(m => m.gy).filter((g): g is number => g !== null);
    const gx_values = muestras.slice(1).map(m => m.gx).filter((g): g is number => g !== null);

    // Calcular correlaciones
    const correlacion_gy_roll = calcularCorrelacion(gy_values, d_roll);
    const correlacion_gx_roll = calcularCorrelacion(gx_values, d_roll);

    console.log(`\n📊 Correlaciones con d(roll)/dt:`);
    console.log(`   gy vs d(roll)/dt: ${correlacion_gy_roll.toFixed(3)}`);
    console.log(`   gx vs d(roll)/dt: ${correlacion_gx_roll.toFixed(3)}`);

    // Determinar cuál es roll rate
    const gy_es_roll_rate = Math.abs(correlacion_gy_roll) > Math.abs(correlacion_gx_roll);

    if (gy_es_roll_rate) {
        console.log(`\n✅ CONCLUSIÓN: gy es el roll rate (ω_roll)`);
        console.log(`   Correlación: ${Math.abs(correlacion_gy_roll).toFixed(3)}`);
        if (Math.abs(correlacion_gy_roll) < 0.5) {
            console.log(`⚠️  ADVERTENCIA: Correlación baja, verificar manualmente`);
        }
    } else {
        console.log(`\n⚠️  CONCLUSIÓN: gx parece ser el roll rate (ω_roll)`);
        console.log(`   Correlación: ${Math.abs(correlacion_gx_roll).toFixed(3)}`);
        console.log(`   ⚠️ IMPORTANTE: Ajustar código para usar gx en lugar de gy`);
    }

    return {
        gy_es_roll_rate,
        correlacion_gy: correlacion_gy_roll,
        correlacion_gx: correlacion_gx_roll
    };
}

/**
 * VALIDACIÓN 2: Calcular frecuencia de muestreo
 */
async function validarFrecuenciaMuestreo(sessionId: string): Promise<{
    frecuencia_hz: number;
    ventana_1s_mediciones: number;
}> {
    console.log('\n⏱️  VALIDACIÓN 2: Frecuencia de muestreo');
    console.log('─'.repeat(80));

    // Obtener muestras con timestamps
    const muestras = await prisma.stabilityMeasurement.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
        take: 100,
        select: { timestamp: true }
    });

    if (muestras.length < 2) {
        console.log('❌ Pocas muestras');
        return { frecuencia_hz: 0, ventana_1s_mediciones: 0 };
    }

    // Calcular intervalos entre muestras
    const intervalos: number[] = [];
    for (let i = 1; i < muestras.length; i++) {
        const dt = muestras[i].timestamp.getTime() - muestras[i - 1].timestamp.getTime();
        if (dt > 0 && dt < 10000) { // Filtrar outliers
            intervalos.push(dt);
        }
    }

    if (intervalos.length === 0) {
        console.log('❌ No se pudieron calcular intervalos');
        return { frecuencia_hz: 0, ventana_1s_mediciones: 0 };
    }

    // Estadísticas
    const dt_promedio = intervalos.reduce((a, b) => a + b, 0) / intervalos.length;
    const dt_min = Math.min(...intervalos);
    const dt_max = Math.max(...intervalos);
    const frecuencia_hz = 1000 / dt_promedio; // ms → Hz
    const ventana_1s = Math.round(frecuencia_hz);

    console.log(`\n📊 Estadísticas de muestreo:`);
    console.log(`   Intervalo promedio: ${dt_promedio.toFixed(1)} ms`);
    console.log(`   Intervalo mínimo: ${dt_min.toFixed(1)} ms`);
    console.log(`   Intervalo máximo: ${dt_max.toFixed(1)} ms`);
    console.log(`   Frecuencia estimada: ${frecuencia_hz.toFixed(2)} Hz`);
    console.log(`\n✅ RECOMENDACIÓN: Usar ventana de ${ventana_1s} mediciones para 1 segundo`);

    return {
        frecuencia_hz,
        ventana_1s_mediciones: ventana_1s
    };
}

/**
 * VALIDACIÓN 3: Analizar rangos de valores
 */
async function validarRangosValores(sessionId: string): Promise<void> {
    console.log('\n📏 VALIDACIÓN 3: Rangos de valores');
    console.log('─'.repeat(80));

    // Obtener estadísticas
    const stats = await prisma.stabilityMeasurement.aggregate({
        where: { sessionId },
        _max: {
            ax: true,
            ay: true,
            az: true,
            gx: true,
            gy: true,
            gz: true,
            roll: true,
            pitch: true,
            yaw: true
        },
        _min: {
            ax: true,
            ay: true,
            az: true,
            gx: true,
            gy: true,
            gz: true,
            roll: true,
            pitch: true,
            yaw: true
        },
        _avg: {
            ax: true,
            ay: true,
            az: true,
            roll: true,
            pitch: true
        }
    });

    console.log(`\n📊 Aceleraciones (m/s²):`);
    console.log(`   ax: [${stats._min.ax?.toFixed(2)}, ${stats._max.ax?.toFixed(2)}] (avg: ${stats._avg.ax?.toFixed(2)})`);
    console.log(`   ay: [${stats._min.ay?.toFixed(2)}, ${stats._max.ay?.toFixed(2)}] (avg: ${stats._avg.ay?.toFixed(2)})`);
    console.log(`   az: [${stats._min.az?.toFixed(2)}, ${stats._max.az?.toFixed(2)}] (avg: ${stats._avg.az?.toFixed(2)})`);
    console.log(`   ay_max en g: ${((stats._max.ay || 0) / G).toFixed(2)} g`);

    console.log(`\n📊 Velocidades angulares (°/s):`);
    console.log(`   gx: [${stats._min.gx?.toFixed(1)}, ${stats._max.gx?.toFixed(1)}]`);
    console.log(`   gy: [${stats._min.gy?.toFixed(1)}, ${stats._max.gy?.toFixed(1)}]`);
    console.log(`   gz: [${stats._min.gz?.toFixed(1)}, ${stats._max.gz?.toFixed(1)}]`);

    console.log(`\n📊 Ángulos (°):`);
    console.log(`   roll: [${stats._min.roll?.toFixed(1)}, ${stats._max.roll?.toFixed(1)}] (avg: ${stats._avg.roll?.toFixed(1)})`);
    console.log(`   pitch: [${stats._min.pitch?.toFixed(1)}, ${stats._max.pitch?.toFixed(1)}] (avg: ${stats._avg.pitch?.toFixed(1)})`);
    console.log(`   yaw: [${stats._min.yaw?.toFixed(1)}, ${stats._max.yaw?.toFixed(1)}]`);

    // Verificar si los valores están en rangos esperados
    const ay_max_abs = Math.max(Math.abs(stats._min.ay || 0), Math.abs(stats._max.ay || 0));
    const roll_max_abs = Math.max(Math.abs(stats._min.roll || 0), Math.abs(stats._max.roll || 0));

    console.log(`\n✅ Verificación de rangos:`);
    if (ay_max_abs > CONFIG.UMBRALES.CURVA_VELOCIDAD.ay_g_moderada * G) {
        console.log(`   ✓ ay alcanza valores de curva velocidad excesiva (>${CONFIG.UMBRALES.CURVA_VELOCIDAD.ay_g_moderada}g)`);
    } else {
        console.log(`   ⚠️  ay no alcanza umbral de curva velocidad (max: ${(ay_max_abs / G).toFixed(2)}g)`);
    }

    if (roll_max_abs > CONFIG.UMBRALES.INCLINACION_EXCESIVA.roll_moderada) {
        console.log(`   ✓ roll alcanza valores de inclinación excesiva (>${CONFIG.UMBRALES.INCLINACION_EXCESIVA.roll_moderada}°)`);
    } else {
        console.log(`   ⚠️  roll no alcanza umbral de inclinación (max: ${roll_max_abs.toFixed(1)}°)`);
    }
}

/**
 * VALIDACIÓN 4: Estimar eventos esperados
 */
async function estimarEventosEsperados(sessionId: string, gy_es_roll_rate: boolean): Promise<void> {
    console.log('\n🎯 VALIDACIÓN 4: Estimación de eventos');
    console.log('─'.repeat(80));

    // Obtener todas las mediciones
    const muestras = await prisma.stabilityMeasurement.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
        select: {
            ay: true,
            gx: true,
            gy: true,
            roll: true
        }
    });

    // Campo correcto para roll rate
    const roll_rate_field = gy_es_roll_rate ? 'gy' : 'gx';

    // Contar mediciones que cumplen criterios
    let count_maniobra_brusca = 0;
    let count_inclinacion_excesiva = 0;
    let count_curva_velocidad = 0;

    for (const m of muestras) {
        const roll_rate = gy_es_roll_rate ? Math.abs(m.gy || 0) : Math.abs(m.gx || 0);
        const roll_abs = Math.abs(m.roll || 0);
        const ay_g = Math.abs(m.ay || 0) / G;

        // MANIOBRA_BRUSCA: |ω_roll| > 15°/s y |roll| < 10°
        if (roll_rate > CONFIG.UMBRALES.MANIOBRA_BRUSCA.gy_moderada &&
            roll_abs < CONFIG.UMBRALES.MANIOBRA_BRUSCA.roll_max) {
            count_maniobra_brusca++;
        }

        // INCLINACION_EXCESIVA: |roll| > 20° y dinámica baja
        // (aproximación: solo verificamos roll, sin analizar ventana)
        if (roll_abs > CONFIG.UMBRALES.INCLINACION_EXCESIVA.roll_moderada) {
            count_inclinacion_excesiva++;
        }

        // CURVA_VELOCIDAD: ay > 0.30g y |roll| < 20°
        // (aproximación: sin verificar duración sostenida)
        if (ay_g > CONFIG.UMBRALES.CURVA_VELOCIDAD.ay_g_moderada &&
            roll_abs < CONFIG.UMBRALES.CURVA_VELOCIDAD.roll_max) {
            count_curva_velocidad++;
        }
    }

    const total_mediciones = muestras.length;

    console.log(`\n📊 Mediciones que cumplen criterios (aproximado):`);
    console.log(`   Total mediciones: ${total_mediciones}`);
    console.log(`\n   MANIOBRA_BRUSCA:`);
    console.log(`     Mediciones: ${count_maniobra_brusca} (${((count_maniobra_brusca / total_mediciones) * 100).toFixed(2)}%)`);
    console.log(`     Eventos estimados (después de ventana + deduplicación): ${Math.ceil(count_maniobra_brusca / 30)}`);

    console.log(`\n   INCLINACION_LATERAL_EXCESIVA:`);
    console.log(`     Mediciones: ${count_inclinacion_excesiva} (${((count_inclinacion_excesiva / total_mediciones) * 100).toFixed(2)}%)`);
    console.log(`     Eventos estimados: ${Math.ceil(count_inclinacion_excesiva / 50)}`);

    console.log(`\n   CURVA_VELOCIDAD_EXCESIVA:`);
    console.log(`     Mediciones: ${count_curva_velocidad} (${((count_curva_velocidad / total_mediciones) * 100).toFixed(2)}%)`);
    console.log(`     Eventos estimados: ${Math.ceil(count_curva_velocidad / 40)}`);

    console.log(`\n✅ Total eventos estimados: ${Math.ceil(count_maniobra_brusca / 30 + count_inclinacion_excesiva / 50 + count_curva_velocidad / 40)}`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    console.log('╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                  🔍 VALIDACIÓN DE DATOS PARA EVENTOS V2                    ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝');

    try {
        // Obtener sesiones recientes con datos de estabilidad
        const sesiones = await prisma.session.findMany({
            where: {
                StabilityMeasurement: {
                    some: {}
                }
            },
            orderBy: { createdAt: 'desc' },
            take: CONFIG.NUM_SESIONES,
            select: {
                id: true,
                vehicleId: true,
                createdAt: true,
                _count: {
                    select: {
                        StabilityMeasurement: true
                    }
                }
            }
        });

        if (sesiones.length === 0) {
            console.log('\n❌ No se encontraron sesiones con datos de estabilidad');
            return;
        }

        console.log(`\n📋 Sesiones a analizar: ${sesiones.length}`);

        // Analizar cada sesión
        const resultados: any[] = [];

        for (let i = 0; i < sesiones.length; i++) {
            const sesion = sesiones[i];

            console.log(`\n${'═'.repeat(80)}`);
            console.log(`📍 SESIÓN ${i + 1}/${sesiones.length}`);
            console.log(`   ID: ${sesion.id}`);
            console.log(`   Vehículo: ${sesion.vehicleId}`);
            console.log(`   Fecha: ${sesion.createdAt.toISOString().split('T')[0]}`);
            console.log(`   Mediciones: ${sesion._count.StabilityMeasurement}`);
            console.log(`${'═'.repeat(80)}`);

            // Ejecutar validaciones
            const conversionEjes = await validarConvencionEjes(sesion.id);
            const frecuencia = await validarFrecuenciaMuestreo(sesion.id);
            await validarRangosValores(sesion.id);
            await estimarEventosEsperados(sesion.id, conversionEjes.gy_es_roll_rate);

            resultados.push({
                sessionId: sesion.id,
                ...conversionEjes,
                ...frecuencia
            });
        }

        // Resumen final
        console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
        console.log('║                          📊 RESUMEN FINAL                                  ║');
        console.log('╚════════════════════════════════════════════════════════════════════════════╝');

        const gy_es_roll_count = resultados.filter(r => r.gy_es_roll_rate).length;
        const frecuencia_promedio = resultados.reduce((sum, r) => sum + r.frecuencia_hz, 0) / resultados.length;
        const ventana_promedio = Math.round(frecuencia_promedio);

        console.log(`\n✅ CONVENCIÓN DE EJES:`);
        console.log(`   ${gy_es_roll_count}/${resultados.length} sesiones confirman que gy es roll rate (ω_roll)`);
        if (gy_es_roll_count === resultados.length) {
            console.log(`   ✓ CONCLUSIÓN: Usar gy como roll rate en el código`);
        } else {
            console.log(`   ⚠️  ADVERTENCIA: Revisar manualmente las sesiones inconsistentes`);
        }

        console.log(`\n✅ FRECUENCIA DE MUESTREO:`);
        console.log(`   Promedio: ${frecuencia_promedio.toFixed(2)} Hz`);
        console.log(`   ✓ RECOMENDACIÓN: CONFIG.VENTANA_TAMAÑO_MEDICIONES = ${ventana_promedio}`);

        console.log(`\n✅ PRÓXIMOS PASOS:`);
        console.log(`   1. Actualizar CONFIG.VENTANA_TAMAÑO_MEDICIONES = ${ventana_promedio} en eventDetectorV2.ts`);
        console.log(`   2. Confirmar que gy es el roll rate ${gy_es_roll_count === resultados.length ? '(ya confirmado)' : '(VERIFICAR MANUALMENTE)'}`);
        console.log(`   3. Ejecutar tests unitarios`);
        console.log(`   4. Probar con una sesión real: detectarEventosSesionV2(sessionId)`);

    } catch (error: any) {
        console.error(`\n❌ Error: ${error.message}`);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar
main();

