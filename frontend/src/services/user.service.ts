import { User } from '../types/user';
import { del, get, post, put } from './api';

export const userService = {
    async getAll(): Promise<User[]> {
        const response = await get<User[]>('/users');
        return response.data;
    },

    async getById(id: string): Promise<User> {
        const response = await get<User>(`/users/${id}`);
        return response.data;
    },

    async create(data: Partial<User>): Promise<User> {
        const response = await post<User>('/users', data);
        return response.data;
    },

    async update(id: string, data: Partial<User>): Promise<User> {
        const response = await put<User>(`/users/${id}`, data);
        return response.data;
    },

    async delete(id: string): Promise<void> {
        await del(`/users/${id}`);
    }
}; 