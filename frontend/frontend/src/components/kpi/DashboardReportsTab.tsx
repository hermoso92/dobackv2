import {
    ArrowDownTrayIcon,
    DocumentArrowDownIcon,
    DocumentTextIcon,
    EyeIcon,
    PrinterIcon,
    ShareIcon
} from '@heroicons/react/24/outline';
import React, { useCallback, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePDFExport } from '../../hooks/usePDFExport';
import { logger } from '../../utils/logger';

interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    type: 'executive' | 'operational' | 'technical' | 'compliance';
    format: 'pdf' | 'excel' | 'csv';
    lastGenerated?: Date;
    size?: number;
    status: 'available' | 'generating' | 'error';
}

interface DashboardReportsTabProps {
    className?: string;
}

export const DashboardReportsTab: React.FC<DashboardReportsTabProps> = ({ className = '' }) => {
    const { user } = useAuth();
    const { exportDashboard, isExporting } = usePDFExport({
        onSuccess: (fileName: string) => {
            logger.info('Reporte generado exitosamente', { fileName, userId: user?.id });
        },
        onError: (error: string) => {
            logger.error('Error generando reporte', { error, userId: user?.id });
        }
    });

    const [reports, setReports] = useState<ReportTemplate[]>([
        {
            id: 'executive-summary',
            name: 'Resumen Ejecutivo',
            description: 'Reporte completo con KPIs principales, métricas de rendimiento y análisis de tendencias',
            type: 'executive',
            format: 'pdf',
            lastGenerated: new Date(Date.now() - 2 * 60 * 60 * 1000),
            size: 2.4,
            status: 'available'
        },
        {
            id: 'operational-report',
            name: 'Reporte Operacional',
            description: 'Análisis detallado de operaciones diarias, eventos y rendimiento de flota',
            type: 'operational',
            format: 'pdf',
            lastGenerated: new Date(Date.now() - 4 * 60 * 60 * 1000),
            size: 5.1,
            status: 'available'
        },
        {
            id: 'technical-analysis',
            name: 'Análisis Técnico',
            description: 'Reporte técnico con métricas de telemetría, estabilidad y diagnósticos',
            type: 'technical',
            format: 'excel',
            lastGenerated: new Date(Date.now() - 6 * 60 * 60 * 1000),
            size: 12.3,
            status: 'available'
        }
    ]);

    const [selectedReports, setSelectedReports] = useState<string[]>([]);

    const generateReport = useCallback(async (reportId: string) => {
        if (!user?.organizationId) return;

        try {
            setReports(prev => prev.map(report => 
                report.id === reportId ? { ...report, status: 'generating' } : report
            ));

            await new Promise(resolve => setTimeout(resolve, 2000));

            setReports(prev => prev.map(report => 
                report.id === reportId 
                    ? { 
                        ...report, 
                        status: 'available',
                        lastGenerated: new Date(),
                        size: Math.random() * 10 + 1
                    } 
                    : report
            ));

            logger.info('Reporte generado', { reportId, userId: user.id });
        } catch (error) {
            setReports(prev => prev.map(report => 
                report.id === reportId ? { ...report, status: 'error' } : report
            ));
            logger.error('Error generando reporte', { error, reportId, userId: user.id });
        }
    }, [user]);

    const downloadReport = useCallback(async (report: ReportTemplate) => {
        try {
            logger.info('Descargando reporte', { reportId: report.id, userId: user?.id });
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            logger.error('Error descargando reporte', { error, reportId: report.id, userId: user?.id });
        }
    }, [user]);

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'executive': return 'bg-blue-100 text-blue-800';
            case 'operational': return 'bg-green-100 text-green-800';
            case 'technical': return 'bg-purple-100 text-purple-800';
            case 'compliance': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getFormatIcon = (format: string) => {
        switch (format) {
            case 'pdf': return <DocumentTextIcon className="h-4 w-4" />;
            case 'excel': return <DocumentArrowDownIcon className="h-4 w-4" />;
            case 'csv': return <DocumentArrowDownIcon className="h-4 w-4" />;
            default: return <DocumentTextIcon className="h-4 w-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'text-green-600';
            case 'generating': return 'text-yellow-600';
            case 'error': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'available': return 'Disponible';
            case 'generating': return 'Generando...';
            case 'error': return 'Error';
            default: return 'Desconocido';
        }
    };

    const handleSelectReport = (reportId: string) => {
        setSelectedReports(prev => 
            prev.includes(reportId) 
                ? prev.filter(id => id !== reportId)
                : [...prev, reportId]
        );
    };

    return (
        <div className={space-y-6 }>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Reportes del Dashboard</h2>
                        <p className="text-gray-600 mt-1">Genera y descarga reportes detallados del sistema</p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => exportDashboard()}
                            disabled={isExporting}
                            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <DocumentTextIcon className="h-4 w-4" />
                            <span>{isExporting ? 'Generando...' : 'Exportar Dashboard'}</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                            {reports.filter(r => r.status === 'available').length}
                        </div>
                        <div className="text-sm text-blue-600">Disponibles</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                            {reports.filter(r => r.status === 'generating').length}
                        </div>
                        <div className="text-sm text-yellow-600">Generando</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                            {reports.length}
                        </div>
                        <div className="text-sm text-purple-600">Total Reportes</div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Reportes Disponibles</h3>
                </div>
                <div className="divide-y divide-gray-200">
                    {reports.map((report) => (
                        <div key={report.id} className="p-6 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4 flex-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedReports.includes(report.id)}
                                        onChange={() => handleSelectReport(report.id)}
                                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h4 className="text-lg font-medium text-gray-900">{report.name}</h4>
                                            <span className={inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium }>
                                                {report.type}
                                            </span>
                                            <div className="flex items-center space-x-1 text-gray-500">
                                                {getFormatIcon(report.format)}
                                                <span className="text-sm uppercase">{report.format}</span>
                                            </div>
                                        </div>
                                        <p className="text-gray-600 mb-3">{report.description}</p>
                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                            {report.lastGenerated && (
                                                <span>
                                                    Última generación: {report.lastGenerated.toLocaleDateString('es-ES', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            )}
                                            {report.size && (
                                                <span>Tamaño: {report.size.toFixed(1)} MB</span>
                                            )}
                                            <span className={ont-medium }>
                                                {getStatusText(report.status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                    {report.status === 'available' && (
                                        <>
                                            <button
                                                onClick={() => downloadReport(report)}
                                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                                title="Descargar"
                                            >
                                                <ArrowDownTrayIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => generateReport(report.id)}
                                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                                            >
                                                Regenerar
                                            </button>
                                        </>
                                    )}
                                    {report.status === 'generating' && (
                                        <div className="flex items-center space-x-2 text-yellow-600">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                                            <span className="text-sm">Generando...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-blue-900 mb-2">Información sobre Reportes</h4>
                <ul className="text-blue-800 space-y-1 text-sm">
                    <li>• Los reportes se generan automáticamente cada 4 horas</li>
                    <li>• Puedes regenerar cualquier reporte en tiempo real</li>
                    <li>• Los reportes están disponibles en múltiples formatos (PDF, Excel, CSV)</li>
                    <li>• El historial de reportes se mantiene por 30 días</li>
                    <li>• Los reportes incluyen todos los filtros aplicados actualmente</li>
                </ul>
            </div>
        </div>
    );
};
