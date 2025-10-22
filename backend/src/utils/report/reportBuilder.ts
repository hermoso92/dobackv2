import { PrismaClient, Report } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore falta tipos
import { CreateReportDto } from '../../dtos/createReportDto';
import { getStabilityEvents } from '../../services/StabilityEventService';
import { logger } from '../../utils/logger';
import { createSpeedStabilityChart } from './chart';
import { fetchMapboxStatic } from './mapbox';



interface BuildResult {
    filePath: string;
    size: number;
}

export async function buildReportPdf(report: Report): Promise<BuildResult> {
    const params = report.params as unknown as CreateReportDto;
    const { sessionId, filters } = params;

    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { vehicle: true }
    });
    if (!session) throw new Error('Sesión no encontrada');

    // Obtener eventos de estabilidad de la BBDD con filtros aplicados
    const stabilityEvents = await getStabilityEvents(sessionId, {
        speedFilter: filters?.speedFilter,
        rpmFilter: filters?.rpmFilter,
        rotativoOnly: filters?.rotativoOnly,
        selectedTypes: filters?.selectedTypes
    });

    // Obtener eventos de overspeed (EjecucionEvento) si no hay filtros de tipo o si se incluye overspeed
    let overspeedEvents: any[] = [];
    if (!filters?.selectedTypes || filters.selectedTypes.includes('limite_superado_velocidad')) {
        overspeedEvents = await prisma.ejecucionEvento.findMany({
            where: {
                sessionId,
                event: {
                    type: 'GPS' // Solo eventos de GPS (overspeed)
                }
            },
            include: {
                event: true
            },
            orderBy: { triggeredAt: 'asc' }
        });
    }

    // Convertir eventos de overspeed al formato estándar
    const overspeedFormatted = overspeedEvents.map((ev) => ({
        id: ev.id,
        session_id: sessionId,
        timestamp: ev.triggeredAt,
        lat: (ev.location as any)?.latitude || 0,
        lon: (ev.location as any)?.longitude || 0,
        type: 'limite_superado_velocidad',
        details: {
            eventName: ev.event.name,
            displayData: ev.displayData,
            data: ev.data
        }
    }));

    // Combinar todos los eventos
    let allEvents = [...stabilityEvents, ...overspeedFormatted].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ) as any[];

    logger.info('Eventos encontrados para reporte', {
        stabilityEvents: stabilityEvents.length,
        overspeedEvents: overspeedFormatted.length,
        totalEvents: allEvents.length,
        filters: filters
    });

    // Obtener datos GPS para asignar coordenadas a eventos de estabilidad
    const gpsData = await prisma.gpsMeasurement.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
        select: { timestamp: true, latitude: true, longitude: true, speed: true }
    });

    // Obtener datos CAN para filtros de RPM y rotativo
    const canData = await prisma.canMeasurement.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
        select: { timestamp: true, engineRpm: true }
    });

    // Asignar coordenadas GPS y datos CAN a eventos
    allEvents = allEvents.map((event) => {
        const nearestGps = nearestPoint(gpsData, event.timestamp);
        const nearestCan = nearestPoint(canData, event.timestamp);

        return {
            ...event,
            lat: event.lat === 0 && nearestGps ? nearestGps.latitude : event.lat,
            lon: event.lon === 0 && nearestGps ? nearestGps.longitude : event.lon,
            can: nearestCan
                ? {
                      vehicleSpeed: nearestGps?.speed || 0,
                      engineRPM: nearestCan.engineRpm || 0,
                      rotativo: false // Campo no disponible en BD, usar false por defecto
                  }
                : undefined
        };
    });

    // Aplicar filtros adicionales (igual que en el frontend)
    let filteredEvents = allEvents as any[];

    // Filtro de velocidad
    if (filters?.speedFilter && filters.speedFilter !== 'all') {
        const minSpeed = parseInt(filters.speedFilter, 10);
        filteredEvents = filteredEvents.filter((ev: any) => {
            const speedVal = ev.can?.vehicleSpeed ?? 0;
            return speedVal > minSpeed;
        });
        logger.info('Filtro velocidad aplicado', {
            minSpeed,
            eventosAntes: allEvents.length,
            eventosDespues: filteredEvents.length
        });
    }

    // Filtro de RPM
    if (filters?.rpmFilter && filters.rpmFilter !== 'all') {
        const minRpm = parseInt(filters.rpmFilter, 10);
        filteredEvents = filteredEvents.filter((ev: any) => {
            const rpmVal = ev.can?.engineRPM ?? 0;
            return rpmVal > minRpm;
        });
        logger.info('Filtro RPM aplicado', {
            minRpm,
            eventosAntes: allEvents.length,
            eventosDespues: filteredEvents.length
        });
    }

    // Filtro de rotativo (no aplicable ya que el campo no existe en BD)
    if (filters?.rotativoOnly) {
        logger.info('Filtro rotativo solicitado pero no aplicable (campo no disponible en BD)', {
            eventosAntes: allEvents.length
        });
        // No filtrar por rotativo ya que el campo no existe en la base de datos
    }

    logger.info('Filtros aplicados', {
        eventosOriginales: allEvents.length,
        eventosFiltrados: filteredEvents.length,
        filtrosAplicados: {
            speedFilter: filters?.speedFilter,
            rpmFilter: filters?.rpmFilter,
            rotativoOnly: filters?.rotativoOnly,
            selectedTypes: filters?.selectedTypes
        }
    });

    // series gps/si/can para gráfica y detalles
    const siSeries = await prisma.stabilityMeasurement.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
        select: { timestamp: true, si: true }
    });
    const canSeries = await prisma.canMeasurement.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
        select: { timestamp: true, engineRpm: true }
    });

    // Grafica velocidad / SI
    let chartPng: Buffer | null = null;
    try {
        chartPng = await createSpeedStabilityChart(gpsData as any, siSeries as any);
    } catch (e) {
        logger.warn('QuickChart error', e);
    }

    // Mapa (primer evento)
    let mapBuffer: Buffer | null = null;
    if (filteredEvents.length) {
        try {
            mapBuffer = await fetchMapboxStatic(filteredEvents[0].lat, filteredEvents[0].lon);
        } catch (e) {
            logger.warn('Mapbox error', e);
        }
    }

    // Construir PDF
    const REPORT_DIR = process.env.REPORT_DIR || path.resolve('./reports');

    // Asegurar que el directorio existe
    if (!fs.existsSync(REPORT_DIR)) {
        logger.info('Creando directorio de reportes', { dir: REPORT_DIR });
        fs.mkdirSync(REPORT_DIR, { recursive: true });
    }

    const filePath = path.join(REPORT_DIR, `${report.id}.pdf`);
    logger.info('Ruta de archivo configurada', { filePath, exists: fs.existsSync(filePath) });

    logger.info('Generando PDF', { filePath, eventsCount: filteredEvents.length });

    await new Promise<void>((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            logger.info('PDF iniciado', { reportId: report.id });

            // Portada
            doc.fontSize(20).text(`Informe de sesión #${session.sessionNumber ?? ''}`, {
                align: 'center'
            });
            doc.moveDown();
            doc.fontSize(12);
            doc.text(`Vehículo: ${session.vehicle?.licensePlate ?? ''}`);
            doc.text(`Inicio: ${session.startTime.toLocaleString('es-ES')}`);
            doc.text(`Fin: ${session.endTime?.toLocaleString('es-ES')}`);
            doc.text(
                `Duración: ${(
                    (session.endTime!.getTime() - session.startTime.getTime()) /
                    60
                ).toFixed(0)} min`
            );
            doc.text(`Total eventos: ${filteredEvents.length}`);

            // Sección de filtros activos
            if (
                filters &&
                (filters.speedFilter !== 'all' ||
                    filters.rpmFilter !== 'all' ||
                    filters.rotativoOnly ||
                    (filters.selectedTypes && filters.selectedTypes.length > 0))
            ) {
                doc.moveDown();
                doc.fontSize(14).text('Filtros aplicados:', { underline: true });
                doc.fontSize(10);

                if (filters.speedFilter && filters.speedFilter !== 'all') {
                    doc.text(`• Velocidad: > ${filters.speedFilter} km/h`);
                }
                if (filters.rpmFilter && filters.rpmFilter !== 'all') {
                    doc.text(`• RPM: > ${filters.rpmFilter}`);
                }
                if (filters.rotativoOnly) {
                    doc.text(`• Solo rotativo: Sí`);
                }
                if (filters.selectedTypes && filters.selectedTypes.length > 0) {
                    doc.text(`• Tipos de evento: ${filters.selectedTypes.join(', ')}`);
                }
            }

            logger.info('Portada completada');

            // Gráfica
            if (chartPng) {
                doc.addPage();
                doc.text('Velocidad vs Estabilidad');
                doc.image(chartPng, { fit: [500, 300] });
                logger.info('Gráfica añadida');
            }

            // Mapa
            if (mapBuffer) {
                doc.addPage();
                doc.text('Ubicación del primer evento');
                doc.image(mapBuffer, { fit: [500, 300] });
                logger.info('Mapa añadido');
            }

            // Tabla eventos (manual sin pdfkit-table)
            doc.addPage();
            doc.fontSize(14).text('Eventos críticos', { align: 'center' });
            doc.moveDown();

            // Configuración de tabla mejorada
            const startX = 40;
            const pageWidth = 500;
            const colWidths = [25, 60, 80, 50, 50, 50, 60, 60];
            const headers = ['#', 'Hora', 'Tipo', 'Vel', 'SI', 'RPM', 'Lat', 'Lon'];
            const maxEventsPerPage = 25;
            const totalEvents = filteredEvents.length;
            const pagesNeeded = Math.ceil(totalEvents / maxEventsPerPage);

            for (let page = 0; page < pagesNeeded; page++) {
                if (page > 0) {
                    doc.addPage();
                    doc.fontSize(14).text('Eventos críticos (continuación)', { align: 'center' });
                    doc.moveDown();
                }

                // Cabecera
                let y = doc.y;
                doc.fontSize(9);
                headers.forEach((header, i) => {
                    const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
                    doc.text(header, x, y);
                });

                // Línea separadora
                y += 15;
                doc.moveTo(startX, y)
                    .lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y)
                    .stroke();
                doc.moveDown(0.3);

                // Filas de datos para esta página
                const startIdx = page * maxEventsPerPage;
                const endIdx = Math.min(startIdx + maxEventsPerPage, totalEvents);
                const pageEvents = filteredEvents.slice(startIdx, endIdx);

                pageEvents.forEach((ev, idx) => {
                    const globalIdx = startIdx + idx;
                    const gps = nearestPoint(gpsData, ev.timestamp);
                    const si = nearestPoint(siSeries, ev.timestamp);
                    const rpm = nearestPoint(canSeries, ev.timestamp);

                    const row = [
                        (globalIdx + 1).toString(),
                        new Date(ev.timestamp).toLocaleTimeString('es-ES'),
                        ev.type,
                        gps ? gps.speed.toFixed(1) : 'N/A',
                        si ? si.si.toFixed(3) : 'N/A',
                        rpm ? rpm.engineRpm.toFixed(0) : 'N/A',
                        ev.lat.toFixed(4),
                        ev.lon.toFixed(4)
                    ];

                    row.forEach((cell, i) => {
                        const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
                        doc.text(cell, x, doc.y);
                    });
                    doc.moveDown(0.2);
                });

                // Información de paginación
                if (pagesNeeded > 1) {
                    doc.moveDown();
                    doc.fontSize(8).text(`Página ${page + 1} de ${pagesNeeded}`, {
                        align: 'center'
                    });
                }
            }

            // Resumen final
            if (totalEvents > 0) {
                doc.addPage();
                doc.fontSize(12).text('Resumen de eventos', { align: 'center' });
                doc.moveDown();
                doc.fontSize(10);
                doc.text(`Total de eventos críticos: ${totalEvents}`);

                // Estadísticas por tipo
                const eventTypes = filteredEvents.reduce((acc, ev) => {
                    acc[ev.type] = (acc[ev.type] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                doc.moveDown();
                doc.text('Eventos por tipo:');
                Object.entries(eventTypes).forEach(([type, count]) => {
                    doc.text(`  • ${type}: ${count} eventos`);
                });
            }

            logger.info('Tabla completada');

            // Finalizar y esperar a que el stream cierre correctamente
            doc.end();

            stream.on('finish', () => {
                const finalSize = fs.statSync(filePath).size;
                logger.info('PDF completado', {
                    filePath,
                    size: finalSize,
                    exists: fs.existsSync(filePath)
                });
                resolve();
            });
            stream.on('error', (err) => {
                logger.error('Error en stream PDF', { err, filePath });
                reject(err);
            });
        } catch (err) {
            logger.error('Error generando PDF', { err, filePath });
            reject(err);
        }
    });

    const size = fs.statSync(filePath).size;
    logger.info('Verificación final del archivo', {
        filePath,
        size,
        exists: fs.existsSync(filePath)
    });
    return { filePath, size };
}

function nearestPoint<T extends { timestamp: Date }>(arr: T[], t: Date): T | null {
    if (!arr.length) return null;
    let best = arr[0];
    let bestDiff = Math.abs(best.timestamp.getTime() - t.getTime());
    for (const el of arr) {
        const d = Math.abs(el.timestamp.getTime() - t.getTime());
        if (d < bestDiff) {
            best = el;
            bestDiff = d;
        }
    }
    return best;
}
