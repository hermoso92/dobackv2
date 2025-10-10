import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Typography
} from '@mui/material';
import React from 'react';
import { t } from "../../i18n";
import { Vehicle, VehicleLocation } from '../../types/vehicle';

interface Session {
    id: string;
    startTime: string;
    endTime: string | null;
    status: string;
}

interface SessionSelectDialogProps {
    open: boolean;
    onClose: () => void;
    vehicle: Vehicle | null;
    sessions: Session[];
    loading: boolean;
    onSelectSession: (sessionId: string) => void;
    locationInfo?: VehicleLocation | null;
}

const SessionSelectDialog: React.FC<SessionSelectDialogProps> = ({
    open,
    onClose,
    vehicle,
    sessions,
    loading,
    onSelectSession,
    locationInfo = null
}) => {
    const [selectedSession, setSelectedSession] = React.useState<string>('');

    const handleSessionSelect = () => {
        if (selectedSession) {
            onSelectSession(selectedSession);
            onClose();
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            aria-labelledby="session-dialog-title"
        >
            <DialogTitle id="session-dialog-title">
                {t('seleccionar_sesion_3')}{vehicle?.plate || vehicle?.name}
            </DialogTitle>
            <DialogContent>
                {locationInfo && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Última ubicación: {new Date(locationInfo.lastUpdate).toLocaleString()}
                    </Typography>
                )}
                <Box sx={{ mt: 2 }}>
                    <FormControl fullWidth>
                        <InputLabel id="session-select-label">{t('sesion_23')}</InputLabel>
                        <Select
                            value={selectedSession}
                            labelId="session-select-label"
                            label="Sesión"
                            onChange={(e) => setSelectedSession(e.target.value)}
                        >
                            {sessions.map((session) => (
                                <MenuItem key={session.id} value={session.id}>
                                    <Typography variant="body1">
                                        {t('inicio_2')}{formatDate(session.startTime)}
                                    </Typography>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('cancelar_24')}</Button>
                <Button
                    onClick={handleSessionSelect}
                    variant="contained"
                    disabled={!selectedSession}
                >
                    {t('seleccionar')}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default SessionSelectDialog; 