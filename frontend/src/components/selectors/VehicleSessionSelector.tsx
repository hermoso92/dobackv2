import { ClockIcon, TruckIcon } from '@heroicons/react/24/outline';
import { Box, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { logger } from '../../utils/logger';

interface Vehicle {
    id: string;
    name: string;
    license_plate: string;
    vehicle_type: string;
    is_active: boolean;
}

interface Session {
    id: string;
    vehicle_id: string;
    vehicle_name: string;
    start_date: string;
    end_date: string;
    duration: number;
    status: string;
}

interface VehicleSessionSelectorProps {
    onVehicleChange?: (vehicleId: string) => void;
    onSessionChange?: (sessionId: string) => void;
    selectedVehicleId?: string;
    selectedSessionId?: string;
    showSessionSelector?: boolean;
    className?: string;
}

export const VehicleSessionSelector: React.FC<VehicleSessionSelectorProps> = ({
    onVehicleChange,
    onSessionChange,
    selectedVehicleId,
    selectedSessionId,
    showSessionSelector = true,
    className = ''
}) => {
    const { user } = useAuth();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(false);

    // Cargar vehículos
    useEffect(() => {
        const loadVehicles = async () => {
            setLoading(true);
            try {
                const data = await apiService.get('/api/vehicles');
                if (data.success && data.data && Array.isArray(data.data)) {
                    // Mapear vehículos de PostgreSQL al formato esperado
                    const mappedVehicles: Vehicle[] = data.data.map((v: any) => ({
                        id: v.id,
                        name: v.name || v.licensePlate || `Vehículo ${v.id}`,
                        license_plate: v.licensePlate || '',
                        vehicle_type: v.type || 'BOMBA_ESCALERA',
                        is_active: v.active !== false
                    }));
                    setVehicles(mappedVehicles);
                } else {
                    setVehicles([]);
                }
            } catch (error) {
                logger.error('Error cargando vehículos', { error });
                setVehicles([]);
            } finally {
                setLoading(false);
            }
        };

        loadVehicles();
    }, []);

    // Cargar sesiones cuando cambie el vehículo seleccionado
    useEffect(() => {
        const loadSessions = async () => {
            if (!selectedVehicleId) {
                setSessions([]);
                return;
            }

            setLoading(true);
            try {
                const data = await apiService.get(`/api/sessions?vehicleId=${selectedVehicleId}&limit=20`);
                if (data.success && data.data && Array.isArray(data.data)) {
                    // Mapear sesiones de PostgreSQL al formato esperado
                    // Solo incluir sesiones que tienen datos GPS válidos (pointsCount > 0)
                    const sessionsWithGPS = data.data.filter((s: any) => (s.pointsCount || s.gpsPoints || 0) > 0);

                    const mappedSessions: Session[] = sessionsWithGPS
                        .map((s: any) => {
                            // Calcular duración real en minutos desde las fechas de inicio y fin
                            let durationMinutes = 0;

                            // Intentar diferentes combinaciones de campos de fecha
                            const startTime = s.startedAt || s.startTime;
                            const endTime = s.endedAt || s.endTime;

                            if (startTime && endTime) {
                                const start = new Date(startTime);
                                const end = new Date(endTime);

                                // Verificar que las fechas son válidas
                                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                                    durationMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));

                                    // Validar duración realista para vehículos de bomberos
                                    const MAX_REALISTIC_DURATION = 480; // 8 horas máximo
                                    const MIN_REALISTIC_DURATION = 5;   // 5 minutos mínimo

                                    if (durationMinutes > MAX_REALISTIC_DURATION) {
                                        durationMinutes = MAX_REALISTIC_DURATION;
                                    } else if (durationMinutes < MIN_REALISTIC_DURATION) {
                                        durationMinutes = MIN_REALISTIC_DURATION;
                                    }
                                }
                            } else if (s.duration) {
                                // Fallback: si ya viene en segundos, convertir a minutos
                                durationMinutes = Math.floor(s.duration / 60);
                            }

                            return {
                                id: s.id,
                                vehicle_id: s.vehicleId,
                                vehicle_name: s.vehicleName || 'Vehículo',
                                start_date: startTime || s.startedAt || s.startTime,
                                end_date: endTime || s.endedAt || s.endTime,
                                duration: durationMinutes,
                                status: s.status || 'completed'
                            };
                        });
                    setSessions(mappedSessions);
                } else {
                    setSessions([]);
                }
            } catch (error) {
                logger.error('Error cargando sesiones', { error });
                setSessions([]);
            } finally {
                setLoading(false);
            }
        };

        loadSessions();
    }, [selectedVehicleId]);

    const handleVehicleChange = (event: any) => {
        const vehicleId = event.target.value;
        onVehicleChange?.(vehicleId);
        onSessionChange?.(''); // Limpiar sesión seleccionada
        logger.info('Vehículo seleccionado', { vehicleId, userId: user?.id });
    };

    const handleSessionChange = (event: any) => {
        const sessionId = event.target.value;
        onSessionChange?.(sessionId);
        logger.info('Sesión seleccionada', { sessionId, vehicleId: selectedVehicleId, userId: user?.id });
    };

    return (
        <Box className={`${className}`}>
            <Grid container spacing={1} alignItems="center">
                {/* Selector de Vehículo */}
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                        <InputLabel id="vehicle-select-label">
                            <Box display="flex" alignItems="center" gap={0.5}>
                                <TruckIcon className="h-3 w-3" />
                                Vehículo
                            </Box>
                        </InputLabel>
                        <Select
                            labelId="vehicle-select-label"
                            value={vehicles.find(v => v.id === selectedVehicleId) ? selectedVehicleId : ''}
                            label="Vehículo"
                            onChange={handleVehicleChange}
                            disabled={loading}
                        >
                            {vehicles.map((vehicle) => (
                                <MenuItem key={vehicle.id} value={vehicle.id}>
                                    <Typography variant="body2">
                                        {vehicle.name} ({vehicle.license_plate})
                                    </Typography>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* Selector de Sesión */}
                {showSessionSelector && (
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small" disabled={!selectedVehicleId}>
                            <InputLabel id="session-select-label">
                                <Box display="flex" alignItems="center" gap={0.5}>
                                    <ClockIcon className="h-3 w-3" />
                                    Sesión
                                </Box>
                            </InputLabel>
                            <Select
                                labelId="session-select-label"
                                value={sessions.find(s => s.id === selectedSessionId) ? selectedSessionId : ''}
                                label="Sesión"
                                onChange={handleSessionChange}
                                disabled={loading || !selectedVehicleId}
                            >
                                {sessions.map((session) => {
                                    // Formatear duración de manera más legible
                                    const hours = Math.floor(session.duration / 60);
                                    const minutes = session.duration % 60;
                                    let durationText;

                                    if (hours > 0) {
                                        durationText = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
                                    } else {
                                        durationText = `${minutes}m`;
                                    }

                                    const formatted = `${new Date(session.start_date).toLocaleDateString('es-ES')} - ${durationText}`;

                                    return (
                                        <MenuItem key={session.id} value={session.id}>
                                            <Typography variant="body2">
                                                {formatted}
                                            </Typography>
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};
