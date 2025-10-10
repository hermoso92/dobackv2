/**
 * ⚠️ DEPRECATED: Upload simple sin procesamiento
 * 
 * @deprecated Usar /api/upload-unified/unified para procesamiento completo
 * 
 * Este endpoint solo parsea archivos pero NO guarda datos en BD.
 * Usar solo para validación rápida.
 * 
 * SISTEMA NUEVO: POST /api/upload-unified/unified
 */

import { Router } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.originalname.match(/\.(txt)$/)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos .txt') as any, false);
        }
    }
});

// Función para extraer información del nombre del archivo
function parseFileName(filename: string) {
    const match = filename.match(/^(ESTABILIDAD|GPS|ROTATIVO|CAN)_DOBACK(\d+)_(\d{8})\.txt$/);
    if (!match) {
        throw new Error(`Formato de archivo inválido: ${filename}`);
    }

    return {
        tipo: match[1].toLowerCase(),
        vehiculo: `DOBACK${match[2]}`,
        fecha: match[3]
    };
}

// Endpoint para subir archivo
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó archivo' });
        }

        // Parsear información del archivo
        const fileInfo = parseFileName(req.file.originalname);

        // Leer contenido del archivo
        const content = fs.readFileSync(req.file.path, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());

        // Contar líneas de datos (excluyendo cabeceras)
        const dataLines = lines.filter(line =>
            !line.startsWith('ESTABILIDAD;') &&
            !line.startsWith('GPS;') &&
            !line.startsWith('ROTATIVO;') &&
            !line.startsWith('CAN;') &&
            !line.includes('ax; ay; az;') &&
            !line.includes('HoraRaspberry,Fecha,Hora(GPS)') &&
            !line.includes('Fecha-Hora;Estado') &&
            line.trim().length > 0
        ).length;

        // Limpiar archivo temporal
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            message: `Archivo procesado exitosamente`,
            data: {
                fileName: req.file.originalname,
                vehicle: fileInfo.vehiculo,
                type: fileInfo.tipo,
                date: fileInfo.fecha,
                dataLines: dataLines,
                fileSize: req.file.size
            }
        });

    } catch (error) {
        console.error('Error procesando archivo:', error);

        // Limpiar archivo temporal si existe
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            error: 'Error procesando archivo',
            details: (error as Error).message
        });
    }
});

// Endpoint para subida múltiple de archivos
router.post('/multiple', upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron archivos' });
        }

        const results: any[] = [];
        const errors: any[] = [];

        // Procesar cada archivo
        for (const file of req.files as Express.Multer.File[]) {
            try {
                const fileInfo = parseFileName(file.originalname);
                const content = fs.readFileSync(file.path, 'utf8');
                const lines = content.split('\n').filter(line => line.trim());

                const dataLines = lines.filter(line =>
                    !line.startsWith('ESTABILIDAD;') &&
                    !line.startsWith('GPS;') &&
                    !line.startsWith('ROTATIVO;') &&
                    !line.startsWith('CAN;') &&
                    !line.includes('ax; ay; az;') &&
                    !line.includes('HoraRaspberry,Fecha,Hora(GPS)') &&
                    !line.includes('Fecha-Hora;Estado') &&
                    line.trim().length > 0
                ).length;

                results.push({
                    fileName: file.originalname,
                    vehicle: fileInfo.vehiculo,
                    type: fileInfo.tipo,
                    date: fileInfo.fecha,
                    dataLines: dataLines,
                    fileSize: file.size
                });

                // Limpiar archivo temporal
                fs.unlinkSync(file.path);

            } catch (error) {
                errors.push({
                    file: file.originalname,
                    error: (error as Error).message
                });

                // Limpiar archivo temporal
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            }
        }

        res.json({
            success: true,
            message: `Procesados ${req.files.length} archivos exitosamente`,
            data: {
                totalFiles: req.files.length,
                results,
                errors: errors.length > 0 ? errors : undefined
            }
        });

    } catch (error) {
        console.error('Error procesando archivos múltiples:', error);

        // Limpiar archivos temporales
        if (req.files) {
            (req.files as Express.Multer.File[]).forEach((file: Express.Multer.File) => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }

        res.status(500).json({
            error: 'Error procesando archivos múltiples',
            details: (error as Error).message
        });
    }
});

