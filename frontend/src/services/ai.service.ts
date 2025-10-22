/**
 * AIService - Servicio para consumir endpoints de OpenAI Responses API
 * 
 * Endpoints disponibles:
 * - POST /api/ai/chat - Chat multi-turno con GPT-5
 * - POST /api/ai/risk/analyze - Análisis de riesgo estructurado
 * - POST /api/ai/vehicles/compare - Comparación de vehículos
 * - POST /api/ai/patterns/detect - Detección de patrones
 * - POST /api/ai/maintenance/predict - Predicciones de mantenimiento
 */

import { API_URL } from '../config/api';

// ==================== TIPOS E INTERFACES ====================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
  timestamp: string;
}

export interface ChatResponse {
  id: string;
  message: string;
  reasoning?: string;
  responseId: string;
  model: string;
  timestamp: string;
}

export interface RiskAnalysis {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  factors: Array<{
    factor: string;
    impact: number;
    mitigation: string;
  }>;
  recommendations: Array<{
    priority: string;
    action: string;
    timeline: string;
  }>;
  summary: string;
}

export interface VehicleComparison {
  comparison: string;
  reasoning: string;
  winner: string;
  metrics: any;
}

export interface PatternDetection {
  id: string;
  patterns: string;
  reasoning?: string;
  metadata: {
    model: string;
    created_at: number;
    response_id: string;
  };
}

export interface MaintenancePrediction {
  id: string;
  predictions: string;
  reasoning?: string;
  metadata: {
    model: string;
    created_at: number;
    response_id: string;
  };
}

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==================== SERVICIO ====================

class AIService {
  /**
   * Realiza una petición HTTP a la API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('No estás autenticado. Por favor, inicia sesión.');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Error ${response.status}: ${response.statusText}`
      );
    }

    const data: APIResponse<T> = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Error en la respuesta de la API');
    }

    return data.data as T;
  }

  /**
   * Chat conversacional con OpenAI (GPT-5)
   * Soporta multi-turno con previousResponseId
   */
  async chat(
    message: string,
    previousResponseId?: string,
    includeContext: boolean = true
  ): Promise<ChatResponse> {
    return this.request<ChatResponse>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        previousResponseId,
        includeContext: !previousResponseId && includeContext,
      }),
    });
  }

  /**
   * Análisis de riesgo estructurado con JSON Schema
   */
  async analyzeRisk(timeRange: string = '30d'): Promise<RiskAnalysis> {
    return this.request<RiskAnalysis>('/api/ai/risk/analyze', {
      method: 'POST',
      body: JSON.stringify({ timeRange }),
    });
  }

  /**
   * Comparación de vehículos con reasoning
   */
  async compareVehicles(
    vehicle1Id: string,
    vehicle2Id: string
  ): Promise<VehicleComparison> {
    return this.request<VehicleComparison>('/api/ai/vehicles/compare', {
      method: 'POST',
      body: JSON.stringify({ vehicle1Id, vehicle2Id }),
    });
  }

  /**
   * Detección de patrones con code_interpreter
   */
  async detectPatterns(timeRange: string = '7d'): Promise<PatternDetection> {
    return this.request<PatternDetection>('/api/ai/patterns/detect', {
      method: 'POST',
      body: JSON.stringify({ timeRange }),
    });
  }

  /**
   * Predicciones de mantenimiento
   */
  async predictMaintenance(
    vehicleId: string
  ): Promise<MaintenancePrediction> {
    return this.request<MaintenancePrediction>('/api/ai/maintenance/predict', {
      method: 'POST',
      body: JSON.stringify({ vehicleId }),
    });
  }
}

// Exportar instancia singleton
export const aiService = new AIService();

