import { Box, CircularProgress, Skeleton, Typography } from '@mui/material';
import React from 'react';

interface OptimizedLoadingSpinnerProps {
    message?: string;
    size?: number;
    variant?: 'spinner' | 'skeleton' | 'minimal';
    height?: string | number;
    fullScreen?: boolean;
}

/**
 * Componente de loading optimizado que reduce re-renders
 * y mejora la experiencia de usuario
 */
export const OptimizedLoadingSpinner: React.FC<OptimizedLoadingSpinnerProps> = React.memo(({
    message = 'Cargando...',
    size = 40,
    variant = 'spinner',
    height = '400px',
    fullScreen = false
}) => {
    const containerStyle = {
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: fullScreen ? '100vh' : height,
        width: '100%',
        padding: fullScreen ? 0 : 2
    };

    if (variant === 'skeleton') {
        return (
            <Box sx={containerStyle}>
                <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 2 }} />
                <Skeleton variant="text" width="60%" height={40} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="40%" height={30} />
            </Box>
        );
    }

    if (variant === 'minimal') {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={size} />
            </Box>
        );
    }

    return (
        <Box sx={containerStyle}>
            <CircularProgress size={size} />
            {message && (
                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mt: 2, textAlign: 'center' }}
                >
                    {message}
                </Typography>
            )}
        </Box>
    );
});

OptimizedLoadingSpinner.displayName = 'OptimizedLoadingSpinner';
