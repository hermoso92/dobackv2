import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export interface FileInfo {
    filePath: string;
    fileName: string;
    vehicleId: string;
    fileType: 'CAN' | 'GPS' | 'ESTABILIDAD' | 'ROTATIVO';
    date: string;
    sequence: number;
    size: number;
    lastModified: Date;
}

export interface ProcessedFile {
    fileInfo: FileInfo;
    processed: boolean;
    processedAt?: Date;
    error?: string;
    sessionId?: string;
}

export class FileWatcherService extends EventEmitter {
    private watchPaths: string[] = [];
    private processedFiles: Map<string, ProcessedFile> = new Map();
    private isWatching: boolean = false;
    private watchers: Map<string, fs.FSWatcher> = new Map();

    constructor() {
        super();
        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        this.on('fileDetected', this.handleFileDetected.bind(this));
        this.on('fileProcessed', this.handleFileProcessed.bind(this));
        this.on('fileError', this.handleFileError.bind(this));
    }

    /**
     * Inicia el monitoreo de directorios
     */
    public startWatching(basePath: string): void {
        if (this.isWatching) {
            logger.warn('FileWatcherService ya está monitoreando archivos');
            return;
        }

        logger.info(`🔍 Iniciando monitoreo de archivos en: ${basePath}`);

        // Buscar todas las organizaciones
        const organizations = this.findOrganizations(basePath);

        for (const orgPath of organizations) {
            this.watchPath(orgPath);
        }

        this.isWatching = true;
        logger.info(`✅ Monitoreo iniciado en ${organizations.length} organizaciones`);
    }

    /**
     * Detiene el monitoreo de archivos
     */
    public stopWatching(): void {
        if (!this.isWatching) {
            logger.warn('FileWatcherService no está monitoreando archivos');
            return;
        }

        logger.info('🛑 Deteniendo monitoreo de archivos...');

        for (const [path, watcher] of this.watchers) {
            watcher.close();
            logger.info(`📁 Detenido monitoreo en: ${path}`);
        }

        this.watchers.clear();
        this.isWatching = false;
        logger.info('✅ Monitoreo detenido');
    }

    /**
     * Busca organizaciones en el directorio base
     */
    private findOrganizations(basePath: string): string[] {
        const organizations: string[] = [];

        try {
            const items = fs.readdirSync(basePath, { withFileTypes: true });

            for (const item of items) {
                if (item.isDirectory()) {
                    const orgPath = path.join(basePath, item.name);
                    organizations.push(orgPath);
                    logger.info(`📁 Organización encontrada: ${item.name}`);
                }
            }
        } catch (error) {
            logger.error(`❌ Error buscando organizaciones en ${basePath}:`, error);
        }

        return organizations;
    }

    /**
     * Configura el monitoreo de un directorio específico
     */
    private watchPath(orgPath: string): void {
        try {
            const watcher = fs.watch(orgPath, { recursive: true }, (eventType, filename) => {
                if (filename && eventType === 'rename') {
                    const fullPath = path.join(orgPath, filename);
                    this.processFile(fullPath);
                }
            });

            this.watchers.set(orgPath, watcher);
            logger.info(`👀 Monitoreando: ${orgPath}`);

            // Procesar archivos existentes
            this.processExistingFiles(orgPath);

        } catch (error) {
            logger.error(`❌ Error configurando monitoreo en ${orgPath}:`, error);
        }
    }

    /**
     * Procesa archivos existentes en el directorio
     */
    private processExistingFiles(orgPath: string): void {
        try {
            const vehicles = this.findVehicles(orgPath);

            for (const vehiclePath of vehicles) {
                const fileTypes = ['CAN', 'GPS', 'estabilidad', 'ROTATIVO'];

                for (const fileType of fileTypes) {
                    const typePath = path.join(vehiclePath, fileType);

                    if (fs.existsSync(typePath)) {
                        const files = fs.readdirSync(typePath);

                        for (const file of files) {
                            const filePath = path.join(typePath, file);
                            this.processFile(filePath);
                        }
                    }
                }
            }
        } catch (error) {
            logger.error(`❌ Error procesando archivos existentes en ${orgPath}:`, error);
        }
    }

    /**
     * Busca vehículos en una organización
     */
    private findVehicles(orgPath: string): string[] {
        const vehicles: string[] = [];

        try {
            const items = fs.readdirSync(orgPath, { withFileTypes: true });

            for (const item of items) {
                if (item.isDirectory() && item.name.startsWith('doback')) {
                    const vehiclePath = path.join(orgPath, item.name);
                    vehicles.push(vehiclePath);
                }
            }
        } catch (error) {
            logger.error(`❌ Error buscando vehículos en ${orgPath}:`, error);
        }

        return vehicles;
    }

