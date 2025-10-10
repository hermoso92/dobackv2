import { ThemeProvider, createTheme } from '@mui/material/styles';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { FEATURE_FLAGS } from '../../config/featureFlags';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../services/organizationService';
import TelemetryKPIGrid from '../TelemetryKPIGrid';

// Mock de las dependencias
jest.mock('../../contexts/AuthContext');
jest.mock('../../services/organizationService');
jest.mock('../../config/constants');

// Mock de fetch
global.fetch = jest.fn();

const theme = createTheme();

const MockProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ThemeProvider theme={theme}>
        // <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={{}}>
            {children}
        // </LocalizationProvider>
    </ThemeProvider>
);

describe('TelemetryKPIGrid', () => {
    const mockUser = {
        id: 'user-123',
        email: 'test@dobacksoft.com',
        name: 'Test User',
        role: 'ADMIN',
        organizationId: 'org-123',
        timezone: 'Europe/Madrid'
    };

    const mockParks = [
        { id: 'park1', name: 'Parque Central' },
        { id: 'park2', name: 'Parque Norte' }
    ];

    const mockVehicles = [
        { id: 'veh1', name: 'Bomba 1', plate: 'M-1234-BM' },
        { id: 'veh2', name: 'Bomba 2', plate: 'M-5678-BM' }
    ];

    const mockKPIData = [
        {
            id: 'kpi-1',
            vehicleId: 'veh1',
            date: '2024-01-15',
            organizationId: 'org-123',
            tiempoEnParque: 480,
            tiempoEnTaller: 120,
            tiempoFueraParque: 840,
            eventosCriticos: 2,
            eventosPeligrosos: 5,
            eventosModerados: 12,
            eventosLeves: 25,
            tiempoExcediendoVelocidad: 15,
            excesosVelocidadTotal: 3,
            maxVelocidadAlcanzada: 85.5,
            velocidadPromedio: 45.2,
            distanciaRecorrida: 125.8,
            totalTiempo: 1440
        }
    ];

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Mock feature flags
        (FEATURE_FLAGS as any).DASHBOARD_KPIS = true;

        // Mock auth context
        (useAuth as jest.Mock).mockReturnValue({
            user: mockUser
        });

        // Mock organization service
        (useOrganization as jest.Mock).mockReturnValue({
            getOrganizationId: jest.fn().mockResolvedValue('org-123'),
            getOrganizationParks: jest.fn().mockResolvedValue(mockParks),
            getOrganizationVehicles: jest.fn().mockResolvedValue(mockVehicles)
        });

        // Mock fetch
        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                success: true,
                data: mockKPIData,
                count: mockKPIData.length
            })
        });
    });

    it('should render KPI grid when feature flag is enabled', async () => {
        render(
            <MockProviders>
                <TelemetryKPIGrid token="test-token" />
            </MockProviders>
        );

        await waitFor(() => {
            expect(screen.getByText('KPIs de Telemetría')).toBeInTheDocument();
        });

        expect(screen.getByText('Filtros')).toBeInTheDocument();
        expect(screen.getByText('Parque')).toBeInTheDocument();
        expect(screen.getByText('Vehículo')).toBeInTheDocument();
    });

    it('should not render when feature flag is disabled', () => {
        (FEATURE_FLAGS as any).DASHBOARD_KPIS = false;

        render(
            <MockProviders>
                <TelemetryKPIGrid token="test-token" />
            </MockProviders>
        );

        expect(screen.queryByText('KPIs de Telemetría')).not.toBeInTheDocument();
    });

    it('should load and display KPI data', async () => {
        render(
            <MockProviders>
                <TelemetryKPIGrid token="test-token" />
            </MockProviders>
        );

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('/api/telemetry/kpis', expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: expect.stringContaining('org-123')
            }));
        });
    });

    it('should handle filter changes', async () => {
        render(
            <MockProviders>
                <TelemetryKPIGrid token="test-token" />
            </MockProviders>
        );

        await waitFor(() => {
            expect(screen.getByText('Parque')).toBeInTheDocument();
        });

        const parkSelect = screen.getByLabelText('Parque');
        fireEvent.mouseDown(parkSelect);

        await waitFor(() => {
            expect(screen.getByText('Parque Central')).toBeInTheDocument();
        });
    });

    it('should show loading state', () => {
        (fetch as jest.Mock).mockImplementation(() => new Promise(() => { })); // Never resolves

        render(
            <MockProviders>
                <TelemetryKPIGrid token="test-token" />
            </MockProviders>
        );

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should show error state', async () => {
        (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

        render(
            <MockProviders>
                <TelemetryKPIGrid token="test-token" />
            </MockProviders>
        );

        await waitFor(() => {
            expect(screen.getByText(/Error al cargar datos de KPIs/)).toBeInTheDocument();
        });
    });

    it('should display KPI cards with correct data', async () => {
        render(
            <MockProviders>
                <TelemetryKPIGrid token="test-token" />
            </MockProviders>
        );

        await waitFor(() => {
            expect(screen.getByText('Tiempo en Parque')).toBeInTheDocument();
            expect(screen.getByText('Tiempo en Taller')).toBeInTheDocument();
            expect(screen.getByText('Tiempo Fuera Parque')).toBeInTheDocument();
            expect(screen.getByText('Eventos Críticos')).toBeInTheDocument();
            expect(screen.getByText('Eventos Peligrosos')).toBeInTheDocument();
            expect(screen.getByText('Excesos de Velocidad')).toBeInTheDocument();
        });
    });
});
