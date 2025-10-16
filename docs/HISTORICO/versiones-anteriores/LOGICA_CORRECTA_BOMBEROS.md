# 🚒 LÓGICA CORRECTA DEL SISTEMA DE BOMBEROS

## ✅ Entendimiento Correcto

### Fuentes de Datos
1. **GPS** → posición, velocidad, timestamps
2. **Rotativo** → estado ON/OFF de sirena/luz
3. **Geocercas** → polígonos de parques de bomberos

### Estados Reales (NO inventados)

| Estado | Condición | Cálculo |
|--------|-----------|---------|
| **En Parque** | GPS dentro de geocerca | Tiempo dentro del polígono |
| **Clave 2** | GPS fuera + Rotativo ON + En movimiento | Tiempo con velocidad >5 km/h |
| **Clave 5** | GPS fuera + Rotativo ON + Parado >2min | Tiempo parado (velocidad <5 km/h) |
| **Retorno** | GPS fuera + Rotativo OFF | Tiempo con rotativo apagado |

### Detección de Salidas/Regresos

```javascript
// SALIDA: GPS sale de geocerca del parque
if (punto_anterior DENTRO && punto_actual FUERA) {
    salida_detectada = true;
    hora_salida = timestamp_actual;
}

// REGRESO: GPS vuelve a geocerca del parque
if (punto_anterior FUERA && punto_actual DENTRO) {
    regreso_detectado = true;
    hora_regreso = timestamp_actual;
    duracion_salida = hora_regreso - hora_salida;
}
```

### KPIs Correctos

1. **Tiempo en Parque**: GPS dentro de geocerca
2. **Tiempo fuera de Parque**: GPS fuera de geocerca
3. **Tiempo Clave 2**: Fuera + Rotativo ON + Movimiento
4. **Tiempo Clave 5**: Fuera + Rotativo ON + Parado >2min
5. **Kilómetros**: Suma de distancias GPS
6. **Eventos**: Desde archivo Estabilidad

---

## 🔧 Pasos de Implementación

1. ✅ Verificar geocercas de parques en BD
2. ⏳ Implementar función de detección punto-en-polígono
3. ⏳ Cruzar GPS + Geocerca para detectar salidas/regresos
4. ⏳ Cruzar GPS + Rotativo para detectar Clave 2 / Clave 5
5. ⏳ Calcular tiempos REALES (no inferidos)
6. ⏳ Mostrar en dashboard correctamente

---

**Fecha**: ${new Date().toISOString()}

