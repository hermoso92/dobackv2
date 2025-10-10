import { Box, CircularProgress } from '@mui/material';
import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

// Layouts
import { AuthLayout } from './components/Layout/AuthLayout';
import { MainLayout } from './components/Layout/MainLayout';
import { ManagementDashboard } from './components/ManagementDashboard';

// Auth Pages
import Register from './pages/auth/Register';
import { Login } from './pages/Login';

// Lazy load main pages for better performance
const GeofencesManager = lazy(() => import('./pages/GeofencesManager'));
const AlertsManager = lazy(() => import('./pages/AlertsManager'));
const MaintenanceManager = lazy(() => import('./pages/MaintenanceManager'));
const RouteAnalysis = lazy(() => import('./pages/RouteAnalysis'));
const UnifiedDashboard = lazy(() => import('./pages/UnifiedDashboard'));
const UnifiedEstabilidad = lazy(() => import('./pages/UnifiedEstabilidad'));
const UnifiedTelemetria = lazy(() => import('./pages/UnifiedTelemetria'));
const UnifiedVehicles = lazy(() => import('./pages/UnifiedVehicles'));
const UnifiedAI = lazy(() => import('./pages/UnifiedAI'));
const UnifiedReports = lazy(() => import('./pages/UnifiedReports'));
const UnifiedAdmin = lazy(() => import('./pages/UnifiedAdmin'));
const UnifiedOperations = lazy(() => import('./pages/UnifiedOperations'));

// Regular imports for frequently used pages
import { ObservabilityPage } from './components/observability/ObservabilityPage';
import Analytics from './pages/Analytics';
import Events from './pages/Events';
import KnowledgeBase from './pages/KnowledgeBase';
import Perfil from './pages/Perfil';
import Settings from './pages/Settings';
import UploadData from './pages/UploadData';
import UploadPage from './pages/UploadPage';

// Loading component
const PageLoadingSpinner = () => (
    <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
        sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 2,
            m: 2
        }}
    >
        <CircularProgress
            size={60}
            thickness={4}
            sx={{
                color: 'white',
                '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                }
            }}
        />
    </Box>
);

export const AppRoutes: React.FC = () => {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            {/* Rutas públicas */}
            <Route element={<AuthLayout />}>
                <Route path="/login" element={
                    isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
                } />
                <Route path="/login-simple" element={
                    isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
                } />
                <Route path="/register" element={
                    isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
                } />
            </Route>

            {/* Rutas protegidas */}
            <Route element={<MainLayout />}>
                <Route path="/gestion-flota" element={
                    <ProtectedRoute>
                        <ManagementDashboard token={localStorage.getItem('auth_token') || ''} userRole={JSON.parse(localStorage.getItem('auth_user') || '{}').role || ''} />
                    </ProtectedRoute>
                } />
                <Route path="/" element={
                    isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
                } />
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Suspense fallback={<PageLoadingSpinner />}>
                            <UnifiedDashboard />
                        </Suspense>
                    </ProtectedRoute>
                } />
                <Route path="/vehicles" element={
                    <ProtectedRoute>
                        <Suspense fallback={<PageLoadingSpinner />}>
                            <UnifiedVehicles />
                        </Suspense>
                    </ProtectedRoute>
                } />
                <Route path="/telemetry" element={
                    <ProtectedRoute>
                        <Suspense fallback={<PageLoadingSpinner />}>
                            <UnifiedTelemetria />
                        </Suspense>
                    </ProtectedRoute>
                } />
                {/* <Route path="/subidas" element={
                    <ProtectedRoute>
                        <SubirSesion />
                    </ProtectedRoute>
                } /> */}
                <Route path="/ai" element={
                    <ProtectedRoute>
                        <Suspense fallback={<PageLoadingSpinner />}>
                            <UnifiedAI />
                        </Suspense>
                    </ProtectedRoute>
                } />
                <Route path="/admin" element={
                    <ProtectedRoute>
                        <Suspense fallback={<PageLoadingSpinner />}>
                            <UnifiedAdmin />
                        </Suspense>
                    </ProtectedRoute>
                } />
                <Route path="/observability" element={
                    <ProtectedRoute>
                        <ObservabilityPage />
                    </ProtectedRoute>
                } />
                <Route path="/stability" element={
                    <ProtectedRoute>
                        <Suspense fallback={<PageLoadingSpinner />}>
                            <UnifiedEstabilidad />
                        </Suspense>
                    </ProtectedRoute>
                } />
                <Route path="/reports" element={
                    <ProtectedRoute>
                        <Suspense fallback={<PageLoadingSpinner />}>
                            <UnifiedReports />
                        </Suspense>
                    </ProtectedRoute>
                } />
                <Route path="/settings" element={
                    <ProtectedRoute>
                        <Settings />
                    </ProtectedRoute>
                } />
                <Route path="/profile" element={
                    <ProtectedRoute>
                        <Perfil />
                    </ProtectedRoute>
                } />
                <Route path="/perfil" element={
                    <ProtectedRoute>
                        <Perfil />
                    </ProtectedRoute>
                } />
                <Route path="/upload-session" element={
                    <ProtectedRoute>
                        <UploadData />
                    </ProtectedRoute>
                } />
                <Route path="/upload" element={
                    <ProtectedRoute>
                        <UploadPage />
                    </ProtectedRoute>
                } />
                <Route path="/geofences" element={
                    <ProtectedRoute>
                        <Suspense fallback={<PageLoadingSpinner />}>
                            <GeofencesManager />
                        </Suspense>
                    </ProtectedRoute>
                } />
                <Route path="/analytics" element={
                    <ProtectedRoute>
                        <Analytics />
                    </ProtectedRoute>
                } />
                <Route path="/knowledge-base" element={
                    <ProtectedRoute>
                        <KnowledgeBase />
                    </ProtectedRoute>
                } />
                <Route path="/events" element={
                    <ProtectedRoute>
                        <Events />
                    </ProtectedRoute>
                } />
                <Route path="/operations" element={
                    <ProtectedRoute>
                        <Suspense fallback={<PageLoadingSpinner />}>
                            <UnifiedOperations />
                        </Suspense>
                    </ProtectedRoute>
                } />
                <Route path="/alerts" element={
                    <ProtectedRoute>
                        <Suspense fallback={<PageLoadingSpinner />}>
                            <AlertsManager />
                        </Suspense>
                    </ProtectedRoute>
                } />
                <Route path="/maintenance" element={
                    <ProtectedRoute>
                        <Suspense fallback={<PageLoadingSpinner />}>
                            <MaintenanceManager />
                        </Suspense>
                    </ProtectedRoute>
                } />
                <Route path="/route-analysis" element={
                    <ProtectedRoute>
                        <Suspense fallback={<PageLoadingSpinner />}>
                            <RouteAnalysis />
                        </Suspense>
                    </ProtectedRoute>
                } />
            </Route>

            {/* Ruta 404 - Redirigir según estado de autenticación */}
            <Route path="*" element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            } />
        </Routes>
    );
}; 