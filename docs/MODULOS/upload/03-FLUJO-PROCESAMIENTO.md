# 🔄 FLUJO DE PROCESAMIENTO COMPLETO

**Versión:** 2.0  
**Fecha:** 2025-10-11

---

## 📊 FLUJO VISUAL COMPLETO

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE UPLOAD MASIVO                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PASO 1: SELECCIÓN DE ARCHIVOS (Usuario)                        │
│  ├─ Usuario hace clic en "Procesar Todos CMadrid"               │
│  └─ O selecciona archivos manualmente                           │
│                                                                  │
│  PASO 2: LIMPIEZA (Opcional)                                    │
│  ├─ Usuario hace clic en "Limpiar Base de Datos"                │
│  ├─ Frontend → POST /api/clean-all-sessions                     │
│  ├─ Backend usa SINGLETON Prisma ✅                              │
│  ├─ Backend elimina en orden:                                   │
│  │   1. StabilityEvent                                          │
│  │   2. GpsMeasurement                                          │
│  │   3. StabilityMeasurement                                    │
│  │   4. RotativoMeasurement                                     │
│  │   5. CanMeasurement                                          │
│  │   6. DataQualityMetrics                                      │
│  │   7. OperationalKey                                          │
│  │   8. Session                                                 │
│  └─ Backend → Response: { success, deleted: {...} }             │
│                                                                  │
│  PASO 3: PROCESAMIENTO AUTOMÁTICO                               │
│  ├─ Frontend → POST /api/upload/process-all-cmadrid             │
│  ├─ Backend lee archivos de backend/data/CMadrid/               │
│  ├─ Backend agrupa por vehículo+fecha                           │
│  │   Ejemplo: DOBACK028/                                        │
│  │     ├─ gps/GPS_DOBACK028_20251008.txt                        │
│  │     ├─ estabilidad/ESTABILIDAD_DOBACK028_20251008.txt        │
│  │     └─ rotativo/ROTATIVO_DOBACK028_20251008.txt              │
│  │                                                               │
│  ├─ PASO 3.1: Detección de Sesiones Múltiples                   │
│  │   ├─ Analiza GPS: encuentra 2 sesiones (gap > 5 min)         │
│  │   ├─ Analiza Estabilidad: encuentra 2 sesiones               │
│  │   └─ Analiza Rotativo: encuentra 11 sesiones                 │
│  │   └─ Total sesiones = max(2, 2, 11) = 11 sesiones            │
│  │                                                               │
│  ├─ PASO 3.2: Parseo y Validación por Sesión                    │
│  │   Para cada sesión (1 a 11):                                 │
│  │     │                                                         │
│  │     ├─ Parsear GPS:                                          │
│  │     │   ├─ Nivel 1: Validar números (isNaN) ✅               │
│  │     │   ├─ Nivel 2: Validar no (0,0) ✅                      │
│  │     │   ├─ Nivel 3: Rango global (-90/90, -180/180) ✅       │
│  │     │   ├─ Nivel 4: Rango España (36-44, -10/5) ⚠️           │
│  │     │   └─ Nivel 5: Saltos > 1km ⚠️                          │
│  │     │                                                         │
│  │     ├─ Parsear Estabilidad:                                  │
│  │     │   ├─ Interpolar timestamps                             │
│  │     │   └─ Validar mediciones                                │
│  │     │                                                         │
│  │     └─ Parsear Rotativo:                                     │
│  │         └─ Validar estados y claves                          │
│  │                                                               │
│  ├─ PASO 3.3: Guardado en Base de Datos                         │
│  │   Para cada sesión:                                          │
│  │     ├─ 1. Buscar o crear vehículo                            │
│  │     ├─ 2. Crear sesión (Session)                             │
│  │     ├─ 3. Guardar GPS (lotes de 1000)                        │
│  │     ├─ 4. Guardar Estabilidad (lotes de 1000)                │
│  │     ├─ 5. Guardar Rotativo (lotes de 1000)                   │
│  │     └─ 6. Guardar métricas de calidad                        │
│  │                                                               │
│  ├─ PASO 3.4: Invalidar Cache                                   │
│  │   └─ kpiCacheService.invalidate(organizationId)              │
│  │                                                               │
│  └─ PASO 3.5: Respuesta                                         │
│      └─ {totalFiles, totalSaved, totalSkipped, results}         │
│                                                                  │
│  PASO 4: VISUALIZACIÓN DE RESULTADO                             │
│  ├─ Frontend recibe respuesta                                   │
│  ├─ Frontend muestra modal con:                                 │
│  │   ├─ Total vehículos procesados                              │
│  │   ├─ Total sesiones creadas vs omitidas                      │
│  │   ├─ Tasa de éxito (%)                                       │
│  │   ├─ Barra visual de progreso                                │
│  │   ├─ Detalle por vehículo                                    │
│  │   ├─ Lista de advertencias                                   │
│  │   └─ Lista de errores                                        │
│  └─ Usuario ve reporte completo                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 DETALLE PASO A PASO

