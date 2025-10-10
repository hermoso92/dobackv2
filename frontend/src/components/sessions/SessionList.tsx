import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getVehicleSessions } from '../../services/sessions';
import { StabilitySession } from '../../types/session';
import { t } from "../../i18n";

interface SessionListProps {
  vehicleId: number;
}

const statusColors = {
  completed: 'success',
  in_progress: 'warning',
  error: 'error',
} as const;

const SessionList: React.FC<SessionListProps> = ({ vehicleId }) => {
  const navigate = useNavigate();

  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['sessions', vehicleId],
    queryFn: () => getVehicleSessions(vehicleId),
  });

  const handleViewSession = (sessionId: number) => {
    navigate(`/sessions/${sessionId}`);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {t('error_al_cargar_las_sesiones_por_favor_intente_nuevamente')}</Alert>
    );
  }

  if (!sessions?.length) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        {t('no_hay_sesiones_disponibles_para_este_vehiculo')}</Alert>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('numero')}</TableCell>
            <TableCell>{t('fecha_10')}</TableCell>
            <TableCell>{t('duracion_5')}</TableCell>
            <TableCell>{t('tipo_24')}</TableCell>
            <TableCell>{t('estado_21')}</TableCell>
            <TableCell align="right">{t('acciones_15')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell>{session.session_number}</TableCell>
              <TableCell>
                {format(new Date(session.session_timestamp), 'PPp', { locale: es })}
              </TableCell>
              <TableCell>
                {Math.round(session.session_duration / 60)} {t('min_25')}</TableCell>
              <TableCell>{session.session_type}</TableCell>
              <TableCell>
                <Chip
                  label={session.session_status}
                  color={statusColors[session.session_status as keyof typeof statusColors] || 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Ver detalles">
                  <IconButton
                    size="small"
                    onClick={() => handleViewSession(session.id)}
                  >
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SessionList; 