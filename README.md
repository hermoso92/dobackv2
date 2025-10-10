# Doback Soft - Sistema de Gestión de Flotas

## 📋 Descripción

Doback Soft es un sistema integral para la gestión y análisis de datos de flotas de vehículos. Procesa archivos de diferentes tipos (CAN, GPS, ESTABILIDAD, ROTATIVO) y los agrupa en sesiones completas para análisis posterior.

## 🚀 Funcionalidades Principales

### ✅ **Procesador de Sesiones de Datos** (COMPLETADO)
- **Agrupación automática** de archivos por proximidad temporal
- **Extracción de fechas reales** del contenido interno de archivos
- **Una sesión por archivo CAN** con correspondencia 1:1
- **Búsqueda de archivos más cercanos** (GPS, ESTABILIDAD, ROTATIVO)
- **Validación de sesiones completas** con los 4 tipos requeridos
- **Reporte JSON detallado** con metadatos y métricas de calidad

### 🔄 **En Desarrollo**
- **Reportes PDF** (F1): Generación de reportes con logo, tablas y gráficos
- **Evaluación de Eventos** (F2): Evaluación manual y automática
- **Auditoría** (F3): Registro de evaluaciones con acceso restringido
- **Settings** (F5): Configuración de idioma, tema y zona horaria
- **Zona Horaria** (F6): Formateo de fechas según zona del usuario

## 📊 Resultados del Procesador de Sesiones

### **Métricas de Calidad**
- **112 archivos procesados** en total
- **6 sesiones completas** encontradas para doback022
- **4 sesiones perfectas** (diferencia < 1 minuto)
- **2 sesiones con desfases** (GPS desincronizado)
- **67% de precisión temporal** perfecta

### **Ejemplo de Sesión Encontrada**
```
Sesión 1: doback022 - 2025-07-07 17:21:42
├── CAN: CAN_DOBACK022_20250707_0_TRADUCIDO.csv (17:21:42)
├── GPS: GPS_DOBACK022_20250707_6.txt (17:21:37) - 0.08 min
├── ESTABILIDAD: ESTABILIDAD_DOBACK022_20250707_7.txt (17:21:08) - 0.57 min
└── ROTATIVO: ROTATIVO_DOBACK022_20250707_7.txt (17:21:35) - 0.12 min
```

## 🏗️ Arquitectura del Sistema

### **Backend (Python)**
```
backend/
├── correct_session_finder.py    # Procesador principal de sesiones
├── data/datosDoback/           # Datos de vehículos organizados
├── models/                     # Modelos de base de datos
├── routes/                     # Endpoints de API
├── services/                   # Lógica de negocio
└── utils/                      # Utilidades y helpers
```

### **Frontend (React/TypeScript)**
```
frontend/
├── src/
│   ├── components/             # Componentes React
│   ├── pages/                  # Páginas de la aplicación
│   ├── services/               # Servicios de API
│   └── utils/                  # Utilidades del frontend
└── public/                     # Archivos estáticos
```

## 🚀 Instalación y Configuración

### **Requisitos Previos**
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+

### **Instalación del Backend**
```bash
cd backend
pip install -r requirements.txt
python correct_session_finder.py  # Probar procesador de sesiones
```

### **Instalación del Frontend**
```bash
cd frontend
npm install
npm start
```

## 📁 Estructura de Datos

### **Organización de Archivos**
```
backend/data/datosDoback/
├── CMadrid/
│   ├── doback022/
│   │   ├── CAN/     # Archivos decodificados CAN
│   │   ├── GPS/     # Datos de posicionamiento
│   │   ├── ESTABILIDAD/  # Datos de estabilidad
│   │   └── ROTATIVO/     # Datos de rotación
│   ├── doback023/
│   ├── doback025/
│   └── doback012/
```

### **Formatos de Archivo Soportados**
- **CAN**: CSV decodificado con timestamps
- **GPS**: TXT con coordenadas y velocidad
- **ESTABILIDAD**: TXT con datos de aceleración
- **ROTATIVO**: TXT con estado de rotación

## 🔧 Configuración

### **Parámetros del Procesador**
```python
# Tolerancia temporal (minutos)
TOLERANCE_MINUTES = 2

# Tipos de archivo requeridos
REQUIRED_TYPES = ['CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO']

# Directorio base de datos
BASE_DATA_DIR = Path('data/datosDoback')
```

### **Variables de Entorno**
```bash
# Backend
DATABASE_URL=postgresql://user:pass@localhost/dobacksoft
JWT_SECRET=your-secret-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret

# Frontend
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=ws://localhost:5000/ws
```

## 📈 Uso del Procesador de Sesiones

### **Ejecución Básica**
```bash
cd backend
python correct_session_finder.py
```

