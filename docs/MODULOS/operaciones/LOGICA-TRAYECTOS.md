# Lógica de Trayectos - DobackSoft StabilSafe V3

## 📋 Resumen Ejecutivo

Este documento describe la lógica de trayectos en el sistema StabilSafe V3, enfocándose en cómo se distinguen las salidas de emergencia (con rotativo) de los regresos al parque (sin rotativo).

## 🎯 Definiciones Clave

### Trayecto
Un **trayecto** es una secuencia continua de movimiento del vehículo que comienza con el encendido del sistema y termina con el apagado.

### Estados del Rotativo
- **ON (1)**: Rotativo encendido - indica emergencia/prioridad
- **OFF (0)**: Rotativo apagado - indica desplazamiento normal

## 🔑 Claves Operacionales

### Clave 0 - Taller
- **Descripción**: Vehículo en mantenimiento
- **Característica**: No operativo, fuera de servicio
- **Rotativo**: N/A (vehículo inactivo)

### Clave 1 - Operativo en Parque
- **Descripción**: Vehículo en base, listo para salir
- **Característica**: Esperando asignación, motor apagado
- **Rotativo**: OFF
- **Ubicación**: Dentro de geocerca de parque

### Clave 2 - Salida en Emergencia
- **Descripción**: Vehículo sale a emergencia
- **Característica**: Respuesta a emergencia activa
- **Rotativo**: ON (obligatorio)
- **Transición**: Clave 1 → Clave 2 cuando rotativo se activa
- **Ubicación**: Sale de geocerca de parque

### Clave 3 - En Siniestro
- **Descripción**: Vehículo atendiendo el incidente
- **Característica**: Parado en lugar del siniestro (>1 minuto)
- **Rotativo**: ON o OFF (variable según protocolo)
- **Velocidad**: ≈ 0 km/h

### Clave 4 - Fin de Actuación
- **Descripción**: Emergencia atendida, preparando regreso
- **Característica**: Después del siniestro, antes de regresar
- **Rotativo**: OFF (ya no es emergencia)
- **Transición**: Clave 3 → Clave 4 cuando rotativo se apaga

### Clave 5 - Regreso al Parque
- **Descripción**: Vehículo regresando a base
- **Característica**: Desplazamiento sin emergencia
- **Rotativo**: OFF (siempre)
- **Velocidad**: > 0 km/h
- **Destino**: Geocerca de parque

## 🔄 Flujo de Estados en un Servicio Típico

```
┌─────────────────┐
│   Clave 1       │  Vehículo en parque, listo
│ Operativo       │  Rotativo: OFF
│ en Parque       │  Motor: Apagado/Ralentí
└────────┬────────┘
         │
         │ 🚨 Recibe aviso de emergencia
         │ ✅ Rotativo se enciende
         ▼
┌─────────────────┐
│   Clave 2       │  Sale con prioridad
│ Salida en       │  Rotativo: ON
│ Emergencia      │  Velocidad: Variable
└────────┬────────┘
         │
         │ 📍 Llega al lugar del siniestro
         │ 🛑 Se detiene (v ≈ 0 km/h)
         ▼
┌─────────────────┐
│   Clave 3       │  Atendiendo incidente
│ En Siniestro    │  Rotativo: ON/OFF
└────────┬────────┘
         │
         │ ✅ Emergencia resuelta
         │ 🔴 Rotativo se apaga
         ▼
┌─────────────────┐
│   Clave 4       │  Preparando regreso
│ Fin de          │  Rotativo: OFF
│ Actuación       │  Velocidad: Variable
└────────┬────────┘
         │
         │ 🏁 Inicia regreso a base
         │ 🚗 Desplazamiento sin rotativo
         ▼
┌─────────────────┐
│   Clave 5       │  Regreso sin prioridad
│ Regreso al      │  Rotativo: OFF
│ Parque          │  Velocidad: Normal
└────────┬────────┘
         │
         │ 📍 Entra en geocerca parque
         │ 🏁 Apaga motor
         ▼
┌─────────────────┐
│   Clave 1       │  Vuelve a estar disponible
│ Operativo       │
│ en Parque       │
└─────────────────┘
```

## 🔍 Distinción Crítica: Salida vs Regreso

### ¿Por qué es importante diferenciar?

1. **Métricas de Rendimiento**: Tiempo de respuesta solo cuenta desde Clave 2
2. **Análisis de Rutas**: Rutas de ida (con rotativo) pueden ser más rápidas
3. **Consumo de Combustible**: Mayor consumo con rotativo activado
4. **Estadísticas de Servicio**: KPIs separados para ida y regreso

### ¿Cómo se diferencian?

