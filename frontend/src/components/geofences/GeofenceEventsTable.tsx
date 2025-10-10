import {
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import React from 'react';
import { formatDateTZ } from '../../utils/formatDateTZ';

interface GeofenceEvent {
    id: string;
    geofenceId: string;
    vehicleId: string;
    vehicleName: string;
    eventType: 'entry' | 'exit';
    timestamp: string;
    coordinates: [number, number];
    speed: number;
    duration?: number;
}

interface Geofence {
    id: string;
    name: string;
}

interface GeofenceEventsTableProps {
    events: GeofenceEvent[];
    geofences: Geofence[];
    userTimezone: string;
}

export const GeofenceEventsTable: React.FC<GeofenceEventsTableProps> = ({
    events,
    geofences,
    userTimezone
}) => {
    return (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Vehículo</TableCell>
                        <TableCell>Geofence</TableCell>
                        <TableCell>Tipo de Evento</TableCell>
                        <TableCell>Fecha/Hora</TableCell>
                        <TableCell>Velocidad</TableCell>
                        <TableCell>Duración</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {events.map((event) => {
                        const geofence = geofences.find(g => g.id === event.geofenceId);
                        return (
                            <TableRow key={event.id} hover>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                        {event.vehicleName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {event.vehicleId}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {geofence?.name || 'Geofence Desconocido'}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={event.eventType === 'entry' ? 'Entrada' : 'Salida'}
                                        size="small"
                                        color={event.eventType === 'entry' ? 'success' : 'warning'}
                                    />
                                </TableCell>
                                <TableCell>
                                    {formatDateTZ(event.timestamp, userTimezone, { preset: 'medium' })}
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {event.speed} km/h
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    {event.duration ? `${event.duration} min` : '-'}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