### **1. Limpieza de Base de Datos**

**Trigger:** Usuario → "Limpiar Base de Datos"

**Frontend:**
```typescript
const handleCleanDatabase = async () => {
    const response = await apiService.post('/api/clean-all-sessions', {});
    
    if (response.success) {
        logger.info('✅ BD limpiada', response.data.deleted);
    }
};
```

**Backend:**
```typescript
// backend/src/routes/index.ts
router.post('/clean-all-sessions', authenticate, async (req, res) => {
    const { prisma } = await import('../lib/prisma'); // ✅ Singleton
    
    // Eliminar en orden (dependencias)
    await prisma.stabilityEvent.deleteMany({});
    await prisma.gpsMeasurement.deleteMany({});
    await prisma.stabilityMeasurement.deleteMany({});
    await prisma.rotativoMeasurement.deleteMany({});
    await prisma.canMeasurement.deleteMany({});
    await prisma.dataQualityMetrics.deleteMany({});
    await prisma.operationalKey.deleteMany({});
    await prisma.session.deleteMany({});
    
    res.json({ success: true, deleted: {...} });
});
```

**Logs Esperados:**
```
⚠️ Iniciando limpieza de base de datos - OPERACIÓN DESTRUCTIVA
📊 Elementos a eliminar: 839 sesiones, 0 eventos, 3610 GPS, 74451 rotativo, 0 estabilidad
🗑️ Eliminando datos relacionados...
  ✓ StabilityEvent eliminados
  ✓ GpsMeasurement eliminados
  ✓ StabilityMeasurement eliminados
  ✓ RotativoMeasurement eliminados
  ✓ CanMeasurement eliminados
  ✓ DataQualityMetrics eliminados
  ✓ OperationalKey eliminados
  ✓ Session eliminadas
✅ Base de datos limpiada exitosamente
```

---

### **2. Procesamiento Masivo**

**Trigger:** Usuario → "Iniciar Procesamiento Automático"

**Frontend:**
```typescript
const handleAutoProcess = async () => {
    const response = await apiService.post('/api/upload/process-all-cmadrid', {}, {
        timeout: 300000 // 5 minutos
    });
    
    if (response.success) {
        setAutoProcessResults(response.data);
        setShowReportModal(true); // ✅ Mostrar modal automáticamente
    }
};
```

**Backend:**
```typescript
// backend/src/routes/upload.ts
router.post('/process-all-cmadrid', async (req, res) => {
    // 1. Leer directorio CMadrid
    const cmadridPath = path.join(__dirname, '../../data/CMadrid');
    const vehicleDirs = fs.readdirSync(cmadridPath);
    
    // 2. Para cada vehículo
    for (const vehicleDir of vehicleDirs) {
        const types = ['estabilidad', 'gps', 'rotativo'];
        
        // 3. Para cada tipo de archivo
        for (const type of types) {
            const files = fs.readdirSync(typePath);
            
            // 4. Para cada archivo
            for (const file of files) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // 5. Parsear sesiones
                let sessions = [];
                if (type === 'estabilidad') {
                    sessions = parseStabilityFile(content);
                } else if (type === 'gps') {
                    sessions = parseGpsFile(content);
                } else if (type === 'rotativo') {
                    sessions = parseRotativoFile(content);
                }
                
                // 6. Guardar cada sesión
                for (const session of sessions) {
                    await saveSession(session, vehicleDbId, userId, organizationId);
                }
            }
        }
    }
    
    res.json({ success: true, data: {...} });
});
```

