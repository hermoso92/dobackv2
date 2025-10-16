# 🚒 CORRECCIÓN FINAL - LÓGICA DE BOMBEROS

## ✅ Descubrimiento

**Los archivos ROTATIVO SÍ registran el rotativo:**
- **Estado 0 = ROTATIVO ON** (15% del tiempo)
- **Estado 1 = ROTATIVO OFF** (85% del tiempo)

Comprobado con correlación GPS:
- Estado 0: velocidad promedio 31.8 km/h (72% en movimiento)
- Estado 1: velocidad promedio 21.4 km/h (77% parado)

---

## 🎯 Lógica Correcta a Implementar

### Estados del Sistema

| Situación | GPS | Rotativo | Movimiento | Estado |
|-----------|-----|----------|------------|--------|
| En base | Dentro geocerca | - | - | **En Parque** |
| Salida emergencia | Fuera geocerca | 0 (ON) | >5 km/h | **Clave 2** |
| En siniestro | Fuera geocerca | 0 (ON) | <5 km/h | **Clave 5** |
| Retorno | Fuera geocerca | 1 (OFF) | - | **Retorno** |

### KPIs Calculables (REALES)

1. ✅ **Tiempo en Parque**: GPS dentro de geocerca
2. ✅ **Tiempo fuera de Parque**: GPS fuera de geocerca
3. ✅ **Tiempo Clave 2**: Fuera + Rotativo 0 + Velocidad >5 km/h
4. ✅ **Tiempo Clave 5**: Fuera + Rotativo 0 + Velocidad <5 km/h
5. ✅ **Tiempo con Rotativo ON**: Rotativo = 0
6. ✅ **Kilómetros**: Suma distancias GPS
7. ✅ **Salidas/Regresos**: Transiciones entrada/salida de geocerca

---

## 📝 Implementación Backend

```javascript
// Para cada punto GPS:

1. ¿Está dentro de geocerca de parque?
   → puntoEnPoligono(gps, parque)

2. Buscar estado rotativo en mismo timestamp
   → rotativoMap.get(timestamp)

3. Clasificar:
   if (dentroParque) {
       tiempoEnParque++
   } else {
       // Fuera del parque
       if (rotativo === 0) {
           // Rotativo ON
           if (velocidad > 5) {
               tiempoClave2++  // Salida en emergencia
           } else {
               tiempoClave5++  // En siniestro
           }
       } else {
           tiempoRetorno++  // Retorno sin rotativo
       }
   }
```

---

## 🚀 Próximos Pasos

1. ✅ Verificar geocercas (HECHO - 2 parques válidos)
2. ✅ Identificar significado estados ROTATIVO (HECHO - 0=ON, 1=OFF)
3. ⏳ Modificar backend para usar lógica correcta
4. ⏳ Actualizar frontend para mostrar KPIs correctos
5. ⏳ Validar con datos reales

**Fecha**: ${new Date().toISOString()}

