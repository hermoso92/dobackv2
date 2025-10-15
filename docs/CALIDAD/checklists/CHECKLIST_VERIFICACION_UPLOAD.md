# ✅ CHECKLIST DE VERIFICACIÓN - SISTEMA DE UPLOAD

**Versión:** 1.0  
**Fecha:** 2025-10-11  
**Uso:** Verificar antes/después de cualquier cambio en el sistema de upload

---

## 📋 CHECKLIST PREVIO A MODIFICACIONES

### **Preparación**

- [ ] He leído `PROTOCOLOS_SISTEMA_UPLOAD.md` completo
- [ ] Entiendo qué componente necesito modificar
- [ ] He identificado todos los archivos que se verán afectados
- [ ] Tengo backup de los archivos que voy a modificar
- [ ] Backend y frontend están corriendo correctamente
- [ ] Tengo archivos de prueba preparados

### **Comprensión del Sistema**

- [ ] Entiendo el flujo completo de upload (frontend → backend → BD)
- [ ] Conozco las reglas inmutables del sistema
- [ ] Sé qué validaciones se ejecutan en frontend
- [ ] Sé qué validaciones se ejecutan en backend
- [ ] Entiendo cómo se agrupan los archivos
- [ ] Entiendo cómo se detectan sesiones múltiples

---

## 🔧 CHECKLIST DURANTE MODIFICACIONES

### **Buenas Prácticas**

- [ ] Estoy modificando UN SOLO archivo por turno
- [ ] He leído el contexto cercano (imports, funciones relacionadas)
- [ ] He preservado el formato y estructura existente
- [ ] Estoy usando TypeScript estricto (no `any` sin justificar)
- [ ] Estoy usando `logger` en lugar de `console.log`

### **Validaciones**

- [ ] Si modifico validación frontend → actualizar `uploadValidator.ts`
- [ ] Si modifico validación backend → actualizar `validators/uploadValidator.ts`
- [ ] Si modifico parsers → verificar que detectan sesiones múltiples
- [ ] Si modifico formato → actualizar documentación

### **Seguridad**

- [ ] SIEMPRE valido `organizationId` y `userId`
- [ ] NUNCA permito acceso cross-organization
- [ ] SIEMPRE uso middleware de autenticación
- [ ] NUNCA expongo rutas sin autenticación

### **Base de Datos**

- [ ] Si modifico schema → crear migración Prisma
- [ ] Si modifico queries → usar transacciones si es necesario
- [ ] Si guardo datos → hacerlo en lotes (1000 registros)
- [ ] Si creo sesiones → incluir `organizationId`

---

## 🧪 CHECKLIST POST-MODIFICACIÓN (TESTING)

### **Tests Manuales Obligatorios**

#### **Test 1: Upload Simple (✅ Debe Pasar)**

- [ ] Archivo: `ESTABILIDAD_DOBACK001_20250101.txt`
- [ ] Tamaño: Entre 100 bytes y 100 MB
- [ ] Resultado: 200 OK
- [ ] Sesiones creadas: >= 1
- [ ] Vehículo creado si no existía
- [ ] Métricas de calidad guardadas
- [ ] KPI cache invalidado

#### **Test 2: Upload Completo (✅ Debe Pasar)**

- [ ] Archivos:
  - `ESTABILIDAD_DOBACK001_20250101.txt`
  - `GPS_DOBACK001_20250101.txt`
  - `ROTATIVO_DOBACK001_20250101.txt`
- [ ] Resultado: 200 OK
- [ ] Sesiones con GPS + Estabilidad + Rotativo correlacionados
- [ ] Número de sesiones = max(sesiones en cada archivo)
- [ ] Datos guardados correctamente en BD

#### **Test 3: Upload Múltiple Vehículos (✅ Debe Pasar)**

- [ ] Archivos:
  - `ESTABILIDAD_DOBACK001_20250101.txt`
  - `GPS_DOBACK001_20250101.txt`
  - `ESTABILIDAD_DOBACK002_20250101.txt`
  - `GPS_DOBACK002_20250101.txt`
- [ ] Resultado: 200 OK
- [ ] 2 grupos procesados (DOBACK001 y DOBACK002)
- [ ] Sesiones separadas por vehículo

#### **Test 4: Upload con GPS Sin Señal (✅ Debe Pasar Parcialmente)**

- [ ] Archivo GPS con muchas líneas "sin datos GPS"
- [ ] Resultado: 200 o 207
- [ ] Sesión creada
- [ ] GPS marcado como "sin señal" en métricas
- [ ] Sistema NO falla
- [ ] Métricas reflejan problema GPS

