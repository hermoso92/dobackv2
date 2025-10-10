import { Box, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import React from 'react';

type TelemetryKPI = {
    vehicleId: string;
    date: string;
    minutesInBase: number;
    minutesOutBase: number;
    maxSpeed: number;
    criticalEvents: number;
    distanceKm: number;
};

const SAMPLE_KPIS: TelemetryKPI[] = [
    {
        vehicleId: 'veh-001',
        date: '2024-09-01',
        minutesInBase: 120,
        minutesOutBase: 240,
        maxSpeed: 82,
        criticalEvents: 1,
        distanceKm: 54.3
    },
    {
        vehicleId: 'veh-002',
        date: '2024-08-28',
        minutesInBase: 90,
        minutesOutBase: 190,
        maxSpeed: 78,
        criticalEvents: 0,
        distanceKm: 47.9
    }
];

const TelemetryKPIGrid: React.FC = () => {
    return (
        <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
                {SAMPLE_KPIS.map((kpi) => (
                    <Grid item xs={12} md={6} key={`${kpi.vehicleId}-${kpi.date}`}>
                        <Card>
                            <CardContent>
                                <Stack direction="column" spacing={1}>
                                    <Typography variant="h6">{kpi.vehicleId}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Fecha: {kpi.date}
                                    </Typography>
                                    <Stack direction="row" spacing={4}>
                                        <Stack>
                                            <Typography variant="body2" color="text.secondary">En base</Typography>
                                            <Typography variant="h6">{kpi.minutesInBase} min</Typography>
                                        </Stack>
                                        <Stack>
                                            <Typography variant="body2" color="text.secondary">Fuera base</Typography>
                                            <Typography variant="h6">{kpi.minutesOutBase} min</Typography>
                                        </Stack>
                                    </Stack>
                                    <Stack direction="row" spacing={4}>
                                        <Stack>
                                            <Typography variant="body2" color="text.secondary">Velocidad maxima</Typography>
                                            <Typography variant="h6">{kpi.maxSpeed} km/h</Typography>
                                        </Stack>
                                        <Stack>
                                            <Typography variant="body2" color="text.secondary">Eventos criticos</Typography>
                                            <Typography variant="h6">{kpi.criticalEvents}</Typography>
                                        </Stack>
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary">
                                        Distancia recorrida: {kpi.distanceKm.toFixed(1)} km
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default TelemetryKPIGrid;
