import { useCallback } from 'react';
import { api } from '../lib/api';
import { authService } from '../services/auth';

interface StabilitySession {
    id: string;
    vehicleId: string;
    type: 'ROUTINE' | 'TEST';
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    startTime: string;
    endTime: string;
    userId: string;
    sessionNumber: number;
    sequence: number;
    createdAt: string;
    updatedAt: string;
}

export const useStability = () => {

    const uploadStabilityData = useCallback(async (file: File): Promise<StabilitySession> => {
        const formData = new FormData();
        formData.append('file', file);
        const token = authService.getToken();

        const response = await api.post('/stability/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    }, []);

    const getSessions = useCallback(async (): Promise<StabilitySession[]> => {
        const token = authService.getToken();
        const response = await api.get('/api/stability/sessions', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    }, []);

    const getSession = useCallback(async (id: string): Promise<StabilitySession> => {
        const token = authService.getToken();
        const response = await api.get(`/api/stability/sessions/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    }, []);

    return {
        uploadStabilityData,
        getSessions,
        getSession
    };
}; 