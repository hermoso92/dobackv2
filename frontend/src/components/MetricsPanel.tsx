import { Box, Grid as MuiGrid, Paper, Typography } from '@mui/material';
import React from 'react';
import { t } from "../i18n";

interface MetricsPanelProps {
    metrics: {
        si: number;
        roll: number;
        lateralAcceleration: number;
        speed: number;
        criticalEvents: number;
        warningEvents: number;
    };
}

const Grid = MuiGrid as any; // Temporal fix para los errores de tipo

const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
    const getStabilityColor = (si: number) => {
        if (si < 30) return 'error.main';
        if (si < 60) return 'warning.main';
        return 'success.main';
    };

    return (
        <Box>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            textAlign: 'center',
                            borderLeft: 4,
                            borderColor: getStabilityColor(metrics.si)
                        }}
                    >
                        <Typography variant="h4" color={getStabilityColor(metrics.si)}>
                            {metrics.si.toFixed(1)}%
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                            {t('indice_de_estabilidad')}</Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            textAlign: 'center',
                            borderLeft: 4,
                            borderColor: metrics.roll > 10 ? 'error.main' : 'success.main'
                        }}
                    >
                        <Typography
                            variant="h4"
                            color={metrics.roll > 10 ? 'error.main' : 'success.main'}
                        >
                            {metrics.roll.toFixed(1)}°
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                            {t('angulo_de_balanceo')}</Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            textAlign: 'center',
                            borderLeft: 4,
                            borderColor: metrics.lateralAcceleration > 4 ? 'error.main' : 'success.main'
                        }}
                    >
                        <Typography
                            variant="h4"
                            color={metrics.lateralAcceleration > 4 ? 'error.main' : 'success.main'}
                        >
                            {metrics.lateralAcceleration.toFixed(2)} {t('ms')}</Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                            {t('aceleracion_lateral_2')}</Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <Paper
                        elevation={0}
                        sx={{ p: 2, textAlign: 'center' }}
                    >
                        <Typography variant="h4">
                            {metrics.speed.toFixed(1)} {t('kmh_2')}</Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                            {t('velocidad_2')}</Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            textAlign: 'center',
                            borderLeft: 4,
                            borderColor: metrics.criticalEvents > 0 ? 'error.main' : 'success.main'
                        }}
                    >
                        <Typography
                            variant="h4"
                            color={metrics.criticalEvents > 0 ? 'error.main' : 'success.main'}
                        >
                            {metrics.criticalEvents}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                            {t('eventos_criticos_1')}</Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            textAlign: 'center',
                            borderLeft: 4,
                            borderColor: metrics.warningEvents > 0 ? 'warning.main' : 'success.main'
                        }}
                    >
                        <Typography
                            variant="h4"
                            color={metrics.warningEvents > 0 ? 'warning.main' : 'success.main'}
                        >
                            {metrics.warningEvents}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                            {t('eventos_de_advertencia')}</Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default MetricsPanel; 