# 🖥️ Instalación Local - Módulo de Geoprocesamiento

**Sistema:** Windows 10/11  
**Base de datos:** PostgreSQL 16 local  
**Backend:** Node.js 20 + TypeScript

---

## 📋 Prerequisitos

### **1. PostgreSQL 16 con PostGIS 3.4**

**Descargar e instalar:**
- PostgreSQL 16: https://www.postgresql.org/download/windows/
- PostGIS 3.4: https://postgis.net/install/

**Verificar instalación:**
```powershell
# Verificar PostgreSQL
psql --version

# Conectar a PostgreSQL
psql -U postgres -d postgres

# Dentro de psql, verificar PostGIS
SELECT PostGIS_version();
```

### **2. Node.js 20+**

```powershell
node --version  # Debe ser v20 o superior
npm --version
```

---

## 🚀 Instalación Paso a Paso

### **Paso 1: Configurar PostgreSQL**

#### **1.1 Crear base de datos**

```powershell
# Conectar a PostgreSQL
psql -U postgres

# Dentro de psql:
CREATE DATABASE dobacksoft;
\c dobacksoft
```

#### **1.2 Ejecutar scripts SQL**

```powershell
# Desde la raíz del proyecto
psql -U postgres -d dobacksoft -f database/01-init-postgis.sql
psql -U postgres -d dobacksoft -f database/02-migrate-existing.sql
```

**Verificar:**
```sql
-- Verificar extensiones
SELECT PostGIS_version();

-- Verificar tablas nuevas
\dt speed_limits_config
\dt speed_limits_cache
\dt processing_log
```

---

### **Paso 2: Configurar Variables de Entorno**

**Crear archivo `.env` en la raíz del proyecto:**

```bash
# PostgreSQL
DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/dobacksoft

# OSRM (opcional - para map-matching)
OSRM_URL=http://localhost:5000

# TomTom (opcional - para límites de velocidad)
TOMTOM_API_KEY=your-tomtom-api-key-here

# Node
NODE_ENV=development
PORT=9998
```

**⚠️ IMPORTANTE:** Reemplaza `TU_PASSWORD` con tu contraseña de PostgreSQL.

---

### **Paso 3: Instalar OSRM (Opcional pero Recomendado)**

OSRM es necesario para **map-matching** (reconstrucción de rutas GPS).

#### **3.1 Opción A: Docker para OSRM (Más Fácil)**

```powershell
# Crear carpeta para datos OSRM
New-Item -ItemType Directory -Force -Path "osrm-data"

# Ejecutar OSRM en contenedor
docker run -d `
  --name dobacksoft-osrm `
  -p 5000:5000 `
  -v ${PWD}/osrm-data:/data `
  osrm/osrm-backend:v5.27.1 `
  sh -c "
    if [ ! -f /data/madrid-latest.osrm ]; then
      echo 'Descargando mapa de Madrid...';
      wget -O /data/madrid-latest.osm.pbf https://download.geofabrik.de/europe/spain/madrid-latest.osm.pbf;
      echo 'Preprocesando...';
      osrm-extract -p /opt/car.lua /data/madrid-latest.osm.pbf;
      osrm-contract /data/madrid-latest.osm.osrm;
    fi;
    osrm-routed --algorithm mld /data/madrid-latest.osrm
  "
```

**Verificar OSRM:**
```powershell
curl "http://localhost:5000/nearest/v1/driving/-3.692,40.419"
```

#### **3.2 Opción B: Sin OSRM (Fallback a Haversine)**

Si no instalas OSRM, el sistema usará **fórmula de Haversine** para calcular distancias (menos preciso pero funcional).

**Configurar en `.env`:**
```bash
# OSRM_URL=http://localhost:5000  # Comentar esta línea
```

---

### **Paso 4: Instalar Dependencias del Backend**

```powershell
# Ir al directorio backend
cd backend

# Instalar dependencias
npm install

# Instalar dependencias de geoprocesamiento
npm install @turf/boolean-point-in-polygon axios-retry

# Generar Prisma Client
npx prisma generate
```

---

### **Paso 5: Compilar TypeScript**

```powershell
# Desde backend/
npm run build
```

---

### **Paso 6: Iniciar Backend**

```powershell
# Desde backend/
npm run dev
```

**Verificar:**
```powershell
# Health check
curl http://localhost:9998/api/health

# Geoprocesamiento
curl http://localhost:9998/api/geoprocessing/health
```

---

## 🧪 Pruebas

### **Test de Geoprocesamiento**

```powershell
# Desde backend/
npx ts-node src/scripts/test-geoprocessing.ts
```

**Salida esperada:**
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

---

## 🔧 Troubleshooting

### **Error: "PostGIS extension not found"**

```sql
-- Conectar a dobacksoft
psql -U postgres -d dobacksoft

-- Crear extensiones manualmente
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### **Error: "OSRM not available"**

**Opción 1:** Instalar OSRM (ver Paso 3)  
**Opción 2:** El sistema usará fallback Haversine automáticamente (menos preciso)

### **Error: "Cannot connect to database"**

```powershell
# Verificar que PostgreSQL está corriendo
Get-Service -Name postgresql*

# Verificar credenciales en .env
# DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/dobacksoft
```

### **Error: "Prisma Client not generated"**

```powershell
cd backend
npx prisma generate
```

---

## 📊 Verificar Instalación

### **1. Verificar PostgreSQL + PostGIS**

```sql
-- Conectar
psql -U postgres -d dobacksoft

-- Ver extensiones
SELECT PostGIS_version();

-- Ver tablas nuevas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('speed_limits_config', 'speed_limits_cache', 'processing_log');
```

### **2. Verificar Backend**

```powershell
# Health check
curl http://localhost:9998/api/health

# Debe devolver:
# {"status":"ok","ts":"2025-10-16T23:34:00.000Z"}
```

### **3. Verificar OSRM (si instalaste)**

```powershell
curl "http://localhost:5000/nearest/v1/driving/-3.692,40.419"

# Debe devolver JSON con coordenadas
```

---

## 🎯 Próximos Pasos

1. ✅ **Subir archivos GPS** → El sistema procesará automáticamente
2. ✅ **Ver eventos de geocerca** → GET `/api/geofences/:id/events`
3. ✅ **Ver rutas matcheadas** → Campo `matchedGeometry` en Session
4. ✅ **Ver violaciones de velocidad** → Tabla `stability_events`

---

## 📚 Documentación Adicional

- **README_GEOPROCESAMIENTO.md** - Guía completa de uso
- **IMPLEMENTACION_COMPLETADA.md** - Detalles técnicos
- **RESUMEN_IMPLEMENTACION.md** - Resumen ejecutivo

---

## ✅ Checklist de Instalación

- [ ] PostgreSQL 16 instalado
- [ ] PostGIS 3.4 instalado
- [ ] Base de datos `dobacksoft` creada
- [ ] Scripts SQL ejecutados (01-init-postgis.sql, 02-migrate-existing.sql)
- [ ] Archivo `.env` creado con DATABASE_URL
- [ ] Node.js 20+ instalado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Prisma Client generado (`npx prisma generate`)
- [ ] Backend compilado (`npm run build`)
- [ ] Backend corriendo (`npm run dev`)
- [ ] Health check OK (`curl http://localhost:9998/api/health`)
- [ ] OSRM instalado (opcional)
- [ ] Test de geoprocesamiento OK

---

**¡Instalación completada!** 🎉
















