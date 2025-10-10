import { useState, useEffect, useRef, useCallback } from 'react';
import { TelemetryData, VehicleConfig } from '../types';
import { DEFAULT_VEHICLE_CONFIG } from '../config/stabilityConfig';

interface UseTelemetryDataProps {
  vehicleId?: string;
  simulationMode?: boolean;
  samplingRate?: number; // Hz
  timeWindow?: number; // segundos
  decimationFactor?: number; // Factor para reducir cantidad de puntos
}

interface UseTelemetryDataResult {
  telemetryData: TelemetryData[];
  vehicleConfig: VehicleConfig;
  isRunning: boolean;
  toggleRunning: () => void;
  setTimeWindow: (window: number) => void;
  setDecimationFactor: (factor: number) => void;
  clearData: () => void;
  lastError: string | null;
}

/**
 * Hook para gestionar datos de telemetría en tiempo real
 * Soporta modo simulación o conexión WebSocket
 */
export function useTelemetryData({
  vehicleId,
  simulationMode = false,
  samplingRate = 100,
  timeWindow = 60,
  decimationFactor = 1
}: UseTelemetryDataProps): UseTelemetryDataResult {
  // Estados
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);
  const [vehicleConfig, setVehicleConfig] = useState<VehicleConfig>(DEFAULT_VEHICLE_CONFIG);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [currentTimeWindow, setCurrentTimeWindow] = useState<number>(timeWindow);
  const [currentDecimation, setCurrentDecimation] = useState<number>(decimationFactor);
  const [lastError, setLastError] = useState<string | null>(null);
  
  // Referencias
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Función para generar datos simulados
  const getSimulatedData = useCallback((): TelemetryData => {
    const now = Date.now();
    const time = now / 1000; // tiempo en segundos
    
    // Simulación de conducción en curva con aceleración lateral
    const lateralAcc = 0.2 * Math.sin(time * 0.1) + 0.1 * Math.sin(time * 0.5) + 0.05 * (Math.random() - 0.5);
    const rollAngle = 3 * Math.sin(time * 0.1) + 2 * Math.sin(time * 0.3) + 1 * (Math.random() - 0.5);
    const pitchAngle = 1 * Math.sin(time * 0.2) + 0.5 * (Math.random() - 0.5);
    const speed = 60 + 20 * Math.sin(time * 0.05) + 5 * (Math.random() - 0.5);
    
    return {
      timestamp: now,
      acceleration_x: 0.1 * Math.sin(time * 0.3) + 0.05 * (Math.random() - 0.5),
      acceleration_y: lateralAcc,
      acceleration_z: -1.0 + 0.1 * Math.sin(time * 0.2) + 0.05 * (Math.random() - 0.5),
      gyro_x: 0.5 * Math.sin(time * 0.3) + 0.2 * (Math.random() - 0.5),
      gyro_y: 0.3 * Math.sin(time * 0.4) + 0.2 * (Math.random() - 0.5),
      gyro_z: 0.2 * Math.sin(time * 0.5) + 0.1 * (Math.random() - 0.5),
      angular_x: rollAngle,
      angular_y: pitchAngle,
      angular_z: 1 * Math.sin(time * 0.1) + 0.5 * (Math.random() - 0.5),
      speed: speed,
      lateral_acc: lateralAcc,
      roll_angle: rollAngle,
      pitch_angle: pitchAngle
    };
  }, []);
  
  // Función para añadir nuevos datos
  const addNewData = useCallback((newData: TelemetryData) => {
    setTelemetryData(prevData => {
      // Filtrar datos antiguos si exceden la ventana de tiempo
      const now = Date.now();
      const cutoffTime = now - (currentTimeWindow + 5) * 1000; // +5 segundos de margen
      
      const filteredPrevData = prevData.filter(d => d.timestamp > cutoffTime);
      
      // Aplicar decimación en tiempo real si es necesario
      if (currentDecimation > 1 && filteredPrevData.length > 0) {
        // Solo añadir datos si ha pasado suficiente tiempo desde el último punto
        const lastPoint = filteredPrevData[filteredPrevData.length - 1];
        if (newData.timestamp - lastPoint.timestamp < (1000 / samplingRate) * currentDecimation) {
          return filteredPrevData;
        }
      }
      
      return [...filteredPrevData, newData];
    });
  }, [currentTimeWindow, currentDecimation, samplingRate]);
  
  // Función para conectar al WebSocket
  const connectWebSocket = useCallback(() => {
    if (!vehicleId || !isRunning || simulationMode) return;
    
    try {
      // URL del WebSocket (ajustar según la implementación real)
      const wsUrl = `wss://api.example.com/telemetry/${vehicleId}`;
      
      // Cerrar conexión anterior si existe
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      // Crear nueva conexión
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connection established');
        setLastError(null);
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as TelemetryData;
          addNewData(data);
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
          setLastError(`Error al procesar datos: ${error instanceof Error ? error.message : String(error)}`);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setLastError(`Error de conexión WebSocket: ${String(error)}`);
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket connection closed');
        
        // Intentar reconectar después de un retraso
        setTimeout(() => {
          if (isRunning && !simulationMode) {
            connectWebSocket();
          }
        }, 3000);
      };
    } catch (error) {
      console.error('Error establishing WebSocket connection:', error);
      setLastError(`Error al establecer conexión: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [vehicleId, isRunning, simulationMode, addNewData]);
  
  // Función para cargar configuración del vehículo
  const loadVehicleConfig = useCallback(async () => {
    if (!vehicleId) {
      // Si no hay ID de vehículo, usar configuración por defecto
      setVehicleConfig(DEFAULT_VEHICLE_CONFIG);
      return;
    }
    
    try {
      // En una implementación real, esto cargaría la configuración desde una API
      // Por ahora, simulamos una carga con un timeout
      setTimeout(() => {
        // Configuración simulada basada en el ID del vehículo
        const config: VehicleConfig = {
          ...DEFAULT_VEHICLE_CONFIG,
          id: vehicleId,
          name: `Vehículo ${vehicleId}`
        };
        
        setVehicleConfig(config);
      }, 500);
    } catch (error) {
      console.error('Error loading vehicle configuration:', error);
      setLastError(`Error al cargar configuración: ${error instanceof Error ? error.message : String(error)}`);
      
      // En caso de error, usar configuración por defecto
      setVehicleConfig(DEFAULT_VEHICLE_CONFIG);
    }
  }, [vehicleId]);
  
  // Función para iniciar/parar simulación
  const startStopSimulation = useCallback(() => {
    if (!simulationMode || !isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    
    // Iniciar simulación
    intervalRef.current = setInterval(() => {
      const newData = getSimulatedData();
      addNewData(newData);
    }, 1000 / samplingRate);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [simulationMode, isRunning, samplingRate, getSimulatedData, addNewData]);
  
  // Efecto para cargar la configuración del vehículo
  useEffect(() => {
    loadVehicleConfig();
  }, [loadVehicleConfig]);
  
  // Efecto para iniciar/parar simulación
  useEffect(() => {
    startStopSimulation();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [startStopSimulation]);
  
  // Efecto para conectar/desconectar el WebSocket
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connectWebSocket]);
  
  // Funciones para controlar el funcionamiento
  const toggleRunning = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);
  
  const setTimeWindow = useCallback((window: number) => {
    setCurrentTimeWindow(window);
  }, []);
  
  const setDecimationFactor = useCallback((factor: number) => {
    setCurrentDecimation(factor);
  }, []);
  
  const clearData = useCallback(() => {
    setTelemetryData([]);
  }, []);
  
  return {
    telemetryData,
    vehicleConfig,
    isRunning,
    toggleRunning,
    setTimeWindow,
    setDecimationFactor,
    clearData,
    lastError
  };
} 