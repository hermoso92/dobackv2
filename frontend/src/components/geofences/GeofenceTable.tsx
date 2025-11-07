import {
    RadioButtonUnchecked as CircleIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    LocationOn as LocationIcon,
    RectangleOutlined as RectangleIcon
} from '@mui/icons-material';
import {
    Box,
    Chip,
    IconButton,
    Stack,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Tooltip,
    Typography
} from '@mui/material';
import React from 'react';
import { Geofence } from '../../types/geofence';
import { formatDateTZ } from '../../utils/formatDateTZ';

interface GeofenceTableProps {
    geofences: Geofence[];
    page: number;
    rowsPerPage: number;
    userTimezone: string;
    getGeofenceColor: (geofence: Geofence) => string;
    getPriorityFromTag: (tag?: string) => 'low' | 'medium' | 'high' | 'critical';
    getDepartmentFromTag: (tag?: string) => string;
    getModeText: (mode: string) => string;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rowsPerPage: number) => void;
    onEditGeofence: (geofence: Geofence) => void;
    onDeleteGeofence: (geofenceId: string) => void;
    onToggleGeofence: (geofenceId: string) => void;
}

export const GeofenceTable: React.FC<GeofenceTableProps> = ({
    geofences,
    page,
    rowsPerPage,
    userTimezone,
    getGeofenceColor,
    getPriorityFromTag,
    getDepartmentFromTag,
    getModeText,
    onPageChange,
    onRowsPerPageChange,
    onEditGeofence,
    onDeleteGeofence,
    onToggleGeofence
}) => {
    const getTypeIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'circle': return <CircleIcon />;
            case 'rectangle': return <RectangleIcon />;
            case 'polygon': return <LocationIcon />;
            default: return <LocationIcon />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'error';
            case 'high': return 'warning';
            case 'medium': return 'info';
            case 'low': return 'default';
            default: return 'default';
        }
    };

    // Aplicar paginación correctamente
    const paginatedGeofences = geofences.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Geofence</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Prioridad</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Alertas</TableCell>
                            <TableCell>Departamento</TableCell>
                            <TableCell>Eventos</TableCell>
                            <TableCell>Última Actualización</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedGeofences.map((geofence) => (
                            <TableRow key={geofence.id} hover>
                                <TableCell>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <Box sx={{ color: getGeofenceColor(geofence) }}>
                                            {getTypeIcon(geofence.type)}
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" fontWeight="medium">
                                                {geofence.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {geofence.description || 'Sin descripción'}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={geofence.type}
                                        size="small"
                                        color="primary"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={getPriorityFromTag(geofence.tag).toUpperCase()}
                                        size="small"
                                        color={getPriorityColor(getPriorityFromTag(geofence.tag))}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Switch
                                            checked={geofence.enabled}
                                            onChange={() => onToggleGeofence(geofence.id)}
                                            size="small"
                                        />
                                        <Chip
                                            label={geofence.enabled ? 'Activo' : 'Inactivo'}
                                            size="small"
                                            color={geofence.enabled ? 'success' : 'default'}
                                        />
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={getModeText(geofence.mode)}
                                        size="small"
                                        color="info"
                                    />
                                </TableCell>
                                <TableCell>{getDepartmentFromTag(geofence.tag)}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={(geofence as any)._count?.events || 0}
                                        size="small"
                                        color={(geofence as any)._count?.events > 0 ? 'secondary' : 'default'}
                                    />
                                </TableCell>
                                <TableCell>
                                    {formatDateTZ(geofence.updatedAt, userTimezone, { preset: 'medium' })}
                                </TableCell>
                                <TableCell align="center">
                                    <Stack direction="row" spacing={1} justifyContent="center">
                                        <Tooltip title="Editar">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => onEditGeofence(geofence)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => onDeleteGeofence(geofence.id)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={geofences.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => onPageChange(newPage)}
                onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
                labelRowsPerPage="Filas por página:"
            />
        </>
    );
};

