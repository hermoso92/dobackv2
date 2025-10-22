# 📊 Desglose Interactivo de Incidencias

## 🎯 Objetivo

Permitir a los usuarios explorar rápidamente las incidencias por categoría de severidad, facilitando la localización de eventos específicos en el mapa mediante interacción directa con las cajas de estadísticas.

## ✨ Funcionalidad Implementada

### **Componentes Afectados**

1. **BlackSpotsTab** (`frontend/src/components/stability/BlackSpotsTab.tsx`)
   - Análisis de Puntos Negros (zonas críticas)
   
2. **SpeedAnalysisTab** (`frontend/src/components/speed/SpeedAnalysisTab.tsx`)
   - Análisis de Excesos de Velocidad

---

## 🔧 Características Implementadas

### **1. Cajas de Estadísticas Interactivas**

Las cajas de incidencias por categoría ahora son **clickeables**:

#### **Puntos Negros**
- 🔴 **Graves**: Incidencias de alta severidad (índice 0-20%)
- 🟠 **Moderadas**: Incidencias de severidad media (índice 20-35%)
- 🟡 **Leves**: Incidencias de baja severidad (índice 35-50%)

#### **Velocidad**
- 🔴 **Graves**: Excesos superiores a 20 km/h
- 🟠 **Moderados**: Excesos entre 10-20 km/h
- 🟡 **Leves**: Excesos entre 1-10 km/h

### **2. Indicador Visual**

Cuando hay incidencias disponibles en una categoría:
- Se muestra un icono de ojo (👁️) en la caja
- Al pasar el mouse, la caja cambia de color (hover effect)
- El cursor se convierte en pointer indicando que es clickeable

### **3. Modal de Desglose**

Al hacer clic en una categoría, se abre un **modal fullscreen** que muestra:

#### **Puntos Negros - Modal:**
- Título con la categoría seleccionada
- Lista numerada de todas las incidencias de esa categoría
- Para cada incidencia:
  - 📍 **Ubicación**: Dirección geocodificada o coordenadas
  - 🔢 **Frecuencia**: Número de eventos en ese cluster
  - 🌐 **Coordenadas**: Latitud y longitud precisas
  - 🚨 **Rotativo**: Estado del rotativo (ON/OFF)

#### **Velocidad - Modal:**
- Título con la categoría seleccionada
- Lista numerada de todos los excesos de esa categoría
- Para cada exceso:
  - 📍 **Ubicación**: Dirección geocodificada
  - 🚗 **Vehículo**: Nombre del vehículo
  - 📅 **Fecha/Hora**: Timestamp formateado
  - 🏎️ **Velocidad**: Velocidad registrada
  - 🚦 **Límite**: Límite de velocidad
  - ⚠️ **Exceso**: Diferencia calculada
  - 🛣️ **Tipo de vía**: Urbana, interurbana, autopista
  - 🚨 **Rotativo**: Estado del rotativo
  - 🌐 **Coordenadas**: Latitud y longitud

### **4. Navegación al Punto en el Mapa**

Al hacer clic en cualquier incidencia del modal:
- ✅ El modal se cierra automáticamente
- ✅ El mapa se centra en las coordenadas de la incidencia
- ✅ El zoom aumenta a nivel 16 para ver el detalle
- ✅ Similar al comportamiento del ranking

---

## 💻 Implementación Técnica

### **Estados Añadidos**

```typescript
// Estados para desglose de incidencias
const [expandedCategory, setExpandedCategory] = useState<'grave' | 'moderada' | 'leve' | null>(null);
const [showIncidentsModal, setShowIncidentsModal] = useState(false);
```

### **Funciones Principales**

#### **1. Manejo de Click en Categoría**
```typescript
const handleCategoryClick = (category: 'grave' | 'moderada' | 'leve') => {
    setExpandedCategory(category);
    setShowIncidentsModal(true);
};
```

#### **2. Cierre del Modal**
```typescript
const handleCloseIncidentsModal = () => {
    setShowIncidentsModal(false);
    setExpandedCategory(null);
};
```

#### **3. Navegación a Incidencia**
```typescript
const handleIncidentClick = (incident: any) => {
    if (incident.lat && incident.lng) {
        setMapCenter([incident.lat, incident.lng]);
        setMapZoom(16);
        handleCloseIncidentsModal();
    }
};
```

#### **4. Filtrado por Categoría**
```typescript
const getIncidentsByCategory = (category: string) => {
    return violations.filter(v => v.violationType === category);
};
```

---

## 🎨 Diseño UI/UX

### **Cajas de Estadísticas**

```css
/* Estilo hover para indicar interacción */
cursor-pointer 
hover:bg-red-100 
hover:shadow-md 
transition-all
```

