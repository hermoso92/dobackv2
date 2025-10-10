import {
    CheckCircle as CheckIcon,
    LocationOn as LocationIcon,
    Timeline as TimelineIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { Box, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import React from 'react';
import { Geofence } from '../../types/geofence';

interface GeofenceStatsProps {
    geofences: Geofence[];
    geofenceEvents: any[];
    getPriorityFromTag: (tag?: string) => 'low' | 'medium' | 'high' | 'critical';
}

export const GeofenceStats: React.FC<GeofenceStatsProps> = ({
    geofences,
    geofenceEvents,
    getPriorityFromTag
}) => {
    return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <LocationIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    Total Geofences
                                </Typography>
                                <Typography variant="h5">
                                    {geofences.length}
                                </Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <CheckIcon sx={{ color: 'success.main', fontSize: 32 }} />
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    Activos
                                </Typography>
                                <Typography variant="h5">
                                    {geofences.filter(g => g.enabled).length}
                                </Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <WarningIcon sx={{ color: 'error.main', fontSize: 32 }} />
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    Críticos
                                </Typography>
                                <Typography variant="h5">
                                    {geofences.filter(g => getPriorityFromTag(g.tag) === 'critical').length}
                                </Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <TimelineIcon sx={{ color: 'info.main', fontSize: 32 }} />
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    Eventos Hoy
                                </Typography>
                                <Typography variant="h5">
                                    {geofenceEvents.length}
                                </Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};


