import { get, post } from './api';

export interface Alert {
    id: string;
    type: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
    timestamp: string;
    status: 'pending' | 'acknowledged' | 'resolved';
}

export const alertService = {
    getAll: async (): Promise<Alert[]> => {
        return get('/alerts');
    },

    getById: async (id: string): Promise<Alert> => {
        return get(`/alerts/${id}`);
    },

    acknowledge: async (id: string): Promise<void> => {
        return post(`/alerts/${id}/acknowledge`, {});
    },

    resolve: async (id: string): Promise<void> => {
        return post(`/alerts/${id}/resolve`, {});
    }
}; 