### **Modal**

- **Fondo**: Overlay semitransparente negro (bg-opacity-50)
- **Tamaño**: max-w-4xl (responsive)
- **Altura**: max-h-[80vh] con scroll interno
- **Estructura**:
  - Header fijo con título y botón de cierre
  - Contenido scrolleable con las incidencias
  - Cada tarjeta con hover effect

### **Tarjetas de Incidencia**

```css
/* Estilo de tarjeta individual */
border border-slate-200 
rounded-lg 
cursor-pointer 
hover:bg-slate-50 
hover:shadow-md 
transition-all
```

---

## 📱 Experiencia de Usuario

### **Flujo Completo**

1. **Usuario ve las estadísticas**
   - Observa que hay 10 incidencias graves
   - Ve el indicador visual (👁️) que indica interactividad

2. **Click en caja "Graves"**
   - Se abre modal con las 10 incidencias
   - Puede scrollear la lista completa

3. **Selecciona una incidencia específica**
   - Click en la incidencia #5
   - Modal se cierra
   - Mapa se centra automáticamente en ese punto
   - Zoom aumenta para ver detalle

4. **Resultado**
   - Usuario localiza rápidamente la incidencia grave
   - Puede ver el contexto en el mapa
   - Puede interactuar con el marker en el mapa para más detalles

---

## 🚀 Ventajas

1. ✅ **Rapidez**: Localización inmediata de incidencias específicas
2. ✅ **Intuitividad**: Interacción natural con las estadísticas
3. ✅ **Contexto**: Información completa antes de navegar al mapa
4. ✅ **Eficiencia**: Similar al ranking pero categorizado por severidad
5. ✅ **Consistencia**: Mismo comportamiento en ambos módulos (Puntos Negros y Velocidad)

---

## 🔄 Compatibilidad

- ✅ **Filtros**: El desglose respeta los filtros aplicados
- ✅ **Datos en tiempo real**: Se actualiza con cada cambio de filtros
- ✅ **Responsive**: Modal adaptativo a diferentes tamaños de pantalla
- ✅ **Accesibilidad**: Tecla ESC para cerrar modal (estándar web)

---

## 📊 Casos de Uso

### **Caso 1: Investigación de Incidencias Graves**
> *"Necesito revisar todas las incidencias graves de hoy"*
1. Filtrar por fecha actual
2. Click en caja "Graves"
3. Revisar lista completa
4. Investigar incidencias específicas en el mapa

### **Caso 2: Análisis de Patrón de Excesos**
> *"Quiero ver todos los excesos moderados con rotativo encendido"*
1. Filtrar rotativo = ON, clasificación = Moderados
2. Click en caja "Moderados"
3. Analizar patrones en la lista
4. Localizar zonas conflictivas en el mapa

### **Caso 3: Auditoría de Zona Específica**
> *"¿Cuántas incidencias leves hay en esta ruta?"*
1. Aplicar filtros de vehículo/fecha
2. Click en caja "Leves"
3. Revisar frecuencia y distribución
4. Navegar a puntos específicos

---

## 🛠️ Mantenimiento

### **Archivos Modificados**
- `frontend/src/components/stability/BlackSpotsTab.tsx`
- `frontend/src/components/speed/SpeedAnalysisTab.tsx`

### **Sin Cambios en Backend**
Esta funcionalidad es **100% frontend**, no requiere modificaciones en el backend.

### **Dependencias**
- Componente `LocationDisplay` para geocodificación
- Leaflet para control de mapa
- Estados React para gestión de modal

---

## ✅ Testing

### **Escenarios de Prueba**

1. ✅ Click en categoría con incidencias → Modal se abre
2. ✅ Click en categoría sin incidencias → No hace nada
3. ✅ Click en incidencia → Mapa se centra correctamente
4. ✅ Click en X del modal → Modal se cierra
5. ✅ Click fuera del modal → Modal se cierra
6. ✅ Scroll en lista larga → Funciona correctamente
7. ✅ Cambio de filtros → Lista se actualiza
8. ✅ Responsive → Modal se adapta a móvil/tablet/desktop

---

## 🎓 Documentación Relacionada

- [Panel de Control y KPIs](../dashboard/PANEL_CONTROL_KPIS.md)
- [Análisis de Estabilidad](ANALISIS_ESTABILIDAD.md)
- [Análisis de Velocidad](../telemetria/ANALISIS_VELOCIDAD.md)
- [Geocodificación](../../BACKEND/GEOCODING_SERVICE.md)

---

**Implementado**: 16 de Octubre de 2025  
**Estado**: ✅ Completado y funcional  
**Componentes**: BlackSpotsTab, SpeedAnalysisTab