**Logs Esperados:**
```
📁 Encontrados 1 vehículos en CMadrid
🚗 Procesando vehículo: DOBACK028
📄 Procesando archivo: GPS_DOBACK028_20251008.txt
✅ GPS parseado: 95.6% válido
   - total: 1234
   - validas: 1180
   - coordenadasInvalidas: 34 ← Rechazadas
   - saltosGPS: 2 ← Detectados
💾 Sesión guardada: xxx (1614 mediciones)
💾 Sesión guardada: xxx (1996 mediciones)
✅ GPS_DOBACK028_20251008.txt: 2 sesiones procesadas
✅ ROTATIVO_DOBACK028_20251003.txt: 18 sesiones procesadas
✅ Procesamiento completado: 98 archivos, 839 sesiones
```

---

### **3. Visualización de Resultado**

**Trigger:** Procesamiento termina exitosamente

**Frontend Muestra:**
```
📊 Reporte de Procesamiento Completo
11/10/2025 19:35:31

✅ Procesamiento Completado
Tiempo: 112.3s

┌─────────────────┬─────────────────┬─────────────────┐
│ 1 Vehículos     │ 839 Sesiones    │ 0 Omitidas      │
│  Procesados     │  Creadas        │                 │
└─────────────────┴─────────────────┴─────────────────┘

Tasa de Éxito: 100.0% ████████████████████████

📋 Detalle por Vehículo:
🚗 DOBACK028
   839 creadas | 0 omitidas
   98 archivo(s) procesado(s)

💡 Información Importante:
✅ GPS inválidos fueron rechazados automáticamente
✅ Saltos GPS > 1km fueron detectados y reportados
ℹ️ Sesiones ya existentes fueron omitidas (duplicados)
```

---

## 🚨 MANEJO DE ERRORES

### **Error en Limpieza:**

```
Síntoma: "Error limpiando la base de datos"

Logs:
❌ Error limpiando base de datos: Error message

Solución:
1. Verificar que backend está corriendo
2. Verificar conexión a PostgreSQL
3. Revisar logs del backend
4. Verificar foreign key constraints
```

### **Error en Procesamiento:**

```
Síntoma: "Error en procesamiento automático"

Logs:
❌ Error procesando ROTATIVO_DOBACK028_20251007.txt: Error message

Solución:
1. Verificar formato del archivo
2. Verificar que archivo existe
3. Verificar encoding UTF-8
4. Revisar logs detallados
```

### **Sesiones Ya Existentes:**

```
Síntoma: Muchos "⚠️ Sesión ya existe, omitiendo"

Causa: No se limpió la BD antes de procesar

Solución:
1. Hacer clic en "Limpiar Base de Datos" PRIMERO
2. Esperar confirmación
3. Luego hacer clic en "Iniciar Procesamiento"

Verificación:
SELECT COUNT(*) FROM "Session"; -- Debe ser 0 después de limpiar
```

---

## ⏱️ TIEMPOS ESTIMADOS

| Operación | Tiempo |
|-----------|--------|
| Limpieza de BD | 2-5 segundos |
| Upload 1 archivo | 1-3 segundos |
| Procesamiento masivo (98 archivos) | 90-120 segundos |
| Generación de reporte | < 1 segundo |
| Visualización de modal | Inmediato |

---

## ✅ VERIFICACIÓN DE ÉXITO

### **Después de Limpieza:**

**Logs Backend:**
```
✅ Base de datos limpiada exitosamente
```

**Query SQL:**
```sql
SELECT COUNT(*) FROM "Session"; -- Debe ser 0
```

### **Después de Procesamiento:**

**Logs Backend:**
```
✅ Procesamiento completado: 98 archivos, 839 sesiones
```

**Frontend:**
- ✅ Modal se abre automáticamente
- ✅ Muestra 839 sesiones creadas
- ✅ Muestra 0 sesiones omitidas
- ✅ Tasa de éxito: 100%

**Query SQL:**
```sql
SELECT COUNT(*) FROM "Session"; -- Debe ser 839
SELECT COUNT(*) FROM "GpsMeasurement"; -- Debe ser > 0
SELECT COUNT(*) FROM "RotativoMeasurement"; -- Debe ser > 0
```

---

**Ver 04-TROUBLESHOOTING.md si algo falla**

