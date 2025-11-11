/**
 * 🔑 TAB DE CLAVES OPERACIONALES
 * 
 * Muestra:
 * - Resumen de claves por tipo
 * - Distribución (pie chart)
 * - Timeline (Gantt)
 * - Mapa con puntos de inicio/fin
 */

import {
    Alert,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { apiService } from '../../services/api';
import { logger } from '../../utils/logger';

// Fix para iconos de Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface OperationalKey {
    id: string;
    tipo: number;
    tipoNombre: string;
    inicio: string;
    fin: string | null;
    duracionSegundos: number | null;
    duracionMinutos: number | null;
    rotativoEncendido: boolean;
    geocerca: string | null;
    coordenadasInicio: { lat: number; lon: number } | null;
    coordenadasFin: { lat: number; lon: number } | null;
}

interface Props {
    organizationId: string;
    vehicleIds?: string[];
    startDate?: string;
    endDate?: string;
}

const COLORES_CLAVES: Record<number, string> = {
    0: '#9CA3AF', // TALLER - Gris
    1: '#3B82F6', // PARQUE - Azul
    2: '#EF4444', // EMERGENCIA - Rojo
    3: '#F59E0B', // INCENDIO - Naranja
    5: '#10B981'  // REGRESO - Verde
};

const NOMBRES_CLAVES: Record<number, string> = {
    0: 'Taller',
    1: 'Operativo en Parque',
    2: 'Salida en Emergencia',
    3: 'En Incendio/Emergencia',
    5: 'Regreso al Parque'
};

