import {
    Box,
    Container,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import React, { useState } from 'react';
import { StabilitySession, Vehicle } from '../models';

interface TelemetryData {
    speed: number;
    rpm: number;
    fuel: number;
    temperature: number;
    batteryVoltage: number;
    acceleration: number;
}

interface SelectedVariables {
    speed: boolean;
    rpm: boolean;
}

const Telemetry: React.FC = () => {
    const [selectedVehicleA, setSelectedVehicleA] = useState<Vehicle | null>(null);
    const [selectedVehicleB, setSelectedVehicleB] = useState<Vehicle | null>(null);
    const [selectedSessionA, setSelectedSessionA] = useState<StabilitySession | null>(null);
    const [selectedSessionB, setSelectedSessionB] = useState<StabilitySession | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
    const [selectedSession, setSelectedSession] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [sessions, setSessions] = useState<StabilitySession[]>([]);
    const [hoveredData, setHoveredData] = useState<TelemetryData | null>(null);
    const [selectedVariables, setSelectedVariables] = useState<SelectedVariables>({
        speed: true,
        rpm: true
    });

    const telemetryData: TelemetryData = {
        speed: 72.5,
        rpm: 2450,
        fuel: 65,
        temperature: 85,
        batteryVoltage: 12.7,
        acceleration: 0.8
    };

    const mockGPSPoints = [
        { lat: 40.4168, lng: -3.7038, timestamp: '2024-03-20T10:00:00Z', speed: 0 },
        { lat: 40.4178, lng: -3.7048, timestamp: '2024-03-20T10:05:00Z', speed: 30 },
        { lat: 40.4188, lng: -3.7058, timestamp: '2024-03-20T10:10:00Z', speed: 45 },
        { lat: 40.4198, lng: -3.7068, timestamp: '2024-03-20T10:15:00Z', speed: 60 },
        { lat: 40.4208, lng: -3.7078, timestamp: '2024-03-20T10:20:00Z', speed: 0 },
    ];

    const renderRealTimeMetrics = () => {
        const currentData = hoveredData || telemetryData;

        return (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1 }}>
                {selectedVariables.speed && (
                    <Paper elevation={2} sx={{ p: 1, textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="textSecondary">Velocidad</Typography>
                        <Typography variant="h6">{(currentData.speed || 0).toFixed(1)} km/h</Typography>
                    </Paper>
                )}
                {selectedVariables.rpm && (
                    <Paper elevation={2} sx={{ p: 1, textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="textSecondary">RPM</Typography>
                        <Typography variant="h6">{(currentData.rpm || 0).toFixed(0)}</Typography>
                    </Paper>
                )}
            </Box>
        );
    };

    return (
        <Container maxWidth="xl" sx={{ height: '100%', overflow: 'hidden' }}>
            <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Telemetría de Vehículos
                </Typography>

                <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
                    <Grid xs={12} md={4}>
                        <Paper sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="h6">Datos de Telemetría</Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Hora</TableCell>
                                            <TableCell>Latitud</TableCell>
                                            <TableCell>Longitud</TableCell>
                                            <TableCell>Velocidad</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {mockGPSPoints.map((point, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{new Date(point.timestamp).toLocaleTimeString()}</TableCell>
                                                <TableCell>{point.lat.toFixed(6)}</TableCell>
                                                <TableCell>{point.lng.toFixed(6)}</TableCell>
                                                <TableCell>{point.speed} km/h</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

export default Telemetry; 