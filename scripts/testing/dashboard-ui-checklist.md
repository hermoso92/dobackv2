# Dashboard UI Validation Checklist - StabilSafe V3

**Fecha:** _________________  
**Auditor:** _________________  
**Versión:** StabilSafe V3  
**URL Dashboard:** http://localhost:5174/dashboard

---

## Preparación

- [ ] Backend corriendo en puerto 9998
- [ ] Frontend corriendo en puerto 5174
- [ ] Usuario autenticado (test@bomberosmadrid.es / admin123)
- [ ] Navegador con DevTools abierto (F12)
- [ ] Datos procesados disponibles en base de datos

---

## 1. Regla StabilSafe V2: Sin Scroll en Contenedor Principal

### 1.1 Inspección Visual

- [ ] Abrir `http://localhost:5174/dashboard`
- [ ] Verificar que NO hay barra de scroll vertical en el contenedor principal
- [ ] Verificar que todo el contenido es visible sin necesidad de scroll
- [ ] Viewport de prueba: 1920x1080 (desktop estándar)

### 1.2 Inspección con DevTools

- [ ] Abrir DevTools (F12) → Elements
- [ ] Inspeccionar elemento contenedor principal (clase: `app-layout` o `main-content`)
- [ ] Verificar CSS: `overflow-y` NO debe ser `auto` o `scroll`
- [ ] Capturar screenshot del CSS inspeccionado

**Resultado:**
- ✅ PASS: Sin `overflow-y: auto` en contenedor principal
- ❌ FAIL: Detectado `overflow-y: auto` en contenedor principal

**Evidencia (screenshot):**  
_Adjuntar captura de DevTools mostrando CSS del contenedor_

---

### 1.3 Scroll en Listas Internas (PERMITIDO)

- [ ] Verificar que rankings/tablas internas SÍ tienen scroll
- [ ] Ejemplo: Lista de "Top 10 Puntos Negros" debe tener scroll si tiene >10 items
- [ ] Ejemplo: Tabla de sesiones debe tener scroll interno

**Resultado:**
- ✅ PASS: Listas internas tienen scroll controlado
- ❌ FAIL: Listas internas no tienen scroll o afectan al contenedor principal

---

## 2. Carga de Pestañas del Dashboard

### 2.1 Pestaña: Estados & Tiempos

- [ ] Click en pestaña "Estados & Tiempos"
- [ ] Verificar que se muestra grid de KPIs (4 columnas x 4 filas = 16 KPIs)
- [ ] Verificar que los valores NO son todos 0 o NaN
- [ ] Capturar screenshot de la pestaña completa

**KPIs visibles:**
- [ ] Tiempo en Parque (Clave 1)
- [ ] Tiempo Fuera Parque (Claves 2+3+4+5)
- [ ] Horas de Conducción
- [ ] Kilómetros Recorridos
- [ ] % Rotativo
- [ ] Otros KPIs operacionales

**Errores de consola:**
- ✅ Sin errores
- ❌ Errores encontrados: _________________

---

### 2.2 Pestaña: Puntos Negros

- [ ] Click en pestaña "Puntos Negros"
- [ ] Verificar que el mapa TomTom se renderiza correctamente
- [ ] Verificar estadísticas en la parte superior:
  - [ ] Total Clusters
  - [ ] Total Eventos
  - [ ] Clustering Level
- [ ] Verificar que se muestran marcadores en el mapa
- [ ] Probar zoom in/out
- [ ] Probar click en cluster → debe mostrar detalles

**Errores de consola:**
- ✅ Sin errores
- ❌ Errores encontrados: _________________

---

### 2.3 Pestaña: Velocidad

- [ ] Click en pestaña "Velocidad"
- [ ] Verificar que se muestra gráfico de velocidad
- [ ] Verificar lista de violaciones de velocidad
- [ ] Verificar estadísticas:
  - [ ] Velocidad promedio
  - [ ] Velocidad máxima
  - [ ] Total de excesos
