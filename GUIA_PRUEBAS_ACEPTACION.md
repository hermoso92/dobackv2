# Guía de Pruebas de Aceptación - Dashboard StabilSafe V3

## 📋 Preparación

### Requisitos Previos
- ✅ Servicios corriendo (`.\iniciardev.ps1`)
- ✅ Navegador abierto en `http://localhost:5174`
- ✅ Usuario autenticado (login completado)
- ✅ Datos procesados en la base de datos

### Verificación Rápida
```powershell
# Ejecutar script de verificación
.\verificar-configuracion.ps1
```

---

## 🧪 Test 1: Estados & Tiempos

### Objetivo
Verificar que los KPIs de estados operativos se calculan correctamente y responden a filtros.

### Pasos

#### 1.1 Navegación Inicial
1. Ir al Dashboard principal
2. Verificar que estás en la pestaña **"Estados & Tiempos"**
3. Anotar si los KPIs muestran valores o están en 0

**✅ Resultado Esperado**: Se ve la cuadrícula de 16 KPIs

#### 1.2 Selección de Vehículo
1. En el filtro global superior, seleccionar **1 vehículo específico**
2. Seleccionar rango de fechas: **Últimos 7 días**
3. Esperar 2-3 segundos a que cargue

**✅ Resultado Esperado**: 
- KPIs se actualizan
- Al menos algunos KPIs muestran valores > 0 (ej: "Horas de Conducción", "Km Recorridos")

#### 1.3 Verificar Consistencia de Tiempos
1. Anotar los valores de:
   - Tiempo en Parque (Clave 1)
   - Tiempo Fuera Parque (suma de Claves 2+3+4+5)
   - Tiempo en Taller (Clave 0)
2. Sumar mentalmente los tiempos totales
3. Comparar con el período seleccionado (7 días = 168 horas)

**✅ Resultado Esperado**: 
- Suma de tiempos ≈ tiempo total del período (permitir ±10% de margen)
- Ningún KPI muestra "NaN" o valores negativos

#### 1.4 Probar Filtro de Rotativo
1. Activar filtro **"Rotativo: ON"**
2. Observar cambios en:
   - Tiempo Clave 2 (Salida en Emergencia)
   - % Rotativo
   - Horas de Conducción

**✅ Resultado Esperado**:
- Los valores disminuyen (solo muestra datos con rotativo ON)
- Tiempo Clave 2 > 0 si el vehículo tuvo emergencias
- % Rotativo cercano a 100%

#### 1.5 Cambiar Vehículo
1. Cambiar a otro vehículo diferente
2. Verificar que los KPIs se actualizan completamente

**✅ Resultado Esperado**:
- Valores cambian (no son los mismos que el vehículo anterior)
- Carga completa en < 3 segundos

### 📊 Criterios de Éxito
- [ ] KPIs muestran datos reales (no todos en 0)
- [ ] Filtro de vehículo afecta los resultados
- [ ] Filtro de fechas funciona correctamente
- [ ] Filtro de rotativo altera los valores
- [ ] Tiempos suman aproximadamente el período total
- [ ] Sin errores en consola de navegador

---

## 🗺️ Test 2: Puntos Negros (Heatmap + Clustering)

### Objetivo
Verificar que el mapa de calor muestra eventos de estabilidad con clustering y filtros funcionales.

### Pasos

#### 2.1 Navegación a Puntos Negros
1. Click en la pestaña **"Puntos Negros"**
2. Esperar a que cargue el mapa

**✅ Resultado Esperado**:
- Mapa TomTom se renderiza correctamente
- Se ven estadísticas en la parte superior (Total Clusters, Total Eventos, etc.)

#### 2.2 Selección Inicial
1. En filtros globales, seleccionar **"Todos los vehículos"**
2. Seleccionar rango: **Último mes**
3. En filtros de la pestaña:
   - Gravedad: **Todos**
   - Rotativo: **Todos**
   - Frecuencia Mínima: **5**
   - Radio Cluster: **20m**

**✅ Resultado Esperado**:
- Aparecen círculos/clusters en el mapa (si hay datos)
- Estadísticas muestran conteos > 0
- Ranking lateral muestra zonas críticas

#### 2.3 Probar Filtro de Frecuencia
1. Cambiar Frecuencia Mínima de **5 → 1**
2. Observar cambios en el mapa

**✅ Resultado Esperado**:
- Aumenta el número de puntos visibles en el mapa
- Contador de "Total Clusters" aumenta
- Aparecen más zonas en el ranking

#### 2.4 Probar Filtro de Severidad
1. Cambiar Gravedad a **"Grave"**
2. Observar cambios en el mapa y estadísticas

**✅ Resultado Esperado**:
- Solo aparecen puntos rojos (graves)
- Contador de eventos disminuye
- Estadísticas: "Moderadas" y "Leves" = 0

#### 2.5 Interacción con Ranking
1. En el panel lateral derecho (Ranking de Zonas Críticas)
2. Click en la **zona #1** (primera del ranking)

**✅ Resultado Esperado**:
- El mapa se centra en esa ubicación
- Zoom aumenta a nivel 15
- Se puede ver el cluster destacado

