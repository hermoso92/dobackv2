import { PrismaClient } from '@prisma/client';
import { parseCANFile, parseGPSFile, parseRotativoFile, parseStabilityFile, translateCANIfNeeded } from '../utils/sessionParsers';

const prisma = new PrismaClient();

export class SessionsUploadController {
    async uploadSessionData(req: Request, res: Response) {
        try {
            const { vehicleId } = req.body;
            const files = req.files as Record<string, any>;
            if (!vehicleId) {
                return res.status(400).json({ error: 'Falta vehicleId' });
            }
            if (!files.stabilityFile || files.stabilityFile.length === 0) {
                return res.status(400).json({ error: 'El archivo de Estabilidad es obligatorio' });
            }
            // Leer buffers
            const stabilityBuffer = files.stabilityFile[0].buffer;
            const canBuffer = files.canFile?.[0]?.buffer;
            const gpsBuffer = files.gpsFile?.[0]?.buffer;
            const rotativoBuffer = files.rotativoFile?.[0]?.buffer;

            // Parsear archivos
            const descartes: Record<string, any[]> = { CAN: [], GPS: [], ESTABILIDAD: [], ROTATIVO: [] };
            const stabilityData = parseStabilityFile(stabilityBuffer, descartes);
            let canData = canBuffer ? parseCANFile(canBuffer, descartes) : [];
            // Si el CAN es txt, traducirlo
            if (canBuffer && files.canFile[0].originalname.endsWith('.txt')) {
                canData = translateCANIfNeeded(canBuffer, descartes);
            }
            const gpsData = gpsBuffer ? parseGPSFile(gpsBuffer, descartes) : [];
            const rotativoData = rotativoBuffer ? parseRotativoFile(rotativoBuffer, descartes) : [];

            // Aquí se puede guardar la sesión y los datos si se requiere
            // ...

            return res.json({
                success: true,
                descartes,
                stabilityCount: stabilityData.length,
                canCount: canData.length,
                gpsCount: gpsData.length,
                rotativoCount: rotativoData.length
            });
        } catch (error) {
            return res.status(500).json({ error: 'Error interno al procesar la sesión' });
        }
    }
} 