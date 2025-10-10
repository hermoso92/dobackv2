import {
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    TruckIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import React from 'react';
import { DeviceFileStatus } from '../../types/deviceControl';

interface DeviceStatusCardProps {
    device: DeviceFileStatus;
    onClick?: () => void;
}

const DeviceStatusCard: React.FC<DeviceStatusCardProps> = ({ device, onClick }) => {
    const getStatusIcon = () => {
        switch (device.connectionStatus) {
            case 'connected':
                return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
            case 'partial':
                return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
            case 'disconnected':
                return <XCircleIcon className="h-5 w-5 text-red-500" />;
            default:
                return <ClockIcon className="h-5 w-5 text-gray-500" />;
        }
    };

    const getStatusColor = () => {
        switch (device.connectionStatus) {
            case 'connected':
                return 'border-l-green-500 bg-green-50';
            case 'partial':
                return 'border-l-yellow-500 bg-yellow-50';
            case 'disconnected':
                return 'border-l-red-500 bg-red-50';
            default:
                return 'border-l-gray-500 bg-gray-50';
        }
    };

    const getFileStatusIcon = (hasFile: boolean) => {
        return hasFile ? (
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
        ) : (
            <XCircleIcon className="h-4 w-4 text-red-500" />
        );
    };

    const formatLastUpload = (date: string | null) => {
        if (!date) return 'Nunca';
        const uploadDate = new Date(date);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60));

        if (diffHours < 1) return 'Hace menos de 1h';
        if (diffHours < 24) return `Hace ${diffHours}h`;
        const diffDays = Math.floor(diffHours / 24);
        return `Hace ${diffDays}d`;
    };

    return (
        <div
            className={`p-4 rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} border-l-4 ${getStatusColor()}`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <TruckIcon className="h-5 w-5 text-slate-600" />
                    <h3 className="font-semibold text-slate-800">{device.vehicleName}</h3>
                </div>
                {getStatusIcon()}
            </div>

            <div className="space-y-2">
                <div className="text-sm text-slate-600">
                    <span className="font-medium">Última subida:</span> {formatLastUpload(device.lastUploadDate)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                        {getFileStatusIcon(device.filesStatus.estabilidad)}
                        <span className="text-slate-600">Estabilidad</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {getFileStatusIcon(device.filesStatus.can)}
                        <span className="text-slate-600">CAN</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {getFileStatusIcon(device.filesStatus.gps)}
                        <span className="text-slate-600">GPS</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {getFileStatusIcon(device.filesStatus.rotativo)}
                        <span className="text-slate-600">Rotativo</span>
                    </div>
                </div>

                {device.missingFiles.length > 0 && (
                    <div className="mt-2 p-2 bg-red-100 rounded-lg">
                        <p className="text-xs text-red-700 font-medium">Archivos faltantes:</p>
                        <p className="text-xs text-red-600">{device.missingFiles.join(', ')}</p>
                    </div>
                )}

                {device.isDisconnected && (
                    <div className="mt-2 p-2 bg-red-100 rounded-lg">
                        <p className="text-xs text-red-700 font-medium">
                            ⚠️ Dispositivo desconectado (&gt;24h sin archivos)
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeviceStatusCard;
