# ✅ CHECKLIST DE ESTABILIZACIÓN - Geoprocesamiento

**Fecha:** 2025-10-17  
**Versión:** 1.0

---

## 📋 PREPARACIÓN

### **Antes de empezar:**
- [ ] Leer `RESUMEN_EJECUTIVO.md`
- [ ] Leer `DIAGNOSTICO_Y_PLAN_ESTABILIZACION.md`
- [ ] Decidir opción: A, B o C
- [ ] Hacer backup de base de datos actual
- [ ] Verificar que backend y frontend NO están corriendo

---

## 🔧 FASE 1: PREPARACIÓN (40 min)

### **1.1 Agregar Modelos a Prisma**
- [ ] Abrir `backend/prisma/schema.prisma`
- [ ] Agregar modelos: `ProcessingLog`, `SpeedLimitConfig`, `SpeedLimitCache`
- [ ] Guardar archivo
- [ ] Ejecutar: `cd backend && npx prisma validate`
- [ ] ✅ Verificar: "The schema is valid"

### **1.2 Regenerar Prisma Client**
- [ ] Ejecutar: `cd backend && npx prisma generate`
- [ ] ✅ Verificar: No hay errores en consola
- [ ] ✅ Verificar: `node_modules/.prisma/client/index.d.ts` contiene los nuevos modelos

### **1.3 Agregar Variables de Entorno**
- [ ] Abrir `backend/config.env`
- [ ] Agregar: `OSRM_URL=http://localhost:5000`
- [ ] Guardar archivo
- [ ] ✅ Verificar: `Select-String "OSRM_URL" backend/config.env`

---

## 🐳 FASE 2: OSRM CON DOCKER (30 min)

### **2.1 Crear docker-compose.osrm.yml**
- [ ] Crear archivo en raíz del proyecto
- [ ] Copiar contenido del plan
- [ ] ✅ Verificar: Archivo existe

### **2.2 Levantar OSRM**
- [ ] Ejecutar: `docker-compose -f docker-compose.osrm.yml up -d`
- [ ] Esperar 15 segundos
- [ ] ✅ Verificar: `docker ps` muestra contenedor `dobacksoft-osrm`
- [ ] ✅ Verificar: `docker logs dobacksoft-osrm` muestra "listening on: 0.0.0.0:5000"

### **2.3 Verificar OSRM**
- [ ] Ejecutar: `curl http://localhost:5000/nearest/v1/driving/-3.692,40.419`
- [ ] ✅ Verificar: Retorna JSON con `"code": "Ok"`
- [ ] ✅ Verificar: `Test-NetConnection -ComputerName localhost -Port 5000` retorna `True`

---

## 🔗 FASE 3: INTEGRACIÓN (15 min)

### **3.1 Activar Integración en UploadPostProcessor**
- [ ] Abrir `backend/src/services/upload/UploadPostProcessor.ts`
- [ ] Agregar import: `import { routeProcessorService } from '../geoprocessing/RouteProcessorService';`
- [ ] Agregar llamada a `routeProcessorService.processSession()` después de guardar sesión
- [ ] Guardar archivo

### **3.2 Recompilar Backend**
- [ ] Ejecutar: `cd backend && npm run build`
- [ ] ✅ Verificar: Compilación exitosa sin errores
- [ ] ✅ Verificar: `dist/` contiene archivos compilados

---

## ✅ FASE 4: VERIFICACIÓN (30 min)

### **4.1 Iniciar Backend**
- [ ] Ejecutar: `cd backend && npm run dev`
- [ ] ✅ Verificar: Backend inicia sin errores
- [ ] ✅ Verificar: Logs muestran "Servidor iniciado en 0.0.0.0:9998"

### **4.2 Verificar Health Endpoint**
- [ ] Ejecutar: `curl http://localhost:9998/api/health`
- [ ] ✅ Verificar: Retorna `{"status": "ok", "ts": "..."}`

### **4.3 Verificar Geoprocessing Health**
- [ ] Ejecutar: `curl http://localhost:9998/api/geoprocessing/health`
- [ ] ✅ Verificar: Retorna `{"status": "healthy", "services": {"osrm": "healthy", "postgis": "healthy"}}`

### **4.4 Ejecutar Test de Geoprocesamiento**
- [ ] Ejecutar: `cd backend && npx ts-node src/scripts/test-geoprocessing.ts`
- [ ] ✅ Verificar: Muestra "✅ OSRM funcionando"
- [ ] ✅ Verificar: Muestra "✅ Resultados:" con distancia, duración, confianza
- [ ] ✅ Verificar: NO muestra "❌ Error"

### **4.5 Verificar Logs del Backend**
- [ ] Abrir logs: `Get-Content backend/logs/app.log -Tail 50`
- [ ] ✅ Verificar: Contiene "✅ Ruta matcheada: XXX m, confianza: X.XX"
- [ ] ✅ Verificar: NO contiene "⚠️ Error en OSRM, usando fallback Haversine"

