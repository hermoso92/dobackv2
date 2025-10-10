import {
    OpenInNew,
    TrendingDown,
    TrendingFlat,
    TrendingUp
} from '@mui/icons-material';
import {
    Box,
    Card,
    CardContent,
    Chip,
    IconButton,
    LinearProgress,
    Tooltip,
    Typography
} from '@mui/material';
import React from 'react';
import { DrillDownParams } from '../../types/panel';

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: {
        value: number;
        direction: 'up' | 'down' | 'stable';
        period: string;
    };
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
    icon?: React.ReactNode;
    loading?: boolean;
    drillDown?: DrillDownParams;
    onDrillDown?: (params: DrillDownParams) => void;
    progress?: number;
    maxValue?: number;
}

export const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    subtitle,
    trend,
    color = 'primary',
    icon,
    loading = false,
    drillDown,
    onDrillDown,
    progress,
    maxValue
}) => {
    const getTrendIcon = () => {
        if (!trend) return null;

        switch (trend.direction) {
            case 'up':
                return <TrendingUp color="success" fontSize="small" />;
            case 'down':
                return <TrendingDown color="error" fontSize="small" />;
            case 'stable':
                return <TrendingFlat color="info" fontSize="small" />;
            default:
                return null;
        }
    };

    const getTrendColor = () => {
        if (!trend) return 'default';

        switch (trend.direction) {
            case 'up':
                return 'success';
            case 'down':
                return 'error';
            case 'stable':
                return 'info';
            default:
                return 'default';
        }
    };

    const getColorClass = () => {
        switch (color) {
            case 'primary':
                return 'text-blue-600';
            case 'secondary':
                return 'text-purple-600';
            case 'success':
                return 'text-green-600';
            case 'warning':
                return 'text-orange-600';
            case 'error':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    const handleDrillDown = () => {
        if (drillDown && onDrillDown) {
            onDrillDown(drillDown);
        }
    };

    return (
        <Card
            className="h-full hover:shadow-lg transition-shadow duration-200"
            sx={{
                cursor: drillDown ? 'pointer' : 'default',
                '&:hover': drillDown ? {
                    transform: 'translateY(-2px)',
                    transition: 'transform 0.2s ease-in-out'
                } : {}
            }}
            onClick={handleDrillDown}
        >
            <CardContent className="p-4">
                <Box className="flex items-center justify-between mb-2">
                    <Typography
                        variant="h6"
                        className="text-sm font-medium text-gray-600"
                    >
                        {title}
                    </Typography>
                    {icon && (
                        <Box className={`${getColorClass()}`}>
                            {icon}
                        </Box>
                    )}
                </Box>

                {loading ? (
                    <Box className="space-y-2">
                        <LinearProgress />
                        <Typography variant="body2" className="text-gray-400">
                            Cargando...
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <Typography
                            variant="h4"
                            className={`font-bold ${getColorClass()} mb-1`}
                        >
                            {typeof value === 'number' ? value.toLocaleString() : value}
                        </Typography>

                        {subtitle && (
                            <Typography
                                variant="body2"
                                className="text-gray-500 mb-2"
                            >
                                {subtitle}
                            </Typography>
                        )}

                        {progress !== undefined && maxValue && (
                            <Box className="mb-2">
                                <LinearProgress
                                    variant="determinate"
                                    value={(progress / maxValue) * 100}
                                    className="mb-1"
                                />
                                <Typography variant="caption" className="text-gray-500">
                                    {progress} / {maxValue.toLocaleString()}
                                </Typography>
                            </Box>
                        )}

                        {trend && (
                            <Box className="flex items-center gap-2">
                                {getTrendIcon()}
                                <Chip
                                    label={`${trend.value > 0 ? '+' : ''}${trend.value}% ${trend.period}`}
                                    size="small"
                                    color={getTrendColor() as any}
                                    variant="outlined"
                                />
                            </Box>
                        )}

                        {drillDown && (
                            <Box className="flex justify-end mt-2">
                                <Tooltip title="Ver detalles">
                                    <IconButton size="small" color="primary">
                                        <OpenInNew fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};
