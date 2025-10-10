import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  Speed as SpeedIcon,
  Warning as WarningIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { VehicleWithStats } from '../../types/vehicle';
import { t } from "../../i18n";

interface VehicleCardProps {
  vehicle: VehicleWithStats;
}

const statusColors = {
  active: 'success',
  inactive: 'default',
  maintenance: 'warning',
} as const;

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle }) => {
  const navigate = useNavigate();
  const { stats } = vehicle;

  const handleClick = () => {
    navigate(`/vehicles/${vehicle.id}`);
  };

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        },
      }}
      onClick={handleClick}
    >
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <CarIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Box flex={1}>
            <Typography variant="h6" component="div">
              {vehicle.plate}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {vehicle.brand} {vehicle.model} ({vehicle.year})
            </Typography>
          </Box>
          <Chip
            label={vehicle.status}
            color={statusColors[vehicle.status]}
            size="small"
          />
        </Box>

        <Box display="flex" justifyContent="space-between" mt={2}>
          <Tooltip title="Sesiones totales">
            <Box display="flex" alignItems="center">
              <TimelineIcon sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
              <Typography variant="body2">{stats.total_sessions}</Typography>
            </Box>
          </Tooltip>

          <Tooltip title="Velocidad promedio">
            <Box display="flex" alignItems="center">
              <SpeedIcon sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
              <Typography variant="body2">
                {stats.total_distance > 0
                  ? `${(stats.total_distance / stats.total_duration * 3.6).toFixed(1)} km/h`
                  : '0 km/h'}
              </Typography>
            </Box>
          </Tooltip>

          <Tooltip title="Eventos críticos">
            <Box display="flex" alignItems="center">
              <WarningIcon
                sx={{
                  fontSize: 20,
                  color: stats.last_critical_event ? 'error.main' : 'text.secondary',
                  mr: 1,
                }}
              />
              <Typography variant="body2">
                {stats.sessions_with_events}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};

export default VehicleCard; 