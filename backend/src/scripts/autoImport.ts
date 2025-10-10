console.log('INICIO SCRIPT');
import * as chokidar from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';
import { VehicleSession } from '../types/vehicle';
import { parseCANData, parseGPSData, parseStabilityData } from '../utils/dataParser';
import { logger } from '../utils/logger';
const { PrismaClient } = require('@prisma/client');

// Crear una instancia única de PrismaClient
let prisma: any;
try {
    console.log('INICIALIZANDO PRISMA...');
    prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        }
    });
    console.log('PRISMA OK');
} catch (error) {
    console.error('ERROR INICIALIZANDO PRISMA:', error);
    process.exit(1);
}

interface ImportConfig {
    watchDirectory: string;
    processedDirectory: string;
    errorDirectory: string;
    supportedFormats: string[];
    batchSize: number;
}

const config: ImportConfig = {
    watchDirectory: path.join(__dirname, '..', '..', 'data', 'review'),
    processedDirectory: path.join(__dirname, '..', '..', 'data', 'processed'),
    errorDirectory: path.join(__dirname, '..', '..', 'data', 'errors'),
    supportedFormats: ['.csv', '.txt'],
    batchSize: 1000
};

const processingFiles = new Set<string>();
const fileLocks = new Map<string, boolean>();
const lockFile = path.join(__dirname, '..', '..', 'data', 'import.lock');

class AutoImporter {
    private watcher: chokidar.FSWatcher;
    private isProcessing = false;
    private processingNow = new Set<string>();
    private config: ImportConfig;

    constructor() {
        console.log('CONSTRUCTOR: INICIO');
        this.config = config;
        console.log('CONSTRUCTOR: ANTES DE ensureDirectories');
        this.ensureDirectories();
        console.log('CONSTRUCTOR: ANTES DE initializeWatcher');
        this.watcher = this.initializeWatcher();
        console.log('CONSTRUCTOR: FIN');
    }

