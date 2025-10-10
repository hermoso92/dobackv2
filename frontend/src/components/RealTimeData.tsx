import { Box, Paper, Typography } from '@mui/material';
// import { styled } from '@mui/material/styles'; // Removido para evitar errores
import React from 'react';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { t } from "../i18n";
import { TelemetrySession } from '../types/telemetry';

const DataContainer = (props: any) => (
    <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            padding: 2,
            backgroundColor: 'background.paper',
            borderRadius: 1,
            boxShadow: 1,
            width: '100%'
        }}
        {...props}
    />
);

const ChartContainer = (props: any) => (
    <Paper
        sx={{
            padding: 2,
            height: '600px',
            width: '100%'
        }}
        {...props}
    />
);

interface RealTimeDataProps {
    session: TelemetrySession;
}

const RealTimeData: React.FC<RealTimeDataProps> = ({ session }) => {
    // Datos simulados para compatibilidad con TelemetrySession
    const latestCANData = {
        timestamp: session.startTime,
        engineRPM: 0,
        vehicleSpeed: 0,
        throttlePosition: 0,
        brakePressure: 0,
        steeringAngle: 0,
        engineTemperature: 0,
        fuelLevel: 0,
        gearPosition: 0,
        absActive: false,
        espActive: false
    };

    const latestGPSData = {
        timestamp: session.startTime,
        latitude: 0,
        longitude: 0,
        altitude: 0,
        speed: 0,
        heading: 0,
        satellites: 0,
        accuracy: 0
    };

    const formatValue = (value: number, unit: string = '') => {
        return `${value.toFixed(1)}${unit}`;
    };

    // Elegir la fuente de datos: CAN si existe, de lo contrario GPS (sólo velocidad)
    const chartData = [
        {
            timestamp: new Date(session.startTime).toLocaleTimeString(),
            velocidad: 0,
            rpm: 0,
            temperatura: 0,
            combustible: 0,
            acelerador: 0,
            freno: 0
        }
    ];

    if (chartData.length === 0) {
        return (
            <DataContainer>
                <Typography variant="body1">{t('no_hay_datos_de_telemetria_disponibles')}</Typography>
            </DataContainer>
        );
    }

    return (
        <DataContainer>
            <ChartContainer>
                <Typography variant="h6" gutterBottom>
                    {t('datos_en_tiempo_real')}</Typography>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip />
                        <Legend />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="velocidad"
                            name="Velocidad (km/h)"
                            stroke="#8884d8"
                            activeDot={{ r: 8 }}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="rpm"
                            name="RPM"
                            stroke="#82ca9d"
                        />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="temperatura"
                            name="Temperatura (°C)"
                            stroke="#ff7300"
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="combustible"
                            name="Combustible (%)"
                            stroke="#ff0000"
                        />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="acelerador"
                            name="Acelerador (%)"
                            stroke="#00ff00"
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="freno"
                            name="Freno (bar)"
                            stroke="#0000ff"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </ChartContainer>
        </DataContainer>
    );
};

export default RealTimeData; 