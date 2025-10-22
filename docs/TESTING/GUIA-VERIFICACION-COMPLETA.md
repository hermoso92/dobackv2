# 📖 Guía de Verificación Completa - DobackSoft V3.0

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Herramientas de Verificación](#herramientas-de-verificación)
3. [Verificación Automática](#verificación-automática)
4. [Verificación Manual](#verificación-manual)
5. [Interpretación de Resultados](#interpretación-de-resultados)
6. [Troubleshooting](#troubleshooting)
7. [Mejores Prácticas](#mejores-prácticas)

---

## Introducción

Esta guía describe cómo verificar exhaustivamente que el sistema DobackSoft funciona correctamente después de cambios o actualizaciones.

### ¿Cuándo verificar?

- ✅ Después de implementar nuevas funcionalidades
- ✅ Antes de desplegar a producción
- ✅ Después de cambios en la base de datos
- ✅ Después de actualizar dependencias
- ✅ Cuando hay reportes de problemas
- ✅ Periódicamente (recomendado: semanalmente)

---

## Herramientas de Verificación

### 1. Script de Verificación Automática

**Archivo:** `verificar-sistema.ps1`

**Uso básico:**
```powershell
.\verificar-sistema.ps1
```

**Opciones:**
```powershell
# Verificación rápida (sin tests)
.\verificar-sistema.ps1 -Quick

# Saltar tests automáticos
.\verificar-sistema.ps1 -SkipTests

# Modo verbose (más detalles)
.\verificar-sistema.ps1 -Verbose
```

**Qué verifica:**
- ✅ Estructura de archivos
- ✅ Servicios (backend, frontend, BD)
- ✅ Base de datos (tablas, enums, relaciones)
- ✅ Usuarios y roles
- ✅ Logs
- ✅ Nuevas funcionalidades implementadas
- ✅ Dependencias
- ✅ Tests automáticos (si no se salta)
- ✅ Configuración

**Salida:**
- Reporte HTML en `logs/verification-report-[timestamp].html`
- Resumen en consola con estadísticas
- Exit code 0 si todo OK, 1 si hay problemas

### 2. Monitor de Logs en Tiempo Real

**Archivo:** `monitorear-logs.ps1`

**Uso básico:**
```powershell
# Ver últimos 50 logs de ambos servicios
.\monitorear-logs.ps1

# Monitorear en tiempo real
.\monitorear-logs.ps1 -Follow

# Solo errores
.\monitorear-logs.ps1 -Level error

# Filtrar por palabra clave
.\monitorear-logs.ps1 -Filter "alert"

# Solo backend
.\monitorear-logs.ps1 -Servicio backend

# Combinar opciones
.\monitorear-logs.ps1 -Follow -Level error -Servicio backend
```

**Características:**
- ✅ Colorea logs por nivel (error=rojo, warn=amarillo, info=verde)
- ✅ Muestra ambos servicios simultáneamente
- ✅ Filtrado por nivel o palabra clave
- ✅ Modo tiempo real con `-Follow`

### 3. Visor de Logs Simple

**Archivo:** `ver-logs.ps1`

**Uso:**
```powershell
# Ver últimos logs de ambos
.\ver-logs.ps1

# Solo backend
.\ver-logs.ps1 backend

# Solo frontend
.\ver-logs.ps1 frontend
```

### 4. Checklist Manual

**Archivo:** `CHECKLIST-VERIFICACION-COMPLETA.md`

Checklist interactivo con ~150 ítems para verificación manual exhaustiva.

---

## Verificación Automática

### Paso 1: Ejecutar Script de Verificación

```powershell
.\verificar-sistema.ps1
```

### Paso 2: Revisar Salida en Consola

Busca:
- ✅ **Tests pasados:** Número de verificaciones exitosas
- ❌ **Tests fallidos:** Número de problemas encontrados
- ⏱️ **Duración:** Tiempo total de verificación
- 📊 **Tasa de éxito:** Porcentaje de tests pasados

Ejemplo de salida exitosa:
```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   📊 RESUMEN DE VERIFICACIÓN                                  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

Tests totales:  45
✅ Pasados:     45
❌ Fallidos:    0
⚠️  Advertencias: 0
⏱️  Duración:    12.45 segundos

Tasa de éxito: 100%

✅ SISTEMA VERIFICADO CORRECTAMENTE
   Todos los tests pasaron exitosamente
```

### Paso 3: Revisar Reporte HTML

Abre el reporte HTML generado en `logs/verification-report-[timestamp].html`

El reporte incluye:
- 📊 Resumen visual con tarjetas de estadísticas
- 📋 Tabla detallada de todos los tests
- 🎨 Coloreado por estado (verde=pass, rojo=fail)
- 📝 Mensajes de error detallados

### Paso 4: Ejecutar Tests Unitarios

Si no se saltó, el script ejecuta automáticamente:

```powershell
cd backend
npm test
```

Si se saltó, ejecuta manualmente:

```powershell
# Tests backend
cd backend
npm test

# Tests con coverage
npm test -- --coverage

# Tests específicos
npm test -- comprehensive.test.ts
```

---

## Verificación Manual

### Paso 1: Abrir Checklist

Abre `CHECKLIST-VERIFICACION-COMPLETA.md` en tu editor favorito.

### Paso 2: Seguir el Checklist

El checklist está dividido en 10 secciones:

1. **Backend - APIs y Autenticación**
2. **Frontend - Navegación y Componentes**
3. **Base de Datos**
4. **Roles y Permisos**
5. **Sistema de Alertas**
6. **Reportes Automáticos**
7. **Administración MANAGER**
8. **Integración Completa**
9. **Performance y Usabilidad**
10. **Seguridad**

### Paso 3: Verificar Cada Ítem

Para cada ítem:
1. Lee la descripción
2. Realiza la acción/verificación
3. Marca con ✅ si funciona correctamente
4. Marca con ❌ si hay problemas
5. Toma notas en los espacios provistos

### Paso 4: Calcular Porcentaje de Éxito

Al final del checklist:
1. Cuenta ítems verificados exitosamente
2. Divide por total de ítems (≈150)
3. Multiplica por 100 para obtener porcentaje

**Interpretación:**
- **≥95%:** Excelente, sistema listo para producción
- **85-94%:** Bueno, corregir problemas menores
- **70-84%:** Aceptable, hay problemas a resolver
- **<70%:** Crítico, no desplegar a producción

---

## Interpretación de Resultados

### Tests Automáticos

#### Estado: PASS (Verde)
- ✅ El test pasó exitosamente
- ✅ La funcionalidad está operativa
- ✅ No requiere acción

#### Estado: FAIL (Rojo)
- ❌ El test falló
- ❌ La funcionalidad no está operativa
- ⚠️ **Acción requerida:** Investigar y corregir

#### Estado: ERROR (Amarillo)
- ⚠️ Hubo un error al ejecutar el test
- ⚠️ Puede ser un problema temporal
- 🔍 **Acción sugerida:** Re-ejecutar test

### Categorías de Tests

**Estructura:**
- Verifica que archivos y carpetas existan
- Problemas aquí indican instalación incompleta

**Servicios:**
- Verifica que backend/frontend/BD estén funcionando
- Problemas aquí indican servicios caídos

**Base de Datos:**
- Verifica esquema y datos
- Problemas aquí indican migraciones incompletas

**Roles:**
- Verifica usuarios tienen roles correctos
- Problemas aquí indican configuración incorrecta

**Logs:**
- Verifica que logs se estén guardando
- Problemas aquí indican configuración de logging

**Funcionalidades:**
- Verifica que archivos de nuevas features existan
- Problemas aquí indican implementación incompleta

**Dependencias:**
- Verifica que node_modules estén instalados
- Problemas aquí indican `npm install` pendiente

**Tests:**
- Ejecuta suite de tests unitarios
- Problemas aquí indican bugs en código

---

## Troubleshooting

### Problema: Backend no responde

**Síntomas:**
- Test "Backend responde (puerto 9998)" falla
- Error: "No se puede conectar con el servidor remoto"

**Soluciones:**
1. Verifica que backend esté corriendo:
   ```powershell
   Get-Process node
   ```

2. Si no está corriendo, inicia manualmente:
   ```powershell
   cd backend
   $env:PORT="9998"
   $env:DATABASE_URL="postgresql://postgres:cosigein@localhost:5432/dobacksoft"
   npx ts-node-dev --respawn --transpile-only src/index.ts
   ```

3. Verifica logs de backend:
   ```powershell
   .\ver-logs.ps1 backend
   ```

4. Busca errores comunes:
   - "Prisma Client not initialized" → Ejecutar `npx prisma generate`
   - "Cannot connect to database" → Verificar PostgreSQL está corriendo
   - "Port 9998 already in use" → Liberar puerto o cambiar proceso

### Problema: Frontend no responde

**Síntomas:**
- Test "Frontend responde (puerto 5174)" falla
- Página no carga en navegador

**Soluciones:**
1. Verifica que frontend esté corriendo:
   ```powershell
   Get-NetTCPConnection -LocalPort 5174
   ```

2. Si no está corriendo, inicia manualmente:
   ```powershell
   cd frontend
   npm run dev -- --port 5174
   ```

3. Verifica logs de frontend:
   ```powershell
   .\ver-logs.ps1 frontend
   ```

4. Busca errores comunes:
   - "Cannot GET /" → Vite no compiló correctamente
   - "Network error" → Backend no está accesible
   - Pantalla blanca → Revisar consola del navegador (F12)

### Problema: Tabla no existe en BD

**Síntomas:**
- Tests de base de datos fallan
- Error: "relation 'MissingFileAlert' does not exist"

**Soluciones:**
1. Verificar si tabla existe:
   ```powershell
   $env:PGPASSWORD='cosigein'
   psql -U postgres -d dobacksoft -c "\dt"
   ```

2. Si falta, ejecutar migraciones:
   ```powershell
   cd backend
   npx prisma migrate deploy
   ```

3. Si persiste, verificar schema.prisma y regenerar:
   ```powershell
   npx prisma generate
   npx prisma db push
   ```

### Problema: Usuario tiene rol incorrecto

**Síntomas:**
- Test "Usuario test es MANAGER" falla
- Usuario no ve opciones esperadas en UI

**Soluciones:**
1. Verificar rol actual:
   ```powershell
   $env:PGPASSWORD='cosigein'
   psql -U postgres -d dobacksoft -c "SELECT email, role FROM \"User\" WHERE email = 'test@bomberosmadrid.es';"
   ```

2. Actualizar rol:
   ```sql
   UPDATE "User" 
   SET role = 'MANAGER' 
   WHERE email = 'test@bomberosmadrid.es';
   ```

3. **Importante:** Usuario debe hacer LOGOUT/LOGIN para que el cambio se refleje en el token JWT

### Problema: Tests unitarios fallan

**Síntomas:**
- Test "Tests backend disponibles" pasa
- Pero ejecución de tests falla

**Soluciones:**
1. Verificar dependencias de testing instaladas:
   ```powershell
   cd backend
   npm install -D jest ts-jest @types/jest supertest @types/supertest
   ```

2. Verificar configuración de Jest en `package.json`

3. Ejecutar tests con más detalle:
   ```powershell
   npm test -- --verbose --detectOpenHandles
   ```

4. Revisar setup de tests:
   ```powershell
   cat src/test/setup.ts
   ```

### Problema: Logs no se guardan

**Síntomas:**
- Tests de logs fallan
- No hay archivos en carpeta `logs/`

**Soluciones:**
1. Verificar carpeta logs existe:
   ```powershell
   if (-not (Test-Path "logs")) { New-Item -ItemType Directory -Path "logs" }
   ```

2. Verificar permisos de escritura

3. Verificar configuración de Winston en backend

4. Reiniciar servicios con `iniciar.ps1`

### Problema: Dependencias faltantes

**Síntomas:**
- Tests de dependencias fallan
- Errores "Cannot find module"

**Soluciones:**
1. Reinstalar dependencias backend:
   ```powershell
   cd backend
   rm -r node_modules
   npm install
   npx prisma generate
   ```

2. Reinstalar dependencias frontend:
   ```powershell
   cd frontend
   rm -r node_modules
   npm install
   ```

---

## Mejores Prácticas

### 1. Verificación Regular

**Frecuencia recomendada:**
- **Diaria:** Verificación rápida (`-Quick`)
- **Semanal:** Verificación completa
- **Antes de commits importantes:** Verificación completa + manual
- **Antes de despliegues:** Verificación exhaustiva con checklist

### 2. Documentar Problemas

Cuando encuentres problemas:
1. Toma captura de pantalla
2. Copia mensaje de error completo
3. Anota pasos para reproducir
4. Documenta en checklist o issue tracker

### 3. Mantener Logs

- Guarda reportes HTML de verificación
- Rotación automática de logs (30 días)
- Revisar logs periódicamente para detectar patrones

### 4. Automatización CI/CD

Integra `verificar-sistema.ps1` en tu pipeline:
```yaml
# Ejemplo GitHub Actions
- name: Verify System
  run: |
    powershell -ExecutionPolicy Bypass -File verificar-sistema.ps1
```

### 5. Tests Before Commit

Antes de hacer commit:
```powershell
# Verificación rápida
.\verificar-sistema.ps1 -Quick

# Si pasa, ejecutar tests
cd backend
npm test

# Si todo pasa, hacer commit
git add .
git commit -m "feat: nueva funcionalidad"
```

### 6. Monitoreo en Producción

En producción:
- Ejecutar verificación semanalmente
- Monitorear logs con `monitorear-logs.ps1 -Follow`
- Configurar alertas para errores críticos
- Revisar reporte HTML periódicamente

---

## Resumen de Comandos

```powershell
# Verificación completa
.\verificar-sistema.ps1

# Verificación rápida
.\verificar-sistema.ps1 -Quick

# Ver logs
.\ver-logs.ps1

# Monitorear en tiempo real
.\monitorear-logs.ps1 -Follow

# Solo errores
.\monitorear-logs.ps1 -Level error

# Tests backend
cd backend && npm test

# Tests con coverage
cd backend && npm test -- --coverage

# Iniciar sistema
.\iniciar.ps1

# Ver estado servicios
Get-Process node
Get-NetTCPConnection -LocalPort 9998,5174
```

---

## Contacto y Soporte

Si encuentras problemas no cubiertos en esta guía:
1. Revisa documentación en `docs/`
2. Busca en archivos `_*.txt` en la raíz
3. Revisa logs detallados
4. Consulta con el equipo de desarrollo

---

**Última actualización:** 2025-10-22  
**Versión del sistema:** 3.0.0  
**Autor:** DobackSoft Team

