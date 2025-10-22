import { renderHook, waitFor } from '@testing-library/react';
import { apiService } from '../../../../services/api';
import { useDashboardMaps } from '../hooks/useDashboardMaps';

// Mock del apiService
jest.mock('../../../../services/api');
const mockedApiService = apiService as jest.Mocked<typeof apiService>;

// Mock del hook useGlobalFilters
jest.mock('../../../../hooks/useGlobalFilters', () => ({
    useGlobalFilters: () => ({
        filters: {
            dateRange: { start: '2025-01-01', end: '2025-01-31' },
            vehicles: ['vehicle-1'],
            rotativo: 'all',
            severity: []
        }
    })
}));

describe('useDashboardMaps', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('debe inicializar con datos vacíos', () => {
        const { result } = renderHook(() => useDashboardMaps());

        expect(result.current.heatmapData).toEqual({ points: [], routes: [], geofences: [] });
        expect(result.current.speedViolations).toEqual([]);
        expect(result.current.blackSpotsData).toEqual({ clusters: [], ranking: [] });
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
    });

    test('debe manejar errores de API en loadHeatmapData', async () => {
        mockedApiService.get.mockRejectedValueOnce(new Error('API Error'));

        const { result } = renderHook(() => useDashboardMaps());

        // Esperar a que termine la carga
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBe('API Error');
        expect(result.current.heatmapData).toEqual({ points: [], routes: [], geofences: [] });
    });

    test('debe cargar datos de heatmap exitosamente', async () => {
        const mockHeatmapData = {
            points: [{ lat: 40.4168, lng: -3.7038, intensity: 0.8 }],
            routes: [],
            geofences: []
        };

        mockedApiService.get.mockResolvedValueOnce({
            data: {
                success: true,
                data: mockHeatmapData
            }
        });

        const { result } = renderHook(() => useDashboardMaps());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.heatmapData).toEqual(mockHeatmapData);
        expect(result.current.error).toBe(null);
    });

    test('debe proporcionar función reload que recarga todos los datos', async () => {
        const { result } = renderHook(() => useDashboardMaps());

        expect(typeof result.current.reload).toBe('function');

        mockedApiService.get.mockResolvedValue({
            data: {
                success: true,
                data: { points: [], routes: [], geofences: [] }
            }
        });

        await result.current.reload();

        expect(mockedApiService.get).toHaveBeenCalled();
    });
});

