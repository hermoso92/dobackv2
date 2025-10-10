#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

interface SimpleFile {
    filePath: string;
    fileName: string;
    fileType: 'GPS' | 'CAN' | 'ESTABILIDAD' | 'ROTATIVO';
    vehicleId: string;
    date: string;
    sequence: number;
    size: number;
}

async function processSimple() {
    try {
        logger.info('🚀 Iniciando procesamiento simple...');

        const dataPath = path.join(__dirname, '../data/datosDoback/CMadrid');

        if (!fs.existsSync(dataPath)) {
            logger.error(`❌ Directorio no encontrado: ${dataPath}`);
            return;
        }

        // 1. Escanear archivos
        const files = await scanFiles(dataPath);
        logger.info(`📁 Encontrados ${files.length} archivos`);

        // 2. Agrupar por sesión
        const sessions = groupFilesBySession(files);
        logger.info(`📊 Detectadas ${sessions.length} sesiones`);

        // 3. Procesar cada sesión
        let processed = 0;
        let failed = 0;

        for (const session of sessions) {
            try {
                await processSession(session);
                processed++;
                logger.info(`✅ Sesión procesada: ${session.vehicleId}_${session.date}_${session.sequence}`);
            } catch (error) {
                failed++;
                logger.error(`❌ Error procesando sesión ${session.vehicleId}_${session.date}_${session.sequence}:`, error);
            }
        }

        logger.info(`📈 Resumen: ${processed} procesadas, ${failed} fallidas`);

    } catch (error) {
        logger.error('❌ Error en procesamiento simple:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

async function scanFiles(basePath: string): Promise<SimpleFile[]> {
    const files: SimpleFile[] = [];

    const scanDir = (dirPath: string) => {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                scanDir(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.txt')) {
                const fileInfo = analyzeFile(fullPath);
                if (fileInfo) {
                    files.push(fileInfo);
                }
            }
        }
    };

    scanDir(basePath);
    return files;
}

function analyzeFile(filePath: string): SimpleFile | null {
    try {
        const fileName = path.basename(filePath);
        const stats = fs.statSync(filePath);

        // Parsear: TIPO_DOBACKXXX_YYYYMMDD_SEQUENCE.txt
        const match = fileName.match(/^([A-Z_]+)_DOBACK(\d+)_(\d{8})_(\d+)\.txt$/);
        if (!match) return null;

        const [, fileTypeStr, vehicleIdNum, dateStr, sequenceStr] = match;
        const fileType = fileTypeStr as SimpleFile['fileType'];

        // Filtrar archivos de estabilidad pequeños
        if (fileType === 'ESTABILIDAD' && stats.size < 1024 * 1024) {
            logger.warn(`⚠️ Archivo de estabilidad pequeño ignorado: ${fileName}`);
            return null;
        }

        return {
            filePath,
            fileName,
            fileType,
            size: stats.size,
            sequence: parseInt(sequenceStr),
            vehicleId: `DOBACK${vehicleIdNum}`,
            date: dateStr
        };

    } catch (error) {
        logger.error(`❌ Error analizando archivo ${filePath}:`, error);
        return null;
    }
}

function groupFilesBySession(files: SimpleFile[]): Array<{
    vehicleId: string;
    date: string;
    sequence: number;
    files: SimpleFile[];
}> {
    const sessions = new Map<string, SimpleFile[]>();

    for (const file of files) {
        const sessionKey = `${file.vehicleId}_${file.date}_${file.sequence}`;

        if (!sessions.has(sessionKey)) {
            sessions.set(sessionKey, []);
        }

        sessions.get(sessionKey)!.push(file);
    }

    return Array.from(sessions.entries()).map(([key, files]) => {
        const [vehicleId, date, sequence] = key.split('_');
        return {
            vehicleId,
            date,
            sequence: parseInt(sequence),
            files
        };
    });
}

async function processSession(session: {
    vehicleId: string;
    date: string;
    sequence: number;
    files: SimpleFile[];
}): Promise<void> {
    // 1. Verificar que el vehículo existe
    const vehicle = await prisma.vehicle.findFirst({
        where: {
            name: session.vehicleId,
            organizationId: 'CMadrid'
        }
    });

    if (!vehicle) {
        throw new Error(`Vehículo ${session.vehicleId} no encontrado`);
    }

    // 2. Crear sesión en BD
    const lastSession = await prisma.session.findFirst({
        where: { vehicleId: vehicle.id },
        orderBy: { sessionNumber: 'desc' }
    });

    const sessionNumber = lastSession ? lastSession.sessionNumber + 1 : 1;

    const dbSession = await prisma.session.create({
        data: {
            vehicleId: vehicle.id,
            userId: 'system',
            organizationId: 'CMadrid',
            startTime: new Date(),
            endTime: new Date(),
            sessionNumber,
            sequence: session.sequence,
            source: 'simple_processor'
        }
    });

    // 3. Procesar archivos (simplificado)
    for (const file of session.files) {
        await processFile(file, dbSession.id);
    }
}

async function processFile(file: SimpleFile, sessionId: string): Promise<void> {
    try {
        const content = fs.readFileSync(file.filePath, 'utf8');
        const lines = content.split('\n');

        // Procesar solo las primeras 100 líneas para prueba
        const dataLines = lines.slice(1, 101).filter(line => line.trim());

        if (file.fileType === 'GPS') {
            await processGPSFile(dataLines, sessionId);
        } else if (file.fileType === 'ESTABILIDAD') {
            await processStabilityFile(dataLines, sessionId);
        }

        logger.info(`📄 Archivo procesado: ${file.fileName} (${dataLines.length} líneas)`);

    } catch (error) {
        logger.error(`❌ Error procesando archivo ${file.fileName}:`, error);
    }
}

async function processGPSFile(lines: string[], sessionId: string): Promise<void> {
    const gpsData = lines.map((line, index) => {
        const parts = line.split(',');
        if (parts.length < 9) return null;

        const [fecha, hora, latitud, longitud, altitud, hdop, fix, numSats, velocidad] = parts;

        return {
            sessionId,
            timestamp: new Date(),
            latitude: parseFloat(latitud) || 0,
            longitude: parseFloat(longitud) || 0,
            altitude: parseFloat(altitud) || 0,
            speed: parseFloat(velocidad) || 0,
            satellites: parseInt(numSats) || 0,
            hdop: parseFloat(hdop) || null,
            fix: fix?.trim() || null
        };
    }).filter(Boolean);

    if (gpsData.length > 0) {
        await prisma.gpsMeasurement.createMany({
            data: gpsData,
            skipDuplicates: true
        });
    }
}

async function processStabilityFile(lines: string[], sessionId: string): Promise<void> {
    const stabilityData = lines.map((line, index) => {
        const parts = line.split(';');
        if (parts.length < 19) return null;

        return {
            sessionId,
            timestamp: new Date(),
            ax: parseFloat(parts[0]) || 0,
            ay: parseFloat(parts[1]) || 0,
            az: parseFloat(parts[2]) || 0,
            gx: parseFloat(parts[3]) || 0,
            gy: parseFloat(parts[4]) || 0,
            gz: parseFloat(parts[5]) || 0,
            si: parseFloat(parts[15]) || 0,
            accmag: parseFloat(parts[16]) || 0
        };
    }).filter(Boolean);

    if (stabilityData.length > 0) {
        await prisma.stabilityMeasurement.createMany({
            data: stabilityData,
            skipDuplicates: true
        });
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    processSimple().catch((error) => {
        logger.error('❌ Error fatal:', error);
        process.exit(1);
    });
}

export { processSimple };