    /**
     * Procesa un archivo detectado
     */
    private processFile(filePath: string): void {
        try {
            // Verificar que el archivo existe y no es un directorio
            const stats = fs.statSync(filePath);
            if (!stats.isFile()) {
                return;
            }

            // Verificar que no esté ya procesado
            const fileKey = this.getFileKey(filePath);
            if (this.processedFiles.has(fileKey)) {
                return;
            }

            // Analizar el archivo
            const fileInfo = this.analyzeFile(filePath);
            if (!fileInfo) {
                logger.warn(`⚠️ No se pudo analizar archivo: ${filePath}`);
                return;
            }

            logger.info(`📄 Archivo detectado: ${fileInfo.fileName} (${fileInfo.fileType})`);

            // Emitir evento de archivo detectado
            this.emit('fileDetected', fileInfo);

        } catch (error) {
            logger.error(`❌ Error procesando archivo ${filePath}:`, error);
        }
    }

    /**
     * Analiza un archivo y extrae información
     */
    private analyzeFile(filePath: string): FileInfo | null {
        try {
            const fileName = path.basename(filePath);
            const stats = fs.statSync(filePath);

            // Parsear nombre del archivo: TIPO_DOBACK<vehículo>_<YYYYMMDD>_<secuencia>.txt
            const match = fileName.match(/^([A-Z_]+)_DOBACK(\d+)_(\d{8})_(\d+)\.txt$/);
            if (!match) {
                logger.warn(`⚠️ Formato de archivo no reconocido: ${fileName}`);
                return null;
            }

            const [, fileTypeStr, vehicleId, dateStr, sequenceStr] = match;

            // Mapear tipo de archivo
            let fileType: FileInfo['fileType'];
            switch (fileTypeStr) {
                case 'CAN':
                    fileType = 'CAN';
                    break;
                case 'GPS':
                    fileType = 'GPS';
                    break;
                case 'ESTABILIDAD':
                    fileType = 'ESTABILIDAD';
                    break;
                case 'ROTATIVO':
                    fileType = 'ROTATIVO';
                    break;
                default:
                    logger.warn(`⚠️ Tipo de archivo no reconocido: ${fileTypeStr}`);
                    return null;
            }

            return {
                filePath,
                fileName,
                vehicleId: `DOBACK${vehicleId}`,
                fileType,
                date: dateStr,
                sequence: parseInt(sequenceStr),
                size: stats.size,
                lastModified: stats.mtime
            };

        } catch (error) {
            logger.error(`❌ Error analizando archivo ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Genera una clave única para el archivo
     */
    private getFileKey(filePath: string): string {
        return path.basename(filePath);
    }

    /**
     * Maneja archivos detectados
     */
    private handleFileDetected(fileInfo: FileInfo): void {
        logger.info(`🔍 Archivo detectado: ${fileInfo.fileName}`);

        // Marcar como pendiente de procesamiento
        this.processedFiles.set(this.getFileKey(fileInfo.filePath), {
            fileInfo,
            processed: false
        });
    }

    /**
     * Maneja archivos procesados exitosamente
     */
    private handleFileProcessed(fileInfo: FileInfo, sessionId?: string): void {
        logger.info(`✅ Archivo procesado: ${fileInfo.fileName}`);

        this.processedFiles.set(this.getFileKey(fileInfo.filePath), {
            fileInfo,
            processed: true,
            processedAt: new Date(),
            sessionId
        });
    }

    /**
     * Maneja errores de procesamiento
     */
    private handleFileError(fileInfo: FileInfo, error: string): void {
        logger.error(`❌ Error procesando archivo: ${fileInfo.fileName} - ${error}`);

        this.processedFiles.set(this.getFileKey(fileInfo.filePath), {
            fileInfo,
            processed: false,
            error
        });
    }

    /**
     * Obtiene estadísticas del procesamiento
     */
    public getStats(): {
        totalFiles: number;
        processedFiles: number;
        pendingFiles: number;
        errorFiles: number;
        filesByType: Record<string, number>;
    } {
        const stats = {
            totalFiles: this.processedFiles.size,
            processedFiles: 0,
            pendingFiles: 0,
            errorFiles: 0,
            filesByType: {} as Record<string, number>
        };

        for (const [, file] of this.processedFiles) {
            if (file.processed) {
                stats.processedFiles++;
            } else if (file.error) {
                stats.errorFiles++;
            } else {
                stats.pendingFiles++;
            }

            const type = file.fileInfo.fileType;
            stats.filesByType[type] = (stats.filesByType[type] || 0) + 1;
        }

        return stats;
    }

    /**
     * Obtiene archivos pendientes de procesamiento
     */
    public getPendingFiles(): FileInfo[] {
        const pending: FileInfo[] = [];

        for (const [, file] of this.processedFiles) {
            if (!file.processed && !file.error) {
                pending.push(file.fileInfo);
            }
        }

        return pending;
    }

    /**
     * Obtiene archivos con errores
     */
    public getErrorFiles(): ProcessedFile[] {
        const errors: ProcessedFile[] = [];

        for (const [, file] of this.processedFiles) {
            if (file.error) {
                errors.push(file);
            }
        }

        return errors;
    }
}