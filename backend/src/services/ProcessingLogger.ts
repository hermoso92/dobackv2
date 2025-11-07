/**
 * 📝 SERVICIO DE LOGGING DE PROCESAMIENTO
 * Guarda logs detallados del procesamiento automático en archivos .txt
 */

import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

export class ProcessingLogger {
    private logFilePath: string;
    private startTime: Date;
    private logs: string[] = [];

    constructor(reportId: string) {
        this.startTime = new Date();

        // Crear directorio de logs si no existe
        const logsDir = path.join(__dirname, '../../logs/processing');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        // Crear nombre de archivo con timestamp
        const timestamp = this.startTime.toISOString().replace(/[:.]/g, '-').slice(0, 19);
        this.logFilePath = path.join(logsDir, `processing_${reportId}_${timestamp}.txt`);

        // Escribir encabezado
        this.writeHeader();
    }

    private writeHeader(): void {
        const header = `
========================================
  PROCESAMIENTO AUTOMÁTICO DOBACKSOFT
========================================

Fecha inicio: ${this.startTime.toLocaleString('es-ES')}
Archivo log: ${path.basename(this.logFilePath)}

========================================
`;
        this.log(header);
        this.flush(); // Escribir inmediatamente
    }

    /**
     * Agregar una línea al log
     */
    log(message: string): void {
        const timestamp = new Date().toISOString().slice(11, 19); // HH:MM:SS
        const formattedMessage = `[${timestamp}] ${message}`;
        this.logs.push(formattedMessage);

        // Auto-flush cada 50 líneas
        if (this.logs.length >= 50) {
            this.flush();
        }
    }

    /**
     * Agregar un separador visual
     */
    separator(title?: string): void {
        if (title) {
            this.log('');
            this.log(`${'='.repeat(60)}`);
            this.log(`  ${title.toUpperCase()}`);
            this.log(`${'='.repeat(60)}`);
        } else {
            this.log(`${'-'.repeat(60)}`);
        }
    }

    /**
     * Agregar una sección con título
     */
    section(title: string, content: string): void {
        this.separator(title);
        this.log(content);
        this.log('');
    }

    /**
     * Guardar estadísticas en formato tabla
     */
    stats(title: string, data: Record<string, any>): void {
        this.separator(title);
        for (const [key, value] of Object.entries(data)) {
            const paddedKey = key.padEnd(40, '.');
            this.log(`  ${paddedKey} ${value}`);
        }
        this.log('');
    }

    /**
     * Guardar un error
     */
    error(message: string, error?: any): void {
        this.log(`❌ ERROR: ${message}`);
        if (error) {
            this.log(`   Detalle: ${error.message || error}`);
            if (error.stack) {
                this.log(`   Stack: ${error.stack.split('\n')[0]}`);
            }
        }
        this.flush(); // Flush inmediato para errores
    }

    /**
     * Guardar una advertencia
     */
    warning(message: string): void {
        this.log(`⚠️ ADVERTENCIA: ${message}`);
    }

    /**
     * Guardar un éxito
     */
    success(message: string): void {
        this.log(`✅ ${message}`);
    }

    /**
     * Guardar información
     */
    info(message: string): void {
        this.log(`ℹ️ ${message}`);
    }

    /**
     * Escribir logs acumulados al archivo
     */
    flush(): void {
        try {
            const content = this.logs.join('\n') + '\n';
            fs.appendFileSync(this.logFilePath, content, 'utf8');
            this.logs = []; // Limpiar buffer
        } catch (error: any) {
            logger.error(`Error escribiendo log: ${error.message}`);
        }
    }

    /**
     * Finalizar el log con resumen
     */
    finalize(summary: {
        totalFiles: number;
        totalSessions: number;
        totalOmitted: number;
        errors: number;
        warnings: number;
    }): void {
        const endTime = new Date();
        const duration = endTime.getTime() - this.startTime.getTime();
        const durationMinutes = (duration / 60000).toFixed(2);

        this.separator('RESUMEN FINAL');
        this.log('');
        this.log(`Fecha fin: ${endTime.toLocaleString('es-ES')}`);
        this.log(`Duración total: ${durationMinutes} minutos`);
        this.log('');
        this.log(`Archivos procesados: ${summary.totalFiles}`);
        this.log(`Sesiones creadas: ${summary.totalSessions}`);
        this.log(`Sesiones omitidas: ${summary.totalOmitted}`);
        this.log(`Errores: ${summary.errors}`);
        this.log(`Advertencias: ${summary.warnings}`);
        this.log('');

        if (summary.errors > 0) {
            this.log(`⚠️ Procesamiento completado CON ERRORES`);
        } else {
            this.log(`✅ Procesamiento completado EXITOSAMENTE`);
        }

        this.log('');
        this.log(`${'='.repeat(60)}`);
        this.log(`Log guardado en: ${this.logFilePath}`);
        this.log(`${'='.repeat(60)}`);

        this.flush(); // Flush final

        logger.info(`📝 Log de procesamiento guardado: ${this.logFilePath}`);
    }

    /**
     * Obtener ruta del archivo de log
     */
    getLogPath(): string {
        return this.logFilePath;
    }
}

