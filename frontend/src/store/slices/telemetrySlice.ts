import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { telemetryService } from '../../services/telemetryService';
import { TelemetryData } from '../../types';
import { t } from "../../i18n";

interface TelemetryState {
    data: TelemetryData[];
    loading: boolean;
    error: string | null;
}

const initialState: TelemetryState = {
    data: [],
    loading: false,
    error: null
};

export const fetchCurrentTelemetry = createAsyncThunk(
    'telemetry/fetchCurrent',
    async (vehicleId: number) => {
        return await telemetryService.getCurrent(vehicleId);
    }
);

export const fetchHistoricalTelemetry = createAsyncThunk(
    'telemetry/fetchHistorical',
    async ({ vehicleId, startDate, endDate }: { vehicleId: number; startDate: string; endDate: string }) => {
        return await telemetryService.getHistory(vehicleId, startDate, endDate);
    }
);

export const uploadTelemetry = createAsyncThunk(
    'telemetry/upload',
    async (data: Partial<TelemetryData>) => {
        return await telemetryService.upload(data);
    }
);

const telemetrySlice = createSlice({
    name: 'telemetry',
    initialState,
    reducers: {
        setTelemetryData: (state, action: PayloadAction<TelemetryData[]>) => {
            state.data = action.payload;
        },
        addTelemetryData: (state, action: PayloadAction<TelemetryData>) => {
            state.data.push(action.payload);
            // Mantener solo los últimos 50 registros
            if (state.data.length > 50) {
                state.data.shift();
            }
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCurrentTelemetry.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCurrentTelemetry.fulfilled, (state, action) => {
                state.loading = false;
                state.data = [action.payload];
            })
            .addCase(fetchCurrentTelemetry.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Error al cargar telemetría actual';
            })
            .addCase(fetchHistoricalTelemetry.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchHistoricalTelemetry.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchHistoricalTelemetry.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Error al cargar historial de telemetría';
            })
            .addCase(uploadTelemetry.fulfilled, (state, action) => {
                state.data = [action.payload];
            });
    },
});

export const {
    setTelemetryData,
    addTelemetryData,
    setLoading,
    setError,
    clearError
} = telemetrySlice.actions;

export default telemetrySlice.reducer; 