import { Warning } from '@mui/icons-material';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addAlert } from '../store/slices/alertSlice';
import { TelemetryData } from '../types/stability';
import { t } from "../i18n";

interface TelemetryMonitorProps {
    vehicleId: string;
}

interface Alert {
    id: number;
    vehicleId: string;
    type: string;
    message: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    timestamp: string;
}

const ALARM_THRESHOLDS = {
    speed: {
        warning: 80,
        critical: 100
    },
    roll_angle: {
        warning: 15,
        critical: 25
    },
    pitch_angle: {
        warning: 15,
        critical: 25
    },
    lateral_acc: {
        warning: 0.3,
        critical: 0.5
    }
};

export const TelemetryMonitor: React.FC<TelemetryMonitorProps> = ({ vehicleId }) => {
    const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
    const dispatch = useDispatch();

    const checkThresholds = (data: TelemetryData) => {
        const newAlerts: Alert[] = [];

        if (data.speed > ALARM_THRESHOLDS.speed.critical) {
            newAlerts.push(createAlert('SPEED', 'critical', data.speed));
        } else if (data.speed > ALARM_THRESHOLDS.speed.warning) {
            newAlerts.push(createAlert('SPEED', 'warning', data.speed));
        }

        if (Math.abs(data.roll_angle) > ALARM_THRESHOLDS.roll_angle.critical) {
            newAlerts.push(createAlert('ROLL_ANGLE', 'critical', data.roll_angle));
        } else if (Math.abs(data.roll_angle) > ALARM_THRESHOLDS.roll_angle.warning) {
            newAlerts.push(createAlert('ROLL_ANGLE', 'warning', data.roll_angle));
        }

        if (Math.abs(data.pitch_angle) > ALARM_THRESHOLDS.pitch_angle.critical) {
            newAlerts.push(createAlert('PITCH_ANGLE', 'critical', data.pitch_angle));
        } else if (Math.abs(data.pitch_angle) > ALARM_THRESHOLDS.pitch_angle.warning) {
            newAlerts.push(createAlert('PITCH_ANGLE', 'warning', data.pitch_angle));
        }

        if (Math.abs(data.lateral_acc) > ALARM_THRESHOLDS.lateral_acc.critical) {
            newAlerts.push(createAlert('LATERAL_ACC', 'critical', data.lateral_acc));
        } else if (Math.abs(data.lateral_acc) > ALARM_THRESHOLDS.lateral_acc.warning) {
            newAlerts.push(createAlert('LATERAL_ACC', 'warning', data.lateral_acc));
        }

        setActiveAlerts(newAlerts);
        newAlerts.forEach(alert => {
            dispatch(addAlert({
                id: alert.id.toString(),
                type: alert.type === 'critical' ? 'error' : 'warning',
                message: alert.message,
                timestamp: alert.timestamp
            }));
        });
    };

    const createAlert = (type: string, level: string, value: number): Alert => {
        const timestamp = new Date().toISOString();
        return {
            id: Date.now(),
            vehicleId,
            type: 'telemetry',
            message: `${type} Alert: Value ${value.toFixed(2)} exceeds threshold`,
            status: 'active',
            createdAt: timestamp,
            updatedAt: timestamp,
            timestamp
        };
    };

    return (
        <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                {t('active_alerts')}</Typography>
                            {activeAlerts.map((alert) => (
                                <Box
                                    key={alert.id}
                                    sx={{
                                        p: 1,
                                        mb: 1,
                                        borderRadius: 1,
                                        bgcolor: alert.type === 'critical' ? 'error.light' : 'warning.light',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <Warning sx={{ mr: 1 }} />
                                    <Typography variant="body2">{alert.message}</Typography>
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}; 