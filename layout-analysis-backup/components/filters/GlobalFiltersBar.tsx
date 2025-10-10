import {
    Clear,
    Save
} from '@mui/icons-material';
import {
    Box,
    Button,
    Chip,
    FormControl,
    IconButton,
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
        presets,
        activePreset,
        vehicles,
        hasActiveFilters,
        activeFiltersCount,
        updateFilters,
        applyPreset,
        resetFilters,
        createPreset
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

    const handleClearFilters = () => {
        resetFilters();
        logger.info('Filtros reseteados');
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box
                sx={{
                    p: 0.5,
                    backgroundColor: '#f8fafc',
                    borderBottom: 1,
                    borderColor: '#e2e8f0',
                    height: 48, // Altura fija más compacta
                    width: '100%',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    overflow: 'visible',
                    flexShrink: 0,
                    boxSizing: 'border-box'
                }}
            >
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    height: '100%',
                    width: '100%'
                }}>
                    {/* Botón de preset a la izquierda */}
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Save sx={{ fontSize: 14 }} />}
                        onClick={() => setShowSaveDialog(true)}
                        disabled={!hasActiveFilters}
                        sx={{
                            fontSize: '0.8rem',
                            py: 0.5,
                            px: 1,
                            height: 32,
                            minWidth: 100
                        }}
                    >
                        Guardar Preset
                    </Button>
                    <IconButton
                        onClick={handleClearFilters}
                        disabled={!hasActiveFilters}
                        color="error"
                        size="small"
                        sx={{ height: 32, width: 32 }}
                    >
                        <Clear sx={{ fontSize: 16 }} />
                    </IconButton>

                    {/* Contador de filtros activos */}
                    {hasActiveFilters && (
                        <Chip
                            label={activeFiltersCount}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontSize: '0.6rem', height: 18, minWidth: 18 }}
                        />
                    )}

                    {/* Filtros compactos */}
                    <Box sx={{
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center',
                        flex: 1,
                        overflow: 'hidden'
                    }}>
                        {/* Vehículos */}
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                            <Select
                                multiple
                                value={filters.vehicles}
                                onChange={handleVehicleChange}
                                displayEmpty
                                sx={{ fontSize: '0.8rem', height: 32 }}
                                renderValue={(selected) => (
                                    selected.length > 0 ? (
                                        <Chip
                                            label={selected.length > 1 ? `${selected[0]}+${selected.length - 1}` : selected[0]}
                                            size="small"
                                            sx={{ fontSize: '0.7rem', height: 20 }}
                                        />
                                    ) : (
                                        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                                            Vehículos
                                        </Typography>
                                    )
                                )}
                            >
                                {vehicles.map((vehicle) => (
                                    <MenuItem key={vehicle.id} value={vehicle.id} sx={{ fontSize: '0.8rem' }}>
                                        {vehicle.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Fechas */}
                        <DatePicker
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
                                    placeholder: 'Inicio',
                                    sx: { minWidth: 100, fontSize: '0.8rem', height: 32 }
                                }
                            }}
                        />

                        <DatePicker
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
                                    placeholder: 'Fin',
                                    sx: { minWidth: 100, fontSize: '0.8rem', height: 32 }
                                }
                            }}
                        />

                        {/* Severidad */}
                        <FormControl size="small" sx={{ minWidth: 80 }}>
                            <Select
                                multiple
                                value={filters.severity}
                                onChange={handleSeverityChange}
                                displayEmpty
                                sx={{ fontSize: '0.8rem', height: 32 }}
                                renderValue={(selected) => (
                                    selected.length > 0 ? (
                                        <Box sx={{ display: 'flex', gap: 0.25 }}>
                                            {selected.map((value) => (
                                                <Chip
                                                    key={value}
                                                    label={value}
                                                    size="small"
                                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                                    color={
                                                        value === 'G' ? 'error' :
                                                            value === 'M' ? 'warning' : 'info'
                                                    }
                                                />
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                                            Severidad
                                        </Typography>
                                    )
                                )}
                            >
                                <MenuItem value="G" sx={{ fontSize: '0.8rem' }}>Grave</MenuItem>
                                <MenuItem value="M" sx={{ fontSize: '0.8rem' }}>Moderada</MenuItem>
                                <MenuItem value="L" sx={{ fontSize: '0.8rem' }}>Leve</MenuItem>
                            </Select>
                        </FormControl>

                        {/* Presets */}
                        <Box sx={{ display: 'flex', gap: 0.25 }}>
                            {presets.map((preset) => (
                                <Chip
                                    key={preset.id}
                                    label={preset.name}
                                    variant={activePreset === preset.id ? "filled" : "outlined"}
                                    color={activePreset === preset.id ? "primary" : "default"}
                                    onClick={() => applyPreset(preset.id)}
                                    size="small"
                                    sx={{ fontSize: '0.7rem', height: 24 }}
                                />
                            ))}
                        </Box>
                    </Box>
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
                            minWidth: 300
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
            </Box>
        </LocalizationProvider>
    );
};

export default GlobalFiltersBar;