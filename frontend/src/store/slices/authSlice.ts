import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { userService } from '../../services/userService';
import { LoginForm, RegisterForm, User } from '../../types';
import { t } from "../../i18n";

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    token: localStorage.getItem('auth_token'),
    isLoading: false,
    error: null,
};

export const login = createAsyncThunk<{ user: User; token: string }, LoginForm>(
    'auth/login',
    async (data: LoginForm, { rejectWithValue }) => {
        try {
            const response = await userService.login(data);
            localStorage.setItem('auth_token', response.access_token);
            return { user: response.user, token: response.access_token };
        } catch (error) {
            if (error instanceof Error) {
                return rejectWithValue(error.message);
            }
            return rejectWithValue('Error al iniciar sesión');
        }
    }
);

export const register = createAsyncThunk<{ user: User; token: string }, RegisterForm>(
    'auth/register',
    async (data: RegisterForm, { rejectWithValue }) => {
        try {
            const response = await userService.register(data);
            localStorage.setItem('auth_token', response.access_token);
            return { user: response.user, token: response.access_token };
        } catch (error) {
            if (error instanceof Error) {
                return rejectWithValue(error.message);
            }
            return rejectWithValue('Error al registrarse');
        }
    }
);

export const getCurrentUser = createAsyncThunk<User>(
    'auth/getCurrentUser',
    async (_, { rejectWithValue }) => {
        try {
            return await userService.me();
        } catch (error) {
            if (error instanceof Error) {
                return rejectWithValue(error.message);
            }
            return rejectWithValue('Error al obtener el usuario');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            localStorage.removeItem('auth_token');
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.error = null;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string || 'Error al iniciar sesión';
            })
            .addCase(register.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.error = null;
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string || 'Error al registrarse';
            })
            .addCase(getCurrentUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getCurrentUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
                state.error = null;
            })
            .addCase(getCurrentUser.rejected, (state, action) => {
                state.isLoading = false;
                state.user = null;
                state.token = null;
                state.error = action.payload as string || 'Error al obtener el usuario';
                localStorage.removeItem('auth_token');
            });
    },
});

export const { logout, clearError } = authSlice.actions;
export const authReducer = authSlice.reducer; 