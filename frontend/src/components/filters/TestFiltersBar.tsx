import { Box, Typography } from '@mui/material';
import React from 'react';

const TestFiltersBar: React.FC = () => {
    return (
        <Box
            sx={{
                p: 2,
                backgroundColor: '#ff0000', // Color rojo para que sea muy visible
                borderBottom: 2,
                borderColor: '#000000',
                minHeight: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                FILTROS GLOBALES - PRUEBA VISIBLE
            </Typography>
        </Box>
    );
};

export default TestFiltersBar;
