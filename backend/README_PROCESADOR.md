# Procesador Completo Doback Soft (`complete_processor.py`)

## Propósito
Pipeline automático para procesar, limpiar y subir datos de vehículos Doback Soft a la base de datos.

---

## Flujo Principal
1. **Decodificación CAN**
   - Busca y decodifica archivos CAN usando script externo.
2. **Escaneo de archivos**
   - Agrupa archivos por sesión (CAN, GPS, Estabilidad, Rotativo).
   - Aplica correcciones inteligentes de desfase GPS (UTC/local).
3. **Reporte**
   - Genera resumen de sesiones encontradas y diferencias temporales.
4. **Subida a base de datos**
   - Inserta datos de cada sesión (GPS, Estabilidad, CAN, Rotativo).
   - Genera eventos de estabilidad automáticamente.

---

## Filtros y Validaciones Clave
- **GPS:**
  - Solo puntos dentro de la Comunidad de Madrid.
  - Filtro de outliers: elimina puntos que se desvían >20 metros respecto a sus vecinos inmediatos.
- **Estabilidad:**
  - Valida rangos físicos razonables (aceleraciones, ángulos, SI).
- **CAN:**
  - Solo datos decodificados válidos.
- **Sesiones duplicadas:**
  - No sube sesiones ya existentes (tolerancia temporal ±1 min).

---

## Dependencias
- Python 3.8+
- `psycopg2-binary` (PostgreSQL)
- `pandas`
- `geopy` (filtro de outliers GPS)

---

## Advertencias y Notas
- El directorio de datos debe estar correctamente estructurado por empresa/vehículo/tipo.
- Los archivos corruptos o vacíos se ignoran automáticamente.
- El log `complete_processor.log` contiene trazabilidad completa de cada ejecución.
- El filtro de outliers GPS es automático y no parametrizable.

---

## Ejecución
```sh
python backend/complete_processor.py
```

---

**Contacto:** Doback Soft Development Team 