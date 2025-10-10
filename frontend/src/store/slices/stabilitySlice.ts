import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { stabilityService } from '../../services/stabilityService';
import { t } from "../../i18n";

export interface StabilityData {
    id: string;
    roll: number;
    pitch: number;
    yaw: number;
    timestamp: number;
}

interface StabilityState {
    currentData: StabilityData | null;
    historicalData: StabilityData[];
    isLoading: boolean;
    error: string | null;
    data: StabilityData[];
}

const initialState: StabilityState = {
    currentData: null,
    historicalData: [],
    isLoading: false,
    error: null,
    data: [],
};

export const fetchCurrentStability = createAsyncThunk(
    'stability/fetchCurrent',
    async (vehicleId: number) => {
        return await stabilityService.getCurrent(vehicleId);
    }
);

export const fetchHistoricalStability = createAsyncThunk(
    'stability/fetchHistorical',
    async ({ vehicleId, startDate, endDate }: { vehicleId: number; startDate: string; endDate: string }) => {
        return await stabilityService.getHistory(vehicleId, startDate, endDate);
    }
);

export const analyzeStability = createAsyncThunk(
    'stability/analyze',
    async (data: Partial<StabilityData>) => {
        return await stabilityService.analyze(data);
    }
);

const stabilitySlice = createSlice({
    name: 'stability',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearHistoricalData: (state) => {
            state.historicalData = [];
        },
        addStabilityData: (state, action: PayloadAction<StabilityData>) => {
            state.data.push(action.payload);
        },
        clearStabilityData: (state) => {
            state.data = [];
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCurrentStability.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchCurrentStability.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentData = action.payload;
            })
            .addCase(fetchCurrentStability.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Error al cargar estabilidad actual';
            })
            .addCase(fetchHistoricalStability.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchHistoricalStability.fulfilled, (state, action) => {
                state.isLoading = false;
                state.historicalData = action.payload;
            })
            .addCase(fetchHistoricalStability.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Error al cargar historial de estabilidad';
            })
            .addCase(analyzeStability.fulfilled, (state, action) => {
                state.currentData = action.payload;
            });
    },
});

export const { clearError, clearHistoricalData, addStabilityData, clearStabilityData, setLoading, setError } = stabilitySlice.actions;
export const stabilityReducer = stabilitySlice.reducer; 