// Endpoint de prueba
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Endpoint de subida funcionando correctamente',
        timestamp: new Date().toISOString(),
        features: ['Estabilidad', 'GPS', 'Rotativo', 'CAN']
    });
});

// Endpoint para obtener archivos subidos (simulado)
router.get('/files', async (req, res) => {
    try {
        // Datos simulados para testing
        const mockFiles = [
            {
                id: 1,
                nombre: 'ESTABILIDAD_DOBACK024_20250930.txt',
                tipo: 'estabilidad',
                vehiculoId: 'DOBACK024',
                fechaSubida: new Date().toISOString(),
                vehicle_name: 'DOBACK024'
            },
            {
                id: 2,
                nombre: 'GPS_DOBACK024_20250930.txt',
                tipo: 'gps',
                vehiculoId: 'DOBACK024',
                fechaSubida: new Date().toISOString(),
                vehicle_name: 'DOBACK024'
            },
            {
                id: 3,
                nombre: 'ROTATIVO_DOBACK027_20251001.txt',
                tipo: 'rotativo',
                vehiculoId: 'DOBACK027',
                fechaSubida: new Date().toISOString(),
                vehicle_name: 'DOBACK027'
            }
        ];

        res.json({
            success: true,
            files: mockFiles
        });
    } catch (error) {
        console.error('Error obteniendo archivos:', error);
        res.status(500).json({
            error: 'Error obteniendo archivos',
            details: (error as Error).message
        });
    }
});

// Endpoint para análisis integral de archivos CMadrid
router.get('/analyze-cmadrid', async (req, res) => {
    try {
        const cmadridPath = path.join(__dirname, '../../data/CMadrid');

        if (!fs.existsSync(cmadridPath)) {
            return res.status(404).json({ error: 'Directorio CMadrid no encontrado' });
        }

        const analysis = {
            summary: {
                totalVehicles: 0,
                totalFiles: 0,
                totalDataLines: 0
            },
            vehicles: {} as any,
            files: [] as any[]
        };

        // Leer directorios de vehículos
        const vehicleDirs = fs.readdirSync(cmadridPath).filter(item =>
            fs.statSync(path.join(cmadridPath, item)).isDirectory() && item.startsWith('doback')
        );

        analysis.summary.totalVehicles = vehicleDirs.length;

        for (const vehicleDir of vehicleDirs) {
            const vehiclePath = path.join(cmadridPath, vehicleDir);
            const vehicleId = vehicleDir.toUpperCase();

            analysis.vehicles[vehicleId] = {
                vehicleId,
                files: {
                    estabilidad: 0,
                    gps: 0,
                    rotativo: 0
                },
                dataLines: 0
            };

            // Analizar cada tipo de archivo
            const types = ['estabilidad', 'GPS', 'ROTATIVO'];

            for (const type of types) {
                const typePath = path.join(vehiclePath, type.toLowerCase());

                if (fs.existsSync(typePath)) {
                    const files = fs.readdirSync(typePath).filter(file => file.endsWith('.txt'));

                    for (const file of files) {
                        const filePath = path.join(typePath, file);
                        const content = fs.readFileSync(filePath, 'utf8');
                        const lines = content.split('\n').filter(line => line.trim());

                        const dataLines = lines.filter(line =>
                            !line.startsWith('ESTABILIDAD;') &&
                            !line.startsWith('GPS;') &&
                            !line.startsWith('ROTATIVO;') &&
                            !line.includes('ax; ay; az;') &&
                            !line.includes('HoraRaspberry,Fecha,Hora(GPS)') &&
                            !line.includes('Fecha-Hora;Estado') &&
                            line.trim().length > 0
                        ).length;

                        const fileAnalysis = {
                            fileName: file,
                            vehicleId,
                            type: type.toLowerCase(),
                            dataLines: dataLines,
                            fileSize: fs.statSync(filePath).size
                        };

                        analysis.files.push(fileAnalysis);
                        analysis.vehicles[vehicleId].files[type.toLowerCase()]++;
                        analysis.vehicles[vehicleId].dataLines += dataLines;

                        analysis.summary.totalFiles++;
                        analysis.summary.totalDataLines += dataLines;
                    }
                }
            }
        }

        res.json({
            success: true,
            analysis
        });

    } catch (error) {
        console.error('Error analizando CMadrid:', error);
        res.status(500).json({
            error: 'Error analizando archivos CMadrid',
            details: (error as Error).message
        });
    }
});

export default router;
