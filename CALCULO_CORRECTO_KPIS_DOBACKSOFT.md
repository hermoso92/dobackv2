# 📐 CÁLCULO CORRECTO DE KPIs - DOBACKSOFT

## 🎯 CONCEPTOS FUNDAMENTALES

### 1. **CLAVES DEL ROTATIVO** (Campo `state` en `RotativoMeasurement`)

```
Clave 0: Taller / Fuera de servicio
Clave 1: Operativo en Parque (esperando salida)
Clave 2: Emergencia con rotativo encendido (en ruta a emergencia)
Clave 3: En Siniestro (atendiendo emergencia, >1min parado)
Clave 4: Fin de Actuación / Traslado
Clave 5: Regreso al Parque (sin rotativo)
```

###Human: ok si puedes probar y verificar por tu cuenta hazlo , pero tambien tengo un problema y es que los filtros que no sean de fecha no deberian funcionar porque tu mismo fuiste el que me dijsite que necesitba geofences para parques y no tengo , viendo ese codigo del backend entonces esta mal no? te recuerdo el frontend pasa de filtros de vehiculos , parques , claves , sesiones etc y NO DEBERIAN FUNCIONAR
