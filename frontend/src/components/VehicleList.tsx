import { Box, Button, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import React, { useMemo, useState } from 'react';
import { useVehicles } from '../hooks/useVehicles';

interface VehicleListProps {
    token: string;
    parkId?: string;
    onEdit?: (vehicle: any) => void;
    onDelete?: (vehicle: any) => void;
}

const vehicleTypes = [
    'TRUCK', 'VAN', 'CAR', 'BUS', 'MOTORCYCLE', 'OTHER'
];
const vehicleStatuses = [
    'ACTIVE', 'MAINTENANCE', 'INACTIVE', 'REPAIR'
];

export const VehicleList: React.FC<VehicleListProps> = ({ token, parkId, onEdit, onDelete }) => {
    const { vehicles, loading, error, refetch } = useVehicles(token, parkId);
    // Filtros persistentes
    const [filterName, setFilterName] = useState('');
    const [filterIdentifier, setFilterIdentifier] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [search, setSearch] = useState('');

    const filteredVehicles = useMemo(() => {
        const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
        return safeVehicles.filter((vehicle: any) => {
            const matchesName = filterName ? vehicle.name.toLowerCase().includes(filterName.toLowerCase()) : true;
            const matchesIdentifier = filterIdentifier ? (vehicle.identifier || '').toLowerCase().includes(filterIdentifier.toLowerCase()) : true;
            const matchesType = filterType ? vehicle.type === filterType : true;
            const matchesStatus = filterStatus ? vehicle.status === filterStatus : true;
            const matchesSearch = search ? (
                vehicle.name.toLowerCase().includes(search.toLowerCase()) ||
                (vehicle.identifier || '').toLowerCase().includes(search.toLowerCase()) ||
                (vehicle.licensePlate || '').toLowerCase().includes(search.toLowerCase())
            ) : true;
            return matchesName && matchesIdentifier && matchesType && matchesStatus && matchesSearch;
        });
    }, [vehicles, filterName, filterIdentifier, filterType, filterStatus, search]);

    const handleDelete = async (vehicle: any) => {
        if (window.confirm(`¿Eliminar vehículo "${vehicle.name}"?`)) {
            if (onDelete) await onDelete(vehicle);
            refetch();
        }
    };

    if (loading) return <div>Cargando vehículos...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Listado de Vehículos</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <TextField label="Nombre" value={filterName} onChange={e => setFilterName(e.target.value)} size="small" />
                <TextField label="Identificador" value={filterIdentifier} onChange={e => setFilterIdentifier(e.target.value)} size="small" />
                <Select value={filterType} onChange={e => setFilterType(e.target.value)} displayEmpty size="small" sx={{ minWidth: 120 }}>
                    <MenuItem value="">Tipo</MenuItem>
                    {vehicleTypes.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                </Select>
                <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} displayEmpty size="small" sx={{ minWidth: 120 }}>
                    <MenuItem value="">Estado</MenuItem>
                    {vehicleStatuses.map(status => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                </Select>
                <TextField label="Búsqueda rápida" value={search} onChange={e => setSearch(e.target.value)} size="small" />
                <Button onClick={() => { setFilterName(''); setFilterIdentifier(''); setFilterType(''); setFilterStatus(''); setSearch(''); }} variant="outlined">Limpiar filtros</Button>
                <Button onClick={refetch} variant="contained">Refrescar</Button>
            </Box>
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Identificador</TableCell>
                            <TableCell>Matrícula</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredVehicles.map((vehicle: any) => (
                            <TableRow key={vehicle.id}>
                                <TableCell>{vehicle.name}</TableCell>
                                <TableCell>{vehicle.identifier}</TableCell>
                                <TableCell>{vehicle.licensePlate}</TableCell>
                                <TableCell>{vehicle.type}</TableCell>
                                <TableCell>{vehicle.status}</TableCell>
                                <TableCell>
                                    {onEdit && <Button size="small" onClick={() => onEdit(vehicle)}>Editar</Button>}
                                    {onDelete && <Button size="small" color="error" onClick={() => handleDelete(vehicle)}>Eliminar</Button>}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}; 