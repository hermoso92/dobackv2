import { AuthResponse, LoginForm, RegisterForm, User } from '../types';
import { get, post } from './api';
import { logger } from '../utils/logger';

export const userService = {
  login: async (data: LoginForm): Promise<AuthResponse> => {
    try {
      return await post<AuthResponse>('/api/auth/login', data);
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  },

  register: async (data: RegisterForm): Promise<AuthResponse> => {
    try {
      return await post<AuthResponse>('/api/auth/register', data);
    } catch (error) {
      logger.error('Register error:', error);
      throw error;
    }
  },

  me: async (): Promise<User> => {
    try {
      return await get<User>('/api/auth/me');
    } catch (error) {
      logger.error('Get current user error:', error);
      throw error;
    }
  },

  getAll: async (): Promise<User[]> => {
    try {
      return await get<User[]>('/users');
    } catch (error) {
      logger.error('Get all users error:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<User> => {
    try {
      return await get<User>(`/users/${id}`);
    } catch (error) {
      logger.error('Get user by id error:', error);
      throw error;
    }
  },

  create: async (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    try {
      return await post<User>('/users', data);
    } catch (error) {
      logger.error('Create user error:', error);
      throw error;
    }
  },

  update: async (id: number, data: Partial<User>): Promise<User> => {
    try {
      return await post<User>(`/users/${id}`, data);
    } catch (error) {
      logger.error('Update user error:', error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await post<void>(`/users/${id}/delete`);
    } catch (error) {
      logger.error('Delete user error:', error);
      throw error;
    }
  },
}; 