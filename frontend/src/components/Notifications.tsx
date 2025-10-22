import { Alert, AlertColor, Snackbar } from '@mui/material';
import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { logger } from '../utils/logger';

interface NotificationState {
    open: boolean;
    message: string;
    severity: AlertColor;
    duration?: number;
    action?: React.ReactNode;
}

interface NotificationContextType {
    notification: NotificationState;
    success: (message: string, options?: Partial<NotificationState>) => void;
    error: (message: string, options?: Partial<NotificationState>) => void;
    warning: (message: string, options?: Partial<NotificationState>) => void;
    info: (message: string, options?: Partial<NotificationState>) => void;
    close: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notification, setNotification] = useState<NotificationState>({
        open: false,
        message: '',
        severity: 'info'
    });

    const showNotification = useCallback((
        message: string,
        severity: AlertColor,
        options: Partial<NotificationState> = {}
    ) => {
        setNotification({
            open: true,
            message,
            severity,
            duration: 6000,
            ...options
        });
        logger.info('Notificación mostrada', { message, severity });
    }, []);

    const success = useCallback((message: string, options?: Partial<NotificationState>) => {
        showNotification(message, 'success', options);
    }, [showNotification]);

    const error = useCallback((message: string, options?: Partial<NotificationState>) => {
        showNotification(message, 'error', { duration: 8000, ...options });
    }, [showNotification]);

    const warning = useCallback((message: string, options?: Partial<NotificationState>) => {
        showNotification(message, 'warning', options);
    }, [showNotification]);

    const info = useCallback((message: string, options?: Partial<NotificationState>) => {
        showNotification(message, 'info', options);
    }, [showNotification]);

    const close = useCallback(() => {
        setNotification(prev => ({ ...prev, open: false }));
    }, []);

    const value: NotificationContextType = {
        notification,
        success,
        error,
        warning,
        info,
        close
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <Snackbar
                open={notification.open}
                autoHideDuration={notification.duration}
                onClose={close}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{ mt: 8 }}
            >
                <Alert
                    onClose={close}
                    severity={notification.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                    action={notification.action}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </NotificationContext.Provider>
    );
};

export const useNotifications = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

// Hook para notificaciones con auto-dismiss
export const useAutoNotifications = () => {
    const { success, error, warning, info } = useNotifications();

    const autoSuccess = useCallback((message: string) => {
        success(message, { duration: 3000 });
    }, [success]);

    const autoError = useCallback((message: string) => {
        error(message, { duration: 5000 });
    }, [error]);

    const autoWarning = useCallback((message: string) => {
        warning(message, { duration: 4000 });
    }, [warning]);

    const autoInfo = useCallback((message: string) => {
        info(message, { duration: 3000 });
    }, [info]);

    return {
        success: autoSuccess,
        error: autoError,
        warning: autoWarning,
        info: autoInfo
    };
};

// Componente para mostrar notificaciones persistentes
interface PersistentNotificationProps {
    message: string;
    severity: AlertColor;
    onClose: () => void;
    action?: React.ReactNode;
    duration?: number;
}

export const PersistentNotification: React.FC<PersistentNotificationProps> = ({
    message,
    severity,
    onClose,
    action,
    duration = 0
}) => {
    return (
        <Snackbar
            open={true}
            autoHideDuration={duration || null}
            onClose={onClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{ mt: 8 }}
        >
            <Alert
                onClose={onClose}
                severity={severity}
                variant="filled"
                sx={{ width: '100%' }}
                action={action}
            >
                {message}
            </Alert>
        </Snackbar>
    );
};

// Hook para manejar notificaciones de API
export const useApiNotifications = () => {
    const { success, error, warning, info } = useNotifications();

    const handleApiSuccess = useCallback((message: string, data?: any) => {
        success(message);
        if (data && process.env.NODE_ENV === 'development') {
            logger.info('API Success:', data);
        }
    }, [success]);

    const handleApiError = useCallback((error: any, fallbackMessage?: string) => {
        let message = fallbackMessage || 'Error inesperado';

        if (error?.response?.data?.error) {
            message = error.response.data.error;
        } else if (error?.message) {
            message = error.message;
        } else if (typeof error === 'string') {
            message = error;
        }

        error(message);

        if (process.env.NODE_ENV === 'development') {
            logger.error('API Error:', error);
        }
    }, [error]);

    const handleApiWarning = useCallback((message: string, data?: any) => {
        warning(message);
        if (data && process.env.NODE_ENV === 'development') {
            logger.warn('API Warning:', data);
        }
    }, [warning]);

    const handleApiInfo = useCallback((message: string, data?: any) => {
        info(message);
        if (data && process.env.NODE_ENV === 'development') {
            logger.info('API Info:', data);
        }
    }, [info]);

    return {
        success: handleApiSuccess,
        error: handleApiError,
        warning: handleApiWarning,
        info: handleApiInfo
    };
};

// Hook para notificaciones de validación
export const useValidationNotifications = () => {
    const { error, warning } = useNotifications();

    const showValidationError = useCallback((field: string, message: string) => {
        error(`Error en ${field}: ${message}`, { duration: 5000 });
    }, [error]);

    const showValidationWarning = useCallback((field: string, message: string) => {
        warning(`Advertencia en ${field}: ${message}`, { duration: 4000 });
    }, [warning]);

    const showFormErrors = useCallback((errors: Record<string, string>) => {
        const firstError = Object.entries(errors)[0];
        if (firstError) {
            showValidationError(firstError[0], firstError[1]);
        }
    }, [showValidationError]);

    return {
        showValidationError,
        showValidationWarning,
        showFormErrors
    };
};

// Hook para notificaciones de progreso
export const useProgressNotifications = () => {
    const { info, success, error } = useNotifications();

    const showProgress = useCallback((message: string, progress?: number) => {
        const progressMessage = progress !== undefined
            ? `${message} (${Math.round(progress * 100)}%)`
            : message;

        info(progressMessage, { duration: 0 }); // Sin auto-dismiss
    }, [info]);

    const showProgressSuccess = useCallback((message: string) => {
        success(message, { duration: 3000 });
    }, [success]);

    const showProgressError = useCallback((message: string) => {
        error(message, { duration: 5000 });
    }, [error]);

    return {
        showProgress,
        showProgressSuccess,
        showProgressError
    };
};

export default {
    NotificationProvider,
    useNotifications,
    useAutoNotifications,
    useApiNotifications,
    useValidationNotifications,
    useProgressNotifications,
    PersistentNotification
};