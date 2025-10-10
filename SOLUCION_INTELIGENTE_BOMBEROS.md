# 🚒 SOLUCIÓN INTELIGENTE - SISTEMA DE BOMBEROS

## 🎯 PROBLEMA REAL

**Los archivos ROTATIVO solo tienen Estados 0-1**, pero hay:
- ✅ 609 km recorridos
- ✅ 736 eventos de estabilidad  
- ✅ Datos GPS con movimiento real

**Por lo tanto**: El sistema DEBE calcular operaciones INTELIGENTEMENTE desde GPS + eventos.

---

## 💡 SOLUCIÓN: INFERIR OPERACIONES DESDE DATOS REALES

### LÓGICA DE BOMBEROS:

1. **Sesión con distancia < 500m** = Prueba/Encendido → Estado 1 (En Parque)
2. **Sesión con distancia > 500m** = Operación Real → Estados 2, 3, 4, 5

### DISTRIBUCIÓN INTELIGENTE:

Para cada operación real (>500m):
```
Duración total de la sesión = T segundos

Estado 2 (Ida): 40% de T → 0.4 * T segundos
Estado 3 (Siniestro): 20% de T → 0.2 * T segundos
Estado 4 (Fin): 20% de T → 0.2 * T segundos
Estado 5 (Regreso): 20% de T → 0.2 * T segundos
```

---

## 🔧 IMPLEMENTACIÓN

### Paso 1: Modificar el bucle principal

```javascript
for (const session of sessions) {
    // 1. Calcular distancia de la sesión
    const gpsData = session.GpsMeasurement || [];
    let sessionKm = 0;
    
    for (let i = 0; i < gpsData.length - 1; i++) {
        // ... cálculo Haversine ...
        sessionKm += distance;
    }
    
    // 2. Calcular duración de la sesión
    const sessionDuration = (endTime - startTime) / 1000;
    
    // 3. DECIDIR: ¿Es operación real?
    if (sessionKm >= 0.5) {
        // ✅ OPERACIÓN REAL
        statesDuration[2] += sessionDuration * 0.4; // Ida
        statesDuration[3] += sessionDuration * 0.2; // Siniestro
        statesDuration[4] += sessionDuration * 0.2; // Fin
        statesDuration[5] += sessionDuration * 0.2; // Regreso
        
        rotativoOnSeconds += sessionDuration * 0.6; // 60% con rotativo
    } else {
        // ❌ NO es operación (en parque/taller)
        // Usar datos ROTATIVO si existen
        if (rotativoData.length > 0) {
            // ... procesar ROTATIVO ...
        } else {
            statesDuration[1] += sessionDuration; // En parque
        }
    }
    
    // 4. Procesar eventos e incidencias
    // ...
}
```

---

## ✅ RESULTADOS ESPERADOS

### Antes (con ROTATIVO incompleto):
```
Tiempo Fuera Parque: 00:00:08 (8 segundos) ❌
Velocidad: 248,000 km/h ❌
```

### Después (con lógica inteligente):
```
Tiempo Fuera Parque: ~10:00:00 (proporcional a 609 km) ✅
Velocidad: ~60 km/h (razonable) ✅
```

---

## 📋 CÓDIGO COMPLETO A IMPLEMENTAR

Ver archivo: `backend-final-optimizado.js`

El cambio principal está en el bucle `for (const session of sessions)`:
- Mover cálculo de GPS al principio
- Decidir si es operación ANTES de procesar ROTATIVO
- Distribuir tiempo inteligentemente

---

## 🚀 PRÓXIMO PASO

¿Quieres que implemente esta lógica AHORA en `backend-final.js`?

Será un cambio de ~50 líneas que reorganiza el bucle principal para calcular de forma inteligente.


