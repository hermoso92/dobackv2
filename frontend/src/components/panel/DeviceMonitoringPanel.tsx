import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useState } from 'react';
import { DEVICE_ENDPOINTS } from '../../config/api';
import { apiService } from '../../services/api';
import { DeviceControlData, DeviceFileStatus } from '../../types/deviceControl';
import { logger } from '../../utils/logger';

interface DeviceMonitoringPanelProps {
    organizationId: string;
    onDeviceClick?: (device: DeviceFileStatus) => void;
}

const DeviceMonitoringPanel: React.FC<DeviceMonitoringPanelProps> = ({
    organizationId,
    onDeviceClick
}) => {
    const [deviceData, setDeviceData] = useState<DeviceControlData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadDeviceStatus = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            logger.info('Cargando estado de dispositivos');

            const checkDate: string = new Date().toISOString().split('T')[0] || new Date().toISOString().substring(0, 10);
            const params = new URLSearchParams();
            params.append('organizationId', organizationId);
            params.append('date', checkDate);

            const response = await apiService.get<DeviceControlData>(
                `${DEVICE_ENDPOINTS.STATUS}?${params.toString()}`
            );

            if (response.success && response.data) {
                setDeviceData(response.data);
                logger.info(`Estado de dispositivos cargado: ${response.data.totalVehicles} vehículos`);
            }

        } catch (err) {
            logger.error('Error cargando estado de dispositivos:', err);
            setError('Error al cargar estado de dispositivos');
        } finally {
            setLoading(false);
        }
    }, [organizationId]);

    useEffect(() => {
        loadDeviceStatus();
        // Actualizar cada 5 minutos
        const interval = setInterval(loadDeviceStatus, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [loadDeviceStatus]);

    const getStatusIcon = (status: 'connected' | 'partial' | 'disconnected') => {
        switch (status) {
            case 'connected':
                return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
            case 'partial':
                return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
            case 'disconnected':
                return <XCircleIcon className="h-5 w-5 text-red-500" />;
        }
    };

    const getStatusText = (status: 'connected' | 'partial' | 'disconnected') => {
        switch (status) {
            case 'connected':
                return 'Conectado';
            case 'partial':
                return 'Parcial';
            case 'disconnected':
                return 'Desconectado';
        }
    };

    const getStatusColor = (status: 'connected' | 'partial' | 'disconnected') => {
        switch (status) {
            case 'connected':
                return 'bg-green-50 border-green-200';
            case 'partial':
                return 'bg-yellow-50 border-yellow-200';
            case 'disconnected':
                return 'bg-red-50 border-red-200';
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-slate-600">Cargando estado de dispositivos...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-700">
                    <ExclamationTriangleIcon className="h-5 w-5" />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    if (!deviceData) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* Resumen de estado */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <div className="text-sm font-medium text-slate-700 mb-1">Total Vehículos</div>
                    <div className="text-2xl font-bold text-slate-800">{deviceData.totalVehicles}</div>
                </div>

                <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-4">
                    <div className="text-sm font-medium text-green-700 mb-1">Conectados</div>
                    <div className="text-2xl font-bold text-green-600">{deviceData.connectedVehicles}</div>
                    <div className="text-xs text-green-600 mt-1">
                        {deviceData.totalVehicles > 0 ? Math.round((deviceData.connectedVehicles / deviceData.totalVehicles) * 100) : 0}% del total
                    </div>
                </div>

                <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-4">
                    <div className="text-sm font-medium text-yellow-700 mb-1">Parciales</div>
                    <div className="text-2xl font-bold text-yellow-600">{deviceData.partialVehicles}</div>
                    <div className="text-xs text-yellow-600 mt-1">Archivos faltantes</div>
                </div>

                <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-4">
                    <div className="text-sm font-medium text-red-700 mb-1">Desconectados</div>
                    <div className="text-2xl font-bold text-red-600">{deviceData.disconnectedVehicles}</div>
                    <div className="text-xs text-red-600 mt-1">Sin transmisión &gt;24h</div>
                </div>
            </div>

            {/* Alertas de vehículos con problemas */}
            {(deviceData.partialVehicles > 0 || deviceData.disconnectedVehicles > 0) && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        ⚠️ Vehículos con Problemas de Transmisión
                    </h3>

                    <div className="space-y-3">
                        {deviceData.devices
                            .filter(device => device.connectionStatus !== 'connected')
                            .map((device) => (
                                <div
                                    key={device.vehicleId}
                                    className={`rounded-lg border p-4 cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(device.connectionStatus)}`}
                                    onClick={() => onDeviceClick?.(device)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {getStatusIcon(device.connectionStatus)}
                                            <div>
                                                <div className="font-semibold text-slate-800">
                                                    {device.vehicleName}
                                                </div>
                                                <div className="text-sm text-slate-600">
                                                    Estado: {getStatusText(device.connectionStatus)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-sm text-slate-600">
                                                Última subida: {device.lastUploadDate || 'Nunca'}
                                            </div>
                                            {device.missingFiles.length > 0 && (
                                                <div className="text-sm text-red-600 font-medium mt-1">
                                                    Faltantes: {device.missingFiles.join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Estado de archivos */}
                                    <div className="mt-3 flex gap-2">
                                        {Object.entries(device.filesStatus).map(([fileType, exists]) => (
                                            <div
                                                key={fileType}
                                                className={`px-3 py-1 rounded text-xs font-medium ${exists
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}
                                            >
                                                {fileType}: {exists ? '✓' : '✗'}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Lista completa de vehículos */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                    Estado Completo de Vehículos
                </h3>

                <div className="space-y-2">
                    {deviceData.devices.map((device) => (
                        <div
                            key={device.vehicleId}
                            className={`rounded-lg border p-3 cursor-pointer hover:shadow-sm transition-shadow ${getStatusColor(device.connectionStatus)}`}
                            onClick={() => onDeviceClick?.(device)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(device.connectionStatus)}
                                    <span className="font-medium text-slate-800">
                                        {device.vehicleName}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    {Object.entries(device.filesStatus).map(([fileType, exists]) => (
                                        <div
                                            key={fileType}
                                            className={`w-3 h-3 rounded-full ${exists ? 'bg-green-500' : 'bg-red-500'
                                                }`}
                                            title={`${fileType}: ${exists ? 'OK' : 'Faltante'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DeviceMonitoringPanel;

