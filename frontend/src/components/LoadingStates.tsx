import { Box, CircularProgress, Skeleton, Typography } from '@mui/material';
import React from 'react';

interface LoadingSpinnerProps {
    size?: number;
    message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 40,
    message = 'Cargando...'
}) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4
            }}
        >
            <CircularProgress size={size} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {message}
            </Typography>
        </Box>
    );
};

interface SkeletonGridProps {
    items: number;
    columns?: number;
    height?: number;
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({
    items,
    columns = 3,
    height = 120
}) => {
    const rows = Math.ceil(items / columns);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <Box
                    key={rowIndex}
                    sx={{
                        display: 'flex',
                        gap: 2,
                        flexWrap: 'wrap'
                    }}
                >
                    {Array.from({ length: columns }).map((_, colIndex) => {
                        const itemIndex = rowIndex * columns + colIndex;
                        if (itemIndex >= items) return null;

                        return (
                            <Skeleton
                                key={itemIndex}
                                variant="rectangular"
                                width="100%"
                                height={height}
                                sx={{
                                    flex: `1 1 ${Math.floor(100 / columns)}%`,
                                    minWidth: 200,
                                    borderRadius: 1
                                }}
                            />
                        );
                    })}
                </Box>
            ))}
        </Box>
    );
};

interface SkeletonTableProps {
    rows: number;
    columns: number;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({ rows, columns }) => {
    return (
        <Box sx={{ width: '100%' }}>
            {/* Header skeleton */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                {Array.from({ length: columns }).map((_, index) => (
                    <Skeleton
                        key={`header-${index}`}
                        variant="rectangular"
                        height={32}
                        sx={{ flex: 1 }}
                    />
                ))}
            </Box>

            {/* Rows skeleton */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <Box key={`row-${rowIndex}`} sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton
                            key={`cell-${rowIndex}-${colIndex}`}
                            variant="rectangular"
                            height={24}
                            sx={{ flex: 1 }}
                        />
                    ))}
                </Box>
            ))}
        </Box>
    );
};

interface LoadingCardProps {
    title?: string;
    subtitle?: string;
    height?: number;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
    title,
    subtitle,
    height = 200
}) => {
    return (
        <Box
            sx={{
                p: 3,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                height
            }}
        >
            {title && (
                <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
            )}
            {subtitle && (
                <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
            )}
            <Skeleton variant="rectangular" width="100%" height={height - 100} />
        </Box>
    );
};

interface LoadingMapProps {
    height?: number;
}

export const LoadingMap: React.FC<LoadingMapProps> = ({ height = 400 }) => {
    return (
        <Box
            sx={{
                position: 'relative',
                height,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'hidden'
            }}
        >
            <Skeleton
                variant="rectangular"
                width="100%"
                height="100%"
                sx={{ position: 'absolute', top: 0, left: 0 }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1
                }}
            >
                <CircularProgress size={40} />
            </Box>
        </Box>
    );
};

interface LoadingChartProps {
    type?: 'line' | 'bar' | 'pie';
    height?: number;
}

export const LoadingChart: React.FC<LoadingChartProps> = ({
    type = 'line',
    height = 300
}) => {
    const getSkeletonVariant = () => {
        switch (type) {
            case 'bar':
                return (
                    <Box sx={{ display: 'flex', alignItems: 'end', gap: 1, height: '100%' }}>
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Skeleton
                                key={index}
                                variant="rectangular"
                                width={40}
                                height={`${Math.random() * 80 + 20}%`}
                            />
                        ))}
                    </Box>
                );
            case 'pie':
                return (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Skeleton variant="circular" width={200} height={200} />
                    </Box>
                );
            default: // line
                return (
                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                        <Skeleton
                            variant="rectangular"
                            width="100%"
                            height="100%"
                            sx={{
                                background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)'
                            }}
                        />
                    </Box>
                );
        }
    };

    return (
        <Box
            sx={{
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                height
            }}
        >
            {getSkeletonVariant()}
        </Box>
    );
};

export default {
    LoadingSpinner,
    SkeletonGrid,
    SkeletonTable,
    LoadingCard,
    LoadingMap,
    LoadingChart
};