| Aspecto | Salida (Clave 2) | Regreso (Clave 5) |
|---------|------------------|-------------------|
| **Rotativo** | 🟢 ON (obligatorio) | 🔴 OFF (siempre) |
| **Urgencia** | Alta - Emergencia | Normal - Rutina |
| **Velocidad** | Variable, puede usar prioridad | Normal, respeta tráfico |
| **Geocerca** | Sale del parque | Entra al parque |
| **Timestamp** | Inicio del servicio | Fin del servicio |

## 🧮 Cálculo de Métricas

### Tiempo de Respuesta
```
Tiempo Respuesta = Timestamp(Clave 3) - Timestamp(Clave 2)
```

### Tiempo de Actuación
```
Tiempo Actuación = Timestamp(Clave 4) - Timestamp(Clave 3)
```

### Tiempo de Regreso
```
Tiempo Regreso = Timestamp(Clave 1) - Timestamp(Clave 5)
```

### Distancia en Emergencia
```
Distancia Emergencia = Σ Haversine(GPS_points) WHERE rotativo = ON
```

### Distancia en Regreso
```
Distancia Regreso = Σ Haversine(GPS_points) WHERE rotativo = OFF AND clave = 5
```

## 📊 Integración con Geocercas

### Parque de Bomberos (Geocerca Principal)

1. **Entrada**: Transición automática a Clave 1
2. **Salida con Rotativo**: Transición a Clave 2
3. **Salida sin Rotativo**: Servicio programado (no emergencia)

### Detección Automática

```typescript
// Pseudocódigo de detección
function detectarClave(gpsPoint, rotativoState, prevClave) {
    const dentroParque = checkGeofence(gpsPoint, 'PARQUE');
    const velocidad = gpsPoint.speed;
    
    if (dentroParque && velocidad < 5) {
        return CLAVE_1; // En parque
    }
    
    if (!dentroParque && rotativoState === 'ON' && velocidad > 5) {
        return CLAVE_2; // Salida en emergencia
    }
    
    if (velocidad < 2 && rotativoState === 'ON' && prevClave === CLAVE_2) {
        return CLAVE_3; // En siniestro
    }
    
    if (rotativoState === 'OFF' && prevClave === CLAVE_3) {
        return CLAVE_4; // Fin de actuación
    }
    
    if (!dentroParque && rotativoState === 'OFF' && velocidad > 5 && prevClave >= CLAVE_3) {
        return CLAVE_5; // Regreso
    }
    
    return prevClave; // Mantener estado actual
}
```

## 🎓 Casos Especiales

### Caso 1: Servicios Programados
- **Sin rotativo desde el inicio**
- **No se considera emergencia**
- **Flujo**: Clave 1 → Clave 5 (directo, sin pasar por Clave 2)

### Caso 2: Falsas Alarmas
- **Rotativo encendido brevemente**
- **No llega al siniestro**
- **Flujo**: Clave 1 → Clave 2 → Clave 5 (sin Clave 3 ni 4)

### Caso 3: Múltiples Emergencias
- **Un servicio lleva a otro**
- **Rotativo no se apaga entre servicios**
- **Flujo**: Clave 3 → Clave 2 (nuevo servicio)

## 📝 Notas de Implementación

### Backend (`keyCalculator.ts`)
- Procesa mediciones de rotativo y GPS
- Calcula transiciones de estado
- Genera segmentos temporales por clave

### Frontend (KPIs)
- Muestra tiempo acumulado por clave
- Diferencia visualmente Clave 2 (rojo) de Clave 5 (verde)
- Permite filtrado por tipo de servicio

## 🔧 Troubleshooting

### Problema: Clave 5 no se detecta
- **Verificar**: ¿Rotativo está OFF?
- **Verificar**: ¿Vehículo está en movimiento (v > 5 km/h)?
- **Verificar**: ¿Viene de Clave 3 o 4?

### Problema: Clave 2 y 5 se confunden
- **Causa**: Rotativo no reporta estado correcto
- **Solución**: Validar datos de rotativo en `rotativoMeasurement`

### Problema: Tiempo en Clave 5 = 0
- **Causa**: Vehículo vuelve directamente a Clave 1 sin registrar desplazamiento
- **Solución**: Verificar umbral de velocidad para detección de movimiento

## 📚 Referencias

- Documento: `docs/BACKEND/keyCalculator-logic.md`
- Código: `backend/src/services/keyCalculator.ts`
- Endpoint: `GET /api/kpis/states`
- Frontend: `frontend/src/components/Dashboard/ExecutiveDashboard/tabs/KPIsTab.tsx`

---

**Última actualización**: 2025-11-05  
**Versión**: 1.0.0  
**Autor**: Sistema DobackSoft


