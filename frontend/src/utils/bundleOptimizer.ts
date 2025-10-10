/**
 * Utilidades para optimización de bundle y tree shaking
 * Optimización de rendimiento para el frontend
 */

// Configuración de lazy loading para componentes pesados
export const LAZY_COMPONENTS = {
    // Componentes de mapas (Leaflet es pesado)
    MapComponent: () => import('../components/maps/MapComponent'),
    HeatmapComponent: () => import('../components/maps/HeatmapComponent'),

    // Componentes de gráficos (Chart.js es pesado)
    ChartComponent: () => import('../components/charts/ChartComponent'),
    AdvancedChart: () => import('../components/charts/AdvancedChart'),

    // Componentes de IA (potencialmente pesados)
    AIChatComponent: () => import('../components/ai/AIChatComponent'),
    AIAnalysisComponent: () => import('../components/ai/AIAnalysisComponent'),

    // Componentes de reportes (pueden ser pesados)
    ReportGenerator: () => import('../components/reports/ReportGenerator'),
    PDFViewer: () => import('../components/reports/PDFViewer'),

    // Componentes de administración
    AdminPanel: () => import('../components/admin/AdminPanel'),
    UserManagement: () => import('../components/admin/UserManagement'),
};

// Configuración de chunks para code splitting
export const CHUNK_CONFIG = {
    // Chunk para librerías de terceros pesadas
    vendor: ['react', 'react-dom', '@mui/material', '@mui/icons-material'],

    // Chunk para librerías de mapas
    maps: ['leaflet', 'react-leaflet'],

    // Chunk para librerías de gráficos
    charts: ['chart.js', 'recharts', 'd3'],

    // Chunk para librerías de utilidades
    utils: ['date-fns', 'lodash', 'axios'],
};

// Función para precargar componentes críticos
export const preloadCriticalComponents = async () => {
    const criticalComponents = [
        LAZY_COMPONENTS.MapComponent,
        LAZY_COMPONENTS.ChartComponent,
    ];

    try {
        await Promise.all(
            criticalComponents.map(component => component())
        );
        console.log('✅ Critical components preloaded');
    } catch (error) {
        console.warn('⚠️ Error preloading critical components:', error);
    }
};

// Función para cargar componentes bajo demanda
export const loadComponentOnDemand = async (componentName: keyof typeof LAZY_COMPONENTS) => {
    try {
        const component = await LAZY_COMPONENTS[componentName]();
        return component.default || component;
    } catch (error) {
        console.error(`❌ Error loading component ${componentName}:`, error);
        throw error;
    }
};

// Configuración de compresión de imágenes
export const IMAGE_OPTIMIZATION = {
    // Configuración para diferentes tipos de imágenes
    formats: {
        webp: {
            quality: 80,
            enabled: true
        },
        avif: {
            quality: 75,
            enabled: true
        },
        jpeg: {
            quality: 85,
            enabled: true
        },
        png: {
            quality: 90,
            enabled: true
        }
    },

    // Tamaños responsivos
    responsiveSizes: [320, 640, 768, 1024, 1280, 1920],

    // Lazy loading para imágenes
    lazyLoading: {
        enabled: true,
        threshold: 0.1,
        rootMargin: '50px'
    }
};

// Función para optimizar imports de librerías
export const optimizeImports = {
    // Material-UI: importar solo lo necesario
    mui: () => import('@mui/material'),
    muiIcons: () => import('@mui/icons-material'),

    // Chart.js: importar solo los componentes necesarios
    chartJs: () => import('chart.js/auto'),

    // Date-fns: importar solo las funciones necesarias
    dateFns: () => import('date-fns'),

    // Lodash: importar solo las funciones necesarias
    lodash: () => import('lodash'),
};

// Configuración de service worker para caché
export const SERVICE_WORKER_CONFIG = {
    // Archivos estáticos para caché
    staticFiles: [
        '/',
        '/static/css/',
        '/static/js/',
        '/static/media/',
        '/manifest.json'
    ],

    // Estrategias de caché
    cacheStrategies: {
        // Caché primero para archivos estáticos
        static: 'cache-first',

        // Red primero para datos dinámicos
        dynamic: 'network-first',

        // Caché con fallback para imágenes
        images: 'cache-first'
    },

    // TTL para diferentes tipos de recursos
    ttl: {
        static: 7 * 24 * 60 * 60 * 1000, // 7 días
        dynamic: 5 * 60 * 1000, // 5 minutos
        images: 24 * 60 * 60 * 1000 // 1 día
    }
};

