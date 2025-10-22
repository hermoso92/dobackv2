import { renderHook, waitFor } from '@testing-library/react';
import { apiService } from '../../../../services/api';
import { useDashboardParks } from '../hooks/useDashboardParks';

// Mock del apiService
jest.mock('../../../../services/api');
const mockedApiService = apiService as jest.Mocked<typeof apiService>;

describe('useDashboardParks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('debe inicializar con datos vacíos', () => {
        const { result } = renderHook(() => useDashboardParks());

        expect(result.current.parksKPIs).toEqual({
            vehiclesInParks: 0,
            vehiclesOutOfParks: 0,
            averageTimeOutside: 0,
            parkEntriesToday: 0,
            parkExitsToday: 0,
            parksData: []
        });
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
    });

    test('debe cargar KPIs de parques exitosamente', async () => {
        const mockParks = [{ id: 'park-1', name: 'Parque Las Rozas' }];
        const mockVehicles = [
            { id: 'v1', parkId: 'park-1' },
            { id: 'v2', parkId: null }
        ];
        const mockEvents = [
            { event_type: 'ENTER', timestamp: new Date().toISOString() },
            { event_type: 'EXIT', timestamp: new Date().toISOString() }
        ];

        mockedApiService.get
            .mockResolvedValueOnce({ data: { success: true, data: mockParks } })
            .mockResolvedValueOnce({ data: { success: true, data: mockVehicles } })
            .mockResolvedValueOnce({ data: { success: true, data: mockEvents } });

        const { result } = renderHook(() => useDashboardParks());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.parksKPIs.vehiclesInParks).toBe(1);
        expect(result.current.parksKPIs.vehiclesOutOfParks).toBe(1);
        expect(result.current.parksKPIs.parkEntriesToday).toBe(1);
        expect(result.current.parksKPIs.parkExitsToday).toBe(1);
        expect(result.current.error).toBe(null);
    });

    test('debe manejar errores de API', async () => {
        mockedApiService.get.mockRejectedValueOnce(new Error('API Error'));

        const { result } = renderHook(() => useDashboardParks());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBe('API Error');
    });

    test('debe proporcionar función reload', async () => {
        const { result } = renderHook(() => useDashboardParks());

        expect(typeof result.current.reload).toBe('function');

        mockedApiService.get.mockResolvedValue({
            data: { success: true, data: [] }
        });

        await result.current.reload();

        expect(mockedApiService.get).toHaveBeenCalled();
    });
});

