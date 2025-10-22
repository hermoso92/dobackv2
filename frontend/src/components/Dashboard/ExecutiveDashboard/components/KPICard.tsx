import React from 'react';

export interface KPICardProps {
    title: string;
    value: string | number;
    unit?: string;
    icon: React.ReactNode;
    colorClass?: string;
    description?: string;
    subtitle?: string;
    onClick?: () => void;
}

/**
 * Tarjeta KPI reutilizable para el dashboard ejecutivo
 */
export const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    unit,
    icon,
    colorClass = 'text-slate-800',
    description,
    subtitle,
    onClick
}) => {
    const getBackgroundClass = (color: string): string => {
        if (color.includes('red')) return 'bg-red-50 text-red-600';
        if (color.includes('green')) return 'bg-green-50 text-green-600';
        if (color.includes('blue')) return 'bg-blue-50 text-blue-600';
        if (color.includes('orange')) return 'bg-orange-50 text-orange-600';
        return 'bg-slate-50 text-slate-600';
    };

    return (
        <div
            className={`bg-white p-3 rounded-lg border border-slate-200 hover:shadow-lg transition-all duration-200 ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${getBackgroundClass(colorClass)}`}>
                    {icon}
                </div>
                <div className="text-right">
                    <p className={`text-xl font-bold ${colorClass}`}>
                        {value}
                    </p>
                    {unit && <span className="text-xs text-slate-500 ml-1">{unit}</span>}
                </div>
            </div>
            <h3 className="text-xs font-semibold text-slate-700">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
            {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
        </div>
    );
};