- [ ] Probar filtro por tipo de exceso (leve/grave)

**Errores de consola:**
- ✅ Sin errores
- ❌ Errores encontrados: _________________

---

### 2.4 Pestaña: Sesiones y Rutas

- [ ] Click en pestaña "Sesiones"
- [ ] Verificar que se muestra tabla de sesiones
- [ ] Verificar columnas:
  - [ ] Vehicle ID
  - [ ] Session ID
  - [ ] Fecha
  - [ ] Duración
  - [ ] Distancia
- [ ] Click en una sesión → debe mostrar mapa de ruta
- [ ] Verificar que la ruta se visualiza correctamente

**Errores de consola:**
- ✅ Sin errores
- ❌ Errores encontrados: _________________

---

### 2.5 Pestaña: Reportes

- [ ] Click en pestaña "Reportes"
- [ ] Verificar que se muestran botones de exportación
- [ ] Verificar tipos de reporte disponibles:
  - [ ] Reporte de Estados
  - [ ] Reporte de Estabilidad
  - [ ] Reporte de Velocidad
  - [ ] Reporte Completo

**Errores de consola:**
- ✅ Sin errores
- ❌ Errores encontrados: _________________

---

## 3. Interacciones de Filtros Globales

### 3.1 Filtro de Vehículo

- [ ] Seleccionar un vehículo específico en GlobalFiltersBar
- [ ] Verificar que TODOS los KPIs se actualizan
- [ ] Verificar que el tiempo de carga es < 3 segundos
- [ ] Cambiar a otro vehículo diferente
- [ ] Verificar que los valores cambian (no son idénticos al anterior)

**Resultado:**
- ✅ PASS: Filtro funciona correctamente
- ❌ FAIL: Filtro no afecta los datos o tarda mucho

---

### 3.2 Filtro de Rango de Fechas

- [ ] Seleccionar rango: "Últimos 7 días"
- [ ] Verificar que los datos se actualizan
- [ ] Cambiar a "Últimos 30 días"
- [ ] Verificar que los valores cambian (más datos)

**Resultado:**
- ✅ PASS: Filtro de fechas funciona correctamente
- ❌ FAIL: Filtro no afecta los datos

---

### 3.3 Filtro de Rotativo

- [ ] Activar filtro "Rotativo: ON"
- [ ] Verificar que estos KPIs disminuyen:
  - [ ] Horas de Conducción (solo cuenta con rotativo ON)
  - [ ] Tiempo Clave 2 (Salida en Emergencia)
- [ ] Verificar que "% Rotativo" ≈ 100%
- [ ] Desactivar filtro "Rotativo: OFF"
- [ ] Verificar que los valores vuelven a valores originales

**Resultado:**
- ✅ PASS: Filtro rotativo funciona correctamente
- ❌ FAIL: Filtro no afecta los datos

---

### 3.4 Limpiar Filtros

- [ ] Click en botón "Limpiar filtros"
- [ ] Verificar que todos los filtros vuelven a estado inicial
- [ ] Verificar que los datos vuelven a mostrar "Todos los vehículos"

**Resultado:**
- ✅ PASS: Limpiar filtros funciona
- ❌ FAIL: No limpia correctamente

---

## 4. Exportaciones PDF

### 4.1 Exportar PDF - Estados & Tiempos

- [ ] Ir a pestaña "Estados & Tiempos"
- [ ] Click en botón "Exportar PDF"
- [ ] Verificar que se descarga un archivo PDF
- [ ] Abrir PDF y verificar contenido:
  - [ ] Grid de KPIs visible
  - [ ] Valores correctos
  - [ ] Fecha y filtros aplicados en el PDF

**Resultado:**
- ✅ PASS: PDF generado correctamente
- ❌ FAIL: Error en generación o contenido incorrecto

---

### 4.2 Exportar PDF - Puntos Negros

