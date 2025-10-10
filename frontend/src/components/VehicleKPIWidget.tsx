import { Box, Card, CardContent, Typography } from '@mui/material';
import React from 'react';
import { useVehicleKPI } from '../hooks/useVehicleKPI';

interface VehicleKPIWidgetProps {
    vehicleId?: string;
    token: string;
}

export const VehicleKPIWidget: React.FC<VehicleKPIWidgetProps> = ({ vehicleId, token }) => {
    const { kpi, loading, error } = useVehicleKPI(vehicleId || '', token);

    if (!vehicleId) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                    Selecciona un vehículo para ver sus KPIs
                </Typography>
            </Box>
        );
    }

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>KPIs de Vehículo</Typography>
                {loading && <Typography>Cargando KPIs...</Typography>}
                {error && <Typography color="error">Error: {error}</Typography>}
                {kpi ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', p: 0, m: 0 }}>
                        {/* Clave 2 */}
                        <Card sx={{ minWidth: 140, flex: '1 1 140px', p: 1, textAlign: 'center', boxShadow: 1 }}>
                            <CardContent sx={{ p: 1 }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, fontSize: 13 }}>
                                    Clave 2
                                </Typography>
                                <Typography variant="h6" color="primary" sx={{ fontWeight: 700, fontSize: 22 }}>
                                    {((kpi?.clave2Minutes ?? 0) / 60).toFixed(1)}h
                                </Typography>
                            </CardContent>
                        </Card>
                        {/* Clave 5 */}
                        <Card sx={{ minWidth: 140, flex: '1 1 140px', p: 1, textAlign: 'center', boxShadow: 1 }}>
                            <CardContent sx={{ p: 1 }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, fontSize: 13 }}>
                                    Clave 5
                                </Typography>
                                <Typography variant="h6" color="primary" sx={{ fontWeight: 700, fontSize: 22 }}>
                                    {((kpi?.clave5Minutes ?? 0) / 60).toFixed(1)}h
                                </Typography>
                            </CardContent>
                        </Card>
                        {/* Fuera de Parque */}
                        <Card sx={{ minWidth: 140, flex: '1 1 140px', p: 1, textAlign: 'center', boxShadow: 1 }}>
                            <CardContent sx={{ p: 1 }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, fontSize: 13 }}>
                                    Fuera de Parque
                                </Typography>
                                <Typography variant="h6" color="info.main" sx={{ fontWeight: 700, fontSize: 22 }}>
                                    {((kpi?.outOfParkMinutes ?? 0) / 60).toFixed(1)}h
                                </Typography>
                            </CardContent>
                        </Card>
                        {/* En Taller */}
                        <Card sx={{ minWidth: 140, flex: '1 1 140px', p: 1, textAlign: 'center', boxShadow: 1 }}>
                            <CardContent sx={{ p: 1 }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, fontSize: 13 }}>
                                    En Taller
                                </Typography>
                                <Typography variant="h6" color="secondary" sx={{ fontWeight: 700, fontSize: 22 }}>
                                    {((kpi?.timeInWorkshop ?? 0) / 60).toFixed(1)}h
                                </Typography>
                            </CardContent>
                        </Card>
                        {/* Eventos Críticos */}
                        <Card sx={{ minWidth: 140, flex: '1 1 140px', p: 1, textAlign: 'center', boxShadow: 1 }}>
                            <CardContent sx={{ p: 1 }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, fontSize: 13 }}>
                                    Eventos Críticos
                                </Typography>
                                <Typography variant="h6" color="error" sx={{ fontWeight: 700, fontSize: 22 }}>
                                    {kpi?.eventsHigh ?? 0}
                                </Typography>
                            </CardContent>
                        </Card>
                        {/* Eventos Moderados */}
                        <Card sx={{ minWidth: 140, flex: '1 1 140px', p: 1, textAlign: 'center', boxShadow: 1 }}>
                            <CardContent sx={{ p: 1 }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, fontSize: 13 }}>
                                    Eventos Moderados
                                </Typography>
                                <Typography variant="h6" color="warning.main" sx={{ fontWeight: 700, fontSize: 22 }}>
                                    {kpi?.eventsModerate ?? 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        No hay KPIs disponibles para este vehículo
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}; 