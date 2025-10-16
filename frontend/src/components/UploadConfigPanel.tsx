/**
 * ⚙️ PANEL DE CONFIGURACIÓN DEL SISTEMA DE UPLOAD
 * 
 * Permite configurar las reglas de procesamiento directamente desde la UI.
 */

import {
    CheckCircle as CheckCircleIcon,
    ExpandMore as ExpandMoreIcon,
    Refresh as RefreshIcon,
    Save as SaveIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Card,
    Chip,
    Divider,
    FormControl,
    FormControlLabel,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface UploadConfig {
    requiredFiles: {
        estabilidad: boolean;
        gps: boolean;
        rotativo: boolean;
    };
    minSessionDuration: number;
    maxSessionDuration: number;
    allowedVehicles: string[];
    correlationThresholdSeconds: number;
    sessionGapSeconds: number;
    minMeasurements: {
        estabilidad: number;
        gps: number;
        rotativo: number;
    };
    allowNoGPS: boolean;
    skipDuplicates: boolean;
    allowedDates: string[];
}

const DEFAULT_CONFIG: UploadConfig = {
    requiredFiles: {
        estabilidad: true,
        gps: false,
        rotativo: true
    },
    minSessionDuration: 60,
    maxSessionDuration: 0,
    allowedVehicles: [],
    correlationThresholdSeconds: 120,
    sessionGapSeconds: 300,
    minMeasurements: {
        estabilidad: 10,
        gps: 0,
        rotativo: 10
    },
    allowNoGPS: true,
    skipDuplicates: true,
    allowedDates: []
};

const PRESETS = {
    production: {
        name: '🏭 Producción (Defecto)',
        description: 'Configuración estándar para uso normal',
        config: DEFAULT_CONFIG
    },
    testing: {
        name: '🧪 Testing (GPS Obligatorio)',
        description: 'GPS obligatorio, >= 4m 40s, correlación 5min - Ajustado para análisis real',
        config: {
            requiredFiles: { estabilidad: true, gps: true, rotativo: true },
            minSessionDuration: 230, // ✅ 3m 50s (captura todas las sesiones "~ 5 min")
            maxSessionDuration: 0, // Sin límite (permite sesiones muy largas)
            allowedVehicles: [], // Todos los vehículos
            correlationThresholdSeconds: 300, // ✅ 5 min (GPS con arranque lento)
            sessionGapSeconds: 300,
            minMeasurements: { estabilidad: 10, gps: 0, rotativo: 10 },
            allowNoGPS: false,
            skipDuplicates: true,
            allowedDates: [] // Todas las fechas
        }
    },
    permissive: {
        name: '🔓 Permisivo (Flexible)',
        description: 'Acepta todo, sin validaciones',
        config: {
            requiredFiles: { estabilidad: false, gps: false, rotativo: false },
            minSessionDuration: 0,
            maxSessionDuration: 0,
            allowedVehicles: [],
            correlationThresholdSeconds: 300,
            sessionGapSeconds: 600,
            minMeasurements: { estabilidad: 0, gps: 0, rotativo: 0 },
            allowNoGPS: true,
            skipDuplicates: false,
            allowedDates: []
        }
    }
};

interface Props {
    onConfigChange?: (config: UploadConfig) => void;
}

export const UploadConfigPanel: React.FC<Props> = ({ onConfigChange }) => {
    const [config, setConfig] = useState<UploadConfig>(DEFAULT_CONFIG);
    const [savedConfig, setSavedConfig] = useState<UploadConfig>(DEFAULT_CONFIG);
    const [hasChanges, setHasChanges] = useState(false);
    const [vehicleInput, setVehicleInput] = useState('');
    const [dateInput, setDateInput] = useState('');

    // Cargar configuración guardada al montar
    useEffect(() => {
        const saved = localStorage.getItem('uploadConfig');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setConfig(parsed);
                setSavedConfig(parsed);
            } catch (e) {
                console.error('Error cargando configuración:', e);
            }
        }
    }, []);

    // Detectar cambios
    useEffect(() => {
        setHasChanges(JSON.stringify(config) !== JSON.stringify(savedConfig));
    }, [config, savedConfig]);

    const handleSave = () => {
        localStorage.setItem('uploadConfig', JSON.stringify(config));
        setSavedConfig(config);
        setHasChanges(false);
        if (onConfigChange) {
            onConfigChange(config);
        }
    };

    const handleReset = () => {
        setConfig(savedConfig);
        setHasChanges(false);
    };

    const handlePresetChange = (presetKey: string) => {
        if (presetKey && PRESETS[presetKey as keyof typeof PRESETS]) {
            setConfig(PRESETS[presetKey as keyof typeof PRESETS].config);
        }
    };

    const addVehicle = () => {
        if (vehicleInput && !config.allowedVehicles.includes(vehicleInput)) {
            setConfig({
                ...config,
                allowedVehicles: [...config.allowedVehicles, vehicleInput]
            });
            setVehicleInput('');
        }
    };

    const removeVehicle = (vehicle: string) => {
        setConfig({
            ...config,
            allowedVehicles: config.allowedVehicles.filter(v => v !== vehicle)
        });
    };

    const addDate = () => {
        if (dateInput && !config.allowedDates.includes(dateInput)) {
            setConfig({
                ...config,
                allowedDates: [...config.allowedDates, dateInput]
            });
            setDateInput('');
        }
    };

    const removeDate = (date: string) => {
        setConfig({
            ...config,
            allowedDates: config.allowedDates.filter(d => d !== date)
        });
    };

    const formatDuration = (seconds: number): string => {
        if (seconds === 0) return 'Sin límite';
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}min`;
    };

    return (
        <Card sx={{ mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
            <Accordion defaultExpanded={false}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6">
                            ⚙️ Configuración de Procesamiento
                        </Typography>
                        {hasChanges && (
                            <Chip
                                label="Cambios sin guardar"
                                size="small"
                                color="warning"
                                sx={{ ml: 2 }}
                            />
                        )}
                    </Box>
                </AccordionSummary>

                <AccordionDetails>
                    {/* PRESETS */}
                    <Box sx={{ mb: 3 }}>
                        <FormControl fullWidth>
                            <InputLabel>Perfil Predefinido</InputLabel>
                            <Select
                                value=""
                                label="Perfil Predefinido"
                                onChange={(e) => handlePresetChange(e.target.value)}
                            >
                                <MenuItem value="">Seleccionar perfil...</MenuItem>
                                {Object.entries(PRESETS).map(([key, preset]) => (
                                    <MenuItem key={key} value={key}>
                                        <Box>
                                            <Typography variant="body1">{preset.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {preset.description}
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* ARCHIVOS OBLIGATORIOS */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                            📋 Archivos Obligatorios
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={config.requiredFiles.estabilidad}
                                            onChange={(e) => setConfig({
                                                ...config,
                                                requiredFiles: { ...config.requiredFiles, estabilidad: e.target.checked }
                                            })}
                                        />
                                    }
                                    label="ESTABILIDAD"
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={config.requiredFiles.gps}
                                            onChange={(e) => setConfig({
                                                ...config,
                                                requiredFiles: { ...config.requiredFiles, gps: e.target.checked }
                                            })}
                                        />
                                    }
                                    label="GPS"
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={config.requiredFiles.rotativo}
                                            onChange={(e) => setConfig({
                                                ...config,
                                                requiredFiles: { ...config.requiredFiles, rotativo: e.target.checked }
                                            })}
                                        />
                                    }
                                    label="ROTATIVO"
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* DURACIÓN DE SESIÓN */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                            ⏱️ Duración de Sesión
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Duración Mínima (segundos)"
                                    value={config.minSessionDuration}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        minSessionDuration: parseInt(e.target.value) || 0
                                    })}
                                    helperText={formatDuration(config.minSessionDuration)}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Duración Máxima (0 = sin límite)"
                                    value={config.maxSessionDuration}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        maxSessionDuration: parseInt(e.target.value) || 0
                                    })}
                                    helperText={formatDuration(config.maxSessionDuration)}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* VEHÍCULOS PERMITIDOS */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                            🚗 Vehículos Permitidos {config.allowedVehicles.length === 0 && '(Todos)'}
                        </Typography>
                        <FormControl fullWidth sx={{ mb: 1 }}>
                            <InputLabel>Seleccionar vehículo</InputLabel>
                            <Select
                                value=""
                                label="Seleccionar vehículo"
                                onChange={(e) => {
                                    const vehicle = e.target.value;
                                    if (vehicle && !config.allowedVehicles.includes(vehicle)) {
                                        setConfig({
                                            ...config,
                                            allowedVehicles: [...config.allowedVehicles, vehicle]
                                        });
                                    }
                                }}
                            >
                                <MenuItem value="">Seleccionar...</MenuItem>
                                <MenuItem value="DOBACK023">DOBACK023</MenuItem>
                                <MenuItem value="DOBACK024">DOBACK024</MenuItem>
                                <MenuItem value="DOBACK026">DOBACK026</MenuItem>
                                <MenuItem value="DOBACK027">DOBACK027</MenuItem>
                                <MenuItem value="DOBACK028">DOBACK028</MenuItem>
                            </Select>
                        </FormControl>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {config.allowedVehicles.length === 0 && (
                                <Chip label="Todos los vehículos" color="default" />
                            )}
                            {config.allowedVehicles.map(vehicle => (
                                <Chip
                                    key={vehicle}
                                    label={vehicle}
                                    onDelete={() => removeVehicle(vehicle)}
                                    color="primary"
                                />
                            ))}
                        </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* FECHAS PERMITIDAS */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                            📅 Rango de Fechas {config.allowedDates.length === 0 && '(Todas)'}
                        </Typography>

                        {/* Rangos predefinidos */}
                        <Grid container spacing={1} sx={{ mb: 2 }}>
                            <Grid item xs={4}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                        const today = new Date();
                                        const dateStr = today.toISOString().split('T')[0];
                                        setConfig({ ...config, allowedDates: [dateStr] });
                                    }}
                                >
                                    Solo Hoy
                                </Button>
                            </Grid>
                            <Grid item xs={4}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                        const dates: string[] = [];
                                        const today = new Date();
                                        for (let i = 0; i < 30; i++) {
                                            const date = new Date(today);
                                            date.setDate(date.getDate() - i);
                                            dates.push(date.toISOString().split('T')[0]);
                                        }
                                        setConfig({ ...config, allowedDates: dates });
                                    }}
                                >
                                    Último Mes
                                </Button>
                            </Grid>
                            <Grid item xs={4}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                        setConfig({ ...config, allowedDates: [] });
                                    }}
                                >
                                    Todas
                                </Button>
                            </Grid>
                        </Grid>

                        {/* Selector manual de fecha */}
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Agregar fecha específica"
                                value={dateInput}
                                onChange={(e) => setDateInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addDate()}
                                InputLabelProps={{ shrink: true }}
                            />
                            <Button variant="contained" onClick={addDate}>
                                Agregar
                            </Button>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', maxHeight: 100, overflow: 'auto' }}>
                            {config.allowedDates.length === 0 && (
                                <Chip label="Todas las fechas" color="default" />
                            )}
                            {config.allowedDates.length > 5 && (
                                <Chip label={`${config.allowedDates.length} fechas seleccionadas`} color="primary" />
                            )}
                            {config.allowedDates.length > 0 && config.allowedDates.length <= 5 && config.allowedDates.map(date => (
                                <Chip
                                    key={date}
                                    label={date}
                                    onDelete={() => removeDate(date)}
                                    color="primary"
                                />
                            ))}
                        </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* CONFIGURACIÓN AVANZADA */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                            🔧 Configuración Avanzada
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={config.allowNoGPS}
                                            onChange={(e) => setConfig({ ...config, allowNoGPS: e.target.checked })}
                                        />
                                    }
                                    label="Permitir sesiones sin GPS"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={config.skipDuplicates}
                                            onChange={(e) => setConfig({ ...config, skipDuplicates: e.target.checked })}
                                        />
                                    }
                                    label="Omitir sesiones duplicadas"
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Umbral Correlación (segundos)"
                                    value={config.correlationThresholdSeconds}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        correlationThresholdSeconds: parseInt(e.target.value) || 120
                                    })}
                                    helperText="Diferencia máxima entre archivos para correlacionar"
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Gap Temporal (segundos)"
                                    value={config.sessionGapSeconds}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        sessionGapSeconds: parseInt(e.target.value) || 300
                                    })}
                                    helperText="Pausa mínima para detectar nueva sesión"
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* RESUMEN */}
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                            <strong>Configuración Actual:</strong><br />
                            • Archivos obligatorios: {Object.entries(config.requiredFiles).filter(([_, v]) => v).map(([k]) => k.toUpperCase()).join(', ') || 'Ninguno'}<br />
                            • Duración: {formatDuration(config.minSessionDuration)} - {formatDuration(config.maxSessionDuration)}<br />
                            • Vehículos: {config.allowedVehicles.length > 0 ? config.allowedVehicles.join(', ') : 'Todos'}<br />
                            • Fechas: {config.allowedDates.length > 0 ? config.allowedDates.join(', ') : 'Todas'}
                        </Typography>
                    </Alert>

                    {/* BOTONES */}
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={handleReset}
                            disabled={!hasChanges}
                        >
                            Descartar Cambios
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={hasChanges ? <SaveIcon /> : <CheckCircleIcon />}
                            onClick={handleSave}
                            disabled={!hasChanges}
                            color={hasChanges ? 'primary' : 'success'}
                        >
                            {hasChanges ? 'Guardar Configuración' : 'Configuración Guardada'}
                        </Button>
                    </Box>
                </AccordionDetails>
            </Accordion>
        </Card>
    );
};

