# DobackSoft Next

Sistema avanzado de monitoreo de estabilidad para vehículos, implementado con React, TypeScript y tecnologías modernas.

## Características

- **Análisis de estabilidad en tiempo real**: Cálculo continuo de métricas de estabilidad como LTR, SSF y DRS.
- **Visualización avanzada**: Gráficas interactivas, análisis de señales y representación detallada de datos.
- **Procesamiento inteligente**: Decimación adaptativa, análisis de tendencias y detección de patrones.
- **Interfaz moderna**: Diseño responsive con controles intuitivos y componentes reutilizables.
- **Personalización**: Ajustes de visualización, configuración de umbrales y opciones de análisis.

## Tecnologías utilizadas

- **React 18**: Framework principal para la interfaz de usuario.
- **TypeScript**: Tipado estático para código más seguro y mantenible.
- **Recharts**: Biblioteca para visualización de datos basada en D3.js.
- **date-fns**: Manipulación y formateo de fechas.
- **Vite**: Herramienta de compilación ultrarrápida.

## Arquitectura

El sistema se divide en varios componentes clave:

- **DangerBar**: Visualiza el nivel de peligrosidad con un indicador de progreso avanzado.
- **AdvancedSensorChart**: Componente para visualización y análisis detallado de sensores.
- **Hooks personalizados**: Como `useTelemetryData` para gestión de datos.
- **Utilidades de cálculo**: Implementación de algoritmos para análisis de estabilidad.

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/your-organization/DobackSoft-next.git

# Entrar al directorio
cd DobackSoft-next

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## Configuración

El sistema incluye opciones configurables en `src/config/stabilityConfig.ts`:

- Umbrales de peligrosidad
- Pesos para cálculos de estabilidad
- Frecuencias de muestreo
- Colores y estilos de visualización

## Evolución desde DobackSoft V1

Esta implementación mejora la versión original de DobackSoft con:

1. **Mejor arquitectura**: Componentes modulares y reutilizables.
2. **Visualización mejorada**: Gráficas más detalladas con opciones avanzadas.
3. **Análisis en tiempo real**: Procesamiento y visualización optimizados.
4. **Mejor UX**: Interfaz más intuitiva y atractiva.
5. **Código mantenible**: TypeScript y estándares modernos de desarrollo.

## Licencia

MIT 