### **Salida del Procesador**
```
🚀 Iniciando análisis correcto de sesiones...
📊 Escaneados 112 archivos totales
✅ Encontradas 6 sesiones (una por archivo CAN)
📊 Reporte guardado en: correct_sessions_report.json
```

### **Estructura del Reporte JSON**
```json
{
  "timestamp": "2025-07-09T23:36:45.677652",
  "total_sessions_found": 6,
  "sessions": [
    {
      "session_number": 1,
      "vehicle": "doback022",
      "date": "2025-07-07",
      "start_time": "2025-07-07T17:21:42",
      "max_time_diff": 0.57,
      "time_diffs": {
        "gps_diff": 0.08,
        "estabilidad_diff": 0.57,
        "rotativo_diff": 0.12
      },
      "files": {
        "CAN": "CAN_DOBACK022_20250707_0_TRADUCIDO.csv",
        "GPS": "GPS_DOBACK022_20250707_6.txt",
        "ESTABILIDAD": "ESTABILIDAD_DOBACK022_20250707_7.txt",
        "ROTATIVO": "ROTATIVO_DOBACK022_20250707_7.txt"
      }
    }
  ]
}
```

## 🔍 Testing y Validación

### **Pruebas del Procesador**
```bash
# Ejecutar procesador
python correct_session_finder.py

# Verificar reporte generado
cat correct_sessions_report.json

# Analizar logs
tail -f session_processor.log
```

### **Validación de Resultados**
- **Verificación de fechas**: Comparar timestamps extraídos
- **Correspondencia de archivos**: Confirmar archivos asociados correctos
- **Análisis de desfases**: Identificar patrones de sincronización
- **Cobertura de datos**: Verificar que no se pierden archivos válidos

## 📝 Documentación

### **Documentación Técnica**
- [Procesador de Sesiones](docs/development/session-processor.md)
- [Checklist de Implementación](docs/backend-implementation-checklist.md)
- [API Documentation](docs/api/)
- [Architecture](docs/architecture/)

### **Guías de Usuario**
- [Manual de Usuario](docs/user/)
- [Troubleshooting](docs/user/troubleshooting.md)
- [FAQ](docs/user/faq.md)

## 🔧 Desarrollo

### **Estructura del Proyecto**
```
DobackSoft/
├── backend/           # Backend Python
├── frontend/          # Frontend React
├── docs/              # Documentación
├── scripts/           # Scripts de automatización
├── tests/             # Pruebas
└── config/            # Configuraciones
```

### **Comandos de Desarrollo**
```bash
# Backend
cd backend
python -m pytest tests/          # Ejecutar pruebas
python correct_session_finder.py # Procesar sesiones
python -m flask run              # Servidor de desarrollo

# Frontend
cd frontend
npm test                         # Ejecutar pruebas
npm run build                    # Build de producción
npm start                        # Servidor de desarrollo
```

## 🚀 Despliegue

### **Producción**
```bash
# Backend
cd backend
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Frontend
cd frontend
npm run build
serve -s build -l 3000
```

### **Docker**
```bash
docker-compose up -d
```

## 📊 Monitoreo y Logs

### **Logs del Procesador**
- **INFO**: Progreso general del procesamiento
- **DEBUG**: Detalles de extracción de fechas
- **WARNING**: Archivos que no se pueden procesar
- **ERROR**: Errores críticos del sistema

### **Métricas de Performance**
- **Velocidad de procesamiento**: ~2 sesiones/segundo
- **Tiempo de escaneo**: ~0.3 segundos para 112 archivos
- **Precisión temporal**: 67% de sesiones perfectas

## 🤝 Contribución

### **Proceso de Desarrollo**
1. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
2. Implementar cambios siguiendo estándares de código
3. Ejecutar pruebas: `npm test` y `python -m pytest`
4. Crear Pull Request con descripción detallada

### **Estándares de Código**
- **Python**: PEP 8, TypeScript estricto
- **JavaScript**: ESLint + Prettier
- **Documentación**: Comentarios en español
- **Testing**: Cobertura mínima 80% backend, 60% frontend

## 📞 Soporte

### **Contacto**
- **Email**: soporte@dobacksoft.com
- **Documentación**: [docs.dobacksoft.com](https://docs.dobacksoft.com)
- **Issues**: [GitHub Issues](https://github.com/dobacksoft/issues)

### **Troubleshooting**
- [Guía de Problemas Comunes](docs/user/troubleshooting.md)
- [FAQ](docs/user/faq.md)
- [Logs de Error](docs/monitoring/)

---

**Doback Soft** - Sistema de Gestión de Flotas  
*Versión: 1.0.0 | Última actualización: 2025-07-09*
#   d o b a c k s o f t  
 #   d o b a c k s o f t  
 