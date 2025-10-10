import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const AuthDebug: React.FC = () => {
    const { isAuthenticated, isLoading, isInitialized, user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    return (
        <Box sx={{ p: 2 }}>
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        🔍 Debug de Autenticación
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Estado:</strong> {isInitialized ? '✅ Inicializado' : '⏳ Inicializando'}
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Cargando:</strong> {isLoading ? '⏳ Sí' : '✅ No'}
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Autenticado:</strong> {isAuthenticated ? '✅ Sí' : '❌ No'}
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 2 }}>
                        <strong>Usuario:</strong> {user ? `${user.name} (${user.email})` : 'Ninguno'}
                    </Typography>

                    {isAuthenticated && (
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleLogout}
                            sx={{ mt: 1 }}
                        >
                            Cerrar Sesión
                        </Button>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};