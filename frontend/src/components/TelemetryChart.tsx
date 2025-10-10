import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Box, IconButton, Stack } from '@mui/material';
import type { Chart } from 'chart.js';
import {
    CategoryScale,
    ChartData,
    Chart as ChartJS,
    ChartOptions,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { forwardRef, useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { TelemetryDataPoint, VariableGroup } from '../types/telemetry';
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    zoomPlugin
);

export interface TelemetryChartProps {
    data: TelemetryDataPoint[];
    selectedVariables: Record<keyof TelemetryDataPoint, boolean>;
    variableGroups: VariableGroup[];
    onHover: (point: TelemetryDataPoint | null) => void;
    handleVariableChange: (variable: keyof TelemetryDataPoint) => void;
    onZoomChange?: (zoom: { x: number, y: number } | null) => void;
    initialZoom?: { x: number, y: number } | null;
}

const TelemetryChart = forwardRef<Chart, TelemetryChartProps>(({
    data,
    selectedVariables,
    variableGroups,
    onHover,
    handleVariableChange,
    onZoomChange,
    initialZoom
}, ref) => {
    const [zoom, setZoom] = useState(initialZoom || null);

    const chartData: ChartData<'line'> = useMemo(() => {
        const datasets = variableGroups.flatMap(group =>
            group.variables
                .filter(variable => selectedVariables[variable])
                .map(variable => ({
                    label: variable,
                    data: data.map(point => point[variable]),
                    borderColor: group.color,
                    backgroundColor: group.color,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                }))
        );

        return {
            labels: data.map(point => new Date(point.timestamp).toLocaleTimeString()),
            datasets
        };
    }, [data, selectedVariables, variableGroups]);

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
        plugins: {
            legend: {
                position: 'top' as const
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const point = data[context.dataIndex];
                        return `${context.dataset.label}: ${point[context.dataset.label as keyof TelemetryDataPoint]}`;
                    }
                }
            },
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'x'
                },
                zoom: {
                    wheel: {
                        enabled: true
                    },
                    pinch: {
                        enabled: true
                    },
                    mode: 'x'
                }
            }
        },
        scales: {
            x: {
                type: 'category',
                title: {
                    display: true,
                    text: 'Tiempo'
                }
            },
            y: {
                type: 'linear',
                title: {
                    display: true,
                    text: 'Valor'
                }
            }
        },
        onHover: (event, elements) => {
            if (elements && elements.length > 0) {
                const index = elements[0].index;
                onHover(data[index]);
            } else {
                onHover(null);
            }
        }
    };

    const handleResetZoom = () => {
        if (ref && 'current' in ref && ref.current) {
            ref.current.resetZoom();
            setZoom(null);
            onZoomChange?.(null);
        }
    };

    useEffect(() => {
        if (ref && 'current' in ref && ref.current) {
            ref.current.options.plugins.zoom.zoom.onZoom = () => {
                const newZoom = ref.current.getZoomLevel();
                setZoom(newZoom);
                onZoomChange?.(newZoom);
            };
        }
    }, [ref, onZoomChange]);

    return (
        <Box sx={{ position: 'relative', height: 400 }}>
            <Stack
                direction="row"
                spacing={1}
                sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
            >
                <IconButton onClick={handleResetZoom} size="small">
                    <RestartAltIcon />
                </IconButton>
            </Stack>
            <Line ref={ref} data={chartData} options={options} />
        </Box>
    );
});

TelemetryChart.displayName = 'TelemetryChart';

export default TelemetryChart; 