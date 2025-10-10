import { Card, Col, Row, Statistic } from 'antd';
import React from 'react';
import { TelemetryMetrics as TelemetryMetricsType } from '../types/telemetry';
import { getMetricColor } from '../utils/colors';
interface TelemetryMetricsProps {
    metrics: TelemetryMetricsType;
}

export const TelemetryMetrics: React.FC<TelemetryMetricsProps> = ({ metrics }) => {
    return (
        <Row gutter={[16, 16]} className="mb-6">
            <Col span={6}>
                <Card>
                    <Statistic
                        title="Velocidad"
                        value={metrics.speed}
                        precision={1}
                        suffix="km/h"
                        valueStyle={{ color: getMetricColor('speed', metrics.speed) }}
                    />
                </Card>
            </Col>
            <Col span={6}>
                <Card>
                    <Statistic
                        title="Inclinación"
                        value={metrics.inclination}
                        precision={1}
                        suffix="°"
                        valueStyle={{ color: getMetricColor('inclination', metrics.inclination) }}
                    />
                </Card>
            </Col>
            <Col span={6}>
                <Card>
                    <Statistic
                        title="Carga"
                        value={metrics.load}
                        precision={1}
                        suffix="%"
                        valueStyle={{ color: getMetricColor('load', metrics.load) }}
                    />
                </Card>
            </Col>
            <Col span={6}>
                <Card>
                    <Statistic
                        title="Temperatura"
                        value={metrics.temperature}
                        precision={1}
                        suffix="°C"
                        valueStyle={{ color: getMetricColor('temperature', metrics.temperature) }}
                    />
                </Card>
            </Col>
            <Col span={6}>
                <Card>
                    <Statistic
                        title="Altitud"
                        value={metrics.altitude}
                        precision={1}
                        suffix="m"
                        valueStyle={{ color: getMetricColor('altitude', metrics.altitude) }}
                    />
                </Card>
            </Col>
        </Row>
    );
}; 