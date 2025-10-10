import { ArrowDownward, ArrowUpward } from '@mui/icons-material';
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';
import React, { ReactNode } from 'react';
interface StatsCardProps {
    /**
     * El título de la tarjeta
     */
    title: string;
    /**
     * El valor principal a mostrar
     */
    value: string | number;
    /**
     * Un texto descriptivo secundario
     */
    subtitle?: string;
    /**
     * Ícono para mostrar junto a la tarjeta
     */
    icon?: ReactNode;
    /**
     * Color de fondo del ícono, toma los colores del tema
     */
    iconColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
    /**
     * Alto personalizado para la tarjeta
     */
    height?: number | string;
    /**
     * Valor de tendencia con +/- (positivo significa subida, negativo bajada)
     */
    trend?: number;
    /**
     * Color de la tarjeta (para tema moderno)
     */
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

type ThemeColorKey = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

/**
 * Componente de tarjeta de estadísticas reutilizable
 * Muestra un valor destacado con título y subtítulo opcional
 */
const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    iconColor = 'primary',
    height = '100%',
    trend,
    color
}) => {
    const theme = useTheme();

    // Color a utilizar (pasado como prop o valor por defecto)
    const displayColor = color || iconColor;

    // Obtener el color real del tema
    const getThemeColor = (colorKey: ThemeColorKey) => {
        const paletteColor = theme.palette[colorKey];
        if (paletteColor && 'main' in paletteColor) {
            return paletteColor.main;
        }
        return theme.palette.primary.main;
    };

    return (
        <Card
            elevation={1}
            sx={{
                height,
                borderRadius: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: 3
                },
                borderLeft: 3,
                borderColor: getThemeColor(displayColor as ThemeColorKey),
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <CardContent sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary" fontWeight="medium" gutterBottom>
                            {title}
                        </Typography>

                        <Typography
                            variant="h5"
                            component="div"
                            sx={{
                                fontWeight: 'bold',
                                color: getThemeColor(displayColor as ThemeColorKey)
                            }}
                        >
                            {value}
                        </Typography>
                    </Box>

                    {icon && (
                        <Box
                            sx={{
                                color: getThemeColor(displayColor as ThemeColorKey),
                                opacity: 0.2,
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            {icon}
                        </Box>
                    )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {trend !== undefined && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                color: trend >= 0 ? theme.palette.success.main : theme.palette.error.main,
                                bgcolor: trend >= 0
                                    ? 'rgba(84, 214, 44, 0.1)' // Success light background
                                    : 'rgba(255, 72, 66, 0.1)', // Error light background
                                px: 1,
                                py: 0.3,
                                borderRadius: 1,
                                fontSize: '0.75rem',
                                fontWeight: 'medium'
                            }}
                        >
                            {trend >= 0 ? <ArrowUpward fontSize="small" sx={{ fontSize: '0.875rem' }} /> : <ArrowDownward fontSize="small" sx={{ fontSize: '0.875rem' }} />}
                            <Typography variant="caption" fontWeight="bold" sx={{ ml: 0.5 }}>
                                {Math.abs(trend)}%
                            </Typography>
                        </Box>
                    )}

                    {subtitle && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ ml: trend !== undefined ? 1 : 0 }}
                        >
                            {subtitle}
                        </Typography>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default StatsCard; 