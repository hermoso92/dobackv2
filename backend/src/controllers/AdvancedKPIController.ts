import { Request, Response } from 'express';
import { advancedKpiService } from '../services/AdvancedKPIService';
import { logger } from '../utils/logger';

export class AdvancedKPIController {

    /**
     * Obtiene KPIs avanzados de un vehículo específico
     */
    static async getVehicleAdvancedKPI(req: Request, res: Response) {
        try {
            const { vehicleId } = req.params;
            const { date } = req.query;
            const organizationId = (req as any).organizationId;

            if (!vehicleId) {
                return res.status(400).json({ error: 'ID de vehículo requerido' });
            }

            const targetDate = date ? new Date(date as string) : new Date();

            logger.info(`[AdvancedKPI] Solicitando KPIs para vehículo ${vehicleId} en fecha ${targetDate.toISOString().slice(0, 10)}`);

            const kpiData = await advancedKpiService.calculateAdvancedVehicleKPI(
                vehicleId,
                targetDate,
                organizationId
            );

            res.json({
                success: true,
                data: kpiData,
                message: 'KPIs avanzados calculados correctamente'
            });

        } catch (error) {
            logger.error('[AdvancedKPI] Error en getVehicleAdvancedKPI:', error);
            res.status(500).json({
                success: false,
                error: 'Error al calcular KPIs avanzados',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Obtiene formato de dashboard para KPIs avanzados
     */
    static async getDashboardFormat(req: Request, res: Response) {
        try {
            const { vehicleId, vehicleIds, allVehicles, date, startDate, endDate, dateRange } = req.query;
            const organizationId = (req as any).organizationId;

            // Validar que se proporcione al menos un vehículo
            if (!vehicleId && !vehicleIds && !allVehicles) {
                return res.status(400).json({ error: 'ID de vehículo, IDs de vehículos o flag allVehicles requerido' });
            }

            let kpiData;

            // Determinar el tipo de consulta
            if (dateRange === 'range' && startDate && endDate) {
                // Consulta por rango de fechas
                const start = new Date(startDate as string);
                const end = new Date(endDate as string);

                if (allVehicles === 'true') {
                    logger.info(`[AdvancedKPI] Solicitando formato dashboard para todos los vehículos en rango ${start.toISOString().slice(0, 10)} - ${end.toISOString().slice(0, 10)}`);
                    kpiData = await advancedKpiService.calculateAdvancedAllVehiclesKPIRange(
                        start,
                        end,
                        organizationId
                    );
                } else if (vehicleIds) {
                    const ids = (vehicleIds as string).split(',');
                    logger.info(`[AdvancedKPI] Solicitando formato dashboard para vehículos ${ids.join(', ')} en rango ${start.toISOString().slice(0, 10)} - ${end.toISOString().slice(0, 10)}`);
                    kpiData = await advancedKpiService.calculateAdvancedMultipleVehiclesKPIRange(
                        ids,
                        start,
                        end,
                        organizationId
                    );
                } else {
                    logger.info(`[AdvancedKPI] Solicitando formato dashboard para vehículo ${vehicleId} en rango ${start.toISOString().slice(0, 10)} - ${end.toISOString().slice(0, 10)}`);
                    kpiData = await advancedKpiService.calculateAdvancedVehicleKPIRange(
                        vehicleId as string,
                        start,
                        end,
                        organizationId
                    );
                }
            } else if (dateRange === 'all_time') {
                // Consulta para todo el tiempo
                if (allVehicles === 'true') {
                    logger.info(`[AdvancedKPI] Solicitando formato dashboard para todos los vehículos - todo el tiempo`);
                    kpiData = await advancedKpiService.calculateAdvancedAllVehiclesKPIAllTime(
                        organizationId
                    );
                } else if (vehicleIds) {
                    const ids = (vehicleIds as string).split(',');
                    logger.info(`[AdvancedKPI] Solicitando formato dashboard para vehículos ${ids.join(', ')} - todo el tiempo`);
                    kpiData = await advancedKpiService.calculateAdvancedMultipleVehiclesKPIAllTime(
                        ids,
                        organizationId
                    );
                } else {
                    logger.info(`[AdvancedKPI] Solicitando formato dashboard para vehículo ${vehicleId} - todo el tiempo`);
                    kpiData = await advancedKpiService.calculateAdvancedVehicleKPIAllTime(
                        vehicleId as string,
                        organizationId
                    );
                }
            } else {
                // Consulta por fecha específica (comportamiento actual)
                const targetDate = date ? new Date(date as string) : new Date();

                if (allVehicles === 'true') {
                    logger.info(`[AdvancedKPI] Solicitando formato dashboard para todos los vehículos en fecha ${targetDate.toISOString().slice(0, 10)}`);
                    kpiData = await advancedKpiService.calculateAdvancedAllVehiclesKPI(
                        targetDate,
                        organizationId
                    );
                } else if (vehicleIds) {
                    const ids = (vehicleIds as string).split(',');
                    logger.info(`[AdvancedKPI] Solicitando formato dashboard para vehículos ${ids.join(', ')} en fecha ${targetDate.toISOString().slice(0, 10)}`);
                    kpiData = await advancedKpiService.calculateAdvancedMultipleVehiclesKPI(
                        ids,
                        targetDate,
                        organizationId
                    );
                } else {
                    logger.info(`[AdvancedKPI] Solicitando formato dashboard para vehículo ${vehicleId} en fecha ${targetDate.toISOString().slice(0, 10)}`);
                    kpiData = await advancedKpiService.calculateAdvancedVehicleKPI(
                        vehicleId as string,
                        targetDate,
                        organizationId
                    );
                }
            }

            // Formatear datos para el dashboard
            const dashboardData = {
                mainBoxes: [
                    {
                        title: 'Tiempo en Parque',
                        value: kpiData.tiempoEnParque,
                        unit: 'min',
                        icon: '🏢',
                        color: 'success',
                        status: kpiData.tiempoEnParque > 0 ? 'good' : 'warning'
                    },
                    {
                        title: 'Tiempo en Taller',
                        value: kpiData.tiempoEnTaller,
                        unit: 'min',
                        icon: '🔧',
                        color: 'info',
                        status: kpiData.tiempoEnTaller > 0 ? 'good' : 'warning'
                    },
                    {
                        title: 'Tiempo Fuera de Parque',
                        value: kpiData.tiempoFueraParque,
                        unit: 'min',
                        icon: '🚗',
                        color: 'warning',
                        status: kpiData.tiempoFueraParque > 0 ? 'warning' : 'good'
                    }
                ],
                speedBoxes: [
                    {
                        title: 'Velocidad Máxima',
                        value: kpiData.maxVelocidadAlcanzada,
                        unit: 'km/h',
                        icon: '⚡',
                        color: 'primary',
                        status: kpiData.maxVelocidadAlcanzada > 80 ? 'danger' : 'good'
                    },
                    {
                        title: 'Velocidad Promedio',
                        value: kpiData.velocidadPromedio,
                        unit: 'km/h',
                        icon: '📊',
                        color: 'secondary',
                        status: kpiData.velocidadPromedio > 50 ? 'warning' : 'good'
                    },
                    {
                        title: 'Tiempo Excediendo',
                        value: kpiData.tiempoExcediendoVelocidad,
                        unit: 'min',
                        icon: '⚠️',
                        color: 'error',
                        status: kpiData.tiempoExcediendoVelocidad > 0 ? 'danger' : 'good'
                    }
                ],
                speedExcessBoxes: [
                    {
                        title: 'Excesos Leves',
                        value: kpiData.excesosVelocidadLeves,
                        unit: 'veces',
                        icon: '🟡',
                        color: 'warning',
                        status: kpiData.excesosVelocidadLeves > 10 ? 'warning' : 'good'
                    },
                    {
                        title: 'Excesos Moderados',
                        value: kpiData.excesosVelocidadModerados,
                        unit: 'veces',
                        icon: '🟠',
                        color: 'warning',
                        status: kpiData.excesosVelocidadModerados > 5 ? 'warning' : 'good'
                    },
                    {
                        title: 'Excesos Graves',
                        value: kpiData.excesosVelocidadGraves,
                        unit: 'veces',
                        icon: '🔴',
                        color: 'error',
                        status: kpiData.excesosVelocidadGraves > 0 ? 'danger' : 'good'
                    },
                    {
                        title: 'Excesos Muy Graves',
                        value: kpiData.excesosVelocidadMuyGraves,
                        unit: 'veces',
                        icon: '🛑',
                        color: 'error',
                        status: kpiData.excesosVelocidadMuyGraves > 0 ? 'danger' : 'good'
                    }
                ],
                eventBoxes: [
                    {
                        title: 'Eventos Críticos',
                        value: kpiData.eventosCriticos,
                        unit: 'eventos',
                        icon: '🚨',
                        color: 'error',
                        status: kpiData.eventosCriticos > 0 ? 'danger' : 'good'
                    },
                    {
                        title: 'Eventos Peligrosos',
                        value: kpiData.eventosPeligrosos,
                        unit: 'eventos',
                        icon: '⚠️',
                        color: 'warning',
                        status: kpiData.eventosPeligrosos > 0 ? 'warning' : 'good'
                    },
                    {
                        title: 'Eventos Moderados',
                        value: kpiData.eventosModerados,
                        unit: 'eventos',
                        icon: '📊',
                        color: 'info',
                        status: kpiData.eventosModerados > 5 ? 'warning' : 'good'
                    },
                    {
                        title: 'Eventos Leves',
                        value: kpiData.eventosLeves,
                        unit: 'eventos',
                        icon: 'ℹ️',
                        color: 'success',
                        status: kpiData.eventosLeves > 10 ? 'warning' : 'good'
                    }
                ],
                statsBoxes: [
                    {
                        title: 'Distancia Recorrida',
                        value: kpiData.distanciaRecorrida,
                        unit: 'km',
                        icon: '📏',
                        color: 'primary',
                        status: 'good'
                    },
                    {
                        title: 'Tiempo en Movimiento',
                        value: kpiData.tiempoEnMovimiento,
                        unit: 'min',
                        icon: '🚀',
                        color: 'success',
                        status: 'good'
                    },
                    {
                        title: 'Tiempo Detenido',
                        value: kpiData.tiempoDetenido,
                        unit: 'min',
                        icon: '⏸️',
                        color: 'info',
                        status: 'good'
                    },
                    {
                        title: 'Puntos GPS',
                        value: kpiData.totalPuntosGPS,
                        unit: 'puntos',
                        icon: '📍',
                        color: 'secondary',
                        status: 'good'
                    }
                ],
                operationalKeys: [
                    {
                        title: 'Clave 2 (Rotativo ON fuera)',
                        value: kpiData.clave2Minutes,
                        unit: 'min',
                        icon: '🔑',
                        color: 'warning',
                        status: kpiData.clave2Minutes > 0 ? 'warning' : 'good'
                    },
                    {
                        title: 'Clave 5 (Rotativo OFF fuera)',
                        value: kpiData.clave5Minutes,
                        unit: 'min',
                        icon: '🔑',
                        color: 'error',
                        status: kpiData.clave5Minutes > 0 ? 'danger' : 'good'
                    }
                ],
                rawData: kpiData
            };

            res.json({
                success: true,
                data: dashboardData,
                message: 'Formato de dashboard generado correctamente'
            });

        } catch (error) {
            logger.error('[AdvancedKPI] Error en getDashboardFormat:', error);
            res.status(500).json({
                success: false,
                error: 'Error al generar formato de dashboard',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Compara KPIs entre fechas
     */
    static async compareKPIs(req: Request, res: Response) {
        try {
            const { vehicleId, date1, date2 } = req.query;
            const organizationId = (req as any).organizationId;

            if (!vehicleId || !date1 || !date2) {
                return res.status(400).json({ error: 'ID de vehículo y ambas fechas requeridas' });
            }

            const targetDate1 = new Date(date1 as string);
            const targetDate2 = new Date(date2 as string);

            logger.info(`[AdvancedKPI] Comparando KPIs para vehículo ${vehicleId} entre ${date1} y ${date2}`);

            const [kpiData1, kpiData2] = await Promise.all([
                advancedKpiService.calculateAdvancedVehicleKPI(
                    vehicleId as string,
                    targetDate1,
                    organizationId
                ),
                advancedKpiService.calculateAdvancedVehicleKPI(
                    vehicleId as string,
                    targetDate2,
                    organizationId
                )
            ]);

            // Calcular diferencias
            const comparison = {
                date1: {
                    date: targetDate1.toISOString().slice(0, 10),
                    data: kpiData1
                },
                date2: {
                    date: targetDate2.toISOString().slice(0, 10),
                    data: kpiData2
                },
                differences: {
                    tiempoEnParque: kpiData2.tiempoEnParque - kpiData1.tiempoEnParque,
                    tiempoEnTaller: kpiData2.tiempoEnTaller - kpiData1.tiempoEnTaller,
                    tiempoFueraParque: kpiData2.tiempoFueraParque - kpiData1.tiempoFueraParque,
                    eventosCriticos: kpiData2.eventosCriticos - kpiData1.eventosCriticos,
                    eventosPeligrosos: kpiData2.eventosPeligrosos - kpiData1.eventosPeligrosos,
                    maxVelocidadAlcanzada: kpiData2.maxVelocidadAlcanzada - kpiData1.maxVelocidadAlcanzada,
                    velocidadPromedio: kpiData2.velocidadPromedio - kpiData1.velocidadPromedio
                }
            };

            res.json({
                success: true,
                data: comparison,
                message: 'Comparación de KPIs generada correctamente'
            });

        } catch (error) {
            logger.error('[AdvancedKPI] Error en compareKPIs:', error);
            res.status(500).json({
                success: false,
                error: 'Error al comparar KPIs',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
} 