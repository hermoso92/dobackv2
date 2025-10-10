import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material';
import React from 'react';
import { StabilityIndexEvent } from '../hooks/useStabilityIndexEvents';
import { buildEventId } from './GPSMap';

// Mapea colores según severidad/tipo (mismo criterio que en el mapa)
const getEventColor = (tipos: string[], level?: string): string => {
    // Primero verificar el nivel del evento
    if (level) {
        const lc = level.toLowerCase();
        if (lc === 'critical' || lc === 'critico') return '#E53935'; // Rojo
        if (lc === 'danger' || lc === 'peligroso') return '#FFA000'; // Naranja
        if (lc === 'moderate' || lc === 'moderado') return '#FFEB3B'; // Amarillo
    }

    // Si no hay nivel, buscar en tipos
    const lc = tipos.map(t => t.trim().toLowerCase());
    if (lc.includes('critico') || lc.includes('critical')) return '#E53935';
    if (lc.includes('peligroso') || lc.includes('danger')) return '#FFA000';
    if (lc.includes('moderado') || lc.includes('moderate')) return '#FFEB3B';
    if (lc.includes('vuelco')) return '#FF0000';
    if (lc.includes('deriva')) return '#FFA500';
    if (lc.includes('bache')) return '#800080';
    if (lc.includes('maniobra_brusca')) return '#FFD700';
    if (lc.includes('inestabilidad')) return '#FF00FF';
    return '#000';
};

interface EventTimelinePanelProps {
    events: StabilityIndexEvent[];
    width?: number;
    selectedEventId?: string | null;
    onSelectEvent?: (eventId: string) => void;
    variant?: 'drawer' | 'inline';
}

const drawerWidthDefault = 360;

const EventTimelinePanel: React.FC<EventTimelinePanelProps> = ({ events, width = drawerWidthDefault, selectedEventId, onSelectEvent, variant = 'drawer' }) => {
    // Deduplicar por id
    const unique = React.useMemo(() => {
        const seen = new Set<string>();
        const arr: StabilityIndexEvent[] = [];
        for (const ev of events) {
            const id = buildEventId(ev);
            if (!seen.has(id)) { seen.add(id); arr.push(ev); }
        }
        return arr;
    }, [events]);

    // Ordenar eventos por timestamp descendente
    const sorted = React.useMemo(() => {
        return [...unique].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [unique]);

    const Content = (
        <>
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Eventos
                </Typography>
            </Box>
            <List sx={{ overflowY: 'auto', flex: 1 }}>
                {sorted.map((ev) => {
                    const id = buildEventId(ev);
                    const selected = id === selectedEventId;
                    return (
                        <ListItemButton
                            key={id}
                            selected={selected}
                            onClick={() => onSelectEvent?.(id)}
                            sx={{ alignItems: 'flex-start' }}
                        >
                            <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                                <Box sx={{ width: 10, height: 10, bgcolor: getEventColor(ev.tipos, ev.level), borderRadius: '50%' }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={<Stack direction="row" spacing={1}><Typography variant="body2" sx={{ fontWeight: 600 }}>{ev.tipos.join(', ')}</Typography></Stack>}
                                secondary={<Typography variant="caption">{new Date(ev.timestamp).toLocaleString()}</Typography>}
                            />
                        </ListItemButton>
                    );
                })}
            </List>
        </>
    );

    if (variant === 'inline') {
        return <Box sx={{ width, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', p: 1, borderRight: '1px solid #ddd' }}>{Content}</Box>;
    }

    return (
        <Drawer
            anchor="right"
            variant="permanent"
            sx={{
                width,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width,
                    boxSizing: 'border-box',
                    p: 1,
                },
            }}
            open
        >
            {Content}
        </Drawer>
    );
};

export default EventTimelinePanel; 