import {
    Box,
    Button,
    Chip,
    FormControl,
    MenuItem,
    Select,
    TextField,
    Typography
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import React, { useState } from 'react';
import { useGlobalFilters } from '../../hooks/useGlobalFilters';
import { logger } from '../../utils/logger';

const GlobalFiltersBar: React.FC = () => {
    const {
        filters,
        vehicles,
        fireStations,
        selectedFireStation,
        updateFilters,
        createPreset,
        selectFireStation
    } = useGlobalFilters();

    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [presetName, setPresetName] = useState('');

    const handleVehicleChange = (event: any) => {
        const value = event.target.value;
        updateFilters({ vehicles: typeof value === 'string' ? value.split(',') : value });
    };

    const handleSeverityChange = (event: any) => {
        const value = event.target.value;
        updateFilters({ severity: typeof value === 'string' ? value.split(',') : value });
    };

    const handleSavePreset = () => {
        if (presetName.trim()) {
            createPreset(presetName.trim(), filters);
            setPresetName('');
            setShowSaveDialog(false);
            logger.info('Preset guardado:', presetName);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box
                sx={{
                    width: '100%',
                    height: '64px',
                    backgroundColor: 'transparent',
                    borderBottom: '1px solid #e2e8f0',
                    boxShadow: 'none',
                    display: 'flex !important',
                    alignItems: 'center !important',
                    justifyContent: 'center !important',
                    padding: '24px 20px 0 20px !important',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    gap: '12px'
                }}
            >
                {/* Botones de preset con texto completo */}
                <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                        // cambio aquí: mapear "Hoy" a las fechas reales de los datos
                        updateFilters({
                            dateRange: {
                                start: '2025-09-29',
                                end: '2025-10-08'
                            }
                        });
                    }}
                    sx={{
                        fontSize: '0.65rem !important',
                        height: '36px !important',
                        minWidth: '50px !important',
                        backgroundColor: '#fef3c7',
                        borderColor: '#f59e0b',
                        color: '#f59e0b',
                        padding: '0 8px',
                        flexShrink: 0,
                        fontWeight: 'bold',
                        textTransform: 'none'
                    }}
                >
                    Hoy
                </Button>

                <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                        const today = new Date();
                        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        updateFilters({
                            dateRange: {
                                start: weekAgo.toISOString().split('T')[0] || '',
                                end: today.toISOString().split('T')[0] || ''
                            }
                        });
                    }}
                    sx={{
                        fontSize: '0.65rem !important',
                        height: '36px !important',
                        minWidth: '75px !important',
                        backgroundColor: '#dbeafe',
                        borderColor: '#3b82f6',
                        color: '#3b82f6',
                        padding: '0 8px',
                        flexShrink: 0,
                        fontWeight: 'bold',
                        textTransform: 'none'
                    }}
                >
                    Esta Semana
                </Button>

                <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                        const today = new Date();
                        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                        updateFilters({
                            dateRange: {
                                start: monthAgo.toISOString().split('T')[0] || '',
                                end: today.toISOString().split('T')[0] || ''
                            }
                        });
                    }}
                    sx={{
                        fontSize: '0.65rem !important',
                        height: '36px !important',
                        minWidth: '70px !important',
                        backgroundColor: '#f0f9ff',
                        borderColor: '#0ea5e9',
                        color: '#0ea5e9',
                        padding: '0 8px',
                        flexShrink: 0,
                        fontWeight: 'bold',
                        textTransform: 'none'
                    }}
                >
                    Este Mes
                </Button>

                <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                        updateFilters({
                            dateRange: {
                                start: '',
                                end: ''
                            },
                            vehicles: [],
                            severity: []
                        });
                    }}
                    sx={{
                        fontSize: '0.65rem !important',
                        height: '36px !important',
                        minWidth: '50px !important',
                        backgroundColor: '#f0fdf4',
                        borderColor: '#22c55e',
                        color: '#22c55e',
                        padding: '0 8px',
                        flexShrink: 0,
                        fontWeight: 'bold',
                        textTransform: 'none'
                    }}
                >
                    Todo
                </Button>

                {/* Select Parque */}
                <FormControl size="small" sx={{ minWidth: '110px !important', flexShrink: 0 }}>
                    <Select
                        value={selectedFireStation}
                        onChange={(e) => selectFireStation(e.target.value)}
                        displayEmpty
                        sx={{ fontSize: '0.75rem !important', height: '36px !important' }}
                        renderValue={(selected) => {
                            if (!selected) {
                                return (
                                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                        Parque
                                    </Typography>
                                );
                            }
                            const station = fireStations.find((s: any) => s.id === selected);
                            return (
                                <Typography sx={{ fontSize: '0.75rem', color: 'text.primary' }}>
                                    {station?.name || selected}
                                </Typography>
                            );
                        }}
                    >
                        <MenuItem value="" sx={{ fontSize: '0.75rem' }}>Todos los Parques</MenuItem>
                        {fireStations.map((station: any) => (
                            <MenuItem key={station.id} value={station.id} sx={{ fontSize: '0.75rem' }}>
                                {station.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Select Vehículos */}
                <FormControl size="small" sx={{ minWidth: '110px !important', flexShrink: 0 }}>
                    <Select
                        multiple
                        value={filters.vehicles}
                        onChange={handleVehicleChange}
                        displayEmpty
                        sx={{ fontSize: '0.75rem !important', height: '36px !important' }}
                        renderValue={(selected) => {
                            if (selected.length === 0) {
                                return (
                                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                        Vehículos
                                    </Typography>
                                );
                            }

                            // Mostrar nombre del primer vehículo seleccionado
                            // Buscar por id O por identifier (para retrocompatibilidad)
                            const firstVehicle = vehicles.find(v =>
                                v.id === selected[0] ||
                                v.identifier === selected[0] ||
                                v.dobackId === selected[0]
                            );
                            const label = selected.length > 1
                                ? `${firstVehicle?.name || selected[0]} +${selected.length - 1}`
                                : firstVehicle?.name || selected[0];

                            return (
                                <Chip
                                    label={label}
                                    size="small"
                                    sx={{ fontSize: '0.7rem', height: '26px' }}
                                />
                            );
                        }}
                    >
                        {vehicles.map((vehicle) => (
                            <MenuItem key={vehicle.id} value={vehicle.id} sx={{ fontSize: '0.75rem' }}>
                                {vehicle.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <DatePicker
                    label="Inicio"
                    value={filters.dateRange.start ? new Date(filters.dateRange.start) : null}
                    onChange={(date) => {
                        updateFilters({
                            dateRange: {
                                ...filters.dateRange,
                                start: date ? date.toISOString().split('T')[0] || '' : ''
                            }
                        });
                    }}
                    slotProps={{
                        textField: {
                            size: 'small',
                            sx: {
                                fontSize: '0.75rem !important',
                                height: '36px !important',
                                minWidth: '120px !important',
                                flexShrink: 0
                            }
                        }
                    }}
                />

                <DatePicker
                    label="Fin"
                    value={filters.dateRange.end ? new Date(filters.dateRange.end) : null}
                    onChange={(date) => {
                        updateFilters({
                            dateRange: {
                                ...filters.dateRange,
                                end: date ? date.toISOString().split('T')[0] || '' : ''
                            }
                        });
                    }}
                    slotProps={{
                        textField: {
                            size: 'small',
                            sx: {
                                fontSize: '0.75rem !important',
                                height: '36px !important',
                                minWidth: '120px !important',
                                flexShrink: 0
                            }
                        }
                    }}
                />

                <FormControl size="small" sx={{ minWidth: '110px !important', flexShrink: 0 }}>
                    <Select
                        multiple
                        value={filters.severity}
                        onChange={handleSeverityChange}
                        displayEmpty
                        sx={{ fontSize: '0.75rem !important', height: '36px !important' }}
                        renderValue={(selected) => (
                            selected.length > 0 ? (
                                <Chip
                                    label={selected.length > 1 ? `${selected[0]}+${selected.length - 1}` : selected[0]}
                                    size="small"
                                    sx={{ fontSize: '0.7rem', height: '26px' }}
                                />
                            ) : (
                                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                    Severidad
                                </Typography>
                            )
                        )}
                    >
                        <MenuItem value="low" sx={{ fontSize: '0.75rem' }}>Baja</MenuItem>
                        <MenuItem value="medium" sx={{ fontSize: '0.75rem' }}>Media</MenuItem>
                        <MenuItem value="high" sx={{ fontSize: '0.75rem' }}>Alta</MenuItem>
                        <MenuItem value="critical" sx={{ fontSize: '0.75rem' }}>Crítica</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Dialog para guardar preset */}
            {showSaveDialog && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'background.paper',
                        p: 3,
                        borderRadius: 2,
                        boxShadow: 3,
                        zIndex: 2000,
                        minWidth: 400
                    }}
                >
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Guardar Preset
                    </Typography>
                    <TextField
                        fullWidth
                        label="Nombre del preset"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        size="small"
                        sx={{ mb: 2 }}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleSavePreset();
                            }
                        }}
                    />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button onClick={() => setShowSaveDialog(false)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSavePreset}
                            disabled={!presetName.trim()}
                        >
                            Guardar
                        </Button>
                    </Box>
                </Box>
            )}
        </LocalizationProvider>
    );
};

export default GlobalFiltersBar;