import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, Checkbox, FormControl, IconButton, InputLabel, ListItemText, MenuItem, Select, Switch, Toolbar, Typography } from '@mui/material';
import React from 'react';
import { t } from "../i18n";

interface EventFilterToolbarProps {
    maxSpeed?: number;
    speedFilter: 'all' | '40' | '60' | '80' | '100' | '120' | '140';
    onSpeedFilterChange: (v: 'all' | '40' | '60' | '80' | '100' | '120' | '140') => void;
    rotativoOnly: boolean;
    onRotativoToggle: (v: boolean) => void;
    rpmFilter: 'all' | '1500' | '2000' | '2500';
    onRpmFilterChange: (v: 'all' | '1500' | '2000' | '2500') => void;
    eventTypes: string[];
    selectedTypes: string[];
    onTypesChange: (types: string[]) => void;
    onRefresh: () => void;
    sessionId?: string | null;
}

const EventFilterToolbar: React.FC<EventFilterToolbarProps> = ({
    maxSpeed,
    speedFilter,
    onSpeedFilterChange,
    rotativoOnly,
    onRotativoToggle,
    rpmFilter,
    onRpmFilterChange,
    eventTypes,
    selectedTypes,
    onTypesChange,
    onRefresh,
    sessionId,
}) => {
    return (
        <Toolbar variant="dense" sx={{ width: '100%', minHeight: '40px !important', px: 0, py: 0, gap: 1, overflowX: 'auto', background: 'none' }}>
            {/* Velocidad */}
            <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Velocidad</InputLabel>
                <Select
                    label="Velocidad"
                    value={speedFilter}
                    onChange={(e) => onSpeedFilterChange(e.target.value as any)}
                >
                    <MenuItem value="all">{t('todos')}</MenuItem>
                    {[40, 60, 80, 100, 120, 140].map((v) => (
                        <MenuItem key={v} value={String(v)}>&gt; {v} km/h</MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* RPM */}
            <FormControl size="small" sx={{ minWidth: 90 }}>
                <InputLabel>RPM</InputLabel>
                <Select label="RPM" value={rpmFilter} onChange={(e) => onRpmFilterChange(e.target.value as any)}>
                    <MenuItem value="all">Todas</MenuItem>
                    {[1500, 2000, 2500].map((v) => (
                        <MenuItem key={v} value={String(v)}>&gt; {v}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Rotativo */}
            <FormControl size="small" sx={{ minWidth: 80 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Switch checked={rotativoOnly} onChange={(e) => onRotativoToggle(e.target.checked)} size="small" />
                    <Typography variant="body2">Rotativo</Typography>
                </Box>
            </FormControl>

            {/* Tipos de evento */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Tipos</InputLabel>
                <Select
                    multiple
                    value={selectedTypes}
                    onChange={(e) => onTypesChange(e.target.value as string[])}
                    renderValue={(sel) => (sel as string[]).map((s) => t(s)).join(', ')}
                >
                    {eventTypes.map((tipo) => (
                        <MenuItem key={tipo} value={tipo}>
                            <Checkbox checked={selectedTypes.includes(tipo)} />
                            <ListItemText primary={t(tipo)} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <IconButton size="small" onClick={onRefresh} sx={{ ml: 1 }}>
                <RefreshIcon />
            </IconButton>
        </Toolbar>
    );
};

export default EventFilterToolbar; 