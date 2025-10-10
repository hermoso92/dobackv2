import { BaseEntity, UserRole } from './common';
// Backend Types
export interface UserDTO extends BaseEntity {
    email: string;
    name: string;
    role: string;
    created_at: string;
    updated_at: string;
}

// Frontend Types
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
    createdAt: string;
    updatedAt: string;
}

export interface UserUpdate {
    name?: string;
    email?: string;
    password?: string;
}

// Form Types
export interface LoginForm {
    email: string;
    password: string;
}

export interface RegisterForm {
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'user';
}

// API Response Types
export interface AuthResponse {
    user: User;
    access_token: string;
    refresh_token: string;
}

// Context Types
export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

// Transformation Functions
export const mapUserDTOToUser = (dto: UserDTO): User => ({
    id: dto.id,
    email: dto.email,
    name: dto.name,
    role: dto.role.toLowerCase() as UserRole,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at
}); 