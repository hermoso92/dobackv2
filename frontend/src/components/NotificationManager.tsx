import { Alert, Snackbar, Stack } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { StabilityEvent } from '../types/stability';
interface NotificationManagerProps {
    events: StabilityEvent[];
    onEventAcknowledged: (eventId: string) => void;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
    events,
    onEventAcknowledged
}) => {
    const [currentNotification, setCurrentNotification] = useState<StabilityEvent | null>(null);
    const [notifications, setNotifications] = useState<StabilityEvent[]>([]);

    useEffect(() => {
        const newEvents = events.filter(event => !event.acknowledged);
        setNotifications(prev => [...prev, ...newEvents]);
    }, [events]);

    const handleClose = (eventId: string) => {
        setCurrentNotification(null);
        setNotifications(prev => prev.filter(n => n.id !== eventId));
        onEventAcknowledged(eventId);
    };

    useEffect(() => {
        if (!currentNotification && notifications.length > 0) {
            setCurrentNotification(notifications[0]);
        }
    }, [currentNotification, notifications]);

    const getEventMessage = (event: StabilityEvent) => {
        return `${event.message} - LTR: ${event.metrics.ltr.toFixed(2)}, SSF: ${event.metrics.ssf.toFixed(2)}, DRS: ${event.metrics.drs.toFixed(2)}`;
    };

    return (
        <Stack spacing={1}>
            <Snackbar
                open={!!currentNotification}
                autoHideDuration={6000}
                onClose={() => currentNotification && handleClose(currentNotification.id)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => currentNotification && handleClose(currentNotification.id)}
                    severity={currentNotification?.resolved ? 'success' : currentNotification?.acknowledged ? 'warning' : 'error'}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {currentNotification && getEventMessage(currentNotification)}
                </Alert>
            </Snackbar>
        </Stack>
    );
}; 