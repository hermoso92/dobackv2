import { Request, Response } from 'express';

function parseDate(value?: string): Date | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function getKpiDashboardHandler(req: Request, res: Response) {
    console.log('🎯 Ejecutando getKpiDashboardHandler');

    // Datos mock para el dashboard ejecutivo
    const mockData = {
        period: req.query.period || 'day',
        lastUpdate: new Date().toISOString(),
        organizationId: 'test-org',

        // Tiempos operativos
        timeInPark: 156.5,
        timeOutOfPark: 43.2,
        timeInParkWithRotary: 12.8,
        timeInWorkshopWithRotary: 3.2,
        timeInEnclave5: 8.5,
        timeInEnclave2: 15.3,
        timeOutOfParkWithRotary: 28.7,

        // Estados operativos
        vehiclesInPark: 12,
        vehiclesOutOfPark: 8,
        vehiclesWithRotaryOn: 15,
        vehiclesWithRotaryOff: 5,
        vehiclesInWorkshop: 2,

        // Eventos e incidencias
        totalEvents: 47,
        criticalEvents: 3,
        severeEvents: 8,
        lightEvents: 36,

        // Excesos y cumplimiento
        timeExcesses: 4,
        speedExcesses: 12,
        complianceRate: 94.2,

        // Métricas de estabilidad
        ltrScore: 8.7,
        ssfScore: 7.9,
        drsScore: 8.2,

        // Metadatos
        totalVehicles: 20,
        activeVehicles: 18,
        totalSessions: 25
    };

    console.log('📊 Enviando datos del dashboard ejecutivo:', mockData);

    res.json({
        success: true,
        data: mockData,
        message: 'Dashboard ejecutivo cargado exitosamente'
    });
}

export async function getHeatmapHandler(req: Request, res: Response) {
    res.json({ success: true, data: [] });
}

export async function getSpeedingHandler(req: Request, res: Response) {
    res.json({ success: true, data: [] });
}
