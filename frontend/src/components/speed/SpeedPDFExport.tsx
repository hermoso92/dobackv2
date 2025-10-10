import React from 'react';
import { toast } from 'react-hot-toast';
import { logger } from '../../utils/logger';

// Tipos
interface SpeedEvent {
    id: string;
    vehicleId: string;
    vehicleName: string;
    timestamp: string;
    lat: number;
    lng: number;
    speed: number;
    speedLimit: number;
    rotativoActive: boolean;
    roadType: string;
    severity: 'normal' | 'warning' | 'critical';
    location: string;
}

interface SpeedFilters {
    vehicles: string[];
    timeRange: 'day' | 'week' | 'month' | 'year' | 'all';
    rotativoStatus: 'all' | 'with' | 'without';
}

interface SpeedMetrics {
    maxSpeed: number;
    avgSpeed: number;
    totalExcesses: number;
    excessesWithRotativo: number;
    excessesWithoutRotativo: number;
    topSpeedVehicles: Array<{
        vehicleId: string;
        vehicleName: string;
        maxSpeed: number;
        excessCount: number;
    }>;
}

interface SpeedPDFExportProps {
    events: SpeedEvent[];
    filters: SpeedFilters;
    metrics: SpeedMetrics;
    onExportComplete?: () => void;
}

// Clase para generar PDF
export class SpeedPDFGenerator {
    private events: SpeedEvent[];
    private filters: SpeedFilters;
    private metrics: SpeedMetrics;

    constructor(events: SpeedEvent[], filters: SpeedFilters, metrics: SpeedMetrics) {
        this.events = events;
        this.filters = filters;
        this.metrics = metrics;
    }