// Función para analizar el tamaño del bundle
export const analyzeBundleSize = () => {
    // Esta función se ejecutaría en tiempo de build
    // Para análisis en tiempo real, se puede usar webpack-bundle-analyzer

    const bundleAnalysis = {
        totalSize: 0,
        chunks: {},
        recommendations: []
    };

    // Análisis de chunks
    Object.keys(CHUNK_CONFIG).forEach(chunkName => {
        const chunkSize = CHUNK_CONFIG[chunkName as keyof typeof CHUNK_CONFIG].length * 100; // Estimación
        bundleAnalysis.chunks[chunkName] = chunkSize;
        bundleAnalysis.totalSize += chunkSize;
    });

    // Recomendaciones de optimización
    if (bundleAnalysis.totalSize > 1000000) { // > 1MB
        bundleAnalysis.recommendations.push('Considerar más code splitting');
    }

    if (bundleAnalysis.chunks.vendor > 500000) { // > 500KB
        bundleAnalysis.recommendations.push('Optimizar imports de librerías de terceros');
    }

    return bundleAnalysis;
};

// Función para limpiar imports no utilizados
export const cleanupUnusedImports = () => {
    // Esta función ayudaría a identificar imports no utilizados
    // En un entorno real, se usaría una herramienta como eslint-plugin-unused-imports

    const unusedImports = [
        // Ejemplo de imports que podrían no estar siendo utilizados
        // 'react-router-dom/Router', // Si solo se usa BrowserRouter
        // '@mui/material/Box', // Si se usa solo en algunos componentes
    ];

    return {
        found: unusedImports.length,
        imports: unusedImports,
        recommendations: [
            'Ejecutar eslint --fix para limpiar automáticamente',
            'Revisar manualmente imports de librerías grandes',
            'Usar tree shaking para librerías que lo soporten'
        ]
    };
};

// Configuración de webpack para optimizaciones
export const WEBPACK_OPTIMIZATIONS = {
    // Configuración de tree shaking
    treeShaking: {
        enabled: true,
        sideEffects: false
    },

    // Configuración de minificación
    minification: {
        enabled: true,
        options: {
            removeComments: true,
            collapseWhitespace: true,
            removeRedundantAttributes: true,
            useShortDoctype: true,
            removeEmptyAttributes: true,
            removeStyleLinkTypeAttributes: true,
            keepClosingSlash: true,
            minifyJS: true,
            minifyCSS: true,
            minifyURLs: true
        }
    },

    // Configuración de code splitting
    codeSplitting: {
        enabled: true,
        chunks: 'all',
        maxSize: 244000, // 244KB por chunk
        minSize: 20000, // 20KB mínimo por chunk
        cacheGroups: {
            vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
                priority: 10
            },
            common: {
                name: 'common',
                minChunks: 2,
                chunks: 'all',
                priority: 5,
                reuseExistingChunk: true
            }
        }
    }
};

// Función para monitorear el rendimiento del bundle
export const monitorBundlePerformance = () => {
    const performance = {
        loadTime: performance.now(),
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        bundleSize: 0,
        chunkCount: 0
    };

    // Obtener información de chunks cargados
    if ((window as any).__webpack_require__) {
        const chunks = (window as any).__webpack_require__.cache;
        performance.chunkCount = Object.keys(chunks).length;
    }

    return performance;
};

export default {
    LAZY_COMPONENTS,
    CHUNK_CONFIG,
    preloadCriticalComponents,
    loadComponentOnDemand,
    IMAGE_OPTIMIZATION,
    optimizeImports,
    SERVICE_WORKER_CONFIG,
    analyzeBundleSize,
    cleanupUnusedImports,
    WEBPACK_OPTIMIZATIONS,
    monitorBundlePerformance
};
