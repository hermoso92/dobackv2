import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Warning as WarningIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getSession } from '../../services/sessions';
import { SessionWithDetails } from '../../types/session';
import { t } from "../../i18n";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SessionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const sessionId = parseInt(id || '0', 10);

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId),
    enabled: !!sessionId,
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !session) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {t('error_al_cargar_los_detalles_de_la_sesion_por_favor_intente_nuevamente')}</Alert>
    );
  }

  const chartData = {
    labels: session.interpolated_data.map((d) =>
      format(new Date(d.timestamp), 'HH:mm:ss')
    ),
    datasets: [
      {
        label: 'Roll',
        data: session.interpolated_data.map((d) => d.roll),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Pitch',
        data: session.interpolated_data.map((d) => d.pitch),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
      {
        label: 'Velocidad',
        data: session.interpolated_data.map((d) => d.speed * 3.6), // Convertir a km/h
        borderColor: 'rgb(54, 162, 235)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Datos de la Sesión',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" gutterBottom>
                {t('sesion_21')}{session.session_number}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {format(new Date(session.session_timestamp), 'PPp', { locale: es })}
              </Typography>
              <Box display="flex" gap={1} mt={2}>
                <Chip
                  icon={<TimelineIcon />}
                  label={`${Math.round(session.session_duration / 60)} min`}
                  variant="outlined"
                />
                <Chip
                  icon={<SpeedIcon />}
                  label={session.session_type}
                  variant="outlined"
                />
                <Chip
                  icon={<WarningIcon />}
                  label={session.session_status}
                  color={
                    session.session_status === 'completed'
                      ? 'success'
                      : session.session_status === 'in_progress'
                      ? 'warning'
                      : 'error'
                  }
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  {t('resumen')}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('eventos_3')}</Typography>
                    <Typography variant="h6">
                      {session.events.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('puntos_de_datos')}</Typography>
                    <Typography variant="h6">
                      {session.interpolated_data.length}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        {t('graficos')}</Typography>
      <Divider sx={{ mb: 3 }} />
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Line data={chartData} options={chartOptions} />
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        {t('eventos_4')}</Typography>
      <Divider sx={{ mb: 3 }} />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('timestamp_1')}</TableCell>
              <TableCell>{t('tipo_23')}</TableCell>
              <TableCell>{t('severidad_2')}</TableCell>
              <TableCell>{t('descripcion_3')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {session.events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  {format(new Date(event.timestamp), 'PPp', { locale: es })}
                </TableCell>
                <TableCell>{event.event_type}</TableCell>
                <TableCell>
                  <Chip
                    label={event.severity}
                    color={
                      event.severity === 'critical'
                        ? 'error'
                        : event.severity === 'warning'
                        ? 'warning'
                        : 'info'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>{event.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SessionDetails; 