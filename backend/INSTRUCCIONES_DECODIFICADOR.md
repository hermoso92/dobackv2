# 🔧 Instrucciones para Decodificar Archivos CAN de CMadrid

## 📋 Requisitos Previos

1. **Python 3.7+** instalado
2. **Dependencias** instaladas:
   ```bash
   pip install cantools>=37.0.0 pandas>=2.0.0 python-dateutil==2.8.2
   ```

## 🚀 Opciones de Ejecución

### Opción 1: Script Batch (Más Fácil)
```cmd
cd C:\Users\Cosigein SL\Desktop\DobackSoft\backend
scripts\decode_cmadrid.bat
```

### Opción 2: Script PowerShell
```powershell
cd C:\Users\Cosigein SL\Desktop\DobackSoft\backend
.\scripts\decode_cmadrid.ps1
```

### Opción 3: Decodificador Directo
```cmd
cd C:\Users\Cosigein SL\Desktop\DobackSoft\backend\data\DECODIFICADOR CAN
python decodificador_can_unificado.py
```

### Opción 4: Archivo Individual
```cmd
cd C:\Users\Cosigein SL\Desktop\DobackSoft\backend
python scripts\decode_single_file.py
```

## 📁 Estructura de Archivos

```
backend/
├── data/
│   ├── DECODIFICADOR CAN/
│   │   ├── decodificador_can_unificado.py
│   │   ├── doback_custom.dbc
│   │   ├── CSS-Electronics-OBD2-v1.4.dbc
│   │   └── requirements.txt
│   └── datosDoback/
│       └── CMadrid/
│           ├── doback022/CAN/ (32 archivos .txt)
│           ├── doback023/CAN/
│           ├── doback024/CAN/
│           ├── doback025/CAN/
│           ├── doback026/CAN/
│           ├── doback027/CAN/
│           └── antiguo25/CAN/
└── scripts/
    ├── decode_cmadrid.bat
    ├── decode_cmadrid.ps1
    ├── decode_single_file.py
    └── decode_all_cmadrid_can.py
```

## 🔍 Archivos CAN Encontrados

### doback022 (32 archivos):
- `CAN_DOBACK022_20250714_3.txt` (16KB) - **Recomendado para prueba**
- `CAN_DOBACK022_20250714_2.txt` (138KB)
- `CAN_DOBACK022_20250714_1.txt` (176KB)
- `CAN_DOBACK022_20250714_0.txt` (1.7MB)
- `CAN_DOBACK022_20250713_5.txt` (13MB)
- `CAN_DOBACK022_20250713_4.txt` (94KB)
- `CAN_DOBACK022_20250713_3.txt` (613KB)
- `CAN_DOBACK022_20250713_2.txt` (8.6MB)
- `CAN_DOBACK022_20250713_1.txt` (157KB)
- `CAN_DOBACK022_20250713_0.txt` (1.8MB)
- `CAN_DOBACK022_20250712_2.txt` (30KB)
- `CAN_DOBACK022_20250712_1.txt` (134KB)
- `CAN_DOBACK022_20250712_0.txt` (4.9MB)
- `CAN_DOBACK022_20250711_2.txt` (273MB) - **Archivo más grande**
- `CAN_DOBACK022_20250711_1.txt` (30MB)
- `CAN_DOBACK022_20250711_0.txt` (19MB)
- `CAN_DOBACK022_20250710_4.txt` (12MB)
- `CAN_DOBACK022_20250710_3.txt` (1.0MB)
- `CAN_DOBACK022_20250710_2.txt` (1.6MB)
- `CAN_DOBACK022_20250710_1.txt` (8.4MB)
- `CAN_DOBACK022_20250710_0.txt` (5.2MB)
- `CAN_DOBACK022_20250709_2.txt` (188KB)
- `CAN_DOBACK022_20250709_1.txt` (3.4MB)
- `CAN_DOBACK022_20250709_0.txt` (12MB)
- `CAN_DOBACK022_20250708_3.txt` (1.1MB)
- `CAN_DOBACK022_20250708_2.txt` (11MB)
- `CAN_DOBACK022_20250708_1.txt` (6.4MB)
- `CAN_DOBACK022_20250708_0.txt` (56KB)
- `CAN_DOBACK022_20250707_0.txt` (1.7MB)
- `CAN_DOBACK022_RealTime.txt` (71B)

## ⚠️ Solución de Problemas

### Error: "No module named 'cantools'"
```bash
pip install cantools pandas python-dateutil
```

### Error: "No se encuentra el archivo DBC"
Verificar que existan los archivos:
- `doback_custom.dbc`
- `CSS-Electronics-OBD2-v1.4.dbc`

### Error: "No se encuentran archivos CAN"
Verificar la ruta: `backend/data/datosDoback/CMadrid/`

### Error: "Permission denied"
Ejecutar como administrador o verificar permisos de escritura.

## 📊 Resultados Esperados

Los archivos procesados se guardarán como:
- `CAN_DOBACK022_20250714_3_TRADUCIDO.csv`
- `CAN_DOBACK022_20250714_2_TRADUCIDO.csv`
- etc.

### Formato de Salida:
```csv
# Fecha de decodificación: 2025-01-27 10:30:00
# Protocolo: J1939

Timestamp,length,response,service,ParameterID_Service01,Engine_Speed,Engine_Temperature,...
2025-07-14 10:30:15,8,4,Show current data,Engine_Speed,1200,85,...
```

## 🎯 Recomendación

**Para empezar**: Usar el archivo más pequeño `CAN_DOBACK022_20250714_3.txt` (16KB) para probar.

**Para procesamiento completo**: Usar el script batch `decode_cmadrid.bat` que procesará todos los archivos automáticamente.

## 📞 Soporte

Si encuentras problemas:
1. Verificar que Python esté instalado: `python --version`
2. Verificar dependencias: `pip list | findstr cantools`
3. Verificar rutas de archivos
4. Revisar logs de error 