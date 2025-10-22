import { ClockIcon, TruckIcon } from '@heroicons/react/24/outline';
import { Box, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
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
                logger.info('🔍 VehicleSessionSelector: cargando vehículos...');
                const response = await fetch('/api/vehicles');
                if (response.ok) {
                    const data = await response.json();
                    logger.info('📊 VehicleSessionSelector: respuesta vehículos:', data);
                    if (data.success && data.data) {
                        // Mapear vehículos de PostgreSQL al formato esperado
                        const mappedVehicles: Vehicle[] = data.data.map((v: any) => ({
                            id: v.id,
                            name: v.name || v.licensePlate || `Vehículo ${v.id}`,
                            license_plate: v.licensePlate || '',
                            vehicle_type: v.type || 'BOMBA_ESCALERA',
                            is_active: v.active !== false
                        }));
                        logger.info('✅ VehicleSessionSelector: vehículos mapeados:', mappedVehicles);
                        setVehicles(mappedVehicles);
                    } else {
                        logger.warn('⚠️ VehicleSessionSelector: no hay vehículos en la respuesta');
                        setVehicles([]);
                    }
                } else {
                    logger.warn('❌ VehicleSessionSelector: error en respuesta:', response.status);
                    setVehicles([]);
                }
            } catch (error) {
                logger.error('❌ VehicleSessionSelector: error cargando vehículos:', error);
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
                logger.info('🔍 VehicleSessionSelector: cargando sesiones para vehículo:', selectedVehicleId);
                const response = await fetch(`/api/sessions?vehicleId=${selectedVehicleId}&limit=20`);
                if (response.ok) {
                    const data = await response.json();
                    logger.info('📊 VehicleSessionSelector: respuesta sesiones:', data);
                    if (data.success && data.data) {
                        // Mapear sesiones de PostgreSQL al formato esperado
                        // Solo incluir sesiones que tienen datos GPS válidos (gpsPoints > 0)
                        const mappedSessions: Session[] = data.data
                            .filter((s: any) => s.gpsPoints > 0) // Solo sesiones con GPS válidos
                            .map((s: any) => ({
                                id: s.id,
                                vehicle_id: s.vehicleId,
                                vehicle_name: s.vehicleName || 'Vehículo',
                                start_date: s.startTime || s.startedAt,
                                end_date: s.endTime || s.endedAt,
                                duration: s.duration ? Math.floor(s.duration / 60) : 0, // convertir segundos a minutos
                                status: s.status || 'completed'
                            }));
                        logger.info('✅ VehicleSessionSelector: sesiones mapeadas:', mappedSessions);
                        setSessions(mappedSessions);
                    } else {
                        logger.warn('⚠️ VehicleSessionSelector: no hay sesiones en la respuesta');
                        setSessions([]);
                    }
                } else {
                    logger.warn('❌ VehicleSessionSelector: error en respuesta sesiones:', response.status);
                    setSessions([]);
                }
            } catch (error) {
                logger.error('❌ VehicleSessionSelector: error cargando sesiones:', error);
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

    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
    const selectedSession = sessions.find(s => s.id === selectedSessionId);

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
                                {sessions.map((session) => (
                                    <MenuItem key={session.id} value={session.id}>
                                        <Typography variant="body2">
                                            {new Date(session.start_date).toLocaleDateString('es-ES')} - {session.duration}min
                                        </Typography>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};
