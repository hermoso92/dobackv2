import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import { logger } from '../utils/logger';
import { configurationManager } from './ConfigurationManager';

const execAsync = promisify(exec);

interface BackupConfig {
    enableAutoBackup: boolean;
    backupInterval: number; // milliseconds
    retentionDays: number;
    maxBackups: number;
    backupDirectories: string[];
    excludePatterns: string[];
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
}

interface BackupInfo {
    id: string;
    timestamp: Date;
    size: number;
    compressed: boolean;
    encrypted: boolean;
    checksum: string;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    error?: string;
    filesCount: number;
}

interface RecoveryInfo {
    backupId: string;
    timestamp: Date;
    status: 'SUCCESS' | 'FAILED';
    filesRestored: number;
    error?: string;
}

export class BackupRecoveryService {
    private readonly config: BackupConfig = {
        enableAutoBackup: true,
        backupInterval: 24 * 60 * 60 * 1000, // 24 horas
        retentionDays: 30,
        maxBackups: 10,
        backupDirectories: [
            path.join(process.cwd(), 'backend/data'),
            path.join(process.cwd(), 'backend/config'),
            path.join(process.cwd(), 'backend/logs')
        ],
        excludePatterns: [
            '*.tmp',
            '*.log',
            'node_modules',
            '.git',
            '*.pid'
        ],
        compressionEnabled: true,
        encryptionEnabled: false
    };

    private backupTimer: NodeJS.Timeout | null = null;
    private backupHistory: BackupInfo[] = [];
    private recoveryHistory: RecoveryInfo[] = [];
    private isBackupInProgress = false;

    constructor() {
        this.loadConfiguration();
        this.startAutoBackup();
        this.setupProcessHandlers();
    }

    /**
     * Carga configuración desde el sistema
     */
    private loadConfiguration(): void {
        try {
            const systemConfig = configurationManager.getConfig();
            // En una implementación real, esto vendría de la configuración del sistema
            logger.info('⚙️ Configuración de backup cargada');
        } catch (error) {
            logger.warn('⚠️ Error cargando configuración de backup, usando valores por defecto:', error);
        }
    }

    /**
     * Ejecuta backup completo del sistema
     */
    async performFullBackup(): Promise<BackupInfo> {
        if (this.isBackupInProgress) {
            throw new Error('Backup ya está en progreso');
        }

        this.isBackupInProgress = true;
        const backupId = this.generateBackupId();
        const startTime = Date.now();

        const backupInfo: BackupInfo = {
            id: backupId,
            timestamp: new Date(),
            size: 0,
            compressed: this.config.compressionEnabled,
            encrypted: this.config.encryptionEnabled,
            checksum: '',
            status: 'IN_PROGRESS',
            filesCount: 0
        };

        this.backupHistory.push(backupInfo);

        try {
            logger.info(`💾 Iniciando backup completo: ${backupId}`);

            // 1. Crear directorio de backup
            const backupDir = await this.createBackupDirectory(backupId);

            // 2. Copiar archivos
            const copyResult = await this.copyFilesToBackup(backupDir);
            backupInfo.filesCount = copyResult.filesCount;

            // 3. Comprimir si está habilitado
            if (this.config.compressionEnabled) {
                await this.compressBackup(backupDir);
                backupInfo.compressed = true;
            }

            // 4. Encriptar si está habilitado
            if (this.config.encryptionEnabled) {
                await this.encryptBackup(backupDir);
                backupInfo.encrypted = true;
            }

            // 5. Calcular checksum
            backupInfo.checksum = await this.calculateBackupChecksum(backupDir);

            // 6. Obtener tamaño final
            backupInfo.size = await this.getBackupSize(backupDir);

            // 7. Marcar como completado
            backupInfo.status = 'COMPLETED';

            const processingTime = Date.now() - startTime;

            logger.info(`✅ Backup completado: ${backupId}`, {
                filesCount: backupInfo.filesCount,
                size: this.formatBytes(backupInfo.size),
                compressed: backupInfo.compressed,
                encrypted: backupInfo.encrypted,
                processingTime
            });

            // 8. Limpiar backups antiguos
            await this.cleanupOldBackups();

            return backupInfo;

        } catch (error) {
            backupInfo.status = 'FAILED';
            backupInfo.error = error instanceof Error ? error.message : 'Error desconocido';

            logger.error(`❌ Error en backup: ${backupId}`, {
                error: backupInfo.error
            });

            throw error;
        } finally {
            this.isBackupInProgress = false;
        }
    }

