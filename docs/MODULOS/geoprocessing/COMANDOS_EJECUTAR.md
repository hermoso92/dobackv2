# 🚀 COMANDOS PARA EJECUTAR - Estabilización Geoprocesamiento

**Fecha:** 2025-10-17  
**Versión:** 1.0

---

## 📋 INSTRUCCIONES

1. **Copia y pega cada comando** en PowerShell
2. **Espera a que termine** antes de ejecutar el siguiente
3. **Verifica la salida** antes de continuar
4. **Si falla, detente** y revisa el checklist

---

## 🔧 FASE 1: PREPARACIÓN

### **1.1 Validar Schema de Prisma**

```powershell
cd backend
npx prisma validate
```

**✅ Salida esperada:**
```
The schema is valid
```

---

### **1.2 Regenerar Prisma Client**

```powershell
cd backend
npx prisma generate
```

**✅ Salida esperada:**
```
✔ Generated Prisma Client (X.XX.X | library) to .\node_modules\.prisma\client in XXXms
```

---

### **1.3 Verificar Variable OSRM_URL**

```powershell
Select-String "OSRM_URL" backend/config.env
```

**✅ Salida esperada:**
```
backend/config.env:42:OSRM_URL=http://localhost:5000
```

**❌ Si no existe, agregar manualmente:**
```powershell
Add-Content backend/config.env "`n# OSRM Configuration`nOSRM_URL=http://localhost:5000"
```

---

## 🐳 FASE 2: OSRM CON DOCKER

### **2.1 Crear docker-compose.osrm.yml**

```powershell
@"
version: '3.8'

services:
  osrm:
    image: osrm/osrm-backend:latest
    container_name: dobacksoft-osrm
    ports:
      - "5000:5000"
    volumes:
      - ./osrm-data:/data
    command: osrm-routed --algorithm mld /data/madrid-latest.osrm
    restart: unless-stopped
"@ | Out-File -FilePath "docker-compose.osrm.yml" -Encoding utf8
```

**✅ Verificar:**
```powershell
Test-Path docker-compose.osrm.yml
```

**Salida esperada:**
```
True
```

---

### **2.2 Levantar OSRM**

```powershell
docker-compose -f docker-compose.osrm.yml up -d
```

**✅ Salida esperada:**
```
Creating dobacksoft-osrm ... done
```

---

### **2.3 Esperar 15 segundos**

```powershell
Start-Sleep -Seconds 15
```

---

### **2.4 Verificar Contenedor**

```powershell
docker ps --filter "name=dobacksoft-osrm"
```

**✅ Salida esperada:**
```
CONTAINER ID   IMAGE                    STATUS         PORTS                    NAMES
xxxxxxxxxxxx   osrm/osrm-backend:latest   Up 15 seconds   0.0.0.0:5000->5000/tcp   dobacksoft-osrm
```

---

### **2.5 Verificar Logs**

```powershell
docker logs dobacksoft-osrm
```

**✅ Salida esperada:**
```
[info] starting up engines, v5.XX.X
[info] listening on: 0.0.0.0:5000
[info] running and waiting for requests
```

---

### **2.6 Verificar Puerto 5000**

```powershell
Test-NetConnection -ComputerName localhost -Port 5000 -InformationLevel Quiet
```

**✅ Salida esperada:**
```
True
```

---

### **2.7 Test de OSRM**

```powershell
curl http://localhost:5000/nearest/v1/driving/-3.692,40.419
```

**✅ Salida esperada:**
```json
{
  "code": "Ok",
  "waypoints": [
    {
      "hint": "...",
      "distance": 0,
      "name": "...",
      "location": [-3.692, 40.419]
    }
  ]
}
```

---

## 🔗 FASE 3: INTEGRACIÓN

### **3.1 Recompilar Backend**

```powershell
cd backend
npm run build
```

**✅ Salida esperada:**
```
> stabil-safe-backend@1.0.0 build
> tsc

✨ Built in XXXms
```

---

## ✅ FASE 4: VERIFICACIÓN

### **4.1 Iniciar Backend**

```powershell
cd backend
npm run dev
```

**✅ Salida esperada:**
```
Servidor iniciado en 0.0.0.0:9998
Ambiente: development
URL: http://0.0.0.0:9998
Health: http://0.0.0.0:9998/health
```

**⏸️ Dejar corriendo en esta terminal**

---

### **4.2 Abrir Nueva Terminal (PowerShell)**

**Presionar:** `Ctrl + Shift + N` (nueva ventana de PowerShell)

---

### **4.3 Verificar Health Endpoint**

```powershell
curl http://localhost:9998/api/health
```

**✅ Salida esperada:**
```json
{
  "status": "ok",
  "ts": "2025-10-17T..."
}
```

---

### **4.4 Verificar Geoprocessing Health**

```powershell
curl http://localhost:9998/api/geoprocessing/health
```

**✅ Salida esperada:**
```json
{
  "status": "healthy",
  "services": {
    "osrm": "healthy",
    "postgis": "healthy"
  },
  "timestamp": "2025-10-17T..."
}
```

**❌ Si falla:**
```json
{
  "status": "degraded",
  "services": {
    "osrm": "unhealthy",
    "postgis": "healthy"
  }
}
```

**→ Verificar Fase 2 (OSRM)**

---

### **4.5 Ejecutar Test de Geoprocesamiento**

```powershell
cd backend
npx ts-node src/scripts/test-geoprocessing.ts
```

**✅ Salida esperada:**
```
🧪 Iniciando pruebas de geoprocesamiento...