- [ ] Ir a pestaña "Puntos Negros"
- [ ] Click en botón "Exportar PDF"
- [ ] Verificar que se descarga un archivo PDF
- [ ] Abrir PDF y verificar contenido:
  - [ ] Mapa de calor visible
  - [ ] Ranking de puntos negros
  - [ ] Estadísticas de clusters

**Resultado:**
- ✅ PASS: PDF generado correctamente
- ❌ FAIL: Error en generación o contenido incorrecto

---

### 4.3 Exportar PDF - Velocidad

- [ ] Ir a pestaña "Velocidad"
- [ ] Click en botón "Exportar PDF"
- [ ] Verificar que se descarga un archivo PDF
- [ ] Abrir PDF y verificar contenido:
  - [ ] Gráfico de velocidad
  - [ ] Lista de violaciones
  - [ ] Estadísticas

**Resultado:**
- ✅ PASS: PDF generado correctamente
- ❌ FAIL: Error en generación o contenido incorrecto

---

## 5. Rendimiento y UX

### 5.1 Tiempos de Carga

- [ ] Carga inicial del dashboard: _________ segundos (esperado: < 3s)
- [ ] Cambio de pestaña: _________ segundos (esperado: < 1s)
- [ ] Aplicar filtro: _________ segundos (esperado: < 3s)
- [ ] Generar PDF: _________ segundos (esperado: < 5s)

**Resultado:**
- ✅ PASS: Todos los tiempos dentro del threshold
- ❌ FAIL: Algún tiempo excede el threshold

---

### 5.2 Responsividad

- [ ] Probar en resolución 1920x1080 (desktop)
- [ ] Probar en resolución 1366x768 (laptop)
- [ ] Verificar que el layout se adapta correctamente
- [ ] Verificar que NO hay elementos cortados o superpuestos

**Resultado:**
- ✅ PASS: Dashboard responsivo
- ❌ FAIL: Problemas de layout en alguna resolución

---

## 6. Errores de Consola

### 6.1 Revisar Consola del Navegador

- [ ] Abrir DevTools → Console
- [ ] Navegar por todas las pestañas del dashboard
- [ ] Anotar todos los errores/warnings encontrados:

**Errores encontrados:**
```
_____________________________________
_____________________________________
_____________________________________
```

**Resultado:**
- ✅ PASS: Sin errores críticos (solo warnings aceptables)
- ❌ FAIL: Errores críticos encontrados

---

## 7. Comparador de Estabilidad

### 7.1 Acceso al Comparador

- [ ] Navegar a módulo de comparación (si existe en menú)
- [ ] O verificar si está integrado en pestaña "Puntos Negros"

### 7.2 Comparación entre Vehículos

- [ ] Seleccionar Vehículo A
- [ ] Seleccionar Vehículo B
- [ ] Click en "Comparar"
- [ ] Verificar que se muestran métricas comparativas:
  - [ ] Delta % de incidencias
  - [ ] Tendencias (mejor/peor)
  - [ ] Gráfico comparativo

**Resultado:**
- ✅ PASS: Comparador funciona correctamente
- ⚠️  N/A: Comparador no disponible en esta versión
- ❌ FAIL: Errores en comparación

---

## RESUMEN FINAL

### Estadísticas

- **Total de pruebas:** _____
- **Exitosas (✅):** _____
- **Fallidas (❌):** _____
- **N/A (⚠️):** _____

### Tasa de Éxito

- **Tasa de éxito:** _____ %

### Evaluación Global

- [ ] ✅ APROBADO: Dashboard cumple con todos los criterios StabilSafe V2
- [ ] ⚠️  APROBADO CON RESERVAS: Algunos issues menores encontrados
- [ ] ❌ NO APROBADO: Issues críticos que requieren corrección

### Issues Críticos Encontrados

1. _____________________________________
2. _____________________________________
3. _____________________________________

### Recomendaciones

_____________________________________
_____________________________________
_____________________________________