export const OperationalKeysTab: React.FC<Props> = ({
    organizationId,
    vehicleIds,
    startDate,
    endDate
}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resumen, setResumen] = useState<any>(null);
    const [timeline, setTimeline] = useState<any[]>([]);

    useEffect(() => {
        cargarDatos();
    }, [organizationId, vehicleIds, startDate, endDate]);

    const cargarDatos = async () => {
        setLoading(true);
        setError(null);

        try {
            // Construir query params
            const params = new URLSearchParams();
            if (vehicleIds && vehicleIds.length > 0) {
                vehicleIds.forEach(id => params.append('vehicleIds[]', id));
            }
            if (startDate) params.append('from', startDate);
            if (endDate) params.append('to', endDate);

            // Cargar resumen y timeline en paralelo usando apiService
            const [resumenData, timelineData] = await Promise.all([
                apiService.get(`/api/operational-keys/summary?${params.toString()}`),
                apiService.get(`/api/operational-keys/timeline?${params.toString()}`)
            ]);

            setResumen(resumenData);
            setTimeline(timelineData.timeline || []);

        } catch (err: any) {
            logger.error('Error cargando claves operacionales:', err);
            setError(err.message || 'Error cargando datos de claves operacionales');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={3}>
                <Alert severity="error">
                    Error cargando claves operacionales: {error}
                </Alert>
            </Box>
        );
    }

    if (!resumen || resumen.totalClaves === 0) {
        return (
            <Box p={3}>
                <Alert severity="info">
                    No hay claves operacionales en el período seleccionado.
                    Las claves se generan automáticamente cuando el vehículo entra/sale de geocercas.
                </Alert>
            </Box>
        );
    }

    // Preparar datos para gráfica
    const datosGrafica = resumen.porTipo.map((tipo: any) => ({
        name: NOMBRES_CLAVES[tipo.tipo] || `Clave ${tipo.tipo}`,
        value: tipo.cantidad,
        color: COLORES_CLAVES[tipo.tipo] || '#6B7280'
    }));

    // Preparar puntos para mapa
    const puntosInicio = timeline
        .filter((c: any) => c.inicio && c.inicio.lat && c.inicio.lon)
        .map((c: any) => ({
            lat: c.inicio.lat,
            lon: c.inicio.lon,
            tipo: c.tipoNombre,
            color: c.color
        }));

    const puntosFin = timeline
        .filter((c: any) => c.fin && c.fin.lat && c.fin.lon)
        .map((c: any) => ({
            lat: c.fin.lat,
            lon: c.fin.lon,
            tipo: c.tipoNombre,
            color: c.color
        }));

    const centroMapa = puntosInicio.length > 0
        ? [puntosInicio[0].lat, puntosInicio[0].lon]
        : [40.4168, -3.7038]; // Madrid por defecto

    return (
        <Box p={3}>
            <Typography variant="h5" gutterBottom>
                🔑 Claves Operacionales
            </Typography>

            <Grid container spacing={3}>
                {/* TARJETAS DE RESUMEN */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Claves
                            </Typography>
                            <Typography variant="h4">
                                {resumen.totalClaves}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Duración Total
                            </Typography>
                            <Typography variant="h4">
                                {Math.round(resumen.duracionTotalMinutos / 60)}h {resumen.duracionTotalMinutos % 60}m
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Tipos Detectados
                            </Typography>
                            <Typography variant="h4">
                                {resumen.porTipo.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* GRÁFICA DE DISTRIBUCIÓN */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Distribución por Tipo
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={datosGrafica}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label
                                    >
                                        {datosGrafica.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* TABLA DE RESUMEN */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Resumen por Tipo
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Tipo</TableCell>
                                            <TableCell align="right">Cantidad</TableCell>
                                            <TableCell align="right">Duración Total</TableCell>
                                            <TableCell align="right">Promedio</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {resumen.porTipo.map((tipo: any) => (
                                            <TableRow key={tipo.tipo}>
                                                <TableCell>
                                                    <Box display="flex" alignItems="center">
                                                        <Box
                                                            width={12}
                                                            height={12}
                                                            borderRadius="50%"
                                                            bgcolor={COLORES_CLAVES[tipo.tipo]}
                                                            mr={1}
                                                        />
                                                        {tipo.tipoNombre || NOMBRES_CLAVES[tipo.tipo]}
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right">{tipo.cantidad}</TableCell>
                                                <TableCell align="right">{tipo.duracionTotalMinutos} min</TableCell>
                                                <TableCell align="right">{tipo.duracionPromedioMinutos} min</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* MAPA */}
                {puntosInicio.length > 0 && (
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Mapa de Claves
                                </Typography>
                                <Box height={400}>
                                    <MapContainer
                                        center={centroMapa as [number, number]}
                                        zoom={12}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; OpenStreetMap contributors'
                                        />

                                        {/* Puntos de inicio */}
                                        {puntosInicio.map((punto, idx) => (
                                            <Marker key={`inicio-${idx}`} position={[punto.lat, punto.lon]}>
                                                <Popup>
                                                    <strong>Inicio: {punto.tipo}</strong>
                                                </Popup>
                                            </Marker>
                                        ))}

                                        {/* Puntos de fin */}
                                        {puntosFin.map((punto, idx) => (
                                            <Marker key={`fin-${idx}`} position={[punto.lat, punto.lon]}>
                                                <Popup>
                                                    <strong>Fin: {punto.tipo}</strong>
                                                </Popup>
                                            </Marker>
                                        ))}
                                    </MapContainer>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* CLAVE MÁS LARGA/CORTA */}
                {resumen.claveMasLarga && (
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom color="success.main">
                                    ⏱️ Clave Más Larga
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Tipo:</strong> {resumen.claveMasLarga.tipoNombre}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Duración:</strong> {resumen.claveMasLarga.duracionMinutos} minutos
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Vehículo: {resumen.claveMasLarga.vehiculo}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Inicio: {new Date(resumen.claveMasLarga.inicio).toLocaleString('es-ES')}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {resumen.claveMasCorta && (
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom color="warning.main">
                                    ⚡ Clave Más Corta
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Tipo:</strong> {resumen.claveMasCorta.tipoNombre}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Duración:</strong> {resumen.claveMasCorta.duracionMinutos} minutos
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Vehículo: {resumen.claveMasCorta.vehiculo}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Inicio: {new Date(resumen.claveMasCorta.inicio).toLocaleString('es-ES')}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* TIMELINE (SIMPLE) */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Timeline de Claves
                            </Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Hora</TableCell>
                                            <TableCell>Vehículo</TableCell>
                                            <TableCell>Tipo</TableCell>
                                            <TableCell>Duración</TableCell>
                                            <TableCell>Rotativo</TableCell>
                                            <TableCell>Geocerca</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {timeline.slice(0, 20).map((clave, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>
                                                    {new Date(clave.inicio).toLocaleTimeString('es-ES')}
                                                </TableCell>
                                                <TableCell>{clave.vehiculo}</TableCell>
                                                <TableCell>
                                                    <Box display="flex" alignItems="center">
                                                        <Box
                                                            width={12}
                                                            height={12}
                                                            borderRadius="50%"
                                                            bgcolor={clave.color}
                                                            mr={1}
                                                        />
                                                        {clave.tipoNombre}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>{clave.duracionMinutos} min</TableCell>
                                                <TableCell>
                                                    {clave.rotativoOn ? '🔴 ON' : '⚫ OFF'}
                                                </TableCell>
                                                <TableCell>{clave.geocerca || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default OperationalKeysTab;