#### **Test 5: Archivo Incorrecto (❌ Debe Rechazar)**

- [ ] Archivo: `archivo_invalido.txt`
- [ ] Resultado: 400 Bad Request
- [ ] Error claro explicando el problema
- [ ] NO se procesa
- [ ] NO se guarda en BD

#### **Test 6: Sin Autenticación (❌ Debe Rechazar)**

- [ ] Request sin JWT token
- [ ] Resultado: 401 Unauthorized
- [ ] Error claro
- [ ] NO se procesa

#### **Test 7: Archivo Demasiado Grande (❌ Debe Rechazar)**

- [ ] Archivo > 100 MB
- [ ] Resultado: 400 Bad Request
- [ ] Error claro sobre tamaño
- [ ] NO se procesa

#### **Test 8: Demasiados Archivos (❌ Debe Rechazar)**

- [ ] Más de 20 archivos
- [ ] Resultado: 400 Bad Request
- [ ] Error claro sobre límite
- [ ] NO se procesa

### **Verificaciones en Base de Datos**

Después de cada test exitoso, verificar en PostgreSQL:

```sql
-- Verificar sesiones creadas
SELECT id, "vehicleId", "startTime", "endTime", "sessionNumber", "organizationId"
FROM "Session"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Verificar mediciones GPS
SELECT COUNT(*), "sessionId"
FROM "GpsMeasurement"
GROUP BY "sessionId"
ORDER BY COUNT(*) DESC;

-- Verificar mediciones Estabilidad
SELECT COUNT(*), "sessionId"
FROM "StabilityMeasurement"
GROUP BY "sessionId"
ORDER BY COUNT(*) DESC;

-- Verificar mediciones Rotativo
SELECT COUNT(*), "sessionId"
FROM "RotativoMeasurement"
GROUP BY "sessionId"
ORDER BY COUNT(*) DESC;

-- Verificar métricas de calidad
SELECT "sessionId", "gpsTotal", "gpsValidas", "gpsSinSenal", "porcentajeGPSValido"
FROM "DataQualityMetrics"
ORDER BY "createdAt" DESC;
```

- [ ] Sesiones tienen `organizationId` correcto
- [ ] Sesiones tienen `startTime` y `endTime` válidos
- [ ] Mediciones tienen `sessionId` correcto
- [ ] Métricas de calidad están presentes
- [ ] No hay datos huérfanos

### **Verificaciones en Frontend**

- [ ] UI muestra resultado del upload correctamente
- [ ] Errores se muestran claramente
- [ ] Advertencias se muestran
- [ ] Progreso se muestra durante upload
- [ ] No hay errores en consola del navegador
- [ ] No hay errores de TypeScript

### **Verificaciones en Backend**

- [ ] Logs muestran el procesamiento correctamente
- [ ] No hay errores no manejados
- [ ] No hay warnings críticos
- [ ] Cache de KPIs se invalida
- [ ] No hay memory leaks

---

## 📊 CHECKLIST DE VERIFICACIÓN DE LOGS

### **Frontend Logs (Consola del Navegador)**

- [ ] No hay errores (rojo)
- [ ] Warnings son esperados y documentados
- [ ] Logs de `logger` se muestran correctamente
- [ ] No hay requests fallidos (500, 404)

### **Backend Logs (Terminal/Archivo)**

Verificar que aparecen estos logs en orden:

1. [ ] `Recibidos X archivos para procesar`
2. [ ] `Archivos agrupados en Y conjuntos`
3. [ ] `Procesando grupo: DOBACKXXX YYYYMMDD`
4. [ ] `Sesiones detectadas: ESTABILIDAD=X, GPS=Y, ROTATIVO=Z`
5. [ ] `GPS guardado: X mediciones`
6. [ ] `ESTABILIDAD guardada: X mediciones`
7. [ ] `ROTATIVO guardado: X mediciones`
8. [ ] `Sesión XXX creada`
9. [ ] `Cache de KPIs invalidado`
10. [ ] `Procesamiento completado`

- [ ] Todos los logs están presentes
- [ ] No hay logs de error inesperados
- [ ] Tiempos de procesamiento son razonables

---

## 🚨 CHECKLIST DE TROUBLESHOOTING

### **Si el Upload Falla con 400**

- [ ] Verificar que archivos cumplen patrón de nombre
- [ ] Verificar que archivos tienen extensión `.txt`
- [ ] Verificar que tamaño < 100 MB
- [ ] Verificar que hay ≤ 20 archivos
- [ ] Verificar contenido del error en respuesta