---

**Firma del Auditor:** _________________  
**Fecha:** _________________



**Fecha:** _________________  
**Auditor:** _________________  
**Versión:** StabilSafe V3  
**URL Dashboard:** http://localhost:5174/dashboard

---

## Preparación

- [ ] Backend corriendo en puerto 9998
- [ ] Frontend corriendo en puerto 5174
- [ ] Usuario autenticado (test@bomberosmadrid.es / admin123)
- [ ] Navegador con DevTools abierto (F12)
- [ ] Datos procesados disponibles en base de datos

---

## 1. Regla StabilSafe V2: Sin Scroll en Contenedor Principal

### 1.1 Inspección Visual

- [ ] Abrir `http://localhost:5174/dashboard`
- [ ] Verificar que NO hay barra de scroll vertical en el contenedor principal
- [ ] Verificar que todo el contenido es visible sin necesidad de scroll
- [ ] Viewport de prueba: 1920x1080 (desktop estándar)

### 1.2 Inspección con DevTools

- [ ] Abrir DevTools (F12) → Elements
- [ ] Inspeccionar elemento contenedor principal (clase: `app-layout` o `main-content`)
- [ ] Verificar CSS: `overflow-y` NO debe ser `auto` o `scroll`
- [ ] Capturar screenshot del CSS inspeccionado

**Resultado:**
- ✅ PASS: Sin `overflow-y: auto` en contenedor principal
- ❌ FAIL: Detectado `overflow-y: auto` en contenedor principal

**Evidencia (screenshot):**  
_Adjuntar captura de DevTools mostrando CSS del contenedor_

---

### 1.3 Scroll en Listas Internas (PERMITIDO)

- [ ] Verificar que rankings/tablas internas SÍ tienen scroll
- [ ] Ejemplo: Lista de "Top 10 Puntos Negros" debe tener scroll si tiene >10 items
- [ ] Ejemplo: Tabla de sesiones debe tener scroll interno

**Resultado:**
- ✅ PASS: Listas internas tienen scroll controlado
- ❌ FAIL: Listas internas no tienen scroll o afectan al contenedor principal

---

## 2. Carga de Pestañas del Dashboard

### 2.1 Pestaña: Estados & Tiempos

- [ ] Click en pestaña "Estados & Tiempos"
- [ ] Verificar que se muestra grid de KPIs (4 columnas x 4 filas = 16 KPIs)
- [ ] Verificar que los valores NO son todos 0 o NaN
- [ ] Capturar screenshot de la pestaña completa

**KPIs visibles:**
- [ ] Tiempo en Parque (Clave 1)
- [ ] Tiempo Fuera Parque (Claves 2+3+4+5)
- [ ] Horas de Conducción
- [ ] Kilómetros Recorridos
- [ ] % Rotativo
- [ ] Otros KPIs operacionales

**Errores de consola:**
- ✅ Sin errores
- ❌ Errores encontrados: _________________

---

### 2.2 Pestaña: Puntos Negros

- [ ] Click en pestaña "Puntos Negros"
- [ ] Verificar que el mapa TomTom se renderiza correctamente
- [ ] Verificar estadísticas en la parte superior:
  - [ ] Total Clusters
  - [ ] Total Eventos
  - [ ] Clustering Level
- [ ] Verificar que se muestran marcadores en el mapa
- [ ] Probar zoom in/out
- [ ] Probar click en cluster → debe mostrar detalles

**Errores de consola:**
- ✅ Sin errores
- ❌ Errores encontrados: _________________

---

### 2.3 Pestaña: Velocidad

- [ ] Click en pestaña "Velocidad"
- [ ] Verificar que se muestra gráfico de velocidad
- [ ] Verificar lista de violaciones de velocidad
- [ ] Verificar estadísticas:
  - [ ] Velocidad promedio
  - [ ] Velocidad máxima
  - [ ] Total de excesos
