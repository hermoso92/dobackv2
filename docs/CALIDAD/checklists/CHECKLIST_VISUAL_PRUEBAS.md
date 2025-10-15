# ✅ Checklist Visual de Pruebas - Dashboard V3

## 🎯 Objetivo
Verificar visualmente que las 3 pestañas críticas funcionan con datos reales.

**Tiempo total**: 10-15 minutos  
**Pre-requisito**: Servicios corriendo (`.\iniciardev.ps1`)

---

## 📋 Verificación Paso a Paso

### ✅ INICIO
```powershell
# 1. Verificar configuración
.\verificar-configuracion.ps1

# 2. Si necesario, iniciar servicios
.\iniciardev.ps1

# 3. Abrir navegador
start http://localhost:5174
```

---

### 🔐 LOGIN
- [ ] Página de login carga correctamente
- [ ] Login exitoso con credenciales
- [ ] Redirección al Dashboard

---

### 📊 PESTAÑA 1: Estados & Tiempos

**Navegación**: Dashboard → Estados & Tiempos (primera pestaña)

#### Verificación Visual:
- [ ] Se ven 16 tarjetas KPI (cuadrícula 4x4)
- [ ] **Al menos 3 KPIs** muestran valores > 0 (ej: Horas, Km, Tiempo Parque)
- [ ] No hay "NaN" o "undefined" en ninguna tarjeta

#### Probar Filtros:
- [ ] Seleccionar 1 vehículo → Los valores cambian
- [ ] Cambiar rango de fechas → Los valores se actualizan
- [ ] Activar "Rotativo ON" → Los valores disminuyen

#### Consola (F12):
- [ ] Sin errores rojos

**✅ RESULTADO**: Estados & Tiempos FUNCIONAL | ❌ Hay problemas

---

### 🗺️ PESTAÑA 2: Puntos Negros

**Navegación**: Dashboard → Puntos Negros (segunda pestaña)

#### Verificación Visual:
- [ ] Mapa TomTom se renderiza (no pantalla gris)
- [ ] Estadísticas superiores: Total Clusters, Total Eventos, Graves, Moderadas, Leves
- [ ] Al menos 1 de estos números es > 0
- [ ] Panel lateral "Ranking de Zonas Críticas" visible

#### Verificación de Mapa:
- [ ] Si hay datos: Se ven círculos de colores (rojo/naranja/amarillo)
- [ ] Si no hay círculos: Cambiar "Frecuencia Mínima" a 1
- [ ] Click en un círculo → Aparece popup con detalles

#### Probar Filtros:
- [ ] Cambiar "Gravedad" a "Grave" → Solo puntos rojos
- [ ] Cambiar "Rotativo" a "ON" → Los números cambian
- [ ] Mover slider "Frecuencia Mínima" → Número de puntos cambia

#### Consola (F12):
- [ ] Sin errores rojos
- [ ] Request a `/api/hotspots/critical-points` retorna 200

**✅ RESULTADO**: Puntos Negros FUNCIONAL | ❌ Hay problemas

---

### 🚗 PESTAÑA 3: Velocidad

**Navegación**: Dashboard → Velocidad (tercera pestaña)

#### Verificación Visual:
- [ ] Mapa TomTom se renderiza
- [ ] Estadísticas superiores: Total, Graves, Leves, Correctos, Con Rotativo, Exceso Promedio
- [ ] Al menos 1 número es > 0
- [ ] Panel inferior azul "Límites de Velocidad según DGT" visible

#### Verificación de Mapa:
- [ ] Si hay datos: Se ven puntos de colores (rojo/amarillo/azul)
- [ ] Click en un punto → Popup con velocidad, límite, exceso, clasificación
- [ ] Panel lateral "Ranking de Tramos con Excesos" visible

#### Probar Clasificación DGT:
- [ ] En popup, verificar que:
  - Velocidad > Límite + 20 → Clasificación "GRAVE"
  - Velocidad > Límite pero ≤ Límite + 20 → Clasificación "LEVE"
  - Velocidad ≤ Límite → Clasificación "CORRECTO"

