// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Common Status Types
export type Status = 'active' | 'inactive' | 'maintenance';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type RiskLevel = 'high' | 'medium' | 'low' | 'normal';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';
export type AlertType = 'stability' | 'telemetry' | 'system';
export type UserRole = 'admin' | 'user';
export type ThemeMode = 'light' | 'dark';

// Base Entity Interface
export interface BaseEntity {
    id: string;
    createdAt: string;
    updatedAt: string;
}

// Chart Types
export interface ChartDataset {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
}

export interface ChartData {
    labels: string[];
    datasets: ChartDataset[];
}

// Notification Type
export interface Notification {
    id: number;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: string;
}

export interface GeoLocation {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
    timestamp?: string;
}

export interface WeatherConditions {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    precipitation: number;
    visibility: number;
    timestamp: string;
} 