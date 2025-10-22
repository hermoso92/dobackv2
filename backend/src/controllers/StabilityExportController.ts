
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore falta tipos pdfkit
import PDFDocument from 'pdfkit';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore util static map
import { fetchStaticMap } from '../utils/report/staticMap';
// @ts-ignore falta tipos
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore falta tipos
import fs from 'fs';
import path from 'path';



export class StabilityExportController {
    /**
     * Devuelve un PDF con un resumen rápido de la sesión seleccionada.
     * Ruta: GET /stability/export/:sessionId
     */
    async exportSessionPdf(req: Request, res: Response) {
        try {
            const { sessionId } = req.params as { sessionId: string };
            const { eventType } = req.query as { eventType?: string };
            if (!sessionId) {
                return res.status(400).json({ message: 'sessionId requerido' });
            }

            const session = await prisma.session.findUnique({
                where: { id: sessionId },
                include: {
                    vehicle: true
                }
            });

            if (!session) {
                return res.status(404).json({ message: 'Sesión no encontrada' });
            }

            // Eventos críticos (stability_events de la sesión)
            const events = await prisma.stability_events.findMany({
                where: {
                    session_id: sessionId,
                    ...(eventType ? { type: eventType } : {})
                },
                orderBy: { timestamp: 'asc' }
            });

            // Series GPS y SI para gráfica
            const gpsSeries = await prisma.gpsMeasurement.findMany({
                where: { sessionId },
                orderBy: { timestamp: 'asc' },
                select: { timestamp: true, speed: true }
            });
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

            // Métricas rápidas
            const maxSpeed = await prisma.gpsMeasurement.aggregate({
                where: { sessionId },
                _max: { speed: true }
            });
            const avgSI = await prisma.stabilityMeasurement.aggregate({
                where: { sessionId },
                _avg: { si: true }
            });
            const eventsCount = events.length;

            // Crear gráfico velocidad/estabilidad
            let chartPng: Buffer | null = null;
            try {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore util
                chartPng = await createSpeedStabilityChart(gpsSeries, siSeries);
            } catch (e) {
                console.warn('Fallo generando gráfica speed/SI', e);
            }

            // Obtener mapa estático (puede fallar si no hay internet)
            let mapBuffer: Buffer | null = null;
            if (events.length) {
                try {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore fetch static map util
                    mapBuffer = await fetchStaticMap(events[0].lat, events[0].lon);
                } catch (e) {
                    console.warn('Fallo obteniendo mapa estático', e);
                }
            }

            // Crear PDF y canalizar al response
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            doc.pipe(res);
            const fileName = `session-${session.sessionNumber || sessionId}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

            // Logo organización (si existe)
            const logoPath = path.resolve(__dirname, '../../assets/logo.png');
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, { width: 120 });
                doc.moveDown();
            }

            doc.fontSize(20).text(`Informe de sesión #${session.sessionNumber}`, {
                align: 'center'
            });
            doc.moveDown();
            doc.fontSize(12);
            doc.text(
                `Vehículo: ${session.vehicle?.licensePlate || session.vehicle?.name || 'N/A'}`
            );
            doc.text(`Inicio: ${session.startTime.toLocaleString('es-ES')}`);
            if (session.endTime) doc.text(`Fin: ${session.endTime.toLocaleString('es-ES')}`);
            doc.text(
                `Duración: ${
                    session.endTime
                        ? (
                              (session.endTime.getTime() - session.startTime.getTime()) /
                              1000
                          ).toFixed(0)
                        : 'En curso'
                } seg.`
            );
            doc.moveDown();

            doc.text(`Velocidad máxima: ${maxSpeed._max.speed?.toFixed(1) ?? 'N/A'} km/h`);
            doc.text(`Índice de estabilidad medio: ${(avgSI._avg.si ?? 0).toFixed(3)}`);
            doc.text(`Eventos detectados: ${eventsCount}`);

            // Gráfico de velocidad/SI
            if (chartPng) {
                doc.addPage();
                doc.fontSize(14).text('Velocidad y estabilidad a lo largo de la sesión', {
                    underline: true
                });
                doc.moveDown(0.5);
                doc.image(chartPng, { fit: [500, 300] });
            }

            // Tabla de eventos críticos (máx 20)
            doc.moveDown();
            doc.fontSize(14).text('Eventos críticos', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(10);
            if (events.length === 0) {
                doc.text('No se registraron eventos críticos en la sesión.');
            } else {
                const maxLinesPerPage = 40;
                events.forEach((ev, idx) => {
                    const ts = ev.timestamp as Date;
                    // obtener datos velocidad y SI más cercanos
                    const gpsNear = gpsSeries.reduce((prev, curr) => {
                        return Math.abs(curr.timestamp.getTime() - ts.getTime()) <
                            Math.abs(prev.timestamp.getTime() - ts.getTime())
                            ? curr
                            : prev;
                    }, gpsSeries[0]);
                    const siNear = siSeries.reduce((prev, curr) => {
                        return Math.abs(curr.timestamp.getTime() - ts.getTime()) <
                            Math.abs(prev.timestamp.getTime() - ts.getTime())
                            ? curr
                            : prev;
                    }, siSeries[0]);
                    const rpmNear = canSeries.reduce((prev, curr) => {
                        return Math.abs(curr.timestamp.getTime() - ts.getTime()) <
                            Math.abs(prev.timestamp.getTime() - ts.getTime())
                            ? curr
                            : prev;
                    }, canSeries[0]);
                    const speedTxt = gpsNear ? `${gpsNear.speed.toFixed(1)} km/h` : 'N/A';
                    const siTxt = siNear ? siNear.si.toFixed(3) : 'N/A';
                    const rpmTxt = rpmNear ? `${rpmNear.engineRpm.toFixed(0)} rpm` : 'N/A';
                    doc.text(
                        `${idx + 1}. ${ev.type}  ${ts.toLocaleString('es-ES')}  (${ev.lat.toFixed(
                            4
                        )}, ${ev.lon.toFixed(4)})  Vel:${speedTxt}  SI:${siTxt}  RPM:${rpmTxt}`
                    );
                    if ((idx + 1) % maxLinesPerPage === 0 && idx + 1 < events.length) {
                        doc.addPage();
                        doc.fontSize(10);
                    }
                });
            }

            // Mapa
            if (mapBuffer) {
                doc.addPage();
                doc.fontSize(14).text('Ubicación del primer evento', { underline: true });
                doc.moveDown(0.5);
                doc.image(mapBuffer, { fit: [500, 300] });
            }

            doc.end();
        } catch (error) {
            console.error('Error generando PDF', error);
            res.status(500).json({ message: 'Error generando PDF' });
        }
    }
}
