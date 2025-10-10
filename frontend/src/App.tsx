import { Chart } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import React from 'react';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { VehicleProvider } from './contexts/VehicleContext';
import { AppRoutes } from './routes';
import './styles/global.css';

// import { TestLogin } from './components/TestLogin';

// Registrar el plugin de zoom
Chart.register(zoomPlugin);

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <VehicleProvider>
                {/* <TestLogin /> */}
                <AppRoutes />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#363636',
                            color: '#fff',
                        },
                        success: {
                            duration: 3000,
                            iconTheme: {
                                primary: '#4ade80',
                                secondary: '#fff',
                            },
                        },
                        error: {
                            duration: 5000,
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#fff',
                            },
                        },
                    }}
                />
            </VehicleProvider>
        </ErrorBoundary>
    );
};

export default App;