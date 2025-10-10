import { Box, Card, CardContent, CardProps, Typography } from '@mui/material';
import React, { ReactNode } from 'react';
interface ContentCardProps extends Omit<CardProps, 'title'> {
    /**
     * Título de la tarjeta
     */
    title?: string;
    /**
     * Subtítulo opcional
     */
    subtitle?: string;
    /**
     * Contenido de la tarjeta
     */
    children: ReactNode;
    /**
     * Acciones opcionales que aparecen en la esquina superior derecha
     */
    action?: ReactNode;
    /**
     * Icono opcional para mostrar junto al título
     */
    icon?: ReactNode;
    /**
     * Altura personalizada de la tarjeta
     */
    height?: number | string;
    /**
     * Padding personalizado para el contenido
     */
    contentPadding?: number | string;
    /**
     * Si debe mostrar o no la cabecera de la tarjeta
     */
    hideHeader?: boolean;
    /**
     * Altura personalizada para la cabecera
     */
    headerHeight?: number | string;
}

/**
 * Componente de tarjeta de contenido reutilizable
 * Proporciona un contenedor consistente para las secciones de la aplicación
 */
const ContentCard: React.FC<ContentCardProps> = ({
    title,
    subtitle,
    children,
    action,
    icon,
    height = 'auto',
    contentPadding = 1.5,
    hideHeader = false,
    headerHeight = 40,
    ...rest
}) => {
    return (
        <Card
            elevation={1}
            sx={{
                height,
                borderRadius: 1,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                ...rest.sx
            }}
            {...rest}
        >
            {title && !hideHeader && (
                <Box
                    sx={{
                        px: 1.5,
                        py: 0.75,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        bgcolor: 'background.default',
                        minHeight: headerHeight
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {icon && (
                            <Box sx={{ mr: 0.75, color: 'primary.main', display: 'flex', fontSize: '0.9rem' }}>
                                {icon}
                            </Box>
                        )}
                        <Box>
                            <Typography variant="subtitle1" fontWeight="medium" fontSize="0.85rem">
                                {title}
                            </Typography>
                            {subtitle && (
                                <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                                    {subtitle}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                    {action && (
                        <Box>
                            {action}
                        </Box>
                    )}
                </Box>
            )}

            <CardContent
                sx={{
                    p: contentPadding,
                    flexGrow: 1,
                    overflow: 'hidden',
                    '&:last-child': { pb: contentPadding } // Sobrescribir el padding por defecto
                }}
            >
                {children}
            </CardContent>
        </Card>
    );
};

export default ContentCard; 