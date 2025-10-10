import { Card, Tag } from 'antd';
import React from 'react';
import { TelemetryEvent } from '../types/telemetry';
import { getSeverityColor } from '../utils/colors';
import { formatDate } from '../utils/format';
import { t } from "../i18n";

interface TelemetryEventsProps {
    events: TelemetryEvent[];
}

export const TelemetryEvents: React.FC<TelemetryEventsProps> = ({ events }) => {
    return (
        <div className="space-y-4">
            {events.map((event) => (
                <Card key={event.id} className="shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center space-x-2">
                                <Tag color={getSeverityColor(event.severity)}>
                                    {event.severity.toUpperCase()}
                                </Tag>
                                <span className="font-medium">{event.type}</span>
                            </div>
                            <p className="mt-2 text-gray-600">{event.message}</p>
                            <div className="mt-2 text-sm text-gray-500">
                                <p>{t('fecha')}{formatDate(event.timestamp)}</p>
                                {event.acknowledged && (
                                    <p>
                                        {t('reconocido_por')}{event.acknowledgedBy} {t('el')}{' '}
                                        {formatDate(event.acknowledgedAt!)}
                                    </p>
                                )}
                                {event.resolved && (
                                    <p>
                                        {t('resuelto_por')}{event.resolvedBy} {t('el_1')}{' '}
                                        {formatDate(event.resolvedAt!)}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium">{t('metricas')}</div>
                            <div className="mt-1 space-y-1">
                                <p>{t('velocidad_3')}{event.metrics.speed} {t('kmh_3')}</p>
                                <p>{t('inclinacion')}{event.metrics.inclination}°</p>
                                <p>{t('carga')}{event.metrics.load}%</p>
                                <p>{t('temperatura')}{event.metrics.temperature}{t('c')}</p>
                                <p>{t('altitud')}{event.metrics.altitude} {t('m_3')}</p>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}; 