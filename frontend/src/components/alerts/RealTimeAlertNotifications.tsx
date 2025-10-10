import {
    Close,
    Error,
    Info,
    Notifications,
    Warning
} from '@mui/icons-material';
import {
    Alert,
    Box,
    IconButton,
    Slide,
    Snackbar,
    Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { logger } from '../../utils/logger';

// Tipos de datos
interface AlertNotification {
    id: string;
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: 'stability' | 'speed' | 'geofence' | 'maintenance';
    vehicleName: string;
    timestamp: string;
    autoClose?: boolean;
    duration?: number;
}

interface RealTimeAlertNotificationsProps {
    enabled?: boolean;
    maxNotifications?: number;
    autoCloseDuration?: number;
    onAlertClick?: (alert: AlertNotification) => void;
}

// Componente principal
export const RealTimeAlertNotifications: React.FC<RealTimeAlertNotificationsProps> = ({
    enabled = false, // DESHABILITADO por defecto - solo se activa manualmente
    maxNotifications = 3, // Menos notificaciones
    autoCloseDuration = 4000, // 4 segundos (más rápido)
    onAlertClick
}) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AlertNotification[]>([]);
    const [currentNotification, setCurrentNotification] = useState<AlertNotification | null>(null);
    const [open, setOpen] = useState(false);
    const [checkingInterval, setCheckingInterval] = useState<NodeJS.Timeout | null>(null);

    // Obtener icono de severidad
    const getSeverityIcon = useCallback((severity: string) => {
        switch (severity) {
            case 'critical':
                return <Error color="error" />;
            case 'high':
                return <Warning color="warning" />;
            case 'medium':
                return <Info color="info" />;
            case 'low':
                return <Info color="success" />;
            default:
                return <Notifications color="action" />;
        }
    }, []);

    // Obtener color de severidad
    const getSeverityColor = useCallback((severity: string): 'error' | 'warning' | 'info' | 'success' => {
        switch (severity) {
            case 'critical': return 'error';
            case 'high': return 'warning';
            case 'medium': return 'info';
            case 'low': return 'success';
            default: return 'info';
        }
    }, []);

    // Formatear timestamp
    const formatTimestamp = useCallback((timestamp: string): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins}m`;
        return date.toLocaleTimeString();
    }, []);

    // Agregar nueva notificación
    const addNotification = useCallback((alert: AlertNotification): void => {
        setNotifications(prev => {
            const newNotifications = [alert, ...prev];
            // Mantener solo el número máximo de notificaciones
            return newNotifications.slice(0, maxNotifications);
        });

        // Mostrar la notificación inmediatamente si no hay ninguna mostrándose
        if (!open) {
            setCurrentNotification(alert);
            setOpen(true);
        }

        logger.info('Nueva notificación de alerta agregada', alert);
    }, [maxNotifications, open]);

    // Verificar nuevas alertas
    const checkForNewAlerts = useCallback(async (): Promise<void> => {
        if (!enabled || !user?.organizationId) return;

        try {
            const response = await apiService.get('/api/operations/alerts', {
                params: {
                    status: 'active',
                    limit: 10,
                    // Solo alertas de los últimos 5 minutos
                    since: new Date(Date.now() - 5 * 60 * 1000).toISOString()
                }
            });

            if (response.success && response.data && 'alerts' in response.data) {
                const alerts = (response.data as any).alerts as any[];

                // Filtrar alertas nuevas (que no estén ya en las notificaciones)
                const existingIds = notifications.map(n => n.id);
                const newAlerts = alerts.filter(alert => !existingIds.includes(alert.id));

                // Convertir alertas a notificaciones
                newAlerts.forEach(alert => {
                    const notification: AlertNotification = {
                        id: alert.id,
                        title: `${alert.vehicleName} - ${alert.alertType.toUpperCase()}`,
                        message: alert.message,
                        severity: alert.severity,
                        type: alert.alertType,
                        vehicleName: alert.vehicleName,
                        timestamp: alert.timestamp,
                        autoClose: alert.severity !== 'critical',
                        duration: alert.severity === 'critical' ? 15000 : autoCloseDuration
                    };

                    addNotification(notification);
                });
            }
        } catch (err) {
            logger.error('Error verificando nuevas alertas:', err);
        }
    }, [enabled, user?.organizationId, notifications, addNotification, autoCloseDuration]);

    // Manejar cierre de notificación
    const handleClose = useCallback((_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpen(false);

        // Mostrar la siguiente notificación si hay más en cola
        setTimeout(() => {
            if (notifications.length > 1) {
                const remainingNotifications = notifications.slice(1);
                setNotifications(remainingNotifications);
                setCurrentNotification(remainingNotifications[0] || null);
                setOpen(true);
            } else {
                setCurrentNotification(null);
                setNotifications([]);
            }
        }, 300); // Delay para la animación
    }, [notifications]);

    // Manejar click en notificación
    const handleNotificationClick = useCallback(() => {
        if (currentNotification && onAlertClick) {
            onAlertClick(currentNotification);
        }
        handleClose();
    }, [currentNotification, onAlertClick, handleClose]);

    // Configurar verificación periódica
    useEffect(() => {
        if (enabled && user?.organizationId) {
            // Verificar inmediatamente
            checkForNewAlerts();

            // Configurar verificación cada 30 segundos
            const interval = setInterval(checkForNewAlerts, 30000);
            setCheckingInterval(interval);

            return () => {
                clearInterval(interval);
                setCheckingInterval(null);
            };
        }
    }, [enabled, user?.organizationId, checkForNewAlerts]);

    // Limpiar intervalos al desmontar
    useEffect(() => {
        return () => {
            if (checkingInterval) {
                clearInterval(checkingInterval);
            }
        };
    }, [checkingInterval]);

    // ELIMINADO: Simulación de alertas de prueba
    // Las notificaciones ahora solo muestran alertas reales del sistema

    if (!enabled || !currentNotification) {
        return null;
    }

    return (
        <Snackbar
            open={open}
            autoHideDuration={currentNotification.autoClose ? (currentNotification.duration || autoCloseDuration) : null}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            TransitionComponent={Slide}
            TransitionProps={{ direction: 'left' }}
            sx={{
                mt: 8, // Espacio para el header
                zIndex: 9999
            }}
        >
            <Alert
                severity={getSeverityColor(currentNotification.severity)}
                icon={getSeverityIcon(currentNotification.severity)}
                action={
                    <Box className="flex items-center gap-1">
                        <IconButton
                            size="small"
                            onClick={handleNotificationClick}
                            color="inherit"
                        >
                            <Info fontSize="small" />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={handleClose}
                            color="inherit"
                        >
                            <Close fontSize="small" />
                        </IconButton>
                    </Box>
                }
                onClick={handleNotificationClick}
                sx={{
                    minWidth: 300, // Más pequeña
                    maxWidth: 350, // Más pequeña
                    cursor: 'pointer',
                    '&:hover': {
                        backgroundColor: 'action.hover'
                    }
                }}
            >
                <Box>
                    <Typography variant="subtitle2" className="font-bold">
                        {currentNotification.title}
                    </Typography>
                    <Typography variant="body2" className="mt-1">
                        {currentNotification.message}
                    </Typography>
                    <Box className="flex items-center justify-between mt-2">
                        <Typography variant="caption" color="text.secondary">
                            {formatTimestamp(currentNotification.timestamp)}
                        </Typography>
                        <Box className="flex items-center gap-1">
                            <Typography variant="caption" color="text.secondary">
                                {notifications.length} alerta{notifications.length !== 1 ? 's' : ''}
                            </Typography>
                            {notifications.length > 1 && (
                                <Box className="w-2 h-2 bg-current rounded-full animate-pulse" />
                            )}
                        </Box>
                    </Box>
                </Box>
            </Alert>
        </Snackbar>
    );
};
