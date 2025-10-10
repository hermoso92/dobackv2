# Doback Soft - Procesador Completo de Datos

## 📋 Descripción

El **Procesador Completo de Datos** es un pipeline automatizado para procesar archivos de vehículos Doback Soft. Este script maneja todo el flujo desde la decodificación de archivos CAN hasta la subida de datos a la base de datos PostgreSQL.

## 🚀 Funcionalidades

### ✅ Características Principales

1. **Decodificación Automática CAN**
   - Procesa archivos CAN usando el decodificador unificado
   - Manejo de errores y timeouts
   - Verificación de archivos ya procesados

2. **Agrupación Inteligente de Sesiones**
   - Agrupa archivos por proximidad temporal (máximo 5 minutos)
   - Detecta sesiones completas (CAN + GPS + ESTABILIDAD + ROTATIVO)
   - Calcula diferencias temporales entre archivos

3. **Gestión de Base de Datos**
   - Verificación de duplicados
   - Creación automática de organizaciones, usuarios y vehículos
   - Inserción de sesiones y mediciones
   - Manejo de transacciones

4. **Reportes Detallados**
   - Generación de reportes JSON
   - Estadísticas de procesamiento
   - Logs detallados con timestamps

## 📦 Instalación

### Requisitos Previos

```bash
# Python 3.8 o superior
python --version

# PostgreSQL con esquema Doback Soft
# Base de datos configurada con las tablas necesarias
```

### Dependencias

```bash
pip install psycopg2-binary pandas
```

### Estructura de Directorios

```
backend/
├── complete_processor.py          # Script principal
├── data/
│   ├── datosDoback/              # Datos de entrada
│   │   ├── CMadrid/
│   │   │   ├── doback022/
│   │   │   │   ├── CAN_DOBACK022_20250707_0.txt
│   │   │   │   ├── GPS_DOBACK022_20250707_6.txt
│   │   │   │   ├── ESTABILIDAD_DOBACK022_20250707_7.txt
│   │   │   │   └── ROTATIVO_DOBACK022_20250707_7.txt
│   │   │   └── doback025/
│   │   └── fardier/
│   └── DECODIFICADOR CAN/
│       └── decodificador_can_unificado.py
└── README_COMPLETE_PROCESSOR.md
```

## ⚙️ Configuración

### 1. Configuración de Base de Datos

Editar las variables en `complete_processor.py`:

```python
DATABASE_CONFIG = {
    'host': 'localhost',           # Servidor PostgreSQL
    'database': 'dobacksoft',      # Nombre de la base de datos
    'user': 'postgres',            # Usuario
    'password': 'postgres',        # Contraseña
    'port': 5432                   # Puerto
}
```

### 2. Configuración de Directorios

```python
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data', 'datosDoback')
DECODER_PATH = os.path.join(os.path.dirname(__file__), 'data', 'DECODIFICADOR CAN', 'decodificador_can_unificado.py')
```

### 3. Configuración de Procesamiento

```python
MAX_TIME_DIFF_MINUTES = 5          # Máxima diferencia temporal entre archivos
DEFAULT_ORGANIZATION = 'CMadrid'   # Organización por defecto
DEFAULT_USER_ID = 'admin@dobacksoft.com'  # Usuario por defecto
```

## 🎯 Uso

### Ejecución Básica

```bash
cd backend
python complete_processor.py
```

### Ejecución con Logs Detallados

```bash
python complete_processor.py 2>&1 | tee processing.log
```

### Ejecución en Background

```bash
nohup python complete_processor.py > processing.log 2>&1 &
```

## 📊 Salida y Resultados

### 1. Logs en Consola

```
2025-07-10 02:05:51,759 - INFO - PASO 3: Subiendo 6 sesiones a la base de datos...
2025-07-10 02:05:51,928 - INFO -   Subiendo sesión 1/6: doback022
2025-07-10 02:05:51,935 - INFO -     Sesión existente encontrada: 7968df6f-da35-4919-9ca1-46436b0b68af
2025-07-10 02:05:56,696 - INFO -     ✅ Sesión 1 subida exitosamente
```

### 2. Reporte de Resumen

```
============================================================
RESUMEN DEL PROCESAMIENTO COMPLETO
============================================================
Sesiones encontradas: 6
Archivos escaneados: 131
Vehiculos procesados: 1
Sesiones perfectas: 6
Sesiones con desfases: 0
Diferencia promedio: 0.6 min
============================================================
```

### 3. Archivos Generados

- `complete_processor.log` - Log detallado del procesamiento
- `complete_processor_report.json` - Reporte estructurado en JSON

## 🔧 Troubleshooting

### Problemas Comunes

#### 1. Error de Conexión a Base de Datos

```
Error: connection to server at "localhost" (127.0.0.1), port 5432 failed
```

