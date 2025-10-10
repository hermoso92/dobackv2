import { Card, Tag } from 'antd';
import React from 'react';
import { StabilityEvent } from '../types/stability';
import { formatDate } from '../utils/format';
import { t } from "../i18n";

interface StabilityEventsProps {
    events: StabilityEvent[];
}

export const StabilityEvents: React.FC<StabilityEventsProps> = ({ events }) => {
    const getStatusColor = (event: StabilityEvent) => {
        if (event.resolved) return 'green';
        if (event.acknowledged) return 'orange';
        return 'red';
    };

    const getStatusText = (event: StabilityEvent) => {
        if (event.resolved) return 'RESOLVED';
        if (event.acknowledged) return 'ACKNOWLEDGED';
        return 'ACTIVE';
    };

    return (
        <Card title="Eventos" className="h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {events.map((event, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <Tag color={getStatusColor(event)}>
                                {getStatusText(event)}
                            </Tag>
                            <span className="text-gray-500 text-xs">
                                {formatDate(new Date(event.timestamp).toISOString())}
                            </span>
                        </div>
                        <p className="text-sm mb-1 line-clamp-2">{event.message}</p>
                        <div className="text-xs text-gray-500">
                            <p>{t('ltr_3')}{event.metrics.ltr.toFixed(2)}</p>
                            <p>{t('ssf_1')}{event.metrics.ssf.toFixed(2)}</p>
                            <p>{t('drs_1')}{event.metrics.drs.toFixed(2)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}; 