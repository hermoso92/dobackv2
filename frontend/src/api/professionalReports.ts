import { apiService } from '../services/api';
import { authService } from '../services/auth';
import { logger } from '../utils/logger';

export interface ProfessionalReportConfig {
  sessionId: string;
  title?: string;
  includeClusterAnalysis?: boolean;
  includeMaps?: boolean;
  includeCharts?: boolean;
  includeRecommendations?: boolean;
  filters?: {
    speedFilter?: string;
    rpmFilter?: string;
    selectedTypes?: string[];
    severityLevels?: string[];
  };
  clusteringOptions?: {
    enabled?: boolean;
    spatialRadius?: number;
    temporalWindow?: number;
    minEventsPerCluster?: number;
  };
}

export interface ProfessionalReportResult {
  reportId: string;
  fileName: string;
  filePath: string;
  size: number;
  downloadUrl: string;
  generatedAt: string;
}

export interface ProfessionalReportPreview {
  sessionId: string;
  sessionInfo: {
    vehicle: string;
    startTime: string;
    endTime: string;
    duration: number;
  };
  metrics: {
    totalEvents: number;
    maxSpeed: number;
    averageSpeed: number;
    avgStabilityIndex: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
  };
  clusteringSummary?: {
    totalClusters: number;
    reductionPercentage: number;
  };
  recommendations: string[];
  estimatedPages: number;
  filters: any;
}

export interface PreviewFilters {
  speedFilter?: string;
  rpmFilter?: string;
  selectedTypes?: string[];
  clusteringEnabled?: boolean;
}

class ProfessionalReportApi {
  private readonly basePath = '/api/reports/professional';

  async generate(config: ProfessionalReportConfig): Promise<ProfessionalReportResult> {
    try {
      const response = await apiService.post<ProfessionalReportResult>(`${this.basePath}`, config);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error || 'Respuesta invalida del servidor');
    } catch (error) {
      console.error('Error generando reporte:', error);
      throw new Error('Error generando el reporte profesional');
    }
  }

  async getPreview(sessionId: string, filters?: PreviewFilters): Promise<ProfessionalReportPreview> {
    try {
      const params = new URLSearchParams();

      if (filters?.speedFilter) {
        params.append('speedFilter', filters.speedFilter);
      }

      if (filters?.rpmFilter) {
        params.append('rpmFilter', filters.rpmFilter);
      }

      if (filters?.selectedTypes) {
        filters.selectedTypes.forEach((type) => {
          params.append('selectedTypes', type);
        });
      }

      if (filters?.clusteringEnabled !== undefined) {
        params.append('clusteringEnabled', filters.clusteringEnabled.toString());
      }

      const url = `${this.basePath}/preview/${sessionId}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiService.get<ProfessionalReportPreview>(url);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error || 'Respuesta invalida del servidor');
    } catch (error) {
      console.error('Error obteniendo preview:', error);
      throw new Error('Error obteniendo vista previa del reporte');
    }
  }

  async download(reportId: string): Promise<void> {
    try {
      const token = authService.getToken();
      if (!token) {
        logger.error('No se encontro token JWT para la descarga');
        throw new Error('No autenticado');
      }
      const url = `${this.basePath}/download/${reportId}`;
      logger.info('Iniciando descarga de reporte profesional', { reportId, url });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        logger.error('Error descargando el reporte', { status: response.status, statusText: response.statusText });
        throw new Error('Error descargando el reporte');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `reporte-profesional-${reportId}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(downloadUrl);
      logger.info('Descarga de reporte profesional completada', { reportId });
    } catch (error) {
      logger.error('Error descargando reporte:', error);
      throw error;
    }
  }

  getDownloadUrl(reportId: string): string {
    return `${this.basePath}/download/${reportId}`;
  }

  getDefaultConfig(sessionId: string): ProfessionalReportConfig {
    return {
      sessionId,
      title: '',
      includeClusterAnalysis: true,
      includeMaps: true,
      includeCharts: true,
      includeRecommendations: true,
      filters: {
        speedFilter: 'all',
        rpmFilter: 'all',
        selectedTypes: [],
        severityLevels: [],
      },
      clusteringOptions: {
        enabled: true,
        spatialRadius: 50,
        temporalWindow: 30,
        minEventsPerCluster: 2,
      },
    };
  }
}

export const professionalReportApi = new ProfessionalReportApi();