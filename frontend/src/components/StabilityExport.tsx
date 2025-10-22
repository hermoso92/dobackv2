import { DownloadOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React from 'react';
import { useStabilityExport } from '../hooks/useStabilityExport';
import { t } from "../i18n";
import { logger } from '../utils/logger';

interface StabilityExportProps {
    sessionId: string;
    filters?: {
        speedFilter?: 'all' | '40' | '60' | '80' | '100' | '120' | '140';
        rpmFilter?: 'all' | '1500' | '2000' | '2500';
        rotativoOnly?: boolean;
        selectedTypes?: string[];
    };
}

export const StabilityExport: React.FC<StabilityExportProps> = ({ sessionId, filters }) => {
    const { mutate: exportReport, isPending } = useStabilityExport();

    const handleExport = () => {
        exportReport({ sessionId, filters }, {
            onSuccess: (blob) => {
                logger.info('PDF descargado:', blob.size, 'bytes');
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `stability-report-${sessionId}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            },
            onError: (error) => {
                logger.error('Error al exportar:', error);
                // Aquí podrías mostrar un mensaje de error al usuario
            },
        });
    };

    return (
        <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={isPending}
        >
            {t('exportar_informe')}</Button>
    );
}; 