- [ ] Probar filtro por tipo de exceso (leve/grave)

**Errores de consola:**
- ✅ Sin errores
- ❌ Errores encontrados: _________________

---

### 2.4 Pestaña: Sesiones y Rutas

- [ ] Click en pestaña "Sesiones"
- [ ] Verificar que se muestra tabla de sesiones
- [ ] Verificar columnas:
  - [ ] Vehicle ID
  - [ ] Session ID
  - [ ] Fecha
  - [ ] Duración
  - [ ] Distancia
- [ ] Click en una sesión → debe mostrar mapa de ruta
- [ ] Verificar que la ruta se visualiza correctamente

**Errores de consola:**
- ✅ Sin errores
- ❌ Errores encontrados: _________________

---

### 2.5 Pestaña: Reportes

- [ ] Click en pestaña "Reportes"
- [ ] Verificar que se muestran botones de exportación
- [ ] Verificar tipos de reporte disponibles:
  - [ ] Reporte de Estados
  - [ ] Reporte de Estabilidad
  - [ ] Reporte de Velocidad
  - [ ] Reporte Completo

**Errores de consola:**
- ✅ Sin errores
- ❌ Errores encontrados: _________________

---

## 3. Interacciones de Filtros Globales

### 3.1 Filtro de Vehículo

- [ ] Seleccionar un vehículo específico en GlobalFiltersBar
- [ ] Verificar que TODOS los KPIs se actualizan
- [ ] Verificar que el tiempo de carga es < 3 segundos
- [ ] Cambiar a otro vehículo diferente
- [ ] Verificar que los valores cambian (no son idénticos al anterior)

**Resultado:**
- ✅ PASS: Filtro funciona correctamente
- ❌ FAIL: Filtro no afecta los datos o tarda mucho

---

### 3.2 Filtro de Rango de Fechas

- [ ] Seleccionar rango: "Últimos 7 días"
- [ ] Verificar que los datos se actualizan
- [ ] Cambiar a "Últimos 30 días"
- [ ] Verificar que los valores cambian (más datos)

**Resultado:**
- ✅ PASS: Filtro de fechas funciona correctamente
- ❌ FAIL: Filtro no afecta los datos

---

### 3.3 Filtro de Rotativo

- [ ] Activar filtro "Rotativo: ON"
- [ ] Verificar que estos KPIs disminuyen:
  - [ ] Horas de Conducción (solo cuenta con rotativo ON)
  - [ ] Tiempo Clave 2 (Salida en Emergencia)
- [ ] Verificar que "% Rotativo" ≈ 100%
- [ ] Desactivar filtro "Rotativo: OFF"
- [ ] Verificar que los valores vuelven a valores originales

**Resultado:**
- ✅ PASS: Filtro rotativo funciona correctamente
- ❌ FAIL: Filtro no afecta los datos

---

### 3.4 Limpiar Filtros

- [ ] Click en botón "Limpiar filtros"
- [ ] Verificar que todos los filtros vuelven a estado inicial
- [ ] Verificar que los datos vuelven a mostrar "Todos los vehículos"

**Resultado:**
- ✅ PASS: Limpiar filtros funciona
- ❌ FAIL: No limpia correctamente

---

## 4. Exportaciones PDF

### 4.1 Exportar PDF - Estados & Tiempos

- [ ] Ir a pestaña "Estados & Tiempos"
- [ ] Click en botón "Exportar PDF"
- [ ] Verificar que se descarga un archivo PDF
- [ ] Abrir PDF y verificar contenido:
  - [ ] Grid de KPIs visible
  - [ ] Valores correctos
  - [ ] Fecha y filtros aplicados en el PDF

**Resultado:**
- ✅ PASS: PDF generado correctamente
- ❌ FAIL: Error en generación o contenido incorrecto

---

### 4.2 Exportar PDF - Puntos Negros

