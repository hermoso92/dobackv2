import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { vehicleService } from '../../services/vehicleService';
import { Vehicle } from '../../types';
import { t } from "../../i18n";

interface VehicleState {
    vehicles: Vehicle[];
    selectedVehicle: Vehicle | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: VehicleState = {
    vehicles: [],
    selectedVehicle: null,
    isLoading: false,
    error: null,
};

export const fetchVehicles = createAsyncThunk(
    'vehicles/fetchAll',
    async () => {
        return await vehicleService.getAll();
    }
);

export const fetchVehicleById = createAsyncThunk(
    'vehicles/fetchById',
    async (id: number) => {
        return await vehicleService.getById(id);
    }
);

export const createVehicle = createAsyncThunk(
    'vehicles/create',
    async (data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => {
        return await vehicleService.create(data);
    }
);

export const updateVehicle = createAsyncThunk(
    'vehicles/update',
    async ({ id, data }: { id: number; data: Partial<Vehicle> }) => {
        return await vehicleService.update(id, data);
    }
);

export const deleteVehicle = createAsyncThunk(
    'vehicles/delete',
    async (id: number) => {
        await vehicleService.delete(id);
        return id;
    }
);

const vehicleSlice = createSlice({
    name: 'vehicles',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setSelectedVehicle: (state, action) => {
            state.selectedVehicle = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchVehicles.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchVehicles.fulfilled, (state, action) => {
                state.isLoading = false;
                state.vehicles = action.payload;
            })
            .addCase(fetchVehicles.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Error al cargar vehículos';
            })
            .addCase(fetchVehicleById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchVehicleById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.selectedVehicle = action.payload;
            })
            .addCase(fetchVehicleById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Error al cargar vehículo';
            })
            .addCase(createVehicle.fulfilled, (state, action) => {
                state.vehicles.push(action.payload);
            })
            .addCase(updateVehicle.fulfilled, (state, action) => {
                const index = state.vehicles.findIndex(v => v.id === action.payload.id);
                if (index !== -1) {
                    state.vehicles[index] = action.payload;
                }
                if (state.selectedVehicle?.id === action.payload.id) {
                    state.selectedVehicle = action.payload;
                }
            })
            .addCase(deleteVehicle.fulfilled, (state, action) => {
                state.vehicles = state.vehicles.filter(v => v.id !== action.payload);
                if (state.selectedVehicle?.id === action.payload) {
                    state.selectedVehicle = null;
                }
            });
    },
});

export const { clearError, setSelectedVehicle } = vehicleSlice.actions;
export const vehicleReducer = vehicleSlice.reducer; 