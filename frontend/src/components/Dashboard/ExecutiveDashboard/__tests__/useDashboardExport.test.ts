import { renderHook } from '@testing-library/react';
import { useDashboardExport } from '../hooks/useDashboardExport';

// Mocks
jest.mock('../../../../hooks/usePDFExport', () => ({
    usePDFExport: () => ({
        exportTabToPDF: jest.fn(),
        exportEnhancedTabToPDF: jest.fn(),
        captureElement: jest.fn(),
        captureElementEnhanced: jest.fn()
    })
}));

jest.mock('../../../../hooks/useKPIs', () => ({
    useKPIs: () => ({
        states: { states: [], totalVehicles: 10, activeVehicles: 8, availabilityPercentage: 80 },
        activity: { km_total: 1000, driving_hours: 10 },
        stability: { total_incidents: 5, critical: 1, moderate: 2, light: 2 },
        quality: { indice_promedio: 0.9, calificacion: 'EXCELENTE', estrellas: '⭐⭐⭐⭐⭐' }
    })
}));

describe('useDashboardExport', () => {
    test('debe inicializar correctamente', () => {
        const { result } = renderHook(() => useDashboardExport());

        expect(typeof result.current.exportTab).toBe('function');
        expect(typeof result.current.exportFullDashboard).toBe('function');
        expect(result.current.exporting).toBe(false);
        expect(result.current.error).toBe(null);
    });

    test('debe proporcionar función exportTab', () => {
        const { result } = renderHook(() => useDashboardExport());

        expect(result.current.exportTab).toBeDefined();
        expect(typeof result.current.exportTab).toBe('function');
    });

    test('debe proporcionar función exportFullDashboard', () => {
        const { result } = renderHook(() => useDashboardExport());

        expect(result.current.exportFullDashboard).toBeDefined();
        expect(typeof result.current.exportFullDashboard).toBe('function');
    });

    test('debe manejar estado de exportación', () => {
        const { result } = renderHook(() => useDashboardExport());

        expect(result.current.exporting).toBe(false);
        expect(result.current.error).toBe(null);
    });
});

