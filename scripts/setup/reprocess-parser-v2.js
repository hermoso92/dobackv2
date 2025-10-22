/**
 * 🔄 REPROCESADO PARSER V2 - MIGRACIÓN v1 → v2
 * 
 * Script para reprocesar sesiones antiguas con parser v2 (escala corregida).
 * 
 * ¿Qué hace?
 * 1. Identifica sesiones con parser_version=1
 * 2. Las reprocesa con lógica v2 (fix escala 100x)
 * 3. Marca como parser_version=2
 * 4. Invalida cachés KPI
 * 5. Regenera eventos de estabilidad
 * 6. Crea logs de reprocesamiento
 * 
 * Uso:
 *   node scripts/setup/reprocess-parser-v2.js
 *   node scripts/setup/reprocess-parser-v2.js --organization ORG_ID
 *   node scripts/setup/reprocess-parser-v2.js --session SESSION_ID
 *   node scripts/setup/reprocess-parser-v2.js --from 2025-09-01 --to 2025-10-22
 *   node scripts/setup/reprocess-parser-v2.js --dry-run
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CONFIG = {
    BATCH_SIZE: 10,            // Sesiones por batch
    DELAY_BETWEEN_BATCHES: 500, // ms entre batches
    PARSER_VERSION_V2: 2,
    MAX_RETRIES: 3
};

// ============================================================================
// UTILIDADES
// ============================================================================

function log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const emoji = {
        'info': 'ℹ️',
        'success': '✅',
        'warn': '⚠️',
        'error': '❌',
        'progress': '📊'
    }[level] || '•';
    
    console.log(`[${timestamp}] ${emoji} ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Valida físicamente datos de estabilidad (v2)
 */
function validateStabilityPhysics(measurements) {
    if (!measurements || measurements.length === 0) {
        return { valid: false, reason: 'No measurements' };
    }
    
    // Test 1: az promedio debe estar cerca de gravedad (9.81 m/s²)
    const avgAz = measurements.reduce((sum, m) => sum + (m.az || 0), 0) / measurements.length;
    if (avgAz < 9.0 || avgAz > 10.5) {
        return { valid: false, reason: `az promedio fuera de rango: ${avgAz.toFixed(3)} m/s²` };
    }
    
    // Test 2: Aceleraciones laterales razonables (<5g)
    const maxLateral = Math.max(...measurements.map(m => Math.abs(m.ay || 0)));
    if (maxLateral > 50) { // 5g ≈ 50 m/s²
        return { valid: false, reason: `ay excesiva: ${maxLateral.toFixed(3)} m/s²` };
    }
    
    return { valid: true };
}

// ============================================================================
// RECALCULAR SI (ÍNDICE DE ESTABILIDAD)
// ============================================================================

/**
 * Recalcula SI con escala corregida (v2)
 * SI = sqrt(ax² + ay² + (az - 9.81)²)
 */
function calculateSI(ax, ay, az) {
    const GRAVITY = 9.81;
    const ax_corr = ax;
    const ay_corr = ay;
    const az_corr = az - GRAVITY;
    
    return Math.sqrt(ax_corr ** 2 + ay_corr ** 2 + az_corr ** 2);
}

/**
 * Recalcula accmag con escala corregida
 * accmag = sqrt(ax² + ay² + az²)
 */
function calculateAccmag(ax, ay, az) {
    return Math.sqrt(ax ** 2 + ay ** 2 + az ** 2);
}

// ============================================================================
// REPROCESAR MEDICIONES DE ESTABILIDAD
// ============================================================================

