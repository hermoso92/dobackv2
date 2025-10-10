import { Box, Paper, Stack, Typography, useTheme } from '@mui/material';
import React from 'react';
import { STABILITY_CONFIG, StabilityDataPoint, VariableGroup } from '../types/stability';
import { t } from "../i18n";

interface RealTimeMetricsProps {
    data: StabilityDataPoint | null;
    variableGroups: VariableGroup[];
    selectedVariables: Record<string, boolean>;
}

export const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({
    data,
    variableGroups,
    selectedVariables
}) => {
    const theme = useTheme();

    if (!data) return null;

    return (
        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>{t('metricas_en_tiempo_real')}</Typography>
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)'
                },
                gap: 2
            }}>
                {variableGroups.map(group => {
                    const hasSelectedInGroup = group.variables.some(v => selectedVariables[v.key]);
                    if (!hasSelectedInGroup) return null;

                    return (
                        <Box key={group.title}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                {group.title}
                            </Typography>
                            <Stack spacing={1}>
                                {group.variables.map(variable => {
                                    if (!selectedVariables[variable.key]) return null;
                                    const value = data[variable.key as keyof StabilityDataPoint];
                                    const threshold = STABILITY_CONFIG.thresholds[variable.key as keyof typeof STABILITY_CONFIG.thresholds];

                                    let color = 'text.primary';
                                    if (threshold && typeof value === 'number') {
                                        if (Math.abs(value) >= threshold.critical) {
                                            color = 'error.main';
                                        } else if (Math.abs(value) >= threshold.warning) {
                                            color = 'warning.main';
                                        }
                                    }

                                    return (
                                        <Box key={variable.key} sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <Typography variant="body2">{variable.label}:</Typography>
                                            <Typography
                                                variant="body2"
                                                color={color}
                                                fontWeight="medium"
                                            >
                                                {typeof value === 'number' ? value.toFixed(2) : value}
                                                {variable.unit && ` ${variable.unit}`}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>
                    );
                })}
            </Box>
        </Paper>
    );
}; 