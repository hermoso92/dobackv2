# Cómo Probar el Dashboard Activado - Pasos Rápidos

## 🚀 Inicio Rápido (5 minutos)

### Paso 1: Verificar Configuración
```powershell
.\verificar-configuracion.ps1
```

**Resultado esperado**: ✅ TODO LISTO PARA PRUEBAS

---

### Paso 2: Copiar Variables de Entorno (si es primera vez)

Si el script anterior reporta que faltan archivos `.env`:

```powershell
# Copiar archivos de configuración
Copy-Item env.example .env
Copy-Item frontend\.env.example frontend\.env
```

---

### Paso 3: Iniciar Servicios

```powershell
.\iniciardev.ps1
```

**Esperar a ver**:
- ✅ Backend corriendo en puerto 9998
- ✅ Frontend corriendo en puerto 5174
- ✅ Navegador se abre automáticamente

---

### Paso 4: Login

1. En el navegador: `http://localhost:5174`
2. Login con tus credenciales de usuario

---

### Paso 5: Verificación Visual Rápida (2 minutos)

#### Dashboard → Estados & Tiempos
1. ¿Ves KPIs con números (no todos en 0)? 
   - ✅ SÍ → Funciona
   - ❌ NO → Ver "Solución de Problemas" abajo

#### Dashboard → Puntos Negros
1. ¿Se carga el mapa TomTom?
2. ¿Ves círculos/clusters en el mapa?
   - ✅ SÍ → Funciona
   - ❌ NO → Puede ser que no haya datos en el rango seleccionado

#### Dashboard → Velocidad
1. ¿Se carga el mapa?
2. ¿Ves puntos en el mapa?
3. ¿Las estadísticas muestran números?
   - ✅ SÍ → Funciona
   - ❌ NO → Puede ser que no haya datos

#### Panel de Diagnóstico
1. Click en **"⚙️ Diagnóstico"** en el header
2. ¿Se abre un panel con 5 indicadores?
   - ✅ SÍ → Funciona
   - ❌ NO → Revisar consola del navegador (F12)

---

## 🧪 Pruebas Detalladas (30 minutos)

Para pruebas exhaustivas, seguir: **`GUIA_PRUEBAS_ACEPTACION.md`**

---

## 🐛 Solución de Problemas Rápida

### KPIs en 0 (Estados & Tiempos)
```powershell
# Opción 1: Ejecutar script de auditoría para ver si hay datos
psql -U dobacksoft -d dobacksoft -f backend\scripts\audit_dashboard_data.sql

# Opción 2: Verificar logs del backend
# Buscar errores en la ventana de PowerShell del backend
```

### Mapas no cargan
1. Abrir consola del navegador (F12)
2. Buscar errores relacionados con TomTom
3. Verificar que `.env` tiene `REACT_APP_TOMTOM_API_KEY`

### "500 Internal Server Error"
1. Ir a la ventana de PowerShell del backend
2. Buscar el error específico
3. Si dice "PrismaClient...", ejecutar:
   ```powershell
   cd backend\src
   npx prisma generate
   cd ..\..
   ```

### Panel de Diagnóstico no responde
1. Abrir consola del navegador (F12)
2. Verificar que endpoint `/api/diagnostics/dashboard` retorna 200
3. Si retorna 500, revisar logs del backend

---

## 📊 Checklist Rápido

Antes de reportar como "completado":

- [ ] Script de verificación pasa sin errores
- [ ] Los 3 mapas cargan correctamente
- [ ] Estados & Tiempos muestra al menos 5 KPIs con datos > 0
- [ ] Puntos Negros muestra al menos 1 cluster
- [ ] Velocidad muestra al menos 1 violación
- [ ] Panel de Diagnóstico se abre y cierra
- [ ] Exportación PDF funciona (descargar y abrir)
- [ ] Sin errores rojos en consola del navegador

---

## 🎯 Si Todo Funciona

¡Felicitaciones! El Dashboard V3 está completamente activado.

**Siguiente paso**: Documentar resultados en formato de reporte (ver plantilla en `GUIA_PRUEBAS_ACEPTACION.md`)

---

## 📞 Si Algo Falla

1. **Capturar screenshot** del error
2. **Copiar mensaje de error** de la consola
3. **Revisar logs** del backend
4. **Consultar** `GUIA_PRUEBAS_ACEPTACION.md` sección "Solución de Problemas"

---

**Tiempo Estimado Total**: 5-10 minutos verificación + 30 minutos pruebas completas  
**Complejidad**: Baja (solo navegación web)  
**Requisitos**: Servicios corriendo, datos procesados en BD

