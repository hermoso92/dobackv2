import React, { useState, useCallback, useMemo } from 'react';
import { TelemetryData, VisualizationOptions } from '../types';
import { format } from 'date-fns';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Brush,
  ComposedChart,
  Scatter
} from 'recharts';
import '../assets/styles/AdvancedSensorChart.css';

// Tipo de sensores disponibles
type SensorType = 'acceleration' | 'gyro' | 'angular';
// Ejes disponibles
type AxisType = 'x' | 'y' | 'z' | 'all';
// Modos de visualización
type ChartMode = 'normal' | 'derivative' | 'fft';

interface AdvancedSensorChartProps {
  telemetryData: TelemetryData[];
  options?: VisualizationOptions;
  initialSensor?: SensorType;
  initialAxis?: AxisType;
  alarmThresholds?: {
    [key: string]: {
      warning: number;
      danger: number;
      critical: number;
    };
  };
}

/**
 * Componente para visualización avanzada de datos de sensores
 */
const AdvancedSensorChart: React.FC<AdvancedSensorChartProps> = ({
  telemetryData,
  options = { timeWindow: 60, samplingRate: 100, decimationFactor: 1 },
  initialSensor = 'acceleration',
  initialAxis = 'all',
  alarmThresholds
}) => {
  // Estados para controles de usuario
  const [selectedSensor, setSelectedSensor] = useState<SensorType>(initialSensor);
  const [selectedAxis, setSelectedAxis] = useState<AxisType>(initialAxis);
  const [chartMode, setChartMode] = useState<ChartMode>('normal');
  const [showThresholds, setShowThresholds] = useState<boolean>(true);
  
  // Mapeo de nombres de sensores
  const sensorNames = {
    acceleration: 'Aceleración',
    gyro: 'Giroscopio',
    angular: 'Ángulos'
  };
  
  // Unidades de medida para cada sensor
  const sensorUnits = {
    acceleration: 'g',
    gyro: '°/s',
    angular: '°'
  };
  
  // Colores para cada eje
  const axisColors = {
    x: '#8884d8',
    y: '#82ca9d',
    z: '#ffc658',
    all: '#8884d8'
  };
  
  // Decimación inteligente de datos para mejorar rendimiento
  const processedData = useMemo(() => {
    if (!telemetryData.length) return [];
    
    // Filtrar por ventana de tiempo
    const now = Date.now();
    const cutoffTime = now - options.timeWindow * 1000;
    const filteredData = telemetryData.filter(data => data.timestamp > cutoffTime);
    
    // Aplicar decimación si es necesario
    const { decimationFactor = 1 } = options;
    
    if (decimationFactor <= 1 || filteredData.length < 100) {
      // Sin decimación, procesar todos los puntos
      return filteredData.map(data => ({
        timestamp: data.timestamp,
        timeFormatted: format(data.timestamp, 'HH:mm:ss.SSS'),
        [`${selectedSensor}_x`]: data[`${selectedSensor}_x`],
        [`${selectedSensor}_y`]: data[`${selectedSensor}_y`],
        [`${selectedSensor}_z`]: data[`${selectedSensor}_z`]
      }));
    }
    
    // Decimación inteligente
    const result = [];
    for (let i = 0; i < filteredData.length; i += decimationFactor) {
      const chunk = filteredData.slice(i, Math.min(i + decimationFactor, filteredData.length));
      
      // Siempre incluir el primer punto
      const basePoint = chunk[0];
      const processedPoint = {
        timestamp: basePoint.timestamp,
        timeFormatted: format(basePoint.timestamp, 'HH:mm:ss.SSS'),
        [`${selectedSensor}_x`]: basePoint[`${selectedSensor}_x`],
        [`${selectedSensor}_y`]: basePoint[`${selectedSensor}_y`],
        [`${selectedSensor}_z`]: basePoint[`${selectedSensor}_z`]
      };
      
      result.push(processedPoint);
      
      // Buscar valores extremos (mínimo y máximo) en el chunk para preservar picos
      if (chunk.length > 1) {
        // Para cada eje, encontrar min/max
        ['x', 'y', 'z'].forEach(axis => {
          const values = chunk.map(d => d[`${selectedSensor}_${axis}`]);
          const minValue = Math.min(...values);
          const maxValue = Math.max(...values);
          
          // Si min/max son diferentes al primer punto, añadirlos
          if (minValue < basePoint[`${selectedSensor}_${axis}`]) {
            const minPoint = chunk.find(d => d[`${selectedSensor}_${axis}`] === minValue)!;
            result.push({
              timestamp: minPoint.timestamp,
              timeFormatted: format(minPoint.timestamp, 'HH:mm:ss.SSS'),
              [`${selectedSensor}_x`]: minPoint[`${selectedSensor}_x`],
              [`${selectedSensor}_y`]: minPoint[`${selectedSensor}_y`],
              [`${selectedSensor}_z`]: minPoint[`${selectedSensor}_z`]
            });
          }
          
          if (maxValue > basePoint[`${selectedSensor}_${axis}`]) {
            const maxPoint = chunk.find(d => d[`${selectedSensor}_${axis}`] === maxValue)!;
            result.push({
              timestamp: maxPoint.timestamp,
              timeFormatted: format(maxPoint.timestamp, 'HH:mm:ss.SSS'),
              [`${selectedSensor}_x`]: maxPoint[`${selectedSensor}_x`],
              [`${selectedSensor}_y`]: maxPoint[`${selectedSensor}_y`],
              [`${selectedSensor}_z`]: maxPoint[`${selectedSensor}_z`]
            });
          }
        });
      }
    }
    
    // Ordenar por timestamp (ya que al añadir min/max pueden desordenarse)
    return result.sort((a, b) => a.timestamp - b.timestamp);
  }, [telemetryData, selectedSensor, options.timeWindow, options.decimationFactor]);
  
  // Calcular derivadas (tasas de cambio)
  const derivativeData = useMemo(() => {
    if (chartMode !== 'derivative' || processedData.length < 2) return [];
    
    const result = [];
    for (let i = 1; i < processedData.length; i++) {
      const current = processedData[i];
      const previous = processedData[i-1];
      const timeDiff = (current.timestamp - previous.timestamp) / 1000; // en segundos
      
      if (timeDiff === 0) continue;
      
      const dataPoint: any = {
        timestamp: current.timestamp,
        timeFormatted: current.timeFormatted
      };
      
      // Calcular derivadas para cada eje
      ['x', 'y', 'z'].forEach(axis => {
        const currentValue = current[`${selectedSensor}_${axis}`];
        const previousValue = previous[`${selectedSensor}_${axis}`];
        
        dataPoint[`d${selectedSensor}_${axis}`] = (currentValue - previousValue) / timeDiff;
      });
      
      result.push(dataPoint);
    }
    
    return result;
  }, [chartMode, processedData, selectedSensor]);
  
  // Calcular FFT (Transformada Rápida de Fourier) para análisis de frecuencia
  const fftData = useMemo(() => {
    if (chartMode !== 'fft' || processedData.length < 32) return [];
    
    // Simulación de FFT (en una implementación real se usaría una biblioteca como fft-js)
    const result = [];
    const fftSize = 32;
    const sampleRate = options.samplingRate / (options.decimationFactor || 1);
    
    // Tomar los últimos 32 puntos para análisis de frecuencia
    const samples = processedData.slice(-fftSize).map(d => {
      if (selectedAxis === 'all') {
        // Para 'all', usar el eje Y como representativo
        return d[`${selectedSensor}_y`];
      }
      return d[`${selectedSensor}_${selectedAxis}`];
    });
    
    // Simulación de FFT (en una aplicación real se usaría un algoritmo FFT adecuado)
    for (let i = 0; i < fftSize / 2; i++) {
      // Calcular frecuencia
      const frequency = i * sampleRate / fftSize;
      
      // Calcular magnitud (simulación simplificada)
      let magnitude = 0;
      for (let j = 0; j < samples.length; j++) {
        // Componente de coseno
        magnitude += samples[j] * Math.cos(2 * Math.PI * i * j / fftSize);
        // Componente de seno
        magnitude += samples[j] * Math.sin(2 * Math.PI * i * j / fftSize);
      }
      
      // Normalizar y tomar valor absoluto
      magnitude = Math.abs(magnitude / fftSize);
      
      result.push({
        frequency,
        magnitude
      });
    }
    
    return result;
  }, [chartMode, processedData, selectedSensor, selectedAxis, options.samplingRate, options.decimationFactor]);
  
  // Calcular estadísticas
  const statistics = useMemo(() => {
    if (!processedData.length) {
      return {
        x: { min: 0, max: 0, avg: 0, median: 0, stdDev: 0 },
        y: { min: 0, max: 0, avg: 0, median: 0, stdDev: 0 },
        z: { min: 0, max: 0, avg: 0, median: 0, stdDev: 0 }
      };
    }
    
    const stats: any = {};
    
    // Calcular estadísticas para cada eje
    ['x', 'y', 'z'].forEach(axis => {
      const values = processedData.map(d => d[`${selectedSensor}_${axis}`]);
      const sorted = [...values].sort((a, b) => a - b);
      
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const sum = values.reduce((acc, val) => acc + val, 0);
      const avg = sum / values.length;
      
      const midIndex = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 === 0
        ? (sorted[midIndex-1] + sorted[midIndex]) / 2
        : sorted[midIndex];
      
      const squareDiffs = values.map(value => Math.pow(value - avg, 2));
      const avgSquareDiff = squareDiffs.reduce((acc, val) => acc + val, 0) / squareDiffs.length;
      const stdDev = Math.sqrt(avgSquareDiff);
      
      stats[axis] = { min, max, avg, median, stdDev };
    });
    
    return stats;
  }, [processedData, selectedSensor]);
  
  // Manejar cambio de sensor
  const handleSensorChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSensor(e.target.value as SensorType);
  }, []);
  
  // Manejar cambio de eje
  const handleAxisChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAxis(e.target.value as AxisType);
  }, []);
  
  // Manejar cambio de modo
  const handleModeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setChartMode(e.target.value as ChartMode);
  }, []);
  
  // Toggle de umbrales
  const toggleThresholds = useCallback(() => {
    setShowThresholds(prev => !prev);
  }, []);
  
  // Determinar datos a mostrar según el modo
  const chartData = useMemo(() => {
    switch (chartMode) {
      case 'derivative':
        return derivativeData;
      case 'fft':
        return fftData;
      default:
        return processedData;
    }
  }, [chartMode, processedData, derivativeData, fftData]);
  
  // Determinar unidad de medida actual
  const currentUnit = sensorUnits[selectedSensor];
  
  // Determinar umbrales para el sensor actual
  const currentThresholds = alarmThresholds && selectedSensor === 'acceleration' && selectedAxis === 'y'
    ? alarmThresholds['lateral_acc']
    : undefined;
  
  return (
    <div className="advanced-sensor-chart">
      <div className="chart-header">
        <h3>{sensorNames[selectedSensor]}</h3>
        
        <div className="chart-controls">
          <div className="control-group">
            <label htmlFor="sensor-select">Sensor:</label>
            <select 
              id="sensor-select" 
              value={selectedSensor} 
              onChange={handleSensorChange}
              className="select-control"
            >
              <option value="acceleration">Aceleración</option>
              <option value="gyro">Giroscopio</option>
              <option value="angular">Ángulos</option>
            </select>
          </div>
          
          <div className="control-group">
            <label htmlFor="axis-select">Eje:</label>
            <select 
              id="axis-select" 
              value={selectedAxis} 
              onChange={handleAxisChange}
              className="select-control"
            >
              <option value="all">Todos</option>
              <option value="x">X</option>
              <option value="y">Y</option>
              <option value="z">Z</option>
            </select>
          </div>
          
          <div className="control-group">
            <label htmlFor="mode-select">Modo:</label>
            <select 
              id="mode-select" 
              value={chartMode} 
              onChange={handleModeChange}
              className="select-control"
            >
              <option value="normal">Normal</option>
              <option value="derivative">Derivada</option>
              <option value="fft">FFT</option>
            </select>
          </div>
          
          {currentThresholds && (
            <div className="control-group">
              <label htmlFor="threshold-toggle">Umbrales:</label>
              <div className="toggle-switch">
                <input 
                  type="checkbox" 
                  id="threshold-toggle" 
                  checked={showThresholds} 
                  onChange={toggleThresholds}
                />
                <label htmlFor="threshold-toggle"></label>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="chart-container">
        {chartMode === 'fft' ? (
          // Gráfico de FFT (análisis de frecuencia)
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="frequency" 
                type="number"
                domain={[0, 'dataMax']}
                label={{ value: 'Frecuencia (Hz)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: 'Magnitud', angle: -90, position: 'insideLeft' }} 
              />
              <Tooltip 
                formatter={(value: number) => value.toFixed(4)}
                labelFormatter={(label) => `Frecuencia: ${Number(label).toFixed(1)} Hz`}
              />
              <Area 
                type="monotone" 
                dataKey="magnitude" 
                name="Magnitud" 
                stroke={axisColors[selectedAxis]} 
                fill={axisColors[selectedAxis]} 
                fillOpacity={0.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          // Gráfico normal o de derivadas
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timeFormatted"
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['auto', 'auto']}
                label={{ 
                  value: chartMode === 'derivative' 
                    ? `Tasa de cambio (${currentUnit}/s)` 
                    : `${sensorNames[selectedSensor]} (${currentUnit})`, 
                  angle: -90, 
                  position: 'insideLeft' 
                }}
              />
              <Tooltip 
                formatter={(value: number) => value.toFixed(4) + (chartMode === 'derivative' ? ` ${currentUnit}/s` : ` ${currentUnit}`)}
                labelFormatter={(label) => `Tiempo: ${label}`}
              />
              <Legend />
              <Brush 
                dataKey="timeFormatted" 
                height={30} 
                stroke="#8884d8"
              />
              
              {/* Líneas de umbral (si aplica) */}
              {showThresholds && currentThresholds && (
                <>
                  <ReferenceLine 
                    y={currentThresholds.warning} 
                    stroke="#FFFF00" 
                    strokeDasharray="3 3" 
                    label={{ value: 'Advertencia', position: 'right' }} 
                  />
                  <ReferenceLine 
                    y={currentThresholds.danger} 
                    stroke="#FFA500" 
                    strokeDasharray="3 3" 
                    label={{ value: 'Peligro', position: 'right' }} 
                  />
                  <ReferenceLine 
                    y={currentThresholds.critical} 
                    stroke="#FF0000" 
                    strokeDasharray="3 3" 
                    label={{ value: 'Crítico', position: 'right' }} 
                  />
                </>
              )}
              
              {/* Líneas de datos para cada eje seleccionado */}
              {(selectedAxis === 'all' || selectedAxis === 'x') && (
                <Line 
                  type="monotone" 
                  dataKey={chartMode === 'derivative' ? `d${selectedSensor}_x` : `${selectedSensor}_x`} 
                  name={`Eje X ${chartMode === 'derivative' ? '(Δ)' : ''}`} 
                  stroke={axisColors.x} 
                  dot={false} 
                  activeDot={{ r: 4 }}
                />
              )}
              
              {(selectedAxis === 'all' || selectedAxis === 'y') && (
                <Line 
                  type="monotone" 
                  dataKey={chartMode === 'derivative' ? `d${selectedSensor}_y` : `${selectedSensor}_y`} 
                  name={`Eje Y ${chartMode === 'derivative' ? '(Δ)' : ''}`} 
                  stroke={axisColors.y} 
                  dot={false} 
                  activeDot={{ r: 4 }}
                />
              )}
              
              {(selectedAxis === 'all' || selectedAxis === 'z') && (
                <Line 
                  type="monotone" 
                  dataKey={chartMode === 'derivative' ? `d${selectedSensor}_z` : `${selectedSensor}_z`} 
                  name={`Eje Z ${chartMode === 'derivative' ? '(Δ)' : ''}`} 
                  stroke={axisColors.z} 
                  dot={false} 
                  activeDot={{ r: 4 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      
      {/* Estadísticas (solo para modos normal y derivada) */}
      {chartMode !== 'fft' && (
        <div className="statistics-panel">
          <h4>Estadísticas</h4>
          <div className="statistics-grid">
            {(selectedAxis === 'all' || selectedAxis === 'x') && (
              <div className="axis-stats">
                <h5>Eje X</h5>
                <div className="stats-row">
                  <div className="stat-item">
                    <span className="stat-label">Mín:</span>
                    <span className="stat-value">{statistics.x.min.toFixed(4)} {currentUnit}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Máx:</span>
                    <span className="stat-value">{statistics.x.max.toFixed(4)} {currentUnit}</span>
                  </div>
                </div>
                <div className="stats-row">
                  <div className="stat-item">
                    <span className="stat-label">Media:</span>
                    <span className="stat-value">{statistics.x.avg.toFixed(4)} {currentUnit}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Mediana:</span>
                    <span className="stat-value">{statistics.x.median.toFixed(4)} {currentUnit}</span>
                  </div>
                </div>
                <div className="stats-row">
                  <div className="stat-item">
                    <span className="stat-label">Desv. Est.:</span>
                    <span className="stat-value">{statistics.x.stdDev.toFixed(4)} {currentUnit}</span>
                  </div>
                </div>
              </div>
            )}
            
            {(selectedAxis === 'all' || selectedAxis === 'y') && (
              <div className="axis-stats">
                <h5>Eje Y</h5>
                <div className="stats-row">
                  <div className="stat-item">
                    <span className="stat-label">Mín:</span>
                    <span className="stat-value">{statistics.y.min.toFixed(4)} {currentUnit}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Máx:</span>
                    <span className="stat-value">{statistics.y.max.toFixed(4)} {currentUnit}</span>
                  </div>
                </div>
                <div className="stats-row">
                  <div className="stat-item">
                    <span className="stat-label">Media:</span>
                    <span className="stat-value">{statistics.y.avg.toFixed(4)} {currentUnit}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Mediana:</span>
                    <span className="stat-value">{statistics.y.median.toFixed(4)} {currentUnit}</span>
                  </div>
                </div>
                <div className="stats-row">
                  <div className="stat-item">
                    <span className="stat-label">Desv. Est.:</span>
                    <span className="stat-value">{statistics.y.stdDev.toFixed(4)} {currentUnit}</span>
                  </div>
                </div>
              </div>
            )}
            
            {(selectedAxis === 'all' || selectedAxis === 'z') && (
              <div className="axis-stats">
                <h5>Eje Z</h5>
                <div className="stats-row">
                  <div className="stat-item">
                    <span className="stat-label">Mín:</span>
                    <span className="stat-value">{statistics.z.min.toFixed(4)} {currentUnit}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Máx:</span>
                    <span className="stat-value">{statistics.z.max.toFixed(4)} {currentUnit}</span>
                  </div>
                </div>
                <div className="stats-row">
                  <div className="stat-item">
                    <span className="stat-label">Media:</span>
                    <span className="stat-value">{statistics.z.avg.toFixed(4)} {currentUnit}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Mediana:</span>
                    <span className="stat-value">{statistics.z.median.toFixed(4)} {currentUnit}</span>
                  </div>
                </div>
                <div className="stats-row">
                  <div className="stat-item">
                    <span className="stat-label">Desv. Est.:</span>
                    <span className="stat-value">{statistics.z.stdDev.toFixed(4)} {currentUnit}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSensorChart; 