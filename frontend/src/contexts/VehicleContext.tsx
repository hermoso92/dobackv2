import React, { createContext, ReactNode, useContext, useState } from 'react';

interface Vehicle {
    id: string;
    name: string;
    identifier: string;
    licensePlate?: string;
    type: string;
    status: string;
    parkId?: string;
}

interface VehicleContextType {
    selectedVehicle: Vehicle | null;
    setSelectedVehicle: (vehicle: Vehicle | null) => void;
    clearSelectedVehicle: () => void;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

interface VehicleProviderProps {
    children: ReactNode;
}

export const VehicleProvider: React.FC<VehicleProviderProps> = ({ children }) => {
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

    const clearSelectedVehicle = () => {
        setSelectedVehicle(null);
    };

    const value = {
        selectedVehicle,
        setSelectedVehicle,
        clearSelectedVehicle
    };

    return (
        <VehicleContext.Provider value={value}>
            {children}
        </VehicleContext.Provider>
    );
};

export const useVehicleContext = () => {
    const context = useContext(VehicleContext);
    if (context === undefined) {
        throw new Error('useVehicleContext must be used within a VehicleProvider');
    }
    return context;
}; 