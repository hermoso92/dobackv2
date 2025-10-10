import React, { useState } from 'react';
import '../assets/styles/StabilityDashboard.css';
import { ALARM_THRESHOLDS, SAMPLING_RATES, TIME_WINDOWS } from '../config/stabilityConfig';
import { useTelemetryData } from '../hooks/useTelemetryData';
import AdvancedSensorChart from './AdvancedSensorChart';
import DangerBar from './DangerBar';

/**
 * Dashboard principal que integra todos los componentes de visualización
 * de estabilidad del vehículo en una interfaz unificada y moderna.
 */
const StabilityDashboard: React.FC = () => {
  // Estado para opciones de visualización
  const [timeWindow, setTimeWindow] = useState<number>(60);
  const [samplingRate, setSamplingRate] = useState<number>(100);
  const [decimationFactor, setDecimationFactor] = useState<number>(1);
  const [showDetailedGraphs, setShowDetailedGraphs] = useState<boolean>(true);

  // Usar hook para obtener datos de telemetría en tiempo real
  const {
    telemetryData,
    vehicleConfig,
    isRunning,
    toggleRunning,
    setTimeWindow: setDataTimeWindow,
    setDecimationFactor: setDataDecimationFactor,
    clearData,
    lastError
  } = useTelemetryData({
    simulationMode: true,
    samplingRate,
    timeWindow,
    decimationFactor
  });

  // Manejar cambio de ventana de tiempo
  const handleTimeWindowChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTimeWindow = parseInt(e.target.value, 10);
    setTimeWindow(newTimeWindow);
    setDataTimeWindow(newTimeWindow);
  };

  // Manejar cambio de frecuencia de muestreo
  const handleSamplingRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSamplingRate(parseInt(e.target.value, 10));
  };

  // Manejar cambio de factor de decimación
  const handleDecimationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFactor = parseInt(e.target.value, 10);
    setDecimationFactor(newFactor);
    setDataDecimationFactor(newFactor);
  };

  // Toggle para mostrar/ocultar gráficos detallados
  const toggleDetailedGraphs = () => {
    setShowDetailedGraphs(prev => !prev);
  };

  return (
    <div className="stability-dashboard">
      <header className="dashboard-header">
        <h1>DobackSoft</h1>
        <div className="dashboard-controls">
          <div className="control-group">
            <label htmlFor="time-window">Ventana de tiempo:</label>
            <select
              id="time-window"
              value={timeWindow}
              onChange={handleTimeWindowChange}
              className="select-control"
            >
              {TIME_WINDOWS.map(tw => (
                <option key={tw} value={tw}>{tw}s</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="sampling-rate">Frecuencia:</label>
            <select
              id="sampling-rate"
              value={samplingRate}
              onChange={handleSamplingRateChange}
              className="select-control"
            >
              {SAMPLING_RATES.map(sr => (
                <option key={sr} value={sr}>{sr} Hz</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="decimation-factor">Decimación:</label>
            <select
              id="decimation-factor"
              value={decimationFactor}
              onChange={handleDecimationChange}
              className="select-control"
            >
              <option value="1">Ninguna</option>
              <option value="2">2x</option>
              <option value="5">5x</option>
              <option value="10">10x</option>
            </select>
          </div>

          <div className="action-buttons">
            <button
              className={`control-button ${isRunning ? 'running' : 'paused'}`}
              onClick={toggleRunning}
            >
              {isRunning ? 'Pausar' : 'Reanudar'}
            </button>

            <button
              className="control-button clear"
              onClick={clearData}
            >
              Limpiar
            </button>
          </div>
        </div>
      </header>

      {lastError && (
        <div className="error-message">
          <p>Error: {lastError}</p>
        </div>
      )}

      <div className="dashboard-content">
        <div className="primary-section">
          {/* Componente DangerBar - Indicador principal de peligrosidad */}
          <DangerBar
            telemetryData={telemetryData}
            vehicleConfig={vehicleConfig}
            showDetails={showDetailedGraphs}
            timeWindow={timeWindow}
          />
        </div>

        <div className="detailed-section">
          <div className="section-header">
            <h2>Análisis de Sensores</h2>
            <button
              className="toggle-button"
              onClick={toggleDetailedGraphs}
            >
              {showDetailedGraphs ? 'Ocultar detalles' : 'Mostrar detalles'}
            </button>
          </div>

          {showDetailedGraphs && (
            <div className="sensors-grid">
              {/* Gráfica avanzada para aceleración */}
              <AdvancedSensorChart
                telemetryData={telemetryData}
                options={{
                  timeWindow,
                  samplingRate,
                  decimationFactor
                }}
                initialSensor="acceleration"
                initialAxis="all"
                alarmThresholds={ALARM_THRESHOLDS}
              />

              {/* Gráfica avanzada para giroscopio */}
              <AdvancedSensorChart
                telemetryData={telemetryData}
                options={{
                  timeWindow,
                  samplingRate,
                  decimationFactor
                }}
                initialSensor="gyro"
                initialAxis="all"
                alarmThresholds={ALARM_THRESHOLDS}
              />

              {/* Gráfica avanzada para ángulos */}
              <AdvancedSensorChart
                telemetryData={telemetryData}
                options={{
                  timeWindow,
                  samplingRate,
                  decimationFactor
                }}
                initialSensor="angular"
                initialAxis="all"
                alarmThresholds={ALARM_THRESHOLDS}
              />
            </div>
          )}
        </div>
      </div>

      <footer className="dashboard-footer">
        <div className="vehicle-info">
          <span className="info-label">Vehículo:</span>
          <span className="info-value">{vehicleConfig.name || 'Vehículo de prueba'}</span>
        </div>
        <div className="vehicle-specs">
          <div className="spec-item">
            <span className="spec-label">Ancho de vía:</span>
            <span className="spec-value">{vehicleConfig.track_width.toFixed(2)} m</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Altura CG:</span>
            <span className="spec-value">{vehicleConfig.cg_height.toFixed(2)} m</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Distancia entre ejes:</span>
            <span className="spec-value">{vehicleConfig.wheelbase.toFixed(2)} m</span>
          </div>
        </div>
        <div className="status-info">
          <span className="status-indicator">
            <span className={`status-dot ${isRunning ? 'active' : 'inactive'}`}></span>
            {isRunning ? 'Monitoreo activo' : 'Monitoreo en pausa'}
          </span>
          <span className="data-points">Puntos: {telemetryData.length}</span>
        </div>
      </footer>
    </div>
  );
};

export default StabilityDashboard; 