# 📊 ANÁLISIS DE LAYOUT DEL DASHBOARD - DOBACKSOFT

## 🎯 PROBLEMA ACTUAL
El layout del dashboard tiene problemas de posicionamiento y estructura. Los elementos no se muestran en el orden correcto y hay conflictos entre archivos CSS.

## 📁 ARCHIVOS INCLUIDOS

### **1. ARCHIVOS DE LAYOUT PRINCIPAL:**
- `components/Layout/MainLayout.tsx` - Layout principal de la aplicación
- `components/Navigation.tsx` - Barra de navegación superior (60px altura)

### **2. ARCHIVOS DEL DASHBOARD:**
- `pages/UnifiedDashboard.tsx` - Página principal del dashboard
- `components/kpi/NewExecutiveKPIDashboard.tsx` - Dashboard con pestañas y KPIs

### **3. ARCHIVOS DE FILTROS:**
- `components/filters/GlobalFiltersBar.tsx` - Barra de filtros globales (48px altura)
- `components/filters/FilteredPageWrapper.tsx` - Wrapper para páginas con filtros
- `hooks/useGlobalFilters.ts` - Hook para manejo de filtros globales

### **4. ARCHIVOS DE ESTILOS:**
- `styles/global.css` - Estilos globales y posicionamiento
- `styles/reset.css` - Reset de estilos MUI
- `tailwind.config.js` - Configuración de Tailwind CSS

### **5. ARCHIVOS DE ROUTING:**
- `routes.tsx` - Configuración de rutas
- `App.tsx` - Componente raíz de la aplicación

## 🔍 ESTRUCTURA DESEADA

```
📱 NAVEGACIÓN (60px) - position: fixed, top: 0
├── Navigation.tsx
│
📊 FILTROS GLOBALES (48px) - position: fixed, top: 60px  
├── GlobalFiltersBar.tsx
│
📑 PESTAÑAS DASHBOARD (52px) - position: fixed, top: 108px
├── Tabs del dashboard
│
📈 CONTENIDO DASHBOARD (resto) - position: fixed, top: 160px
├── KPIs, mapas, gráficos
```

## ⚠️ PROBLEMAS IDENTIFICADOS

1. **Conflicto de posicionamiento**: Múltiples archivos CSS con `position: fixed` conflictivos
2. **Alturas incorrectas**: Cálculos de altura que no coinciden entre componentes
3. **Overflow issues**: Scrollbars globales que no deberían existir
4. **Estructura duplicada**: Componentes que renderizan elementos similares
5. **CSS conflicts**: Reglas CSS que se sobrescriben entre archivos

## 🎯 OBJETIVO
Crear un layout TV Wall que:
- ✅ Use todo el ancho y alto de la pantalla
- ✅ No tenga scrollbars globales
- ✅ Mantenga el orden: Menú → Filtros → Pestañas → Contenido
- ✅ Sea responsive y mantenible
- ✅ No tenga conflictos CSS

## 📋 INSTRUCCIONES PARA ANÁLISIS
1. Revisar la jerarquía de renderizado
2. Identificar conflictos CSS entre archivos
3. Analizar el posicionamiento de cada componente
4. Proponer una solución limpia y definitiva
5. Considerar que es un dashboard tipo TV Wall (pantalla completa)

## 🔧 TECNOLOGÍAS USADAS
- React + TypeScript
- Material-UI (MUI)
- Tailwind CSS
- React Router
- Custom Hooks

---
**Fecha de creación**: $(Get-Date)
**Proyecto**: DobackSoft (StabilSafe V3)
**Tipo**: Dashboard TV Wall
