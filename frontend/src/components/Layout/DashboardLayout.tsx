import React from 'react';
import { t } from "../../i18n";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-100">
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">{t('dashboard_5')}</h1>
                </div>
                {children}
            </div>
        </div>
    );
}; 