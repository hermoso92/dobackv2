import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip
} from 'chart.js';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { FiltersProvider } from './contexts/FiltersContext';
import { ThemeModeProvider } from './contexts/ThemeModeContext';
import './index.css'; // Base App styles
import { store } from './store';
import './styles/DobackSoft-v2.css'; // Comprehensive UI improvements
import './styles/reset.css';
import './styles/scrollbars.css'; // Scrollbar styles
import { configureStyledComponents, emotionCache, theme } from './utils/styled-components-config';

// Importar i18n para inicializar la detección automática de idioma
import './i18n';

// Importar configuración de styled-components
import './utils/styled-components-config';

// Importar función para crear superadmin
import './utils/createSuperAdmin';

// Importar función para crear organización de prueba
import './utils/createTestOrganization';

// Manejar errores globales de window que no deben romper la aplicación
window.addEventListener('error', (event) => {
    const errorMessage = event.message || '';

    // Lista de errores que deben ser silenciados
    const ignoredErrors = [
        'triggerSyncToReact',
        'reading \'messages\'',
        'Cannot read properties of undefined',
        'i18next',
        'i18n'
    ];

    // Silenciar errores de funciones inexistentes que no son parte de nuestra app
    if (ignoredErrors.some(ignored => errorMessage.includes(ignored))) {
        event.preventDefault();
        event.stopPropagation();
        console.debug('Silenced non-critical error:', errorMessage);
        return;
    }
}, true); // Capturar en fase de captura para interceptar antes

// Manejar promesas rechazadas no capturadas
window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.message || event.reason || '';

    // Lista de errores que deben ser silenciados
    const ignoredErrors = [
        'triggerSyncToReact',
        'reading \'messages\'',
        'i18n',
        'i18next',
        'translation'
    ];

    if (ignoredErrors.some(ignored => String(reason).includes(ignored))) {
        event.preventDefault();
        console.debug('Silenced non-critical promise rejection:', reason);
        return;
    }
});

// Registrar los componentes de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const queryClient = new QueryClient();

// Configurar styled-components
configureStyledComponents();

// MetaMask eliminado - no es necesario para DobackSoft

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <HelmetProvider>
            <CacheProvider value={emotionCache}>
                <ThemeProvider theme={theme}>
                    <Provider store={store}>
                        <QueryClientProvider client={queryClient}>
                            <BrowserRouter future={{
                                v7_startTransition: true,
                                v7_relativeSplatPath: true
                            }}>
                                <AuthProvider>
                                    <FiltersProvider>
                                        <ThemeModeProvider>
                                            <Suspense fallback={<div>Cargando traducciones...</div>}>
                                                <App />
                                            </Suspense>
                                        </ThemeModeProvider>
                                    </FiltersProvider>
                                </AuthProvider>
                            </BrowserRouter>
                        </QueryClientProvider>
                    </Provider>
                </ThemeProvider>
            </CacheProvider>
        </HelmetProvider>
    </React.StrictMode>
); 