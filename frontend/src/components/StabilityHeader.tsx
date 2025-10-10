import React from 'react';
import { StabilityExport } from './StabilityExport';
import { t } from "../i18n";

interface StabilityHeaderProps {
    sessionId: string;
}

export const StabilityHeader: React.FC<StabilityHeaderProps> = ({ sessionId }) => {
    return (
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{t('sesion_de_estabilidad')}</h1>
            <StabilityExport sessionId={sessionId} />
        </div>
    );
}; 