**Solución:**
- Verificar que PostgreSQL esté ejecutándose
- Comprobar credenciales en `DATABASE_CONFIG`
- Verificar que la base de datos existe

#### 2. Decodificador CAN No Encontrado

```
Decodificador CAN no encontrado en: /path/to/decoder
```

**Solución:**
- Verificar que el archivo `decodificador_can_unificado.py` existe
- Comprobar permisos de ejecución
- Ajustar `DECODER_PATH` si es necesario

#### 3. Directorio de Datos No Encontrado

```
FileNotFoundError: Directorio de datos no encontrado
```

**Solución:**
- Verificar que existe `backend/data/datosDoback/`
- Comprobar la estructura de directorios
- Ajustar `DATA_DIR` si es necesario

#### 4. Error de Codificación

```
UnicodeEncodeError: 'charmap' codec can't encode character
```

**Solución:**
- Ejecutar en terminal con soporte UTF-8
- Usar `chcp 65001` en Windows antes de ejecutar
- Configurar locale apropiado

### Logs de Debug

Para obtener más información de debug:

```python
# En complete_processor.py, cambiar el nivel de logging
logging.basicConfig(level=logging.DEBUG)
```

## 📈 Monitoreo y Mantenimiento

### 1. Verificación de Procesamiento

```sql
-- Verificar sesiones creadas
SELECT COUNT(*) FROM "Session";

-- Verificar mediciones GPS
SELECT COUNT(*) FROM "GpsMeasurement";

-- Verificar mediciones CAN
SELECT COUNT(*) FROM "CanMeasurement";
```

### 2. Limpieza de Logs

```bash
# Rotar logs antiguos
mv complete_processor.log complete_processor.log.$(date +%Y%m%d)
```

### 3. Verificación de Integridad

```python
# Ejecutar verificación de integridad
python -c "
from complete_processor import DobackProcessor
processor = DobackProcessor()
sessions = processor.scan_files_and_find_sessions()
print(f'Sesiones encontradas: {len(sessions)}')
"
```

## 🔒 Seguridad

### Consideraciones de Seguridad

1. **Credenciales de Base de Datos**
   - No hardcodear contraseñas en el código
   - Usar variables de entorno
   - Implementar rotación de credenciales

2. **Permisos de Archivos**
   - Verificar permisos de lectura en directorios de datos
   - Restringir acceso a logs sensibles
   - Implementar auditoría de acceso

3. **Validación de Datos**
   - Validar entrada de archivos
   - Sanitizar nombres de archivos
   - Implementar límites de tamaño

### Configuración Segura

```python
# Usar variables de entorno
import os

DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'dobacksoft'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
    'port': int(os.getenv('DB_PORT', 5432))
}
```

## 🚀 Optimización

### Mejoras de Rendimiento

1. **Procesamiento Paralelo**
   ```python
   from concurrent.futures import ThreadPoolExecutor
   
   # Procesar archivos en paralelo
   with ThreadPoolExecutor(max_workers=4) as executor:
       futures = [executor.submit(process_file, file) for file in files]
   ```

2. **Batch Processing**
   ```python
   # Insertar datos en lotes
   batch_size = 1000
   for i in range(0, len(data), batch_size):
       batch = data[i:i + batch_size]
       insert_batch(batch)
   ```

3. **Índices de Base de Datos**
   ```sql
   -- Crear índices para mejorar rendimiento
   CREATE INDEX idx_session_vehicle_time ON "Session" ("vehicleId", "startTime");
   CREATE INDEX idx_gps_session ON "GpsMeasurement" ("sessionId");
   ```

## 📝 Changelog

### Versión 1.0.0 (2025-07-10)
- ✅ Pipeline completo funcional
- ✅ Decodificación CAN automática
- ✅ Agrupación de sesiones por proximidad temporal
- ✅ Subida a base de datos PostgreSQL
- ✅ Generación de reportes detallados
- ✅ Manejo de errores robusto
- ✅ Documentación completa

## 🤝 Contribución

### Guías de Desarrollo

1. **Estilo de Código**
   - Seguir PEP 8
   - Usar type hints
   - Documentar funciones con docstrings

2. **Testing**
   - Implementar tests unitarios
   - Tests de integración para base de datos
   - Tests de rendimiento

3. **Documentación**
   - Actualizar README
   - Documentar cambios en CHANGELOG
   - Mantener ejemplos actualizados

## 📞 Soporte

### Contacto

- **Equipo de Desarrollo**: Doback Soft Development Team
- **Email**: desarrollo@dobacksoft.com
- **Documentación**: [docs.dobacksoft.com](https://docs.dobacksoft.com)

### Recursos Adicionales

- [Documentación de la API](https://api.dobacksoft.com/docs)
- [Guía de Despliegue](https://deploy.dobacksoft.com)
- [FAQ](https://faq.dobacksoft.com)

---

**© 2025 Doback Soft. Todos los derechos reservados.** 