---

## 🧪 FASE 5: PRUEBA END-TO-END (15 min)

### **5.1 Subir Archivo de Prueba**
- [ ] Subir archivo GPS/Estabilidad/CAN/Rotativo vía `/api/upload-unified`
- [ ] Esperar 10 segundos
- [ ] ✅ Verificar: Upload exitoso

### **5.2 Verificar Sesión en Base de Datos**
- [ ] Ejecutar: `psql -U postgres -d dobacksoft -c "SELECT id, vehicle_id, matched_distance, matched_confidence FROM \"Session\" ORDER BY created_at DESC LIMIT 1;"`
- [ ] ✅ Verificar: `matched_distance` NO es NULL
- [ ] ✅ Verificar: `matched_confidence` > 0.7

### **5.3 Verificar Processing Log**
- [ ] Ejecutar: `psql -U postgres -d dobacksoft -c "SELECT session_id, processing_type, status, error_message FROM processing_log ORDER BY created_at DESC LIMIT 1;"`
- [ ] ✅ Verificar: `status` = 'success'
- [ ] ✅ Verificar: `error_message` IS NULL

---

## 🎯 CRITERIOS DE ÉXITO FINAL

### **Checklist de Validación:**
- [ ] Backend compila sin errores de TypeScript
- [ ] Prisma Client genera modelos: ProcessingLog, SpeedLimitConfig, SpeedLimitCache
- [ ] OSRM responde en `http://localhost:5000`
- [ ] `/api/health` retorna `{"status": "ok"}`
- [ ] `/api/geoprocessing/health` retorna `{"status": "healthy", "services": {"osrm": "healthy", "postgis": "healthy"}}`
- [ ] `test-geoprocessing.ts` ejecuta sin errores
- [ ] Logs muestran `✅ Ruta matcheada` (no Haversine)
- [ ] Sesión subida tiene `matched_distance` y `matched_confidence` en BD
- [ ] `processing_log` tiene registro con `status = 'success'`

---

## 🛑 STOP-THE-LINE POLICY

**Si cualquier verificación falla, DETENER y CORREGIR antes de continuar:**

| Fase | Verificación | Si Falla | Acción |
|------|--------------|----------|--------|
| 1.1 | `npx prisma validate` | Errores | Corregir `schema.prisma` |
| 1.2 | `npx prisma generate` | Errores | Verificar conexión a BD |
| 1.3 | `Select-String "OSRM_URL"` | No encuentra | Verificar `config.env` |
| 2.2 | `docker logs dobacksoft-osrm` | No inicia | Verificar archivos `.osrm` |
| 2.3 | `Test-NetConnection -Port 5000` | False | Reiniciar contenedor |
| 3.2 | `npm run build` | Errores | Corregir imports/código |
| 4.1 | `/api/health` | No responde | Backend no corriendo |
| 4.3 | `/api/geoprocessing/health` | `osrm: unhealthy` | Ver Fase 2 |
| 4.4 | `test-geoprocessing.ts` | Sesión no encontrada | Usar ID real de BD |
| 5.2 | `matched_distance IS NULL` | No procesó | Ver Fase 3 |

---

## 📊 PROGRESO

### **Fase 1: Preparación**
- [ ] 1.1 Agregar Modelos a Prisma
- [ ] 1.2 Regenerar Prisma Client
- [ ] 1.3 Agregar Variables de Entorno

### **Fase 2: OSRM con Docker**
- [ ] 2.1 Crear docker-compose.osrm.yml
- [ ] 2.2 Levantar OSRM
- [ ] 2.3 Verificar OSRM

### **Fase 3: Integración**
- [ ] 3.1 Activar Integración en UploadPostProcessor
- [ ] 3.2 Recompilar Backend

### **Fase 4: Verificación**
- [ ] 4.1 Iniciar Backend
- [ ] 4.2 Verificar Health Endpoint
- [ ] 4.3 Verificar Geoprocessing Health
- [ ] 4.4 Ejecutar Test de Geoprocesamiento
- [ ] 4.5 Verificar Logs del Backend

### **Fase 5: Prueba End-to-End**
- [ ] 5.1 Subir Archivo de Prueba
- [ ] 5.2 Verificar Sesión en Base de Datos
- [ ] 5.3 Verificar Processing Log

---

## 📝 NOTAS

- ✅ **Tiempo estimado total:** 2-3 horas
- ✅ **Riesgo:** BAJO
- ✅ **Éxito probable:** 90%

---

## 🎉 CONCLUSIÓN

**Al completar este checklist, el módulo de geoprocesamiento estará 100% funcional.**

---

**Documento generado por:** AI Assistant  
**Estado:** 🔴 **PENDIENTE DE EJECUCIÓN**

