import { Box, Paper, Typography, useTheme } from '@mui/material';
import * as d3 from 'd3';
import React, { useEffect, useRef } from 'react';
interface DataPoint {
    timestamp: number | Date;
    value: number;
    [key: string]: any;
}

interface AdvancedTimeseriesChartProps {
    data: DataPoint[];
    xKey?: string;
    yKey?: string;
    title?: string;
    color?: string;
    height?: number;
    width?: number;
    maxPoints?: number;
    showAxes?: boolean;
    showGrid?: boolean;
    lineWidth?: number;
    fillOpacity?: number;
    animationDuration?: number;
    margin?: { top: number; right: number; bottom: number; left: number };
    timeFormat?: string;
    onHover?: (d: DataPoint | null) => void;
    onClick?: (d: DataPoint) => void;
}

const AdvancedTimeseriesChart: React.FC<AdvancedTimeseriesChartProps> = ({
    data = [],
    xKey = 'timestamp',
    yKey = 'value',
    title,
    color,
    height = 300,
    width = 800,
    maxPoints = 100,
    showAxes = true,
    showGrid = true,
    lineWidth = 2,
    fillOpacity = 0.2,
    animationDuration = 300,
    margin = { top: 20, right: 30, bottom: 30, left: 50 },
    timeFormat = '%H:%M:%S',
    onHover,
    onClick,
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const theme = useTheme();
    const chartColor = color || theme.palette.primary.main;

    useEffect(() => {
        if (!svgRef.current || data.length === 0) return;

        // Limitar el número de puntos si es necesario
        const limitedData = data.slice(-maxPoints);

        // Limpiar cualquier contenido existente
        d3.select(svgRef.current).selectAll('*').remove();

        // Configurar dimensiones
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Crear el elemento SVG
        const svg = d3
            .select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        // Crear el grupo principal y aplicar el margen
        const g = svg
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Convertir las marcas de tiempo a objetos Date si son números
        const processedData = limitedData.map((d) => ({
            ...d,
            [xKey]: d[xKey] instanceof Date ? d[xKey] : new Date(d[xKey]),
        }));

        // Escalas X e Y
        const xScale = d3
            .scaleTime()
            .domain(d3.extent(processedData, (d: DataPoint) => d[xKey] as Date) as [Date, Date])
            .range([0, innerWidth]);

        const yScale = d3
            .scaleLinear()
            .domain([
                d3.min(processedData, (d: DataPoint) => d[yKey] as number) || 0,
                d3.max(processedData, (d: DataPoint) => d[yKey] as number) || 0,
            ] as [number, number])
            .nice()
            .range([innerHeight, 0]);

        // Dibujar ejes si se solicita
        if (showAxes) {
            // Eje X
            const xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat(timeFormat) as any);
            g.append('g')
                .attr('class', 'x-axis')
                .attr('transform', `translate(0,${innerHeight})`)
                .call(xAxis);

            // Eje Y
            const yAxis = d3.axisLeft(yScale);
            g.append('g').attr('class', 'y-axis').call(yAxis);
        }

        // Dibujar cuadrícula si se solicita
        if (showGrid) {
            g.append('g')
                .attr('class', 'grid')
                .selectAll('line')
                .data(yScale.ticks())
                .enter()
                .append('line')
                .attr('x1', 0)
                .attr('x2', innerWidth)
                .attr('y1', (d: number) => yScale(d))
                .attr('y2', (d: number) => yScale(d))
                .attr('stroke', 'rgba(0, 0, 0, 0.1)')
                .attr('stroke-dasharray', '3,3');
        }

        // Crear generador de líneas
        const line = d3
            .line<DataPoint>()
            .x((d: DataPoint) => xScale(d[xKey] as Date))
            .y((d: DataPoint) => yScale(d[yKey] as number))
            .curve(d3.curveMonotoneX);

        // Crear generador de áreas
        const area = d3
            .area<DataPoint>()
            .x((d: DataPoint) => xScale(d[xKey] as Date))
            .y0(innerHeight)
            .y1((d: DataPoint) => yScale(d[yKey] as number))
            .curve(d3.curveMonotoneX);

        // Dibujar área con animación
        g.append('path')
            .datum(processedData)
            .attr('class', 'area')
            .attr('fill', chartColor)
            .attr('fill-opacity', 0)
            .attr('d', area)
            .transition()
            .duration(animationDuration)
            .attr('fill-opacity', fillOpacity);

        // Dibujar línea con animación
        const path = g
            .append('path')
            .datum(processedData)
            .attr('class', 'line')
            .attr('fill', 'none')
            .attr('stroke', chartColor)
            .attr('stroke-width', lineWidth)
            .attr('d', line);

        // Animación de la línea
        const pathLength = path.node()?.getTotalLength() || 0;
        path
            .attr('stroke-dasharray', `${pathLength} ${pathLength}`)
            .attr('stroke-dashoffset', pathLength)
            .transition()
            .duration(animationDuration)
            .attr('stroke-dashoffset', 0);

        // Agregar puntos interactivos
        g.selectAll('.dot')
            .data(processedData)
            .enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('cx', (d: DataPoint) => xScale(d[xKey] as Date))
            .attr('cy', (d: DataPoint) => yScale(d[yKey] as number))
            .attr('r', 0)
            .attr('fill', chartColor)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .transition()
            .delay((_, i) => i * (animationDuration / processedData.length))
            .duration(animationDuration / 2)
            .attr('r', 4);

        // Crear un overlay para manejar eventos del mouse
        const overlay = g
            .append('rect')
            .attr('class', 'overlay')
            .attr('width', innerWidth)
            .attr('height', innerHeight)
            .attr('fill', 'none')
            .attr('pointer-events', 'all');

        // Crear un grupo para el tooltip
        const tooltip = g
            .append('g')
            .attr('class', 'tooltip')
            .style('opacity', 0)
            .attr('pointer-events', 'none');

        tooltip
            .append('rect')
            .attr('width', 100)
            .attr('height', 50)
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('fill', 'rgba(0, 0, 0, 0.7)');

        const tooltipText = tooltip
            .append('text')
            .attr('fill', '#fff')
            .attr('font-size', '12px')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle');

        tooltipText.append('tspan').attr('x', 50).attr('y', 20);
        tooltipText.append('tspan').attr('x', 50).attr('y', 35);

        // Manejar eventos del mouse
        if (onHover || onClick) {
            overlay
                .on('mousemove', function (event) {
                    if (!onHover) return;

                    const [mouseX] = d3.pointer(event);
                    const xDate = xScale.invert(mouseX);

                    // Encontrar el punto más cercano
                    const bisect = d3.bisector<DataPoint, Date>((d) => d[xKey] as Date).left;
                    const index = bisect(processedData, xDate);
                    const d0 = processedData[index - 1];
                    const d1 = processedData[index];

                    if (!d0 || !d1) return;

                    const d =
                        xDate.getTime() - (d0[xKey] as Date).getTime() >
                            (d1[xKey] as Date).getTime() - xDate.getTime()
                            ? d1
                            : d0;

                    // Mostrar tooltip
                    tooltip
                        .attr('transform', `translate(${xScale(d[xKey] as Date) - 50},${yScale(d[yKey] as number) - 60})`)
                        .style('opacity', 1);

                    tooltipText
                        .select('tspan:nth-child(1)')
                        .text(d3.timeFormat(timeFormat)(d[xKey] as Date));
                    tooltipText.select('tspan:nth-child(2)').text(`${yKey}: ${d[yKey]}`);

                    // Destacar el punto activo
                    g.selectAll('.dot')
                        .attr('r', 4)
                        .filter((dp: DataPoint) => dp === d)
                        .attr('r', 6)
                        .attr('stroke-width', 2);

                    if (onHover) onHover(d);
                })
                .on('mouseout', function () {
                    tooltip.style('opacity', 0);
                    g.selectAll('.dot').attr('r', 4).attr('stroke-width', 1);
                    if (onHover) onHover(null);
                })
                .on('click', function (event) {
                    if (!onClick) return;

                    const [mouseX] = d3.pointer(event);
                    const xDate = xScale.invert(mouseX);

                    // Encontrar el punto más cercano
                    const bisect = d3.bisector<DataPoint, Date>((d) => d[xKey] as Date).left;
                    const index = bisect(processedData, xDate);
                    const d0 = processedData[index - 1];
                    const d1 = processedData[index];

                    if (!d0 || !d1) return;

                    const d =
                        xDate.getTime() - (d0[xKey] as Date).getTime() >
                            (d1[xKey] as Date).getTime() - xDate.getTime()
                            ? d1
                            : d0;

                    if (onClick) onClick(d);
                });
        }
    }, [
        data,
        xKey,
        yKey,
        chartColor,
        height,
        width,
        maxPoints,
        showAxes,
        showGrid,
        lineWidth,
        fillOpacity,
        animationDuration,
        margin,
        timeFormat,
        onHover,
        onClick,
    ]);

    return (
        <Paper elevation={1} sx={{ p: 2, height: 'auto', width: '100%' }}>
            {title && (
                <Typography variant="h6" gutterBottom align="center">
                    {title}
                </Typography>
            )}
            <Box sx={{ width: '100%', height: 'auto', overflowX: 'auto' }}>
                <svg ref={svgRef} width={width} height={height} />
            </Box>
        </Paper>
    );
};

export default AdvancedTimeseriesChart; 