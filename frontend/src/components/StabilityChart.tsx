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
import { forwardRef, useMemo, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { StabilityDataPoint, VariableGroup } from '../types/stability';

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

export interface StabilityChartProps {
    data: StabilityDataPoint[];
    selectedVariables: Record<keyof StabilityDataPoint, boolean>;
    variableGroups: VariableGroup[];
    onHover: (point: StabilityDataPoint | null) => void;
    handleVariableChange: (variable: keyof StabilityDataPoint) => void;
    onZoomChange?: (zoom: { x: number, y: number, scale: number } | null) => void;
    initialZoom?: { x: number, y: number, scale: number } | null;
}

const StabilityChart = forwardRef<Chart<'line'>, StabilityChartProps>(({
    data,
    selectedVariables,
    variableGroups,
    onHover,
    handleVariableChange,
    onZoomChange,
    initialZoom
}, ref) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const chartRef = useRef<Chart<'line'> | null>(null);

    // Down-sampling uniforme para mejorar rendimiento
    const downsampledData = useMemo<StabilityDataPoint[]>(() => {
        const MAX_POINTS = 3000;
        if (data.length <= MAX_POINTS) return data;
        const step = Math.ceil(data.length / MAX_POINTS);
        return data.filter((_, idx) => idx % step === 0);
    }, [data]);

    const chartData = useMemo<ChartData<'line'>>(() => {
        const labels = downsampledData.map(point => new Date(point.timestamp).toLocaleTimeString());
        const datasets = variableGroups.flatMap(group =>
            group.variables
                .filter(variable => selectedVariables[variable.key as keyof StabilityDataPoint])
                .map(variable => ({
                    label: `${variable.label} (${variable.unit})`,
                    data: downsampledData.map(point => point[variable.key as keyof StabilityDataPoint] as number),
                    borderColor: getColorForVariable(variable.key),
                    backgroundColor: getColorForVariable(variable.key, 0.1),
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    tension: 0.4,
                    fill: false
                }))
        );

        return {
            labels,
            datasets
        };
    }, [downsampledData, selectedVariables, variableGroups]);

    const options: ChartOptions<'line'> = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
        onHover: (event: any, elements: any) => {
            if (elements && elements.length > 0) {
                const index = elements[0].index;
                if (typeof index === 'number' && downsampledData[index]) {
                    setHoveredIndex(index);
                    onHover(downsampledData[index]);
                }
            } else {
                setHoveredIndex(null);
                onHover(null);
            }
        },
        plugins: {
            legend: {
                position: 'top' as const,
                align: 'center',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        size: 12
                    },
                    color: 'rgba(0, 0, 0, 0.7)',
                    boxWidth: 12,
                    boxHeight: 12,
                    generateLabels: (chart: any) => {
                        return variableGroups.flatMap(group =>
                            group.variables.map(variable => {
                                const isSelected = selectedVariables[variable.key as keyof StabilityDataPoint];
                                const currentValue = hoveredIndex !== null && downsampledData[hoveredIndex]
                                    ? downsampledData[hoveredIndex][variable.key as keyof StabilityDataPoint]
                                    : downsampledData[downsampledData.length - 1]?.[variable.key as keyof StabilityDataPoint];

                                const value = typeof currentValue === 'number' ? currentValue.toFixed(2) : currentValue;
                                const label = isSelected
                                    ? `${variable.label} (${variable.unit}): ${value}`
                                    : `${variable.label} (${variable.unit})`;

                                return {
                                    text: label,
                                    fillStyle: getColorForVariable(variable.key),
                                    strokeStyle: getColorForVariable(variable.key),
                                    lineWidth: 2,
                                    hidden: !isSelected,
                                    index: variableGroups.flatMap(g => g.variables).findIndex(v => v.key === variable.key),
                                    textDecoration: !isSelected ? 'line-through' : 'none',
                                    pointStyle: 'rect'
                                };
                            })
                        );
                    }
                },
                onClick: (e: any, legendItem: any, legend: any) => {
                    const allVariables = variableGroups.flatMap(g => g.variables);
                    const variableKey = allVariables[legendItem.index || 0]?.key as keyof StabilityDataPoint;

                    if (variableKey) {
                        handleVariableChange(variableKey);
                        if (chartRef.current) {
                            chartRef.current.update('none');
                        }
                    }
                }
            },
            tooltip: {
                enabled: false
            },
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'xy',
                    modifierKey: 'shift'
                },
                zoom: {
                    wheel: {
                        enabled: true,
                        speed: 0.1
                    },
                    pinch: {
                        enabled: true
                    },
                    mode: 'xy',
                    drag: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        borderColor: 'rgba(0, 0, 0, 0.3)',
                        borderWidth: 1,
                        threshold: 10
                    }
                },
                limits: {
                    x: { min: 'original', max: 'original' },
                    y: { min: 'original', max: 'original' }
                }
            }
        },
        scales: {
            x: {
                type: 'category',
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    font: {
                        size: 10
                    }
                }
            },
            y: {
                type: 'linear',
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                    font: {
                        size: 10
                    }
                },
                beginAtZero: true,
                suggestedMin: -1,
                suggestedMax: 1
            }
        }
    }), [downsampledData, selectedVariables, handleVariableChange, variableGroups, hoveredIndex]);

    const resetZoom = () => {
        if (chartRef.current) {
            const chart = chartRef.current;
            chart.resetZoom();
            onZoomChange?.(null);
            chart.update('none');
        }
    };

    return (
        <Box sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            overflow: 'hidden'
        }} className="chart-container">
            <Stack
                direction="row"
                spacing={1}
                sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 1,
                    padding: 0.5
                }}
            >
                <IconButton
                    size="small"
                    onClick={resetZoom}
                    title="Resetear zoom"
                >
                    <RestartAltIcon />
                </IconButton>
            </Stack>

            <Line
                ref={(chart) => {
                    chartRef.current = chart || null;
                    if (ref) {
                        if (typeof ref === 'function') {
                            ref(chart || null);
                        } else {
                            ref.current = chart || null;
                        }
                    }
                }}
                data={chartData}
                options={options}
            />
        </Box>
    );
});

StabilityChart.displayName = 'StabilityChart';

const getColorForVariable = (variable: string, alpha = 1): string => {
    const colors: Record<string, string> = {
        ax: `rgba(255, 99, 132, ${alpha})`,
        ay: `rgba(54, 162, 235, ${alpha})`,
        az: `rgba(255, 206, 86, ${alpha})`,
        gx: `rgba(75, 192, 192, ${alpha})`,
        gy: `rgba(153, 102, 255, ${alpha})`,
        gz: `rgba(255, 159, 64, ${alpha})`,
        roll: `rgba(199, 199, 199, ${alpha})`,
        pitch: `rgba(83, 102, 255, ${alpha})`,
        yaw: `rgba(255, 99, 132, ${alpha})`,
        si: `rgba(255, 0, 0, ${alpha})`,
        accmag: `rgba(0, 255, 0, ${alpha})`
    };

    return colors[variable] || `rgba(0, 0, 0, ${alpha})`;
};

export default StabilityChart; 