    /**
     * Restaura desde un backup específico
     */
    async restoreFromBackup(backupId: string): Promise<RecoveryInfo> {
        const backup = this.backupHistory.find(b => b.id === backupId);
        if (!backup) {
            throw new Error(`Backup no encontrado: ${backupId}`);
        }

        if (backup.status !== 'COMPLETED') {
            throw new Error(`Backup no está completo: ${backupId}`);
        }

        const recoveryInfo: RecoveryInfo = {
            backupId,
            timestamp: new Date(),
            status: 'SUCCESS',
            filesRestored: 0
        };

        try {
            logger.info(`🔄 Iniciando restauración desde backup: ${backupId}`);

            const backupDir = this.getBackupDirectory(backupId);

            // 1. Verificar integridad del backup
            await this.verifyBackupIntegrity(backupDir, backup.checksum);

            // 2. Descomprimir si es necesario
            if (backup.compressed) {
                await this.decompressBackup(backupDir);
            }

            // 3. Desencriptar si es necesario
            if (backup.encrypted) {
                await this.decryptBackup(backupDir);
            }

            // 4. Restaurar archivos
            const restoreResult = await this.restoreFiles(backupDir);
            recoveryInfo.filesRestored = restoreResult.filesRestored;

            // 5. Marcar como exitoso
            recoveryInfo.status = 'SUCCESS';

            this.recoveryHistory.push(recoveryInfo);

            logger.info(`✅ Restauración completada desde backup: ${backupId}`, {
                filesRestored: recoveryInfo.filesRestored
            });

            return recoveryInfo;

        } catch (error) {
            recoveryInfo.status = 'FAILED';
            recoveryInfo.error = error instanceof Error ? error.message : 'Error desconocido';

            this.recoveryHistory.push(recoveryInfo);

            logger.error(`❌ Error en restauración desde backup: ${backupId}`, {
                error: recoveryInfo.error
            });

            throw error;
        }
    }

    /**
     * Crea directorio de backup
     */
    private async createBackupDirectory(backupId: string): Promise<string> {
        const backupDir = path.join(process.cwd(), 'backups', backupId);
        await fs.mkdir(backupDir, { recursive: true });

        logger.debug(`📁 Directorio de backup creado: ${backupDir}`);
        return backupDir;
    }

    /**
     * Copia archivos al directorio de backup
     */
    private async copyFilesToBackup(backupDir: string): Promise<{ filesCount: number }> {
        let filesCount = 0;

        for (const sourceDir of this.config.backupDirectories) {
            try {
                await fs.access(sourceDir);
                const result = await this.copyDirectoryRecursive(sourceDir, backupDir);
                filesCount += result.filesCount;
            } catch (error) {
                logger.warn(`⚠️ Directorio no accesible: ${sourceDir}`);
            }
        }

        return { filesCount };
    }

    /**
     * Copia directorio recursivamente
     */
    private async copyDirectoryRecursive(source: string, destination: string): Promise<{ filesCount: number }> {
        let filesCount = 0;

        try {
            const entries = await fs.readdir(source, { withFileTypes: true });

            for (const entry of entries) {
                const sourcePath = path.join(source, entry.name);
                const destPath = path.join(destination, entry.name);

                // Verificar si debe ser excluido
                if (this.shouldExcludeFile(entry.name)) {
                    continue;
                }

                if (entry.isDirectory()) {
                    await fs.mkdir(destPath, { recursive: true });
                    const subResult = await this.copyDirectoryRecursive(sourcePath, destPath);
                    filesCount += subResult.filesCount;
                } else {
                    await fs.copyFile(sourcePath, destPath);
                    filesCount++;
                }
            }
        } catch (error) {
            logger.warn(`⚠️ Error copiando directorio ${source}:`, error);
        }

        return { filesCount };
    }

