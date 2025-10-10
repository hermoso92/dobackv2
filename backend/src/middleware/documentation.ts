import { EventSeverity, EventType } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from './error';

interface DocumentConfig {
    type: 'manual' | 'report' | 'maintenance';
    format: 'pdf' | 'json' | 'html';
    vehicleId?: number;
    organizationId?: number;
}

interface DocumentMetadata {
    documentType: string;
    format: string;
    path: string;
    vehicleId?: number;
    organizationId?: number;
}

interface DocumentEvent {
    id: number;
    type: EventType;
    severity: EventSeverity;
    description: string;
    metadata: DocumentMetadata;
    vehicleId?: number;
    organizationId?: number;
}

// Generar nombre de archivo
const generateFileName = (config: DocumentConfig, data: any): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const prefix = config.type === 'manual' ? 'MAN' : config.type === 'report' ? 'REP' : 'MNT';
    const identifier = data.id || data.vehicleId || data.organizationId || 'GEN';
    return `${prefix}_${identifier}_${timestamp}.${config.format}`;
};

// Generar documento HTML
const generateHtmlDocument = (data: any, template: string): string => {
    // Aquí iría la lógica para generar HTML usando un motor de plantillas
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || '');
};

// Generar documento JSON
const generateJsonDocument = (data: any): string => {
    return JSON.stringify(data, null, 2);
};

// Middleware para generar documentación
export const documentGeneratorMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const config: DocumentConfig = req.body;
        const data = req.body.data;

        // Validar configuración
        if (!config.type || !config.format) {
            throw new AppError(400, 'Configuración de documento inválida');
        }

        // Generar nombre de archivo
        const fileName = generateFileName(config, data);
        const filePath = path.join('uploads', 'documents', fileName);

        // Generar contenido según formato
        let content: string;
        switch (config.format) {
            case 'html':
                const template = await fs.readFile(
                    path.join('templates', `${config.type}.html`),
                    'utf-8'
                );
                content = generateHtmlDocument(data, template);
                break;
            case 'json':
                content = generateJsonDocument(data);
                break;
            default:
                throw new AppError(400, 'Formato no soportado');
        }

        // Guardar documento
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content);

        // Registrar documento en la base de datos
        const documentEvent = await prisma.event.create({
            data: {
                type: EventType.OTHER,
                severity: EventSeverity.LOW,
                description: JSON.stringify({
                    documentType: config.type.toUpperCase(),
                    format: config.format.toUpperCase(),
                    path: filePath,
                    ...(config.vehicleId && { vehicleId: config.vehicleId }),
                    ...(config.organizationId && { organizationId: config.organizationId })
                }),
                ...(config.vehicleId && { vehicleId: config.vehicleId }),
                ...(config.organizationId && { organizationId: config.organizationId })
            }
        });

        // Almacenar referencia en la respuesta
        (req as any).document = {
            id: documentEvent.id,
            path: filePath,
            type: config.type,
            format: config.format,
            metadata: JSON.parse(documentEvent.description || '{}')
        };

        next();
    } catch (error) {
        next(error);
    }
};

// Middleware para listar documentos
export const documentListMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const vehicleId = req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined;
        const organizationId = req.query.organizationId
            ? parseInt(req.query.organizationId as string)
            : undefined;
        const type = req.query.type as string;

        // Buscar documentos
        const documentEvents = await prisma.event.findMany({
            where: {
                type: EventType.OTHER,
                description: {
                    contains: '"documentType":'
                },
                ...(vehicleId && { vehicleId }),
                ...(organizationId && { organizationId })
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Verificar existencia de archivos
        const validDocuments = await Promise.all(
            documentEvents.map(async (doc) => {
                try {
                    const metadata = JSON.parse(doc.description || '{}');
                    if (!metadata.path) return null;
                    await fs.access(metadata.path);
                    return {
                        ...doc,
                        metadata
                    };
                } catch {
                    return null;
                }
            })
        ).then((docs) => docs.filter((doc): doc is NonNullable<typeof doc> => doc !== null));

        // Almacenar documentos en la respuesta
        (req as any).documents = validDocuments;
        next();
    } catch (error) {
        next(error);
    }
};

// Middleware para eliminar documentos
export const documentDeleteMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const documentId = parseInt(req.params.documentId);

        if (isNaN(documentId)) {
            throw new AppError(400, 'ID de documento inválido');
        }

        // Buscar documento
        const documentEvent = await prisma.event.findFirst({
            where: {
                id: documentId,
                type: EventType.OTHER,
                description: {
                    contains: '"documentType":'
                }
            }
        });

        if (!documentEvent) {
            throw new AppError(404, 'Documento no encontrado');
        }

        const metadata = JSON.parse(documentEvent.description || '{}');
        if (!metadata.path) {
            throw new AppError(404, 'Ruta del documento no encontrada');
        }

        // Eliminar archivo
        try {
            await fs.unlink(metadata.path);
        } catch (error) {
            logger.warn('Error eliminando archivo', { error, path: metadata.path });
        }

        // Eliminar registro
        await prisma.event.delete({
            where: { id: documentId }
        });

        next();
    } catch (error) {
        next(error);
    }
};
