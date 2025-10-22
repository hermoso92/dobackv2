import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

// Función para buscar archivos relacionados
export const searchRelatedFiles = async (req: Request, res: Response) => {
    try {
        logger.info('🔍 searchRelatedFiles llamado con body:', req.body);

        const { vehicle, date, sequence, basePath } = req.body;

        if (!vehicle || !date || !sequence || !basePath) {
            logger.info('❌ Faltan parámetros:', { vehicle, date, sequence, basePath });
            return res.status(400).json({
                success: false,
                error: 'Faltan parámetros requeridos: vehicle, date, sequence, basePath'
            });
        }

        const vehicleNumber = vehicle.replace('DOBACK', '');
        const dateStr = date.replace(/-/g, '');

        logger.info('🔍 Parámetros procesados:', {
            vehicle,
            vehicleNumber,
            date,
            dateStr,
            sequence,
            basePath
        });

        // Definir las carpetas a buscar
        const folders = ['estabilidad', 'CAN', 'GPS', 'ROTATIVO'];
        const foundFiles: any[] = [];

        for (const folder of folders) {
            const folderPath = path.join(basePath, folder);
            logger.info(`📁 Buscando en carpeta: ${folderPath}`);

            if (fs.existsSync(folderPath)) {
                logger.info(`✅ Carpeta existe: ${folderPath}`);
                const files = fs.readdirSync(folderPath);
                logger.info(`📄 Archivos en carpeta:`, files);

                // Buscar archivos que coincidan con el patrón
                // El patrón debe ser más flexible para incluir prefijos como CAN_, GPS_, etc.
                const pattern = new RegExp(`.*${vehicle}_${dateStr}_${sequence}.*`);
                logger.info(`🔍 Patrón de búsqueda: ${pattern}`);

                for (const file of files) {
                    logger.info(`🔍 Probando archivo: ${file} contra patrón: ${pattern}`);
                    if (pattern.test(file)) {
                        logger.info(`✅ Archivo encontrado: ${file}`);
                        const filePath = path.join(folderPath, file);
                        const stats = fs.statSync(filePath);

                        // Crear un objeto File-like para el frontend
                        const fileInfo = {
                            name: file,
                            size: stats.size,
                            path: filePath,
                            type: getFileTypeFromFolder(folder),
                            lastModified: stats.mtime
                        };

                        foundFiles.push(fileInfo);
                    } else {
                        logger.info(`❌ Archivo no coincide: ${file}`);
                    }
                }
            } else {
                logger.info(`❌ Carpeta no existe: ${folderPath}`);
            }
        }

        logger.info(`🎯 Total de archivos encontrados: ${foundFiles.length}`);
        logger.info('📋 Archivos encontrados:', foundFiles);

        res.json({
            success: true,
            files: foundFiles,
            searchInfo: {
                vehicle,
                date,
                sequence,
                basePath,
                totalFound: foundFiles.length
            }
        });
    } catch (error) {
        logger.error('❌ Error buscando archivos relacionados:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al buscar archivos'
        });
    }
};

// Función para leer cabecera de archivo del servidor
export const readFileHeader = async (req: Request, res: Response) => {
    try {
        const { path: filePath } = req.query;

        if (!filePath || typeof filePath !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Ruta del archivo requerida'
            });
        }

        // Verificar que el archivo existe
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: 'Archivo no encontrado'
            });
        }

        // Leer la primera línea del archivo
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const header = lines[0] || '';

        // Buscar fecha y hora en la cabecera
        let date = '';
        let time = '';

        // Patrones comunes para fecha y hora
        const datePatterns = [
            /(\d{2}\/\d{2}\/\d{4})/g, // DD/MM/YYYY
            /(\d{4}-\d{2}-\d{2})/g, // YYYY-MM-DD
            /(\d{2}-\d{2}-\d{4})/g // DD-MM-YYYY
        ];

        const timePatterns = [
            /(\d{2}:\d{2}:\d{2})/g, // HH:MM:SS
            /(\d{2}:\d{2})/g // HH:MM
        ];

        // Buscar fecha
        for (const pattern of datePatterns) {
            const match = header.match(pattern);
            if (match) {
                date = match[0];
                break;
            }
        }

        // Buscar hora
        for (const pattern of timePatterns) {
            const match = header.match(pattern);
            if (match) {
                time = match[0];
                break;
            }
        }

        res.json({
            success: true,
            headerInfo: {
                date,
                time,
                header: header.trim()
            }
        });
    } catch (error) {
        logger.error('Error leyendo cabecera de archivo:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al leer archivo'
        });
    }
};

// Función auxiliar para determinar el tipo de archivo basado en la carpeta
const getFileTypeFromFolder = (folder: string): string => {
    switch (folder.toLowerCase()) {
        case 'estabilidad':
            return 'stabilityFile';
        case 'can':
            return 'canFile';
        case 'gps':
            return 'gpsFile';
        case 'rotativo':
            return 'rotativoFile';
        default:
            return 'unknown';
    }
};

// Endpoint de prueba simple
export const testEndpoint = async (req: Request, res: Response) => {
    try {
        logger.info('🧪 Endpoint de prueba llamado');
        res.json({
            success: true,
            message: 'Endpoint funcionando correctamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('❌ Error en endpoint de prueba:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};
