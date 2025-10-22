/**
 * useAI - Custom hook para interactuar con OpenAI Responses API
 * 
 * Proporciona métodos para:
 * - Chat multi-turno
 * - Análisis de riesgo
 * - Comparación de vehículos
 * - Detección de patrones
 * - Predicciones de mantenimiento
 */

import { useState, useCallback } from 'react';
import {
  aiService,
  ChatResponse,
  RiskAnalysis,
  VehicleComparison,
  PatternDetection,
  MaintenancePrediction,
} from '../services/ai.service';

interface UseAIReturn {
  // Estados
  loading: boolean;
  error: string | null;

  // Métodos
  chat: (
    message: string,
    previousResponseId?: string,
    includeContext?: boolean
  ) => Promise<ChatResponse | null>;
  analyzeRisk: (timeRange?: string) => Promise<RiskAnalysis | null>;
  compareVehicles: (
    vehicle1Id: string,
    vehicle2Id: string
  ) => Promise<VehicleComparison | null>;
  detectPatterns: (timeRange?: string) => Promise<PatternDetection | null>;
  predictMaintenance: (
    vehicleId: string
  ) => Promise<MaintenancePrediction | null>;

  // Utilidades
  clearError: () => void;
}

export const useAI = (): UseAIReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Limpia el error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Chat conversacional con OpenAI
   */
  const chat = useCallback(
    async (
      message: string,
      previousResponseId?: string,
      includeContext: boolean = true
    ): Promise<ChatResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await aiService.chat(
          message,
          previousResponseId,
          includeContext
        );
        return response;
      } catch (err: any) {
        const errorMessage =
          err.message || 'Error al comunicarse con la IA';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Análisis de riesgo estructurado
   */
  const analyzeRisk = useCallback(
    async (timeRange: string = '30d'): Promise<RiskAnalysis | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await aiService.analyzeRisk(timeRange);
        return response;
      } catch (err: any) {
        const errorMessage =
          err.message || 'Error al analizar el riesgo';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Comparación de vehículos
   */
  const compareVehicles = useCallback(
    async (
      vehicle1Id: string,
      vehicle2Id: string
    ): Promise<VehicleComparison | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await aiService.compareVehicles(
          vehicle1Id,
          vehicle2Id
        );
        return response;
      } catch (err: any) {
        const errorMessage =
          err.message || 'Error al comparar vehículos';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Detección de patrones
   */
  const detectPatterns = useCallback(
    async (timeRange: string = '7d'): Promise<PatternDetection | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await aiService.detectPatterns(timeRange);
        return response;
      } catch (err: any) {
        const errorMessage =
          err.message || 'Error al detectar patrones';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Predicciones de mantenimiento
   */
  const predictMaintenance = useCallback(
    async (vehicleId: string): Promise<MaintenancePrediction | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await aiService.predictMaintenance(vehicleId);
        return response;
      } catch (err: any) {
        const errorMessage =
          err.message || 'Error al generar predicciones';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    chat,
    analyzeRisk,
    compareVehicles,
    detectPatterns,
    predictMaintenance,
    clearError,
  };
};