- [ ] Ir a pestaña "Puntos Negros"
- [ ] Click en botón "Exportar PDF"
- [ ] Verificar que se descarga un archivo PDF
- [ ] Abrir PDF y verificar contenido:
  - [ ] Mapa de calor visible
  - [ ] Ranking de puntos negros
  - [ ] Estadísticas de clusters

**Resultado:**
- ✅ PASS: PDF generado correctamente
- ❌ FAIL: Error en generación o contenido incorrecto

---

### 4.3 Exportar PDF - Velocidad

- [ ] Ir a pestaña "Velocidad"
- [ ] Click en botón "Exportar PDF"
- [ ] Verificar que se descarga un archivo PDF
- [ ] Abrir PDF y verificar contenido:
  - [ ] Gráfico de velocidad
  - [ ] Lista de violaciones
  - [ ] Estadísticas

**Resultado:**
- ✅ PASS: PDF generado correctamente
- ❌ FAIL: Error en generación o contenido incorrecto

---

## 5. Rendimiento y UX

### 5.1 Tiempos de Carga

- [ ] Carga inicial del dashboard: _________ segundos (esperado: < 3s)
- [ ] Cambio de pestaña: _________ segundos (esperado: < 1s)
- [ ] Aplicar filtro: _________ segundos (esperado: < 3s)
- [ ] Generar PDF: _________ segundos (esperado: < 5s)

**Resultado:**
- ✅ PASS: Todos los tiempos dentro del threshold
- ❌ FAIL: Algún tiempo excede el threshold

---

### 5.2 Responsividad

- [ ] Probar en resolución 1920x1080 (desktop)
- [ ] Probar en resolución 1366x768 (laptop)
- [ ] Verificar que el layout se adapta correctamente
- [ ] Verificar que NO hay elementos cortados o superpuestos

**Resultado:**
- ✅ PASS: Dashboard responsivo
- ❌ FAIL: Problemas de layout en alguna resolución

---

## 6. Errores de Consola

### 6.1 Revisar Consola del Navegador

- [ ] Abrir DevTools → Console
- [ ] Navegar por todas las pestañas del dashboard
- [ ] Anotar todos los errores/warnings encontrados:

**Errores encontrados:**
```
_____________________________________
_____________________________________
_____________________________________
```

**Resultado:**
- ✅ PASS: Sin errores críticos (solo warnings aceptables)
- ❌ FAIL: Errores críticos encontrados

---

## 7. Comparador de Estabilidad

### 7.1 Acceso al Comparador

- [ ] Navegar a módulo de comparación (si existe en menú)
- [ ] O verificar si está integrado en pestaña "Puntos Negros"

### 7.2 Comparación entre Vehículos

- [ ] Seleccionar Vehículo A
- [ ] Seleccionar Vehículo B
- [ ] Click en "Comparar"
- [ ] Verificar que se muestran métricas comparativas:
  - [ ] Delta % de incidencias
  - [ ] Tendencias (mejor/peor)
  - [ ] Gráfico comparativo

**Resultado:**
- ✅ PASS: Comparador funciona correctamente
- ⚠️  N/A: Comparador no disponible en esta versión
- ❌ FAIL: Errores en comparación

---

## RESUMEN FINAL

### Estadísticas

- **Total de pruebas:** _____
- **Exitosas (✅):** _____
- **Fallidas (❌):** _____
- **N/A (⚠️):** _____

### Tasa de Éxito

- **Tasa de éxito:** _____ %

### Evaluación Global

- [ ] ✅ APROBADO: Dashboard cumple con todos los criterios StabilSafe V2
- [ ] ⚠️  APROBADO CON RESERVAS: Algunos issues menores encontrados
- [ ] ❌ NO APROBADO: Issues críticos que requieren corrección

### Issues Críticos Encontrados

1. _____________________________________
2. _____________________________________
3. _____________________________________

### Recomendaciones

_____________________________________
_____________________________________
_____________________________________

---

**Firma del Auditor:** _________________  
**Fecha:** _________________

