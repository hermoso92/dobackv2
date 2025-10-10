import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import React, { useMemo, useState } from 'react';
import { useParks } from '../hooks/useParks';

interface ParkListProps {
    token: string;
    onEdit?: (park: any) => void;
    onDelete?: (park: any) => void;
}

export const ParkList: React.FC<ParkListProps> = ({ token, onEdit, onDelete }) => {
    const { parks, loading, error, refetch } = useParks(token);
    // Filtros persistentes
    const [filterName, setFilterName] = useState('');
    const [filterIdentifier, setFilterIdentifier] = useState('');
    const [search, setSearch] = useState('');

    const filteredParks = useMemo(() => {
        return parks.filter((park: any) => {
            const matchesName = filterName ? park.name.toLowerCase().includes(filterName.toLowerCase()) : true;
            const matchesIdentifier = filterIdentifier ? park.identifier.toLowerCase().includes(filterIdentifier.toLowerCase()) : true;
            const matchesSearch = search ? (
                park.name.toLowerCase().includes(search.toLowerCase()) ||
                park.identifier.toLowerCase().includes(search.toLowerCase())
            ) : true;
            return matchesName && matchesIdentifier && matchesSearch;
        });
    }, [parks, filterName, filterIdentifier, search]);

    const handleDelete = async (park: any) => {
        if (window.confirm(`¿Eliminar parque "${park.name}"?`)) {
            if (onDelete) await onDelete(park);
            refetch();
        }
    };

    if (loading) return <div>Cargando parques...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Listado de Parques</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <TextField label="Nombre" value={filterName} onChange={e => setFilterName(e.target.value)} size="small" />
                <TextField label="Identificador" value={filterIdentifier} onChange={e => setFilterIdentifier(e.target.value)} size="small" />
                <TextField label="Búsqueda rápida" value={search} onChange={e => setSearch(e.target.value)} size="small" />
                <Button onClick={() => { setFilterName(''); setFilterIdentifier(''); setSearch(''); }} variant="outlined">Limpiar filtros</Button>
                <Button onClick={refetch} variant="contained">Refrescar</Button>
            </Box>
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Identificador</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredParks.map((park: any) => (
                            <TableRow key={park.id}>
                                <TableCell>{park.name}</TableCell>
                                <TableCell>{park.identifier}</TableCell>
                                <TableCell>
                                    {onEdit && <Button size="small" onClick={() => onEdit(park)}>Editar</Button>}
                                    {onDelete && <Button size="small" color="error" onClick={() => handleDelete(park)}>Eliminar</Button>}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}; 