#### 2.6 Click en Cluster
1. Click en un cluster/círculo del mapa
2. Observar el popup que aparece

**✅ Resultado Esperado**:
- Popup muestra:
  - Ubicación
  - Total de eventos
  - Desglose por severidad (Graves, Moderadas, Leves)
  - Vehículos involucrados
  - Última ocurrencia

#### 2.7 Probar Filtro de Rotativo
1. Cambiar Rotativo a **"ON"**
2. Observar cambios

**✅ Resultado Esperado**:
- Clusters cambian (solo eventos con rotativo ON)
- Contadores se actualizan

### 📊 Criterios de Éxito
- [ ] Mapa se renderiza correctamente
- [ ] Clusters aparecen cuando hay múltiples vehículos
- [ ] Filtro de frecuencia afecta número de puntos
- [ ] Filtro de severidad muestra solo eventos del tipo seleccionado
- [ ] Click en ranking centra el mapa
- [ ] Popup de cluster muestra información detallada
- [ ] Colores de severidad son correctos (rojo=grave, naranja=moderada, amarillo=leve)
- [ ] Sin errores en consola

---

## 🚗 Test 3: Velocidad (Clasificación DGT)

### Objetivo
Verificar que las violaciones de velocidad se clasifican según DGT y se aplican límites especiales para bomberos Madrid.

### Pasos

#### 3.1 Navegación a Velocidad
1. Click en la pestaña **"Velocidad"**
2. Esperar a que cargue el mapa

**✅ Resultado Esperado**:
- Mapa TomTom se renderiza
- Estadísticas superiores muestran conteos
- Panel de información DGT visible abajo

#### 3.2 Configuración Inicial
1. Seleccionar **1 vehículo**
2. Rango: **Últimos 7 días**
3. Filtros de pestaña:
   - Rotativo: **OFF**
   - Ubicación: **Todos**
   - Clasificación: **Todos**
   - Tipo de vía: **Urbana**

**✅ Resultado Esperado**:
- Aparecen puntos en el mapa
- Estadísticas muestran:
  - Total
  - Graves (exceso >20 km/h)
  - Leves (exceso 1-20 km/h)
  - Correctos (dentro del límite)

#### 3.3 Verificar Clasificación DGT Urbana
1. Click en varios puntos del mapa
2. Verificar en los popups:
   - Velocidad
   - Límite DGT
   - Exceso
   - Clasificación

**✅ Resultado Esperado**:
- Límite urbano sin rotativo = **50 km/h**
- Graves: velocidad > 70 km/h
- Leves: velocidad 51-70 km/h
- Correctos: velocidad ≤ 50 km/h

#### 3.4 Probar Filtro Rotativo ON
1. Cambiar Rotativo a **"ON"**
2. Observar cambios en clasificación

**✅ Resultado Esperado**:
- **IMPORTANTE**: Límite urbano con rotativo emergencia = **80 km/h**
- Número de violaciones graves disminuye
- Solo se consideran graves las velocidades > 100 km/h (80 + 20)

#### 3.5 Cambiar Tipo de Vía
1. Cambiar Tipo de vía a **"Autopista"**
2. Mantener Rotativo **"ON"**
3. Observar cambios

**✅ Resultado Esperado**:
- Límite autopista con rotativo = **140 km/h**
- Clasificación de eventos cambia según nuevo límite
- Graves: solo velocidades > 160 km/h

#### 3.6 Verificar Estadísticas
1. Sumar mentalmente: Total = Graves + Leves + Correctos
2. Verificar que "Exceso Promedio" tiene sentido

**✅ Resultado Esperado**:
- Suma de estadísticas cuadra con el total
- Exceso promedio es un número razonable (0-30 km/h típicamente)
- "Con Rotativo" + "Sin Rotativo" no necesariamente suma el total (pueden no tener dato de rotativo)

#### 3.7 Panel de Información DGT
1. Scroll hasta el panel azul de "Límites de Velocidad según DGT"
2. Verificar que muestra:
   - Límites urbanos: 50 km/h (bomberos), 20 km/h (dentro parque)
   - Límites interurbanos: 90 km/h → 120 km/h con rotativo
   - Límites autopista: 120 km/h → 140 km/h con rotativo
   - Clasificación: Leve (1-20 km/h), Grave (>20 km/h)

**✅ Resultado Esperado**:
- Panel visible y legible
- Información clara y correcta

### 📊 Criterios de Éxito
- [ ] Mapa muestra violaciones de velocidad
- [ ] Clasificación DGT correcta (leve/grave)
- [ ] Límite urbano = 50 km/h sin rotativo
- [ ] Límite urbano emergencia = 80 km/h con rotativo
- [ ] Límite autopista = 140 km/h con rotativo ON
- [ ] Filtros afectan la clasificación correctamente
- [ ] Estadísticas cuadran con visualización
- [ ] Panel informativo DGT visible
- [ ] Sin errores en consola

---

## 🔍 Test Adicional: Panel de Diagnóstico

### Objetivo
Verificar que el panel de diagnóstico muestra información correcta del sistema.

