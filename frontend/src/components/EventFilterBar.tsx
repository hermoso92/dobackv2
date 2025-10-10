import RefreshIcon from '@mui/icons-material/Refresh';
import { AppBar, Box, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Select, Switch, Toolbar, Typography } from '@mui/material';
import React from 'react';

interface EventFilterBarProps {
    maxSpeed?: number;
    speedFilter: 'all' | '80' | '120';
    onSpeedFilterChange: (value: 'all' | '80' | '120') => void;
    rotativoOnly: boolean;
    onRotativoToggle: (value: boolean) => void;
    onRefresh: () => void;
}

const EventFilterBar: React.FC<EventFilterBarProps> = ({
    maxSpeed,
    speedFilter,
    onSpeedFilterChange,
    rotativoOnly,
    onRotativoToggle,
    onRefresh
}) => {
    return (
        <AppBar position="static" color="default" elevation={1} sx={{ mb: 1 }}>
            <Toolbar variant="dense" sx={{ gap: 2 }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    Filtros avanzados
                </Typography>

                {maxSpeed !== undefined && (
                    <Typography variant="body2" color="text.secondary">
                        Velocidad máx sesión: <b>{maxSpeed.toFixed(1)} km/h</b>
                    </Typography>
                )}

                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Velocidad</InputLabel>
                    <Select
                        label="Velocidad"
                        value={speedFilter}
                        onChange={(e) => onSpeedFilterChange(e.target.value as any)}
                    >
                        <MenuItem value="all">Todas</MenuItem>
                        <MenuItem value="80">&gt; 80 km/h</MenuItem>
                        <MenuItem value="120">&gt; 120 km/h</MenuItem>
                    </Select>
                </FormControl>

                <FormControlLabel
                    control={<Switch checked={rotativoOnly} onChange={(e) => onRotativoToggle(e.target.checked)} />}
                    label="Solo rotativo"
                />

                <Box>
                    <IconButton size="small" onClick={onRefresh}>
                        <RefreshIcon />
                    </IconButton>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default EventFilterBar; 