### **Si el Upload Falla con 401**

- [ ] Verificar que usuario está autenticado
- [ ] Verificar que JWT token es válido
- [ ] Verificar que token no ha expirado
- [ ] Verificar que middleware de auth está aplicado

### **Si el Upload Falla con 500**

- [ ] Revisar logs del backend
- [ ] Verificar conexión a base de datos
- [ ] Verificar que Prisma está configurado correctamente
- [ ] Verificar que no hay errores de parsing
- [ ] Revisar stack trace completo

### **Si No Se Crean Sesiones**

- [ ] Verificar que archivos tienen contenido válido
- [ ] Verificar que parsers detectan datos
- [ ] Verificar logs de detección de sesiones
- [ ] Verificar que archivos tienen cabeceras correctas
- [ ] Verificar formato de timestamps

### **Si Faltan Datos en BD**

- [ ] Verificar que transacciones se completaron
- [ ] Verificar que no hay errores de inserción en lotes
- [ ] Verificar límite de batch size (1000)
- [ ] Verificar que sesión se creó antes de mediciones
- [ ] Verificar que `sessionId` es correcto

### **Si Cache No Se Invalida**

- [ ] Verificar que `kpiCacheService.invalidate()` se llama
- [ ] Verificar que `organizationId` es correcto
- [ ] Verificar logs de invalidación de cache
- [ ] Verificar que `sesionesCreadas > 0`

---

## 📝 CHECKLIST DE DOCUMENTACIÓN

### **Después de Modificar Código**

- [ ] Actualicé `PROTOCOLOS_SISTEMA_UPLOAD.md` si cambié reglas
- [ ] Actualicé `CHANGELOG.md` con los cambios
- [ ] Actualicé comentarios en el código modificado
- [ ] Actualicé tests si cambié comportamiento
- [ ] Actualicé tipos TypeScript si cambié interfaces

### **Si Cambié Formato de Archivos**

- [ ] Actualicé `GUIA_ARCHIVOS_BD_DOBACKSOFT.md`
- [ ] Actualicé regex `FILE_NAME_PATTERN`
- [ ] Actualicé validadores frontend y backend
- [ ] Actualicé parsers
- [ ] Actualicé tests

### **Si Cambié Respuestas HTTP**

- [ ] Actualicé interfaces TypeScript
- [ ] Actualicé documentación de API
- [ ] Actualicé frontend para manejar nueva respuesta
- [ ] Actualicé tests

---

## ⚡ CHECKLIST RÁPIDO (ANTES DE CADA COMMIT)

### **5 Minutos de Verificación**

- [ ] ✅ Test 1 (Upload Simple) pasa
- [ ] ✅ Test 5 (Archivo Incorrecto) rechaza correctamente
- [ ] ✅ No hay errores en logs
- [ ] ✅ No hay errores de TypeScript
- [ ] ✅ No hay errores de linter
- [ ] ✅ Código está formateado correctamente
- [ ] ✅ He actualizado documentación relevante
- [ ] ✅ He añadido entry en CHANGELOG.md

---

## 🎯 CHECKLIST FINAL (ANTES DE MERGE/DEPLOY)

### **Verificación Completa del Sistema**

- [ ] Todos los tests manuales (1-8) pasan
- [ ] Todos los tests automatizados pasan
- [ ] No hay errores en frontend
- [ ] No hay errores en backend
- [ ] No hay errores en base de datos
- [ ] Documentación está actualizada
- [ ] CHANGELOG.md está actualizado
- [ ] No hay TODOs o FIXMEs sin resolver
- [ ] Código está revisado por otro desarrollador (si aplica)
- [ ] Performance es aceptable (< 5 segundos para archivos pequeños)

### **Limpieza**

- [ ] He eliminado archivos temporales de prueba
- [ ] He eliminado logs de debug
- [ ] He eliminado código comentado innecesario
- [ ] He eliminado imports no usados
- [ ] He eliminado `console.log` no intencionados

---

## 📞 CONTACTO EN CASO DE PROBLEMAS

Si algún checklist falla y no puedes resolver:

1. **Revisar** `PROTOCOLOS_SISTEMA_UPLOAD.md`
2. **Buscar** en logs del backend
3. **Verificar** base de datos manualmente
4. **Consultar** con el equipo
5. **Documentar** el problema encontrado

---

**NUNCA HACER MERGE SI ALGÚN CHECKLIST OBLIGATORIO FALLA**

**Última actualización:** 2025-10-11

