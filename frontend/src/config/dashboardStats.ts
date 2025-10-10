import { BOMBEROS_MADRID_VEHICLES } from './vehicles';
// Calcular estadísticas basadas en los datos de vehículos
const calculateDashboardStats = () => {
    const totalVehicles = BOMBEROS_MADRID_VEHICLES.length;
    const totalSessions = BOMBEROS_MADRID_VEHICLES.reduce((acc, vehicle) => acc + vehicle.sessionsCount, 0);
    const totalAlarms = BOMBEROS_MADRID_VEHICLES.reduce((acc, vehicle) => acc + vehicle.alertsCount, 0);

    // Calcular datos procesados (estimación basada en sesiones)
    const totalDataProcessed = totalSessions * 1500; // Asumiendo 1500 puntos de datos por sesión

    return {
        vehicleCount: totalVehicles,
        sessionCount: totalSessions,
        telemetryCount: totalDataProcessed,
        alarmCount: totalAlarms,
        lastUpdated: new Date().toISOString()
    };
};

export const DASHBOARD_STATS = calculateDashboardStats(); 