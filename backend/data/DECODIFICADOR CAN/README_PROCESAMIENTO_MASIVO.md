# Decodificador CAN Unificado - Procesamiento Masivo CMadrid

## Descripción

El decodificador CAN unificado ha sido mejorado para procesar automáticamente todos los archivos CAN de todos los vehículos en la carpeta `CMadrid`. El sistema busca recursivamente en todas las subcarpetas de vehículos (dobackXXX) y procesa únicamente los archivos CAN que no han sido traducidos previamente.

## Estructura de Datos Esperada

```
backend/data/datosDoback/CMadrid/
├── doback022/
│   ├── CAN/
│   │   ├── CAN_DOBACK022_20250713_0.txt
│   │   ├── CAN_DOBACK022_20250713_1.txt
│   │   └── ...
│   ├── GPS/
│   ├── estabilidad/
│   └── ROTATIVO/
├── doback023/
│   ├── CAN/
│   └── ...
└── ...
```

## Modos de Uso

### 1. Procesamiento Masivo de CMadrid (Recomendado)

```bash
# Opción 1: Usando el script dedicado
python procesar_cmadrid.py

# Opción 2: Usando el decodificador directamente
python decodificador_can_unificado.py --cmadrid
```

### 2. Procesamiento de Archivos Específicos

```bash
# Procesar archivos específicos
python decodificador_can_unificado.py archivo1.txt archivo2.csv

# Procesar archivos del directorio actual
python decodificador_can_unificado.py
```

## Características del Procesamiento Masivo

### Detección Automática
- Busca automáticamente todos los vehículos en `CMadrid/`
- Identifica archivos CAN sin procesar (sin sufijo `_TRADUCIDO`)
- Omite archivos ya procesados para evitar duplicados

### Logging Detallado
- Muestra progreso por vehículo
- Indica archivos encontrados y procesados
- Proporciona resumen final con estadísticas

### Manejo de Errores
- Continúa procesando aunque falle un archivo individual
- Registra errores específicos por archivo
- Proporciona estadísticas de éxito/error

## Archivos de Salida

Los archivos procesados se guardan en la misma carpeta CAN del vehículo con el sufijo `_TRADUCIDO.csv`:

```
CAN_DOBACK022_20250713_0.txt → CAN_DOBACK022_20250713_0_TRADUCIDO.csv
```

## Protocolos Soportados

- **J1939**: Para vehículos comerciales (IDs 0x0CF, 0x18FE)
- **OBD2**: Para diagnósticos automotrices (ID 0x7E)

## Requisitos

- Python 3.7+
- Librerías: `cantools`, `pandas`
- Archivos DBC en el directorio del decodificador:
  - `doback_custom.dbc` (J1939)
  - `CSS-Electronics-OBD2-v1.4.dbc` (OBD2)

## Ejemplo de Salida

```
Decodificador CAN Unificado - Procesamiento Masivo CMadrid
============================================================
Explorando carpeta CAN del vehículo: doback022
  - Encontrado: CAN_DOBACK022_20250713_0.txt
  - Encontrado: CAN_DOBACK022_20250713_1.txt
...

Total de archivos CAN encontrados: 45
Iniciando procesamiento...

[1/45] Procesando doback022: CAN_DOBACK022_20250713_0.txt
✓ Procesado exitosamente

============================================================
RESUMEN DEL PROCESAMIENTO MASIVO
============================================================
Vehículos procesados: 6
Archivos procesados exitosamente: 42
Archivos con errores: 3
Total de archivos: 45

Vehículos procesados:
  - doback022
  - doback023
  - doback024
  - doback025
  - doback027
  - doback028
```

## Notas Importantes

1. **Rutas Absolutas**: El sistema usa rutas absolutas para localizar archivos DBC y datos
2. **Procesamiento Incremental**: Solo procesa archivos nuevos, no duplica trabajo
3. **Compatibilidad**: Mantiene compatibilidad con el uso original del decodificador
4. **Rendimiento**: Procesa archivos secuencialmente para evitar sobrecarga del sistema