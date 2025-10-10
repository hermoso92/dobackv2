import { logger } from '../utils/logger';
import { apiService } from './api';

export interface CSVExportOptions {
    vehicleIds?: string[];
    startDate?: Date;
    endDate?: Date;
    includeGPS?: boolean;
    includeCAN?: boolean;
    includeStability?: boolean;
    includeRotativo?: boolean;
    includeEvents?: boolean;
    organizationId?: string;
}

export interface CSVExportResult {
    success: boolean;
    fileName?: string;
    error?: string;
}

export class CSVExportService {
    /**
     * Exporta datos de telemetría a CSV
     */
    static async exportTelemetryCSV(options: CSVExportOptions = {}): Promise<CSVExportResult> {
        try {
            logger.info('Exportando telemetría a CSV', { options });

            const response = await apiService.post('/api/export/telemetry/csv', {
                vehicleIds: options.vehicleIds,
                startDate: options.startDate?.toISOString(),
                endDate: options.endDate?.toISOString(),
                includeGPS: options.includeGPS ?? true,
                includeCAN: options.includeCAN ?? true,
                includeStability: options.includeStability ?? true,
                includeRotativo: options.includeRotativo ?? true,
                includeEvents: options.includeEvents ?? true
            }, {
                responseType: 'blob'
            });

            if (response.success && response.data) {
                const blob = response.data as Blob;
                const fileName = `telemetria-${new Date().toISOString().split('T')[0]}.csv`;

                // Descargar archivo
                this.downloadCSV(blob, fileName);

                return {
                    success: true,
                    fileName
                };
            }

            throw new Error('No se pudo generar el CSV de telemetría');
        } catch (error) {
            logger.error('Error exportando telemetría a CSV', { error, options });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }

    /**
     * Exporta una sesión específica a CSV
     */
    static async exportSessionCSV(sessionId: string, options: CSVExportOptions = {}): Promise<CSVExportResult> {
        try {
            logger.info('Exportando sesión a CSV', { sessionId, options });

            const response = await apiService.post(`/api/export/session/csv/${sessionId}`, {
                ...options
            }, {
                responseType: 'blob'
            });

            if (response.success && response.data) {
                const blob = response.data as Blob;
                const fileName = `sesion-${sessionId}-${new Date().toISOString().split('T')[0]}.csv`;

                // Descargar archivo
                this.downloadCSV(blob, fileName);

                return {
                    success: true,
                    fileName
                };
            }

            throw new Error('No se pudo generar el CSV de la sesión');
        } catch (error) {
            logger.error('Error exportando sesión a CSV', { error, sessionId });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }

    /**
     * Exporta eventos a CSV
     */
    static async exportEventsCSV(options: CSVExportOptions = {}): Promise<CSVExportResult> {
        try {
            logger.info('Exportando eventos a CSV', { options });

            const response = await apiService.post('/api/export/events/csv', {
                vehicleIds: options.vehicleIds,
                startDate: options.startDate?.toISOString(),
                endDate: options.endDate?.toISOString()
            }, {
                responseType: 'blob'
            });

            if (response.success && response.data) {
                const blob = response.data as Blob;
                const fileName = `eventos-${new Date().toISOString().split('T')[0]}.csv`;

                // Descargar archivo
                this.downloadCSV(blob, fileName);

                return {
                    success: true,
                    fileName
                };
            }

            throw new Error('No se pudo generar el CSV de eventos');
        } catch (error) {
            logger.error('Error exportando eventos a CSV', { error, options });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }

    /**
     * Descarga un archivo CSV desde un blob
     */
    private static downloadCSV(blob: Blob, fileName: string): void {
        try {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            logger.info('CSV descargado exitosamente', { fileName });
        } catch (error) {
            logger.error('Error descargando CSV', { error, fileName });
            throw error;
        }
    }

    /**
     * Genera CSV desde datos locales (para exportación rápida)
     */
    static generateLocalCSV(data: any[], headers: string[], fileName: string): void {
        try {
            // Crear contenido CSV
            let csvContent = headers.join(',') + '\n';

            data.forEach(row => {
                const values = headers.map(header => {
                    const value = row[header] || '';
                    // Escapar comillas y envolver en comillas si contiene comas
                    const escapedValue = String(value).replace(/"/g, '""');
                    return escapedValue.includes(',') ? `"${escapedValue}"` : escapedValue;
                });
                csvContent += values.join(',') + '\n';
            });

            // Crear y descargar archivo
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute('download', fileName);
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            logger.info('CSV local generado y descargado', { fileName, rowsCount: data.length });
        } catch (error) {
            logger.error('Error generando CSV local', { error, fileName });
            throw error;
        }
    }
}
