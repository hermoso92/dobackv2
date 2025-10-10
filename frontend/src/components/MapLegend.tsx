import { Box, Stack, Typography } from '@mui/material';
import React from 'react';

/**
 * Pequeña leyenda flotante que muestra los colores asociados a los niveles de severidad
 * de los eventos de estabilidad.
 */
const MapLegend: React.FC = () => {
    const items: { color: string; label: string }[] = [
        { color: '#E53935', label: 'Crítico (< 10 %)' },
        { color: '#FFA000', label: 'Peligroso (10-30 %)' },
        { color: '#FFEB3B', label: 'Moderado (30-50 %)' },
    ];

    return (
        <Box
            sx={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                bgcolor: 'background.paper',
                opacity: 0.8,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 2,
                borderRadius: 1,
                p: 1,
                zIndex: 401,
                pointerEvents: 'none',
            }}
        >
            <Stack spacing={0.5}>
                {items.map((it) => (
                    <Stack key={it.color} direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: it.color, border: '1px solid #fff' }} />
                        <Typography variant="caption" sx={{ userSelect: 'none' }}>
                            {it.label}
                        </Typography>
                    </Stack>
                ))}
            </Stack>
        </Box>
    );
};

export default MapLegend; 