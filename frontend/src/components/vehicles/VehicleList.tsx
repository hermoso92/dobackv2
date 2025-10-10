import { ExpandLess, ExpandMore, Search as SearchIcon } from '@mui/icons-material';
import { Box, CircularProgress, Collapse, InputAdornment, List, ListItemButton, ListItemText, TextField } from '@mui/material';
import React from 'react';
import { t } from "../../i18n";
import { Vehicle } from '../../types/vehicle';
import { formatDate } from '../../utils/date';

interface Session {
  id: string;
  vehicleId: string;
  startTime: string;
  endTime: string | null;
  status: string;
}

interface VehicleListProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  onSelectVehicle: (vehicle: Vehicle | null) => void;
  loading: boolean;
  sessions?: Session[];
  onSelectSession?: (sessionId: string) => void;
  selectedSession?: string | null;
}

const VehicleList: React.FC<VehicleListProps> = ({
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  loading,
  sessions = [],
  onSelectSession,
  selectedSession
}) => {
  const [expandedVehicle, setExpandedVehicle] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState<string>('');

  const filteredVehicles = React.useMemo(() => {
    if (!search) return vehicles;
    const s = search.toLowerCase();
    return vehicles.filter(v => (v.licensePlate || v.plate || '').toLowerCase().includes(s));
  }, [vehicles, search]);

  const handleVehicleClick = (vehicle: Vehicle) => {
    if (expandedVehicle === vehicle.id) {
      setExpandedVehicle(null);
    } else {
      setExpandedVehicle(vehicle.id);
    }
    onSelectVehicle(vehicle);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box px={1} pb={1}>
        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          variant="outlined"
          size="small"
          placeholder={t('buscar_vehiculo')}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            )
          }}
        />
      </Box>
      <List>
        {filteredVehicles.map((vehicle) => (
          <React.Fragment key={vehicle.id}>
            <ListItemButton
              selected={selectedVehicle?.id === vehicle.id}
              onClick={() => handleVehicleClick(vehicle)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'transparent !important',
                  color: 'inherit'
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'rgba(0,0,0,0.04) !important'
                }
              }}
            >
              <ListItemText
                primary={vehicle.licensePlate || vehicle.plate || vehicle.name}
                primaryTypographyProps={{
                  variant: 'h6',
                  style: { fontWeight: 'bold' }
                }}
              />
              {expandedVehicle === vehicle.id ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={expandedVehicle === vehicle.id} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {sessions
                  .filter(session => session.vehicleId === vehicle.id)
                  .map(session => (
                    <ListItemButton
                      key={session.id}
                      sx={{ pl: 4, '&.Mui-selected': { backgroundColor: 'transparent !important', color: 'inherit' }, '&.Mui-selected:hover': { backgroundColor: 'rgba(0,0,0,0.04)' } }}
                      selected={selectedSession === session.id}
                      onClick={() => onSelectSession?.(session.id)}
                    >
                      <ListItemText
                        primary={`Inicio: ${formatDate(session.startTime)}`}
                      />
                    </ListItemButton>
                  ))}
              </List>
            </Collapse>
          </React.Fragment>
        ))}
      </List>
    </>
  );
};

export default VehicleList; 