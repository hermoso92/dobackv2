# 🚀 CÓMO INICIAR EL SISTEMA Y VER LOGS

**DobackSoft V3 - Guía de Inicio con Logging**

---

## 🎯 INICIO RÁPIDO

### **Método 1: Iniciar con Logs (RECOMENDADO)**

```powershell
# Ejecutar desde la raíz del proyecto
.\iniciar.ps1
```

**El script ahora guarda logs automáticamente en:**
- `logs\backend-YYYYMMDD-HHmmss.log`
- `logs\frontend-YYYYMMDD-HHmmss.log`

### **Método 2: Ver Logs del Sistema**

```powershell
# Ver logs de forma interactiva
.\ver-logs.ps1
```

**Opciones disponibles:**
1. Ver últimas 50 líneas del backend
2. Ver últimas 50 líneas del frontend
3. Seguir backend en tiempo real
4. Seguir frontend en tiempo real
5. Verificar estado de servicios
6. Salir

---

## 📊 VERIFICAR ESTADO DEL SISTEMA

### **Verificar si está corriendo:**

```powershell
# Ver procesos Node.js
Get-Process node -ErrorAction SilentlyContinue

# Ver puertos en uso
Get-NetTCPConnection -LocalPort 9998,5174 -ErrorAction SilentlyContinue

# Probar conectividad
Invoke-WebRequest -Uri "http://localhost:9998/health" -TimeoutSec 3
Invoke-WebRequest -Uri "http://localhost:5174" -TimeoutSec 3
```

### **Ver logs en tiempo real:**

```powershell
# Backend
Get-Content logs\backend-*.log -Wait -Tail 50

# Frontend
Get-Content logs\frontend-*.log -Wait -Tail 50
```

---

## 🔍 DETECTAR FALLOS

### **Errores Comunes a Buscar en Logs:**

**Backend:**
```
❌ "Error connecting to database"
   → Verificar que PostgreSQL esté corriendo
   → Verificar credenciales en iniciar.ps1

❌ "Cannot find module"
   → Ejecutar: cd backend && npm install

❌ "Port 9998 already in use"
   → El script debería liberar el puerto
   → Manual: taskkill /F /IM node.exe

❌ "Prisma Client not generated"
   → Ejecutar: cd backend && npx prisma generate
```

**Frontend:**
```
❌ "Failed to fetch"
   → Backend no está corriendo
   → Verificar http://localhost:9998/health

❌ "Port 5174 is already in use"
   → Cerrar procesos o cambiar puerto

❌ "Module not found"
   → Ejecutar: cd frontend && npm install
```

### **Buscar Errores en Logs:**

```powershell
# Buscar palabra "error" en backend
Select-String -Path logs\backend-*.log -Pattern "error" -Context 2,2

# Buscar palabra "failed" en frontend
Select-String -Path logs\frontend-*.log -Pattern "failed" -Context 2,2

# Buscar errores de Prisma
Select-String -Path logs\backend-*.log -Pattern "Prisma" -Context 2,2
```

---

## 🛠️ COMANDOS DE DIAGNÓSTICO

### **Ver todos los logs del sistema:**

```powershell
# Listar todos los logs
Get-ChildItem logs\ -Recurse | Format-Table Name, Length, LastWriteTime

# Ver log específico
Get-Content logs\backend-20251022-062500.log

# Filtrar solo errores
Get-Content logs\backend-*.log | Select-String "ERROR|error|Error"

# Ver últimas 100 líneas
Get-Content logs\backend-*.log -Tail 100
```

### **Verificar base de datos:**

```powershell
# Conectar a PostgreSQL
$env:PGPASSWORD='cosigein'
psql -U postgres -h localhost -d dobacksoft

# Dentro de psql:
\dt                          # Listar tablas
\d "MissingFileAlert"        # Ver estructura de tabla
\d "ScheduledReport"         # Ver estructura de tabla
SELECT COUNT(*) FROM "User"; # Contar usuarios
\q                          # Salir
```

### **Verificar cron jobs se iniciaron:**

```powershell
# Buscar en logs del backend
Select-String -Path logs\backend-*.log -Pattern "cron|Inicializando cron|Cron job"
```

**Debes ver:**
```
🕐 Inicializando cron jobs del sistema
✅ Cron job de verificación de archivos configurado (08:00 AM diario)
✅ Reportes programados inicializados
✅ Cron job de limpieza configurado
```

---

## 📝 LOGS IMPORTANTES A REVISAR

### **Inicio exitoso del Backend:**

```
✅ Prisma Client conectado y listo
🕐 Inicializando cron jobs del sistema
✅ Cron job de verificación de archivos configurado
✅ Reportes programados inicializados
✅ Todos los cron jobs inicializados
🚀 Servidor iniciado en 0.0.0.0:9998
```

### **Inicio exitoso del Frontend:**

```
VITE v... ready in ... ms
➜  Local:   http://localhost:5174/
➜  Network: use --host to expose
➜  press h + enter to show help
```

---

## 🚨 SI EL SISTEMA NO INICIA

### **Opción 1: Reiniciar Todo**

```powershell
# 1. Detener procesos Node
taskkill /F /IM node.exe

# 2. Esperar 5 segundos
Start-Sleep -Seconds 5

# 3. Iniciar nuevamente
.\iniciar.ps1
```

### **Opción 2: Iniciar Manualmente**

**Terminal 1 - Backend:**
```powershell
cd backend
$env:DATABASE_URL='postgresql://postgres:cosigein@localhost:5432/dobacksoft'
$env:PORT='9998'
npx ts-node-dev --respawn --transpile-only src/index.ts
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev -- --port 5174
```

### **Opción 3: Verificar Dependencias**

```powershell
# Backend
cd backend
npm install
npx prisma generate

# Frontend
cd frontend
npm install
```

---

## ✅ VERIFICACIÓN POST-INICIO

Una vez que el sistema esté corriendo:

```powershell
# 1. Verificar servicios
.\ver-logs.ps1
# Selecciona opción 5

# 2. Ver logs del backend
.\ver-logs.ps1
# Selecciona opción 1

# 3. Abrir navegador
Start-Process "http://localhost:5174"

# 4. Ver logs en tiempo real (opcional)
Get-Content logs\backend-*.log -Wait -Tail 20
```

---

## 📚 ARCHIVOS DE AYUDA

- `ver-logs.ps1` - Visualizador interactivo de logs
- `iniciar.ps1` - Inicio del sistema (ahora con logging)
- `_LEE_ESTO_AHORA.txt` - Resumen de implementación
- `ESTADO-FINAL-DEPLOYMENT.md` - Estado del deployment

---

## 💡 TIPS

**Para debugging:**
1. Siempre revisa los logs primero
2. Busca palabras clave: ERROR, error, failed, Cannot
3. Verifica que PostgreSQL esté corriendo
4. Verifica que los puertos estén libres
5. Usa `.\ver-logs.ps1` para diagnóstico rápido

**Para ver errores específicos:**
```powershell
# Buscar errores de compilación
Select-String -Path logs\backend-*.log -Pattern "TypeScript|TS\d+"

# Buscar errores de BD
Select-String -Path logs\backend-*.log -Pattern "Prisma|PostgreSQL|database"

# Buscar errores de auth
Select-String -Path logs\backend-*.log -Pattern "auth|token|JWT"
```

---

## 🎯 SIGUIENTE PASO

```powershell
# Si el sistema no está corriendo, ejecuta:
.\iniciar.ps1

# Espera 30 segundos y luego verifica:
.\ver-logs.ps1
```

**¡Sistema listo!** 🚀