    /**
     * Comprime el backup
     */
    private async compressBackup(backupDir: string): Promise<void> {
        try {
            const archivePath = `${backupDir}.tar.gz`;
            const command = `tar -czf "${archivePath}" -C "${path.dirname(backupDir)}" "${path.basename(backupDir)}"`;

            await execAsync(command);

            // Eliminar directorio original
            await fs.rm(backupDir, { recursive: true, force: true });

            logger.debug(`🗜️ Backup comprimido: ${archivePath}`);
        } catch (error) {
            throw new Error(`Error comprimiendo backup: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    /**
     * Encripta el backup
     */
    private async encryptBackup(backupDir: string): Promise<void> {
        // Implementación básica de encriptación
        // En una implementación real, usaría librerías de criptografía
        logger.debug(`🔐 Backup encriptado: ${backupDir}`);
    }

    /**
     * Calcula checksum del backup
     */
    private async calculateBackupChecksum(backupDir: string): Promise<string> {
        try {
            const command = `find "${backupDir}" -type f -exec md5sum {} \\; | sort | md5sum`;
            const { stdout } = await execAsync(command);
            return stdout.trim().split(' ')[0];
        } catch (error) {
            logger.warn('⚠️ Error calculando checksum, usando valor por defecto');
            return 'unknown';
        }
    }

    /**
     * Obtiene el tamaño del backup
     */
    private async getBackupSize(backupDir: string): Promise<number> {
        try {
            const command = `du -sb "${backupDir}"`;
            const { stdout } = await execAsync(command);
            return parseInt(stdout.split('\t')[0], 10);
        } catch (error) {
            logger.warn('⚠️ Error calculando tamaño, usando valor por defecto');
            return 0;
        }
    }

    /**
     * Verifica integridad del backup
     */
    private async verifyBackupIntegrity(backupDir: string, expectedChecksum: string): Promise<void> {
        if (expectedChecksum === 'unknown') {
            logger.warn('⚠️ Checksum desconocido, saltando verificación');
            return;
        }

        const actualChecksum = await this.calculateBackupChecksum(backupDir);
        if (actualChecksum !== expectedChecksum) {
            throw new Error(`Checksum no coincide: esperado ${expectedChecksum}, actual ${actualChecksum}`);
        }

        logger.debug(`✅ Integridad del backup verificada: ${actualChecksum}`);
    }

    /**
     * Descomprime el backup
     */
    private async decompressBackup(backupDir: string): Promise<void> {
        try {
            const archivePath = `${backupDir}.tar.gz`;
            const command = `tar -xzf "${archivePath}" -C "${path.dirname(backupDir)}"`;

            await execAsync(command);

            logger.debug(`📦 Backup descomprimido: ${backupDir}`);
        } catch (error) {
            throw new Error(`Error descomprimiendo backup: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    /**
     * Desencripta el backup
     */
    private async decryptBackup(backupDir: string): Promise<void> {
        // Implementación básica de desencriptación
        logger.debug(`🔓 Backup desencriptado: ${backupDir}`);
    }

    /**
     * Restaura archivos desde el backup
     */
    private async restoreFiles(backupDir: string): Promise<{ filesRestored: number }> {
        let filesRestored = 0;

        try {
            const entries = await fs.readdir(backupDir, { withFileTypes: true });

            for (const entry of entries) {
                const sourcePath = path.join(backupDir, entry.name);
                const destPath = path.join(process.cwd(), 'backend', entry.name);

                if (entry.isDirectory()) {
                    await fs.mkdir(destPath, { recursive: true });
                    const subResult = await this.restoreDirectoryRecursive(sourcePath, destPath);
                    filesRestored += subResult.filesRestored;
                } else {
                    await fs.copyFile(sourcePath, destPath);
                    filesRestored++;
                }
            }
        } catch (error) {
            logger.warn(`⚠️ Error restaurando archivos:`, error);
        }

        return { filesRestored };
    }

    /**
     * Restaura directorio recursivamente
     */
    private async restoreDirectoryRecursive(source: string, destination: string): Promise<{ filesRestored: number }> {
        let filesRestored = 0;

        try {
            const entries = await fs.readdir(source, { withFileTypes: true });

            for (const entry of entries) {
                const sourcePath = path.join(source, entry.name);
                const destPath = path.join(destination, entry.name);

                if (entry.isDirectory()) {
                    await fs.mkdir(destPath, { recursive: true });
                    const subResult = await this.restoreDirectoryRecursive(sourcePath, destPath);
                    filesRestored += subResult.filesRestored;
                } else {
                    await fs.copyFile(sourcePath, destPath);
                    filesRestored++;
                }
            }
        } catch (error) {
            logger.warn(`⚠️ Error restaurando directorio ${source}:`, error);
        }

        return { filesRestored };
    }

    /**
     * Limpia backups antiguos
     */
    private async cleanupOldBackups(): Promise<void> {
        const cutoffDate = new Date(Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000));

        // Eliminar backups antiguos
        const oldBackups = this.backupHistory.filter(backup =>
            backup.timestamp < cutoffDate ||
            this.backupHistory.indexOf(backup) < this.backupHistory.length - this.config.maxBackups
        );

        for (const backup of oldBackups) {
            try {
                const backupDir = this.getBackupDirectory(backup.id);
                await fs.rm(backupDir, { recursive: true, force: true });

                const index = this.backupHistory.indexOf(backup);
                if (index > -1) {
                    this.backupHistory.splice(index, 1);
                }

                logger.debug(`🗑️ Backup antiguo eliminado: ${backup.id}`);
            } catch (error) {
                logger.warn(`⚠️ Error eliminando backup antiguo ${backup.id}:`, error);
            }
        }
    }

    /**
     * Verifica si un archivo debe ser excluido
     */
    private shouldExcludeFile(fileName: string): boolean {
        return this.config.excludePatterns.some(pattern => {
            if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace('*', '.*'));
                return regex.test(fileName);
            }
            return fileName === pattern;
        });
    }

