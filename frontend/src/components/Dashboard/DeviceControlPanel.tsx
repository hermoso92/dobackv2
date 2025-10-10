import {
    CheckCircleIcon,
    DevicePhoneMobileIcon as DeviceIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon as RefreshIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { DeviceControlData, DeviceFileStatus } from '../../types/deviceControl';
import { logger } from '../../utils/logger';
import DeviceStatusCard from './DeviceStatusCard';

interface DeviceControlPanelProps {
    className?: string;
}

const DeviceControlPanel: React.FC<DeviceControlPanelProps> = ({ className = '' }) => {
    const [deviceData, setDeviceData] = useState<DeviceControlData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    // Cargar datos de dispositivos
    const loadDeviceData = async () => {
        try {
            setLoading(true);
            setError(null);

            logger.info('Cargando datos de dispositivos desde backend');

            const response = await apiService.get<{ success: boolean; data: DeviceControlData }>('/api/devices/status');

            if (response.success && response.data) {
                setDeviceData(response.data);
                setLastRefresh(new Date());
                logger.info('Datos de dispositivos cargados exitosamente', {
                    total: response.data.totalVehicles,
                    connected: response.data.connectedVehicles,
                    partial: response.data.partialVehicles,
                    disconnected: response.data.disconnectedVehicles
                });
            } else {
                throw new Error('Respuesta inválida del servidor');
            }
        } catch (err) {
            logger.error('Error cargando datos de dispositivos:', err);
            setError('Error al cargar el estado de los dispositivos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDeviceData();
    }, []);

    const handleRefresh = () => {
        loadDeviceData();
    };

    const handleDeviceClick = (device: DeviceFileStatus) => {
        logger.info('Dispositivo seleccionado:', device);
        // Aquí se podría abrir un modal con detalles o navegar a la página del vehículo
    };

    if (loading) {
        return (
            <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
                <div className="flex items-center gap-2 text-red-600">
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
        <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <DeviceIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">Control de Dispositivos</h3>
                        <p className="text-sm text-slate-500">
                            Última actualización: {lastRefresh.toLocaleTimeString()}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Actualizar"
                >
                    <RefreshIcon className="h-5 w-5 text-slate-600" />
                </button>
            </div>

            {/* Resumen de estado */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                    <CheckCircleIcon className="h-8 w-8 text-green-500 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-green-600">{deviceData.connectedVehicles || 0}</div>
                    <div className="text-sm text-green-700">Conectados</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-yellow-600">{deviceData.partialVehicles || 0}</div>
                    <div className="text-sm text-yellow-700">Parciales</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                    <XCircleIcon className="h-8 w-8 text-red-500 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-red-600">{deviceData.disconnectedVehicles || 0}</div>
                    <div className="text-sm text-red-700">Desconectados</div>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <DeviceIcon className="h-8 w-8 text-slate-500 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-slate-600">{deviceData.totalVehicles || 0}</div>
                    <div className="text-sm text-slate-700">Total</div>
                </div>
            </div>

            {/* Lista de dispositivos */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Estado por Vehículo</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(deviceData.devices || []).map((device) => (
                        <DeviceStatusCard
                            key={device.vehicleId}
                            device={device}
                            onClick={() => handleDeviceClick(device)}
                        />
                    ))}
                </div>
            </div>

            {/* Alertas importantes */}
            {(deviceData.disconnectedVehicles || 0) > 0 && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                        <ExclamationTriangleIcon className="h-5 w-5" />
                        <span className="font-medium">Atención:</span>
                        <span>{deviceData.disconnectedVehicles || 0} vehículo(s) desconectado(s) por más de 24 horas</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeviceControlPanel;
