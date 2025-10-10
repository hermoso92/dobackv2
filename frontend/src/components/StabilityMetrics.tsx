import { Card, Col, Row, Statistic } from 'antd';
import React from 'react';
import { StabilityMetrics as StabilityMetricsType } from '../types/stability';
import { getMetricColor } from '../utils/colors';
interface StabilityMetricsProps {
    metrics: StabilityMetricsType;
}

export const StabilityMetrics: React.FC<StabilityMetricsProps> = ({ metrics }) => {
    return (
        <Row gutter={[16, 16]} className="mb-6">
            <Col span={6}>
                <Card>
                    <Statistic
                        title="LTR"
                        value={metrics.lateralAcceleration?.avg || 0}
                        precision={3}
                        valueStyle={{ color: getMetricColor('ltr', metrics.lateralAcceleration?.avg || 0) }}
                    />
                </Card>
            </Col>
            <Col span={6}>
                <Card>
                    <Statistic
                        title="SSF"
                        value={metrics.longitudinalAcceleration?.avg || 0}
                        precision={3}
                        valueStyle={{ color: getMetricColor('ssf', metrics.longitudinalAcceleration?.avg || 0) }}
                    />
                </Card>
            </Col>
            <Col span={6}>
                <Card>
                    <Statistic
                        title="DRS"
                        value={metrics.verticalAcceleration?.avg || 0}
                        precision={3}
                        valueStyle={{ color: getMetricColor('drs', metrics.verticalAcceleration?.avg || 0) }}
                    />
                </Card>
            </Col>
            <Col span={6}>
                <Card>
                    <Statistic
                        title="RSC"
                        value={metrics.stabilityIndex || 0}
                        precision={3}
                        valueStyle={{ color: getMetricColor('rsc', metrics.stabilityIndex || 0) }}
                    />
                </Card>
            </Col>
        </Row>
    );
}; 