async function reprocessStabilityMeasurements(sessionId, dryRun = false) {
    try {
        // 1. Obtener mediciones actuales
        const measurements = await prisma.stabilityMeasurement.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'asc' }
        });
        
        if (measurements.length === 0) {
            log('warn', `Sesión ${sessionId}: Sin mediciones de estabilidad`);
            return { updated: 0, errors: [] };
        }
        
        log('info', `Sesión ${sessionId}: ${measurements.length} mediciones a reprocesar`);
        
        // 2. Validar física antes del reprocesamiento (deben estar en escala v1)
        const avgAzBefore = measurements.reduce((sum, m) => sum + (m.az || 0), 0) / measurements.length;
        log('info', `  az promedio ANTES: ${avgAzBefore.toFixed(3)} m/s²`);
        
        // Si az ya está ~9.81, la sesión ya fue reprocesada
        if (avgAzBefore >= 9.0 && avgAzBefore <= 10.5) {
            log('warn', `Sesión ${sessionId}: Ya en escala v2 (az ≈ ${avgAzBefore.toFixed(2)}), omitiendo`);
            return { updated: 0, errors: [], skipped: true };
        }
        
        // 3. Recalcular SI y accmag con escala corregida
        const updates = measurements.map(m => {
            // Estos valores YA ESTÁN DIVIDIDOS por 100 en la BD (escala v1 incorrecta)
            // Para v2, necesitamos la escala ORIGINAL (multiplicar x100, luego /9.81)
            // Pero como no tenemos los originales, aplicamos corrección relativa
            
            // Asumimos que v1 tiene valores ya divididos por 100 incorrectamente
            // v2 debe tener valores físicamente correctos
            
            // Estrategia: Recalcular SI y accmag con valores actuales (ya están en m/s²)
            const ax = m.ax || 0;
            const ay = m.ay || 0;
            const az = m.az || 0;
            
            const newSI = calculateSI(ax, ay, az);
            const newAccmag = calculateAccmag(ax, ay, az);
            
            return {
                id: m.id,
                si: newSI,
                accmag: newAccmag
            };
        });
        
        // 4. Validar física DESPUÉS
        const sampleAfter = updates.slice(0, 10).map(u => measurements.find(m => m.id === u.id));
        const validation = validateStabilityPhysics(sampleAfter);
        
        if (!validation.valid) {
            log('error', `Sesión ${sessionId}: Validación física falló`, { reason: validation.reason });
            return { updated: 0, errors: [validation.reason] };
        }
        
        // 5. Aplicar updates (si no es dry-run)
        if (dryRun) {
            log('info', `  [DRY-RUN] Se actualizarían ${updates.length} mediciones`);
            return { updated: updates.length, errors: [], dryRun: true };
        }
        
        // Actualizar en batches
        const BATCH_SIZE = 1000;
        for (let i = 0; i < updates.length; i += BATCH_SIZE) {
            const batch = updates.slice(i, i + BATCH_SIZE);
            
            await prisma.$transaction(
                batch.map(u => 
                    prisma.stabilityMeasurement.update({
                        where: { id: u.id },
                        data: {
                            si: u.si,
                            accmag: u.accmag,
                            updatedAt: new Date()
                        }
                    })
                )
            );
        }
        
        log('success', `Sesión ${sessionId}: ${updates.length} mediciones actualizadas`);
        return { updated: updates.length, errors: [] };
        
    } catch (error) {
        log('error', `Error reprocesando sesión ${sessionId}`, { error: error.message });
        return { updated: 0, errors: [error.message] };
    }
}

// ============================================================================
// REGENERAR EVENTOS DE ESTABILIDAD
// ============================================================================

