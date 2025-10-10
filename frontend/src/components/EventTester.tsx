import { Alert, Button, Card, List, Space, Typography } from 'antd';
import React, { useState } from 'react';
import { runAllTests, testEventCreation, testEventStatuses, testEventTypes, testVehicleIdFormats } from '../utils/eventTester';
import { logger } from '../utils/logger';
import { t } from "../i18n";

const { Title, Text } = Typography;

export const EventTester: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const addLog = (message: string) => {
        setLogs(prev => [...prev, `${new Date().toISOString()} - ${message}`]);
    };

    const runTest = async (testFn: () => Promise<void>, testName: string) => {
        try {
            setIsRunning(true);
            addLog(`Iniciando prueba: ${testName}`);

            // Interceptar los logs
            const originalInfo = logger.info;
            const originalError = logger.error;

            logger.info = (message: string, data?: any) => {
                originalInfo.call(logger, message, data);
                addLog(`INFO: ${message} ${data ? JSON.stringify(data) : ''}`);
            };

            logger.error = (message: string, data?: any) => {
                originalError.call(logger, message, data);
                addLog(`ERROR: ${message} ${data ? JSON.stringify(data) : ''}`);
            };

            await testFn();

            // Restaurar los logs originales
            logger.info = originalInfo;
            logger.error = originalError;

            addLog(`Prueba completada: ${testName}`);
        } catch (error) {
            addLog(`Error en prueba ${testName}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <Card title="Event Tester" style={{ margin: '20px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
                <Title level={4}>{t('pruebas_de_eventos')}</Title>

                <Space>
                    <Button
                        type="primary"
                        onClick={() => runTest(runAllTests, 'Todas las pruebas')}
                        loading={isRunning}
                    >
                        {t('ejecutar_todas_las_pruebas')}</Button>

                    <Button
                        onClick={() => runTest(testEventCreation, 'Creación de Eventos')}
                        loading={isRunning}
                    >
                        {t('probar_creacion')}</Button>

                    <Button
                        onClick={() => runTest(testVehicleIdFormats, 'Formatos de VehicleId')}
                        loading={isRunning}
                    >
                        {t('probar_vehicleids')}</Button>

                    <Button
                        onClick={() => runTest(testEventTypes, 'Tipos de Eventos')}
                        loading={isRunning}
                    >
                        {t('probar_tipos')}</Button>

                    <Button
                        onClick={() => runTest(testEventStatuses, 'Estados')}
                        loading={isRunning}
                    >
                        {t('probar_estados')}</Button>
                </Space>

                <Alert
                    message="Logs de Pruebas"
                    description={
                        <List
                            size="small"
                            bordered
                            dataSource={logs}
                            renderItem={item => (
                                <List.Item>
                                    <Text code>{item}</Text>
                                </List.Item>
                            )}
                            style={{ maxHeight: '400px', overflow: 'auto' }}
                        />
                    }
                    type="info"
                    showIcon
                />
            </Space>
        </Card>
    );
}; 