    // Generar contenido del PDF
    generatePDFContent(): string {
        const currentDate = new Date().toLocaleDateString('es-ES');
        const currentTime = new Date().toLocaleTimeString('es-ES');

        // Encabezado
        const header = `
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1976d2; padding-bottom: 15px;">
                <h1 style="color: #1976d2; margin: 0;">Reporte de Velocidad - DobackSoft</h1>
                <p style="color: #666; margin: 5px 0;">Generado el ${currentDate} a las ${currentTime}</p>
            </div>
        `;

        // Resumen de filtros aplicados
        const filtersSummary = this.generateFiltersSummary();

        // Métricas principales
        const metricsSection = this.generateMetricsSection();

        // Tabla de excesos
        const excessesTable = this.generateExcessesTable();

        // Ranking de vehículos
        const rankingSection = this.generateRankingSection();

        // Recomendaciones IA
        const recommendations = this.generateRecommendations();

        // Pie de página
        const footer = `
            <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; text-align: center; color: #666;">
                <p>Reporte generado por DobackSoft - Sistema de Gestión de Flotas</p>
                <p>Para más información, contacte con el administrador del sistema</p>
            </div>
        `;

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Reporte de Velocidad - DobackSoft</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                    .metric-card { 
                        background: #f8f9fa; 
                        border: 1px solid #dee2e6; 
                        border-radius: 8px; 
                        padding: 15px; 
                        margin: 10px 0;
                        display: inline-block;
                        width: 200px;
                        text-align: center;
                    }
                    .metric-value { font-size: 24px; font-weight: bold; color: #1976d2; }
                    .metric-label { color: #666; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    th { background-color: #1976d2; color: white; }
                    .critical { background-color: #ffebee; }
                    .warning { background-color: #fff3e0; }
                    .normal { background-color: #e8f5e8; }
                    .recommendation { 
                        background: #e3f2fd; 
                        border-left: 4px solid #1976d2; 
                        padding: 15px; 
                        margin: 10px 0;
                    }
                    .filter-chip { 
                        background: #e3f2fd; 
                        color: #1976d2; 
                        padding: 4px 8px; 
                        border-radius: 4px; 
                        margin: 2px;
                        display: inline-block;
                    }
                </style>
            </head>
            <body>
                ${header}
                ${filtersSummary}
                ${metricsSection}
                ${excessesTable}
                ${rankingSection}
                ${recommendations}
                ${footer}
            </body>
            </html>
        `;
    }

    private generateFiltersSummary(): string {
        const vehiclesText = this.filters.vehicles.length > 0
            ? this.filters.vehicles.join(', ')
            : 'Todos los vehículos';

        const timeRangeText = {
            'day': 'Último día',
            'week': 'Última semana',
            'month': 'Último mes',
            'year': 'Último año',
            'all': 'Todo el período'
        }[this.filters.timeRange];

        const rotativoText = {
            'all': 'Ambos estados',
            'with': 'Solo con rotativo activo',
            'without': 'Solo sin rotativo'
        }[this.filters.rotativoStatus];

        return `
            <div style="margin-bottom: 30px;">
                <h2 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Filtros Aplicados</h2>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <p><strong>Vehículos:</strong> <span class="filter-chip">${vehiclesText}</span></p>
                    <p><strong>Período:</strong> <span class="filter-chip">${timeRangeText}</span></p>
                    <p><strong>Estado del Rotativo:</strong> <span class="filter-chip">${rotativoText}</span></p>
                </div>
            </div>
        `;
    }

    private generateMetricsSection(): string {
        return `
            <div style="margin-bottom: 30px;">
                <h2 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Métricas Principales</h2>
                <div style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <div class="metric-card">
                        <div class="metric-value">${this.metrics.maxSpeed}</div>
                        <div class="metric-label">Velocidad Máxima (km/h)</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${this.metrics.avgSpeed.toFixed(1)}</div>
                        <div class="metric-label">Velocidad Media (km/h)</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${this.metrics.totalExcesses}</div>
                        <div class="metric-label">Excesos Totales</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${this.metrics.excessesWithRotativo}</div>
                        <div class="metric-label">Con Rotativo</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${this.metrics.excessesWithoutRotativo}</div>
                        <div class="metric-label">Sin Rotativo</div>
                    </div>
                </div>
            </div>
        `;
    }

    private generateExcessesTable(): string {
        const excesses = this.events.filter(e => e.speed > e.speedLimit);

        if (excesses.length === 0) {
            return `
                <div style="margin-bottom: 30px;">
                    <h2 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Excesos de Velocidad</h2>
                    <p style="text-align: center; color: #666; font-style: italic;">No se registraron excesos de velocidad con los filtros aplicados.</p>
                </div>
            `;
        }

        const tableRows = excesses.map(event => {
            const severityClass = event.severity === 'critical' ? 'critical' :
                event.severity === 'warning' ? 'warning' : 'normal';
            const rotativoIcon = event.rotativoActive ? '✓' : '✗';
            const rotativoColor = event.rotativoActive ? '#4caf50' : '#f44336';

            return `
                <tr class="${severityClass}">
                    <td>${event.vehicleName}</td>
                    <td>${new Date(event.timestamp).toLocaleString('es-ES')}</td>
                    <td><strong>${event.speed} km/h</strong></td>
                    <td>${event.speedLimit} km/h</td>
                    <td style="color: ${rotativoColor}; font-weight: bold;">${rotativoIcon}</td>
                    <td>${event.roadType}</td>
                    <td>${event.location}</td>
                    <td style="text-transform: capitalize;">${event.severity}</td>
                </tr>
            `;
        }).join('');

        return `
            <div style="margin-bottom: 30px;">
                <h2 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
                    Excesos de Velocidad (${excesses.length})
                </h2>
                <table>
                    <thead>
                        <tr>
                            <th>Vehículo</th>
                            <th>Fecha/Hora</th>
                            <th>Velocidad</th>
                            <th>Límite</th>
                            <th>Rotativo</th>
                            <th>Tipo de Vía</th>
                            <th>Ubicación</th>
                            <th>Severidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        `;
    }

    private generateRankingSection(): string {
        if (this.metrics.topSpeedVehicles.length === 0) {
            return '';
        }

        const rankingRows = this.metrics.topSpeedVehicles.map((vehicle, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${vehicle.vehicleName}</td>
                <td><strong>${vehicle.maxSpeed} km/h</strong></td>
                <td>${vehicle.excessCount}</td>
            </tr>
        `).join('');

        return `
            <div style="margin-bottom: 30px;">
                <h2 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Ranking de Vehículos</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Posición</th>
                            <th>Vehículo</th>
                            <th>Velocidad Máxima</th>
                            <th>Número de Excesos</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rankingRows}
                    </tbody>
                </table>
            </div>
        `;
    }

    private generateRecommendations(): string {
        const recommendations = [];

        // Recomendación basada en excesos sin rotativo
        if (this.metrics.excessesWithoutRotativo > 0) {
            recommendations.push(`
                <div class="recommendation">
                    <strong>⚠️ Precaución:</strong> Se detectaron ${this.metrics.excessesWithoutRotativo} excesos de velocidad sin rotativo activo. 
                    Estos excesos no están justificados por emergencias y representan un riesgo de seguridad.
                </div>
            `);
        }

        // Recomendación basada en velocidad máxima
        if (this.metrics.maxSpeed > 100) {
            recommendations.push(`
                <div class="recommendation">
                    <strong>🚨 Alerta:</strong> Se registró una velocidad máxima de ${this.metrics.maxSpeed} km/h. 
                    Revisar las circunstancias de este evento y considerar medidas preventivas.
                </div>
            `);
        }

        // Recomendación basada en ubicaciones con más excesos
        const locationCounts = this.events.reduce((acc, event) => {
            acc[event.location] = (acc[event.location] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topLocation = Object.entries(locationCounts)
            .sort(([, a], [, b]) => b - a)[0];

        if (topLocation && topLocation[1] > 3) {
            recommendations.push(`
                <div class="recommendation">
                    <strong>📍 Zona de Riesgo:</strong> El tramo "${topLocation[0]}" concentra ${topLocation[1]} eventos de velocidad. 
                    Considerar medidas especiales en esta zona.
                </div>
            `);
        }

        // Recomendación general
        if (this.metrics.totalExcesses > 10) {
            recommendations.push(`
                <div class="recommendation">
                    <strong>📊 Análisis General:</strong> Se registraron ${this.metrics.totalExcesses} excesos de velocidad en total. 
                    El ${Math.round((this.metrics.excessesWithRotativo / this.metrics.totalExcesses) * 100)}% fueron con rotativo activo (justificados por emergencias).
                </div>
            `);
        }

        if (recommendations.length === 0) {
            recommendations.push(`
                <div class="recommendation">
                    <strong>✅ Buenas Prácticas:</strong> No se detectaron patrones de riesgo significativos en los datos analizados. 
                    Continuar con las medidas de seguridad actuales.
                </div>
            `);
        }

        return `
            <div style="margin-bottom: 30px;">
                <h2 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Recomendaciones IA</h2>
                ${recommendations.join('')}
            </div>
        `;
    }

    // Método para exportar PDF usando jsPDF
    async exportToPDF(): Promise<void> {
        try {
            // Verificar si jsPDF está disponible
            if (typeof window === 'undefined' || !(window as any).html2canvas || !(window as any).jspdf) {
                throw new Error('Librerías de PDF no disponibles');
            }

            const content = this.generatePDFContent();

            // Crear elemento temporal para renderizar el HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.width = '800px';
            document.body.appendChild(tempDiv);

            // Generar PDF usando html2canvas y jsPDF
            const canvas = await (window as any).html2canvas(tempDiv, {
                scale: 2,
                useCORS: true,
                allowTaint: true
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new (window as any).jspdf('p', 'mm', 'a4');

            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;

            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Limpiar elemento temporal
            document.body.removeChild(tempDiv);

            // Descargar PDF
            pdf.save(`reporte-velocidad-${new Date().toISOString().split('T')[0]}.pdf`);

            logger.info('PDF de velocidad exportado correctamente');

        } catch (error) {
            logger.error('Error exportando PDF:', error);
            throw error;
        }
    }
}

// Hook para usar la exportación de PDF
export const useSpeedPDFExport = () => {
    const exportPDF = async (
        events: SpeedEvent[],
        filters: SpeedFilters,
        metrics: SpeedMetrics
    ) => {
        try {
            const generator = new SpeedPDFGenerator(events, filters, metrics);
            await generator.exportToPDF();
            toast.success('PDF exportado correctamente');
        } catch (error: any) {
            logger.error('Error en exportación PDF:', error);
            toast.error('Error exportando PDF: ' + error.message);
        }
    };

    return { exportPDF };
};

// Componente para botón de exportación
export const SpeedPDFExportButton: React.FC<SpeedPDFExportProps> = ({
    events,
    filters,
    metrics,
    onExportComplete
}) => {
    const { exportPDF } = useSpeedPDFExport();

    const handleExport = async () => {
        try {
            await exportPDF(events, filters, metrics);
            onExportComplete?.();
        } catch (error) {
            // Error ya manejado en el hook
        }
    };

    return (
        <button
            onClick={handleExport}
            style={{
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}
        >
            📄 Exportar PDF
        </button>
    );
};
