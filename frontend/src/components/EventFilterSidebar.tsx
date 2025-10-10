import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, Checkbox, Divider, FormControl, FormControlLabel, IconButton, InputLabel, ListItemText, MenuItem, Select, Switch, Typography } from '@mui/material';
import React from 'react';
import { t } from "../i18n";

interface EventFilterSidebarProps {
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
}

const EventFilterSidebar: React.FC<EventFilterSidebarProps> = ({
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
    onRefresh
}) => {
    return (
        <Box sx={{ width: 260, p: 2, display: 'flex', flexDirection: 'column', gap: 2, borderLeft: '1px solid #ddd', bgcolor: 'background.paper' }}>
            <Typography variant="h6">{t('filtros')}</Typography>

            {maxSpeed !== undefined && (
                <Typography variant="body2" color="text.secondary">
                    {t('vel_max_sesion')} <b>{maxSpeed.toFixed(1)} km/h</b>
                </Typography>
            )}

            <FormControl size="small" fullWidth>
                <InputLabel>{t('velocidad')}</InputLabel>
                <Select
                    label={t('velocidad')}
                    value={speedFilter}
                    onChange={(e) => onSpeedFilterChange(e.target.value as any)}
                >
                    <MenuItem value="all">{t('todos')}</MenuItem>
                    <MenuItem value="40">&gt; 40 km/h</MenuItem>
                    <MenuItem value="60">&gt; 60 km/h</MenuItem>
                    <MenuItem value="80">&gt; 80 km/h</MenuItem>
                    <MenuItem value="100">&gt; 100 km/h</MenuItem>
                    <MenuItem value="120">&gt; 120 km/h</MenuItem>
                    <MenuItem value="140">&gt; 140 km/h</MenuItem>
                </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
                <InputLabel>RPM</InputLabel>
                <Select
                    label="RPM"
                    value={rpmFilter}
                    onChange={(e) => onRpmFilterChange(e.target.value as any)}
                >
                    <MenuItem value="all">Todas</MenuItem>
                    <MenuItem value="1500">&gt; 1500</MenuItem>
                    <MenuItem value="2000">&gt; 2000</MenuItem>
                    <MenuItem value="2500">&gt; 2500</MenuItem>
                </Select>
            </FormControl>

            <FormControlLabel
                control={<Switch checked={rotativoOnly} onChange={(e) => onRotativoToggle(e.target.checked)} />}
                label={t('solo_rotativo')}
            />

            <Divider flexItem sx={{ my: 1 }} />
            <Typography variant="subtitle2">{t('tipos_de_evento')}</Typography>
            <FormControl size="small" fullWidth>
                <Select
                    multiple
                    value={selectedTypes}
                    onChange={(e) => onTypesChange(e.target.value as string[])}
                    renderValue={(selected) => (selected as string[]).map((s) => t(s)).join(', ')}
                >
                    {eventTypes.map((tipo) => (
                        <MenuItem key={tipo} value={tipo}>
                            <Checkbox checked={selectedTypes.indexOf(tipo) > -1} />
                            <ListItemText primary={t(tipo)} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <IconButton size="small" onClick={onRefresh} sx={{ alignSelf: 'flex-start' }}>
                <RefreshIcon />
            </IconButton>
        </Box>
    );
};

export default EventFilterSidebar; 