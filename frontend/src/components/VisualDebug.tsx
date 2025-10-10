import { Box, Card, CardContent, Typography } from '@mui/material';
import React from 'react';

export const VisualDebug: React.FC = () => {
    return (
        <Box sx={{ p: 2, backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
                🔍 Diagnóstico Visual
            </Typography>

            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Información del Viewport
                    </Typography>
                    <Typography variant="body2">
                        Ancho: {window.innerWidth}px
                    </Typography>
                    <Typography variant="body2">
                        Alto: {window.innerHeight}px
                    </Typography>
                    <Typography variant="body2">
                        Device Pixel Ratio: {window.devicePixelRatio}
                    </Typography>
                </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Estilos Computados del Body
                    </Typography>
                    <Typography variant="body2" component="pre" sx={{ fontSize: '0.8rem' }}>
                        {JSON.stringify({
                            margin: getComputedStyle(document.body).margin,
                            padding: getComputedStyle(document.body).padding,
                            overflow: getComputedStyle(document.body).overflow,
                            height: getComputedStyle(document.body).height,
                            width: getComputedStyle(document.body).width,
                            display: getComputedStyle(document.body).display,
                            position: getComputedStyle(document.body).position
                        }, null, 2)}
                    </Typography>
                </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Estilos Computados del #root
                    </Typography>
                    <Typography variant="body2" component="pre" sx={{ fontSize: '0.8rem' }}>
                        {JSON.stringify({
                            margin: getComputedStyle(document.getElementById('root')!).margin,
                            padding: getComputedStyle(document.getElementById('root')!).padding,
                            overflow: getComputedStyle(document.getElementById('root')!).overflow,
                            height: getComputedStyle(document.getElementById('root')!).height,
                            width: getComputedStyle(document.getElementById('root')!).width,
                            display: getComputedStyle(document.getElementById('root')!).display,
                            position: getComputedStyle(document.getElementById('root')!).position
                        }, null, 2)}
                    </Typography>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        CSS Files Loaded
                    </Typography>
                    <Typography variant="body2" component="pre" sx={{ fontSize: '0.8rem' }}>
                        {Array.from(document.styleSheets).map((sheet, index) => {
                            try {
                                return `${index}: ${sheet.href || 'inline'}`;
                            } catch (e) {
                                return `${index}: Error accessing stylesheet`;
                            }
                        }).join('\n')}
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
};
