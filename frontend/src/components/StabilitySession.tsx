import { DownloadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Spin, Statistic, Tag } from 'antd';
import axios from 'axios';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Brush, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useStabilityExport } from '../hooks/useStabilityExport';
import { useStabilitySession } from '../hooks/useStabilitySession';
import { t } from "../i18n";
import { StabilityEvent } from '../types/stability';
import { getMetricColor } from '../utils/colors';
import { formatDate } from '../utils/format';

interface StabilityMeasurement {
    timestamp: number;
    ltr: number;
    ssf: number;
    drs: number;
    roll: number;
    pitch: number;
    yaw: number;
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;
    gz: number;
    accmag: number;
    si: number;
}

interface StabilitySessionProps {
    events: StabilityEvent[];
}

export const StabilitySession: React.FC<StabilitySessionProps> = ({ events }) => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const { data: sessionData, isLoading, error } = useStabilitySession(sessionId!);
    const { mutate: exportReport, isPending: isExporting } = useStabilityExport();
    const [zoomDomain, setZoomDomain] = useState<[number, number] | undefined>(undefined);
    const { isAdmin } = useAuth();
    const [regenLoading, setRegenLoading] = useState(false);
    const [regenFeedback, setRegenFeedback] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spin size="large" />
            </div>
        );
    }

    if (error || !sessionData) {
        return (
            <Card className="max-w-4xl mx-auto">
                <div className="text-center text-red-500">
                    {t('error_al_cargar_los_datos_de_la_sesion')}</div>
            </Card>
        );
    }

    const { measurements } = sessionData.data;

    const handleExport = () => {
        exportReport({ sessionId: sessionId! }, {
            onSuccess: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `stability-report-${sessionId}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            },
        });
    };

    const formatTooltipValue = (value: number) => {
        if (value === null || value === undefined || isNaN(value)) return 'N/A';
        return value.toFixed(2);
    };

    const handleBrushChange = (newDomain: any) => {
        if (newDomain && newDomain.startIndex !== undefined && newDomain.endIndex !== undefined) {
            const start = measurements[newDomain.startIndex].timestamp;
            const end = measurements[newDomain.endIndex].timestamp;
            setZoomDomain([start, end]);
        }
    };

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

    const handleRegenerarEventos = async () => {
        setRegenLoading(true);
        setRegenFeedback(null);
        try {
            const res = await axios.post(`/api/stability/session/${sessionId}/regenerate-events`);
            setRegenFeedback(`Eventos regenerados: ${res.data.eventsCount}`);
        } catch (err: any) {
            setRegenFeedback(err.response?.data?.error || 'Error al regenerar eventos');
        } finally {
            setRegenLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">{t('sesion_de_estabilidad_1')}</h1>
                <div className="flex gap-2">
                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={handleExport}
                        loading={isExporting}
                    >
                        {t('exportar_informe_1')}</Button>
                    {isAdmin() && (
                        <Button
                            type="default"
                            danger
                            loading={regenLoading}
                            onClick={handleRegenerarEventos}
                        >
                            {regenLoading ? 'Regenerando...' : 'Regenerar eventos'}
                        </Button>
                    )}
                </div>
            </div>
            {regenFeedback && (
                <div className="mb-2 text-center text-blue-600">{regenFeedback}</div>
            )}

            <Row gutter={[8, 8]} className="mb-4">
                <Col span={6}>
                    <Card size="small">
                        <Statistic
                            title="LTR"
                            value={measurements[measurements.length - 1]?.ltr || 0}
                            precision={3}
                            valueStyle={{ color: getMetricColor('ltr', measurements[measurements.length - 1]?.ltr || 0) }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card size="small">
                        <Statistic
                            title="SSF"
                            value={measurements[measurements.length - 1]?.ssf || 0}
                            precision={3}
                            valueStyle={{ color: getMetricColor('ssf', measurements[measurements.length - 1]?.ssf || 0) }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card size="small">
                        <Statistic
                            title="DRS"
                            value={measurements[measurements.length - 1]?.drs || 0}
                            precision={3}
                            valueStyle={{ color: getMetricColor('drs', measurements[measurements.length - 1]?.drs || 0) }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card size="small">
                        <Statistic
                            title="RSC"
                            value={measurements[measurements.length - 1]?.si || 0}
                            precision={3}
                            valueStyle={{ color: getMetricColor('rsc', measurements[measurements.length - 1]?.si || 0) }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[8, 8]}>
                <Col span={16}>
                    <Card title="Métricas de Estabilidad" size="small" className="mb-4">
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <LineChart
                                    data={measurements}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="timestamp"
                                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                                        domain={zoomDomain}
                                        allowDataOverflow={true}
                                    />
                                    <YAxis />
                                    <Tooltip
                                        labelFormatter={(value) => new Date(value).toLocaleString()}
                                        formatter={(value: number) => formatTooltipValue(value)}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="ltr"
                                        stroke="#8884d8"
                                        name="LTR"
                                        dot={false}
                                        isAnimationActive={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="ssf"
                                        stroke="#82ca9d"
                                        name="SSF"
                                        dot={false}
                                        isAnimationActive={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="drs"
                                        stroke="#ffc658"
                                        name="DRS"
                                        dot={false}
                                        isAnimationActive={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="roll"
                                        stroke="#ff7300"
                                        name="Roll"
                                        dot={false}
                                        isAnimationActive={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="pitch"
                                        stroke="#00C49F"
                                        name="Pitch"
                                        dot={false}
                                        isAnimationActive={false}
                                    />
                                    <Brush
                                        dataKey="timestamp"
                                        height={30}
                                        stroke="#8884d8"
                                        onChange={handleBrushChange}
                                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
                <Col span={8}>
                    <Card title="Eventos" size="small" className="h-full">
                        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
                            {events.map((event: StabilityEvent, index: number) => (
                                <div key={index} className="bg-gray-50 rounded p-2 hover:bg-gray-100 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <Tag color={getStatusColor(event)}>
                                            {getStatusText(event)}
                                        </Tag>
                                        <span className="text-gray-500 text-xs">
                                            {formatDate(new Date(event.timestamp).toISOString())}
                                        </span>
                                    </div>
                                    <p className="text-sm mb-1 line-clamp-2">{event.message}</p>
                                    <div className="text-xs text-gray-500">
                                        <p>{t('ltr_4')}{event.metrics.ltr.toFixed(2)}</p>
                                        <p>{t('ssf_2')}{event.metrics.ssf.toFixed(2)}</p>
                                        <p>{t('drs_2')}{event.metrics.drs.toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}; 