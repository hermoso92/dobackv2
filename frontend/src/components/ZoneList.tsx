import { Box, Button, Chip, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import React, { useMemo, useState } from 'react';
import { useZones } from '../hooks/useZones';

interface ZoneListProps {
    token: string;
    onEdit?: (zone: any) => void;
    onDelete?: (zone: any) => void;
}

export const ZoneList: React.FC<ZoneListProps> = ({ token, onEdit, onDelete }) => {
    const { zones, loading, error, refetch } = useZones(token);
    // Filtros persistentes
    const [filterName, setFilterName] = useState('');
    const [filterType, setFilterType] = useState('');
    const zoneTypes = [
        { value: '', label: 'Todos' },
        { value: 'parque', label: 'Parque' },
        { value: 'taller', label: 'Taller' },
        { value: 'sensible', label: 'Sensible' },
        { value: 'hospital', label: 'Hospital' },
        { value: 'base', label: 'Base' },
        { value: 'otro', label: 'Otro' },
    ];
    const [search, setSearch] = useState('');

    const filteredZones = useMemo(() => {
        return zones.filter((zone: any) => {
            const matchesName = filterName ? zone.name.toLowerCase().includes(filterName.toLowerCase()) : true;
            const matchesType = filterType ? zone.type === filterType : true;
            const matchesSearch = search ? (
                zone.name.toLowerCase().includes(search.toLowerCase()) ||
                zone.type.toLowerCase().includes(search.toLowerCase())
            ) : true;
            return matchesName && matchesType && matchesSearch;
        });
    }, [zones, filterName, filterType, search]);

    const handleDelete = async (zone: any) => {
        if (window.confirm(`¿Eliminar zona "${zone.name}"?`)) {
            if (onDelete) await onDelete(zone);
            refetch();
        }
    };

    if (loading) return <div>Cargando zonas...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Listado de Zonas</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <TextField label="Nombre" value={filterName} onChange={e => setFilterName(e.target.value)} size="small" />
                <Select value={filterType} onChange={e => setFilterType(e.target.value)} displayEmpty size="small" sx={{ minWidth: 120 }}>
                    {zoneTypes.map(type => <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>)}
                </Select>
                <TextField label="Búsqueda rápida" value={search} onChange={e => setSearch(e.target.value)} size="small" />
                <Button onClick={() => { setFilterName(''); setFilterType(''); setSearch(''); }} variant="outlined">Limpiar filtros</Button>
                <Button onClick={refetch} variant="contained">Refrescar</Button>
            </Box>
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredZones.map((zone: any) => (
                            <TableRow key={zone.id}>
                                <TableCell>{zone.name}</TableCell>
                                <TableCell>
                                    {zone.type === 'taller' && <Chip label="Taller" color="warning" icon={<span role="img" aria-label="taller">🛠️</span>} />}
                                    {zone.type === 'parque' && <Chip label="Parque" color="primary" icon={<span role="img" aria-label="parque">🏞️</span>} />}
                                    {zone.type === 'sensible' && <Chip label="Sensible" color="secondary" icon={<span role="img" aria-label="sensible">⚠️</span>} />}
                                    {zone.type === 'hospital' && <Chip label="Hospital" color="success" icon={<span role="img" aria-label="hospital">🏥</span>} />}
                                    {zone.type === 'base' && <Chip label="Base" color="info" icon={<span role="img" aria-label="base">🏢</span>} />}
                                    {zone.type === 'otro' && <Chip label="Otro" color="default" icon={<span role="img" aria-label="otro">❓</span>} />}
                                </TableCell>
                                <TableCell>
                                    {onEdit && <Button size="small" onClick={() => onEdit(zone)}>Editar</Button>}
                                    {onDelete && <Button size="small" color="error" onClick={() => handleDelete(zone)}>Eliminar</Button>}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}; 