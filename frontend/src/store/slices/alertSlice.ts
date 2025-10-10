import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { alertService } from '../../services/alertService';
import { Alert } from '../../types';
import { t } from "../../i18n";

interface AlertData {
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: string;
}

interface AlertState {
    alerts: AlertData[];
    selectedAlert: Alert | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: AlertState = {
    alerts: [],
    selectedAlert: null,
    isLoading: false,
    error: null,
};

export const fetchAllAlerts = createAsyncThunk(
    'alerts/fetchAll',
    async () => {
        return await alertService.getAll();
    }
);

export const fetchAlertById = createAsyncThunk(
    'alerts/fetchById',
    async (id: number) => {
        return await alertService.getById(id);
    }
);

export const acknowledgeAlert = createAsyncThunk(
    'alerts/acknowledge',
    async (id: number) => {
        return await alertService.acknowledge(id);
    }
);

export const resolveAlert = createAsyncThunk(
    'alerts/resolve',
    async (id: number) => {
        return await alertService.resolve(id);
    }
);

const alertSlice = createSlice({
    name: 'alert',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setSelectedAlert: (state, action) => {
            state.selectedAlert = action.payload;
        },
        addAlert: (state, action: PayloadAction<AlertData>) => {
            state.alerts.push(action.payload);
        },
        removeAlert: (state, action: PayloadAction<string>) => {
            state.alerts = state.alerts.filter(alert => alert.id !== action.payload);
        },
        clearAlerts: (state) => {
            state.alerts = [];
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
            .addCase(fetchAllAlerts.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAllAlerts.fulfilled, (state, action) => {
                state.isLoading = false;
                state.alerts = action.payload;
            })
            .addCase(fetchAllAlerts.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Error al cargar alertas';
            })
            .addCase(fetchAlertById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAlertById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.selectedAlert = action.payload;
            })
            .addCase(fetchAlertById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Error al cargar alerta';
            })
            .addCase(acknowledgeAlert.fulfilled, (state, action) => {
                const index = state.alerts.findIndex(a => a.id === action.payload.id);
                if (index !== -1) {
                    state.alerts[index] = action.payload;
                }
                if (state.selectedAlert?.id === action.payload.id) {
                    state.selectedAlert = action.payload;
                }
            })
            .addCase(resolveAlert.fulfilled, (state, action) => {
                const index = state.alerts.findIndex(a => a.id === action.payload.id);
                if (index !== -1) {
                    state.alerts[index] = action.payload;
                }
                if (state.selectedAlert?.id === action.payload.id) {
                    state.selectedAlert = action.payload;
                }
            });
    },
});

export const { clearError, setSelectedAlert, addAlert, removeAlert, clearAlerts, setLoading, setError } = alertSlice.actions;
export default alertSlice.reducer; 