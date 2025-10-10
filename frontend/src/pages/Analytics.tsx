import { Line } from '@ant-design/plots';
import { Card, Col, Row } from 'antd';
import React from 'react';
import { t } from "../i18n";

const Analytics: React.FC = () => {
    // Datos de ejemplo para el gráfico
    const data = [
        { date: '2024-03-01', value: 0.3, type: 'LTR' },
        { date: '2024-03-02', value: 0.4, type: 'LTR' },
        { date: '2024-03-03', value: 0.35, type: 'LTR' },
        { date: '2024-03-04', value: 0.45, type: 'LTR' },
        { date: '2024-03-05', value: 0.5, type: 'LTR' },
        { date: '2024-03-01', value: 0.8, type: 'SSF' },
        { date: '2024-03-02', value: 0.85, type: 'SSF' },
        { date: '2024-03-03', value: 0.82, type: 'SSF' },
        { date: '2024-03-04', value: 0.78, type: 'SSF' },
        { date: '2024-03-05', value: 0.75, type: 'SSF' },
    ];

    const config = {
        data,
        xField: 'date',
        yField: 'value',
        seriesField: 'type',
        yAxis: {
            title: {
                text: 'Valor',
            },
        },
        xAxis: {
            title: {
                text: 'Fecha',
            },
        },
        legend: {
            position: 'top',
        },
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">{t('analisis_de_estabilidad_1')}</h1>

            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Card title="Métricas de Estabilidad">
                        <Line {...config} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} className="mt-6">
                <Col xs={24} md={8}>
                    <Card title="Load Transfer Ratio (LTR)">
                        <div className="text-center">
                            <h3 className="text-3xl font-bold text-blue-600">0.45</h3>
                            <p className="text-gray-500">{t('promedio_ultimos_7_dias')}</p>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card title="Static Stability Factor (SSF)">
                        <div className="text-center">
                            <h3 className="text-3xl font-bold text-green-600">0.78</h3>
                            <p className="text-gray-500">{t('promedio_ultimos_7_dias_1')}</p>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card title="Dynamic Rollover Stability (DRS)">
                        <div className="text-center">
                            <h3 className="text-3xl font-bold text-purple-600">0.92</h3>
                            <p className="text-gray-500">{t('promedio_ultimos_7_dias_2')}</p>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Analytics; 