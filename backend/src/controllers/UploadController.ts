import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { AppError } from '../middleware/error';
import { logger } from '../utils/logger';

export class UploadController {
    public async uploadFile(req: Request, res: Response): Promise<void> {
        try {
            if (!req.file) {
                throw new AppError(400, 'No se ha subido ningún archivo');
            }

            const organizationId = req.user?.organizationId;
            const { vehicleId, type } = req.body;

            if (!organizationId) {
                logger.warn('Intento de subida de archivo sin organizationId');
                throw new AppError(400, 'Se requiere organizationId');
            }

            if (!vehicleId || !type) {
                throw new AppError(400, 'Faltan campos requeridos: vehicleId, type');
            }

            // Validar que el vehículo pertenece a la organización del usuario
            // Nota: Aquí se podría agregar una validación adicional con Prisma
            // para verificar que el vehicleId pertenece a la organizationId del usuario

            // Crear estructura de directorios
            const basePath = path.join(
                process.cwd(),
                'uploads',
                'organizations',
                String(organizationId),
                'vehicles',
                String(vehicleId),
                type
            );

            // Crear directorios si no existen
            await fs.mkdir(basePath, { recursive: true });

            // Mover archivo a la ubicación final
            const finalPath = path.join(basePath, req.file.filename);
            await fs.rename(req.file.path, finalPath);

            logger.info('Archivo subido exitosamente', {
                path: finalPath,
                organizationId,
                vehicleId,
                type,
                userId: req.user?.id
            });

            res.status(200).json({
                success: true,
                message: 'Archivo subido exitosamente',
                data: {
                    path: finalPath,
                    filename: req.file.filename,
                    originalname: req.file.originalname,
                    mimetype: req.file.mimetype,
                    size: req.file.size,
                    organizationId: organizationId
                }
            });
        } catch (error) {
            logger.error('Error al subir archivo:', error);
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    error: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Error al procesar el archivo'
                });
            }
        }
    }
}
