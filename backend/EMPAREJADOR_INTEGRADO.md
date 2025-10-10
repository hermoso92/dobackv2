# 🎯 Emparejador de Sesiones Integrado - DobackSoft

## 📋 Descripción

El **Emparejador de Sesiones Mejorado** está ahora **completamente integrado** en la aplicación DobackSoft. Se ejecuta automáticamente al iniciar la aplicación y también puede ser ejecutado manualmente a través de la API.

## ✨ Características Principales

### 🔧 **Mejoras Implementadas:**

- **✅ +2 horas automáticas para GPS** - Corrige zona horaria automáticamente
- **✅ Tolerancia configurable** - 30 minutos por defecto (ajustable)
- **✅ Mejor manejo de archivos ROTATIVO** - Solo fecha cuando no hay hora
- **✅ Filtrado de archivos traducidos** - No procesa `_TRADUCIDO.csv`
- **✅ Lectura de cabeceros internos** - Extrae fechas reales del contenido
- **✅ Score de calidad** - Evalúa la coincidencia temporal
- **✅ Logging detallado** - Información completa del proceso

### 🚀 **Integración Automática:**

- **Ejecución automática al iniciar** - Se ejecuta cuando arranca la aplicación
- **API REST completa** - Endpoints para control manual
- **Logging integrado** - Registros en el sistema de logs de la aplicación
- **Configuración flexible** - Parámetros ajustables via API

## 🛠️ Cómo Usar

### 1. **Ejecución Automática**

El emparejador se ejecuta **automáticamente** cuando inicias la aplicación:

```bash
# Iniciar la aplicación
npm run dev
# o
yarn dev
```

**Logs esperados:**
```
🔄 Iniciando emparejador de sesiones mejorado...
📋 Emparejador: ================================================================================
📋 Emparejador: RESULTADOS DEL EMPAREJADOR MEJORADO
📋 Emparejador: ================================================================================
📋 Emparejador: Offset GPS: +2 horas
📋 Emparejador: Tolerancia: 30 minutos
📋 Emparejador: Sesiones encontradas: 4
✅ Emparejador de sesiones completado exitosamente
```

### 2. **API REST - Control Manual**

#### **Verificar Estado:**
```bash
GET http://localhost:9998/api/session-matcher/status
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Emparejador de sesiones disponible",
  "version": "Mejorado V1.0",
  "features": [
    "+2 horas automáticas para GPS",
    "Tolerancia configurable (30 min por defecto)",
    "Mejor manejo de archivos ROTATIVO",
    "Filtrado de archivos traducidos",
    "Lectura de cabeceros internos",
    "Score de calidad de coincidencia"
  ],
  "defaultConfig": {
    "gpsOffset": 2,
    "tolerance": 30,
    "basePath": "data/datosDoback/CMadrid"
  }
}
```

#### **Obtener Configuración:**
```bash
GET http://localhost:9998/api/session-matcher/config
```

#### **Ejecutar Emparejador:**
```bash
POST http://localhost:9998/api/session-matcher/run
Content-Type: application/json

{
  "basePath": "data/datosDoback/CMadrid",
  "gpsOffset": 2,
  "tolerance": 30
}
```

**Parámetros opcionales:**
- `basePath`: Ruta donde buscar archivos (por defecto: `data/datosDoback/CMadrid`)
- `gpsOffset`: Offset de zona horaria para GPS (por defecto: `2`)
- `tolerance`: Tolerancia en minutos (por defecto: `30`)

### 3. **Ejecución Directa (Línea de Comandos)**

```bash
# Desde el directorio backend
python agrupar_sesiones.py --base-path "data/datosDoback/CMadrid" --gps-offset 2 --tolerance 30
```

## 📊 Resultados Esperados

### **Sesiones Encontradas (ejemplo):**

```
Sesión 1: doback022 - 2025-07-08
  Score: 0.255
  Diferencias temporales (minutos):
    GPS: 28.5
    ESTABILIDAD: 0.6
    ROTATIVO: 0.1
  Archivos:
    CAN: CAN_DOBACK022_20250708_1.txt
    GPS: GPS_DOBACK022_20250708_0.txt
    ESTABILIDAD: ESTABILIDAD_DOBACK022_20250708_2.txt
    ROTATIVO: ROTATIVO_DOBACK022_20250708_1.txt
```

### **Interpretación de Scores:**

- **0.8 - 1.0**: Excelente coincidencia temporal
- **0.6 - 0.8**: Buena coincidencia temporal
- **0.4 - 0.6**: Coincidencia aceptable
- **0.2 - 0.4**: Coincidencia débil
- **< 0.2**: Coincidencia muy débil

## 🔧 Configuración Avanzada

### **Ajustar Tolerancia:**

Para archivos con mayor dispersión temporal:

```bash
# Tolerancia de 60 minutos
POST /api/session-matcher/run
{
  "tolerance": 60
}
```

### **Cambiar Offset GPS:**

Para diferentes zonas horarias:

```bash
# Offset de 1 hora
POST /api/session-matcher/run
{
  "gpsOffset": 1
}
```

### **Procesar Diferentes Organizaciones:**

```bash
# Procesar otra organización
POST /api/session-matcher/run
{
  "basePath": "data/datosDoback/OtraOrganizacion"
}
```

## 📁 Estructura de Archivos

```
backend/
├── agrupar_sesiones.py          # Emparejador mejorado
├── src/
│   ├── index.ts                 # Punto de entrada (ejecución automática)
│   ├── app.ts                   # Configuración de rutas
│   └── routes/
│       └── sessionMatcher.ts    # API REST del emparejador
└── data/
    └── datosDoback/
        └── CMadrid/             # Datos de la organización
            ├── doback022/
            │   ├── CAN/
            │   ├── GPS/
            │   ├── ESTABILIDAD/
            │   └── ROTATIVO/
            └── ...
```

## 🐛 Solución de Problemas

### **Error: "No se encuentra Python"**
```bash
# Verificar que Python esté instalado
python --version
# o
python3 --version
```

### **Error: "No se encuentra el directorio base"**
```bash
# Verificar que exista la ruta
ls data/datosDoback/CMadrid
```

### **Error: "No se pudieron formar sesiones"**
- Verificar que existan archivos de todos los tipos (CAN, GPS, ESTABILIDAD, ROTATIVO)
- Aumentar la tolerancia temporal
- Verificar que los archivos no estén corruptos

### **Logs con errores de codificación:**
- Los emojis pueden no mostrarse correctamente en Windows
- Los logs funcionan correctamente, es solo un problema de visualización

## 📈 Monitoreo

### **Logs de la Aplicación:**
```bash
# Ver logs en tiempo real
tail -f logs/application.log
```

### **Verificar Estado via API:**
```bash
curl http://localhost:9998/api/session-matcher/status
```

## 🎯 Próximas Mejoras

- [ ] Interfaz web para configurar parámetros
- [ ] Programación de ejecución automática
- [ ] Notificaciones por email/WebSocket
- [ ] Dashboard con estadísticas de emparejamiento
- [ ] Exportación de resultados en diferentes formatos

## 📞 Soporte

Para problemas o preguntas sobre el emparejador integrado:

1. Revisar los logs de la aplicación
2. Verificar el estado via API: `/api/session-matcher/status`
3. Probar ejecución manual: `/api/session-matcher/run`
4. Consultar la documentación técnica en `agrupar_sesiones.py`

---

**✅ El emparejador de sesiones está completamente integrado y funcionando en DobackSoft** 