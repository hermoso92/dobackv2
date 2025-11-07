// Configuración simplificada para styled-components con Material-UI

import createCache from '@emotion/cache';
import { createTheme } from '@mui/material/styles';

// Crear cache de Emotion optimizado
export const emotionCache = createCache({
    key: 'css',
    prepend: true,
});

// Configuración del tema Material-UI
export const theme = createTheme({
    components: {
        // Configuración optimizada para Popper
        MuiPopper: {
            defaultProps: {
                container: () => document.body,
            },
        },
    },
});

// Función para configurar styled-components globalmente
export const configureStyledComponents = () => {
    if (typeof window !== 'undefined') {
        // Configurar Emotion cache globalmente
        (window as any).__EMOTION_CACHE__ = emotionCache;
    }
};

// Exportar configuración por defecto
export default {
    emotionCache,
    theme,
    configureStyledComponents,
};