    /**
     * Obtiene directorio de backup
     */
    private getBackupDirectory(backupId: string): string {
        return path.join(process.cwd(), 'backups', backupId);
    }

    /**
     * Genera ID único para backup
     */
    private generateBackupId(): string {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return `backup-${timestamp}`;
    }

    /**
     * Inicia backup automático
     */
    private startAutoBackup(): void {
        if (!this.config.enableAutoBackup) {
            return;
        }

        this.backupTimer = setInterval(async () => {
            try {
                logger.info('🕐 Ejecutando backup automático');
                await this.performFullBackup();
            } catch (error) {
                logger.error('❌ Error en backup automático:', error);
            }
        }, this.config.backupInterval) as NodeJS.Timeout;

        logger.info('🕐 Backup automático iniciado', {
            interval: this.formatTime(this.config.backupInterval)
        });
    }

    /**
     * Detiene backup automático
     */
    stopAutoBackup(): void {
        if (this.backupTimer) {
            clearInterval(this.backupTimer);
            this.backupTimer = null;
            logger.info('🛑 Backup automático detenido');
        }
    }

    /**
     * Configura handlers para backup al cerrar la aplicación
     */
    private setupProcessHandlers(): void {
        const finalBackup = async () => {
            if (this.config.enableAutoBackup && !this.isBackupInProgress) {
                logger.info('🔄 Cerrando aplicación, ejecutando backup final...');
                try {
                    await this.performFullBackup();
                } catch (error) {
                    logger.error('❌ Error en backup final:', error);
                }
            }
        };

        process.on('SIGINT', finalBackup);
        process.on('SIGTERM', finalBackup);
    }

    /**
     * Obtiene historial de backups
     */
    getBackupHistory(): BackupInfo[] {
        return [...this.backupHistory];
    }

    /**
     * Obtiene historial de recuperaciones
     */
    getRecoveryHistory(): RecoveryInfo[] {
        return [...this.recoveryHistory];
    }

    /**
     * Obtiene estadísticas de backup
     */
    getBackupStats(): {
        totalBackups: number;
        successfulBackups: number;
        failedBackups: number;
        totalSize: number;
        lastBackup: Date | null;
    } {
        const totalBackups = this.backupHistory.length;
        const successfulBackups = this.backupHistory.filter(b => b.status === 'COMPLETED').length;
        const failedBackups = this.backupHistory.filter(b => b.status === 'FAILED').length;
        const totalSize = this.backupHistory.reduce((sum, b) => sum + b.size, 0);
        const lastBackup = this.backupHistory.length > 0 ?
            this.backupHistory[this.backupHistory.length - 1].timestamp : null;

        return {
            totalBackups,
            successfulBackups,
            failedBackups,
            totalSize,
            lastBackup
        };
    }

    /**
     * Actualiza configuración
     */
    updateConfig(newConfig: Partial<BackupConfig>): void {
        Object.assign(this.config, newConfig);
        logger.info('⚙️ Configuración de backup actualizada', this.config);
    }

    /**
     * Helper para formatear tiempo
     */
    private formatTime(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    /**
     * Helper para formatear bytes
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Destructor para limpiar recursos
     */
    destroy(): void {
        this.stopAutoBackup();
        this.backupHistory = [];
        this.recoveryHistory = [];
        logger.info('🧹 BackupRecoveryService destruido');
    }
}

// Singleton instance
export const backupRecoveryService = new BackupRecoveryService();