1️⃣ Verificando OSRM...
✅ OSRM funcionando

2️⃣ Procesando sesión de prueba...

✅ Resultados:
   📏 Distancia: 12345.67m (12.35 km)
   ⏱️  Duración: 1234s (20.6 min)
   🎯 Confianza: 95.0%
   🗺️  Eventos geocerca: 5
```

**❌ Si falla:**
```
❌ OSRM no disponible. Ejecuta: docker-compose up -d osrm
```

**→ Verificar Fase 2 (OSRM)**

---

### **4.6 Verificar Logs del Backend**

**En la terminal donde corre el backend:**

**✅ Buscar:**
```
✅ Ruta matcheada: 12345.67m, confianza: 0.95
```

**❌ NO debe aparecer:**
```
⚠️ Error en OSRM, usando fallback Haversine
```

---

## 🧪 FASE 5: PRUEBA END-TO-END

### **5.1 Subir Archivo de Prueba**

**Opción 1: Usar Postman/Thunder Client**
```
POST http://localhost:9998/api/upload-unified
Content-Type: multipart/form-data

file: [seleccionar archivo GPS/Estabilidad/CAN/Rotativo]
vehicleId: [ID de vehículo existente]
```

**Opción 2: Usar PowerShell**
```powershell
$file = "C:\ruta\a\tu\archivo.txt"
$vehicleId = "tu-vehicle-id-aqui"

$form = @{
    file = Get-Item $file
    vehicleId = $vehicleId
}

Invoke-RestMethod -Uri "http://localhost:9998/api/upload-unified" -Method Post -Form $form
```

**✅ Salida esperada:**
```json
{
  "success": true,
  "message": "Archivo procesado exitosamente",
  "data": {
    "sessionId": "...",
    "vehicleId": "..."
  }
}
```

---

### **5.2 Esperar 10 segundos**

```powershell
Start-Sleep -Seconds 10
```

---

### **5.3 Verificar Sesión en Base de Datos**

```powershell
psql -U postgres -d dobacksoft -c "SELECT id, vehicle_id, matched_distance, matched_confidence FROM \"Session\" ORDER BY created_at DESC LIMIT 1;"
```

**✅ Salida esperada:**
```
                id                | vehicle_id | matched_distance | matched_confidence
----------------------------------+------------+------------------+-------------------
 5894090f-156c-4816-92c6-4632e7dd | ...        | 12345.67         | 0.95
```

**❌ Si `matched_distance` es NULL:**
```
→ Verificar Fase 3 (Integración)
```

---

### **5.4 Verificar Processing Log**

```powershell
psql -U postgres -d dobacksoft -c "SELECT session_id, processing_type, status, error_message FROM processing_log ORDER BY created_at DESC LIMIT 1;"
```

**✅ Salida esperada:**
```
           session_id            | processing_type |  status   | error_message
---------------------------------+-----------------+-----------+---------------
 5894090f-156c-4816-92c6-4632e7dd | geoprocessing   | success   | NULL
```

**❌ Si `status` es `failed`:**
```
→ Ver error_message para diagnóstico
```

---

## 🎉 CONCLUSIÓN

### **Si todas las verificaciones pasaron:**

```powershell
Write-Host "✅ MÓDULO DE GEOPROCESAMIENTO ESTABILIZADO" -ForegroundColor Green
Write-Host "✅ OSRM funcionando correctamente" -ForegroundColor Green
Write-Host "✅ PostGIS funcionando correctamente" -ForegroundColor Green
Write-Host "✅ Backend compilando sin errores" -ForegroundColor Green
Write-Host "✅ Integración activada" -ForegroundColor Green
```

---

## 🛑 TROUBLESHOOTING

### **Problema: OSRM no inicia**

```powershell
# Ver logs detallados
docker logs dobacksoft-osrm

# Reiniciar contenedor
docker restart dobacksoft-osrm

# Verificar archivos .osrm
Get-ChildItem osrm-data/*.osrm
```

---

### **Problema: Puerto 5000 ocupado**

```powershell
# Ver qué está usando el puerto
netstat -ano | findstr :5000

# Matar proceso (reemplazar PID)
taskkill /PID [PID] /F

# Reiniciar OSRM
docker-compose -f docker-compose.osrm.yml restart
```

---

### **Problema: Backend no compila**

```powershell
# Limpiar node_modules
cd backend
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force dist

# Reinstalar dependencias
npm install

# Regenerar Prisma
npx prisma generate

# Recompilar
npm run build
```

---

### **Problema: PostGIS no funciona**

```powershell
# Verificar extensión
psql -U postgres -d dobacksoft -c "SELECT PostGIS_version();"

# Si falla, reinstalar PostGIS
# (Ver documentación de PostgreSQL)
```

---

## 📝 NOTAS FINALES

- ✅ **No cierres el backend** hasta completar todas las pruebas
- ✅ **Guarda los logs** si algo falla
- ✅ **Verifica cada paso** antes de continuar
- ✅ **Si algo falla, detente** y revisa el checklist

---

**Documento generado por:** AI Assistant  
**Estado:** 🔴 **PENDIENTE DE EJECUCIÓN**

