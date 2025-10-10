import React, { useMemo } from 'react';
import { 
  TelemetryData, 
  VehicleConfig, 
  DangerInfo, 
  TrendInfo, 
  ProcessedTelemetryPoint 
} from '../types';
import { 
  calculateDangerInfo, 
  calculateDangerTrend 
} from '../utils/stabilityCalculations';
import { format } from 'date-fns';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import '../assets/styles/DangerBar.css';

interface DangerBarProps {
  telemetryData: TelemetryData[];
  vehicleConfig: VehicleConfig;
  showDetails?: boolean;
  timeWindow?: number;
}

/**
 * Componente para visualizar el nivel de peligrosidad del vehículo
 * 
 * @param telemetryData Datos de telemetría
 * @param vehicleConfig Configuración del vehículo
 * @param showDetails Indica si se muestran gráficas detalladas
 * @param timeWindow Ventana de tiempo para gráficas (segundos)
 */
const DangerBar: React.FC<DangerBarProps> = ({
  telemetryData,
  vehicleConfig,
  showDetails = true,
  timeWindow = 60
}) => {
  // Calcular información de peligrosidad con el último dato
  const dangerInfo: DangerInfo = useMemo(() => {
    if (!telemetryData.length) {
      return {
        dangerLevel: 0,
        level: 'safe',
        color: '#00FF00',
        description: 'Sin datos de telemetría',
        ltrValue: 0,
        ssfValue: 0,
        drsValue: 0
      };
    }
    
    const latestData = telemetryData[telemetryData.length - 1];
    return calculateDangerInfo(latestData, vehicleConfig);
  }, [telemetryData, vehicleConfig]);
  
  // Calcular tendencia de peligrosidad
  const trendInfo: TrendInfo = useMemo(() => {
    if (telemetryData.length < 2) {
      return {
        trend: 'stable',
        changeRate: 0,
        direction: 'none'
      };
    }
    
    return calculateDangerTrend(telemetryData, vehicleConfig);
  }, [telemetryData, vehicleConfig]);
  
  // Procesar datos para gráficas
  const processedData: ProcessedTelemetryPoint[] = useMemo(() => {
    if (!telemetryData.length) return [];
    
    // Filtrar por ventana de tiempo
    const now = Date.now();
    const cutoffTime = now - timeWindow * 1000;
    
    return telemetryData
      .filter(data => data.timestamp > cutoffTime)
      .map(data => {
        // Calcular información de peligrosidad para este punto
        const info = calculateDangerInfo(data, vehicleConfig);
        
        return {
          timestamp: data.timestamp,
          timeFormatted: format(data.timestamp, 'HH:mm:ss'),
          ltr: info.ltrValue,
          ssf: info.ssfValue,
          drs: info.drsValue,
          dangerLevel: info.dangerLevel
        };
      });
  }, [telemetryData, vehicleConfig, timeWindow]);
  
  // Calcular estadísticas
  const statistics = useMemo(() => {
    if (!processedData.length) {
      return { min: 0, max: 0, avg: 0, median: 0, stdDev: 0 };
    }
    
    const dangerLevels = processedData.map(d => d.dangerLevel);
    const sorted = [...dangerLevels].sort((a, b) => a - b);
    
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const avg = dangerLevels.reduce((sum, level) => sum + level, 0) / dangerLevels.length;
    
    const midIndex = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
      ? (sorted[midIndex-1] + sorted[midIndex]) / 2
      : sorted[midIndex];
    
    const squareDiffs = dangerLevels.map(level => Math.pow(level - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, sqDiff) => sum + sqDiff, 0) / squareDiffs.length;
    const stdDev = Math.sqrt(avgSquareDiff);
    
    return { min, max, avg, median, stdDev };
  }, [processedData]);
  
  // Formateo del nivel de peligro para mostrar
  const dangerLevelPercent = Math.round(dangerInfo.dangerLevel * 100);
  
  // Cálculo de contribuciones
  const ltrContribution = Math.round(dangerInfo.ltrValue * 100);
  const ssfContribution = Math.round((1 - Math.min(dangerInfo.ssfValue / 2, 1)) * 100);
  const drsContribution = Math.round((1 - Math.min(Math.max(dangerInfo.drsValue, 0), 1)) * 100);
  
  return (
    <div className="danger-monitoring-container">
      {/* Encabezado con nivel actual */}
      <div className="danger-header">
        <div className="danger-title">
          <h3>Nivel de Peligrosidad</h3>
          <span className={`danger-badge ${dangerInfo.level}`}>
            {dangerInfo.level === 'safe' && 'Seguro'}
            {dangerInfo.level === 'warning' && 'Advertencia'}
            {dangerInfo.level === 'danger' && 'Peligro'}
            {dangerInfo.level === 'critical' && 'Crítico'}
          </span>
        </div>
        <div className="danger-value-display">
          <span className="danger-percent">{dangerLevelPercent}%</span>
          <span className="danger-description" style={{ backgroundColor: dangerInfo.color + '33' }}>
            {dangerInfo.description}
          </span>
        </div>
      </div>
      
      {/* Barra principal de peligrosidad */}
      <div className="danger-bar-container">
        <div className="danger-bar">
          <div 
            className="danger-level" 
            style={{ 
              width: `${dangerLevelPercent}%`, 
              backgroundColor: dangerInfo.color 
            }}
          ></div>
        </div>
        
        {/* Marcas de referencia */}
        <div className="danger-markers">
          <div className="danger-marker" style={{ left: '30%' }}>
            <div className="marker-line warning"></div>
            <span className="marker-label">30%</span>
          </div>
          <div className="danger-marker" style={{ left: '60%' }}>
            <div className="marker-line danger"></div>
            <span className="marker-label">60%</span>
          </div>
          <div className="danger-marker" style={{ left: '80%' }}>
            <div className="marker-line critical"></div>
            <span className="marker-label">80%</span>
          </div>
        </div>
      </div>
      
      {/* Contribuciones individuales */}
      <div className="danger-contributions">
        <div className="contribution-item">
          <span className="contribution-label">LTR:</span>
          <div className="contribution-bar">
            <div 
              className="contribution-value" 
              style={{ 
                width: `${ltrContribution}%`, 
                backgroundColor: '#FF0000' 
              }}
            ></div>
          </div>
          <span className="contribution-percentage">
            {ltrContribution}%
          </span>
          <span className="contribution-tooltip" title="Lateral Transfer Ratio - Mide la transferencia lateral de carga">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </span>
        </div>
        
        <div className="contribution-item">
          <span className="contribution-label">SSF:</span>
          <div className="contribution-bar">
            <div 
              className="contribution-value" 
              style={{ 
                width: `${ssfContribution}%`, 
                backgroundColor: '#FFA500' 
              }}
            ></div>
          </div>
          <span className="contribution-percentage">
            {ssfContribution}%
          </span>
          <span className="contribution-tooltip" title="Static Stability Factor - Factor de estabilidad estática">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </span>
        </div>
        
        <div className="contribution-item">
          <span className="contribution-label">DRS:</span>
          <div className="contribution-bar">
            <div 
              className="contribution-value" 
              style={{ 
                width: `${drsContribution}%`, 
                backgroundColor: '#FFFF00' 
              }}
            ></div>
          </div>
          <span className="contribution-percentage">
            {drsContribution}%
          </span>
          <span className="contribution-tooltip" title="Dynamic Rollover Stability - Estabilidad dinámica ante vuelcos">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </span>
        </div>
      </div>
      
      {/* Tendencia */}
      <div className="danger-trend">
        <span className="trend-label">Tendencia:</span>
        <span className={`trend-value ${trendInfo.trend}`}>
          {trendInfo.trend === 'increasing' && (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M7 14l5-5 5 5z"/>
              </svg>
              Aumentando
            </>
          )}
          {trendInfo.trend === 'decreasing' && (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M7 10l5 5 5-5z"/>
              </svg>
              Disminuyendo
            </>
          )}
          {trendInfo.trend === 'stable' && (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M5 12h14"/>
              </svg>
              Estable
            </>
          )}
        </span>
      </div>
      
      {/* Sección de detalles (condicional) */}
      {showDetails && processedData.length > 0 && (
        <div className="danger-details">
          <h3>Análisis Detallado de Estabilidad</h3>
          
          {/* Estadísticas */}
          <div className="statistics-container">
            <div className="statistic-item">
              <span className="statistic-label">Mínimo:</span>
              <span className="statistic-value">{(statistics.min * 100).toFixed(1)}%</span>
            </div>
            <div className="statistic-item">
              <span className="statistic-label">Máximo:</span>
              <span className="statistic-value">{(statistics.max * 100).toFixed(1)}%</span>
            </div>
            <div className="statistic-item">
              <span className="statistic-label">Promedio:</span>
              <span className="statistic-value">{(statistics.avg * 100).toFixed(1)}%</span>
            </div>
            <div className="statistic-item">
              <span className="statistic-label">Mediana:</span>
              <span className="statistic-value">{(statistics.median * 100).toFixed(1)}%</span>
            </div>
            <div className="statistic-item">
              <span className="statistic-label">Desv. Estándar:</span>
              <span className="statistic-value">{(statistics.stdDev * 100).toFixed(1)}%</span>
            </div>
          </div>
          
          {/* Gráfico de tendencia de peligrosidad */}
          <div className="danger-trend-chart">
            <h4>Evolución del Nivel de Peligrosidad</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timeFormatted"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={[0, 1]} 
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                />
                <Tooltip 
                  formatter={(value: number) => `${(value * 100).toFixed(2)}%`}
                  labelFormatter={(label) => `Tiempo: ${label}`}
                />
                <Legend />
                <ReferenceLine y={0.3} stroke="#FFFF00" strokeDasharray="3 3" />
                <ReferenceLine y={0.6} stroke="#FFA500" strokeDasharray="3 3" />
                <ReferenceLine y={0.8} stroke="#FF0000" strokeDasharray="3 3" />
                <Area 
                  type="monotone" 
                  dataKey="dangerLevel" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3} 
                  name="Nivel de Peligro"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Gráfico de factores individuales */}
          <div className="factors-chart">
            <h4>Factores de Riesgo</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timeFormatted"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="ltr" 
                  stroke="#FF0000" 
                  dot={false} 
                  name="LTR"
                />
                <Line 
                  type="monotone" 
                  dataKey="ssf" 
                  stroke="#FFA500" 
                  dot={false} 
                  name="SSF"
                  strokeDasharray="5 5"
                />
                <Line 
                  type="monotone" 
                  dataKey="drs" 
                  stroke="#FFFF00" 
                  dot={false} 
                  name="DRS"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default DangerBar; 