import {
    Add as AddIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import {
    Button,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField
} from '@mui/material';
import React from 'react';

interface GeofenceFiltersProps {
    searchTerm: string;
    typeFilter: string;
    priorityFilter: string;
    statusFilter: string;
    loading: boolean;
    onSearchChange: (value: string) => void;
    onTypeFilterChange: (value: string) => void;
    onPriorityFilterChange: (value: string) => void;
    onStatusFilterChange: (value: string) => void;
    onCreateRealData: () => void;
    onCreateGeofence: () => void;
}

export const GeofenceFilters: React.FC<GeofenceFiltersProps> = ({
    searchTerm,
    typeFilter,
    priorityFilter,
    statusFilter,
    loading,
    onSearchChange,
    onTypeFilterChange,
    onPriorityFilterChange,
    onStatusFilterChange,
    onCreateRealData,
    onCreateGeofence
}) => {
    return (
        <Stack direction="row" spacing={2}>
            <TextField
                size="small"
                placeholder="Buscar geofences..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Tipo</InputLabel>
                <Select
                    value={typeFilter}
                    label="Tipo"
                    onChange={(e) => onTypeFilterChange(e.target.value)}
                >
                    <MenuItem value="ALL">Todos</MenuItem>
                    <MenuItem value="circle">Círculo</MenuItem>
                    <MenuItem value="polygon">Polígono</MenuItem>
                    <MenuItem value="rectangle">Rectángulo</MenuItem>
                </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Prioridad</InputLabel>
                <Select
                    value={priorityFilter}
                    label="Prioridad"
                    onChange={(e) => onPriorityFilterChange(e.target.value)}
                >
                    <MenuItem value="ALL">Todas</MenuItem>
                    <MenuItem value="critical">Crítica</MenuItem>
                    <MenuItem value="high">Alta</MenuItem>
                    <MenuItem value="medium">Media</MenuItem>
                    <MenuItem value="low">Baja</MenuItem>
                </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Estado</InputLabel>
                <Select
                    value={statusFilter}
                    label="Estado"
                    onChange={(e) => onStatusFilterChange(e.target.value)}
                >
                    <MenuItem value="ALL">Todos</MenuItem>
                    <MenuItem value="ACTIVE">Activos</MenuItem>
                    <MenuItem value="INACTIVE">Inactivos</MenuItem>
                </Select>
            </FormControl>
            <Button
                variant="outlined"
                startIcon={loading ? <CircularProgress size={16} /> : <AddIcon />}
                onClick={onCreateRealData}
                disabled={loading}
                sx={{ mr: 1 }}
            >
                {loading ? 'Creando...' : 'Crear Datos Reales'}
            </Button>
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onCreateGeofence}
            >
                Nuevo Geofence
            </Button>
        </Stack>
    );
};


