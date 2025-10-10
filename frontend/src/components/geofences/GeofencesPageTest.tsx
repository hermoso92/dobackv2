import { Box, Typography } from '@mui/material';
import React from 'react';

const GeofencesPageTest: React.FC = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                🗺️ Geocercas - Página de Prueba
            </Typography>
            <Typography variant="body1">
                Esta es una página de prueba para verificar que la ruta funciona.
            </Typography>
        </Box>
    );
};

export default GeofencesPageTest;