    private ensureDirectories() {
        [
            this.config.watchDirectory,
            this.config.processedDirectory,
            this.config.errorDirectory
        ].forEach((dir) => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                logger.info(`Directorio creado: ${dir}`);
            }
        });
    }

    private initializeWatcher() {
        return chokidar.watch(this.config.watchDirectory, {
            ignored: (filePath) => {
                // Ignorar archivos temporales o en movimiento
                return filePath.endsWith('.tmp') || this.processingNow.has(filePath);
            },
            persistent: true,
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100
            }
        });
    }

    private async acquireLock(filePath: string): Promise<boolean> {
        if (fileLocks.get(filePath) || this.processingNow.has(filePath)) {
            return false;
        }
        fileLocks.set(filePath, true);
        this.processingNow.add(filePath);
        return true;
    }

    private releaseLock(filePath: string) {
        fileLocks.delete(filePath);
        this.processingNow.delete(filePath);
    }

    private async moveFile(sourcePath: string, targetPath: string): Promise<string> {
        try {
            logger.info(`[MOVE] Intentando mover archivo de ${sourcePath} a ${targetPath}`);
            if (!fs.existsSync(sourcePath)) {
                logger.error(`[MOVE] Archivo desaparecido antes de mover: ${sourcePath}`);
                // Registrar log de desaparición
                const errorDir = path.dirname(targetPath);
                const fileName = path.basename(sourcePath);
                const errorLogPath = path.join(errorDir, `${fileName}.log`);
                await fs.promises.writeFile(
                    errorLogPath,
                    JSON.stringify(
                        {
                            timestamp: new Date().toISOString(),
                            error: 'Archivo desaparecido antes de mover',
                            sourcePath,
                            targetPath
                        },
                        null,
                        2
                    )
                );
                return '';
            }

            // Asegurar que el directorio destino existe
            const targetDir = path.dirname(targetPath);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            // Verificar si el archivo ya existe en el destino
            let finalTarget: string;
            if (fs.existsSync(targetPath)) {
                // Si existe, agregar timestamp y mover a una subcarpeta de duplicados
                const ext = path.extname(targetPath);
                const baseName = path.basename(targetPath, ext);
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const duplicatesDir = path.join(targetDir, 'duplicates');
                if (!fs.existsSync(duplicatesDir)) {
                    fs.mkdirSync(duplicatesDir, { recursive: true });
                }
                finalTarget = path.join(duplicatesDir, `${baseName}_${timestamp}${ext}`);
            } else {
                finalTarget = targetPath;
            }

            // Copiar el archivo al destino
            await fs.promises.copyFile(sourcePath, finalTarget);
            // Eliminar el archivo original
            await fs.promises.unlink(sourcePath);
            logger.info(`[MOVE] Archivo movido de ${sourcePath} a ${finalTarget}`);
            return finalTarget;
        } catch (error) {
            logger.error(`[MOVE] Error moviendo archivo de ${sourcePath} a ${targetPath}:`, error);
            throw error;
        }
    }

    private async processFile(filePath: string): Promise<void> {
        const fileName = path.basename(filePath);
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                logger.info(
                    `[PROCESS] Iniciando procesamiento del archivo: ${filePath} (Intento ${
                        retryCount + 1
                    }/${maxRetries})`
                );

                // Verificar si el archivo existe antes de procesarlo
                if (!fs.existsSync(filePath)) {
                    logger.error(`[PROCESS] El archivo ${filePath} no existe`);
                    return;
                }

                // Verificar si el archivo está completamente escrito
                const stats = fs.statSync(filePath);
                const fileAge = Date.now() - stats.mtimeMs;
                if (fileAge < 2000) {
                    // Esperar 2 segundos para asegurar que el archivo está completamente escrito
                    logger.info(
                        `[PROCESS] Esperando a que el archivo ${fileName} esté completamente escrito...`
                    );
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                }

                logger.info(`[DEBUG] Iniciando lectura del archivo ${fileName}`);
                const content = fs.readFileSync(filePath, 'utf-8');
                logger.info(`[DEBUG] Lectura del archivo ${fileName} completada`);
                let data: VehicleSession<any>[] = [];

                // Determinar el tipo de archivo basado en el nombre
                if (fileName.includes('ESTABILIDAD')) {
                    logger.info(
                        `[DEBUG] Iniciando parseo de datos de estabilidad para ${fileName}`
                    );
                    data = parseStabilityData(content);
                    logger.info(
                        `[DEBUG] Parseo de datos de estabilidad completado para ${fileName}. Sesiones: ${data.length}`
                    );
                } else if (fileName.includes('CAN')) {
                    logger.info(`[DEBUG] Iniciando parseo de datos CAN para ${fileName}`);
                    data = parseCANData(content, fileName);
                    logger.info(
                        `[DEBUG] Parseo de datos CAN completado para ${fileName}. Sesiones: ${data.length}`
                    );
                } else if (fileName.includes('GPS')) {
                    logger.info(`[DEBUG] Iniciando parseo de datos GPS para ${fileName}`);
                    data = parseGPSData(content, fileName);
                    logger.info(
                        `[DEBUG] Parseo de datos GPS completado para ${fileName}. Sesiones: ${data.length}`
                    );
                } else {
                    throw new Error(`Tipo de archivo no reconocido: ${fileName}`);
                }

                if (!data || data.length === 0) {
                    throw new Error('No se encontraron datos válidos en el archivo');
                }

                // Procesar datos en lotes
                const batchSize = this.config.batchSize;
                for (let i = 0; i < data.length; i += batchSize) {
                    const batch = data.slice(i, i + batchSize);
                    logger.info(
                        `[PROCESS] Procesando lote ${i / batchSize + 1} de ${Math.ceil(
                            data.length / batchSize
                        )} para ${fileName}`
                    );

                    try {
                        await Promise.all(batch.map((session) => this.saveSessionData(session)));
                        logger.info(`[PROCESS] Lote ${i / batchSize + 1} procesado correctamente`);
                    } catch (error) {
                        logger.error(
                            `[PROCESS] Error procesando lote ${i / batchSize + 1}:`,
                            error
                        );
                        throw error; // Propagar el error para manejo de reintentos
                    }
                }

                // Mover el archivo a processed
                const targetDir = path.join(this.config.processedDirectory);
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                }
                const targetPath = path.join(targetDir, fileName);
                await this.moveFile(filePath, targetPath);
                logger.info(`[PROCESS] Archivo ${fileName} procesado y movido correctamente`);
                return;
            } catch (error) {
                retryCount++;
                logger.error(
                    `[PROCESS] Error procesando archivo ${fileName} (Intento ${retryCount}/${maxRetries}):`,
                    error
                );

                if (retryCount === maxRetries) {
                    // Mover el archivo a errors después de todos los reintentos fallidos
                    const errorDir = path.join(this.config.errorDirectory);
                    if (!fs.existsSync(errorDir)) {
                        fs.mkdirSync(errorDir, { recursive: true });
                    }
                    const errorPath = path.join(errorDir, fileName);
                    await this.moveFile(filePath, errorPath);

                    // Crear archivo de log con el error
                    const logPath = `${errorPath}.log`;
                    const logData = {
                        timestamp: new Date().toISOString(),
                        error: error instanceof Error ? error.message : 'Error desconocido',
                        stack: error instanceof Error ? error.stack : undefined,
                        filePath,
                        fileName,
                        retryCount
                    };
                    await fs.promises.writeFile(logPath, JSON.stringify(logData, null, 2));
                    logger.error(
                        `[PROCESS] Archivo ${fileName} movido a errors después de ${maxRetries} intentos fallidos`
                    );
                } else {
                    // Esperar antes del siguiente reintento
                    const waitTime = Math.pow(2, retryCount) * 1000; // Backoff exponencial
                    logger.info(
                        `[PROCESS] Esperando ${waitTime}ms antes del siguiente reintento...`
                    );
                    await new Promise((resolve) => setTimeout(resolve, waitTime));
                }
            }
        }
    }

    private async saveSessionData(session: any): Promise<void> {
        try {
            const { header, data } = session;

            // Extraer información del header
            const vehicleName = header.vehicleName;
            const type = header.type;

            if (!vehicleName) {
                throw new Error('Nombre del vehículo no encontrado en el header');
            }

            // Buscar o crear organización por defecto
            const organization =
                (await prisma.organization.findFirst({
                    where: { name: 'Default Organization' }
                })) ||
                (await prisma.organization.create({
                    data: {
                        name: 'Default Organization',
                        apiKey: 'default-api-key'
                    }
                }));

            // Buscar o crear usuario
            const user = await prisma.user.upsert({
                where: { email: `user${header.sessionNumber}@example.com` },
                update: {},
                create: {
                    email: `user${header.sessionNumber}@example.com`,
                    name: `User ${header.sessionNumber}`,
                    password: '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu9Uu', // 'admin123'
                    role: 'USER',
                    organizationId: organization.id
                }
            });

            // Buscar o crear vehículo
            const vehicle = await prisma.vehicle.upsert({
                where: {
                    licensePlate: vehicleName
                },
                update: {
                    name: vehicleName,
                    model: 'Default Model',
                    brand: 'Default Brand',
                    type: 'Default Type',
                    status: 'ACTIVE',
                    organizationId: organization.id,
                    userId: user.id
                },
                create: {
                    name: vehicleName,
                    model: 'Default Model',
                    licensePlate: vehicleName,
                    brand: 'Default Brand',
                    type: 'Default Type',
                    status: 'ACTIVE',
                    organizationId: organization.id,
                    userId: user.id
                }
            });

            // Crear o actualizar sesión
            const sessionDate = header.timestamp;
            console.log('START: SESSION DATE:', sessionDate, 'TYPE:', typeof sessionDate);
            if (!(sessionDate instanceof Date) || isNaN(sessionDate.getTime())) {
                throw new Error(
                    `El campo header.timestamp no es una fecha válida: ${JSON.stringify(header)}`
                );
            }
            // Usar sessionDate directamente en el upsert para evitar discrepancias
            const dbSession = await prisma.session.upsert({
                where: {
                    vehicleId_startTime: {
                        vehicleId: vehicle.id,
                        startTime: sessionDate
                    }
                },
                update: {
                    userId: user.id,
                    startTime: sessionDate
                },
                create: {
                    vehicleId: vehicle.id,
                    userId: user.id,
                    startTime: sessionDate
                }
            });

            // Guardar datos según el tipo
            if (type === 'ESTABILIDAD') {
                const validStabilityData = data
                    .filter((d: any) => {
                        // Validar que todos los campos requeridos estén presentes
                        const requiredFields = ['ax', 'ay', 'az', 'gx', 'gy', 'gz'];
                        const hasAllFields = requiredFields.every(
                            (field) => d[field] !== undefined && d[field] !== null
                        );

                        if (!hasAllFields) {
                            logger.warn(
                                `⚠️ Datos de estabilidad incompletos en autoImport, omitiendo: ${JSON.stringify(
                                    d
                                )}`
                            );
                            return false;
                        }

                        return true;
                    })
                    .map((d: any) => ({
                        ...d,
                        sessionId: dbSession.id,
                        ax: Number(d.ax),
                        ay: Number(d.ay),
                        az: Number(d.az),
                        gx: Number(d.gx),
                        gy: Number(d.gy),
                        gz: Number(d.gz),
                        si: d.si ? Number(d.si) : 0,
                        accmag: d.accmag ? Number(d.accmag) : 0
                    }));

                if (validStabilityData.length > 0) {
                    await prisma.stabilityMeasurement.createMany({
                        data: validStabilityData
                    });
                    logger.info(
                        `Se insertaron ${validStabilityData.length} mediciones de estabilidad (filtradas de ${data.length} total) para la sesión ${dbSession.id}`
                    );
                } else {
                    logger.warn('No hay datos de estabilidad válidos para insertar');
                }
            } else if (type === 'CAN') {
                await prisma.canMeasurement.createMany({
                    data: data.map((d: any) => ({
                        ...d,
                        sessionId: dbSession.id
                    }))
                });
                logger.info(
                    `Se insertaron ${data.length} mediciones CAN para la sesión ${dbSession.id}`
                );
            } else if (type === 'GPS') {
                await prisma.gpsMeasurement.createMany({
                    data: data.map((d: any) => ({
                        ...d,
                        sessionId: dbSession.id
                    }))
                });
                logger.info(
                    `Se insertaron ${data.length} mediciones GPS para la sesión ${dbSession.id}`
                );
            }

            logger.info(`Datos guardados para sesión ${dbSession.id}`);
        } catch (error) {
            logger.error('Error guardando datos de sesión:', error);
            throw error;
        }
    }

    public async start() {
        console.log('START: INICIO DEL MÉTODO START');
        logger.info('[DEBUG] Iniciando servicio de importación automática');

        // Verificar si ya hay una instancia en ejecución
        if (fs.existsSync(lockFile)) {
            console.log('START: ARCHIVO DE LOCK EXISTE');
            try {
                const pid = parseInt(fs.readFileSync(lockFile, 'utf-8'));
                // Verificar si el proceso existe
                try {
                    process.kill(pid, 0);
                    logger.error('Ya hay una instancia del servicio en ejecución');
                    process.exit(1);
                } catch (e) {
                    // El proceso no existe, eliminar el archivo de bloqueo
                    console.log('START: ELIMINANDO ARCHIVO DE LOCK');
                    fs.unlinkSync(lockFile);
                }
            } catch (e) {
                // Error al leer el archivo de bloqueo, eliminarlo
                console.log('START: ERROR AL LEER ARCHIVO DE LOCK, ELIMINÁNDOLO');
                fs.unlinkSync(lockFile);
            }
        }

        // Crear archivo de lock
        console.log('START: CREANDO ARCHIVO DE LOCK');
        fs.writeFileSync(lockFile, process.pid.toString());

        // Procesar archivos existentes al inicio SOLO UNA VEZ
        console.log('START: ANTES DE LEER ARCHIVOS EXISTENTES');
        console.log('START: PROCESANDO ARCHIVOS EXISTENTES');
        logger.info('Procesando archivos existentes...');
        const existingFiles = fs.readdirSync(this.config.watchDirectory);
        logger.info(`Archivos encontrados en ${this.config.watchDirectory}:`, existingFiles);
        console.log('START: ARCHIVOS ENCONTRADOS:', existingFiles);
        if (existingFiles.length === 0) {
            console.log('START: NO HAY ARCHIVOS PARA PROCESAR');
        }

        // Procesar archivos secuencialmente
        for (const file of existingFiles) {
            try {
                console.log('START: PROCESANDO ARCHIVO:', file);
                logger.info(`[STARTUP] Intentando procesar archivo: ${file}`);
                const filePath = path.join(this.config.watchDirectory, file);
                if (fs.lstatSync(filePath).isFile()) {
                    // Verificar que el archivo no esté siendo procesado actualmente
                    if (!this.processingNow.has(filePath)) {
                        logger.info(`[STARTUP] Procesando archivo inicial: ${file}`);
                        await this.processFile(filePath);
                        logger.info(`[STARTUP] Archivo procesado exitosamente: ${file}`);
                    } else {
                        logger.warn(
                            `[STARTUP] El archivo ${file} ya está siendo procesado, se omite.`
                        );
                    }
                } else {
                    console.log('START: NO ES ARCHIVO:', filePath);
                    logger.warn(`[STARTUP] No es un archivo regular: ${filePath}`);
                }
            } catch (err) {
                console.error('ERROR EN BUCLE DE ARCHIVOS:', file, err);
                logger.error(`[STARTUP] Error procesando archivo: ${file}`);
                logger.error(
                    `[STARTUP] Stacktrace: ${err && (err as any).stack ? (err as any).stack : err}`
                );
            }
        }
        console.log('START: FIN BUCLE ARCHIVOS');
        logger.info('Procesamiento inicial completado');

        // Eliminar archivo de lock al terminar
        console.log('START: ELIMINANDO ARCHIVO DE LOCK AL TERMINAR');
        if (fs.existsSync(lockFile)) {
            fs.unlinkSync(lockFile);
        }

        console.log('START: FIN');
    }

    public async stop() {
        await this.watcher.close();
        await prisma.$disconnect();
        // Eliminar archivo de lock
        if (fs.existsSync(lockFile)) {
            fs.unlinkSync(lockFile);
        }
        logger.info('Servicio de importación detenido');
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    try {
        console.log('ENTRANDO AL BLOQUE PRINCIPAL');
        console.log('ANTES DE CREAR IMPORTER');
        const importer = new AutoImporter();
        console.log('DESPUÉS DE CREAR IMPORTER');
        console.log('ANTES DE LLAMAR A IMPORTER.START()');
        importer.start().catch((error) => {
            console.error('ERROR EN START:', error);
            logger.error('Error iniciando el servicio:', error);
            process.exit(1);
        });
        console.log('DESPUÉS DE LLAMAR A IMPORTER.START()');
    } catch (error) {
        console.error('ERROR EN BLOQUE PRINCIPAL:', error);
        process.exit(1);
    }
}

export { AutoImporter };
