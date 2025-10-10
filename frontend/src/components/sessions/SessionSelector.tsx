import {
    Alert,
    Box,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import React from 'react';
import { getVehicleSessions } from '../../services/sessions';
import { StabilitySession } from '../../types/stability';
import { t } from "../../i18n";

interface SessionSelectorProps {
    vehicleId: string;
    selectedSession: StabilitySession | null;
    onSelectSession: (session: StabilitySession | null) => void;
}

const SessionSelector: React.FC<SessionSelectorProps> = ({
    vehicleId,
    selectedSession,
    onSelectSession
}) => {
    const { data: sessions, isLoading, error } = useQuery({
        queryKey: ['sessions', vehicleId],
        queryFn: () => getVehicleSessions(vehicleId),
        enabled: !!vehicleId
    });

    const handleSessionChange = (event: SelectChangeEvent<string>) => {
        const sessionId = event.target.value;
        const session = sessions?.find(s => s.id === sessionId) || null;
        onSelectSession(session);
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50px">
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                {t('error_al_cargar_las_sesiones_por_favor_intente_nuevamente_1')}</Alert>
        );
    }

    if (!sessions?.length) {
        return (
            <Alert severity="info" sx={{ mt: 2 }}>
                {t('no_hay_sesiones_disponibles_para_este_vehiculo_1')}</Alert>
        );
    }

    return (
        <FormControl fullWidth>
            <InputLabel>{t('sesion_22')}</InputLabel>
            <Select
                value={selectedSession?.id || ''}
                onChange={handleSessionChange}
                label="Sesión"
            >
                {sessions.map((session) => (
                    <MenuItem key={session.id} value={session.id}>
                        {format(new Date(session.date), 'dd/MM/yyyy HH:mm', { locale: es })} - {session.duration} {t('min_26')}</MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default SessionSelector; 