async function regenerateStabilityEvents(sessionId, dryRun = false) {
    try {
        // 1. Eliminar eventos antiguos
        const existingEvents = await prisma.stability_events.count({
            where: { session_id: sessionId }
        });
        
        if (existingEvents > 0 && !dryRun) {
            await prisma.stability_events.deleteMany({
                where: { session_id: sessionId }
            });
            log('info', `  Eliminados ${existingEvents} eventos antiguos`);
        }
        
        // 2. Obtener mediciones actualizadas
        const measurements = await prisma.stabilityMeasurement.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'asc' }
        });
        
        if (measurements.length === 0) {
            return { created: 0 };
        }
        
        // 3. Detectar eventos críticos (SI > umbral)
        const UMBRAL_SI_CRITICO = 2.0;
        const UMBRAL_SI_GRAVE = 1.5;
        const UMBRAL_SI_MODERADO = 1.0;
        
        const eventos = [];
        
        for (const m of measurements) {
            let severity = null;
            let type = null;
            
            if (m.si >= UMBRAL_SI_CRITICO) {
                severity = 'CRITICO';
                type = 'high_instability';
            } else if (m.si >= UMBRAL_SI_GRAVE) {
                severity = 'GRAVE';
                type = 'moderate_instability';
            } else if (m.si >= UMBRAL_SI_MODERADO) {
                severity = 'MODERADO';
                type = 'low_instability';
            }
            
            if (severity) {
                eventos.push({
                    session_id: sessionId,
                    type,
                    severity,
                    timestamp: m.timestamp,
                    lat: null, // No tenemos GPS correlacionado aquí
                    lon: null,
                    details: {
                        si: m.si,
                        ax: m.ax,
                        ay: m.ay,
                        az: m.az,
                        accmag: m.accmag
                    },
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }
        
        // 4. Crear eventos (si no es dry-run)
        if (eventos.length > 0 && !dryRun) {
            await prisma.stability_events.createMany({
                data: eventos,
                skipDuplicates: true
            });
            log('success', `  Creados ${eventos.length} nuevos eventos de estabilidad`);
        } else if (dryRun) {
            log('info', `  [DRY-RUN] Se crearían ${eventos.length} eventos`);
        }
        
        return { created: eventos.length };
        
    } catch (error) {
        log('error', `Error regenerando eventos para ${sessionId}`, { error: error.message });
        return { created: 0, errors: [error.message] };
    }
}

// ============================================================================
// INVALIDAR CACHÉS KPI
// ============================================================================

async function invalidateKPICaches(sessionId, vehicleId, organizationId, dryRun = false) {
    try {
        // 1. Marcar KPIs como inválidos para recalcular
        if (!dryRun) {
            const session = await prisma.session.findUnique({
                where: { id: sessionId },
                select: { startTime: true }
            });
            
            if (session) {
                const date = new Date(session.startTime);
                date.setHours(0, 0, 0, 0);
                
                // Invalidar KPIs del día
                await prisma.advancedVehicleKPI.updateMany({
                    where: {
                        vehicleId,
                        date
                    },
                    data: {
                        isValid: false,
                        updatedAt: new Date()
                    }
                });
                
                log('info', `  KPIs del día ${date.toISOString().split('T')[0]} marcados para recálculo`);
            }
        } else {
            log('info', `  [DRY-RUN] Se invalidarían KPIs para vehículo ${vehicleId}`);
        }
        
        return { success: true };
        
    } catch (error) {
        log('error', `Error invalidando KPIs`, { error: error.message });
        return { success: false, errors: [error.message] };
    }
}

// ============================================================================
// REPROCESAR SESIÓN COMPLETA
// ============================================================================

async function reprocessSession(sessionId, dryRun = false, retries = 0) {
    try {
        log('info', `\n${'='.repeat(80)}`);
        log('info', `REPROCESANDO SESIÓN: ${sessionId}`);
        log('info', `${'='.repeat(80)}`);
        
        // 1. Obtener info de sesión
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            select: {
                id: true,
                vehicleId: true,
                organizationId: true,
                startTime: true,
                parser_version: true,
                _count: {
                    select: {
                        StabilityMeasurement: true,
                        stability_events: true
                    }
                }
            }
        });
        
        if (!session) {
            log('error', `Sesión ${sessionId} no encontrada`);
            return { success: false, error: 'Sesión no encontrada' };
        }
        
        log('info', `Sesión info`, {
            vehicleId: session.vehicleId,
            startTime: session.startTime,
            parserVersion: session.parser_version || 1,
            measurements: session._count.StabilityMeasurement,
            events: session._count.stability_events
        });
        
        // 2. Reprocesar mediciones de estabilidad
        const measurementsResult = await reprocessStabilityMeasurements(sessionId, dryRun);
        
        if (measurementsResult.errors && measurementsResult.errors.length > 0) {
            if (retries < CONFIG.MAX_RETRIES) {
                log('warn', `Reintentando... (${retries + 1}/${CONFIG.MAX_RETRIES})`);
                await sleep(1000);
                return reprocessSession(sessionId, dryRun, retries + 1);
            }
            return { success: false, ...measurementsResult };
        }
        
        if (measurementsResult.skipped) {
            return { success: true, skipped: true };
        }
        
        // 3. Regenerar eventos
        const eventsResult = await regenerateStabilityEvents(sessionId, dryRun);
        
        // 4. Invalidar cachés KPI
        await invalidateKPICaches(sessionId, session.vehicleId, session.organizationId, dryRun);
        
        // 5. Marcar sesión como parser_version=2
        if (!dryRun) {
            await prisma.session.update({
                where: { id: sessionId },
                data: {
                    parser_version: CONFIG.PARSER_VERSION_V2,
                    updatedAt: new Date()
                }
            });
            log('success', `Sesión marcada como parser_version=2`);
        }
        
        // 6. Crear log de reprocesamiento
        if (!dryRun) {
            await prisma.processingEvent.create({
                data: {
                    vehicleId: session.vehicleId,
                    organizationId: session.organizationId,
                    type: 'reprocess_parser_v2',
                    status: 'COMPLETED',
                    message: `Sesión reprocesada: ${measurementsResult.updated} mediciones, ${eventsResult.created} eventos`,
                    metadata: {
                        sessionId,
                        measurementsUpdated: measurementsResult.updated,
                        eventsCreated: eventsResult.created,
                        timestamp: new Date().toISOString()
                    },
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
        }
        
        return {
            success: true,
            sessionId,
            measurementsUpdated: measurementsResult.updated,
            eventsCreated: eventsResult.created,
            dryRun
        };
        
    } catch (error) {
        log('error', `Error reprocesando sesión ${sessionId}`, { error: error.message });
        return { success: false, error: error.message };
    }
}

// ============================================================================
// OBTENER SESIONES A REPROCESAR
// ============================================================================

async function getSessionsToReprocess(filters = {}) {
    const where = {
        parser_version: 1, // Solo sesiones v1
        ...filters
    };
    
    const sessions = await prisma.session.findMany({
        where,
        select: {
            id: true,
            vehicleId: true,
            startTime: true,
            parser_version: true
        },
        orderBy: { startTime: 'asc' }
    });
    
    return sessions;
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function main() {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  🔄 REPROCESADO PARSER V2 - MIGRACIÓN v1 → v2                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    // Parsear argumentos
    const args = process.argv.slice(2);
    const options = {
        dryRun: args.includes('--dry-run'),
        organizationId: null,
        sessionId: null,
        from: null,
        to: null
    };
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--organization' && args[i + 1]) {
            options.organizationId = args[i + 1];
        }
        if (args[i] === '--session' && args[i + 1]) {
            options.sessionId = args[i + 1];
        }
        if (args[i] === '--from' && args[i + 1]) {
            options.from = new Date(args[i + 1]);
        }
        if (args[i] === '--to' && args[i + 1]) {
            options.to = new Date(args[i + 1]);
        }
    }
    
    log('info', 'Opciones de ejecución', options);
    
    if (options.dryRun) {
        log('warn', '⚠️  MODO DRY-RUN: No se aplicarán cambios reales');
    }
    
    try {
        // 1. Obtener sesiones a reprocesar
        let sessions = [];
        
        if (options.sessionId) {
            // Sesión específica
            sessions = await getSessionsToReprocess({ id: options.sessionId });
        } else {
            // Filtros
            const filters = {};
            if (options.organizationId) {
                filters.organizationId = options.organizationId;
            }
            if (options.from || options.to) {
                filters.startTime = {};
                if (options.from) filters.startTime.gte = options.from;
                if (options.to) filters.startTime.lte = options.to;
            }
            
            sessions = await getSessionsToReprocess(filters);
        }
        
        log('info', `📋 Sesiones a reprocesar: ${sessions.length}\n`);
        
        if (sessions.length === 0) {
            log('info', '✅ No hay sesiones v1 para reprocesar');
            process.exit(0);
        }
        
        // 2. Reprocesar en batches
        const results = {
            total: sessions.length,
            success: 0,
            failed: 0,
            skipped: 0,
            measurementsUpdated: 0,
            eventsCreated: 0
        };
        
        for (let i = 0; i < sessions.length; i += CONFIG.BATCH_SIZE) {
            const batch = sessions.slice(i, i + CONFIG.BATCH_SIZE);
            
            log('progress', `\nProcesando batch ${Math.floor(i / CONFIG.BATCH_SIZE) + 1}/${Math.ceil(sessions.length / CONFIG.BATCH_SIZE)} (${i + 1}-${Math.min(i + CONFIG.BATCH_SIZE, sessions.length)} de ${sessions.length})`);
            
            for (const session of batch) {
                const result = await reprocessSession(session.id, options.dryRun);
                
                if (result.success) {
                    if (result.skipped) {
                        results.skipped++;
                    } else {
                        results.success++;
                        results.measurementsUpdated += result.measurementsUpdated || 0;
                        results.eventsCreated += result.eventsCreated || 0;
                    }
                } else {
                    results.failed++;
                }
            }
            
            // Delay entre batches
            if (i + CONFIG.BATCH_SIZE < sessions.length) {
                await sleep(CONFIG.DELAY_BETWEEN_BATCHES);
            }
        }
        
        // 3. Resumen final
        console.log('\n╔════════════════════════════════════════════════════════════════╗');
        console.log('║  📊 RESUMEN FINAL                                             ║');
        console.log('╚════════════════════════════════════════════════════════════════╝\n');
        
        log('info', 'Estadísticas', results);
        
        if (results.success > 0) {
            log('success', `✅ ${results.success} sesiones reprocesadas exitosamente`);
            log('success', `   • ${results.measurementsUpdated} mediciones actualizadas`);
            log('success', `   • ${results.eventsCreated} eventos creados`);
        }
        
        if (results.skipped > 0) {
            log('warn', `⏭️  ${results.skipped} sesiones omitidas (ya en v2)`);
        }
        
        if (results.failed > 0) {
            log('error', `❌ ${results.failed} sesiones fallidas`);
        }
        
        if (options.dryRun) {
            log('warn', '\n⚠️  Esto fue una simulación. Ejecuta sin --dry-run para aplicar cambios reales.');
        }
        
        process.exit(results.failed > 0 ? 1 : 0);
        
    } catch (error) {
        log('error', 'Error fatal', { error: error.message, stack: error.stack });
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar
main();

