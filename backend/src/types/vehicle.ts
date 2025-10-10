import { z } from 'zod';
import { VehicleStatus, VehicleType } from './enums';

export interface VehicleSession<T> {
    header: {
        fileName?: string;
        vehicleId?: string;
        driverId?: string;
        timestamp?: Date;
    };
    data: T[];
}

export interface StabilityData {
    timestamp: Date;
    lateralG: number;
    longitudinalG: number;
    verticalG: number;
    rollAngle: number;
    pitchAngle: number;
    dynamicRolloverScore: number;
}

export interface CANData {
    timestamp: Date;
    engineRPM: number;
    vehicleSpeed: number;
    engineLoad: number;
    engineTemp: number;
    alarms: string[];
}

export interface GPSData {
    timestamp: Date;
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    acceleration: number;
    satellites: number;
    precision: number;
    isHighSpeed: boolean;
    isHighAcceleration: boolean;
    isHighPrecision: boolean;
}

export const vehicleSchema = z.object({
    id: z.string(),
    name: z.string(),
    model: z.string(),
    licensePlate: z.string(),
    identifier: z.string(),
    type: z.nativeEnum(VehicleType),
    status: z.nativeEnum(VehicleStatus),
    isActive: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export type Vehicle = z.infer<typeof vehicleSchema>;