### Pasos

#### 4.1 Abrir Panel
1. En cualquier pestaña del Dashboard
2. Click en el botón **"⚙️ Diagnóstico"** en el header

**✅ Resultado Esperado**:
- Panel desplegable aparece
- Muestra 5 indicadores con íconos de estado

#### 4.2 Verificar Indicadores
1. **Geocercas cargadas**:
   - ✅ Verde si > 5 activas
   - ⚠️ Amarillo si 1-4 activas
   - ❌ Rojo si 0 activas

2. **Eventos sin GPS**:
   - ✅ Verde si >95% tienen GPS
   - ⚠️ Amarillo si 80-95% tienen GPS
   - ❌ Rojo si <80% tienen GPS

3. **Sesiones sin rotativo**:
   - Similar a eventos GPS

4. **Catálogo de velocidad**:
   - ✅ Verde si disponible

5. **Configuración del sistema**:
   - Muestra última carga
   - Zona horaria: Europe/Madrid

#### 4.3 Recargar Datos
1. Click en botón **"🔄 Recargar Diagnóstico"**
2. Esperar 1-2 segundos

**✅ Resultado Esperado**:
- Indicadores se actualizan
- Sin errores en consola

### 📊 Criterios de Éxito
- [ ] Panel se abre/cierra correctamente
- [ ] 5 indicadores visibles
- [ ] Íconos de estado apropiados (✅/⚠️/❌)
- [ ] Contadores tienen sentido
- [ ] Botón de recarga funciona
- [ ] Sin errores en consola

---

## 📄 Test Adicional: Exportación PDF

### Objetivo
Verificar que la exportación PDF incluye los filtros aplicados.

### Pasos

1. En cualquier pestaña (ej: Estados & Tiempos)
2. Aplicar filtros:
   - Vehículo específico
   - Rango de fechas
   - Rotativo ON
3. Click en botón **"EXPORTAR PDF"**
4. Esperar a que se descargue

**✅ Resultado Esperado**:
- PDF se descarga correctamente
- Al abrir, muestra:
  - Nombre de la pestaña
  - **Filtros Aplicados** (vehículos, fechas, rotativo, severidad)
  - KPIs con valores
  - Si hay mapa, captura del mapa

### 📊 Criterios de Éxito
- [ ] PDF se genera sin errores
- [ ] Incluye sección "Filtros Aplicados"
- [ ] Filtros mostrados coinciden con los seleccionados
- [ ] KPIs visibles en el PDF

---

## 📝 Registro de Resultados

### Formato de Reporte

```markdown
## Resultados de Pruebas - [FECHA]

### Test 1: Estados & Tiempos
- ✅/❌ KPIs muestran datos reales
- ✅/❌ Filtros funcionan correctamente
- ✅/❌ Tiempos suman el período
- Observaciones: _____________________

### Test 2: Puntos Negros
- ✅/❌ Mapa renderiza correctamente
- ✅/❌ Clustering funciona
- ✅/❌ Filtros de severidad operativos
- Observaciones: _____________________

### Test 3: Velocidad
- ✅/❌ Clasificación DGT correcta
- ✅/❌ Límites bomberos Madrid aplicados
- ✅/❌ Filtros de rotativo funcionan
- Observaciones: _____________________

### Test 4: Panel de Diagnóstico
- ✅/❌ Panel funcional
- Observaciones: _____________________

### Test 5: Exportación PDF
- ✅/❌ PDF incluye filtros
- Observaciones: _____________________
```

---

## 🐛 Solución de Problemas Comunes

### Problema: "No hay datos"
**Solución**: 
1. Verificar que hay sesiones procesadas en BD
2. Ejecutar script de auditoría SQL
3. Cambiar rango de fechas a "Todo el período"

### Problema: Mapa no carga
**Solución**:
1. Verificar clave TomTom en `.env`
2. Revisar consola del navegador (F12)
3. Verificar conexión a internet

### Problema: "500 Internal Server Error"
**Solución**:
1. Revisar logs de backend
2. Verificar que PostgreSQL está corriendo
3. Regenerar Prisma Client: `cd backend/src && npx prisma generate`

### Problema: Filtros no afectan resultados
**Solución**:
1. Verificar que endpoints reciben parámetros (Network tab)
2. Revisar logs de backend para ver filtros aplicados
3. Verificar que organizationId está en los headers

---

## ✅ Checklist Final

Antes de reportar las pruebas como completadas:

- [ ] Test 1 ejecutado completamente
- [ ] Test 2 ejecutado completamente
- [ ] Test 3 ejecutado completamente
- [ ] Test 4 (Diagnóstico) ejecutado
- [ ] Test 5 (PDF) ejecutado
- [ ] Screenshots capturados de cada pestaña
- [ ] Errores documentados (si los hay)
- [ ] Resultados registrados en formato markdown
- [ ] Todo funciona sin errores críticos

---

**Fecha de Creación**: {{CURRENT_DATE}}  
**Versión**: StabilSafe V3 - Dashboard Activation Tests  
**Autor**: Sistema de Implementación Automatizado

