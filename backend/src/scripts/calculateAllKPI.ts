
import { calculateVehicleKPI } from '../services/calculateVehicleKPI';



(async () => {
    console.info('🔄 Iniciando cálculo histórico de KPIs de todos los vehículos y fechas...');
    try {
        // Obtener todas las fechas de sesiones y vehículos únicos
        const sesiones = await prisma.session.findMany({
            select: { vehicleId: true, startTime: true, endTime: true, organizationId: true },
            orderBy: { startTime: 'asc' }
        });
        // Agrupar por vehículo y fechas (rango completo de cada sesión)
        const fechasPorVehiculo: Record<string, { date: string, org: string }[]> = {};
        for (const s of sesiones) {
            const start = new Date(s.startTime);
            const end = new Date(s.endTime || s.startTime);
            let d = new Date(start);
            while (d <= end) {
                const fecha = d.toISOString().slice(0, 10);
                if (!fechasPorVehiculo[s.vehicleId]) fechasPorVehiculo[s.vehicleId] = [];
                if (!fechasPorVehiculo[s.vehicleId].some(f => f.date === fecha)) {
                    fechasPorVehiculo[s.vehicleId].push({ date: fecha, org: s.organizationId });
                }
                d.setUTCDate(d.getUTCDate() + 1); // avanzar un día
            }
        }
        // Recorrer cada vehículo y cada fecha
        for (const [vehicleId, fechas] of Object.entries(fechasPorVehiculo)) {
            for (const { date, org } of fechas) {
                try {
                    await calculateVehicleKPI(vehicleId, new Date(date), org);
                    console.info(`✅ KPI calculado para vehículo ${vehicleId} en fecha ${date}`);
                } catch (err) {
                    console.error(`❌ Error calculando KPI para vehículo ${vehicleId} en fecha ${date}:`, err);
                }
            }
        }
        console.info('✅ Cálculo histórico de KPIs finalizado.');
    } catch (err) {
        console.error('❌ Error en el cálculo histórico de KPIs:', err);
        process.exit(1);
    }
    process.exit(0);
})(); 