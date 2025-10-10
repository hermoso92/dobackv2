import {
  Build as BuildIcon,
  DirectionsCar as CarIcon,
  Event as EventIcon,
  LocalFireDepartment as FireIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
  WaterDrop as WaterDropIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useParams } from 'react-router-dom';
import { getVehicleWithStats } from '../../services/vehicles';
import { formatDate } from '../../utils/date';
import { t } from "../../i18n";

const VehicleDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const vehicleId = parseInt(id || '0', 10);

  const { data: vehicle, isLoading, error } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => getVehicleWithStats(vehicleId),
    enabled: !!vehicleId,
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !vehicle) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {t('error_al_cargar_los_detalles_del_vehiculo_por_favor_intente_nuevamente')}</Alert>
    );
  }

  const { stats } = vehicle;

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" mb={2}>
                <CarIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h5" component="div">
                    {vehicle.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {vehicle.brand} {vehicle.model}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('matricula_5')}{vehicle.plateNumber}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={vehicle.status}
                color={
                  vehicle.status === 'ACTIVE'
                    ? 'success'
                    : vehicle.status === 'MAINTENANCE'
                      ? 'warning'
                      : 'default'
                }
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <TimelineIcon sx={{ fontSize: 24, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6">{stats.totalSessions}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('sesiones_totales')}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <WarningIcon sx={{ fontSize: 24, color: 'error.main', mb: 1 }} />
                    <Typography variant="h6">{stats.activeAlarms}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('alertas_activas_1')}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <SpeedIcon sx={{ fontSize: 24, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6">
                      {stats.averageSpeed.toFixed(1)} {t('kmh_14')}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('velocidad_promedio_2')}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <WaterDropIcon sx={{ fontSize: 24, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6">
                      {stats.waterPressure.toFixed(1)} {t('bar')}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('presion_de_agua')}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <FireIcon sx={{ fontSize: 24, color: 'error.main', mb: 1 }} />
                    <Typography variant="h6">
                      {stats.foamConcentration.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('concentracion_espuma')}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <BuildIcon sx={{ fontSize: 24, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6">
                      {stats.nextMaintenance ? formatDate(stats.nextMaintenance) : 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('proximo_mantenimiento_1')}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('ultimos_eventos')}</Typography>
              <List>
                {vehicle.events?.map((event: any) => (
                  <ListItem key={event.id}>
                    <ListItemIcon>
                      <EventIcon color={event.severity === 'HIGH' ? 'error' : 'warning'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={event.message}
                      secondary={formatDate(event.timestamp)}
                    />
                  </ListItem>
                ))}
                {!vehicle.events?.length && (
                  <ListItem>
                    <ListItemText primary="No hay eventos registrados" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('ultimas_sesiones')}</Typography>
              <List>
                {vehicle.stabilitySessions?.map((session: any) => (
                  <ListItem key={session.id}>
                    <ListItemIcon>
                      <TimelineIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Sesión de estabilidad`}
                      secondary={formatDate(session.date)}
                    />
                  </ListItem>
                ))}
                {!vehicle.stabilitySessions?.length && (
                  <ListItem>
                    <ListItemText primary="No hay sesiones registradas" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VehicleDetails; 