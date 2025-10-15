/**
 * Este es el código EXACTO que debe reemplazar el bucle principal en backend-final.js
 * Desde la línea 940 hasta ~1041
 */

`
for (const session of sessions) {
    //🚒 PASO 1: CALCULAR DISTANCIA Y DURACIÓN DE LA SESIÓN
    const gpsData = session.GpsMeasurement || [];
    let sessionKm = 0;
    let sessionDuration = 0;
    
    totalGPSPoints += gpsData.length;
    
    // Calcular distancia desde GPS
    if (gpsData.length > 1) {
        for (let i = 0; i < gpsData.length - 1; i++) {
            const current = gpsData[i];
            const next = gpsData[i + 1];
            
            if (!current.latitude || !current.longitude || !next.latitude || !next.longitude) {
                invalidGPSPoints++;
                continue;
            }
            
            if (current.latitude === 0 || current.longitude === 0 ||
                Math.abs(current.latitude) > 90 || Math.abs(current.longitude) > 180) {
                invalidGPSPoints++;
                continue;
            }
            
            // Haversine
            const R = 6371;
            const dLat = (next.latitude - current.latitude) * Math.PI / 180;
            const dLon = (next.longitude - current.longitude) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(current.latitude * Math.PI / 180) * Math.cos(next.latitude * Math.PI / 180) *
                      Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;
            
            if (distance > 0 && distance < 5) {
                sessionKm += distance;
                valid GPSPoints++;
                distancesCalculated++;
            } else {
                invalidGPSPoints++;
            }
        }
    }
    
    totalKm += sessionKm;
    
    // Calcular duración
    if (session.startTime && session.endTime) {
        sessionDuration = (new Date(session.endTime) - new Date(session.startTime)) / 1000;
    }
    
    // 🚒 PASO 2: DECIDIR SI ES OPERACIÓN REAL (LÓGICA DE BOMBEROS)
    const esOperacionReal = sessionKm >= 0.5; // >500 metros
    
    if (esOperacionReal && sessionDuration > 0) {
        // ✅ OPERACIÓN REAL DETECTADA
        console.log(\`✅ Operación real: \${sessionKm.toFixed(2)} km, \${Math.round(sessionDuration/60)} min\`);
        
        realOperationTime += sessionDuration;
        
        // Distribuir tiempo entre estados operativos:
        statesDuration[2] += sessionDuration * 0.4; // Ida (40%)
        statesDuration[3] += sessionDuration * 0.2; // Siniestro (20%)
        statesDuration[4] += sessionDuration * 0.2; // Fin (20%)
        statesDuration[5] += sessionDuration * 0.2; // Regreso (20%)
        
        // Rotativo encendido en ida y siniestro (60%)
        rotativoOnSeconds += sessionDuration * 0.6;
        
    } else {
        // ❌ NO es operación (prueba, encendido, o en parque)
        console.log(\`❌ No es operación: \${sessionKm.toFixed(2)} km\`);
        
        const rotativoData = session.RotativoMeasurement || [];
        totalRotativoMeasurements += rotativoData.length;
        
        if (rotativoData.length > 1) {
            // Usar datos ROTATIVO para sesiones sin movimiento
            rotativoData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            for (let i = 0; i < rotativoData.length - 1; i++) {
                const current = rotativoData[i];
                const next = rotativoData[i + 1];
                const duration = (new Date(next.timestamp) - new Date(current.timestamp)) / 1000;
                const state = parseInt(current.state);
                
                if (statesDuration.hasOwnProperty(state)) {
                    statesDuration[state] += duration;
                }
            }
        } else if (sessionDuration > 0) {
            // Sin datos ROTATIVO, asumir en parque
            statesDuration[1] += sessionDuration;
        }
    }
    
    // 🚒 PASO 3: PROCESAR EVENTOS DE ESTABILIDAD
    const events = session.stability_events || [];
    for (const event of events) {
        const eventType = event.type || '';
        
        if (eventType === 'rollover_risk' || eventType === 'vuelco_inminente' ||
            eventType.includes('CRITICAL') || eventType.includes('VUELCO')) {
            criticalIncidents++;
        } 
        else if (eventType === 'dangerous_drift' || eventType.includes('drift') ||
                 eventType.includes('DRIFT') || eventType.includes('DERRAPE') ||
                 eventType.includes('MODERATE') || eventType.includes('WARNING')) {
            moderateIncidents++;
        }
        else {
            lightIncidents++;
        }
    }
}
`

console.log('Este código debe reemplazar el bucle principal en backend-final.js');
console.log('Busca: for (const session of sessions) {');
console.log('Reemplaza desde línea ~940 hasta ~1041');

