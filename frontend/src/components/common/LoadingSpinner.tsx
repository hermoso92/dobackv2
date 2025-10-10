import React from 'react';
import { t } from "../../i18n";

export const LoadingSpinner: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">{t('cargando_4')}</p>
        </div>
    );
}; 