#### Probar Límites Bomberos Madrid:
- [ ] Rotativo OFF + Urbana → Límite = 50 km/h
- [ ] Rotativo ON + Urbana → Límite = 80 km/h (emergencia)
- [ ] Rotativo ON + Autopista → Límite = 140 km/h
- [ ] Dentro parque → Límite = 20 km/h

#### Consola (F12):
- [ ] Sin errores rojos
- [ ] Request a `/api/speed/violations` retorna 200

**✅ RESULTADO**: Velocidad FUNCIONAL | ❌ Hay problemas

---

### ⚙️ EXTRA: Panel de Diagnóstico

**Navegación**: Cualquier pestaña → Click en "⚙️ Diagnóstico" (header)

#### Verificación:
- [ ] Panel desplegable aparece
- [ ] Se ven 5 indicadores:
  1. ✅/⚠️/❌ Geocercas cargadas
  2. ✅/⚠️/❌ Eventos sin GPS
  3. ✅/⚠️/❌ Sesiones sin rotativo
  4. ✅/⚠️/❌ Catálogo de velocidad
  5. ℹ️ Configuración del sistema
- [ ] Cada indicador muestra números
- [ ] Botón "🔄 Recargar Diagnóstico" funciona

#### Consola (F12):
- [ ] Request a `/api/diagnostics/dashboard` retorna 200

**✅ RESULTADO**: Diagnóstico FUNCIONAL | ❌ Hay problemas

---

### 📄 EXTRA: Exportación PDF

**Navegación**: Cualquier pestaña → Click "EXPORTAR PDF" (botón superior derecho)

#### Verificación:
- [ ] Botón cambia a "GENERANDO..."
- [ ] Después de 2-5 segundos, archivo PDF se descarga
- [ ] Abrir PDF descargado
- [ ] PDF contiene:
  - [ ] Nombre de la pestaña
  - [ ] Sección "Filtros Aplicados"
  - [ ] KPIs con valores
  - [ ] (Si es Puntos Negros o Velocidad) Imagen del mapa

**✅ RESULTADO**: PDF FUNCIONAL | ❌ Hay problemas

---

## 📊 Resumen de Resultados

Al finalizar, completar esta tabla:

| Componente | Estado | Observaciones |
|------------|--------|---------------|
| Estados & Tiempos | ✅ / ❌ | ____________ |
| Puntos Negros | ✅ / ❌ | ____________ |
| Velocidad | ✅ / ❌ | ____________ |
| Panel Diagnóstico | ✅ / ❌ | ____________ |
| Exportación PDF | ✅ / ❌ | ____________ |

**Total Funcionales**: ___ de 5

---

## 🎯 Criterio de Éxito

**Mínimo aceptable**: 3 de 5 componentes funcionales (las 3 pestañas críticas)

**Ideal**: 5 de 5 componentes funcionales

---

## 🐛 Si Algo Falla

### Problema Común 1: "No hay datos"
**Solución rápida**:
1. Cambiar filtro de fechas a "Todo el período"
2. Seleccionar "Todos los vehículos"
3. Si aún no hay datos, ejecutar script de auditoría SQL

### Problema Común 2: Mapas grises
**Solución rápida**:
1. Verificar que `.env` tiene `REACT_APP_TOMTOM_API_KEY`
2. Verificar conexión a internet
3. Revisar consola del navegador (F12)

### Problema Común 3: Error 500
**Solución rápida**:
```powershell
# Regenerar Prisma Client
cd backend\src
npx prisma generate
cd ..\..

# Reiniciar servicios
.\iniciardev.ps1
```

---

## ⏱️ Tiempo por Verificación

- Estados & Tiempos: **3 minutos**
- Puntos Negros: **4 minutos**
- Velocidad: **4 minutos**
- Panel Diagnóstico: **2 minutos**
- Exportación PDF: **2 minutos**

**TOTAL**: 15 minutos para verificación completa

---

**Siguiente paso**: Ejecutar verificaciones en orden, marcar checkboxes, documentar problemas (si los hay).

